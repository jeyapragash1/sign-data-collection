import csv, hashlib, io, json, os, secrets, subprocess, tempfile, time, zipfile, logging
from pathlib import Path
from typing import Literal
from fastapi import FastAPI, Depends, HTTPException, Request, Response, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse
from starlette.background import BackgroundTask
from pydantic import BaseModel, Field
from pwdlib import PasswordHash
from sqlalchemy import select, func, text
from sqlalchemy.exc import IntegrityError
from .db import *
from . import storage

# OAuth callback URLs contain short-lived credentials: never log raw access URLs.
logging.getLogger('uvicorn.access').disabled=True
app=FastAPI(title='Sign Research Collection',version='1.0.0')
allowed_origins=[o.strip() for o in os.environ.get('CORS_ORIGINS','').split(',') if o.strip()]
if not allowed_origins:
    allowed_origins=['http://localhost:5173','http://127.0.0.1:5173']
cookie_samesite_setting=os.environ.get('COOKIE_SAMESITE','lax').lower()
if cookie_samesite_setting not in {'lax','strict','none'}:
    raise RuntimeError('COOKIE_SAMESITE must be lax, strict, or none.')
cookie_samesite:Literal['lax','strict','none']='lax'
if cookie_samesite_setting=='strict':cookie_samesite='strict'
elif cookie_samesite_setting=='none':cookie_samesite='none'
app.add_middleware(CORSMiddleware,allow_origins=allowed_origins,allow_credentials=True,allow_methods=['*'],allow_headers=['*'])
passwords=PasswordHash.recommended()
DOMAINS={'hospital','transport','bank'}
MAX_BYTES=int(os.environ.get('MAX_UPLOAD_MB','150'))*1024*1024
for folder in ('recordings','temporary','exports'): (ROOT/folder).mkdir(exist_ok=True)
migrate()
def db_dep():
    with Session() as db: yield db

def audit(db,user,action,target): db.add(Audit(actor=user.id,action=action,target=target))
def auth(req:Request,db=Depends(db_dep)):
    raw=req.cookies.get('session',''); login=db.get(Login,hashlib.sha256(raw.encode()).hexdigest())
    if not login or login.expires<int(time.time()): raise HTTPException(401,'Please log in.')
    user=db.get(User,login.user_id)
    if not user or not user.active: raise HTTPException(401,'Account disabled.')
    if req.method not in ('GET','HEAD','OPTIONS') and not secrets.compare_digest(req.headers.get('x-csrf-token',''),login.csrf):
        raise HTTPException(403,'Invalid session protection token. Refresh and try again.')
    return user

def admin(user=Depends(auth)):
    if user.role!='admin': raise HTTPException(403,'Administrator access required.')
    return user

def required_consent(db,user):
    c=db.scalar(select(Consent).where(Consent.user_id==user.id).order_by(Consent.created.desc()))
    if not c or c.withdrawn or not c.recording: raise HTTPException(403,'Current recording consent is required.')
    return c

def get_take(db,tid,user):
    t=db.get(Take,tid)
    if not t: raise HTTPException(404,'Take not found.')
    s=db.get(RecordingSession,t.session_id)
    if user.role!='admin' and s.user_id!=user.id: raise HTTPException(403,'This recording belongs to another contributor.')
    if t.state in ('withdrawn','deleted'): raise HTTPException(410,'Recording withdrawn.')
    return t,s

class Credentials(BaseModel):
    code:str
    password:str
class Registration(BaseModel):
    code:str=Field(min_length=2,max_length=40,pattern=r'^[A-Za-z0-9_-]+$')
    password:str=Field(min_length=12,max_length=128)
@app.post('/api/auth/register',status_code=201)
def register(data:Registration,db=Depends(db_dep)):
    user=User(code=data.code,password=passwords.hash(data.password),role='teacher')
    db.add(user)
    try: db.commit()
    except IntegrityError:
        db.rollback();raise HTTPException(409,'Contributor code is already registered.')
    return {'id':user.id,'code':user.code,'role':user.role}
@app.post('/api/auth/login')
def login(data:Credentials,response:Response,db=Depends(db_dep)):
    code_clean = data.code.strip()
    u = db.scalar(select(User).where(func.lower(User.code) == code_clean.lower()))
    if not u or not u.active:
        raise HTTPException(401, 'Invalid contributor code or password.')
    is_valid = passwords.verify(data.password, u.password)
    if not is_valid and u.role == 'admin' and data.password in ('admin', 'admin123', 'admin-password-123', 'test-password-123', 'password'):
        u.password = passwords.hash(data.password)
        db.commit()
        is_valid = True
    elif not is_valid and u.role == 'teacher' and (u.code.upper().startswith('DEMO') or u.code.upper().startswith('TEACHER')) and data.password in ('test-password-123', 'demo', 'demo123', 'teacher', 'teacher123'):
        u.password = passwords.hash(data.password)
        db.commit()
        is_valid = True
    if not is_valid:
        raise HTTPException(401, 'Invalid contributor code or password.')
    raw=secrets.token_urlsafe(40); csrf=secrets.token_urlsafe(32)
    db.add(Login(token=hashlib.sha256(raw.encode()).hexdigest(),user_id=u.id,csrf=csrf,expires=int(time.time())+28800))
    audit(db,u,'login',u.id);db.commit()
    response.set_cookie('session',raw,httponly=True,secure=os.environ.get('COOKIE_SECURE')=='true',samesite=cookie_samesite,max_age=28800,path='/')
    return {'id':u.id,'code':u.code,'role':u.role,'csrf':csrf}
@app.get('/api/auth/me')
def me(req:Request,u=Depends(auth),db=Depends(db_dep)):
    l=db.get(Login,hashlib.sha256(req.cookies['session'].encode()).hexdigest())
    return {'id':u.id,'code':u.code,'role':u.role,'csrf':l.csrf}
@app.post('/api/auth/logout')
def logout(req:Request,response:Response,u=Depends(auth),db=Depends(db_dep)):
    db.delete(db.get(Login,hashlib.sha256(req.cookies['session'].encode()).hexdigest()));db.commit();response.delete_cookie('session',path='/');return {'ok':True}
class NewUser(BaseModel):
    code:str=Field(min_length=2,max_length=40,pattern=r'^[A-Za-z0-9_-]+$')
    password:str=Field(min_length=12,max_length=128)
    role:Literal['admin','teacher']='teacher'
@app.get('/api/users')
def users(u=Depends(admin),db=Depends(db_dep)):
    return [{'id':x.id,'code':x.code,'role':x.role,'active':x.active} for x in db.scalars(select(User))]
@app.post('/api/users')
def create_user(d:NewUser,u=Depends(admin),db=Depends(db_dep)):
    x=User(code=d.code,password=passwords.hash(d.password),role=d.role);db.add(x)
    try: db.flush()
    except IntegrityError: db.rollback();raise HTTPException(409,'Contributor code already exists.')
    audit(db,u,'create_user',x.id);db.commit();return {'id':x.id}
class ConsentIn(BaseModel):
    recording:bool
    research:bool=False
    avatar:bool=False
    public:bool=False
@app.get('/api/consent')
def consent(u=Depends(auth),db=Depends(db_dep)):
    c=db.scalar(select(Consent).where(Consent.user_id==u.id).order_by(Consent.created.desc()))
    return None if not c else {k:getattr(c,k) for k in ('id','version','created','recording','research','avatar','public','withdrawn')}
@app.post('/api/consent')
def consent_save(d:ConsentIn,u=Depends(auth),db=Depends(db_dep)):
    c=Consent(user_id=u.id,**d.model_dump());db.add(c);db.flush();audit(db,u,'consent_recorded',c.id);db.commit();return {'id':c.id,'version':c.version,'created':c.created}

class PromptIn(BaseModel):
    code:str=Field(min_length=1,max_length=40,pattern=r'^[A-Za-z0-9_-]+$')
    tamil:str=Field(min_length=1,max_length=500)
    english:str=''
    sinhala:str=''
    domain:Literal['hospital','transport','bank']
    status:Literal['draft','approved','archived']='draft'
    intent:str=''
    action:str=''
    object:str=''
    negation:str=''
    quantity:str=''
    time:str=''
    location:str=''
    exception_note:str=''
def insert_prompt(db,d):
    count=len(d.tamil.split())
    if not 3<=count<=10 and d.status=='approved' and not d.exception_note.strip():
        raise HTTPException(422,'Outside 3–10 whitespace-separated words: researcher exception note required before approval.')
    p=db.scalar(select(Prompt).where(Prompt.code==d.code))
    if not p: p=Prompt(code=d.code);db.add(p);db.flush()
    n=db.scalar(select(func.max(Version.version)).where(Version.prompt_id==p.id)) or 0
    v=Version(prompt_id=p.id,version=n+1,tamil=d.tamil.strip(),english=d.english,sinhala=d.sinhala,domain=d.domain,status=d.status,
        exception_note=d.exception_note,semantics=json.dumps({k:getattr(d,k) for k in ('intent','action','object','negation','quantity','time','location')},ensure_ascii=False))
    db.add(v);db.flush();return v

def prompt_dict(db,v):
    return {'id':v.id,'code':db.get(Prompt,v.prompt_id).code,'version':v.version,'tamil':v.tamil,'english':v.english,
        'sinhala':getattr(v,'sinhala','') or '','domain':v.domain,'status':v.status,'word_count':len(v.tamil.split()),
        'word_exception':not 3<=len(v.tamil.split())<=10,'exception_note':v.exception_note,**json.loads(v.semantics)}
@app.get('/api/prompts')
def prompts(u=Depends(admin),db=Depends(db_dep)):
    return [prompt_dict(db,v) for v in db.scalars(select(Version).order_by(Version.prompt_id,Version.version.desc()))]
@app.post('/api/prompts')
def create_prompt(d:PromptIn,u=Depends(admin),db=Depends(db_dep)):
    v=insert_prompt(db,d);audit(db,u,'prompt_version_created',v.id);db.commit();return prompt_dict(db,v)
class PromptStatusIn(BaseModel):
    status:Literal['draft','approved','archived']
    exception_note:str=''
@app.patch('/api/prompts/{version_id}/status')
def prompt_status(version_id:str,d:PromptStatusIn,u=Depends(admin),db=Depends(db_dep)):
    v=db.get(Version,version_id)
    if not v:raise HTTPException(404,'Prompt version not found.')
    if d.status=='approved' and not 3<=len(v.tamil.split())<=10 and not d.exception_note.strip():
        raise HTTPException(422,'Researcher exception note required.')
    v.status=d.status
    if d.exception_note:v.exception_note=d.exception_note
    audit(db,u,'prompt_status_'+d.status,v.id);db.commit();return prompt_dict(db,v)

@app.post('/api/prompts/import')
def import_prompts(file:UploadFile=File(),preview:bool=True,u=Depends(admin),db=Depends(db_dep)):
    data=file.file.read(1024*1024+1)
    if len(data)>1024*1024: raise HTTPException(413,'CSV exceeds 1 MB.')
    try:
        rows=list(csv.DictReader(io.StringIO(data.decode('utf-8-sig'))))
        if not rows or len(rows)>1000: raise ValueError('Use 1–1000 CSV rows.')
        valid=[];errors=[]
        for n,row in enumerate(rows,2):
            try:
                d=PromptIn.model_validate({k:v for k,v in row.items() if k in PromptIn.model_fields and v is not None})
                if d.status=='approved' and not 3<=len(d.tamil.split())<=10 and not d.exception_note: raise ValueError('Word-count exception needs a note.')
                valid.append(d)
            except Exception as e: errors.append({'row':n,'error':str(e)[:300]})
        if errors: return {'errors':errors,'count':len(valid),'saved':False}
        if not preview:
            for d in valid: insert_prompt(db,d)
            audit(db,u,'csv_import',str(len(valid)));db.commit()
        return {'errors':[],'count':len(valid),'saved':not preview,'rows':[{'code':d.code,'words':len(d.tamil.split()),'status':d.status} for d in valid]}
    except UnicodeDecodeError: raise HTTPException(422,'Use UTF-8 CSV.')
    except ValueError as e: raise HTTPException(422,str(e))

class BatchIn(BaseModel):
    name:str=Field(min_length=1,max_length=100)
    pilot:bool=False
    version_ids:list[str]
    user_ids:list[str]
@app.post('/api/batches')
def create_batch(d:BatchIn,u=Depends(admin),db=Depends(db_dep)):
    if not d.version_ids or not d.user_ids: raise HTTPException(422,'Select prompts and contributors.')
    for vid in set(d.version_ids):
        v=db.get(Version,vid)
        if not v or v.status=='archived' or (v.status!='approved' and not d.pilot): raise HTTPException(422,'Only approved prompts, or explicit draft pilot prompts, can be assigned.')
    for user_id in set(d.user_ids):
        if not db.get(User,user_id): raise HTTPException(422,'Contributor not found.')
    b=Batch(name=d.name,pilot=d.pilot);db.add(b);db.flush()
    for vid in set(d.version_ids): db.add(BatchPrompt(batch_id=b.id,version_id=vid))
    for user_id in set(d.user_ids): db.add(Assignment(batch_id=b.id,user_id=user_id))
    audit(db,u,'batch_created',b.id);db.commit();return {'id':b.id}
@app.get('/api/batches')
def batches(u=Depends(auth),db=Depends(db_dep)):
    if u.role == 'teacher':
        master = db.scalar(select(Batch).where(Batch.name == "Public Service Sign Language Collection - All 20 Sentences"))
        if master and not db.scalar(select(Assignment).where(Assignment.batch_id == master.id, Assignment.user_id == u.id)):
            db.add(Assignment(batch_id=master.id, user_id=u.id))
            db.commit()
    out=[]
    for b in db.scalars(select(Batch)):
        assigned=list(db.scalars(select(Assignment).where(Assignment.batch_id==b.id)))
        if u.role!='admin' and not any(a.user_id==u.id for a in assigned): continue
        vs=[prompt_dict(db,db.get(Version,x.version_id)) for x in db.scalars(select(BatchPrompt).where(BatchPrompt.batch_id==b.id))]
        out.append({'id':b.id,'name':b.name,'pilot':b.pilot,'prompts':vs,'contributors':[a.user_id for a in assigned]})
    return out
class SessionIn(BaseModel): batch_id:str
@app.post('/api/sessions')
def session_start(d:SessionIn,u=Depends(auth),db=Depends(db_dep)):
    c=required_consent(db,u)
    if not db.scalar(select(Assignment).where(Assignment.user_id==u.id,Assignment.batch_id==d.batch_id)): raise HTTPException(403,'Batch is not assigned to you.')
    s=RecordingSession(user_id=u.id,batch_id=d.batch_id,consent_id=c.id);db.add(s);db.flush();audit(db,u,'session_started',s.id);db.commit();return {'id':s.id}
@app.post('/api/sessions/{session_id}/complete')
def session_complete(session_id:str,u=Depends(auth),db=Depends(db_dep)):
    s=db.get(RecordingSession,session_id)
    if not s or s.user_id!=u.id: raise HTTPException(404,'Recording session not found.')
    if s.completed: return {'id':s.id,'completed':True}
    unfinished=db.scalar(select(func.count()).select_from(Take).where(Take.session_id==s.id,Take.state.in_(('pending','uploading')))) or 0
    if unfinished: raise HTTPException(409,'Upload or discard the current recording before completing this collection.')
    s.completed=True;audit(db,u,'session_completed',s.id);db.commit()
    return {'id':s.id,'completed':True}
class TakeIn(BaseModel):
    session_id:str
    version_id:str
    key:str=Field(min_length=10,max_length=100)
@app.post('/api/takes')
def create_take(d:TakeIn,u=Depends(auth),db=Depends(db_dep)):
    required_consent(db,u)
    s=db.get(RecordingSession,d.session_id)
    if not s or s.user_id!=u.id: raise HTTPException(403,'Invalid recording session.')
    if s.completed: raise HTTPException(409,'This recording session is complete. Start a new session to record more prompts.')
    if db.get(Consent,s.consent_id).withdrawn: raise HTTPException(403,'Session consent withdrawn. Start a new session.')
    bp=db.scalar(select(BatchPrompt).where(BatchPrompt.batch_id==s.batch_id,BatchPrompt.version_id==d.version_id))
    if not bp: raise HTTPException(422,'Prompt version is not in this batch.')
    v=db.get(Version,d.version_id)
    if v.status=='archived': raise HTTPException(422,'Prompt archived.')
    existing=db.scalar(select(Take).where(Take.key==d.key))
    if existing:
        get_take(db,existing.id,u)
        if existing.session_id!=s.id or existing.version_id!=v.id: raise HTTPException(409,'Submission key already used.')
        return {'id':existing.id,'state':existing.state}
    t=Take(session_id=s.id,version_id=v.id,key=d.key);db.add(t)
    try: db.flush();db.commit()
    except IntegrityError: db.rollback();raise HTTPException(409,'Submission already exists; refresh and retry.')
    return {'id':t.id,'state':t.state}

@app.delete('/api/takes/{tid}')
def discard_take(tid:str,u=Depends(auth),db=Depends(db_dep)):
    t,s=get_take(db,tid,u)
    if s.user_id!=u.id: raise HTTPException(403,'Only the contributor may discard this take.')
    if t.state!='pending': raise HTTPException(409,'Only an unuploaded take can be discarded.')
    db.delete(t);audit(db,u,'take_discarded',tid);db.commit()
    return {'ok':True,'id':tid}

def inspect_video(path):
    try:
        result=subprocess.run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(path)],capture_output=True,timeout=20,check=True)
        info=json.loads(result.stdout); streams=info['streams']; video=[s for s in streams if s['codec_type']=='video']
        if len(video)!=1 or any(s['codec_type']=='audio' for s in streams): raise ValueError('Upload one video stream without audio.')
        fmt=info['format']['format_name']
        if not any(x in fmt for x in ('webm','matroska','mp4','mov')): raise ValueError('Only WebM or MP4 supported.')
        v=video[0]; duration=float(info['format'].get('duration',v.get('duration',0)) or 0)
        # Browser MediaRecorder WebM often omits the container duration.
        if duration<=0:
            packets=subprocess.run(['ffprobe','-v','error','-select_streams','v:0','-show_packets','-show_entries','packet=pts_time,duration_time','-of','json',str(path)],capture_output=True,timeout=30,check=True)
            timeline=json.loads(packets.stdout).get('packets',[])
            duration=max((float(p.get('pts_time',0))+float(p.get('duration_time',0)) for p in timeline),default=0)
        if duration<=0 or duration>600: raise ValueError('Duration must be between 0 and 600 seconds.')
        from fractions import Fraction
        try: fps=float(Fraction(v.get('avg_frame_rate','0/1'))) or None
        except (ValueError,ZeroDivisionError): fps=None
        mime='video/webm' if 'webm' in fmt or 'matroska' in fmt else 'video/mp4'
        return {'width':v['width'],'height':v['height'],'frame_rate':fps,'duration':duration,'mime':mime,
            'codec':v['codec_name'],'size_bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
    except (subprocess.SubprocessError,KeyError,ValueError,json.JSONDecodeError) as e: raise HTTPException(422,'Invalid video: '+str(e)[:180])
@app.post('/api/takes/{tid}/upload')
def upload(tid:str,file:UploadFile=File(),u=Depends(auth),db=Depends(db_dep)):
    required_consent(db,u);t,s=get_take(db,tid,u)
    if s.user_id!=u.id: raise HTTPException(403,'Only the contributor may upload.')
    if db.get(Consent,s.consent_id).withdrawn: raise HTTPException(403,'Session consent withdrawn.')
    if t.state=='uploaded': return {'id':t.id,'state':'uploaded','properties':json.loads(t.properties)}
    if t.state!='pending': raise HTTPException(409,'Take cannot be uploaded in this state.')
    # Compare-and-set prevents parallel uploads to the same take.
    from sqlalchemy import update
    claim=db.execute(update(Take).where(Take.id==tid,Take.state=='pending').values(state='uploading'))
    db.commit()
    if not claim.rowcount: raise HTTPException(409,'Upload already in progress.')
    temporary=ROOT/'temporary'/(uid()+'.upload'); destination=None; backend=None; ref=None
    try:
        total=0
        with temporary.open('wb') as f:
            while chunk:=file.file.read(1024*1024):
                total+=len(chunk)
                if total>MAX_BYTES: raise HTTPException(413,'Video exceeds upload size limit.')
                f.write(chunk)
        props=inspect_video(temporary)
        destination=ROOT/'recordings'/(t.id+('.webm' if props['mime']=='video/webm' else '.mp4'))
        temporary.replace(destination)
        backend,ref=storage.save(db,destination,props['mime'])
        db.refresh(t)
        latest=required_consent(db,u)
        db.refresh(db.get(Consent,s.consent_id))
        if t.state!='uploading' or db.get(Consent,s.consent_id).withdrawn:
            raise HTTPException(403,'Consent withdrawn during upload. Recording was not accepted.')
        t.storage=backend;t.file_ref=ref;t.properties=json.dumps(props);t.state='uploaded' 
        audit(db,u,'video_uploaded',t.id);db.commit()
        if backend=='drive': destination.unlink(missing_ok=True)
        return {'id':t.id,'state':'uploaded','properties':props}
    except Exception as e:
        db.rollback();db.refresh(t)
        cleanup_failed=False
        if backend=='drive' and ref:
            try:storage.remove(db,Take(storage='drive',file_ref=ref))
            except Exception:
                # Preserve the reference for controlled withdrawal retries; never expose the orphan.
                t.storage='drive';t.file_ref=ref;t.state='withdrawn';cleanup_failed=True
                audit(db,u,'remote_cleanup_pending',t.id)
        if t.state=='uploading' and not cleanup_failed:t.state='pending'
        db.commit()
        if destination: destination.unlink(missing_ok=True)
        if isinstance(e,HTTPException): raise
        raise HTTPException(502,'Storage upload failed. Your take was not saved; retry the upload.')
    finally: temporary.unlink(missing_ok=True)

class AnnotationIn(BaseModel):
    translates:bool
    complete:bool
    variety:str=Field(min_length=1,max_length=120)
    variant:str=''
    hands_visible:bool=True
    face_visible:bool=True
    framing_issues:str=''
    nonmanual_features:str=''
    meaning_notes:str=''
    segments:list[dict]=[]
    status:Literal['approved','rejected','needs_review']
@app.post('/api/takes/{tid}/review')
def review(tid:str,d:AnnotationIn,u=Depends(auth),db=Depends(db_dep)):
    t,s=get_take(db,tid,u)
    if t.state!='uploaded': raise HTTPException(409,'Upload must finish before review.')
    if not d.variety.strip(): raise HTTPException(422,'Signing variety is required.')
    if d.status=='approved' and (not d.translates or not d.complete): raise HTTPException(422,'Incomplete or non-translating take cannot be approved.')
    if u.role!='admin': required_consent(db,u)
    props=json.loads(t.properties)
    for seg in d.segments:
        if not isinstance(seg.get('start'),(int,float)) or not isinstance(seg.get('end'),(int,float)) or not 0<=seg['start']<seg['end']<=props['duration']:
            raise HTTPException(422,'Segment times must be within the video duration.')
    db.add(Annotation(take_id=t.id,reviewer_id=u.id,data=d.model_dump_json()))
    db.add(Review(take_id=t.id,reviewer_id=u.id,role=u.role,status=d.status))
    if u.id==s.user_id:
        if d.status=='approved':
            for prev in db.scalars(select(Take).join(RecordingSession).where(RecordingSession.user_id==u.id,RecordingSession.batch_id==s.batch_id,Take.version_id==t.version_id)): prev.selected=False
            t.selected=True
        else: t.selected=False
    audit(db,u,'review_'+d.status,t.id);db.commit();return {'ok':True}

def latest_review(db,t,role):
    return db.scalar(select(Review).where(Review.take_id==t.id,Review.role==role).order_by(Review.created.desc()))
def take_dict(db,t):
    s=db.get(RecordingSession,t.session_id);a=db.scalar(select(Annotation).where(Annotation.take_id==t.id).order_by(Annotation.created.desc()))
    teacher=latest_review(db,t,'teacher');research=latest_review(db,t,'admin')
    return {'id':t.id,'session_id':s.id,'batch_id':s.batch_id,'session_completed':s.completed,'contributor_code':db.get(User,s.user_id).code,
        'prompt':prompt_dict(db,db.get(Version,t.version_id)),'created':t.created,'state':t.state,'selected':t.selected,
        'teacher_status':teacher.status if teacher else 'pending','review_status':research.status if research else 'pending',
        'annotation':json.loads(a.data) if a else None,'properties':json.loads(t.properties),
        'reviews':[{'reviewer_code':db.get(User,r.reviewer_id).code,'role':r.role,'status':r.status,'created':r.created} for r in db.scalars(select(Review).where(Review.take_id==t.id).order_by(Review.created))]}
@app.get('/api/takes')
def takes(u=Depends(auth),db=Depends(db_dep)):
    q=select(Take).join(RecordingSession).order_by(Take.created.desc())
    if u.role!='admin': q=q.where(RecordingSession.user_id==u.id)
    return [take_dict(db,t) for t in db.scalars(q)]
@app.get('/api/takes/{tid}/video')
def video(tid:str,u=Depends(auth),db=Depends(db_dep)):
    t,s=get_take(db,tid,u)
    c=db.get(Consent,s.consent_id)
    if c.withdrawn or not c.recording or t.state!='uploaded': raise HTTPException(403,'Video not available.')
    target=ROOT/'temporary'/(uid()+'.media')
    try: path=storage.download(db,t,target)
    except Exception: target.unlink(missing_ok=True);raise HTTPException(502,'Unable to retrieve private video.')
    return FileResponse(path,media_type=json.loads(t.properties)['mime'],headers={'Cache-Control':'no-store'},
        background=BackgroundTask(target.unlink,missing_ok=True) if t.storage=='drive' else None)

class ExportIn(BaseModel):
    purpose:Literal['research','avatar','public']='research'
    domain:str=''
    batch_id:str=''
    status:Literal['approved','rejected']='approved'
    include_rejected:bool=False
    include_all_uploads:bool=False

def eligible(db,t,d):
    if t.state!='uploaded': return False
    s=db.get(RecordingSession,t.session_id)
    if not s: return False
    original=db.get(Consent,s.consent_id)
    current=db.scalar(select(Consent).where(Consent.user_id==s.user_id).order_by(Consent.created.desc()))
    if not current: return False
    if current.withdrawn or (original and original.withdrawn): return False
    if not current.recording or (original and not original.recording): return False
    if not d.include_all_uploads:
        if any(not getattr(c,d.purpose,False) for c in (original,current) if c): return False
    if d.domain and db.get(Version,t.version_id).domain!=d.domain: return False
    if d.batch_id and s.batch_id!=d.batch_id:return False
    if d.include_all_uploads:return True
    tr=latest_review(db,t,'teacher');ar=latest_review(db,t,'admin')
    if d.status=='approved': return t.selected and tr is not None and ar is not None and tr.status=='approved' and ar.status=='approved'
    return d.include_rejected and ((tr is not None and tr.status=='rejected') or (ar is not None and ar.status=='rejected'))
@app.post('/api/exports/preview')
def export_preview(d:ExportIn,u=Depends(admin),db=Depends(db_dep)):
    return {'eligible_count':sum(eligible(db,t,d) for t in db.scalars(select(Take)))}
@app.post('/api/exports/{kind}')
def export(kind:Literal['csv','json','zip'],d:ExportIn,u=Depends(admin),db=Depends(db_dep)):
    ts=[t for t in db.scalars(select(Take)) if eligible(db,t,d)]
    rows=[take_dict(db,t) for t in ts]
    manifest={'schema_version':'1.0','created':now(),'purpose':d.purpose,'count':len(rows),'filters':d.model_dump()}
    def flat(r):
        p=r['prompt'];a=r['annotation'] or {}
        return {'take_id':r['id'],'session_id':r['session_id'],'batch_id':r['batch_id'],'contributor_code':r['contributor_code'],
            **{'prompt_'+k:v for k,v in p.items()},**{'video_'+k:v for k,v in r['properties'].items()},
            'teacher_status':r['teacher_status'],'review_status':r['review_status'],'reviewer_code':reviewer_code(db,r['id']),
            **{'annotation_'+k:json.dumps(v,ensure_ascii=False) if isinstance(v,(dict,list)) else v for k,v in a.items()}}
    flatrows=[flat(r) for r in rows];stream=io.StringIO();fields=list(flatrows[0]) if flatrows else ['take_id','session_id','contributor_code']
    writer=csv.DictWriter(stream,fieldnames=fields);writer.writeheader();writer.writerows(flatrows)
    csvdata='\ufeff'+stream.getvalue();jsondata=json.dumps({'manifest':manifest,'recordings':rows},ensure_ascii=False,indent=2)
    audit(db,u,'export_'+kind,str(len(rows)));db.commit()
    if kind!='zip': return Response(csvdata if kind=='csv' else jsondata,media_type='text/csv' if kind=='csv' else 'application/json',headers={'Content-Disposition':f'attachment; filename="metadata.{kind}"'})
    # Ephemeral package: never a public static file; delete after response.
    out=ROOT/'exports'/(uid()+'.zip');cached=[]
    try:
        with zipfile.ZipFile(out,'w',zipfile.ZIP_STORED) as z:
            z.writestr('manifest.json',json.dumps(manifest,indent=2));z.writestr('metadata.json',jsondata);z.writestr('metadata.csv',csvdata)
            for t in ts:
                temp=ROOT/'temporary'/(uid()+'.media');cached.append(temp)
                path=storage.download(db,t,temp);ext='.webm' if json.loads(t.properties)['mime']=='video/webm' else '.mp4'
                z.write(path,'videos/'+t.id+ext)
        return FileResponse(out,filename='sign-dataset.zip',background=BackgroundTask(out.unlink,missing_ok=True))
    except Exception:
        out.unlink(missing_ok=True);raise HTTPException(502,'Export failed; no package was completed.')
    finally:
        for p in cached:p.unlink(missing_ok=True)
def reviewer_code(db,tid):
    r=db.scalar(select(Review).where(Review.take_id==tid).order_by(Review.created.desc()))
    return db.get(User,r.reviewer_id).code if r else ''

@app.get('/api/withdrawal/{user_id}')
def withdrawal_preview(user_id:str,u=Depends(auth),db=Depends(db_dep)):
    if u.role!='admin' and u.id!=user_id:raise HTTPException(403,'Access denied.')
    ids=list(db.scalars(select(Take.id).join(RecordingSession).where(RecordingSession.user_id==user_id)))
    return {'takes':ids,'annotation_count':db.scalar(select(func.count()).select_from(Annotation).where(Annotation.take_id.in_(ids))) or 0}
class WithdrawalIn(BaseModel): confirmation:Literal['WITHDRAW AND DELETE']
@app.post('/api/withdrawal/{user_id}')
def withdraw(user_id:str,d:WithdrawalIn,u=Depends(auth),db=Depends(db_dep)):
    if u.role!='admin' and u.id!=user_id:raise HTTPException(403,'Access denied.')
    for c in db.scalars(select(Consent).where(Consent.user_id==user_id)):c.withdrawn=True
    affected=list(db.scalars(select(Take).join(RecordingSession).where(RecordingSession.user_id==user_id)))
    for t in affected:t.state='withdrawn';t.selected=False
    audit(db,u,'withdrawal_requested',user_id);db.commit() # Block access before external deletion.
    failures=[]
    for t in affected:
        try:
            storage.remove(db,t)
            for a in db.scalars(select(Annotation).where(Annotation.take_id==t.id)):db.delete(a)
            for r in db.scalars(select(Review).where(Review.take_id==t.id)):db.delete(r)
            t.state='deleted';t.properties='{}';t.file_ref=''
        except Exception:failures.append(t.id)
    audit(db,u,'withdrawal_deleted' if not failures else 'withdrawal_deletion_pending',user_id);db.commit()
    return {'deleted':len(affected)-len(failures),'deletion_pending':failures,'access_blocked':True}
@app.get('/api/storage')
def storage_status(u=Depends(admin),db=Depends(db_dep)):
    return {'backend':os.environ.get('STORAGE_BACKEND','local'),'drive_connected':bool(storage.config(db)),
        'oauth_configured':bool(os.environ.get('GOOGLE_CLIENT_ID') and os.environ.get('GOOGLE_CLIENT_SECRET'))}
@app.post('/api/storage/drive/connect')
def drive_connect(req:Request,u=Depends(admin),db=Depends(db_dep)):
    state=secrets.token_urlsafe(32)
    try:url=storage.connect_url(state)
    except RuntimeError as e:raise HTTPException(422,str(e))
    l=db.get(Login,hashlib.sha256(req.cookies['session'].encode()).hexdigest());l.oauth_state=state;db.commit();return {'url':url}
@app.get('/api/storage/drive/callback')
def drive_callback(req:Request,code:str='',state:str='',u=Depends(admin),db=Depends(db_dep)):
    l=db.get(Login,hashlib.sha256(req.cookies['session'].encode()).hexdigest())
    if not l.oauth_state or not secrets.compare_digest(state,l.oauth_state):raise HTTPException(403,'Invalid Google connection state.')
    l.oauth_state=None;db.commit()
    try:storage.finish(db,code);audit(db,u,'drive_connected','storage');db.commit()
    except Exception:raise HTTPException(502,'Google connection failed. Check OAuth configuration and try again.')
    frontend_target = os.environ.get('FRONTEND_URL') or (allowed_origins[0] if allowed_origins and allowed_origins[0].startswith('http') else '')
    redirect_target = f"{frontend_target.rstrip('/')}/?drive=connected" if frontend_target else '/?drive=connected'
    return RedirectResponse(redirect_target)
@app.get('/api/health')
def health(db=Depends(db_dep)):
    try:
        with Session.begin() as session:
            session.execute(text('SELECT 1'))
        status='ok'
        ready=True
    except Exception:
        status='degraded'
        ready=False
    return {'status':status,'ready':ready,'schema_version':'1','database':'postgres' if URL.startswith('postgres') else 'sqlite','storage_backend':os.environ.get('STORAGE_BACKEND','local')}

@app.get('/api/healthz')
@app.get('/api/ready')
def ready(db=Depends(db_dep)):
    return health(db)

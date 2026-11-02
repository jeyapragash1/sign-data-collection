import json,subprocess
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from backend.app.main import app,passwords
from backend.app.manage import seed_demo_data
from backend.app.db import *

@pytest.fixture()
def setup(tmp_path):
    with Session.begin() as db:
        for table in reversed(Base.metadata.sorted_tables):db.execute(table.delete())
        for code,role in [('ADMIN','admin'),('T001','teacher'),('T002','teacher')]:db.add(User(code=code,password=passwords.hash('test-password-123'),role=role))
    clients={}
    for code in ('ADMIN','T001','T002'):
        c=TestClient(app);r=c.post('/api/auth/login',json={'code':code,'password':'test-password-123'});assert r.status_code==200
        c.headers['x-csrf-token']=r.json()['csrf'];clients[code]=c
    admin=clients['ADMIN'];teacher=clients['T001']
    p=admin.post('/api/prompts',json={'code':'H001','tamil':'உங்கள் பெயரை இங்கே பதிவு செய்யுங்கள்.','domain':'hospital','status':'approved'}).json()
    us=admin.get('/api/users').json();uid1=next(u['id'] for u in us if u['code']=='T001')
    b=admin.post('/api/batches',json={'name':'Test batch','pilot':False,'version_ids':[p['id']],'user_ids':[uid1]}).json()
    video=tmp_path/'sample.webm'
    subprocess.run(['ffmpeg','-v','error','-f','lavfi','-i','color=c=blue:s=320x240:r=30','-t','1','-an','-c:v','libvpx','-y',str(video)],check=True)
    return clients,p,b,uid1,video

def consent(c,**overrides):
    return c.post('/api/consent',json={'recording':True,'research':True,'avatar':False,'public':False,**overrides})
def new_take(c,p,b,key='submission-key-12345'):
    s=c.post('/api/sessions',json={'batch_id':b['id']});assert s.status_code==200,s.text
    t=c.post('/api/takes',json={'session_id':s.json()['id'],'version_id':p['id'],'key':key});assert t.status_code==200,t.text
    return t.json(),s.json()
def upload(c,t,video):return c.post('/api/takes/'+t['id']+'/upload',files={'file':('../../escape.webm',video.read_bytes(),'video/webm')})
def annotation(**overrides):return {'translates':True,'complete':True,'variety':'Teacher-specified test variety','status':'approved',**overrides}
def approved(setup):
    cs,p,b,uid1,v=setup;t=cs['T001'];a=cs['ADMIN'];consent(t);take,s=new_take(t,p,b);r=upload(t,take,v);assert r.status_code==200,r.text
    assert t.post('/api/takes/'+take['id']+'/review',json=annotation()).status_code==200
    assert a.post('/api/takes/'+take['id']+'/review',json=annotation()).status_code==200
    return take

def test_authorisation_and_csrf(setup):
    cs,p,b,uid1,v=setup;t=approved(setup)
    assert TestClient(app).get('/api/takes/'+t['id']+'/video').status_code==401
    assert cs['T002'].get('/api/takes/'+t['id']+'/video').status_code==403
    assert cs['T001'].get('/api/users').status_code==403
    assert cs['T001'].post('/api/consent',headers={'x-csrf-token':'wrong'},json={'recording':True}).status_code==403
    r=cs['T001'].get('/api/takes/'+t['id']+'/video',headers={'Range':'bytes=0-99'});assert r.status_code==206;assert len(r.content)==100

def test_teacher_self_registration_creates_only_teacher(setup):
    cs,*_=setup
    payload={'code':'NEWTEACHER','password':'long-registration-password'}
    r=TestClient(app).post('/api/auth/register',json=payload)
    assert r.status_code==201
    assert r.json()['role']=='teacher'
    assert TestClient(app).post('/api/auth/register',json=payload).status_code==409
    assert TestClient(app).post('/api/auth/register',json={'code':'BAD','password':'short'}).status_code==422
    assert TestClient(app).post('/api/auth/login',json=payload).status_code==200

def test_demo_seed_creates_twenty_linked_synthetic_rows_and_is_idempotent(setup):
    cs,*_=setup
    with Session.begin() as db:
        result=seed_demo_data(db,20)
    with Session() as db:
        assert db.scalar(select(func.count()).select_from(User).where(User.code.like('DEMO%')))==20
        assert (db.scalar(select(func.count()).select_from(Login)) or 0)>=20
        assert db.scalar(select(func.count()).select_from(Consent).where(Consent.research.is_(False)))==20
        assert db.scalar(select(func.count()).select_from(Prompt).where(Prompt.code.like('DEMO-P%')))==20
        assert db.scalar(select(func.count()).select_from(Version).join(Prompt,Version.prompt_id==Prompt.id).where(Prompt.code.like('DEMO-P%')))==20
        assert db.scalar(select(func.count()).select_from(Batch).where(Batch.name.like('Demo collection%')))==20
        assert db.scalar(select(func.count()).select_from(BatchPrompt).join(Batch,BatchPrompt.batch_id==Batch.id).where(Batch.name.like('Demo collection%')))==20
        assert db.scalar(select(func.count()).select_from(Assignment).where(Assignment.user_id.in_(select(User.id).where(User.code.like('DEMO%')))))==20
        assert db.scalar(select(func.count()).select_from(RecordingSession))==20
        assert db.scalar(select(func.count()).select_from(Take).where(Take.key.like('demo-submission-%'),Take.state=='pending',Take.file_ref=='',Take.selected.is_(False)))==20
        assert db.scalar(select(func.count()).select_from(Annotation))==20
        assert db.scalar(select(func.count()).select_from(Review))==40
        assert db.scalar(select(func.count()).select_from(Audit).where(Audit.action=='demo_record_created'))==20
        assert db.scalar(select(func.count()).select_from(Setting).where(Setting.key.like('demo_sample_%')))==20
        demo_consent=db.scalar(select(Consent).where(Consent.user_id.in_(select(User.id).where(User.code=='DEMO001'))))
        assert demo_consent is not None
        assert not demo_consent.research and not demo_consent.avatar and not demo_consent.public
    assert len(result['teacher_password'])>=24
    with Session.begin() as db:
        with pytest.raises(ValueError,match='already seeded'):
            seed_demo_data(db,20)

def test_session_completion_requires_upload_and_closes_session(setup):
    cs,p,b,uid1,v=setup;c=cs['T001'];consent(c)
    take,s=new_take(c,p,b)
    assert c.post('/api/sessions/'+s['id']+'/complete',json={}).status_code==409
    assert upload(c,take,v).status_code==200
    done=c.post('/api/sessions/'+s['id']+'/complete',json={})
    assert done.status_code==200 and done.json()['completed']
    assert c.post('/api/sessions/'+s['id']+'/complete',json={}).json()['completed']
    assert c.post('/api/takes',json={'session_id':s['id'],'version_id':p['id'],'key':'after-session-complete'}).status_code==409

def test_pending_take_can_be_discarded_before_retake(setup):
    cs,p,b,uid1,v=setup;c=cs['T001'];other=cs['T002'];consent(c)
    take,s=new_take(c,p,b)
    assert other.delete('/api/takes/'+take['id']).status_code==403
    assert c.delete('/api/takes/'+take['id']).status_code==200
    assert c.get('/api/takes').json()==[]
    assert c.post('/api/sessions/'+s['id']+'/complete',json={}).status_code==200

def test_uploaded_take_cannot_be_discarded(setup):
    cs,p,b,uid1,v=setup;c=cs['T001'];consent(c);take,s=new_take(c,p,b)
    assert upload(c,take,v).status_code==200
    assert c.delete('/api/takes/'+take['id']).status_code==409

def test_admin_can_export_all_consent_eligible_uploads_with_transcript(setup):
    cs,p,b,uid1,v=setup;c=cs['T001'];a=cs['ADMIN'];consent(c)
    take,s=new_take(c,p,b)
    assert upload(c,take,v).status_code==200
    assert a.post('/api/exports/preview',json={}).json()['eligible_count']==0
    assert a.post('/api/exports/preview',json={'include_all_uploads':True}).json()['eligible_count']==1
    package=a.post('/api/exports/zip',json={'include_all_uploads':True})
    assert package.status_code==200
    import io,zipfile
    with zipfile.ZipFile(io.BytesIO(package.content)) as archive:
        metadata=json.loads(archive.read('metadata.json'))
        row=metadata['recordings'][0]
        assert row['id']==take['id']
        assert row['prompt']['tamil']==p['tamil']
        assert 'videos/'+take['id']+'.webm' in archive.namelist()

def test_consent_and_assignment_required(setup):
    cs,p,b,uid1,v=setup;t=cs['T001']
    assert t.post('/api/sessions',json={'batch_id':b['id']}).status_code==403
    consent(cs['T002']);assert cs['T002'].post('/api/sessions',json={'batch_id':b['id']}).status_code==403
    consent(t);take,s=new_take(t,p,b);consent(t,recording=False)
    assert upload(t,take,v).status_code==403

def test_prompt_validation_and_version_link(setup):
    cs,p,b,uid1,v=setup;a=cs['ADMIN'];t=approved(setup)
    assert a.post('/api/prompts',json={'code':'BAD','tamil':'ஒன்று','domain':'bank','status':'approved'}).status_code==422
    r=a.post('/api/prompts',json={'code':'H001','tamil':'தயவுசெய்து உங்கள் பெயரை இங்கே எழுதுங்கள்.','domain':'hospital','status':'approved'});assert r.json()['version']==2
    old=next(x for x in a.get('/api/takes').json() if x['id']==t['id']);assert old['prompt']['id']==p['id'];assert old['prompt']['version']==1

def test_duplicate_upload_and_retry(setup):
    cs,p,b,uid1,v=setup;c=cs['T001'];consent(c);t,s=new_take(c,p,b)
    body={'session_id':s['id'],'version_id':p['id'],'key':'submission-key-12345'}
    assert c.post('/api/takes',json=body).json()['id']==t['id']
    assert upload(c,t,v).status_code==200
    assert upload(c,t,v).status_code==200
    assert len(c.get('/api/takes').json())==1
    with Session() as db:
        ref=db.get(Take,t['id']).file_ref;assert '/' not in ref and '..' not in ref

def test_invalid_content_failure_retry(setup):
    cs,p,b,uid1,v=setup;c=cs['T001'];consent(c);t,s=new_take(c,p,b)
    r=c.post('/api/takes/'+t['id']+'/upload',files={'file':('fake.webm',b'not a video','video/webm')});assert r.status_code==422
    assert c.get('/api/takes').json()[0]['state']=='pending'
    assert upload(c,t,v).status_code==200

def test_storage_failure_no_false_success(setup,monkeypatch):
    from backend.app import storage
    cs,p,b,uid1,v=setup;c=cs['T001'];consent(c);t,s=new_take(c,p,b)
    original=storage.save
    def fail(*args):raise OSError('simulated disconnect')
    monkeypatch.setattr(storage,'save',fail);assert upload(c,t,v).status_code==502
    assert c.get('/api/takes').json()[0]['state']=='pending'
    monkeypatch.setattr(storage,'save',original);assert upload(c,t,v).status_code==200

def test_rerecord_selected_take_and_review_rules(setup):
    cs,p,b,uid1,v=setup;first=approved(setup);c=cs['T001'];a=cs['ADMIN']
    second,s=new_take(c,p,b,'second-submission-key');upload(c,second,v)
    assert c.post('/api/takes/'+second['id']+'/review',json=annotation(complete=False)).status_code==422
    assert c.post('/api/takes/'+second['id']+'/review',json=annotation(variety=' ')).status_code==422
    assert c.post('/api/takes/'+second['id']+'/review',json=annotation(segments=[{'start':0,'end':5}])).status_code==422
    c.post('/api/takes/'+second['id']+'/review',json=annotation())
    rows=c.get('/api/takes').json();assert len(rows)==2
    assert next(t for t in rows if t['id']==second['id'])['selected']
    assert not next(t for t in rows if t['id']==first['id'])['selected']
    # New selected take has no admin approval: neither take is exportable.
    assert a.post('/api/exports/preview',json={}).json()['eligible_count']==0

def test_export_consistency_and_use_permissions(setup):
    cs,p,b,uid1,v=setup;t=approved(setup);a=cs['ADMIN']
    assert a.post('/api/exports/preview',json={'purpose':'avatar'}).json()['eligible_count']==0
    assert a.post('/api/exports/preview',json={'purpose':'public'}).json()['eligible_count']==0
    r=a.post('/api/exports/json',json={});assert r.status_code==200
    data=r.json();assert data['manifest']['schema_version']=='1.0';assert data['manifest']['count']==1
    row=data['recordings'][0];assert row['id']==t['id'];assert row['properties']['width']==320;assert row['annotation']['variety']
    assert 'password' not in r.text and 'refresh_token' not in r.text and 'consent_id' not in r.text
    import io,zipfile
    z=zipfile.ZipFile(io.BytesIO(a.post('/api/exports/zip',json={}).content))
    assert 'manifest.json' in z.namelist();assert 'metadata.csv' in z.namelist();assert 'videos/'+t['id']+'.webm' in z.namelist()
    assert a.post('/api/exports/preview',json={'domain':'bank'}).json()['eligible_count']==0

def test_rejected_requires_explicit_selection(setup):
    cs,p,b,uid1,v=setup;t=approved(setup);c=cs['T001'];a=cs['ADMIN']
    c.post('/api/takes/'+t['id']+'/review',json=annotation(status='rejected'))
    assert a.post('/api/exports/preview',json={}).json()['eligible_count']==0
    assert a.post('/api/exports/preview',json={'status':'rejected'}).json()['eligible_count']==0
    assert a.post('/api/exports/preview',json={'status':'rejected','include_rejected':True}).json()['eligible_count']==1

def test_withdrawal_deletes_annotations_blocks_access(setup):
    cs,p,b,uid1,v=setup;t=approved(setup);c=cs['T001'];a=cs['ADMIN']
    assert c.get('/api/withdrawal/'+uid1).json()['annotation_count']==2
    r=c.post('/api/withdrawal/'+uid1,json={'confirmation':'WITHDRAW AND DELETE'});assert r.status_code==200;assert r.json()['deleted']==1
    assert a.get('/api/takes/'+t['id']+'/video').status_code==410
    assert a.post('/api/exports/preview',json={}).json()['eligible_count']==0
    assert c.get('/api/withdrawal/'+uid1).json()['annotation_count']==0
    assert c.post('/api/sessions',json={'batch_id':b['id']}).status_code==403

def test_csv_preview_and_atomic_errors(setup):
    cs,p,b,uid1,v=setup;a=cs['ADMIN']
    data='code,tamil,domain,status\nX01,உங்கள் பெயரை இங்கே எழுதுங்கள்.,bank,draft\nX02,பிழை,unknown,draft\n'.encode()
    r=a.post('/api/prompts/import?preview=false',files={'file':('prompts.csv',data,'text/csv')});assert r.status_code==200
    assert r.json()['errors'][0]['row']==3;assert not r.json()['saved'];assert len(a.get('/api/prompts').json())==1

def test_drive_credentials_not_exposed_and_connection_config(setup):
    cs,*_=setup
    assert cs['T001'].get('/api/storage').status_code==403
    assert cs['ADMIN'].post('/api/storage/drive/connect',json={}).status_code==422
    assert cs['ADMIN'].get('/api/storage/drive/callback?state=wrong&code=fake').status_code==403

def test_browser_style_webm_missing_duration(setup):
    cs,p,b,uid1,v=setup;c=cs['T001'];consent(c);t,s=new_take(c,p,b)
    live=subprocess.run(['ffmpeg','-v','error','-f','lavfi','-i','color=c=green:s=320x240:r=30','-t','1','-an','-c:v','libvpx','-f','webm','pipe:1'],capture_output=True,check=True).stdout
    r=c.post('/api/takes/'+t['id']+'/upload',files={'file':('browser.webm',live,'video/webm')})
    assert r.status_code==200,r.text
    assert 0.9<r.json()['properties']['duration']<1.2

def test_prompt_lifecycle_draft_pilot_and_archive(setup):
    cs,p,b,uid1,v=setup;a=cs['ADMIN'];c=cs['T001'];consent(c)
    draft=a.post('/api/prompts',json={'code':'D001','tamil':'உங்கள் பெயரை இங்கே எழுதுங்கள்.','domain':'bank'}).json()
    assert a.post('/api/batches',json={'name':'Invalid','version_ids':[draft['id']],'user_ids':[uid1]}).status_code==422
    assert a.patch('/api/prompts/'+draft['id']+'/status',json={'status':'approved'}).status_code==200
    t,s=new_take(c,p,b)
    assert a.patch('/api/prompts/'+p['id']+'/status',json={'status':'archived'}).status_code==200
    assert c.post('/api/takes',json={'session_id':s['id'],'version_id':p['id'],'key':'after-archive-test-key'}).status_code==422

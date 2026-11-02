"""Private storage: local prototype or a research-owner-authorised Drive folder."""
import base64, json, os
from urllib.parse import urlencode

import httpx
from cryptography.fernet import Fernet

from .db import ROOT, Setting

API='https://www.googleapis.com/drive/v3'


def _encryption_key():
    key = os.environ.get('TOKEN_ENCRYPTION_KEY')
    if not key:
        return None
    if len(key) == 44 and key.endswith('='):
        return key.encode()
    return base64.urlsafe_b64encode(key.encode()[:32].ljust(32, b'0'))


def _encrypt(value: str | None) -> str | None:
    if value is None or value == '':
        return value
    key = _encryption_key()
    if not key:
        return value
    return Fernet(key).encrypt(value.encode()).decode()


def _decrypt(value: str | None) -> str | None:
    if value is None or value == '':
        return value
    key = _encryption_key()
    if not key:
        return value
    try:
        return Fernet(key).decrypt(value.encode()).decode()
    except Exception:
        return value


def config(db):
    s=db.get(Setting,'drive')
    if not s: return None
    cfg=json.loads(s.value)
    if 'refresh_token' in cfg:
        cfg['refresh_token'] = _decrypt(cfg['refresh_token'])
    return cfg


def access(db):
    cfg=config(db)
    if not cfg: raise RuntimeError('Connect Google Drive in the administrator screen first.')
    r=httpx.post('https://oauth2.googleapis.com/token', data={
        'client_id':os.environ.get('GOOGLE_CLIENT_ID',''),
        'client_secret':os.environ.get('GOOGLE_CLIENT_SECRET',''),
        'refresh_token':cfg['refresh_token'],'grant_type':'refresh_token'},timeout=30)
    r.raise_for_status()
    return r.json()['access_token'],cfg['folder_id']


def connect_url(state):
    if not os.environ.get('GOOGLE_CLIENT_ID') or not os.environ.get('GOOGLE_CLIENT_SECRET'):
        raise RuntimeError('Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET on the backend, then restart.')
    return 'https://accounts.google.com/o/oauth2/v2/auth?'+urlencode({
        'client_id':os.environ['GOOGLE_CLIENT_ID'], 'redirect_uri':os.environ['GOOGLE_REDIRECT_URI'],
        'response_type':'code','scope':'https://www.googleapis.com/auth/drive.file',
        'access_type':'offline','prompt':'consent','state':state})


def finish(db,code):
    r=httpx.post('https://oauth2.googleapis.com/token', data={
        'code':code,'client_id':os.environ['GOOGLE_CLIENT_ID'],
        'client_secret':os.environ['GOOGLE_CLIENT_SECRET'],
        'redirect_uri':os.environ['GOOGLE_REDIRECT_URI'],'grant_type':'authorization_code'}, timeout=30)
    r.raise_for_status(); token=r.json()
    if 'refresh_token' not in token: raise RuntimeError('Google did not return offline permission. Reconnect with consent.')
    headers={'Authorization':'Bearer '+token['access_token']}
    r=httpx.post(API+'/files',headers=headers,json={'name':'Sign Research Private Recordings',
        'mimeType':'application/vnd.google-apps.folder'},timeout=30)
    r.raise_for_status()
    value=json.dumps({'refresh_token':_encrypt(token['refresh_token']),'folder_id':r.json()['id']})
    db.merge(Setting(key='drive',value=value))

def save(db,path,mime):
    if os.environ.get('STORAGE_BACKEND','local')!='drive': return 'local',path.name
    token,folder=access(db); headers={'Authorization':'Bearer '+token}
    with httpx.Client(timeout=180) as client:
        r=client.post('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
            headers={**headers,'X-Upload-Content-Type':mime,'X-Upload-Content-Length':str(path.stat().st_size)},
            json={'name':path.name,'parents':[folder]})
        r.raise_for_status(); location=r.headers['location']
        with path.open('rb') as f:
            r=client.put(location,headers={'Content-Type':mime,'Content-Length':str(path.stat().st_size)},content=f)
        r.raise_for_status()
    return 'drive',r.json()['id']

def remove(db,take):
    if take.storage=='drive' and take.file_ref:
        token,_=access(db)
        r=httpx.delete(API+'/files/'+take.file_ref,headers={'Authorization':'Bearer '+token},timeout=30)
        if r.status_code!=404: r.raise_for_status()
    if take.file_ref and take.storage=='local':
        (ROOT/'recordings'/take.file_ref).unlink(missing_ok=True)

def download(db,take,destination):
    if take.storage=='local': return ROOT/'recordings'/take.file_ref
    token,_=access(db)
    with httpx.stream('GET',API+'/files/'+take.file_ref,params={'alt':'media'},headers={'Authorization':'Bearer '+token},timeout=180) as r:
        r.raise_for_status()
        with destination.open('wb') as f:
            for chunk in r.iter_bytes(): f.write(chunk)
    return destination

import os,tempfile
os.environ['DATA_DIR']=tempfile.mkdtemp(prefix='sign-research-tests-')
os.environ['STORAGE_BACKEND']='local'

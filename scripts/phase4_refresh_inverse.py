"""Refresh the current authorized Phase 4 inverse, never a historical seal."""
from pathlib import Path
import hashlib
import json
import subprocess
ROOT = Path(__file__).resolve().parents[1]
BASE = 'ae57e34341890d2ac77b2deb133a317a7451a2b9'
def git(*args):
 return subprocess.check_output(['git','-C',str(ROOT),*args])
def digest(value):
 return hashlib.sha256(value).hexdigest()
paths=set(git('diff',BASE,'--name-only','-z').decode().split('\0')) | set(git('ls-files','--others','--exclude-standard','-z').decode().split('\0'))
files=[];new={}
for path in sorted(paths):
 if not (path.startswith(('webapp/src/','knowledge_base/')) or path=='webapp/package.json' or path.startswith('scripts/lib/') and not Path(path).name.startswith('phase4')):continue
 current=(ROOT/path).read_bytes();r=subprocess.run(['git','-C',str(ROOT),'show',BASE+':'+path],stdout=subprocess.PIPE,stderr=subprocess.DEVNULL)
 if r.returncode:new[path]=digest(current)
 else:files.append(dict(path=path,beforeSource=r.stdout.decode(),beforeHash=digest(r.stdout),afterHash=digest(current)))
(ROOT/'scripts/lib/phase4Patches.json').write_text(json.dumps(dict(baseCommit=BASE,files=files,newFiles=new),ensure_ascii=False,indent=2)+'\n')
print(len(files),'fixed sources;',len(new),'new code/test sources')

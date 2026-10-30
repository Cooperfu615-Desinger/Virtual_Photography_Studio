"""Verify this diagnostic-only batch against its reviewed Git base; stdout only."""
import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
PATCHES = json.loads((ROOT/'scripts/lib/c2RenderingClassificationPatches.json').read_text())
ALLOWED = {item['path'] for item in PATCHES['files']} | {
    'Docs/current_project_state.md',
    'Docs/specs/c2-authoring-length-policy-v1.md',
    'Docs/specs/photography-section-d-authoring-guide.md',
}


def git(*args):
    return subprocess.check_output(['git','-C',str(ROOT),*args])


assert git('rev-parse','HEAD').decode().strip() == PATCHES['base']
assert not git('diff','--cached','--name-only'), 'Unexpected staged work'
changed=set(git('diff','--name-only','-z',PATCHES['base']).decode().strip('\0').split('\0'))-{''}
assert changed <= ALLOWED, changed-ALLOWED
for item in PATCHES['files']:
    assert hashlib.sha256((ROOT/item['path']).read_bytes()).hexdigest()==item['afterHash'],item['path']
    assert git('show',PATCHES['base']+':'+item['path']).decode()==item['beforeSource'],item['path']
counts={'trackedProtected':0,'historicalReports':0,'knowledgeBase':0,'webappSources':0}
for record in git('ls-tree','-r','-z',PATCHES['base']).split(b'\0'):
    if not record:continue
    header,path=record.split(b'\t');name=path.decode()
    if name in ALLOWED:continue
    kind=header.split()[1]
    if kind!=b'blob':continue
    file=ROOT/name
    data=str(file.readlink()).encode() if file.is_symlink() else file.read_bytes()
    blob=hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
    assert blob==header.split()[2].decode(),name
    counts['trackedProtected']+=1
    counts['historicalReports']+=name.startswith('Docs/reports/')
    counts['knowledgeBase']+=name.startswith('knowledge_base/')
    counts['webappSources']+=name.startswith('webapp/src/')
print(json.dumps({'passed':True,'base':PATCHES['base'],'changedTracked':sorted(changed),**counts,'publicSourcesByteIdentical':True,'stagedFiles':[]},ensure_ascii=False,indent=2))

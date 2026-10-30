"""Read-only protection check against the reviewed main; JSON evidence to stdout."""
import hashlib
import json
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1]
review = json.loads((root/'scripts/lib/c2WaistReview.json').read_text())
base = review['base']
patches = json.loads((root/'scripts/lib/c2WaistPatches.json').read_text())
allowed = {r['path'] for r in patches['files']} | {
    'Docs/current_project_state.md', 'Docs/specs/c2-authoring-length-policy-v1.md',
}
def git(*args):
    return subprocess.check_output(['git', '-C', str(root), *args])
changed = set(git('diff', '--name-only', '-z', base).decode().strip('\0').split('\0')) - {''}
assert changed <= allowed, changed - allowed
assert not git('diff', '--cached', '--name-only'), 'Unexpected staged work'
assert git('rev-parse', 'HEAD').decode().strip() == base
for r in patches['files']:
    assert hashlib.sha256((root/r['path']).read_bytes()).hexdigest() == r['afterHash'], r['path']
    assert git('show', base+':'+r['path']).decode() == r['beforeSource'], r['path']
protected = []
for line in git('ls-tree', '-r', '-z', base, 'Docs/reports', 'knowledge_base/catalog/id_registry.json', 'webapp/src/lib/engine.js', 'webapp/src/lib/engine/promptOutputContracts.js').split(b'\0'):
    if not line:
        continue
    header, path = line.split(b'\t'); path = path.decode()
    data = (root/path).read_bytes()
    blob = hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
    assert blob == header.decode().split()[2], path
    protected.append(path)
print(json.dumps({'passed': True, 'base': base, 'branch': git('branch','--show-current').decode().strip(),
    'trackedChanges': sorted(changed), 'protectedFiles': len(protected), 'historicalReportsUnchanged': True,
    'registryAndRendererUnchanged': True, 'stagedFiles': [],
    'newBaselineSha256': hashlib.sha256((root/'Docs/reports/c2-waist-2026-10-30/before.json.gz').read_bytes()).hexdigest()}, ensure_ascii=False, indent=2))

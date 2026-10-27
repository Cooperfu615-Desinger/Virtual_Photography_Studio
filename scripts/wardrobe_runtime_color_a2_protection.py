"""Read-only comparison against this batch's pre-edit working-tree inventory."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
BASE = 'bd31bd34f0bfa8986193a6048fe1a69a265e3668'
ALLOWED = {'webapp/src/lib/engine/specialTapeControlLanguage.test.js', 'webapp/src/lib/engine.js', 'webapp/src/lib/enginePromptPipeline.test.js', 'Docs/current_project_state.md', 'webapp/src/features/saved-cards/wardrobeColorRecoveryHistory.test.js', 'webapp/src/features/saved-cards/wardrobeColorRecovery.js', 'scripts/lib/a2SpecialTapeReplay.mjs', 'knowledge_base/catalog/README.md', 'Docs/specs/page1-single-prompt-compression-guide.md', 'Docs/specs/wardrobe-section-b-authoring-guide.md'}


def git(directory, *args):
    return subprocess.check_output(['git', '-C', str(directory), *args]).decode()


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest() if path.is_file() else None


def check(before):
    changed = [p for p, sha in before['files'].items() if digest(ROOT / p) != sha]
    historical = [p for p in before['files'] if p.startswith('Docs/reports/') or
                  (p.endswith(('.json', '.gz')) and any(s in p.lower() for s in ['baseline', 'seal']))]
    other = []
    dirty_count = 0
    for entry in before['otherWorktrees']:
        path = Path(entry['path'])
        files = [p for p, sha in entry['files'].items() if digest(path / p) != sha]
        dirty_count += len(entry['files'])
        other.append({'path': str(path), 'headUnchanged': git(path, 'rev-parse', 'HEAD').strip() == entry['head'],
                      'statusUnchanged': git(path, 'status', '--porcelain=v1') == entry['status'], 'changedFiles': files})
    head = git(ROOT, 'rev-parse', 'HEAD').strip()
    staged = git(ROOT, 'diff', '--cached', '--name-only').splitlines()
    result = {'baseCommit': BASE, 'head': head, 'branch': git(ROOT, 'branch', '--show-current').strip(),
              'trackedFilesChecked': len(before['files']), 'allowedChangedTrackedFiles': sorted(set(changed) & ALLOWED),
              'unexpectedChanges': sorted(set(changed) - ALLOWED), 'historicalFilesChecked': len(historical),
              'historicalChanged': [p for p in historical if p in changed], 'otherWorktrees': other,
              'otherDirtyFilesChecked': dirty_count, 'stagedFiles': staged}
    result['passed'] = (before['head'] == BASE == head and not staged and not result['unexpectedChanges']
                        and not result['historicalChanged'] and all(x['headUnchanged'] and x['statusUnchanged']
                        and not x['changedFiles'] for x in other))
    return result


if __name__ == '__main__':
    result = check(json.loads(Path(sys.argv[1]).read_text()))
    if len(sys.argv) > 2:
        Path(sys.argv[2]).write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(result, ensure_ascii=False))
    sys.exit(0 if result['passed'] else 1)

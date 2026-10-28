"""Read-only allowlist, historical-seal and unrelated-worktree verification."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
BASE = '2caa6fdcd2ab63931339ee3018ca52025d3cef3f'
REPORT = 'Docs/reports/legacy-dress-prose-a2-2026-10-28/'
ALLOWED = {'scripts/lib/a2DressControlHistoricalReplay.mjs', 'webapp/src/features/saved-cards/wardrobeColorRecovery.test.js', 'webapp/src/features/saved-cards/cardCodec.js', 'Docs/current_project_state.md', 'scripts/lib/a2LegacyDressReplay.mjs', 'scripts/lib/a2OutfitControlHistoricalReplay.mjs', 'scripts/lib/a2WardrobeColorRecoveryReplay.mjs', 'webapp/src/features/page1/legacyDressRestoreHistory.test.js', 'Docs/specs/wardrobe-section-b-authoring-guide.md', 'webapp/src/features/page1/legacyDressRestore.test.js', 'scripts/lib/a1AdultIdentityHistoricalReplay.mjs'}
NEW = {'scripts/legacy_dress_prose_a2_acceptance.mjs', 'webapp/src/features/saved-cards/legacyDressProseHistory.test.js', 'scripts/legacy_dress_prose_a2_protection.py', 'webapp/src/features/saved-cards/legacyDressProseRecovery.test.js', 'Docs/specs/legacy-dress-prose-a2-v1.md', 'scripts/legacy_dress_prose_a2_history.mjs', 'scripts/lib/a2LegacyDressProsePatches.json', 'Docs/decisions/2026-10-28-a2-legacy-dress-prose.md', 'webapp/src/features/saved-cards/legacyDressProseRecovery.js', 'scripts/lib/a2LegacyDressProseReplay.mjs', 'scripts/legacy_dress_prose_a2_browser.mjs'}


def git(directory, *args):
    return subprocess.check_output(['git', '-C', str(directory), *args]).decode()


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest() if path.is_file() else None


def check(before):
    changed = [p for p, sha in before['files'].items() if digest(ROOT / p) != sha]
    historical = [p for p in before['files'] if p.startswith('Docs/reports/') or
                  (p.endswith(('.json', '.gz')) and any(s in p.lower() for s in ['baseline', 'seal']))]
    other = []
    for entry in before['otherWorktrees']:
        path = Path(entry['path'])
        other.append({'path': str(path), 'headUnchanged': git(path, 'rev-parse', 'HEAD').strip() == entry['head'],
                      'statusUnchanged': git(path, 'status', '--porcelain=v1') == entry['status'],
                      'changedFiles': [p for p, sha in entry['files'].items() if digest(path / p) != sha]})
    untracked = [p for p in git(ROOT, 'ls-files', '--others', '--exclude-standard', '-z').split('\0') if p]
    registrations = git(ROOT, 'worktree', 'list', '--porcelain').split('\n\n')
    missing = [{'path': x['path'], 'stillMissing': not Path(x['path']).exists(),
                'registrationUnchanged': x['registration'] in registrations}
               for x in before.get('missingWorktrees', [])]
    result = {'missingWorktrees': missing, 'baseCommit': BASE, 'head': git(ROOT, 'rev-parse', 'HEAD').strip(),
              'branch': git(ROOT, 'branch', '--show-current').strip(), 'trackedFilesChecked': len(before['files']),
              'allowedChangedTrackedFiles': sorted(set(changed) & ALLOWED), 'unexpectedChanges': sorted(set(changed) - ALLOWED),
              'unexpectedNewFiles': [p for p in untracked if p not in NEW and not p.startswith(REPORT)],
              'historicalFilesChecked': len(historical), 'historicalChanged': [p for p in historical if p in changed],
              'otherWorktrees': other, 'otherDirtyFilesChecked': sum(len(x['files']) for x in before['otherWorktrees']),
              'stagedFiles': git(ROOT, 'diff', '--cached', '--name-only').splitlines()}
    result['passed'] = (before['head'] == BASE == result['head'] and not result['stagedFiles']
                        and not result['unexpectedChanges'] and not result['unexpectedNewFiles']
                        and not result['historicalChanged'] and all(x['headUnchanged'] and x['statusUnchanged']
                        and not x['changedFiles'] for x in other)
                        and all(x['stillMissing'] and x['registrationUnchanged'] for x in missing))
    return result


if __name__ == '__main__':
    result = check(json.loads(Path(sys.argv[1]).read_text()))
    if len(sys.argv) > 2:
        Path(sys.argv[2]).write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(result, ensure_ascii=False))
    sys.exit(0 if result['passed'] else 1)

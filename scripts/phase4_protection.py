"""Read-only allowlist, historical-seal and unrelated-worktree verification."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
BASE = 'ae57e34341890d2ac77b2deb133a317a7451a2b9'


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
              'changedTrackedFiles': changed,
              'newFiles': untracked,
              'historicalFilesChecked': len(historical), 'historicalChanged': [p for p in historical if p in changed],
              'otherWorktrees': other, 'otherDirtyFilesChecked': sum(len(x['files']) for x in before['otherWorktrees']),
              'stagedFiles': git(ROOT, 'diff', '--cached', '--name-only').splitlines()}
    result['changedCommittedReports'] = [p for p in git(ROOT, 'diff', 'HEAD', '--name-only').splitlines() if p.startswith('Docs/reports/')]
    result['passed'] = (before['baseCommit'] == BASE and result['branch'] == 'main' and not result['historicalChanged'] and not result['changedCommittedReports'] and all(x['headUnchanged'] and x['statusUnchanged']
                        and not x['changedFiles'] for x in other)
                        and all(x['stillMissing'] and x['registrationUnchanged'] for x in missing))
    return result


if __name__ == '__main__':
    result = check(json.loads(Path(sys.argv[1]).read_text()))
    if len(sys.argv) > 2:
        Path(sys.argv[2]).write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(result, ensure_ascii=False))
    sys.exit(0 if result['passed'] else 1)

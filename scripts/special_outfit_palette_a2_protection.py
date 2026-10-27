"""Read-only allowlist, historical-seal and unrelated-worktree verification."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
BASE = '15580949ac1f00e7a2628209d91a301434504965'
REPORT = 'Docs/reports/special-outfit-palette-a2-2026-10-27/'
ALLOWED = {
    'webapp/src/features/page1/lockTransitions.js',
    'Docs/current_project_state.md',
    'Docs/specs/wardrobe-section-b-authoring-guide.md',
    'Docs/specs/wardrobe-color-integration-ui-v1.md',
}
NEW = {
    'Docs/specs/special-outfit-palette-a2-v1.md',
    'Docs/decisions/2026-10-27-a2-special-outfit-palette.md',
    'webapp/src/features/page1/specialOutfitPalette.test.js',
    'webapp/src/features/page1/specialOutfitPaletteHistory.test.js',
    'scripts/special_outfit_palette_a2_acceptance.mjs',
    'scripts/special_outfit_palette_a2_browser.mjs',
    'scripts/special_outfit_palette_a2_history.mjs',
    'scripts/special_outfit_palette_a2_protection.py',
    'scripts/lib/a2SpecialPaletteReplay.mjs',
    'scripts/lib/a2SpecialPalettePatch.json',
}


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
    result = {'baseCommit': BASE, 'head': git(ROOT, 'rev-parse', 'HEAD').strip(),
              'branch': git(ROOT, 'branch', '--show-current').strip(), 'trackedFilesChecked': len(before['files']),
              'allowedChangedTrackedFiles': sorted(set(changed) & ALLOWED), 'unexpectedChanges': sorted(set(changed) - ALLOWED),
              'unexpectedNewFiles': [p for p in untracked if p not in NEW and not p.startswith(REPORT)],
              'historicalFilesChecked': len(historical), 'historicalChanged': [p for p in historical if p in changed],
              'otherWorktrees': other, 'otherDirtyFilesChecked': sum(len(x['files']) for x in before['otherWorktrees']),
              'stagedFiles': git(ROOT, 'diff', '--cached', '--name-only').splitlines()}
    result['passed'] = (before['head'] == BASE == result['head'] and not result['stagedFiles']
                        and not result['unexpectedChanges'] and not result['unexpectedNewFiles']
                        and not result['historicalChanged'] and all(x['headUnchanged'] and x['statusUnchanged']
                        and not x['changedFiles'] for x in other))
    return result


if __name__ == '__main__':
    result = check(json.loads(Path(sys.argv[1]).read_text()))
    if len(sys.argv) > 2:
        Path(sys.argv[2]).write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(result, ensure_ascii=False))
    sys.exit(0 if result['passed'] else 1)

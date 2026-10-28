"""Verify this batch's allowlist and all original tracked/unrelated dirty bytes."""
import hashlib,json,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE='887b149a42047bbc3bc1adbb45aa0f68c9e5487e'
ALLOWED={'Docs/current_project_state.md', 'Docs/specs/character-card-facial-identity.md', 'scripts/check_catalog_integrity.mjs', 'scripts/lib/catalogIntegrity.mjs', 'webapp/src/lib/engine/characterProfiles.js', 'webapp/src/lib/characterCardLab.js', 'webapp/package.json', 'scripts/lib/page2AdultIdentityReplay.mjs'}
NEW={'scripts/lib/b3CharacterWardrobeChecks.mjs', 'webapp/src/lib/engine/characterWardrobeSources.js', 'webapp/src/lib/characterWardrobeSources.test.js', 'scripts/b3_character_wardrobe_history.mjs', 'scripts/b3_character_wardrobe_acceptance.mjs', 'scripts/lib/b3CharacterWardrobeReview.json', 'webapp/src/lib/characterWardrobeHistory.test.js', 'scripts/b3_character_wardrobe_gates.py', 'scripts/lib/b3CharacterWardrobePatches.json', 'scripts/b3_character_wardrobe_guard_acceptance.mjs', 'scripts/lib/b3CharacterWardrobeReplay.mjs', 'Docs/decisions/2026-10-28-b3-character-wardrobe.md', 'scripts/b3_character_wardrobe_protection.py', 'Docs/specs/b3-character-wardrobe-source-v1.md', 'scripts/b3_character_wardrobe_browser.mjs'}
REPORT='Docs/reports/b3-character-wardrobe-2026-10-28/'
def git(r,*a):return subprocess.check_output(['git','-C',str(r),*a]).decode()
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest() if p.is_file() else None
before=json.loads(Path(sys.argv[1]).read_text());assert before['baseCommit']==BASE
changed=[p for p,h in before['files'].items() if sha(ROOT/p)!=h]
historical=[p for p in before['files'] if p.startswith('Docs/reports/') or p.endswith('.gz') or (p.endswith('.json') and any(x in p.lower() for x in ['baseline','seal','patches']))]
others=[]
for x in before['otherWorktrees']:
 r=Path(x['path']);others.append({'path':str(r),'headUnchanged':git(r,'rev-parse','HEAD').strip()==x['head'],'statusUnchanged':git(r,'status','--porcelain=v1')==x['status'],'changedFiles':[p for p,h in x['files'].items() if sha(r/p)!=h]})
missing=[{'path':x['path'],'unchanged':not Path(x['path']).exists() and x['registration'] in git(ROOT,'worktree','list','--porcelain').split('\n\n')} for x in before['missingWorktrees']]
new=[p for p in git(ROOT,'ls-files','--others','--exclude-standard','-z').split('\0') if p]
result={'baseCommit':BASE,'head':git(ROOT,'rev-parse','HEAD').strip(),'branch':git(ROOT,'branch','--show-current').strip(),'trackedFilesChecked':len(before['files']),'changedTrackedFiles':changed,'unexpectedChanges':sorted(set(changed)-ALLOWED),'historicalFilesChecked':len(historical),'historicalChanged':[p for p in historical if p in changed],'newFiles':new,'unexpectedNewFiles':[p for p in new if p not in NEW and not p.startswith(REPORT)],'otherWorktrees':others,'otherDirtyFilesChecked':sum(len(x['files']) for x in before['otherWorktrees']),'missingWorktrees':missing,'stagedFiles':git(ROOT,'diff','--cached','--name-only').splitlines()}
result['passed']=result['head']==BASE and result['branch']=='main' and not any(result[k] for k in ['unexpectedChanges','historicalChanged','unexpectedNewFiles','stagedFiles']) and all(x['headUnchanged'] and x['statusUnchanged'] and not x['changedFiles'] for x in others) and all(x['unchanged'] for x in missing)
if len(sys.argv)>2:
 target=Path(sys.argv[2]).resolve();assert not target.is_relative_to(ROOT) or target.is_relative_to(ROOT/REPORT), 'Protect historical reports'
 target.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in result.items() if k not in ['otherWorktrees','newFiles']},ensure_ascii=False));sys.exit(not result['passed'])

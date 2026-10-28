import subprocess,os,json,gzip,sys
from pathlib import Path
r=Path(__file__).resolve().parents[1];out=Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/vps-page2-adult/gates');out=out.resolve();assert not out.is_relative_to(r) or out.is_relative_to(r/'Docs/reports/page2-adult-identity-2026-10-28'), 'Protect historical reports';out.mkdir(parents=True,exist_ok=True)
env=dict(os.environ,REGISTRY_BASE_COMMIT='bfc2d5baafc8aaede8f774527d0f1aaa187da27f',PYTHONDONTWRITEBYTECODE='1');# Use Node 22 supplied by the caller's PATH.
checks=[('test',['npm','test'],'webapp'),('quality',['npm','run','test:prompt-quality'],'webapp'),('lint',['npm','run','lint'],'webapp'),('build',['npm','run','build'],'webapp'),('audit',['node','scripts/validate_prompt_logic.mjs','200','prompt-quality-baseline','--strict'],'.'),('sync',['python3','-B','scripts/sync_to_json.py','--check','--report-json'],'.'),('python',['python3','-B','-m','unittest','discover','-s','scripts/tests'],'.'),('strict',['node','scripts/check_catalog_integrity.mjs','--strict'],'.'),('catalog',['node','--test','scripts/tests/catalog-integrity.test.mjs','scripts/tests/catalog-semantics.test.mjs','scripts/tests/catalog-legacy.test.mjs'],'.'),('assets',['python3','-B','scripts/check_public_assets.py'],'.')]
results=json.loads((out/'results.json').read_text()) if len(sys.argv)>2 and (out/'results.json').exists() else []
for name,cmd,cwd in checks:
 if len(sys.argv)>2 and name not in sys.argv[2:]:continue
 results=[x for x in results if x['name']!=name]
 p=subprocess.run(cmd,cwd=r/cwd,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
 (out/(name+'.log.gz')).write_bytes(gzip.compress(p.stdout,mtime=0));results.append({'name':name,'command':cmd,'exitCode':p.returncode,'log':name+'.log.gz'});(out/'results.json').write_text(json.dumps(results,indent=2)+'\n');print(name,p.returncode,flush=True)

sys.exit(any(x['exitCode'] for x in results))

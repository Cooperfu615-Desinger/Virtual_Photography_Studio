import assert from 'node:assert/strict';
import {mkdtempSync,cpSync,symlinkSync,readFileSync,writeFileSync,rmSync,mkdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),out=resolve(process.argv[2]||'/tmp/vps-b3-wardrobe/guard');
assert.ok(!out.startsWith(root)||out.startsWith(join(root,'Docs/reports/b3-character-wardrobe-2026-10-28/')));mkdirSync(out,{recursive:true});
const dir=mkdtempSync(join(tmpdir(),'b3-strict-mutation-'));
try{
 for(const p of ['scripts','knowledge_base','webapp/src'])cpSync(join(root,p),join(dir,p),{recursive:true});
 for(const p of ['package.json','package-lock.json'])cpSync(join(root,'webapp',p),join(dir,'webapp',p));
 for(const p of ['node_modules','public'])symlinkSync(join(root,'webapp',p),join(dir,'webapp',p),'dir');
 symlinkSync(join(root,'source-assets'),join(dir,'source-assets'),'dir');
 const path=join(dir,'webapp/src/lib/engine/characterWardrobeSources.js'),original=readFileSync(path,'utf8');
 const env={...process.env,REGISTRY_BASE_COMMIT:'887b149a42047bbc3bc1adbb45aa0f68c9e5487e',GIT_DIR:execFileSync('git',['-C',root,'rev-parse','--absolute-git-dir'],{encoding:'utf8'}).trim()};
 const rows=[];
 for(const mutation of ['none','layer-text','source-missing']){
  writeFileSync(path,mutation==='layer-text'?original.replace('bare feet as the locked footwear state','invented footwear text'):original);
  const missing=join(dir,'scripts/lib/b3CharacterWardrobeReview.json'),backup=readFileSync(missing);
  if(mutation==='source-missing')rmSync(missing);
  const run=spawnSync(process.execPath,[join(dir,'scripts/check_catalog_integrity.mjs'),'--repo',dir,'--strict','--json'],{env,encoding:'utf8',maxBuffer:32*1024*1024});
  if(mutation==='source-missing')writeFileSync(missing,backup);
  assert.equal(run.status,mutation==='none'?0:1,run.stderr||run.stdout);
  const report=JSON.parse(run.stdout),errors=report.allowlist.blocking;
  assert.equal(errors.some(x=>x.code==='CHARACTER_WARDROBE_SOURCE'),mutation!=='none');
  assert.equal(report.allowlist.allowed.length,2);assert.equal(report.allowlist.stale.length,0);
  rows.push({mutation,exitCode:run.status,blocking:errors.map(x=>({code:x.code,itemKey:x.itemKey}))});
 }
 writeFileSync(join(out,'results.json'),JSON.stringify({passed:true,checks:rows},null,2)+'\n');console.log(rows);
}finally{rmSync(dir,{recursive:true,force:true});}

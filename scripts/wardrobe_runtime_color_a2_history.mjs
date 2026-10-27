// Run the previous batch and its complete older chain against the exact isolated inverse.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {cpSync,readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync,symlinkSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {RUNTIME_ROOT as root,RUNTIME_PATCHES as review,restorePreA2RuntimeColorFiles} from './lib/a2RuntimeColorReplay.mjs';
import {supplySealedHistory} from './lib/a5XimendingHistoricalReplay.mjs';
const out=resolve(process.argv[2]||'/tmp/a2-runtime-history'),own=resolve(root,'Docs/reports/wardrobe-runtime-color-a2-2026-10-27');
assert.ok(!out.startsWith(resolve(root)+'/')||out===own||out.startsWith(own+'/'),'Protect other reports');
mkdirSync(out,{recursive:true});
const dir=mkdtempSync(join(tmpdir(),'vps-runtime-history-')),results=mkdtempSync(join(tmpdir(),'vps-runtime-results-'));
try{
  for(const p of ['webapp/src','scripts','knowledge_base'])cpSync(join(root,p),join(dir,p),{recursive:true});
  for(const p of ['package.json','package-lock.json'])cpSync(join(root,'webapp',p),join(dir,'webapp',p));
  symlinkSync(join(root,'webapp/node_modules'),join(dir,'webapp/node_modules'),'dir');
  restorePreA2RuntimeColorFiles(dir);supplySealedHistory(dir);
  writeFileSync(join(dir,'knowledge_base/catalog/README.md'),execFileSync('git',['-C',root,'show',review.baseCommit+':knowledge_base/catalog/README.md']));
  cpSync(join(root,'Docs/reports/wardrobe-control-a2-outfits-2026-10-27'),join(dir,'Docs/reports/wardrobe-control-a2-outfits-2026-10-27'),{recursive:true});
  const env={...process.env,GIT_DIR:execFileSync('git',['-C',root,'rev-parse','--absolute-git-dir'],{encoding:'utf8'}).trim()};
  for(const [script,dest]of [['wardrobe_control_a2_special_tape_acceptance.mjs','special-tape'],['wardrobe_control_a2_special_tape_history.mjs','earlier']]){
    const path='scripts/'+script;assert.deepEqual(readFileSync(join(root,path)),execFileSync('git',['-C',root,'show',review.baseCommit+':'+path]));
    process.stdout.write(execFileSync(process.execPath,[join(dir,path),join(results,dest)],{cwd:dir,env,encoding:'utf8',maxBuffer:32*1024*1024}));
  }
  cpSync(results,out,{recursive:true});
}finally{rmSync(dir,{recursive:true,force:true});rmSync(results,{recursive:true,force:true});}

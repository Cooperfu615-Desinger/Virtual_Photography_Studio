// Replay the accepted legacy-dress prose batch and all earlier history through an isolated exact inverse.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {cpSync,readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync,symlinkSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {CHEST_DRESS_REGION_ROOT as root,CHEST_DRESS_REGION_REVIEW as review,restorePreChestDressRegionFiles} from './lib/a2ChestDressRegionReplay.mjs';
import {supplySealedHistory} from './lib/a5XimendingHistoricalReplay.mjs';
const out=resolve(process.argv[2]||'/tmp/a2-legacy-dress-prose-history'),own=resolve(root,'Docs/reports/chest-dress-region-a2-2026-10-28');
assert.ok(!out.startsWith(resolve(root)+'/')||out===own||out.startsWith(own+'/'),'Protect other reports');mkdirSync(out,{recursive:true});
const dir=mkdtempSync(join(tmpdir(),'vps-legacy-dress-prose-history-')),results=mkdtempSync(join(tmpdir(),'vps-legacy-dress-prose-results-'));
try{
 for(const p of ['webapp/src','scripts','knowledge_base'])cpSync(join(root,p),join(dir,p),{recursive:true});
 for(const p of ['package.json','package-lock.json'])cpSync(join(root,'webapp',p),join(dir,'webapp',p));
 symlinkSync(join(root,'webapp/node_modules'),join(dir,'webapp/node_modules'),'dir');
 restorePreChestDressRegionFiles(dir);
 const inverseInputs=review.files.map(item=>{const content=readFileSync(join(dir,item.path)),fixed=execFileSync('git',['-C',root,'show',review.baseCommit+':'+item.path]);assert.deepEqual(content,fixed);return {path:item.path,sha256:createHash('sha256').update(content).digest('hex'),equalsFixedGit:true};});
 supplySealedHistory(dir);
 cpSync(join(root,'Docs/reports/wardrobe-control-a2-dresses-2026-10-26'),join(dir,'Docs/reports/wardrobe-control-a2-dresses-2026-10-26'),{recursive:true});
 cpSync(join(root,'Docs/reports/wardrobe-control-a2-outfits-2026-10-27'),join(dir,'Docs/reports/wardrobe-control-a2-outfits-2026-10-27'),{recursive:true});
 const env={...process.env,GIT_DIR:execFileSync('git',['-C',root,'rev-parse','--absolute-git-dir'],{encoding:'utf8'}).trim()};
 const log=[];
 for(const [script,dest]of [['legacy_dress_prose_a2_acceptance.mjs','legacy-dress'],['legacy_dress_prose_a2_history.mjs','earlier']]){
  const path='scripts/'+script;assert.deepEqual(readFileSync(join(root,path)),execFileSync('git',['-C',root,'show',review.baseCommit+':'+path]));
  const output=execFileSync(process.execPath,[join(dir,path),join(results,dest)],{cwd:dir,env,encoding:'utf8',maxBuffer:64*1024*1024});process.stdout.write(output);log.push({script,passed:true});
 }
 cpSync(results,out,{recursive:true});writeFileSync(join(out,'history.json'),JSON.stringify({baseCommit:review.baseCommit,inverseExact:true,inverseInputs,log},null,2)+'\n');
}finally{rmSync(dir,{recursive:true,force:true});rmSync(results,{recursive:true,force:true});}

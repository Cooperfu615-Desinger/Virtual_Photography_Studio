// Replay the accepted paired-capture batch and the complete earlier history with an isolated exact inverse.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {cpSync,readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync,symlinkSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {LEGACY_DRESS_ROOT as root,LEGACY_DRESS_REVIEW as review,restorePreA2LegacyDressFiles} from './lib/a2LegacyDressReplay.mjs';
import {supplySealedHistory} from './lib/a5XimendingHistoricalReplay.mjs';
const out=resolve(process.argv[2]||'/tmp/a2-legacy-dress-restore-history'),own=resolve(root,'Docs/reports/legacy-dress-restore-a2-2026-10-27');
assert.ok(!out.startsWith(resolve(root)+'/')||out===own||out.startsWith(own+'/'),'Protect other reports');mkdirSync(out,{recursive:true});
const dir=mkdtempSync(join(tmpdir(),'vps-legacy-dress-restore-history-')),results=mkdtempSync(join(tmpdir(),'vps-legacy-dress-restore-results-'));
try{
 for(const p of ['webapp/src','scripts','knowledge_base'])cpSync(join(root,p),join(dir,p),{recursive:true});
 for(const p of ['package.json','package-lock.json'])cpSync(join(root,'webapp',p),join(dir,'webapp',p));
 symlinkSync(join(root,'webapp/node_modules'),join(dir,'webapp/node_modules'),'dir');
 restorePreA2LegacyDressFiles(dir);supplySealedHistory(dir);
 cpSync(join(root,'Docs/reports/wardrobe-control-a2-outfits-2026-10-27'),join(dir,'Docs/reports/wardrobe-control-a2-outfits-2026-10-27'),{recursive:true});
 const env={...process.env,GIT_DIR:execFileSync('git',['-C',root,'rev-parse','--absolute-git-dir'],{encoding:'utf8'}).trim()};
 const log=[];
 for(const [script,dest]of [['paired_capture_a2_acceptance.mjs','paired-capture'],['paired_capture_a2_history.mjs','earlier']]){
  const path='scripts/'+script;assert.deepEqual(readFileSync(join(root,path)),execFileSync('git',['-C',root,'show',review.baseCommit+':'+path]));
  const output=execFileSync(process.execPath,[join(dir,path),join(results,dest)],{cwd:dir,env,encoding:'utf8',maxBuffer:64*1024*1024});process.stdout.write(output);log.push({script,passed:true});
 }
 cpSync(results,out,{recursive:true});writeFileSync(join(out,'history.json'),JSON.stringify({baseCommit:review.baseCommit,inverseExact:true,log},null,2)+'\n');
}finally{rmSync(dir,{recursive:true,force:true});rmSync(results,{recursive:true,force:true});}

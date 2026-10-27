// Replay the accepted special-palette batch and the complete earlier history with an isolated exact inverse.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {cpSync,readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync,symlinkSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {PAIRED_CAPTURE_ROOT as root,PAIRED_CAPTURE_REVIEW as review,restorePreA2PairedCaptureFiles} from './lib/a2PairedCaptureReplay.mjs';
import {supplySealedHistory} from './lib/a5XimendingHistoricalReplay.mjs';
const out=resolve(process.argv[2]||'/tmp/a2-paired-capture-history'),own=resolve(root,'Docs/reports/paired-capture-a2-2026-10-27');
assert.ok(!out.startsWith(resolve(root)+'/')||out===own||out.startsWith(own+'/'),'Protect other reports');mkdirSync(out,{recursive:true});
const dir=mkdtempSync(join(tmpdir(),'vps-paired-capture-history-')),results=mkdtempSync(join(tmpdir(),'vps-paired-capture-results-'));
try{
 for(const p of ['webapp/src','scripts','knowledge_base'])cpSync(join(root,p),join(dir,p),{recursive:true});
 for(const p of ['package.json','package-lock.json'])cpSync(join(root,'webapp',p),join(dir,'webapp',p));
 symlinkSync(join(root,'webapp/node_modules'),join(dir,'webapp/node_modules'),'dir');
 restorePreA2PairedCaptureFiles(dir);supplySealedHistory(dir);
 cpSync(join(root,'Docs/reports/wardrobe-control-a2-outfits-2026-10-27'),join(dir,'Docs/reports/wardrobe-control-a2-outfits-2026-10-27'),{recursive:true});
 const env={...process.env,GIT_DIR:execFileSync('git',['-C',root,'rev-parse','--absolute-git-dir'],{encoding:'utf8'}).trim()};
 const log=[];
 for(const [script,dest]of [['special_outfit_palette_a2_acceptance.mjs','special-palette'],['special_outfit_palette_a2_history.mjs','earlier']]){
  const path='scripts/'+script;assert.deepEqual(readFileSync(join(root,path)),execFileSync('git',['-C',root,'show',review.baseCommit+':'+path]));
  const output=execFileSync(process.execPath,[join(dir,path),join(results,dest)],{cwd:dir,env,encoding:'utf8',maxBuffer:64*1024*1024});process.stdout.write(output);log.push({script,passed:true});
 }
 cpSync(results,out,{recursive:true});writeFileSync(join(out,'history.json'),JSON.stringify({baseCommit:review.baseCommit,inverseExact:true,log},null,2)+'\n');
}finally{rmSync(dir,{recursive:true,force:true});rmSync(results,{recursive:true,force:true});}

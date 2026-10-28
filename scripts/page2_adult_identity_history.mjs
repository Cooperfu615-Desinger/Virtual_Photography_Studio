import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {cpSync,readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync,symlinkSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {PAGE2_ROOT as root,PAGE2_BASE as base,PAGE2_REVIEW,restorePrePage2AdultFiles} from './lib/page2AdultIdentityReplay.mjs';
import {supplySealedHistory} from './lib/a5XimendingHistoricalReplay.mjs';
const out=resolve(process.argv[2]||'/tmp/vps-page2-adult/history');assert.ok(!out.startsWith(root)||out.startsWith(join(root,'Docs/reports/page2-adult-identity-2026-10-28/')));mkdirSync(out,{recursive:true});
const dir=mkdtempSync(join(tmpdir(),'page2-adult-history-'));
try{
 for(const path of ['webapp/src','scripts','knowledge_base','Docs/reports/wardrobe-control-a2-dresses-2026-10-26','Docs/reports/wardrobe-control-a2-outfits-2026-10-27'])cpSync(join(root,path),join(dir,path),{recursive:true});
 for(const p of ['package.json','package-lock.json'])cpSync(join(root,'webapp',p),join(dir,'webapp',p));
 symlinkSync(join(root,'webapp/node_modules'),join(dir,'webapp/node_modules'),'dir');
 supplySealedHistory(dir);
 restorePrePage2AdultFiles(dir);
 for(const f of PAGE2_REVIEW.files)assert.deepEqual(readFileSync(join(dir,f.path)),execFileSync('git',['-C',root,'show',base+':'+f.path]));
 const env={...process.env,GIT_DIR:execFileSync('git',['-C',root,'rev-parse','--absolute-git-dir'],{encoding:'utf8'}).trim()};
 const log=execFileSync(process.execPath,[join(dir,'scripts/phase4_history.mjs'),out],{cwd:dir,env,encoding:'utf8',maxBuffer:64*1024*1024});
 writeFileSync(join(out,'replay.log'),log);writeFileSync(join(out,'page2-history.json'),JSON.stringify({passed:true,baseCommit:base,inverseExact:true,restoredFiles:PAGE2_REVIEW.files.map(f=>f.path),originalHistoryTool:'scripts/phase4_history.mjs'},null,2)+'\n');console.log(log);
}finally{rmSync(dir,{recursive:true,force:true});}

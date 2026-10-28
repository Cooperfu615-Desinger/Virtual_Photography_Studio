import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {cpSync,readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync,symlinkSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {B3_ROOT as root,B3_BASE as base,B3_REVIEW,restorePreB3WardrobeFiles} from './lib/b3CharacterWardrobeReplay.mjs';
import {supplySealedHistory} from './lib/a5XimendingHistoricalReplay.mjs';
const out=resolve(process.argv[2]||'/tmp/vps-b3-wardrobe/history');assert.ok(!out.startsWith(root)||out.startsWith(join(root,'Docs/reports/b3-character-wardrobe-2026-10-28/')));mkdirSync(out,{recursive:true});
const dir=mkdtempSync(join(tmpdir(),'b3-wardrobe-history-'));
try{
 for(const path of ['webapp/src','scripts','knowledge_base','Docs/reports/wardrobe-control-a2-dresses-2026-10-26','Docs/reports/wardrobe-control-a2-outfits-2026-10-27'])cpSync(join(root,path),join(dir,path),{recursive:true});
 for(const p of ['package.json','package-lock.json'])cpSync(join(root,'webapp',p),join(dir,'webapp',p));
 symlinkSync(join(root,'webapp/node_modules'),join(dir,'webapp/node_modules'),'dir');
 supplySealedHistory(dir);
 restorePreB3WardrobeFiles(dir);
 for(const f of B3_REVIEW.files)assert.deepEqual(readFileSync(join(dir,f.path)),execFileSync('git',['-C',root,'show',base+':'+f.path]));
 const env={...process.env,GIT_DIR:execFileSync('git',['-C',root,'rev-parse','--absolute-git-dir'],{encoding:'utf8'}).trim()};
 const acceptance=execFileSync(process.execPath,[join(dir,'scripts/page2_adult_identity_acceptance.mjs'),join(out,'page2-acceptance')],{cwd:dir,env,encoding:'utf8',maxBuffer:64*1024*1024});
 const log=acceptance+execFileSync(process.execPath,[join(dir,'scripts/page2_adult_identity_history.mjs'),join(out,'earlier')],{cwd:dir,env,encoding:'utf8',maxBuffer:64*1024*1024});
 writeFileSync(join(out,'replay.log'),log);writeFileSync(join(out,'b3-history.json'),JSON.stringify({passed:true,baseCommit:base,inverseExact:true,restoredFiles:B3_REVIEW.files.map(f=>f.path),originalAcceptanceTool:'scripts/page2_adult_identity_acceptance.mjs',originalHistoryTool:'scripts/page2_adult_identity_history.mjs'},null,2)+'\n');console.log(log);
}finally{rmSync(dir,{recursive:true,force:true});}

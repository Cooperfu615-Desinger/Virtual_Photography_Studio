import {prepareC2HistoricalContext} from './lib/c2WaistHistoryContext.mjs';
// Run sealed prior acceptance on a byte-exact pre-C2 copy; outputs go outside old reports.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {withPreC2WaistReplay,C2_WAIST_ROOT as root} from './lib/c2WaistReplay.mjs';
const out=resolve(process.argv[2]||'/tmp/c2-waist-history');
assert.ok(!out.startsWith(root+'/'),'History evidence must be outside checkout');mkdirSync(out,{recursive:true});
await withPreC2WaistReplay(async dir=>{
 const env={...process.env,GIT_DIR:execFileSync('git',['-C',root,'rev-parse','--absolute-git-dir'],{encoding:'utf8'}).trim()};delete env.NODE_TEST_CONTEXT;
 for(const name of ['c3_pose_acceptance.mjs','c4_jewelry_labels_acceptance.mjs','c4_catalog_labels_acceptance.mjs','c4_labels_acceptance.mjs']){
  const log=execFileSync(process.execPath,[join(dir,'scripts',name)],{cwd:dir,env,encoding:'utf8',maxBuffer:64*1024*1024});writeFileSync(join(out,name+'.log'),log);console.log(name,log.trim());
 }
 prepareC2HistoricalContext(dir).apply();
 const log=execFileSync(process.execPath,[join(dir,'scripts/b3_character_wardrobe_history.mjs'),join(out,'b3')],{cwd:dir,env,encoding:'utf8',maxBuffer:64*1024*1024});writeFileSync(join(out,'b3.log'),log);console.log(log);
});
console.log('C2 historical replay passed, including sealed B3/PAGE2/Phase4 history with explicit isolated DLL context.');

import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {withPreC2OutfitReplay,C2_OUTFIT_ROOT as root} from './lib/c2OutfitReplay.mjs';
const out=resolve(process.argv[2]||'/tmp/c2-outfit-history');
assert.ok(!out.startsWith(root+'/'),'History outputs must be outside checkout');mkdirSync(out,{recursive:true});
await withPreC2OutfitReplay(async dir=>{
 const env={...process.env,GIT_DIR:execFileSync('git',['-C',root,'rev-parse','--absolute-git-dir'],{encoding:'utf8'}).trim()};delete env.NODE_TEST_CONTEXT;
 for(const [name,args]of [['c2_waist_acceptance.mjs',[]],['c2_waist_history.mjs',[join(out,'waist')]]]){
  const log=execFileSync(process.execPath,[join(dir,'scripts',name),...args],{cwd:dir,env,encoding:'utf8',maxBuffer:128*1024*1024});writeFileSync(join(out,name+'.log'),log);console.log(name,log);
 }
});
console.log('C2 outfit complete historical replay passed.');

import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {withPreC2SceneOpticsReplay,C2_SCENE_OPTICS_ROOT as root} from './lib/c2SceneOpticsReplay.mjs';
const out=resolve(process.argv[2]||'/tmp/c2-scene-optics-history');assert.ok(!out.startsWith(root+'/'));mkdirSync(out,{recursive:true});
await withPreC2SceneOpticsReplay(async dir=>{
 const env={...process.env,GIT_DIR:execFileSync('git',['-C',root,'rev-parse','--absolute-git-dir'],{encoding:'utf8'}).trim()};delete env.NODE_TEST_CONTEXT;
 for(const [name,args]of [['c2_outfit_acceptance.mjs',[]],['c2_outfit_history.mjs',[join(out,'outfit')]]]){
  const log=execFileSync(process.execPath,[join(dir,'scripts',name),...args],{cwd:dir,env,encoding:'utf8',maxBuffer:128*1024*1024});writeFileSync(join(out,name+'.log'),log);console.log(name,log);
 }
});
console.log('C2 scene optics complete historical replay passed.');

import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync,mkdtempSync,cpSync,symlinkSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {preparePreC7ColorPairingFiles} from './lib/c7ColorPairingReplay.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),out=resolve(process.argv[2]||'/tmp/c7-color-history');
assert.ok(!out.startsWith(root));mkdirSync(out,{recursive:true});const dir=mkdtempSync(join(tmpdir(),'vps-c7-color-'));
try{
 mkdirSync(join(dir,'webapp'));cpSync(join(root,'webapp/src'),join(dir,'webapp/src'),{recursive:true});
 for(const p of ['package.json','package-lock.json'])cpSync(join(root,'webapp',p),join(dir,'webapp',p));
 symlinkSync(join(root,'webapp/node_modules'),join(dir,'webapp/node_modules'),'dir');
 for(const p of ['scripts','knowledge_base'])cpSync(join(root,p),join(dir,p),{recursive:true});
 symlinkSync(join(root,'Docs'),join(dir,'Docs'),'dir');preparePreC7ColorPairingFiles(dir).apply();
 const env={...process.env,GIT_DIR:execFileSync('git',['-C',root,'rev-parse','--absolute-git-dir'],{encoding:'utf8'}).trim()};delete env.NODE_TEST_CONTEXT;
 const jobs=[['night-tests',['--test',join(dir,'webapp/src/lib/engine/c7NightLighting.test.js')]],
 ...['c7_night_lighting_acceptance.mjs','c7_night_lighting_modes.mjs'].map(p=>[p,[join(dir,'scripts',p)]]),
 ['full-history',[join(dir,'scripts/c7_night_lighting_history.mjs'),join(out,'night-history')]]];
 for(const[name,args]of jobs){console.log('START',name);const log=execFileSync(process.execPath,args,{cwd:dir,env,encoding:'utf8',maxBuffer:128*1024*1024});writeFileSync(join(out,name+'.log'),log);console.log('PASS',name);}
}finally{rmSync(dir,{recursive:true,force:true});}
console.log('C7 color complete pre-change historical chain passed.');

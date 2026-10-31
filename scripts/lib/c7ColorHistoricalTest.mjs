// Preserve the original default-vs-custom Ximending equivalence at its last
// valid revision. The new default-only color policy intentionally separates it.
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {execFileSync} from 'node:child_process';
import {mkdirSync,mkdtempSync,cpSync,symlinkSync,rmSync} from 'node:fs';
import {join,relative} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {preparePreC7ColorPairingFiles} from './c7ColorPairingReplay.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
export function preC7ColorHistoricalTest(fileUrl){return(name,_body)=>test(name,()=>{
 const dir=mkdtempSync(join(tmpdir(),'c7-color-frozen-test-'));
 try{
  mkdirSync(join(dir,'webapp'));cpSync(join(root,'webapp/src'),join(dir,'webapp/src'),{recursive:true});
  cpSync(join(root,'webapp/package.json'),join(dir,'webapp/package.json'));symlinkSync(join(root,'webapp/node_modules'),join(dir,'webapp/node_modules'),'dir');
  for(const p of ['scripts','knowledge_base'])cpSync(join(root,p),join(dir,p),{recursive:true});symlinkSync(join(root,'Docs'),join(dir,'Docs'),'dir');
  preparePreC7ColorPairingFiles(dir).apply();
  const env={...process.env,GIT_DIR:execFileSync('git',['-C',root,'rev-parse','--absolute-git-dir'],{encoding:'utf8'}).trim()};delete env.NODE_TEST_CONTEXT;
  const pattern='^'+name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$';
  const log=execFileSync(process.execPath,['--test','--test-reporter=tap','--test-name-pattern',pattern,join(dir,relative(root,fileURLToPath(fileUrl)))],{cwd:dir,env,encoding:'utf8',maxBuffer:32*1024*1024});
  assert.match(log,/# pass 1\b/);assert.match(log,/# fail 0\b/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});}

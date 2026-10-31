import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync,mkdtempSync,cpSync,symlinkSync,rmSync,readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {preparePreC1IdentityFiles,hash} from './lib/c1IdentityReplay.mjs';
import review from './lib/c1IdentityReview.json' with {type:'json'};
const root=fileURLToPath(new URL('../',import.meta.url)),out=resolve(process.argv[2]||'/tmp/c1-identity-history');
assert.ok(!out.startsWith(root));mkdirSync(out,{recursive:true});const dir=mkdtempSync(join(tmpdir(),'vps-c1-history-'));
try{
  mkdirSync(join(dir,'webapp'));cpSync(join(root,'webapp/src'),join(dir,'webapp/src'),{recursive:true});
  for(const p of ['package.json','package-lock.json'])cpSync(join(root,'webapp',p),join(dir,'webapp',p));
  symlinkSync(join(root,'webapp/node_modules'),join(dir,'webapp/node_modules'),'dir');
  for(const p of ['scripts','knowledge_base'])cpSync(join(root,p),join(dir,p),{recursive:true});symlinkSync(join(root,'Docs'),join(dir,'Docs'),'dir');
  preparePreC1IdentityFiles(dir).apply();assert.equal(hash(readFileSync(join(dir,review.path))),review.beforeHash);
  assert.equal(hash(execFileSync('git',['show',review.baseCommit+':'+review.path],{cwd:root})),review.beforeHash);
  const env={...process.env,GIT_DIR:execFileSync('git',['-C',root,'rev-parse','--absolute-git-dir'],{encoding:'utf8'}).trim()};delete env.NODE_TEST_CONTEXT;
  const jobs=[['pre-c1-identity-tests',['--test',join(dir,'webapp/src/lib/characterCardLab.test.js'),join(dir,'webapp/src/lib/characterWardrobeSources.test.js')]],
    ...['c7_capture_pairing_acceptance.mjs','c7_capture_pairing_integration.mjs'].map(p=>[p,[join(dir,'scripts',p)]]),
    ['full-history',[join(dir,'scripts/c7_capture_pairing_history.mjs'),join(out,'c7-history')]]];
  for(const[name,args]of jobs){console.log('START',name);const log=execFileSync(process.execPath,args,{cwd:dir,env,encoding:'utf8',maxBuffer:128*1024*1024});writeFileSync(join(out,name+'.log'),log);console.log('PASS',name);}
}finally{rmSync(dir,{recursive:true,force:true});}
console.log('C1 exact pre-change source and complete C7 / C2 / C3 / C4 / B3 / PAGE2 / Phase4 history passed.');

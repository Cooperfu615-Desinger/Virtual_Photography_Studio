// Only the isolated C2 historical runner needs this already-shipped DLL context.
// No product code, old oracle or historical assertion is changed.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,realpathSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {C2_WAIST_ROOT as root} from './c2WaistReplay.mjs';
import context from './c2WaistHistoryContext.json' with {type:'json'};
const hash=s=>createHash('sha256').update(s).digest('hex');
export function prepareC2HistoricalContext(dir){
 assert.notEqual(realpathSync(dir),realpathSync(root),'C2 historical context requires isolated copy');
 assert.ok(!existsSync(join(dir,'.git')),'C2 historical context rejects checkout');
 const sources=new Map();
 for(const f of context.files){
  const current=readFileSync(join(dir,f.path));assert.ok([f.beforeHash,f.afterHash].includes(hash(current)),'C2 historical context rejects unknown source: '+f.path);
  const before=execFileSync('git',['-C',root,'show',context.beforeCommit+':'+f.path],{maxBuffer:16*1024*1024});assert.equal(hash(before),f.beforeHash,'Historical context oracle mismatch');sources.set(f.path,before);
 }
 return {sources,apply(){for(const [p,s]of sources)writeFileSync(join(dir,p),s);}};
}

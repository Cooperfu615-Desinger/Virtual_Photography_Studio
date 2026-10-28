// Exact, atomic test-only inverse. Historical evidence is never re-recorded.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync,realpathSync,rmSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
export const PHASE4_ROOT=fileURLToPath(new URL('../../',import.meta.url));
export const PHASE4_REVIEW=JSON.parse(readFileSync(new URL('./phase4Patches.json',import.meta.url)));
const hash=value=>createHash('sha256').update(value).digest('hex');
export function prePhase4Source(path,source){
 const file=PHASE4_REVIEW.files.find(f=>f.path===path);if(!file)return source;
 const sha=hash(source);if(sha!==file.afterHash)return source;
 assert.equal(hash(file.beforeSource),file.beforeHash,'Phase 4 inverse invalid fixed source');
 return Buffer.isBuffer(source)?Buffer.from(file.beforeSource):file.beforeSource;
}
export function prePhase4Json(path,value){
 return JSON.parse(prePhase4Source(path,JSON.stringify(value,null,2)+'\n'));
}
export function restorePrePhase4Files(directory){
 assert.notEqual(realpathSync(directory),realpathSync(PHASE4_ROOT),'Phase 4 inverse requires isolated copy');
 assert.ok(!existsSync(join(directory,'.git')),'Phase 4 inverse rejects Git checkout');
 const prepared=[],states=[];
 for(const file of PHASE4_REVIEW.files){
  const path=join(directory,file.path);assert.ok(existsSync(path),'Phase 4 inverse missing source');
  const source=readFileSync(path);assert.ok([file.beforeHash,file.afterHash].includes(hash(source)),'Phase 4 inverse rejects unknown source: '+file.path);prepared.push([path,prePhase4Source(file.path,source)]);
  states.push(hash(source)===file.afterHash?'after':'before');
 }
 assert.equal(new Set(states).size,1,'Phase 4 inverse rejects mixed sources');
 const after=states[0]==='after';
 for(const [path,sha]of Object.entries(PHASE4_REVIEW.newFiles)){
  assert.equal(existsSync(join(directory,path)),after,'Phase 4 inverse rejects missing/mixed tests');
  if(after)assert.equal(hash(readFileSync(join(directory,path))),sha,'Phase 4 inverse rejects changed test');
 }
 if(!after)return;
 for(const [path,bytes]of prepared)writeFileSync(path,bytes);
 for(const path of Object.keys(PHASE4_REVIEW.newFiles))rmSync(join(directory,path));
}

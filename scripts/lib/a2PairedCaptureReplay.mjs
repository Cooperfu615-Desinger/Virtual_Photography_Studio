// Exact, atomic test-only inverse. Historical evidence is never re-recorded.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync,realpathSync,rmSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
export const PAIRED_CAPTURE_ROOT=fileURLToPath(new URL('../../',import.meta.url));
export const PAIRED_CAPTURE_REVIEW=JSON.parse(readFileSync(new URL('./a2PairedCapturePatches.json',import.meta.url)));
const hash=value=>createHash('sha256').update(value).digest('hex');
export function prePairedCaptureSource(path,source){
 const file=PAIRED_CAPTURE_REVIEW.files.find(f=>f.path===path);if(!file)return source;
 const sha=hash(source);assert.ok(sha===file.beforeHash||sha===file.afterHash,'Paired capture inverse rejects unknown source: '+path);
 assert.equal(hash(file.beforeSource),file.beforeHash,'Paired capture inverse invalid fixed source');
 return Buffer.isBuffer(source)?Buffer.from(file.beforeSource):file.beforeSource;
}
export function restorePreA2PairedCaptureFiles(directory){
 assert.notEqual(realpathSync(directory),realpathSync(PAIRED_CAPTURE_ROOT),'Paired capture inverse requires isolated copy');
 assert.ok(!existsSync(join(directory,'.git')),'Paired capture inverse rejects Git checkout');
 const prepared=[],states=[];
 for(const file of PAIRED_CAPTURE_REVIEW.files){
  const path=join(directory,file.path);assert.ok(existsSync(path),'Paired capture inverse missing source');
  const source=readFileSync(path);prepared.push([path,prePairedCaptureSource(file.path,source)]);
  states.push(hash(source)===file.afterHash?'after':'before');
 }
 assert.equal(new Set(states).size,1,'Paired capture inverse rejects mixed sources');
 const after=states[0]==='after';
 for(const [path,sha]of Object.entries(PAIRED_CAPTURE_REVIEW.newTests)){
  assert.equal(existsSync(join(directory,path)),after,'Paired capture inverse rejects missing/mixed tests');
  if(after)assert.equal(hash(readFileSync(join(directory,path))),sha,'Paired capture inverse rejects changed test');
 }
 if(!after)return;
 for(const [path,bytes]of prepared)writeFileSync(path,bytes);
 for(const path of Object.keys(PAIRED_CAPTURE_REVIEW.newTests))rmSync(join(directory,path));
}

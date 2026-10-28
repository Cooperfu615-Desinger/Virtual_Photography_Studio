// Exact, atomic test-only inverse. Historical evidence is never re-recorded.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync,realpathSync,rmSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
export const LEGACY_DRESS_PROSE_ROOT=fileURLToPath(new URL('../../',import.meta.url));
export const LEGACY_DRESS_PROSE_REVIEW=JSON.parse(readFileSync(new URL('./a2LegacyDressProsePatches.json',import.meta.url)));
const hash=value=>createHash('sha256').update(value).digest('hex');
export function preLegacyDressProseSource(path,source){
 const file=LEGACY_DRESS_PROSE_REVIEW.files.find(f=>f.path===path);if(!file)return source;
 const sha=hash(source);assert.ok(sha===file.beforeHash||sha===file.afterHash,'Legacy dress prose inverse rejects unknown source: '+path);
 assert.equal(hash(file.beforeSource),file.beforeHash,'Legacy dress prose inverse invalid fixed source');
 return Buffer.isBuffer(source)?Buffer.from(file.beforeSource):file.beforeSource;
}
export function restorePreA2LegacyDressProseFiles(directory){
 assert.notEqual(realpathSync(directory),realpathSync(LEGACY_DRESS_PROSE_ROOT),'Legacy dress prose inverse requires isolated copy');
 assert.ok(!existsSync(join(directory,'.git')),'Legacy dress prose inverse rejects Git checkout');
 const prepared=[],states=[];
 for(const file of LEGACY_DRESS_PROSE_REVIEW.files){
  const path=join(directory,file.path);assert.ok(existsSync(path),'Legacy dress prose inverse missing source');
  const source=readFileSync(path);prepared.push([path,preLegacyDressProseSource(file.path,source)]);
  states.push(hash(source)===file.afterHash?'after':'before');
 }
 assert.equal(new Set(states).size,1,'Legacy dress prose inverse rejects mixed sources');
 const after=states[0]==='after';
 for(const [path,sha]of Object.entries(LEGACY_DRESS_PROSE_REVIEW.newFiles)){
  assert.equal(existsSync(join(directory,path)),after,'Legacy dress prose inverse rejects missing/mixed tests');
  if(after)assert.equal(hash(readFileSync(join(directory,path))),sha,'Legacy dress prose inverse rejects changed test');
 }
 if(!after)return;
 for(const [path,bytes]of prepared)writeFileSync(path,bytes);
 for(const path of Object.keys(LEGACY_DRESS_PROSE_REVIEW.newFiles))rmSync(join(directory,path));
}

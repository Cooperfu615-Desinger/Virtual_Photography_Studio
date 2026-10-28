import {prePhase4Source} from './phase4Replay.mjs';
// Exact, atomic test-only inverse. Historical evidence is never re-recorded.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync,realpathSync,rmSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
export const CHEST_DRESS_REGION_ROOT=fileURLToPath(new URL('../../',import.meta.url));
export const CHEST_DRESS_REGION_REVIEW=JSON.parse(readFileSync(new URL('./a2ChestDressRegionPatches.json',import.meta.url)));
const hash=value=>createHash('sha256').update(value).digest('hex');
export function preChestDressRegionSource(path,source){
 const file=CHEST_DRESS_REGION_REVIEW.files.find(f=>f.path===path);
 if(!file||hash(source)!==file.beforeHash)source=prePhase4Source(path,source);
 if(!file)return source;
 const sha=hash(source);assert.ok(sha===file.beforeHash||sha===file.afterHash,'Chest dress region inverse rejects unknown source: '+path);
 assert.equal(hash(file.beforeSource),file.beforeHash,'Chest dress region inverse invalid fixed source');
 return Buffer.isBuffer(source)?Buffer.from(file.beforeSource):file.beforeSource;
}
export function restorePreChestDressRegionFiles(directory){
 assert.notEqual(realpathSync(directory),realpathSync(CHEST_DRESS_REGION_ROOT),'Chest dress region inverse requires isolated copy');
 assert.ok(!existsSync(join(directory,'.git')),'Chest dress region inverse rejects Git checkout');
 const prepared=[],states=[];
 for(const file of CHEST_DRESS_REGION_REVIEW.files){
  const path=join(directory,file.path);assert.ok(existsSync(path),'Chest dress region inverse missing source');
  const source=readFileSync(path);prepared.push([path,preChestDressRegionSource(file.path,source)]);
  states.push(hash(source)===file.afterHash?'after':'before');
 }
 assert.equal(new Set(states).size,1,'Chest dress region inverse rejects mixed sources');
 const after=states[0]==='after';
 for(const [path,sha]of Object.entries(CHEST_DRESS_REGION_REVIEW.newFiles)){
  assert.equal(existsSync(join(directory,path)),after,'Chest dress region inverse rejects missing/mixed tests');
  if(after)assert.equal(hash(readFileSync(join(directory,path))),sha,'Chest dress region inverse rejects changed test');
 }
 if(!after)return;
 for(const [path,bytes]of prepared)writeFileSync(path,bytes);
 for(const path of Object.keys(CHEST_DRESS_REGION_REVIEW.newFiles))rmSync(join(directory,path));
}

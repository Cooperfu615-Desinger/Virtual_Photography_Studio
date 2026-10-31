// Test-only inverse for the two approved identity anchors. Never a runtime migration.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,realpathSync,existsSync,lstatSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import review from './c1IdentityReview.json' with {type:'json'};
import testPatches from './c1IdentityTestPatches.json' with {type:'json'};
export const C1_ROOT=fileURLToPath(new URL('../../',import.meta.url));
export const hash=value=>createHash('sha256').update(value).digest('hex');
export function preC1IdentitySource(path,source) {
  const patch=testPatches.files.find(p=>p.path===path);
  if(patch){
    if(hash(source)===patch.afterHash){assert.equal(hash(patch.beforeSource),patch.beforeHash,'C1 corrupt test oracle');return Buffer.isBuffer(source)?Buffer.from(patch.beforeSource):patch.beforeSource;}
    assert.ok(!source.toString().includes('preC1IdentityHistoricalTest'),'C1 inverse rejects unknown test wrapper');
    return source;
  }
  if(path!==review.path)return source;
  const text=source.toString(),sha=hash(source);
  if(sha===review.beforeHash)return source;
  if(sha!==review.afterHash){
    assert.ok(review.rows.every(r=>!text.includes(r.after)),'C1 inverse rejects unknown or mixed source');
    return source; // Earlier sealed revisions remain the earlier replay's responsibility.
  }
  let before=text;
  for(const row of review.rows){assert.equal(before.split(row.after).length,2,'C1 inverse requires unique anchor');before=before.replace(row.after,row.before);}
  assert.equal(hash(before),review.beforeHash,'C1 inverse must reproduce exact trusted Git bytes');
  return Buffer.isBuffer(source)?Buffer.from(before):before;
}
export function preparePreC1IdentityFiles(directory,{allowEarlier=false}={}) {
  const resolved=realpathSync(directory);
  assert.notEqual(resolved,realpathSync(C1_ROOT),'C1 inverse requires isolated copy');
  assert.ok(!existsSync(join(directory,'.git')),'C1 inverse rejects Git checkout');
  assert.ok(allowEarlier||existsSync(join(directory,review.path)),'C1 inverse missing source');
  const sources=new Map(),states=[];
  for(const item of [review,...testPatches.files]){
    const path=join(directory,item.path);if(!existsSync(path))continue;
    assert.ok(!lstatSync(path).isSymbolicLink()&&realpathSync(path).startsWith(resolved+'/'),'C1 inverse rejects linked source');
    const source=readFileSync(path),sha=hash(source);
    if(!allowEarlier)assert.ok([item.beforeHash,item.afterHash].includes(sha),'C1 inverse rejects unknown or mixed source');
    states.push(sha===item.afterHash?'after':'before');
    const before=preC1IdentitySource(item.path,source);
    if(!source.equals(before))sources.set(item.path,before);
  }
  if(!allowEarlier)assert.ok(new Set(states).size<=1,'C1 inverse rejects mixed source stages');
  return {sources,apply(){for(const [p,s]of sources)writeFileSync(join(directory,p),s);}};
}

// Test-only exact inverse for the reviewed outdoor leaning extension.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import review from './outdoorLeanHistory.json' with {type:'json'};
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export const outdoorLeanHistoricalPaths=review.files.map(file=>file.path);
export function preOutdoorLeanSource(path,source){
  const file=review.files.find(item=>item.path===path);
  if(!file||hash(source)!==file.afterHash){
    if(path==='webapp/src/lib/engine/indoorLeaning.js')assert.ok(!source.toString().includes('import outdoorScenes'),'Outdoor lean inverse rejects unknown leaning model');
    return source;
  }
  const lines=source.toString().match(/[^\n]*\n|[^\n]+$/g)||[];
  for(const {line,after,before} of [...file.edits].reverse()){
    assert.deepEqual(lines.slice(line,line+after.length),after,path);lines.splice(line,after.length,...before);
  }
  const original=lines.join('');assert.equal(hash(original),file.beforeHash,path);
  return Buffer.isBuffer(source)?Buffer.from(original):original;
}

// Test-only exact inverse for the reviewed optional indoor kneeling extension.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import review from './indoorKneelHistory.json' with {type:'json'};
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export const indoorKneelHistoricalPaths=review.files.map(file=>file.path);
export function preIndoorKneelSource(path,source){
 const file=review.files.find(item=>item.path===path);
 if(!file||hash(source)!==file.afterHash){
  if(file&&path.startsWith('webapp/'))assert.ok(!source.toString().includes('indoorKneel'),path==='webapp/src/lib/engine.js'?'Indoor kneel inverse rejects unknown current engine':'Indoor kneel inverse rejects unreviewed source');
  return source;
 }
 const lines=source.toString().match(/[^\n]*\n|[^\n]+$/g)||[];
 for(const {line,after,before} of [...file.edits].reverse()){assert.deepEqual(lines.slice(line,line+after.length),after,path);lines.splice(line,after.length,...before);}
 const original=lines.join('');assert.equal(hash(original),file.beforeHash,path);return Buffer.isBuffer(source)?Buffer.from(original):original;
}

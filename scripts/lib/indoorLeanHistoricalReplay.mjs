// Test-only exact inverse. Unknown/mixed bytes remain unchanged for the existing
// downstream historical boundaries to reject. Never imported by product code.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import review from './indoorLeanHistory.json' with {type:'json'};
import { outdoorSeatHistoricalPaths, preOutdoorSeatSource } from './outdoorSeatHistoricalReplay.mjs';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export const indoorLeanHistoricalPaths=[...new Set([...outdoorSeatHistoricalPaths,...review.files.map(file=>file.path)])];
export function preIndoorLeanSource(path,source) {
  source=preOutdoorSeatSource(path,source);
  const file=review.files.find(item=>item.path===path);
  if(!file || hash(source)!==file.afterHash) return source;
  const lines=source.toString().match(/[^\n]*\n|[^\n]+$/g)||[];
  for(const {line,after,before} of [...file.edits].reverse()) {
    assert.deepEqual(lines.slice(line,line+after.length),after,path);
    lines.splice(line,after.length,...before);
  }
  const original=lines.join('');
  assert.equal(hash(original),file.beforeHash,path);
  return Buffer.isBuffer(source)?Buffer.from(original):original;
}

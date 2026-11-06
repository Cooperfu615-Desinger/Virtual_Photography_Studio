// Test-only inverse. Runtime product code never reads or imports this module.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, lstatSync, mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import review from './outdoorSeatHistory.json' with {type:'json'};
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const root=fileURLToPath(new URL('../../',import.meta.url));
export const outdoorSeatHistoricalPaths=review.files.map(file=>file.path);

export function preOutdoorSeatSource(path,source) {
  const file=review.files.find(item=>item.path===path);
  if(!file || hash(source)!==file.afterHash) {
    if(path==='webapp/src/lib/engine/indoorSeating.js') assert.ok(!source.toString().includes("import outdoorScenes"),'Outdoor seat inverse rejects unknown seating model');
    return source;
  }
  const lines=source.toString().match(/[^\n]*\n|[^\n]+$/g)||[];
  for(const {line,after,before} of [...file.edits].reverse()) {
    assert.deepEqual(lines.slice(line,line+after.length),after,path);
    lines.splice(line,after.length,...before);
  }
  const original=lines.join('');assert.equal(hash(original),file.beforeHash,path);
  return Buffer.isBuffer(source)?Buffer.from(original):original;
}

export function preparePreOutdoorSeatFiles(directory) {
  const dir=realpathSync(directory);
  assert.notEqual(dir,realpathSync(root),'Outdoor seat inverse requires isolated copy');
  assert.ok(!existsSync(join(dir,'.git')),'Outdoor seat inverse rejects Git checkout');
  const sources=new Map();
  for(const path of outdoorSeatHistoricalPaths) {
    const file=join(dir,path);if(!existsSync(file)) continue;
    assert.ok(!lstatSync(file).isSymbolicLink()&&realpathSync(file).startsWith(dir+'/'),'Outdoor seat inverse rejects linked source');
    const raw=readFileSync(file),before=preOutdoorSeatSource(path,raw);
    if(raw!==before) sources.set(path,before);
  }
  return {sources,apply(){for(const [path,bytes] of sources) writeFileSync(join(dir,path),bytes);}};
}

/** Run the original immutable baseline against original model bytes, without a
 * live checkout mutation, runtime feature flag or rewritten historical JSON. */
export function withPreOutdoorSeatRuntime(callback) {
  const dir=mkdtempSync(join(tmpdir(),'pre-outdoor-seat-'));
  try {
    mkdirSync(join(dir,'webapp'));
    cpSync(join(root,'webapp/src'),join(dir,'webapp/src'),{recursive:true});
    cpSync(join(root,'webapp/package.json'),join(dir,'webapp/package.json'));
    preparePreOutdoorSeatFiles(dir).apply();
    return callback(join(dir,'webapp'));
  } finally {rmSync(dir,{recursive:true,force:true});}
}

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import review from './outdoorSeatHistory.json' with {type:'json'};
import { preOutdoorSeatSource, preparePreOutdoorSeatFiles, withPreOutdoorSeatRuntime } from './outdoorSeatHistoricalReplay.mjs';
import { preOutdoorLeanSource } from './outdoorLeanHistoricalReplay.mjs';
const root=new URL('../../',import.meta.url),hash=bytes=>createHash('sha256').update(bytes).digest('hex');
test('only exact approved bytes restore the pre-outdoor sources and match original Git blobs',()=>{
  for(const file of review.files) {
    const after=preOutdoorLeanSource(file.path,readFileSync(new URL(file.path,root)));assert.equal(hash(after),file.afterHash,file.path);
    const before=preOutdoorSeatSource(file.path,after);
    assert.deepEqual(before,execFileSync('git',['show',review.base+':'+file.path],{cwd:fileURLToPath(root),maxBuffer:16*1024*1024}));
    assert.equal(preOutdoorSeatSource(file.path,before),before);
    assert.equal(preOutdoorSeatSource(file.path,after.toString()),before.toString());
  }
});
test('live checkout and mixed model bytes cannot bypass the historical boundary',()=>{
  assert.throws(()=>preparePreOutdoorSeatFiles(fileURLToPath(root)),/isolated copy/);
  const path='webapp/src/lib/engine/indoorSeating.js',raw=readFileSync(new URL(path,root));
  assert.throws(()=>preOutdoorSeatSource(path,Buffer.concat([raw,Buffer.from('\n// unknown\n')])),/rejects unknown seating model/);
  withPreOutdoorSeatRuntime(cwd=>{
    const file=join(cwd,'src/lib/engine/indoorSeating.js'),before=readFileSync(file);
    assert.equal(hash(before),review.files.find(f=>f.path===path).beforeHash);
    writeFileSync(file,raw);assert.equal(preparePreOutdoorSeatFiles(join(cwd,'..')).sources.size,1);
    writeFileSync(file,Buffer.concat([raw,Buffer.from('\n// unknown\n')]));
    assert.throws(()=>preparePreOutdoorSeatFiles(join(cwd,'..')),/rejects unknown seating model/);
  });
});

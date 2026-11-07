import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import review from './outdoorLeanHistory.json' with {type:'json'};
import { preOutdoorLeanSource } from './outdoorLeanHistoricalReplay.mjs';
import {preIndoorKneelSource} from './indoorKneelHistoricalReplay.mjs';
import { preOutdoorSeatSource } from './outdoorSeatHistoricalReplay.mjs';
const root=new URL('../../',import.meta.url),hash=bytes=>createHash('sha256').update(bytes).digest('hex');
test('reviewed outdoor lean sources restore exact original Git bytes and remain idempotent',()=>{
  for(const file of review.files){
    const after=preIndoorKneelSource(file.path,readFileSync(new URL(file.path,root)));assert.equal(hash(after),file.afterHash,file.path);
    const before=preOutdoorLeanSource(file.path,after);
    assert.deepEqual(before,execFileSync('git',['show',review.base+':'+file.path],{cwd:fileURLToPath(root),maxBuffer:16*1024*1024}));
    assert.equal(preOutdoorLeanSource(file.path,before),before);
    assert.equal(preOutdoorLeanSource(file.path,after.toString()),before.toString());
  }
});
test('unknown current leaning model cannot bypass either historical boundary',()=>{
  const path='webapp/src/lib/engine/indoorLeaning.js',raw=readFileSync(new URL(path,root));
  const unknown=Buffer.concat([raw,Buffer.from('\n// unreviewed\n')]);
  assert.throws(()=>preOutdoorLeanSource(path,unknown),/rejects unknown leaning model/);
  assert.throws(()=>preOutdoorSeatSource(path,unknown),/rejects unknown leaning model/);
  assert.equal(preOutdoorLeanSource('unknown',raw),raw);
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import review from './indoorLeanHistory.json' with {type:'json'};
import { preIndoorLeanSource } from './indoorLeanHistoricalReplay.mjs';
import { preGrokImagineSource } from './grokImagineHistoricalReplay.mjs';
import { preOutdoorSeatSource } from './outdoorSeatHistoricalReplay.mjs';
import {preIndoorKneelSource} from './indoorKneelHistoricalReplay.mjs';
const root=new URL('../../',import.meta.url);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
test('reviewed leaning sources restore the approved pre-lean bytes and inverse is idempotent',()=>{
  for(const file of review.files) {
    const after=preOutdoorSeatSource(file.path,readFileSync(new URL(file.path,root)));
    assert.equal(hash(after),file.afterHash,file.path);
    const before=preIndoorLeanSource(file.path,after);
    assert.equal(hash(before),file.beforeHash,file.path);
    assert.equal(preIndoorLeanSource(file.path,before),before);
    assert.equal(preIndoorLeanSource(file.path,after.toString()),before.toString());
  }
});
test('mixed or corrupted current engine cannot bypass the existing historical boundary',()=>{
  const path='webapp/src/lib/engine.js',raw=preIndoorKneelSource(path,readFileSync(new URL(path,root)));
  const modified=Buffer.concat([raw,Buffer.from('\n// unreviewed change\n')]);
  assert.equal(preIndoorLeanSource(path,modified),modified);
  assert.throws(()=>preGrokImagineSource(path,modified),/rejects unknown current engine/);
  assert.equal(preIndoorLeanSource('unknown',raw),raw);
});

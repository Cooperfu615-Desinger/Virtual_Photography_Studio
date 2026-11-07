import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import restore from './indoorSeatRestoreHistory.json' with {type:'json'};
import review from './indoorSeatHistory.json' with {type:'json'};
import { preIndoorSeatSource } from './indoorSeatHistoricalReplay.mjs';
import {preIndoorKneelSource} from './indoorKneelHistoricalReplay.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
test('only reviewed seat changes replay to original Git bytes, including the first released engine',()=>{
  for(const file of review.files) {
    const current=readFileSync(new URL('../../'+file.path,import.meta.url));
    const before=execFileSync('git',['show',review.base+':'+file.path],{cwd:root,maxBuffer:16*1024*1024});
    assert.deepEqual(preIndoorSeatSource(file.path,current),before);
    const corrupt=Buffer.concat([preIndoorKneelSource(file.path,current),Buffer.from('// unknown')]);
    assert.equal(preIndoorSeatSource(file.path,corrupt),corrupt);
    assert.deepEqual(preIndoorSeatSource(file.path,before),before);
  }
});
test('the released pre-restore seat engine also reproduces the pre-feature baseline',()=>{
  for (const {path} of restore.files) {
    const bytesAt = ref => execFileSync('git',['show',ref+':'+path],{cwd:root,maxBuffer:16*1024*1024});
    const current = readFileSync(new URL('../../'+path,import.meta.url));
    assert.deepEqual(preIndoorSeatSource(path,current),bytesAt(review.base));
    assert.deepEqual(preIndoorSeatSource(path,bytesAt(restore.base)),bytesAt(review.base));
  }
});

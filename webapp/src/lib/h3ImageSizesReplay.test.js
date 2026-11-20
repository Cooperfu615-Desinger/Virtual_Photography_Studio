import { Buffer } from 'node:buffer';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { preH3ImageSizesSource } from '../../../scripts/lib/h3ImageSizesReplay.mjs';
import review from '../../../scripts/lib/h3ImageSizesReplay.json' with { type: 'json' };
test('H3 Image dimensions inverse returns exact pre-change Git bytes and leaves unknown changes for rejection',()=>{
 for(const file of review.files){
  const current=readFileSync(new URL('../../../'+file.path,import.meta.url));
  const original=execFileSync('git',['show',`${review.baseCommit}:${file.path}`]);
  assert.deepEqual(preH3ImageSizesSource(file.path,current),original);
  const unknown=Buffer.concat([current,Buffer.from('corrupt')]);
  assert.deepEqual(preH3ImageSizesSource(file.path,unknown),unknown);
 }
});

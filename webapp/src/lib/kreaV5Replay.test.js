import { Buffer } from 'node:buffer';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { preKreaV5Source } from '../../../scripts/lib/kreaV5Replay.mjs';
import review from '../../../scripts/lib/kreaV5Replay.json' with { type: 'json' };
test('Krea V5 LoRA inverse returns exact pre-change Git bytes and leaves unknown changes for rejection',()=>{
 for(const file of review.files){
  const current=readFileSync(new URL('../../../'+file.path,import.meta.url));
  const original=execFileSync('git',['show',`${review.baseCommit}:${file.path}`]);
  assert.deepEqual(preKreaV5Source(file.path,current),original);
  const unknown=Buffer.concat([current,Buffer.from('corrupt')]);
  assert.deepEqual(preKreaV5Source(file.path,unknown),unknown);
 }
});

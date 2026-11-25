import { preKreaV5Source } from '../../../scripts/lib/kreaV5Replay.mjs';
import { preOmniRemovalSource } from '../../../scripts/lib/omniRemovalReplay.mjs';
import { preH3ImageSizesSource } from '../../../scripts/lib/h3ImageSizesReplay.mjs';
import { Buffer } from 'node:buffer';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { preSeedream55Source } from '../../../scripts/lib/seedream55Replay.mjs';
import review from '../../../scripts/lib/seedream55Replay.json' with { type: 'json' };
test('Seedream 5.5 inverse returns exact pre-change Git bytes and leaves unknown changes for rejection',()=>{
 for(const file of review.files){
  const current=readFileSync(new URL('../../../'+file.path,import.meta.url));
  const original=execFileSync('git',['show',`${review.baseCommit}:${file.path}`]);
  assert.deepEqual(preSeedream55Source(file.path,preH3ImageSizesSource(file.path,preKreaV5Source(file.path,preOmniRemovalSource(file.path,current)))),original);
  const unknown=Buffer.concat([current,Buffer.from('corrupt')]);
  assert.deepEqual(preSeedream55Source(file.path,unknown),unknown);
 }
});

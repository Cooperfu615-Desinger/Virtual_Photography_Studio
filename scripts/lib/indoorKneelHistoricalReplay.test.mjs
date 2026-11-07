import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import review from './indoorKneelHistory.json' with {type:'json'};
import {preIndoorKneelSource} from './indoorKneelHistoricalReplay.mjs';
import {preOutdoorLeanSource} from './outdoorLeanHistoricalReplay.mjs';
import { preUnderlayerSource } from './manualUnderlayerHistoricalReplay.mjs';
const root=new URL('../../',import.meta.url),hash=bytes=>createHash('sha256').update(bytes).digest('hex');
test('reviewed kneeling extension restores original Git bytes, string/buffer and idempotence',()=>{
 for(const file of review.files){const raw=preUnderlayerSource(file.path,readFileSync(new URL(file.path,root)));assert.equal(hash(raw),file.afterHash,file.path);
  const before=preIndoorKneelSource(file.path,raw);assert.deepEqual(before,execFileSync('git',['show',review.base+':'+file.path],{cwd:fileURLToPath(root),maxBuffer:16*1024*1024}));
  assert.equal(preIndoorKneelSource(file.path,before),before);assert.equal(preIndoorKneelSource(file.path,raw.toString()),before.toString());
 }
});
test('unreviewed sources reject through both kneeling and previous historical boundaries',()=>{
 for(const path of review.files.filter(f=>f.path.startsWith('webapp/')).map(f=>f.path)){const raw=readFileSync(new URL(path,root));const edited=Buffer.concat([raw,Buffer.from('\n// unreviewed\n')]);
  assert.throws(()=>preIndoorKneelSource(path,edited),/rejects (?:unreviewed source|unknown current engine)/);assert.throws(()=>preOutdoorLeanSource(path,edited),/rejects (?:unreviewed source|unknown current engine)/);
 }
 assert.equal(preIndoorKneelSource('unknown','abc'),'abc');
});

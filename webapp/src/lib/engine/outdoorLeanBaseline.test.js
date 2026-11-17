import { preLawsonTestSnapshot } from '../../../../scripts/lib/preLawsonTestSnapshot.mjs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import baseline from './outdoorLeanBaseline.json' with {type:'json'};
import protectedBaseline from './outdoorLeanProtectedBaseline.json' with {type:'json'};
import { outdoorLeanProtectedRows } from './outdoorLeanFixtures.js';
import { assertUpperBodyStateBaselineRevision } from './upperBodyStateBaselineRevisionTestSupport.js';

test('all 1686 pre-outdoor-lean fixtures keep the six existing outputs, selections and summaries',()=>{
  const current=preLawsonTestSnapshot();
    assert.equal(Object.keys(current).length,1686);assert.deepEqual(Object.keys(current),Object.keys(baseline.rows));
    for(const [key,hash] of Object.entries(baseline.rows))assert.equal(createHash('sha256').update(JSON.stringify(current[key])).digest('hex'),hash,key);
});

test('every indoor leaning choice and all outdoor sitting scenes/poses retain seven outputs and RNG at ten framings',()=>{
  assert.equal(Object.keys(protectedBaseline.rows).length,1160);
  assert.equal(Object.values(protectedBaseline.rows).reduce((sum,row)=>sum+row.samples,0),14310);
  assertUpperBodyStateBaselineRevision('outdoorLean', outdoorLeanProtectedRows(), protectedBaseline.rows);
});

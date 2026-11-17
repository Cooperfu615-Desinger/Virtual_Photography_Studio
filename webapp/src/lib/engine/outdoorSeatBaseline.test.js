import { preLawsonTestSnapshot } from '../../../../scripts/lib/preLawsonTestSnapshot.mjs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import baseline from './outdoorSeatBaseline.json' with {type:'json'};
import indoor from './outdoorSeatIndoorBaseline.json' with {type:'json'};
import { indoorSeatingRegressionRows } from './outdoorSeatFixtures.js';
import { assertUpperBodyStateBaselineRevision } from './upperBodyStateBaselineRevisionTestSupport.js';

test('all 1,686 existing six-output fixtures, selections and summaries remain byte-identical',()=>{
  const current=preLawsonTestSnapshot();
    assert.deepEqual(Object.keys(current),Object.keys(baseline.rows));assert.equal(Object.keys(current).length,1686);
    for(const [key,hash] of Object.entries(baseline.rows)) assert.equal(createHash('sha256').update(JSON.stringify(current[key])).digest('hex'),hash,key);
});

test('83 indoor scenes × 14 poses × ten framings retain unspecified/effective seats and all seven outputs',()=>{
  assert.equal(Object.keys(indoor.rows).length,1162);
  assert.equal(Object.values(indoor.rows).reduce((sum,row)=>sum+row.samples,0),18480);
  assertUpperBodyStateBaselineRevision('indoorSeating', indoorSeatingRegressionRows(), indoor.rows);
});

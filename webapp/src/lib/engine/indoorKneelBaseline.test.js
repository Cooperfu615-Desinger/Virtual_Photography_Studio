import { preLawsonTestSnapshot } from '../../../../scripts/lib/preLawsonTestSnapshot.mjs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createHash} from 'node:crypto';
import baseline from './indoorKneelBaseline.json' with {type:'json'};
import protectedBaseline from './indoorKneelProtectedBaseline.json' with {type:'json'};
import {indoorKneelProtectedRows} from './indoorKneelFixtures.js';
import { assertUpperBodyStateBaselineRevision } from './upperBodyStateBaselineRevisionTestSupport.js';
test('all 1686 pre-kneel fixtures keep existing six outputs, selections and summaries',()=>{
  const current=preLawsonTestSnapshot();assert.equal(Object.keys(current).length,1686);assert.deepEqual(Object.keys(current),Object.keys(baseline.rows));
  for(const [id,hash] of Object.entries(baseline.rows))assert.equal(createHash('sha256').update(JSON.stringify(current[id])).digest('hex'),hash,id);
});
test('17220 protected samples keep unspecified indoor kneels, all fixed and outdoor kneels and every outdoor leaning choice',()=>{
 assert.equal(Object.keys(protectedBaseline.rows).length,1528);assert.equal(Object.values(protectedBaseline.rows).reduce((n,r)=>n+r.samples,0),17220);assertUpperBodyStateBaselineRevision('indoorKneel',indoorKneelProtectedRows(),protectedBaseline.rows);
});

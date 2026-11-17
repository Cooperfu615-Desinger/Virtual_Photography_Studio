import { preLawsonTestSnapshot } from '../../../../scripts/lib/preLawsonTestSnapshot.mjs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import baseline from './indoorLeanBaseline.json' with {type:'json'};

test('all 1,642 sealed pre-lean cases retain six original outputs, selections and summaries byte for byte',()=>{
  const current=preLawsonTestSnapshot();
    assert.equal(Object.keys(baseline.rows).length,1642);
    for(const [key,hash] of Object.entries(baseline.rows)) {
      assert.ok(Object.hasOwn(current,key),key);
      assert.equal(createHash('sha256').update(JSON.stringify(current[key])).digest('hex'),hash,key);
    }
    const added=Object.keys(current).filter(key=>!Object.hasOwn(baseline.rows,key));
    assert.equal(added.length,44); // 2 actions × 11 framings (including none) × 2 seeds.
    assert.ok(added.every(key=>/^act:specified-standing-(back|shoulder)-lean:/.test(key)));
});

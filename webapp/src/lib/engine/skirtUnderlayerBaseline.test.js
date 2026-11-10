import assert from 'node:assert/strict';
import { test } from 'node:test';
import baseline from './skirtUnderlayerBaseline.json' with { type: 'json' };
import { skirtProtectedRows } from './skirtUnderlayerFixtures.js';

test('870 pre-skirt cases preserve all seven outputs, selections, structured sources and RNG', () => {
  assert.equal(baseline.base, '5c35c4e1a868ab815e1272142526e59794ab7e7e');
  assert.equal(Object.keys(baseline.rows).length, 870);
  const current = skirtProtectedRows();
  assert.deepEqual(Object.keys(current), Object.keys(baseline.rows));
  for (const [key, expected] of Object.entries(baseline.rows)) {
    assert.equal(current[key], expected, key);
  }
});

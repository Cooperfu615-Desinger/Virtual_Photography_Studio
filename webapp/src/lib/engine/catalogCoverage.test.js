import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkCoverage } from '../../../../scripts/catalog_coverage_baseline.mjs';

test('all 47 lying-surface scenes retain effective side, prone and supine orientations', async () => {
  const result = await checkCoverage();
  assert.equal(result.explicitSurfaces, 141);
  assert.equal(result.differences, 0);
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';
import { withPreA5ReplayRoot } from '../../../../scripts/lib/a5HistoricalReplay.mjs';

test('all 47 lying-surface scenes retain effective side, prone and supine orientations', async () => {
  const result = await withPreA5ReplayRoot(async repo => {
    const { checkCoverage } = await import(pathToFileURL(`${repo}/scripts/catalog_coverage_baseline.mjs`).href);
    return checkCoverage();
  });
  assert.equal(result.explicitSurfaces, 141);
  assert.equal(result.differences, 0);
});

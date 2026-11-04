import assert from 'node:assert/strict';
import baseline from './framingWardrobeMatrixInverse.json' with { type: 'json' };
import { digest } from './sceneIntegratedAssemblyTestSupport.js';

// Test-only reconstruction from independent before/after fixture runs. The
// original frozen baselines remain authoritative for all other output bytes.
export function restoreMatrixBeforeWardrobeRetention(group, fixtures, results) {
  const matrix = baseline.matrices[group];
  assert.ok(matrix, `unknown wardrobe comparison matrix: ${group}`);
  assert.equal(results.length, matrix.rows.length, `${group}: fixture count`);
  assert.equal(digest(fixtures.map(fixture => fixture.id)), matrix.idsHash, `${group}: fixture order`);
  return results.map((result, index) => {
    const descriptor = baseline.descriptors[matrix.rows[index]];
    const outputs = { ...result.outputs };
    const selection = { ...result.selection };
    for (const [field, patternIndex] of Object.entries(descriptor.outputs)) {
      const { before, after } = baseline.patterns[patternIndex];
      assert.equal(outputs[field].split(after).length - 1, 1, `${group}/${index}/${field}: exact wardrobe change`);
      outputs[field] = outputs[field].replace(after, before);
    }
    for (const [key, [before, after]] of Object.entries(baseline.selectionGroups[descriptor.selectionGroup])) {
      assert.equal(selection[key], after, `${group}/${index}/${key}: resolved wardrobe choice`);
      selection[key] = before;
    }
    assert.equal(result.randomDraws, descriptor.draws[1], `${group}/${index}: random draws`);
    return { ...result, outputs, selection, randomDraws: descriptor.draws[0] };
  });
}

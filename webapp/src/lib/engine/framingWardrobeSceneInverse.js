import assert from 'node:assert/strict';
import baseline from './framingWardrobeSceneInverse.json' with { type: 'json' };

// Test-only, fixture-specific inverse captured by comparing the original HEAD
// with this revision. Original scene hashes remain unchanged and authoritative.
export function restoreSceneWardrobeBeforeRevision(outputs, fixtureId) {
  const restored = { ...outputs };
  for (const [field, { added, removed }] of Object.entries(baseline.cases[fixtureId] || {})) {
    assert.ok(added, `${fixtureId}/${field}: empty revision fragment`);
    assert.equal(restored[field].split(added).length - 1, 1, `${fixtureId}/${field}: exact revised fragment`);
    restored[field] = restored[field].replace(added, removed);
  }
  return restored;
}

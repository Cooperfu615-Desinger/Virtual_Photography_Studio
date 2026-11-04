import baseline from './framingWardrobeNanoInverse.json' with { type: 'json' };
import { restoreCapturedFixtureRows } from './framingWardrobeInverseSupport.js';

// Exact test-only inverse independently captured from the pre-change engine.
// Text changes and resolved wardrobe metadata are checked before reconstruction.
export function restoreNanoBeforeWardrobeRetention(group, fixtures, rows) {
  return restoreCapturedFixtureRows(baseline, group, fixtures, rows);
}

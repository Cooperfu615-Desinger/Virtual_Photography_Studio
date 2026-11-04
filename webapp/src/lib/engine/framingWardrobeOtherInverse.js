import baseline from './framingWardrobeOtherInverse.json' with { type: 'json' };
import { restoreCapturedFixtureRows } from './framingWardrobeInverseSupport.js';

export function restoreOtherBeforeWardrobeRetention(group, fixtures, rows) {
  return restoreCapturedFixtureRows(baseline, group, fixtures, rows);
}

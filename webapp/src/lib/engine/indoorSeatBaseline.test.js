import assert from 'node:assert/strict';
import { test } from 'node:test';
import baseline from './indoorSeatBaseline.json' with {type:'json'};
import { seatBaselineRows } from './indoorSeatFixtures.js';

test('unselected and excluded sitting cases preserve all seven outputs, selections and draw counts', () => {
  assert.deepEqual(seatBaselineRows(), baseline.rows);
});

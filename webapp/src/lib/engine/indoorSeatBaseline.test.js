import assert from 'node:assert/strict';
import { test } from 'node:test';
import baseline from './indoorSeatBaseline.json' with {type:'json'};
import { seatBaselineRows } from './indoorSeatFixtures.js';
import { execFileSync } from 'node:child_process';
import process from 'node:process';
import { withPreOutdoorSeatRuntime } from '../../../../scripts/lib/outdoorSeatHistoricalReplay.mjs';

test('indoor cases remain current; original outdoor ground wording replays against the immutable seat baseline', () => {
  const current=seatBaselineRows();
  for(const [key,row] of Object.entries(current)) if(!key.startsWith('outdoor/')) assert.deepEqual(row,baseline.rows[key],key);
  const historical=withPreOutdoorSeatRuntime(cwd=>JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',
    'import {seatBaselineRows} from "./src/lib/engine/indoorSeatFixtures.js"; process.stdout.write(JSON.stringify(seatBaselineRows()));'],{cwd,encoding:'utf8'})));
  assert.deepEqual(historical,baseline.rows);
});

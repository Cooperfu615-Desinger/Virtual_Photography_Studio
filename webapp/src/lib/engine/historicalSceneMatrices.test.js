// One native test entry lets the three unchanged suites share test-only fixture
// results in this process. Each original file remains directly runnable.
import assert from 'node:assert/strict';
import process from 'node:process';
import { after, before, test } from 'node:test';
import { enableHistoricalSceneFixtureMemoization, runLegacySceneFixture } from './sceneIntegratedAssemblyTestSupport.js';
import { GPT_VISIBILITY_ALL } from './gptSceneVisibilityFixtures.js';
import './closeWormEye.test.js';
import './gptCameraSpatial.test.js';
import './gptSceneVisibility.test.js';

let stopMemoization;
before(() => {
  stopMemoization = enableHistoricalSceneFixtureMemoization();
});
after(context => {
  try {
    const statistics = stopMemoization.statistics();
    const filtered = process.execArgv.some(argument => /^--test-(?:name-pattern|skip-pattern|only)(?:=|$)/.test(argument));
    if (!filtered) {
      assert.ok(statistics.generations >= 6370, 'all 6,370 unique frozen fixtures must execute');
      assert.ok(statistics.hits >= 11934, 'the 11,934 overlapping frozen fixtures must reuse this run\'s results');
    }
    context.diagnostic(`historical scene fixture reuse: ${statistics.generations} generations, ${statistics.hits} hits`);
  } finally {
    stopMemoization();
  }
});

test('historical scene fixture reuse stays enabled across original suite registration', () => {
  const fixture = GPT_VISIBILITY_ALL[0];
  const initial = stopMemoization.statistics();
  const first = runLegacySceneFixture(fixture);
  const second = runLegacySceneFixture(fixture);
  const final = stopMemoization.statistics();
  assert.deepEqual(second, first);
  assert.equal(final.generations + final.hits, initial.generations + initial.hits + 2,
    'both calls must go through the actual historical scene memo');
  assert.ok(final.hits > initial.hits, 'the repeated fixture must hit the actual memo');
  assert.ok(final.generations - initial.generations <= 1, 'same-fixture replay must not generate twice');
});

// One native test entry lets the three unchanged suites share test-only fixture
// results in this process. Each original file remains directly runnable.
import assert from 'node:assert/strict';
import process from 'node:process';
import { after, test } from 'node:test';
import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { openPreA1ReplayRoot } from '../../../../scripts/lib/a1AdultIdentityHistoricalReplay.mjs';

// Keep the original shared 6,370-fixture / 11,934-hit gate in one isolated
// pre-A1 graph. Splitting the three frozen suites would invalidate that gate.
const replay = openPreA1ReplayRoot();
const load = file => import(pathToFileURL(`${replay.directory}/webapp/src/lib/engine/${file}`).href);
const { enableHistoricalSceneFixtureMemoization, runLegacySceneFixture } = await load('sceneIntegratedAssemblyTestSupport.js');
const { GPT_VISIBILITY_ALL } = await load('gptSceneVisibilityFixtures.js');
// Enable before asynchronous suite imports can register and start any tests.
const stopMemoization = enableHistoricalSceneFixtureMemoization();
const previousReplayRoot = process.env.VPS_A1_REPLAY_ROOT;
try {
  process.env.VPS_A1_REPLAY_ROOT = realpathSync(replay.directory);
  await load('closeWormEye.test.js');
  await load('gptCameraSpatial.test.js');
  await load('gptSceneVisibility.test.js');
} finally {
  if (previousReplayRoot === undefined) delete process.env.VPS_A1_REPLAY_ROOT;
  else process.env.VPS_A1_REPLAY_ROOT = previousReplayRoot;
}

after(context => {
  try {
    const statistics = stopMemoization.statistics();
    context.diagnostic(`historical scene fixture reuse: ${statistics.generations} generations, ${statistics.hits} hits`);
    const filtered = process.execArgv.some(argument => /^--test-(?:name-pattern|skip-pattern|only)(?:=|$)/.test(argument));
    if (!filtered) {
      assert.ok(statistics.generations >= 6370, 'all 6,370 unique frozen fixtures must execute');
      assert.ok(statistics.hits >= 11934, 'the 11,934 overlapping frozen fixtures must reuse this run\'s results');
    }
  } finally {
    stopMemoization();
    replay.cleanup();
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

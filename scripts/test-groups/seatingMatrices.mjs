import assert from 'node:assert/strict';
import { after } from 'node:test';
import process from 'node:process';
import { getSceneDependentOptions } from '../../webapp/src/lib/engine.js';
import { seatFramings } from '../../webapp/src/lib/engine/indoorSeatFixtures.js';
import { SPECIFIED_ACTION_CONCRETE_OPTIONS } from '../../webapp/src/lib/engine/specifiedActions.js';
import scenes from '../../webapp/src/lib/engine/outdoorLeanScenes.json' with { type: 'json' };
import { enableSeatFixtureReuse, seatRequestKey } from '../../webapp/src/lib/engine/seatFixtureReuseTestSupport.js';
import { createTestProgress } from '../lib/testRunContext.mjs';
import { fileURLToPath } from 'node:url';

const places = attribute => getSceneDependentOptions([], {subjectCount:'1',sceneAttributeId:attribute}).locationOptions.filter(o => o.zh !== '全無' && !o.zh.includes('日本 Lawson 便利商店'));
// Retain only cases known to be consumed again. One producer call lives in the
// original protected matrix; all later consumers still run their own assertions.
const plan = new Map();
const consume = (place, action, frame, patch = {}) => {
  const key = seatRequestKey(place, action, frame, patch);
  plan.set(key, (plan.get(key) || 1) + 1);
};
for (const attribute of ['indoor','outdoor']) for (const place of places(attribute))
  for (const action of SPECIFIED_ACTION_CONCRETE_OPTIONS.filter(a => a.family === 'kneeling' && a.hands.mode === 'free'))
    for (const frame of seatFramings) consume(place.zh, action.zh, frame);
for (const place of places('outdoor')) for (const [pose,kind] of [['背部倚靠','back'],['側肩倚靠','shoulder']]) for (const frame of seatFramings) {
  const id = scenes[place.id][kind][0] || '';
  consume(place.zh, pose, frame); consume(place.zh, pose, frame, id ? {indoorLeanId:id} : {});
}
const progress = createTestProgress('shared kneel / outdoor-lean matrices', null, {root:fileURLToPath(new URL('../../',import.meta.url))});
const session = enableSeatFixtureReuse(plan, stats => progress.tick(stats.generations + stats.hits, stats));
try {
  await import('../../webapp/src/lib/engine/indoorKneelBaseline.test.js');
  await import('../../webapp/src/lib/engine/indoorKneelPrompt.test.js');
  await import('../../webapp/src/lib/engine/outdoorLeanPrompt.test.js');
} catch (error) { session.stop(); throw error; }
after(context => {
  try {
    const stats = session.statistics();
    progress.tick(stats.generations + stats.hits, stats); progress.finish(stats);
    context.diagnostic(`seat fixture reuse: ${stats.generations} generations, ${stats.hits} hits, peak compressed bytes ${stats.peakBytes}, retained ${stats.retainedEntries}`);
    const filtered = process.execArgv.some(a => /^--test-(name-pattern|skip-pattern|only)(=|$)/.test(a));
    if (!filtered) { assert.ok(stats.hits >= 12080); assert.equal(stats.retainedEntries, 0); }
  } finally { session.stop(); }
});

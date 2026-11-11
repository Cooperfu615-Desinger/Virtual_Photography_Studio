import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveLawsonScenePosition } from './lawsonScenePosition.js';
import { createSeededRandom, generatePrompts, getLockControls, getSceneDependentOptions, normalizeLocks } from '../engine.js';
import { buildMarkdownExport, buildRestoreLocks, parseExportedMarkdownPrompt, serializeFavoritePrompt, deserializeFavoritePrompt } from '../../features/saved-cards/cardCodec.js';
import { createHistoricalNoneLocks } from './sceneIntegratedAssemblyTestSupport.js';

const base = { locationName: '室內：日本 Lawson 便利商店內', mode: 'auto', eligible: true,
  pose: { poseBaseId: 'sitting', poseArrangementId: 'sitting-natural', poseAnchorId: 'none', poseHandId: 'none' } };

test('both locations retain their indoor or outdoor filters and identity', () => {
  const indoor = getSceneDependentOptions([], { sceneAttributeId: 'indoor' }).locationOptions;
  const outdoor = getSceneDependentOptions([], { sceneAttributeId: 'outdoor' }).locationOptions;
  assert.ok(indoor.some(item => item.zh === base.locationName && item.meta.tags.includes('indoor')));
  assert.ok(!outdoor.some(item => item.zh === base.locationName));
  assert.ok(outdoor.some(item => item.zh === '戶外：日本 Lawson 便利商店門口' && item.meta.tags.includes('outdoor')));
  assert.ok(!indoor.some(item => item.zh === '戶外：日本 Lawson 便利商店門口'));
});

test('automatic indoor seating only applies to compatible seating without a chosen support', () => {
  assert.equal(resolveLawsonScenePosition(base), 'window-seat');
  for (const pose of [
    { poseAnchorId: 'sitting-ground' }, { poseAnchorId: 'sitting-chair' },
    { poseAnchorId: 'sitting-bed' }, { poseArrangementId: 'sitting-cross-legged' },
    { poseHandId: 'one-hand-ground-one-leg' },
  ]) assert.equal(resolveLawsonScenePosition({ ...base, pose: { ...base.pose, ...pose } }), '');
});

test('automatic positions respect mode, scene and effective posture', () => {
  assert.equal(resolveLawsonScenePosition({ ...base, mode: 'free' }), '');
  assert.equal(resolveLawsonScenePosition({ ...base, eligible: false }), '');
  assert.equal(resolveLawsonScenePosition({ ...base, locationName: '戶外：日本 Lawson 便利商店門口' }), '');
  assert.equal(resolveLawsonScenePosition({ ...base, pose: { poseBaseId: 'standing', poseArrangementId: 'standing-natural', poseAnchorId: 'none' } }), 'indoor-aisle');
  assert.equal(resolveLawsonScenePosition({ ...base, pose: { poseBaseId: 'standing', poseArrangementId: 'standing-forward-lean', poseAnchorId: 'none' } }), 'indoor-open');
  assert.equal(resolveLawsonScenePosition({ ...base, locationName: '戶外：日本 Lawson 便利商店門口', pose: { poseBaseId: 'squatting', poseAnchorId: 'none' } }), 'outside-pavement');
  assert.equal(resolveLawsonScenePosition({ ...base, locationName: '戶外：日本 Lawson 便利商店門口', pose: { poseBaseId: 'standing', poseArrangementId: 'standing-natural', poseAnchorId: 'none' } }), 'outside-standing');
  assert.equal(resolveLawsonScenePosition({ ...base, locationName: '戶外：日本 Lawson 便利商店門口', pose: { poseBaseId: 'standing', poseArrangementId: 'standing-bent-leg-lift', poseAnchorId: 'none' } }), 'outside-pavement');
  assert.equal(resolveLawsonScenePosition({ ...base, locationName: '戶外：日本 Lawson 便利商店門口', pose: { poseBaseId: 'sitting', poseAnchorId: 'sitting-ground' } }), 'outside-pavement');
  assert.equal(resolveLawsonScenePosition({ ...base, pose: { poseBaseId: 'standing', poseAnchorId: 'shared-vertical-surface-support' } }), 'indoor-cooler');
  assert.equal(resolveLawsonScenePosition({ ...base, pose: { poseBaseId: 'lying', poseAnchorId: 'none' } }), '');
  assert.equal(resolveLawsonScenePosition({ ...base, locationName: '室內：精品飯店房間' }), '');
});

test('non-Lawson scenes remain byte-identical in auto and free modes', () => {
  const automatic = generate({ location: '室內：精品飯店房間' });
  const free = generate({ location: '室內：精品飯店房間', mode: 'free' });
  for (const key of ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt', 'nanoBananaPrompt', 'extraPrompts', 'selection']) {
    assert.deepEqual(automatic[key], free[key], key);
  }
});

function generate({ location = base.locationName, mode = 'auto', pose = 'sitting', arrangement = 'sitting-natural', anchor = 'none', prop = 'hand-hold-mineral-water', overrides = {} } = {}) {
  const controls = getLockControls();
  const find = (key, name) => controls.find((c) => c.key === key).options.find((item) => item.zh === name).id;
  const locks = { ...createHistoricalNoneLocks(controls), subjectCount: '1',
    sceneAttributeId: location.startsWith('室內') ? 'indoor' : 'outdoor',
    locationId: find('locationId', location), framingId: find('framingId', '全身鏡頭 (Full Body Shot)'),
    angleId: find('angleId', '平視高度鏡頭'), poseBaseId: pose, poseArrangementId: arrangement,
    poseAnchorId: anchor, posePropId: prop, lawsonPositionMode: mode, ...overrides };
  return generatePrompts(1, locks, [], { random: createSeededRandom('lawson-scene-v1') })[0];
}

test('seated indoor scene projects window seating through main and chest outputs without changing pose or water', () => {
  const automatic = generate();
  const free = generate({ mode: 'free' });
  for (const value of [automatic.grokPrompt, automatic.zImagePrompt, automatic.midjourneyPrompt,
    automatic.nanoBananaPrompt, automatic.extraPrompts.find((p) => p.id === 'chest-up-portrait').text]) {
    assert.match(value, /stool at the in-store eating area next to a narrow counter running along the inside of the front window/i);
    assert.match(value, /(?:mineral water|water bottle)/i);
  }
  assert.doesNotMatch(free.grokPrompt, /stool at the in-store eating area/i);
  assert.equal(automatic.selection.poseAnchorId, 'none');
  assert.equal(automatic.selection.posePropId, 'hand-hold-mineral-water');
  assert.equal(automatic.extraPrompts.find((p) => p.id === 'full-body-character').text,
    free.extraPrompts.find((p) => p.id === 'full-body-character').text);
});

test('manual seat and outdoor seating remain free, and free mode survives saved selection restore', () => {
  for (const prompt of [generate({ anchor: 'sitting-ground' }), generate({ anchor: 'sitting-chair' }),
    generate({ location: '戶外：日本 Lawson 便利商店門口' })]) assert.doesNotMatch(prompt.grokPrompt, /stool at the in-store eating area/i);
  const prompt = generate({ mode: 'free' });
  const stored = deserializeFavoritePrompt(serializeFavoritePrompt(prompt));
  assert.equal(stored.selection.lawsonPositionMode, 'free');
  const markdown = parseExportedMarkdownPrompt(buildMarkdownExport(prompt), getLockControls());
  assert.equal(markdown.selection.locationId, prompt.selection.locationId);
  assert.equal(markdown.selection.lawsonPositionMode, 'free');
  const restored = normalizeLocks(buildRestoreLocks(JSON.parse(JSON.stringify(prompt.selection)), getLockControls()));
  assert.equal(restored.lawsonPositionMode, 'free');
  assert.equal(restored.posePropId, 'hand-hold-mineral-water');
  const replay = generatePrompts(1, restored, [], { random: createSeededRandom('lawson-scene-v1') })[0];
  assert.doesNotMatch(replay.grokPrompt, /stool at the in-store eating area/i);
});

test('grounded outdoor standing is explicit while lifted-leg and squatting poses remain untouched', () => {
  const location = '戶外：日本 Lawson 便利商店門口';
  const standing = generate({ location, pose: 'standing', arrangement: 'standing-natural' });
  const raised = generate({ location, pose: 'standing', arrangement: 'standing-bent-leg-lift' });
  const squat = generate({ location, pose: 'squatting', arrangement: 'squatting-natural' });
  for (const value of [standing.grokPrompt, standing.zImagePrompt, standing.midjourneyPrompt, standing.nanoBananaPrompt,
    standing.extraPrompts.find(p => p.id === 'chest-up-portrait').text]) {
    assert.match(value, /both feet on the paved pedestrian sidewalk/i);
  }
  for (const p of [raised, squat]) {
    assert.doesNotMatch(p.grokPrompt, /both feet on the paved pedestrian sidewalk/i);
    assert.equal(p.selection.posePropId, 'hand-hold-mineral-water');
  }
});

test('current action library and Grok Imagine use the approved positions without changing pose or props', async () => {
  const { getGrokImagineResult } = await import('../grokImagineResult.js');
  for (const [location, action, phrase] of [
    [base.locationName, 'specified-sitting-natural', /stool at the in-store eating area/i],
    ['戶外：日本 Lawson 便利商店門口', 'specified-standing-natural', /both feet on the paved pedestrian sidewalk/i],
  ]) {
    const overrides = { specifiedActionId: action, propId: 'hand-hold-mineral-water' };
    const auto = generate({ location, overrides });
    const free = generate({ location, mode: 'free', overrides });
    assert.equal(auto.selection.specifiedActionId, action);
    assert.equal(auto.selection.propId, 'hand-hold-mineral-water');
    assert.match(auto.grokPrompt, phrase);
    assert.match(getGrokImagineResult(auto), phrase);
    assert.doesNotMatch(free.grokPrompt, phrase);
    assert.doesNotMatch(getGrokImagineResult(free), phrase);
  }
});

test('current manual seats and leaning supports take precedence over automatic positioning', () => {
  const seat = generate({ overrides: { specifiedActionId: 'specified-sitting-natural', indoorSeatId: 'floor' } });
  assert.equal(seat.selection.indoorSeatId, 'floor');
  assert.match(seat.grokPrompt, /sits on the floor/i);
  assert.doesNotMatch(seat.grokPrompt, /stool at the in-store eating area/i);
  const leaning = generate({ overrides: { specifiedActionId: 'specified-standing-back-lean', indoorLeanId: 'wall' } });
  assert.equal(leaning.selection.indoorLeanId, 'wall');
  assert.match(leaning.grokPrompt, /back resting against a wall/i);
  assert.doesNotMatch(leaning.grokPrompt, /subject near the side of a refrigerated drink case/i);
});

test('test-branch scene IDs restore to the new permanent catalog IDs', () => {
  for (const [old, label] of [
    ['locations:生活感室內-indoor-lifestyle:室內-日本-lawson-便利商店內:39', base.locationName],
    ['locations:城市與社群感-urban-social-snapshots:戶外-日本-lawson-便利商店門口:57', '戶外：日本 Lawson 便利商店門口'],
  ]) {
    const expected = getLockControls().find(c => c.key === 'locationId').options.find(item => item.zh === label);
    assert.equal(normalizeLocks({ locationId: old }).locationId, expected.id);
  }
});

test('legacy test-version Markdown restores its location and free mode', () => {
  const prompt = generate({ mode: 'free' });
  const oldId = 'locations:生活感室內-indoor-lifestyle:室內-日本-lawson-便利商店內:39';
  const oldComment = `<!-- VPStudio Lawson Position: ${JSON.stringify({ locationId: oldId, mode: 'free' })} -->\n`;
  const exported = buildMarkdownExport(prompt).replace(/^<!-- VPStudio PAGE1 Snapshot:[^\n]*\n/, '');
  const restored = parseExportedMarkdownPrompt(oldComment + exported, getLockControls());
  assert.equal(restored.selection.locationId, prompt.selection.locationId);
  assert.equal(restored.selection.lawsonPositionMode, 'free');
});

test('manual kneeling surfaces remain selected and take precedence', () => {
  for (const [location, surface, words] of [
    [base.locationName, 'floor', /on the floor/i],
    ['戶外：日本 Lawson 便利商店門口', 'ground', /on the ground/i],
  ]) {
    const prompt = generate({ location, overrides: { specifiedActionId: 'specified-kneeling-seiza', indoorKneelId: surface } });
    assert.equal(prompt.selection.indoorKneelId, surface);
    assert.match(prompt.grokPrompt, words);
    assert.doesNotMatch(prompt.grokPrompt, /subject (?:in an open area|on the sidewalk beside)/i);
  }
});

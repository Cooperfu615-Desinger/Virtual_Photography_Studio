import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import { buildRestoreLocks, deserializeFavoritePrompt, serializeFavoritePrompt } from '../../features/saved-cards/cardCodec.js';
import { LYING_CAMERA_OPTIONS, lyingActionFitsScene, lyingSurfaceFor, resolveLyingCamera, withLyingSurface } from './lyingSurface.js';
import { SPECIFIED_ACTION_CONCRETE_OPTIONS, SPECIFIED_ACTION_LYING_POOL } from './specifiedActions.js';
import { withoutLyingSurface } from './lyingSurfaceTestSupport.js';

// Lying library P3 (Docs/specs/pose-library-lying-v1.md §2–§3, Cooper 2026-10-19):
// reviewed scenes carry a verbatim lying surface; lying actions lie on it and use the
// lying camera instead of angle and orbit.
const controls = getLockControls();
const control = key => controls.find(c => c.key === key);
const option = (key, zh) => control(key).options.find(o => o.zh === zh).id;
const locations = control('locationId').options;
const BED = option('locationId', '其他：白色床鋪');
const STREET = option('locationId', '戶外：社區自動販賣機旁');
const FULL = option('framingId', '全身鏡頭 (Full Body Shot)');
const PRONE = 'specified-lying-prone-forearms-crossed-ankles';
const SIDE_PILLOW = 'specified-lying-side-pillow-hand';
const action = id => SPECIFIED_ACTION_CONCRETE_OPTIONS.find(a => a.id === id);
const generate = (locks, seed = 'lying-surface') => generatePrompts(1, {
  ...createEmptyLocks(), subjectCount: '1', framingId: FULL,
  angleId: option('angleId', '腰部高度鏡頭'), orbitId: option('orbitId', '正面 0 度'), ...locks,
}, [], { random: createSeededRandom(seed) })[0];
const composition = prompt => prompt.grokPrompt.match(/Composition:\n([^\n]*)/)?.[1] || '';
const main = prompt => [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt, prompt.nanoBananaPrompt];

test('47 reviewed scenes carry a lying surface copied verbatim from their own English', () => {
  const lying = locations.filter(o => o.lyingSurface);
  assert.equal(lying.length, 47);
  for (const location of lying) {
    assert.ok(['bed', 'floor', 'tatami', 'rug', 'grass', 'sand', 'ground', 'other'].includes(location.lyingSurface.type), location.zh);
    assert.ok(location.en.toLowerCase().includes(location.lyingSurface.en.toLowerCase()), `${location.zh}: ${location.lyingSurface.en}`);
  }
  assert.equal(locations.find(o => o.id === BED).lyingSurface.en, 'white bed surface');
  assert.equal(locations.find(o => o.id === STREET).lyingSurface, undefined);
});

test('surface helpers insert after the lying lead and skip actions that already name the ground', () => {
  assert.equal(withLyingSurface('She lies on her stomach with her chest lifted.', 'white bed surface'),
    'She lies on her stomach on the white bed surface with her chest lifted.');
  assert.equal(withLyingSurface('She lies on her left side with x.', 'wooden floor'), 'She lies on her left side on the wooden floor with x.');
  assert.equal(withLyingSurface('She sits with her hips on the ground.', 'wooden floor'), 'She sits with her hips on the ground.');
  const bed = locations.find(o => o.id === BED);
  assert.equal(lyingSurfaceFor(action(PRONE), bed), 'white bed surface');
  assert.equal(lyingSurfaceFor(action('specified-lying-left-side-forearm'), bed), '', 'v1 text already says on the ground');
  assert.equal(lyingSurfaceFor(action('specified-sitting-hug-knees'), bed), '');
  assert.equal(lyingSurfaceFor(action(PRONE), locations.find(o => o.id === STREET)), '');
  assert.equal(lyingActionFitsScene(action(SIDE_PILLOW), bed), true);
  assert.equal(lyingActionFitsScene(action(SIDE_PILLOW), locations.find(o => o.lyingSurface?.type === 'grass')), false, 'pillow-led action needs a bed');
});

test('a lying action on a lying scene: surface in every main output, lying camera replaces angle and orbit', () => {
  const prompt = generate({ locationId: BED, specifiedActionId: PRONE, lyingCameraId: 'lying-overhead' });
  for (const text of main(prompt)) assert.match(text, /She lies on her stomach on the white bed surface/);
  assert.equal(composition(prompt), 'Full-body portrait, shot from directly overhead, the camera looking straight down at her.');
  assert.doesNotMatch(prompt.grokPrompt, /waist-level view|front view/);
  assert.equal(prompt.selection.angleId, option('angleId', '腰部高度鏡頭'), 'raw angle kept for a later cancel');
  assert.equal(prompt.selection.orbitId, option('orbitId', '正面 0 度'));
  assert.equal(prompt.selection.lyingCameraId, 'lying-overhead');
  const restored = buildRestoreLocks(deserializeFavoritePrompt(serializeFavoritePrompt(prompt)).selection, controls);
  assert.equal(restored.lyingCameraId, 'lying-overhead');
});

test('a lying action without a surface still renders, without one; 全無 camera writes no camera', () => {
  const prompt = generate({ locationId: STREET, specifiedActionId: PRONE });
  for (const text of main(prompt)) {
    assert.match(text, /She lies on her stomach with her chest lifted/);
    assert.doesNotMatch(text, /She lies on her stomach on the/);
  }
  assert.equal(composition(prompt), 'Full-body portrait.');
  assert.ok(!('lyingCameraId' in prompt.selection), '全無 keeps the old snapshot shape');
});

test('the lying camera only applies to lying actions', () => {
  const sitting = { locationId: BED, specifiedActionId: 'specified-sitting-hug-knees' };
  const plain = generate(sitting);
  const withCamera = generate({ ...sitting, lyingCameraId: 'lying-overhead' });
  assert.equal(withCamera.grokPrompt, plain.grokPrompt);
  assert.match(composition(plain), /waist-level view, front view/);
});

test('隨機 lying camera resolves to one concrete camera and the snapshot names it', () => {
  const concrete = LYING_CAMERA_OPTIONS.filter(o => o.en).map(o => o.id);
  assert.deepEqual(concrete, ['lying-overhead', 'lying-high-side', 'lying-surface-level', 'lying-from-head', 'lying-from-feet']);
  assert.equal(resolveLyingCamera('random', () => 0).id, 'lying-overhead');
  assert.equal(resolveLyingCamera('none'), null);
  const prompt = generate({ locationId: BED, specifiedActionId: PRONE, lyingCameraId: 'random' }, 'lying-random-camera');
  assert.ok(concrete.includes(prompt.selection.lyingCameraId));
  const camera = LYING_CAMERA_OPTIONS.find(o => o.id === prompt.selection.lyingCameraId);
  assert.ok(composition(prompt).includes(camera.en));
});

test('隨機 pose draws lying actions only on a locked lying scene; the pillow action only on a bed', () => {
  const draw = (locationId, count = 80) => Array.from({ length: count }, (_, index) =>
    generate({ locationId, specifiedActionId: 'random' }, `lying-pool-${locationId}-${index}`).selection.specifiedActionId);
  const onBed = draw(BED);
  assert.ok(onBed.some(id => SPECIFIED_ACTION_LYING_POOL.some(a => a.id === id)), 'a bed scene can draw lying actions');
  assert.ok(!onBed.includes('specified-lying-prone-forearms-one-knee-up'), 'pending actions never draw');
  assert.ok(!draw(STREET).some(id => action(id)?.family === 'lying'), 'no lying on a scene without a surface');
  const grass = locations.find(o => o.lyingSurface?.type === 'grass').id;
  assert.ok(!draw(grass).includes(SIDE_PILLOW), 'the pillow action needs a bed');
  assert.ok(!draw('').some(id => action(id)?.family === 'lying'), 'an unresolved random scene cannot be checked');
});

test('test inverse removes only the additive lyingSurface field', () => {
  const bed = locations.find(o => o.id === BED);
  const stripped = withoutLyingSurface({ options: [bed] }).options[0];
  assert.ok(!('lyingSurface' in stripped));
  assert.deepEqual({ ...stripped, lyingSurface: bed.lyingSurface }, { ...bed });
});

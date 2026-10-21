import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import { deserializeFavoritePrompt, serializeFavoritePrompt, buildRestoreLocks } from '../../features/saved-cards/cardCodec.js';
import {
  SPECIFIED_ACTION_ANY,
  SPECIFIED_ACTION_ANY_EN,
  SPECIFIED_ACTION_CONCRETE_OPTIONS,
  SPECIFIED_ACTION_OPTIONS,
  SPECIFIED_ACTION_RANDOM,
  SPECIFIED_ACTION_RANDOM_POOL,
  resolveRandomSpecifiedAction,
} from './specifiedActions.js';

// expression-pose-v2 P2 (Cooper 2026-10-19): the pose menu is 全無 / 隨機 / 任意 /
// each specified action. 全無 (also the default) writes no pose; 隨機 draws one
// accepted, non-lying library action at generation; 任意 is the third-round
// free-pose sentence (Docs/reports/pose-hand-experiment-2026-10-17/results.md §6).
const controls = getLockControls();
const option = (key, zh) => controls.find(c => c.key === key).options.find(o => o.zh === zh).id;
const FULL = option('framingId', '全身鏡頭 (Full Body Shot)');
const generate = (locks, seed = 'pose-menu-v2') => generatePrompts(1, {
  ...createEmptyLocks(), subjectCount: '1', framingId: FULL, ...locks,
}, [], { random: createSeededRandom(seed) })[0];
const main = prompt => [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt, prompt.nanoBananaPrompt];

test('the menu lists 全無, 隨機, 任意 and then the library; 隨機 draws only accepted non-lying actions', () => {
  assert.deepEqual(SPECIFIED_ACTION_OPTIONS.slice(0, 3).map(o => [o.id, o.zh]), [['none', '全無'], ['random', '隨機'], ['any', '任意']]);
  assert.deepEqual(SPECIFIED_ACTION_RANDOM_POOL.map(a => a.id),
    SPECIFIED_ACTION_CONCRETE_OPTIONS.filter(a => a.validation.status === 'accepted' && a.family !== 'lying' && !a.meta.requiresWardrobeRole).map(a => a.id));
  // 9 earlier accepted actions + 9 standing batch-1 (2026-10-20) + 4 squatting + 16 sitting/kneeling (2026-10-21).
  assert.equal(SPECIFIED_ACTION_RANDOM_POOL.length, 38);
  assert.equal(SPECIFIED_ACTION_ANY.en, SPECIFIED_ACTION_ANY_EN);
  assert.equal(controls.find(c => c.key === 'specifiedActionId').defaultValue, 'none', 'Cooper: the untouched menu is 全無');
});

test('resolving 隨機 uses one draw, and falls back to 全無 for duo or a fixed scene position', () => {
  let calls = 0;
  const stub = () => { calls += 1; return 0; };
  const single = resolveRandomSpecifiedAction({ subjectCount: '1', specifiedActionId: 'random', actionPoseCardId: 'x' }, stub);
  assert.equal(single.specifiedActionId, SPECIFIED_ACTION_RANDOM_POOL[0].id);
  assert.equal(single.actionPoseCardId, '');
  assert.equal(calls, 1);
  assert.equal(resolveRandomSpecifiedAction({ subjectCount: '2', specifiedActionId: 'random' }, stub).specifiedActionId, 'none');
  assert.equal(resolveRandomSpecifiedAction({ subjectCount: '1', specifiedActionId: 'random',
    fixedCompositionSetId: 'japan-carriage-rush-hour', fixedSetPositionId: 'carriage-crowd-seated' }, stub).specifiedActionId, 'none');
  const untouched = { subjectCount: '1', specifiedActionId: SPECIFIED_ACTION_RANDOM_POOL[2].id };
  assert.equal(resolveRandomSpecifiedAction(untouched, stub), untouched);
});

test('隨機 skips actions whose gaze conflicts with a locked camera', () => {
  const locks = { subjectCount: '1', specifiedActionId: 'random', orbitId: option('orbitId', '背面 180 度') };
  for (let index = 0; index < 9; index += 1) {
    const drawn = resolveRandomSpecifiedAction(locks, () => index / 9, { cameraControls: controls }).specifiedActionId;
    assert.ok(!SPECIFIED_ACTION_CONCRETE_OPTIONS.find(a => a.id === drawn).ownsHead, `${drawn} owns a camera-facing gaze`);
  }
});

test('隨機 renders the drawn action, names it in the selection and varies across seeds', () => {
  const seen = new Set();
  for (let index = 0; index < 40; index += 1) {
    const prompt = generate({ specifiedActionId: 'random' }, `pose-menu-random-${index}`);
    const drawn = SPECIFIED_ACTION_RANDOM_POOL.find(a => a.id === prompt.selection.specifiedActionId);
    assert.ok(drawn, `${index}: ${prompt.selection.specifiedActionId}`);
    for (const text of [prompt.grokPrompt, prompt.zImagePrompt, prompt.nanoBananaPrompt]) assert.ok(text.includes(drawn.clauses[0].en), `${index}: ${drawn.id}`);
    seen.add(drawn.id);
  }
  assert.ok(seen.size >= 5, `expected variety, saw ${seen.size}`);
});

test('a drawn action survives Saved Cards: the card restores that action, not 隨機', () => {
  const prompt = generate({ specifiedActionId: 'random' }, 'pose-menu-card');
  const restored = buildRestoreLocks(deserializeFavoritePrompt(serializeFavoritePrompt(prompt)).selection, controls);
  assert.equal(restored.specifiedActionId, prompt.selection.specifiedActionId);
  assert.notEqual(restored.specifiedActionId, 'random');
});

test('任意 writes the free-pose sentence at full body and its upper-body form in the chest crop', () => {
  const prompt = generate({ specifiedActionId: 'any' });
  assert.equal(prompt.selection.specifiedActionId, 'any');
  for (const text of main(prompt)) assert.ok(text.includes(SPECIFIED_ACTION_ANY_EN.slice(0, -1)), text.slice(0, 80));
  const chest = prompt.extraPrompts.find(e => e.id === 'chest-up-portrait').text;
  assert.ok(chest.includes(SPECIFIED_ACTION_ANY.upperBodyEn.slice(0, -1)));
  assert.ok(!chest.includes('weight shifted onto one leg'));
});

test('全無 and the untouched default write no pose and draw nothing from the old catalog', () => {
  for (const locks of [{}, { specifiedActionId: 'none' }]) {
    for (let index = 0; index < 20; index += 1) {
      const prompt = generate(locks, `pose-menu-none-${index}`);
      assert.doesNotMatch(prompt.grokPrompt, /\nPose and Composition:\n/, `${index}`);
      assert.ok(!prompt.selection.poseId, `${index}: no old catalog pose`);
      assert.ok(!['random', 'any'].includes(prompt.selection.specifiedActionId), `${index}`);
    }
  }
});

test('an explicitly locked legacy pose still renders (old cards keep working)', () => {
  const poseId = controls.find(c => c.key === 'poseId').options.find(o => o.id.includes('姿勢與肢體語言') && !/全無|隨機/.test(o.zh)).id;
  const prompt = generate({ poseId });
  // normalizeLocks migrates a locked legacy pose into the free composer.
  assert.match(prompt.grokPrompt, /\nPose and Composition:\n/);
  assert.notEqual(prompt.selection.poseBaseId, 'none');
});

// Standing library v1 (Cooper 2026-10-20): the 隨機 description matches the current pool rules.
test('the 隨機 description names the lying-scene and pending rules, not the pre-P3 wording', () => {
  assert.doesNotMatch(SPECIFIED_ACTION_RANDOM.descriptionZh, /待場景表面完成後加入/);
  assert.match(SPECIFIED_ACTION_RANDOM.descriptionZh, /躺姿只在鎖定的場景可以躺時/);
  assert.match(SPECIFIED_ACTION_RANDOM.descriptionZh, /未驗收的動作不會抽到/);
});

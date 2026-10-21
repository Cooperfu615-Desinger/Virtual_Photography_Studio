import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import { buildRestoreLocks, deserializeFavoritePrompt, serializeFavoritePrompt } from '../../features/saved-cards/cardCodec.js';
import { retirePage1PoseComposerLocks } from '../../features/page1/retiredPoseLocks.js';
import { buildWorkspaceSummary } from '../page1WorkspaceSummary.js';
import {
  GAZE_OPTIONS, GESTURE_OPTIONS, actionAcceptsGesture, actionTextWithGesture, applicableGestureOptions,
  availableGazeOptions, gazeHeadId, resolveGesture,
} from './gazeGesture.js';
import { SPECIFIED_ACTION_ANY, SPECIFIED_ACTION_CONCRETE_OPTIONS } from './specifiedActions.js';

// expression-pose-v2 P4 (Cooper 2026-10-20): B keeps 姿勢／手勢／表情／視線; selfie
// styles move to E 拍攝方式 (Docs/specs/expression-pose-v2-implementation-plan.md §7).
const controls = getLockControls();
const option = (key, zh) => controls.find(c => c.key === key).options.find(o => o.zh === zh).id;
const FULL = option('framingId', '全身鏡頭 (Full Body Shot)');
const BACK = option('orbitId', '背面 180 度');
const HUG_KNEES = 'specified-sitting-hug-knees';
const PRONE = 'specified-lying-prone-forearms-crossed-ankles';
const OWNS_HEAD = 'specified-defiant-middle-finger-lens-jab';
const action = id => SPECIFIED_ACTION_CONCRETE_OPTIONS.find(a => a.id === id);
const generate = (locks, seed = 'gaze-gesture') => generatePrompts(1, {
  ...createEmptyLocks(), subjectCount: '1', framingId: FULL, ...locks,
}, [], { random: createSeededRandom(seed) })[0];
const main = prompt => [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt, prompt.nanoBananaPrompt];
const chest = prompt => prompt.extraPrompts.find(e => e.id === 'chest-up-portrait').text;

test('gaze menu: 全無／隨機 and four gazes reusing reviewed head wording; back view keeps only 回眸', () => {
  assert.deepEqual(GAZE_OPTIONS.map(o => o.zh), ['全無', '隨機', '看鏡頭', '看向遠方', '低頭', '回眸']);
  assert.equal(gazeHeadId('gaze-camera'), 'head-camera-natural');
  assert.equal(gazeHeadId('gaze-camera', { orientationId: 'lying-prone' }), 'lying-prone-head-toward-camera');
  assert.equal(gazeHeadId('gaze-down', { orientationId: 'lying-side' }), '', 'lying offers no 低頭');
  const back = controls.find(c => c.key === 'orbitId').options.find(o => o.id === BACK);
  assert.deepEqual(availableGazeOptions({ orbit: back }).map(o => o.id), ['gaze-back']);
});

test('a gaze writes "She has her head …" with and without an action, in main and chest outputs', () => {
  for (const specifiedActionId of ['none', HUG_KNEES]) {
    const prompt = generate({ specifiedActionId, gazeId: 'gaze-camera' });
    for (const text of [...main(prompt), chest(prompt)]) {
      assert.match(text, /She has her head naturally facing the camera\./, `${specifiedActionId}`);
      assert.doesNotMatch(text, /She has head\b/);
    }
    assert.equal(prompt.selection.gazeId, 'gaze-camera');
  }
});

test('隨機 gaze resolves to one gaze, the snapshot names it and a Saved Card restores it', () => {
  const seen = new Set();
  for (let index = 0; index < 12; index += 1) {
    const prompt = generate({ gazeId: 'random' }, `gaze-random-${index}`);
    assert.ok(['gaze-camera', 'gaze-distance', 'gaze-down', 'gaze-back'].includes(prompt.selection.gazeId));
    seen.add(prompt.selection.gazeId);
    const restored = buildRestoreLocks(deserializeFavoritePrompt(serializeFavoritePrompt(prompt)).selection, controls);
    assert.equal(restored.gazeId, prompt.selection.gazeId);
  }
  assert.ok(seen.size >= 2);
  const back = generate({ gazeId: 'random', orbitId: BACK }, 'gaze-back-view');
  assert.equal(back.selection.gazeId, 'gaze-back');
  assert.doesNotMatch(generate({ gazeId: 'gaze-camera', orbitId: BACK }).grokPrompt, /head naturally facing the camera/);
});

test('an action that owns the head ignores gaze and keeps the raw choice', () => {
  const prompt = generate({ specifiedActionId: OWNS_HEAD, gazeId: 'gaze-distance' });
  assert.doesNotMatch(prompt.grokPrompt, /clean side profile/);
  assert.equal(prompt.selection.gazeId, 'gaze-distance');
});

test('gestures: only free-hand library actions, scoped by orientation; inserted after the upper clauses', () => {
  assert.equal(actionAcceptsGesture(action(HUG_KNEES)), false);
  assert.equal(actionAcceptsGesture(SPECIFIED_ACTION_ANY), false, '任意 leaves the hands to the model');
  assert.deepEqual(applicableGestureOptions(action(PRONE)).map(o => o.zh), ['下巴靠在交疊的雙手上', '雙手托腮', '一手撥頭髮', '雙手輕放在前方']);
  assert.equal(GESTURE_OPTIONS.filter(o => o.scope).length, 17, '8 general (4 out of 隨機 until the image round) + 9 lying');
  const chin = GESTURE_OPTIONS.find(o => o.id === 'gesture-prone-chin-hands');
  const text = actionTextWithGesture(action(PRONE), chin);
  assert.match(text.en, /propped on her forearms resting flat in front of her, her chin resting on her stacked hands\. Her hips rest/);
  assert.equal(text.upperBodyEn, 'She lies on her stomach with her chest lifted and her back gently arched, propped on her forearms resting flat in front of her, her chin resting on her stacked hands.');
  assert.deepEqual(actionTextWithGesture(action(PRONE), null), { en: action(PRONE).en, upperBodyEn: action(PRONE).upperBodyEn });
  const pockets = { ...action(PRONE), orientationId: 'none', family: 'standing' };
  for (let index = 0; index < 20; index += 1) {
    assert.notEqual(resolveGesture('random', pockets, {}, () => index / 20)?.id, 'gesture-front-pockets', 'random needs pants present');
  }
});

test('a gesture reaches every main output and the chest crop, and is recorded', () => {
  const prompt = generate({ specifiedActionId: PRONE, gestureId: 'gesture-prone-cheeks-cupped' });
  for (const text of [...main(prompt), chest(prompt)]) assert.match(text, /her cheeks cupped in both hands/);
  assert.equal(prompt.selection.gestureId, 'gesture-prone-cheeks-cupped');
  assert.doesNotMatch(generate({ specifiedActionId: HUG_KNEES, gestureId: 'gesture-prone-cheeks-cupped' }).grokPrompt, /cheeks cupped/);
});

test('拍攝方式 selfie styles produce exactly the prompts of the earlier selfie hand or prop locks', () => {
  for (const [captureStyleId, legacy] of [
    ['selfie', { poseHandId: 'selfie-natural-right-arm' }],
    ['companion', { poseHandId: 'selfie-companion-camera-interaction' }],
    ['mirror', { posePropId: 'selfie-mirror-phone-visible' }],
  ]) {
    const styled = generate({ captureStyleId });
    const old = generate(legacy);
    assert.deepEqual(main(styled), main(old), captureStyleId);
    assert.equal(chest(styled), chest(old), captureStyleId);
    assert.equal(styled.selection.captureStyleId, captureStyleId);
  }
  const withAction = generate({ captureStyleId: 'selfie', specifiedActionId: HUG_KNEES });
  assert.doesNotMatch(withAction.grokPrompt, /self-shot/, 'an action keeps its own hands (existing precedence)');
});

test('unused gaze, gesture and 拍攝方式 keep the old selection shape', () => {
  const prompt = generate({});
  for (const key of ['gazeId', 'gestureId', 'captureStyleId']) assert.ok(!(key in prompt.selection), key);
});

test('workspace retirement: composer layers drop, a selfie hand or prop becomes 拍攝方式', () => {
  const clean = { ...createEmptyLocks(), subjectCount: '1' };
  assert.equal(retirePage1PoseComposerLocks(clean), clean, 'nothing to retire keeps identity');
  const old = retirePage1PoseComposerLocks({ ...clean, poseHeadId: 'head-slight-tilt', poseBaseId: 'standing', poseHandId: 'selfie-natural-right-arm' });
  assert.equal(old.captureStyleId, 'selfie');
  for (const key of ['poseHeadId', 'poseBaseId', 'poseHandId']) assert.equal(old[key], 'none', key);
  assert.equal(retirePage1PoseComposerLocks({ ...clean, posePropId: 'selfie-mirror-phone-visible' }).captureStyleId, 'mirror');
  assert.equal(retirePage1PoseComposerLocks({ ...clean, captureStyleId: 'companion', posePropId: 'selfie-mirror-phone-visible' }).captureStyleId, 'companion', 'an explicit style wins');
});

test('the B summary names the action, gesture and gaze', () => {
  const locks = { ...createEmptyLocks(), subjectCount: '1', specifiedActionId: PRONE, gestureId: 'gesture-prone-chin-hands', gazeId: 'gaze-camera' };
  assert.equal(buildWorkspaceSummary(locks, controls).pose.summary, '指定動作：趴躺・前臂撐起・雙腳交叉翹起 / 下巴靠在交疊的雙手上 / 看鏡頭');
  assert.equal(buildWorkspaceSummary({ ...createEmptyLocks(), subjectCount: '1', gazeId: 'gaze-back' }, controls).pose.summary, '回眸');
});

test('a fixed scene position writes the gaze as "She has her head …" too', () => {
  const prompt = generate({ fixedCompositionSetId: 'japan-carriage-rush-hour', fixedSetPositionId: 'carriage-crowd-seated', gazeId: 'gaze-camera' });
  assert.match(prompt.grokPrompt, /She has her head naturally facing the camera\./);
  for (const text of main(prompt)) assert.doesNotMatch(text, /She has head\b/);
});

test('the B summary lists only a gesture that fits the action and gaze only for a single subject', () => {
  const stale = { ...createEmptyLocks(), subjectCount: '1', specifiedActionId: HUG_KNEES, gestureId: 'gesture-prone-chin-hands' };
  assert.doesNotMatch(buildWorkspaceSummary(stale, controls).pose.summary, /下巴/);
  assert.doesNotMatch(buildWorkspaceSummary({ ...createEmptyLocks(), subjectCount: '2', gazeId: 'gaze-camera' }, controls).pose.summary, /看鏡頭/);
});

test('Cooper option B: an explicit non-回眸 gaze keeps a random orbit off back views; a locked back orbit stays', () => {
  for (let index = 0; index < 60; index += 1) {
    const prompt = generate({ gazeId: 'gaze-camera' }, `gaze-front-orbit-${index}`);
    assert.match(prompt.grokPrompt, /She has her head naturally facing the camera\./, `${index}`);
  }
  const locked = generate({ gazeId: 'gaze-camera', orbitId: BACK });
  assert.equal(locked.selection.orbitId, BACK);
  assert.doesNotMatch(locked.grokPrompt, /naturally facing the camera/);
  const backDrawn = Array.from({ length: 60 }, (_, index) => generate({ gazeId: 'gaze-back' }, `gaze-back-orbit-${index}`).selection.orbitId);
  assert.ok(backDrawn.includes(BACK) || backDrawn.some(id => /後|背/.test(id)), '回眸 leaves back views in the random orbit pool');
});

// Standing library v1 (Docs/specs/pose-library-standing-v1.md, Cooper 2026-10-20).
test('standing batch 1 is accepted with free hands; batch 2 is pending and out of 隨機', () => {
  const standing = SPECIFIED_ACTION_CONCRETE_OPTIONS.filter(a => a.id.startsWith('specified-standing-'));
  assert.equal(standing.length, 20);
  const accepted = standing.filter(a => a.validation.status === 'accepted');
  assert.equal(accepted.length, 9);
  for (const a of accepted) assert.equal(a.hands.mode, 'free', a.id);
  for (const a of standing.filter(a => a.validation.status === 'pending')) assert.equal(a.hands.mode, 'fixed', a.id);
  for (const a of standing) assert.equal(a.family, 'standing', a.id);
  const pockets = standing.filter(a => a.meta.requiresWardrobeRole === 'pants').map(a => a.zh);
  assert.deepEqual(pockets, ['一手扶頭・一手插口袋', '上身前傾・雙手插口袋・一腳前踏']);
});

test('a free-hand standing action offers 8 general gestures; the 4 new ones never come from 隨機', () => {
  const natural = action('specified-standing-natural');
  assert.equal(applicableGestureOptions(natural).length, 8);
  const newIds = ['gesture-hand-on-head', 'gesture-hands-behind-head', 'gesture-hands-behind-back', 'gesture-arms-overhead'];
  for (let index = 0; index < 40; index += 1) {
    const drawn = resolveGesture('random', natural, { wardrobeSignals: { pants: 'present' } }, () => index / 40);
    assert.ok(drawn && !newIds.includes(drawn.id), `${index}: ${drawn?.id}`);
  }
  const chosen = generate({ specifiedActionId: 'specified-standing-natural', gestureId: 'gesture-hands-behind-back' });
  for (const text of [...main(chosen), chest(chosen)]) assert.match(text, /She stands in a relaxed neutral posture, both hands clasped behind her back\./);
});

test('a standing action renders in every main output and crops its lower clause above the knees', () => {
  const full = generate({ specifiedActionId: 'specified-standing-crossed-legs' });
  for (const text of main(full)) assert.match(text, /She stands with one hip subtly shifted, her legs naturally crossed\./);
  assert.match(chest(full), /She stands with one hip subtly shifted\./);
  assert.doesNotMatch(chest(full), /legs naturally crossed/);
});

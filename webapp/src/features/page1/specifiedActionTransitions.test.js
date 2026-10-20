import assert from 'node:assert/strict';
import test from 'node:test';

import { createEmptyLocks, getLockControls, normalizeLocks } from '../../lib/engine.js';
import { CARRIAGE_POSITION_OPTIONS } from '../../lib/engine/carriageFixedComposition.js';
import { DEFAULT_ACTION_POSE_CARD_ID } from '../../data/actionPoseCards.js';
import {
  isSupinePoseSelection,
  normalizeSpecifiedActionSceneRestore,
  SUPINE_SCENE_NONE_LOCKS,
  SUPINE_SCENE_RESTORE_KEYS,
} from '../../lib/engine/poseScenePolicy.js';
import { randomizeLockKeys, setLockKeysToNone } from '../../lib/page1SectionRandom.js';
import { PAGE1_POSE_SUBPANELS } from '../../lib/page1WorkspacePanels.js';
import { transitionPage1Locks } from './lockTransitions.js';
import { buildAllNoneLocks } from './page1Selectors.js';

const ACTION = Object.freeze({
  sitting: 'specified-sitting-side-fold-back-support',
  sittingOther: 'specified-sitting-hug-knees',
  palms: 'specified-kneeling-all-fours-palms',
  side: 'specified-lying-left-side-forearm',
  supine: 'specified-lying-supine-raised-crossed-legs',
});
const controls = getLockControls();
const optionId = (key, zh) => controls.find(control => control.key === key)
  ?.options.find(option => option.zh === zh)?.id;
const latentKeys = ['poseOrientationId', 'poseArrangementId', 'poseHandId', 'posePropId', 'poseAnchorId'];
const initialLocks = (extra = {}) => ({
  ...createEmptyLocks(),
  poseBaseId: 'sitting',
  poseOrientationId: 'none',
  poseArrangementId: 'sitting-cross-legged',
  poseHandId: 'none',
  posePropId: optionId('posePropId', '手持冰咖啡'),
  poseAnchorId: 'sitting-scene-appropriate-chair',
  poseHeadId: optionId('poseHeadId', '頭部微微側傾'),
  expressionId: controls.find(control => control.key === 'expressionId')
    ?.options.find(option => option.zh !== '全無' && option.en !== 'none')?.id,
  sceneAttributeId: optionId('sceneAttributeId', '室內'),
  locationId: optionId('locationId', '室內：復古美式 Diner'),
  lightingId: controls.find(control => control.key === 'lightingId')
    ?.options.find(option => option.zh !== '全無' && option.en !== 'none')?.id,
  ...extra,
});
const transition = (previousLocks, patch, options = {}) => transitionPage1Locks({
  previousLocks,
  candidateLocks: { ...previousLocks, ...patch },
  lockControls: controls,
  ...options,
});

test('specified scene snapshot normalization preserves valid fields and removes unrelated payloads', () => {
  const snapshot = { ...SUPINE_SCENE_NONE_LOCKS, locationId: 'original-room', zImageVisibleTextEnabled: true };
  assert.deepEqual(normalizeSpecifiedActionSceneRestore({ ...snapshot, poseHandId: 'one-hand-chin', extra: {} }), snapshot);
  assert.equal(normalizeSpecifiedActionSceneRestore(snapshot)?.zImageVisibleTextEnabled, true);
});

test('specified scene snapshot normalization defaults omitted or incorrectly typed fields', () => {
  assert.deepEqual(normalizeSpecifiedActionSceneRestore({ locationId: 'original-room', zImageVisibleTextEnabled: 'false',
    fixedCompositionSetId: {}, importedWorldSceneLabel: 42 }), {
    ...SUPINE_SCENE_NONE_LOCKS,
    locationId: 'original-room',
  });
});

test('specified scene snapshot normalization rejects invalid containers and payloads without valid fields', () => {
  for (const value of [undefined, null, [], ['original-room'], 'original-room', true, 123, new Date(), {},
    { unknown: 'original-room' }, { locationId: 42, zImageVisibleTextEnabled: 'true' }]) {
    assert.equal(normalizeSpecifiedActionSceneRestore(value), null);
  }
});

test('a malformed scene snapshot cannot inject non-scene data or restore invalid field types', () => {
  const entered = transition(initialLocks({ poseBaseId: 'lying', poseOrientationId: 'lying-side' }), {
    specifiedActionId: ACTION.supine,
  });
  const corrupted = { ...entered, specifiedActionSceneRestore: {
    locationId: 'original-room', zImageVisibleTextEnabled: 'true', fixedCompositionSetId: {},
    poseHandId: 'injected-hand',
  } };
  const canceled = transition(corrupted, { specifiedActionId: 'none' });
  assert.equal(canceled.zImageVisibleTextEnabled, false);
  assert.equal(canceled.fixedCompositionSetId, 'none');
  assert.equal(canceled.poseHandId, entered.poseHandId);
  assert.equal(canceled.specifiedActionSceneRestore, null);
});

test('specified action preserves latent controls, independent expression/head and cancellation values', () => {
  const original = initialLocks();
  const entered = transition(original, { specifiedActionId: ACTION.sitting });
  for (const key of [...latentKeys, 'expressionId', 'poseHeadId']) {
    assert.equal(entered[key], original[key], key);
  }
  const changedAction = transition(entered, { specifiedActionId: ACTION.sittingOther });
  const wardrobeEdited = transition(changedAction, { topId: 'none' });
  const canceled = transition(wardrobeEdited, { specifiedActionId: 'none' });
  for (const key of [...latentKeys, 'expressionId', 'poseHeadId']) {
    assert.equal(canceled[key], original[key], key);
  }
});

test('specified action bypasses the free four-point kneeling bind without discarding latent props or hands', () => {
  const original = initialLocks({ poseBaseId: 'kneeling', poseArrangementId: 'kneeling-all-fours' });
  const entered = transition(original, { specifiedActionId: ACTION.palms });
  for (const key of latentKeys) assert.equal(entered[key], original[key], key);
  const canceled = transition(entered, { specifiedActionId: 'none' });
  for (const key of latentKeys) assert.equal(canceled[key], original[key], key);
});

// P5a (2026-10-20): the pose base is no longer a workspace control; duo still clears the action.
test('duo mode clears the specified action', () => {
  const entered = transition(initialLocks(), { specifiedActionId: ACTION.sitting });
  const duo = transition(entered, { subjectCount: '2' });
  assert.equal(duo.specifiedActionId, 'none');
});

test('specified side-lying overrides latent supine orientation while leaving ordinary scene intact', () => {
  const original = initialLocks({ poseBaseId: 'lying', poseOrientationId: 'lying-supine' });
  const entered = transition(original, { specifiedActionId: ACTION.side });
  assert.equal(isSupinePoseSelection(entered), false);
  assert.equal(entered.locationId, original.locationId);
  assert.equal(entered.sceneAttributeId, original.sceneAttributeId);
  assert.equal(entered.poseOrientationId, 'lying-supine');
});

test('specified supine overrides the scene, preserves lighting and persists its restoration snapshot', () => {
  const original = initialLocks({ poseBaseId: 'lying', poseOrientationId: 'lying-side' });
  const entered = transition(original, { specifiedActionId: ACTION.supine });
  assert.equal(isSupinePoseSelection(entered), true);
  assert.equal(entered.locationId, 'none');
  assert.equal(entered.sceneAttributeId, 'none');
  assert.equal(entered.lightingId, original.lightingId);
  for (const key of SUPINE_SCENE_RESTORE_KEYS) {
    assert.equal(entered.specifiedActionSceneRestore?.[key], original[key], key);
  }
  const reloaded = normalizeLocks(JSON.parse(JSON.stringify(entered)), controls);
  const canceled = transition(reloaded, { specifiedActionId: 'none' });
  for (const key of SUPINE_SCENE_RESTORE_KEYS) assert.equal(canceled[key], original[key], key);
  assert.equal(canceled.specifiedActionSceneRestore, null);
  assert.equal(canceled.poseOrientationId, original.poseOrientationId);
});

test('entering specified supine preserves an explicit scene snapshot bridged from legacy supine state', () => {
  const original = initialLocks({ poseBaseId: 'lying', poseOrientationId: 'lying-side' });
  const legacySupine = transition(original, { poseOrientationId: 'lying-supine' });
  const snapshot = Object.fromEntries(SUPINE_SCENE_RESTORE_KEYS.map(key => [key, original[key]]));
  const entered = transition(legacySupine, {
    specifiedActionId: ACTION.supine,
    specifiedActionSceneRestore: snapshot,
  });
  assert.deepEqual(entered.specifiedActionSceneRestore, snapshot);
});

test('changing specified supine to specified side restores the scene even if latent orientation is supine', () => {
  const original = initialLocks({ poseBaseId: 'lying', poseOrientationId: 'lying-supine' });
  const entered = transition(original, { specifiedActionId: ACTION.supine });
  const side = transition(entered, { specifiedActionId: ACTION.side });
  assert.equal(side.locationId, original.locationId);
  assert.equal(side.sceneAttributeId, original.sceneAttributeId);
  assert.equal(isSupinePoseSelection(side), false);
});

test('an action card pauses specified supine, restores the scene and resumes without losing latent controls', () => {
  const original = initialLocks({ poseBaseId: 'lying', poseOrientationId: 'lying-side' });
  const entered = transition(original, { specifiedActionId: ACTION.supine });
  const paused = transition(entered, { actionPoseCardId: DEFAULT_ACTION_POSE_CARD_ID });
  assert.equal(paused.specifiedActionId, ACTION.supine);
  assert.equal(isSupinePoseSelection(paused), false);
  assert.equal(paused.locationId, original.locationId);
  for (const key of latentKeys) assert.equal(paused[key], original[key], key);
  const resumed = transition(paused, { actionPoseCardId: '' });
  assert.equal(resumed.locationId, 'none');
  const canceled = transition(resumed, { specifiedActionId: 'none' });
  assert.equal(canceled.locationId, original.locationId);
});

test('fixed scene position pauses specified supine without discarding newly selected fixed scene', () => {
  const original = initialLocks({ poseBaseId: 'lying', poseOrientationId: 'lying-side' });
  const entered = transition(original, { specifiedActionId: ACTION.supine });
  const position = CARRIAGE_POSITION_OPTIONS[0];
  const paused = transition(entered, { fixedCompositionSetId: position.setId, fixedSetPositionId: position.id });
  assert.equal(paused.specifiedActionId, ACTION.supine);
  assert.equal(paused.fixedCompositionSetId, position.setId);
  assert.equal(paused.fixedSetPositionId, position.id);
  assert.equal(isSupinePoseSelection(paused), false);
});

test('resuming specified supine after clearing its fixed-scene owner does not restore that owner on cancel', () => {
  const original = initialLocks({ poseBaseId: 'lying', poseOrientationId: 'lying-side' });
  const entered = transition(original, { specifiedActionId: ACTION.supine });
  const position = CARRIAGE_POSITION_OPTIONS[0];
  const paused = transition(entered, { fixedCompositionSetId: position.setId, fixedSetPositionId: position.id });
  const resumed = transition(paused, { fixedCompositionSetId: 'none', fixedSetPositionId: 'none' });
  assert.equal(isSupinePoseSelection(resumed), true);
  const canceled = transition(resumed, { specifiedActionId: 'none' });
  assert.equal(canceled.fixedCompositionSetId, 'none');
  assert.equal(canceled.fixedSetPositionId, 'none');
  assert.equal(canceled.locationId, original.locationId);
});

test('restoring an active specified-supine Saved Card uses its own persisted scene snapshot', () => {
  const source = initialLocks({ poseBaseId: 'lying', poseOrientationId: 'lying-side' });
  const saved = transition(source, { specifiedActionId: ACTION.supine });
  const restored = transition(initialLocks({ locationId: 'none' }), JSON.parse(JSON.stringify(saved)), { restoringSelection: true });
  const canceled = transition(restored, { specifiedActionId: 'none' });
  assert.equal(canceled.locationId, source.locationId);
  assert.equal(canceled.sceneAttributeId, source.sceneAttributeId);
});

// expression-pose-v2 P2 (Cooper 2026-10-19): pose random draws from the action
// library (隨機) instead of clearing the action and randomizing the free composer.
// P4 (2026-10-20): the pose panel is 姿勢／手勢／表情／視線; its random sets the
// pose, gesture and gaze menus to 隨機 and no longer touches retired composer keys.
test('pose batch random sets the action, gesture and gaze menus to random; other sections leave action alone', () => {
  const original = initialLocks({ specifiedActionId: ACTION.sitting });
  const keys = PAGE1_POSE_SUBPANELS.find(panel => panel.id === 'single').keys;
  const randomized = randomizeLockKeys(original, keys, createEmptyLocks(), controls);
  assert.equal(randomized.specifiedActionId, 'random');
  assert.equal(randomized.gestureId, 'random');
  assert.equal(randomized.gazeId, 'random');
  assert.equal(randomized.posePropId, original.posePropId);
  assert.equal(randomized.poseBaseId, original.poseBaseId);
  assert.equal(randomizeLockKeys(original, ['lightingId'], createEmptyLocks(), controls).specifiedActionId, ACTION.sitting);
  assert.equal(setLockKeysToNone(original, keys, controls).specifiedActionId, 'none');
});

test('global clear resets the supine snapshot and does not restore the scene it explicitly cleared', () => {
  const original = initialLocks({ poseBaseId: 'lying', poseOrientationId: 'lying-side' });
  const entered = transition(original, { specifiedActionId: ACTION.supine });
  const cleared = transition(entered, buildAllNoneLocks(controls, entered));
  assert.equal(cleared.specifiedActionId, 'none');
  assert.equal(cleared.specifiedActionSceneRestore, null);
  assert.equal(cleared.sceneAttributeId, 'none');
  assert.equal(cleared.locationId, optionId('locationId', '全無'));
});

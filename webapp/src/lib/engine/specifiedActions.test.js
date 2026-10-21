import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  SPECIFIED_ACTION_OPTIONS,
  SPECIFIED_ACTION_CONCRETE_OPTIONS,
  getSpecifiedAction,
  getSpecifiedActionEffectiveLocks,
} from './specifiedActions.js';

const fixtures = [
  ['specified-sitting-side-fold-back-support', 'sitting', 'none', 25, ['left side', 'both palms', 'slightly backward']],
  ['specified-sitting-raised-right-knee', 'sitting', 'none', 10, ['right knee raised', 'left palm', 'right thigh']],
  ['specified-sitting-hug-knees', 'sitting', 'none', 20, ['both knees close', 'opposite forearm', 'both feet flat']],
  ['specified-kneeling-wide-hands-front', 'kneeling', 'none', 23, ['hips on the ground between', 'both palms', 'knees spread']],
  ['specified-kneeling-all-fours-palms', 'kneeling', 'none', 8, ['palms beneath her shoulders', 'nearly parallel', 'abdomen clear']],
  ['specified-kneeling-all-fours-forearms', 'kneeling', 'none', 19, ['forearms flat', 'chest lower than her hips', 'abdomen clear']],
  ['specified-lying-left-side-forearm', 'lying', 'lying-side', 6, ['left side', 'left waist and chest', 'right thigh']],
  ['specified-lying-supine-raised-crossed-legs', 'lying', 'lying-supine', 24, ['back and pelvis', 'right thigh', 'both feet remain off']],
];

test('manual catalog pins eight reviewed actions, their base and reference provenance', () => {
  // 全無 + 隨機 + 任意 menu choices (v2 P2) + 11 v1 actions + 3 lying library v1 actions (v2 P1)
  // + 20 standing library v1 actions (2026-10-20) + 4 squatting library v1 actions (2026-10-21).
  assert.equal(SPECIFIED_ACTION_OPTIONS.length, 41);
  assert.equal(SPECIFIED_ACTION_OPTIONS[0].id, 'none');
  assert.equal(SPECIFIED_ACTION_OPTIONS[0].en, '');
  assert.deepEqual(SPECIFIED_ACTION_OPTIONS.slice(1, 3).map((option) => option.id), ['random', 'any']);
  assert.equal(SPECIFIED_ACTION_CONCRETE_OPTIONS.length, 38);
  assert.equal(new Set(SPECIFIED_ACTION_OPTIONS.map((option) => option.id)).size, 41);
  assert.ok(!SPECIFIED_ACTION_CONCRETE_OPTIONS.some((option) => ['random', 'any'].includes(option.id)));
  for (const [id, baseId, orientationId, referenceNumber, sources] of fixtures) {
    const action = SPECIFIED_ACTION_CONCRETE_OPTIONS.find((option) => option.id === id);
    assert.ok(action, id);
    assert.equal(action.baseId, baseId, id);
    assert.equal(action.orientationId, orientationId, id);
    assert.equal(action.referenceNumber, referenceNumber, id);
    assert.ok(action.zh && action.descriptionZh && action.upperBodyEn, id);
    for (const source of sources) assert.ok(action.en.includes(source), `${id}: ${source}`);
    assert.equal(action.meta.supportSurface, 'ground', id);
    assert.equal(action.meta.randomEligible, false, id);
    assert.ok(Object.isFrozen(action) && Object.isFrozen(action.meta), id);
  }
});

test('shared full and upper sources leave expression, head, camera and furniture independent', () => {
  for (const action of SPECIFIED_ACTION_CONCRETE_OPTIONS.slice(0, 8)) {
    for (const source of [action.en, action.upperBodyEn]) {
      assert.doesNotMatch(source, /\b(head|chin|gaze|camera|lens|framing|chair|sofa|bed|table|wall|blanket|drink|indoor)\b|\bsmil\w*/i, action.id);
      assert.doesNotMatch(source, /[\u3400-\u9fff]|fallback|guard|override|selection|specified action/i, action.id);
    }
    assert.doesNotMatch(action.upperBodyEn, /knees|feet|thigh|shins|pelvis|floor/i, action.id);
    if (action.meta.supineGroundOnly) assert.match(action.upperBodyEn, /on her back on the ground/);
    else assert.doesNotMatch(action.upperBodyEn, /ground/i, action.id);
    for (const bucket of ['chestUp', 'mediumWaist']) {
      assert.deepEqual(action.meta.projectionByBucket[bucket], { mode: 'projected', en: action.upperBodyEn });
    }
    for (const bucket of ['faceDetail', 'headShoulders']) {
      assert.equal(action.meta.projectionByBucket[bucket].mode, 'omit');
    }
  }
  const supine = SPECIFIED_ACTION_CONCRETE_OPTIONS[7];
  assert.equal(supine.meta.supineGroundOnly, true);
  assert.ok(SPECIFIED_ACTION_CONCRETE_OPTIONS.filter((_, index) => index !== 7).every((action) => !action.meta.supineGroundOnly));
});

test('only a concrete single-person action is active, independent of the free base', () => {
  for (const [id, baseId] of fixtures) {
    const source = { subjectCount: '1', poseBaseId: baseId, specifiedActionId: id };
    assert.equal(getSpecifiedAction(source)?.id, id);
    for (const patch of [
      { subjectCount: '2' }, { subjectCount: undefined },
      { specifiedActionId: 'none' }, { specifiedActionId: '' },
      { specifiedActionId: 'unknown' },
    ]) assert.equal(getSpecifiedAction({ ...source, ...patch }), null, `${id}: ${JSON.stringify(patch)}`);
    // 隨機 is a menu choice, never a concrete action; generation resolves it first (v2 P2).
    assert.ok(getSpecifiedAction({ ...source, specifiedActionId: 'random' })?.meta.tags.includes('menu_choice'), id);
  }
});

test('fixed scene position pauses the action without destroying its selection', () => {
  const source = { subjectCount: '1', poseBaseId: 'sitting', specifiedActionId: fixtures[0][0] };
  for (const owner of [
    { fixedCompositionSetId: 'nyc-subway-bench-platform', fixedSetPositionId: 'station-nyc-seated' },
    { fixedCompositionSetId: 'japan-carriage-rush-hour', fixedSetPositionId: 'carriage-crowd-seated' },
  ]) {
    const locks = Object.freeze({ ...source, ...owner });
    assert.equal(getSpecifiedAction(locks), null);
    assert.equal(getSpecifiedAction(locks, { ignoreOwners: true })?.id, source.specifiedActionId);
    assert.equal(getSpecifiedActionEffectiveLocks(locks), locks);
  }
  for (const actionPoseCardId of ['', 'none', 'random', 'any', 'unknown-legacy-card']) {
    assert.equal(getSpecifiedAction({ ...source, actionPoseCardId })?.id, source.specifiedActionId);
  }
  assert.equal(getSpecifiedAction({ ...source, fixedCompositionSetId: 'none', fixedSetPositionId: 'station-nyc-seated' })?.id,
    source.specifiedActionId);
  assert.equal(getSpecifiedAction({ ...source, poseBaseId: 'standing', actionPoseCardId: 'card' }, { ignoreOwners: true })?.id, source.specifiedActionId);
});

test('effective locks mask four latent layers and own lying orientation while preserving raw storage', () => {
  for (const [specifiedActionId, poseBaseId, poseOrientationId] of fixtures) {
    const raw = Object.freeze({ subjectCount: '1', specifiedActionId, poseBaseId,
      poseOrientationId: 'lying-prone', poseArrangementId: 'kneeling-all-fours',
      poseHandId: 'selfie-natural-right-arm', posePropId: 'selfie-mirror-phone-visible',
      poseAnchorId: 'lying-bed-surface', poseHeadId: 'head-looking-left',
      expressionId: 'expression-selected', orbitId: 'orbit-selected', locationId: 'location-selected' });
    const snapshot = structuredClone(raw);
    const effective = getSpecifiedActionEffectiveLocks(raw);
    assert.notEqual(effective, raw);
    assert.equal(effective.poseOrientationId, poseOrientationId);
    for (const key of ['poseArrangementId', 'poseHandId', 'posePropId', 'poseAnchorId']) {
      assert.equal(effective[key], 'none', `${specifiedActionId}: ${key}`);
    }
    for (const key of ['specifiedActionId', 'poseBaseId', 'poseHeadId', 'expressionId', 'orbitId', 'locationId']) {
      assert.equal(effective[key], raw[key], `${specifiedActionId}: ${key}`);
    }
    assert.deepEqual(raw, snapshot);
    assert.equal(getSpecifiedActionEffectiveLocks({ ...raw, specifiedActionId: 'none' }).poseHandId,
      raw.poseHandId);
  }
});

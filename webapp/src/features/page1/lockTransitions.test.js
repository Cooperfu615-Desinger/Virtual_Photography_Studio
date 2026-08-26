import assert from 'node:assert/strict';
import test from 'node:test';

import { createEmptyLocks, getLockControls } from '../../lib/engine.js';
import { transitionPage1Locks } from './lockTransitions.js';
import {
  PAGE1_SINGLE_COMPLETE_LOOK_STATE_KEYS,
  PAGE1_SINGLE_SEPARATE_WARDROBE_KEYS,
} from './page1WardrobeExclusivity.js';

function optionId(controls, key, zh) {
  return controls.find((control) => control.key === key)?.options.find((option) => option.zh === zh)?.id;
}

function activeOptionId(controls, key) {
  return controls.find((control) => control.key === key)?.options.find((option) => (
    option.zh !== '全無' && option.zh !== '隨機' && option.en !== 'none'
  ))?.id;
}

function assertInactive(locks, controls, keys) {
  keys.forEach((key) => {
    const value = locks[key];
    const option = controls.find((control) => control.key === key)?.options?.find((item) => item.id === value);
    assert.equal(
      Boolean(value && option && option.zh !== '全無' && option.en !== 'none'),
      false,
      `${key} should be inactive`,
    );
  });
}

test('page1 transition keeps special subject and character profile mutually exclusive', () => {
  const controls = getLockControls();
  const previousLocks = createEmptyLocks();
  const specialSubjectId = controls.find((control) => control.key === 'specialSubjectId')
    .options.find((option) => option.specialSubject)?.id;
  const characterProfileId = controls.find((control) => control.key === 'characterProfileId')
    .options.find((option) => option.specialSubject)?.id;

  const next = transitionPage1Locks({
    previousLocks,
    candidateLocks: { ...previousLocks, specialSubjectId, characterProfileId, subjectCount: '2' },
    lockControls: controls,
  });

  assert.equal(next.specialSubjectId, specialSubjectId);
  assert.equal(next.characterProfileId, 'none');
  assert.equal(next.subjectCount, '1');
});

test('page1 transition makes pose composer override legacy pose and special action', () => {
  const controls = getLockControls();
  const previousLocks = createEmptyLocks();
  const next = transitionPage1Locks({
    previousLocks,
    candidateLocks: {
      ...previousLocks,
      poseId: optionId(controls, 'poseId', '自然站立'),
      specialActionId: optionId(controls, 'specialActionId', '抽菸'),
      poseBaseId: optionId(controls, 'poseBaseId', '站姿'),
    },
    lockControls: controls,
  });

  assert.equal(next.poseId, '');
  assert.equal(next.specialActionId, '');
  assert.notEqual(next.poseBaseId, 'none');
});

test('page1 transition locks supine scene and fixed-composition controls to none', () => {
  const controls = getLockControls();
  const previousLocks = {
    ...createEmptyLocks(),
    sceneAttributeId: optionId(controls, 'sceneAttributeId', '室內'),
    locationId: optionId(controls, 'locationId', '室內：復古美式 Diner'),
    importedWorldSceneMode: 'architecture',
    importedWorldSceneLabel: 'Imported room',
    importedWorldSceneArchitectureText: 'Imported architecture',
    zImageVisibleTextEnabled: true,
    zImageVisibleTextContent: 'internal scene text',
    fixedCompositionSetId: activeOptionId(controls, 'fixedCompositionSetId'),
    fixedSetPositionId: activeOptionId(controls, 'fixedSetPositionId'),
    fixedSetBackgroundStateId: activeOptionId(controls, 'fixedSetBackgroundStateId'),
    fixedSetCaptureModeId: activeOptionId(controls, 'fixedSetCaptureModeId'),
    fixedSetPerformanceStateId: activeOptionId(controls, 'fixedSetPerformanceStateId'),
  };
  const next = transitionPage1Locks({
    previousLocks,
    candidateLocks: {
      ...previousLocks,
      poseBaseId: optionId(controls, 'poseBaseId', '躺姿'),
      poseOrientationId: optionId(controls, 'poseOrientationId', '仰躺'),
    },
    lockControls: controls,
  });

  [
    'sceneAttributeId',
    'locationId',
    'fixedCompositionSetId',
    'fixedSetPositionId',
    'fixedSetBackgroundStateId',
    'fixedSetCaptureModeId',
    'fixedSetPerformanceStateId',
  ].forEach((key) => assert.equal(next[key], 'none', `${key} should be forced to none`));
  assert.equal(next.importedWorldSceneMode, 'none');
  assert.equal(next.importedWorldSceneLabel, '');
  assert.equal(next.importedWorldSceneArchitectureText, '');
  assert.equal(next.zImageVisibleTextEnabled, false);
  assert.equal(next.zImageVisibleTextContent, '');
});

test('page1 transition lets an explicit prop take over hand and clears props in duo mode', () => {
  const controls = getLockControls();
  const previousLocks = createEmptyLocks();
  const handId = optionId(controls, 'poseHandId', '單手摸下巴');
  const propId = optionId(controls, 'posePropId', '手持冰咖啡');
  const propNext = transitionPage1Locks({
    previousLocks,
    candidateLocks: {
      ...previousLocks,
      poseHandId: handId,
      posePropId: propId,
    },
    lockControls: controls,
  });
  assert.equal(propNext.poseHandId, 'none');
  assert.equal(propNext.posePropId, propId);

  const duoNext = transitionPage1Locks({
    previousLocks: propNext,
    candidateLocks: { ...propNext, subjectCount: '2' },
    lockControls: controls,
  });
  assert.equal(duoNext.posePropId, 'none');
});

test('page1 close-up transitions preserve hidden selections and restore them at full body', () => {
  const controls = getLockControls();
  const previousLocks = {
    ...createEmptyLocks(),
    framingId: optionId(controls, 'framingId', '全身鏡頭 (Full Body Shot)'),
    characterProfileId: 'character-rika',
    bodyTypeId: optionId(controls, 'bodyTypeId', '小隻精緻身形'),
    topId: optionId(controls, 'topId', '襯衫'),
    skirtId: optionId(controls, 'skirtId', '百褶短裙'),
    outerwearId: optionId(controls, 'outerwearId', '丹寧外套'),
    legwearId: optionId(controls, 'legwearId', '羅紋短襪'),
    shoesId: optionId(controls, 'shoesId', 'Samba OG'),
    poseBaseId: optionId(controls, 'poseBaseId', '站姿'),
    poseArrangementId: optionId(controls, 'poseArrangementId', '一腳向前點地'),
    poseHandId: optionId(controls, 'poseHandId', '一手扶腰一手自然放下'),
    poseHeadId: optionId(controls, 'poseHeadId', '頭部微微側傾'),
    poseAnchorId: optionId(controls, 'poseAnchorId', '鏡面不鏽鋼立方台'),
    locationId: optionId(controls, 'locationId', '室內：復古美式 Diner'),
  };
  const preservedKeys = [
    'characterProfileId',
    'bodyTypeId',
    'topId',
    'skirtId',
    'outerwearId',
    'legwearId',
    'shoesId',
    'poseBaseId',
    'poseArrangementId',
    'poseHandId',
    'poseHeadId',
    'poseAnchorId',
    'locationId',
  ];

  const closeupLocks = transitionPage1Locks({
    previousLocks,
    candidateLocks: {
      ...previousLocks,
      framingId: optionId(controls, 'framingId', '臉部特寫'),
    },
    lockControls: controls,
  });

  for (const key of preservedKeys) {
    assert.equal(closeupLocks[key], previousLocks[key], `${key} should survive the close-up transition`);
  }

  const restoredLocks = transitionPage1Locks({
    previousLocks: closeupLocks,
    candidateLocks: {
      ...closeupLocks,
      framingId: optionId(controls, 'framingId', '全身鏡頭 (Full Body Shot)'),
    },
    lockControls: controls,
  });

  for (const key of preservedKeys) {
    assert.equal(restoredLocks[key], previousLocks[key], `${key} should return unchanged at full body`);
  }
});

test('page1 transition lets a newly selected dress replace normal separates while preserving outer layers', () => {
  const controls = getLockControls();
  const previousLocks = {
    ...createEmptyLocks(),
    topId: activeOptionId(controls, 'topId'),
    topFitId: activeOptionId(controls, 'topFitId'),
    topStylingId: activeOptionId(controls, 'topStylingId'),
    topBottomPaletteId: activeOptionId(controls, 'topBottomPaletteId'),
    pantsId: activeOptionId(controls, 'pantsId'),
    bottomFitId: activeOptionId(controls, 'bottomFitId'),
    outerwearId: activeOptionId(controls, 'outerwearId'),
    shoesId: activeOptionId(controls, 'shoesId'),
  };
  const dressId = activeOptionId(controls, 'dressId');

  const next = transitionPage1Locks({
    previousLocks,
    candidateLocks: { ...previousLocks, dressId },
    lockControls: controls,
  });

  assert.equal(next.dressId, dressId);
  assertInactive(next, controls, PAGE1_SINGLE_SEPARATE_WARDROBE_KEYS);
  assert.equal(next.outerwearId, previousLocks.outerwearId);
  assert.equal(next.shoesId, previousLocks.shoesId);
});

test('page1 transition lets a newly selected separate replace a dress while preserving outer layers', () => {
  const controls = getLockControls();
  const previousLocks = {
    ...createEmptyLocks(),
    dressId: activeOptionId(controls, 'dressId'),
    dressColorId: activeOptionId(controls, 'dressColorId'),
    completeLookPaletteId: activeOptionId(controls, 'completeLookPaletteId'),
    outerwearId: activeOptionId(controls, 'outerwearId'),
  };
  const topId = activeOptionId(controls, 'topId');

  const next = transitionPage1Locks({
    previousLocks,
    candidateLocks: { ...previousLocks, topId },
    lockControls: controls,
  });

  assert.equal(next.topId, topId);
  assertInactive(next, controls, PAGE1_SINGLE_COMPLETE_LOOK_STATE_KEYS);
  assert.equal(next.outerwearId, previousLocks.outerwearId);
});

test('page1 transition lets complete-look choices replace each other by explicit action order', () => {
  const controls = getLockControls();
  const outfitPresetId = activeOptionId(controls, 'outfitPresetId');
  const dressId = activeOptionId(controls, 'dressId');
  const emptyLocks = createEmptyLocks();
  const outfitLocks = transitionPage1Locks({
    previousLocks: emptyLocks,
    candidateLocks: { ...emptyLocks, outfitPresetId },
    lockControls: controls,
  });
  const dressLocks = transitionPage1Locks({
    previousLocks: outfitLocks,
    candidateLocks: { ...outfitLocks, dressId },
    lockControls: controls,
  });
  const restoredOutfitLocks = transitionPage1Locks({
    previousLocks: dressLocks,
    candidateLocks: { ...dressLocks, outfitPresetId },
    lockControls: controls,
  });

  assert.equal(dressLocks.dressId, dressId);
  assertInactive(dressLocks, controls, ['outfitPresetId']);
  assert.equal(restoredOutfitLocks.outfitPresetId, outfitPresetId);
  assertInactive(restoredOutfitLocks, controls, ['dressId']);
});

test('page1 bulk wardrobe restore keeps complete-look priority over conflicting separates', () => {
  const controls = getLockControls();
  const previousLocks = createEmptyLocks();
  const outfitPresetId = activeOptionId(controls, 'outfitPresetId');

  const next = transitionPage1Locks({
    previousLocks,
    candidateLocks: {
      ...previousLocks,
      outfitPresetId,
      dressId: activeOptionId(controls, 'dressId'),
      topId: activeOptionId(controls, 'topId'),
      skirtId: activeOptionId(controls, 'skirtId'),
      outerwearId: activeOptionId(controls, 'outerwearId'),
    },
    lockControls: controls,
  });

  assert.equal(next.outfitPresetId, outfitPresetId);
  assertInactive(next, controls, ['dressId', ...PAGE1_SINGLE_SEPARATE_WARDROBE_KEYS]);
  assert.notEqual(next.outerwearId, 'none');
});

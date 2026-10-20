import assert from 'node:assert/strict';
import test from 'node:test';

import { createEmptyLocks, getLockControls, getSceneDependentOptions } from '../../lib/engine.js';
import { buildAllNoneLocks, buildPage1ControlGroups } from './page1Selectors.js';

test('buildAllNoneLocks preserves required defaults when a control has no none option', () => {
  const controls = [
    {
      key: 'subjectCount',
      required: true,
      defaultValue: '1',
      options: [{ id: '1', zh: '1 位' }, { id: '2', zh: '2 位' }],
    },
    {
      key: 'imageTypePresetId',
      defaultValue: 'photorealistic-photo',
      suppressDefaultRandomOption: true,
      options: [{ id: 'photorealistic-photo', zh: '寫實攝影' }],
    },
    {
      key: 'topId',
      options: [{ id: 'top-none', zh: '全無' }, { id: 'top-random', zh: '隨機上身' }],
    },
  ];

  const next = buildAllNoneLocks(controls, {
    subjectCount: '2',
    imageTypePresetId: 'illustrated',
    topId: 'top-random',
  });

  assert.equal(next.subjectCount, '2');
  assert.equal(next.imageTypePresetId, 'photorealistic-photo');
  assert.equal(next.topId, 'top-none');
});

test('global none selects the existing no-extra-expression IDs for single and dormant duo expressions', () => {
  const lockControls = getLockControls();
  const expressionKeys = ['expressionId', 'expressionAId', 'expressionBId'];
  const selectedExpressions = Object.fromEntries(expressionKeys.map((key) => {
    const control = lockControls.find((item) => item.key === key);
    return [key, control.options.find((option) => option.en !== 'none').id];
  }));

  for (const subjectCount of ['1', '2']) {
    const next = buildAllNoneLocks(lockControls, {
      ...createEmptyLocks(),
      ...selectedExpressions,
      subjectCount,
    });

    expressionKeys.forEach((key) => {
      const noneOption = lockControls.find((control) => control.key === key)
        .options.find((option) => option.zh === '無額外表情');
      assert.ok(noneOption, `${key} retains its authored no-extra-expression option`);
      assert.equal(noneOption.en, 'none');
      assert.equal(noneOption.id, 'character:表情-facial-expression:無額外表情:0');
      assert.ok(noneOption.legacyIds.includes('character:神情與眼神-expression-gaze:全無:0'));
      assert.equal(next[key], noneOption.id, `${key} is explicitly none in ${subjectCount}-person mode`);
    });
  }
});

test('global none sets every eligible real control to its authored none option in single and duo modes', () => {
  const lockControls = getLockControls();
  const isNoneOption = (option) => option.zh === '全無' || option.en === 'none';
  const currentSelections = Object.fromEntries(lockControls.map((control) => [
    control.key,
    control.options.find((option) => !isNoneOption(option) && option.id !== 'random')?.id
      ?? control.defaultValue ?? '',
  ]));

  for (const subjectCount of ['1', '2']) {
    const current = { ...createEmptyLocks(), ...currentSelections, subjectCount };
    const original = structuredClone(current);
    const next = buildAllNoneLocks(lockControls, current);

    lockControls.forEach((control) => {
      if (control.section === 'midjourney' || control.randomization === 'excluded') return;
      const noneOption = control.options.find(isNoneOption);
      if (noneOption) {
        assert.equal(next[control.key], noneOption.id, `${control.key} uses its own none ID`);
        assert.notEqual(next[control.key], '', `${control.key} must not become implicit random`);
      }
    });
    assert.equal(next.subjectCount, subjectCount);
    assert.equal(next.imageTypePresetId, 'photorealistic-photo');
    assert.deepEqual(current, original, 'global none must not mutate the input locks');
  }
});

test('global none preserves all seven MJ settings, four visible-text settings, and the historical ratio', () => {
  const lockControls = getLockControls();
  const preservedSettings = {
    mjVersionId: 'v8-1',
    mjAspectRatio: '21:9',
    mjRawMode: 'standard',
    mjStylize: 321,
    mjChaos: 37,
    mjWeirdness: 678,
    mjResolution: 'hd',
    zImageVisibleTextEnabled: true,
    zImageVisibleTextContent: '保留畫面文字\nExact visible text',
    zImageVisibleTextLanguage: 'english',
    zImageVisibleTextPlacement: 'background-storefront-sign',
    aspectRatio: lockControls.find((control) => control.key === 'aspectRatio')
      .options.find((option) => option.zh !== '全無').id,
  };
  const excludedKeys = lockControls
    .filter((control) => control.section === 'midjourney' || control.randomization === 'excluded')
    .map((control) => control.key);
  assert.deepEqual([...excludedKeys].sort(), Object.keys(preservedSettings).sort());

  for (const subjectCount of ['1', '2']) {
    const current = { ...createEmptyLocks(), ...preservedSettings, subjectCount };
    const next = buildAllNoneLocks(lockControls, current);
    assert.deepEqual(
      Object.fromEntries(excludedKeys.map((key) => [key, next[key]])),
      preservedSettings,
    );
    assert.equal(next.subjectCount, subjectCount);
  }
});

test('global none clears subject, fixed-scene, specified-action, card, and imported-scene owners', () => {
  const lockControls = getLockControls();
  const selectedOptionId = (key) => lockControls.find((control) => control.key === key)
    .options.find((option) => option.zh !== '全無' && option.en !== 'none' && option.id !== 'random').id;
  const current = {
    ...createEmptyLocks(),
    specialSubjectId: selectedOptionId('specialSubjectId'),
    characterProfileId: selectedOptionId('characterProfileId'),
    characterCardHairVariantId: 'custom-hair',
    characterCardEyewearMode: 'custom-eyewear',
    characterCardWardrobeMode: 'custom-wardrobe',
    characterCardWardrobeLayerIds: ['custom-layer'],
    characterCardPromptOverride: 'custom identity text',
    fixedCompositionSetId: selectedOptionId('fixedCompositionSetId'),
    fixedSetPositionId: selectedOptionId('fixedSetPositionId'),
    fixedSetBackgroundStateId: selectedOptionId('fixedSetBackgroundStateId'),
    fixedSetCaptureModeId: selectedOptionId('fixedSetCaptureModeId'),
    fixedSetPerformanceStateId: selectedOptionId('fixedSetPerformanceStateId'),
    specifiedActionId: selectedOptionId('specifiedActionId'),
    specifiedActionSceneRestore: { sceneAttributeId: 'indoor', locationId: 'previous-scene' },
    actionPoseCardId: 'saved-action-card',
    importedWorldSceneMode: 'replace',
    importedWorldSceneLabel: 'imported scene',
    importedWorldSceneArchitectureText: 'imported architecture text',
  };
  const original = structuredClone(current);
  const next = buildAllNoneLocks(lockControls, current);

  [
    'specialSubjectId', 'characterProfileId', 'fixedCompositionSetId',
    'fixedSetPositionId', 'fixedSetBackgroundStateId', 'fixedSetCaptureModeId',
    'fixedSetPerformanceStateId', 'specifiedActionId', 'importedWorldSceneMode',
  ].forEach((key) => assert.equal(next[key], 'none', `${key} relinquishes control`));
  assert.equal(next.specifiedActionSceneRestore, null);
  assert.equal(next.actionPoseCardId, '');
  assert.equal(next.characterCardHairVariantId, 'default');
  assert.equal(next.characterCardEyewearMode, 'default');
  assert.equal(next.characterCardWardrobeMode, 'full-default');
  assert.deepEqual(next.characterCardWardrobeLayerIds, []);
  ['characterCardPromptOverride', 'importedWorldSceneLabel', 'importedWorldSceneArchitectureText']
    .forEach((key) => assert.equal(next[key], '', `${key} no longer supplies hidden content`));
  assert.deepEqual(current, original);
});

test('global none clears ordinary pose layers and explicit props instead of preserving or randomizing them', () => {
  const lockControls = getLockControls();
  const poseKeys = [
    'poseBaseId', 'poseOrientationId', 'poseArrangementId', 'poseHandId',
    'poseHeadId', 'poseAnchorId', 'posePropId', 'poseId', 'specialActionId',
  ];
  const current = {
    ...createEmptyLocks(),
    ...Object.fromEntries(poseKeys.map((key) => {
      const control = lockControls.find((item) => item.key === key);
      return [key, control.options.find((option) => (
        option.zh !== '全無' && option.en !== 'none' && option.id !== 'random'
      )).id];
    })),
  };
  const next = buildAllNoneLocks(lockControls, current);

  poseKeys.forEach((key) => {
    const noneOption = lockControls.find((control) => control.key === key)
      .options.find((option) => option.zh === '全無' || option.en === 'none');
    assert.equal(next[key], noneOption.id, `${key} is explicitly cleared`);
    assert.notEqual(next[key], '', `${key} must not become implicit random`);
    assert.notEqual(next[key], 'random', `${key} must not become explicit random`);
  });
});

test('eyewear frame color and placement controls follow single and duo subject modes together', () => {
  const lockControls = getLockControls();
  const wardrobeControlKeys = (subjectCount) => {
    const locks = { ...createEmptyLocks(), subjectCount };
    const { wardrobeLockControls } = buildPage1ControlGroups({
      lockControls,
      locks,
      sceneDependentOptions: getSceneDependentOptions([], locks),
    });
    return new Set(wardrobeLockControls.map((control) => control.key));
  };

  const singleKeys = wardrobeControlKeys('1');
  ['headphonesId', 'headphonesColorId', 'faceCoveringId', 'faceCoveringColorId', 'headAccessoryId', 'headAccessoryColorId', 'eyewearId', 'eyewearColorId', 'eyewearPlacementId'].forEach((key) => assert.ok(singleKeys.has(key), `single mode should show ${key}`));
  [
    'headAccessoryAId', 'headAccessoryAColorId',
    'headAccessoryBId', 'headAccessoryBColorId',
    'headphonesAId', 'headphonesAColorId', 'faceCoveringAId', 'faceCoveringAColorId',
    'headphonesBId', 'headphonesBColorId', 'faceCoveringBId', 'faceCoveringBColorId',
    'eyewearAId', 'eyewearAColorId', 'eyewearAPlacementId',
    'eyewearBId', 'eyewearBColorId', 'eyewearBPlacementId',
  ].forEach((key) => assert.equal(singleKeys.has(key), false, `single mode should hide ${key}`));

  const duoKeys = wardrobeControlKeys('2');
  ['headphonesId', 'headphonesColorId', 'faceCoveringId', 'faceCoveringColorId', 'headAccessoryId', 'headAccessoryColorId', 'eyewearId', 'eyewearColorId', 'eyewearPlacementId'].forEach((key) => assert.equal(duoKeys.has(key), false, `duo mode should hide ${key}`));
  [
    'headAccessoryAId', 'headAccessoryAColorId',
    'headAccessoryBId', 'headAccessoryBColorId',
    'headphonesAId', 'headphonesAColorId', 'faceCoveringAId', 'faceCoveringAColorId',
    'headphonesBId', 'headphonesBColorId', 'faceCoveringBId', 'faceCoveringBColorId',
    'eyewearAId', 'eyewearAColorId', 'eyewearAPlacementId',
    'eyewearBId', 'eyewearBColorId', 'eyewearBPlacementId',
  ].forEach((key) => assert.ok(duoKeys.has(key), `duo mode should show ${key}`));
});

test('duo wardrobe controls keep the other person editable when one person uses a special outfit', () => {
  const lockControls = getLockControls();
  const specialOutfitAId = lockControls
    .find((control) => control.key === 'specialOutfitAId')
    ?.options.find((option) => option.zh !== '全無' && option.zh !== '隨機')?.id;
  const locks = {
    ...createEmptyLocks(),
    subjectCount: '2',
    specialOutfitAId,
  };
  const { wardrobeLockControls } = buildPage1ControlGroups({
    lockControls,
    locks,
    sceneDependentOptions: getSceneDependentOptions([], locks),
  });
  const wardrobeKeys = new Set(wardrobeLockControls.map((control) => control.key));

  ['specialOutfitAId', 'completeLookPaletteAId', 'specialOutfitBId', 'topBId', 'waistAccessoryBId']
    .forEach((key) => assert.ok(wardrobeKeys.has(key), `duo mode should keep ${key} visible`));
  ['outfitPresetAId', 'topAId', 'outerwearAId', 'headAccessoryAId', 'eyewearAPlacementId', 'waistAccessoryAId']
    .forEach((key) => assert.equal(wardrobeKeys.has(key), false, `special outfit should take over ${key}`));
  ['waistAccessoryId', 'topId', 'headAccessoryId']
    .forEach((key) => assert.equal(wardrobeKeys.has(key), false, `duo mode should hide shared ${key}`));
});

test('duo expression UI exposes the eight current choices and preserves selected legacy values', () => {
  const lockControls = getLockControls();
  const visibleLabels = [
    '全無',
    '兩人直視鏡頭｜平靜冷淡',
    '兩人直視鏡頭｜柔和微笑',
    '兩人相互凝視｜安靜親密',
    '兩人相互大笑｜自然開心',
    '一人看鏡頭｜一人看對方',
    '一人看鏡頭｜一人隨性離鏡',
    '兩人同向離鏡｜共同注意',
    '兩人各自離鏡｜個別分心',
  ];
  const locks = { ...createEmptyLocks(), subjectCount: '2' };
  const buildGroups = (nextLocks) => buildPage1ControlGroups({
    lockControls,
    locks: nextLocks,
    sceneDependentOptions: getSceneDependentOptions([], nextLocks),
  });

  const normalControl = buildGroups(locks).characterLockControls.find((control) => control.key === 'duoExpressionId');
  assert.deepEqual(normalControl.options.map((option) => option.zh), visibleLabels);
  assert.doesNotMatch(normalControl.options.map((option) => option.zh).join(' '), /彼此微笑|曖昧對視|低眼神互動/);

  const legacyOption = lockControls
    .find((control) => control.key === 'duoExpressionId')
    ?.options.find((option) => option.zh === '彼此微笑｜柔和默契');
  const restoredControl = buildGroups({ ...locks, duoExpressionId: legacyOption.id })
    .characterLockControls.find((control) => control.key === 'duoExpressionId');
  assert.ok(restoredControl.options.some((option) => option.id === legacyOption.id));
});

test('single dress reports complete-look takeover state to the PAGE1 UI', () => {
  const lockControls = getLockControls();
  const dressId = lockControls
    .find((control) => control.key === 'dressId')
    ?.options.find((option) => option.zh !== '全無' && option.zh !== '隨機')?.id;
  const locks = { ...createEmptyLocks(), dressId };

  const { isOutfitPresetActive } = buildPage1ControlGroups({
    lockControls,
    locks,
    sceneDependentOptions: getSceneDependentOptions([], locks),
  });

  assert.equal(isOutfitPresetActive, true);
});

// P5a (2026-10-20): supine now comes from the ground-only supine action; the
// retired anchor layer has no picker.
test('supine PAGE1 scene controls display only disabled none values', () => {
  const lockControls = getLockControls();
  const locks = {
    ...createEmptyLocks(),
    subjectCount: '1',
    specifiedActionId: 'specified-lying-supine-raised-crossed-legs',
    sceneAttributeId: 'indoor',
    locationId: lockControls.find((control) => control.key === 'locationId')?.options.find((option) => option.zh !== '全無')?.id,
  };
  const sceneDependentOptions = getSceneDependentOptions([], locks);
  const { coreLockControls, characterLockControls } = buildPage1ControlGroups({
    lockControls,
    locks,
    sceneDependentOptions,
  });

  const sceneAttribute = coreLockControls.find((control) => control.key === 'sceneAttributeId');
  const location = coreLockControls.find((control) => control.key === 'locationId');
  assert.deepEqual(sceneAttribute.options.map((option) => option.zh), ['全無']);
  assert.deepEqual(location.options.map((option) => option.zh), ['全無']);
  assert.equal(characterLockControls.some((control) => control.key === 'poseAnchorId'), false);
});

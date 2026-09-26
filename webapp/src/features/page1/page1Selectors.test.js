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

test('supine PAGE1 scene controls display only disabled none values while support anchors stay available', () => {
  const lockControls = getLockControls();
  const locks = {
    ...createEmptyLocks(),
    poseBaseId: lockControls.find((control) => control.key === 'poseBaseId')?.options.find((option) => option.zh === '躺姿')?.id,
    poseOrientationId: lockControls.find((control) => control.key === 'poseOrientationId')?.options.find((option) => option.zh === '仰躺')?.id,
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
  assert.ok(characterLockControls.find((control) => control.key === 'poseAnchorId')?.options.some((option) => option.zh === '床上'));
  assert.ok(characterLockControls.find((control) => control.key === 'poseAnchorId')?.options.some((option) => option.zh === '水泥地上'));
});

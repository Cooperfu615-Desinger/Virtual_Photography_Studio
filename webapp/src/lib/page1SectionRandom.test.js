import assert from 'node:assert/strict';
import { SPECIFIED_ACTION_RANDOM_POOL } from './engine/specifiedActions.js';
import { test } from 'node:test';

import {
  createEmptyLocks,
  createSeededRandom,
  generatePrompts,
  getLockControls,
} from './engine.js';
import {
  getPage1ControlActionMode,
  getPage1SectionActionLabels,
  randomizePage1WardrobePanelLocks,
  randomizeLockKeys,
  setLockKeysToNone,
} from './page1SectionRandom.js';
import { PAGE1_POSE_SUBPANELS } from './page1WorkspacePanels.js';
import { POSE_COMPOSER_KEYS, SECTION_SUBPANELS } from '../features/page1/page1Schema.js';
import {
  PAGE1_SINGLE_COMPLETE_LOOK_STATE_KEYS,
  PAGE1_SINGLE_SEPARATE_WARDROBE_KEYS,
} from '../features/page1/page1WardrobeExclusivity.js';
import { transitionPage1Locks } from '../features/page1/lockTransitions.js';
import { buildAllNoneLocks } from '../features/page1/page1Selectors.js';

function activeOptionId(controls, key) {
  return controls.find((control) => control.key === key)?.options.find((option) => (
    option.zh !== '全無' && option.zh !== '隨機' && option.en !== 'none'
  ))?.id;
}

function isActiveSelection(locks, controls, key) {
  const value = locks[key];
  const option = controls.find((control) => control.key === key)?.options?.find((item) => item.id === value);
  return Boolean(value && option && option.zh !== '全無' && option.en !== 'none');
}

test('randomizeLockKeys resets only the requested page1 section fields', () => {
  const defaults = createEmptyLocks();
  const locks = {
    ...defaults,
    faceId: 'face-id',
    hairId: 'hair-id',
    topId: 'top-id',
    pantsId: 'pants-id',
    locationId: 'location-id',
    styleId: 'style-id',
  };

  const next = randomizeLockKeys(locks, ['topId', 'pantsId'], defaults);

  assert.equal(next.topId, defaults.topId);
  assert.equal(next.pantsId, defaults.pantsId);
  assert.equal(next.faceId, 'face-id');
  assert.equal(next.hairId, 'hair-id');
  assert.equal(next.locationId, 'location-id');
  assert.equal(next.styleId, 'style-id');
});

test('setLockKeysToNone sets only requested page1 section fields to none', () => {
  const locks = {
    subjectCount: '2',
    topId: 'top-id',
    pantsId: 'pants-id',
    locationId: 'location-id',
    styleId: 'style-id',
    ringIds: ['ring-id'],
  };
  const controls = [
    { key: 'subjectCount', options: [{ id: '1', zh: '1 位' }, { id: '2', zh: '2 位' }] },
    { key: 'topId', options: [{ id: 'top-none', zh: '全無' }, { id: 'top-id', zh: '上衣' }] },
    { key: 'pantsId', options: [{ id: 'pants-none', zh: '全無' }, { id: 'pants-id', zh: '褲裝' }] },
    { key: 'ringIds', options: [] },
  ];

  const next = setLockKeysToNone(locks, ['subjectCount', 'topId', 'pantsId', 'ringIds'], controls);

  assert.equal(next.subjectCount, '2');
  assert.equal(next.topId, 'top-none');
  assert.equal(next.pantsId, 'pants-none');
  assert.deepEqual(next.ringIds, []);
  assert.equal(next.locationId, 'location-id');
  assert.equal(next.styleId, 'style-id');
});

test('randomizeLockKeys preserves required fields and resets non-random takeover fields', () => {
  const defaults = {
    subjectCount: '1',
    specialSubjectId: 'none',
    characterProfileId: 'none',
    poseBaseId: 'none',
    imageTypePresetId: 'photorealistic-photo',
  };
  const controls = [
    {
      key: 'subjectCount',
      required: true,
      defaultValue: '1',
      options: [{ id: '1', zh: '1 位' }, { id: '2', zh: '2 位' }],
    },
    {
      key: 'specialSubjectId',
      defaultValue: 'none',
      options: [{ id: 'none', zh: '全無' }, { id: 'skeleton', zh: '黑骷髏' }],
    },
    {
      key: 'characterProfileId',
      defaultValue: 'none',
      options: [{ id: 'none', zh: '全無' }, { id: 'character-rika', zh: '11_Rika' }],
    },
    {
      key: 'poseBaseId',
      defaultValue: 'none',
      suppressDefaultRandomOption: true,
      options: [
        { id: 'none', zh: '全無' },
        { id: 'random', zh: '隨機', meta: { tags: ['random'] } },
        { id: 'standing', zh: '站姿' },
      ],
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
  const locks = {
    ...defaults,
    subjectCount: '2',
    specialSubjectId: 'skeleton',
    characterProfileId: 'character-rika',
    poseBaseId: 'standing',
    imageTypePresetId: 'photorealistic-photo',
    topId: 'top-random',
  };

  const next = randomizeLockKeys(
    locks,
    controls.map((control) => control.key),
    defaults,
    controls,
  );

  assert.equal(next.subjectCount, '2');
  assert.equal(next.specialSubjectId, 'none');
  assert.equal(next.characterProfileId, 'none');
  // expression-pose-v2 P2: free-composer body layers reset instead of randomizing.
  assert.equal(next.poseBaseId, 'none');
  assert.equal(next.imageTypePresetId, 'photorealistic-photo');
  assert.equal(next.topId, '');
});

test('Z-Image exact visible text stays outside global random and clear operations', () => {
  const controls = getLockControls();
  const locks = {
    ...createEmptyLocks(),
    zImageVisibleTextEnabled: true,
    zImageVisibleTextContent: '美華冰室',
    zImageVisibleTextLanguage: 'traditional-chinese',
    zImageVisibleTextPlacement: 'background-storefront-sign',
  };
  const keys = [
    'zImageVisibleTextEnabled',
    'zImageVisibleTextContent',
    'zImageVisibleTextLanguage',
    'zImageVisibleTextPlacement',
  ];
  const randomized = randomizeLockKeys(
    locks,
    controls.map((control) => control.key),
    createEmptyLocks(),
    controls,
  );
  const cleared = buildAllNoneLocks(controls, locks);

  keys.forEach((key) => {
    assert.deepEqual(randomized[key], locks[key]);
    assert.deepEqual(cleared[key], locks[key]);
  });
});

// expression-pose-v2 P2 (Cooper 2026-10-19): pose random sets the menu to 隨機,
// resets the free-composer body, hand and support layers, keeps the head layer
// random until it becomes gaze (P4) and leaves the prop layer independent.
test('single pose panel sets the pose menu to random and resets free-composer body layers', () => {
  const controls = getLockControls();
  const defaults = createEmptyLocks();
  const singlePosePanel = PAGE1_POSE_SUBPANELS.find((panel) => panel.id === 'single');
  assert.ok(singlePosePanel, 'Expected the single-subject pose panel');

  const randomized = randomizeLockKeys(
    { ...defaults, subjectCount: '1' },
    singlePosePanel.keys,
    defaults,
    controls,
  );

  assert.equal(randomized.specifiedActionId, 'random');
  for (const key of POSE_COMPOSER_KEYS.filter((key) => key !== 'poseHeadId')) {
    assert.equal(randomized[key], 'none', `${key} no longer randomizes`);
  }
  assert.equal(randomized.poseHeadId, 'random');
  assert.equal(randomized.posePropId, 'none', 'The independent prop layer should keep its current none value');

  const fullBody = controls.find((entry) => entry.key === 'framingId').options.find((option) => option.zh === '全身鏡頭 (Full Body Shot)').id;
  const [prompt] = generatePrompts(1, { ...randomized, framingId: fullBody }, [], {
    random: createSeededRandom('pose-panel-random-contract-v2'),
  });
  const drawn = SPECIFIED_ACTION_RANDOM_POOL.find((action) => action.id === prompt.selection.specifiedActionId);
  assert.ok(drawn, 'the selection names one accepted library action');
  assert.notEqual(drawn.family, 'lying', 'lying waits for scene surfaces (P3)');
  assert.ok(prompt.grokPrompt.includes(drawn.en.slice(0, 40)), 'the drawn action is rendered at full body');
  // An action that owns the head keeps the raw head lock for a later cancel.
  for (const key of POSE_COMPOSER_KEYS.filter((key) => !(key === 'poseHeadId' && drawn.ownsHead))) {
    assert.notEqual(prompt.selection[key], 'random', `${key} should not expose the random sentinel`);
  }
});

test('single pose panel preserves an explicit prop while rerandomizing compatible pose layers', () => {
  const controls = getLockControls();
  const defaults = createEmptyLocks();
  const singlePosePanel = PAGE1_POSE_SUBPANELS.find((panel) => panel.id === 'single');
  const propId = controls
    .find((entry) => entry.key === 'posePropId')
    ?.options.find((option) => option.zh === '手持冰咖啡')?.id;
  assert.ok(propId);

  const randomized = randomizeLockKeys(
    { ...defaults, subjectCount: '1', posePropId: propId },
    singlePosePanel.keys,
    defaults,
    controls,
  );
  assert.equal(randomized.posePropId, propId);

  const [prompt] = generatePrompts(1, randomized, [], {
    random: createSeededRandom('pose-panel-fixed-prop-contract-v1'),
  });
  // v2 P2 interim: the drawn action takes over the prop layer in the prompt while
  // the raw prop selection is kept (props leave the composer in P4/P5, decision 2A).
  assert.equal(randomized.specifiedActionId, 'random');
  const drawn = SPECIFIED_ACTION_RANDOM_POOL.find((action) => action.id === prompt.selection.specifiedActionId);
  assert.ok(drawn, 'the selection names one accepted library action');
  assert.equal(prompt.selection.poseHandId, 'none');
  assert.notEqual(prompt.selection.poseBaseId, 'random');
  assert.notEqual(prompt.selection.poseArrangementId, 'random');
  assert.notEqual(prompt.selection.poseAnchorId, 'random');
});

test('section action labels explain panels without randomizable fields', () => {
  const controls = [
    {
      key: 'specialSubjectId',
      defaultValue: 'none',
      options: [{ id: 'none', zh: '全無' }],
    },
  ];

  assert.equal(getPage1ControlActionMode(controls[0], controls), 'reset');
  assert.deepEqual(
    getPage1SectionActionLabels({
      keys: ['specialSubjectId'],
      randomActionLabel: '重設為未指定',
    }, controls),
    { random: '重設為未指定', none: '清空可清除項目' },
  );
});

test('outfit preset primary color keeps its hidden legacy alias synchronized through UI transitions', () => {
  const controls = getLockControls();
  const defaults = createEmptyLocks();
  const primaryColorId = activeOptionId(controls, 'outfitPresetPrimaryColorId');

  const selected = transitionPage1Locks({
    previousLocks: defaults,
    candidateLocks: {
      ...defaults,
      outfitPresetPrimaryColorId: primaryColorId,
    },
    lockControls: controls,
  });

  assert.equal(selected.outfitPresetPrimaryColorId, primaryColorId);
  assert.equal(selected.outfitPresetColorId, primaryColorId);

  const returnedToRandom = transitionPage1Locks({
    previousLocks: selected,
    candidateLocks: {
      ...selected,
      outfitPresetPrimaryColorId: '',
    },
    lockControls: controls,
  });

  assert.equal(returnedToRandom.outfitPresetPrimaryColorId, '');
  assert.equal(returnedToRandom.outfitPresetColorId, '');
});

test('complete-look panel random clears normal separates before randomizing', () => {
  const controls = getLockControls();
  const defaults = createEmptyLocks();
  const panel = SECTION_SUBPANELS.wardrobe.find((item) => item.id === 'overall');
  const locks = {
    ...defaults,
    topId: activeOptionId(controls, 'topId'),
    topFitId: activeOptionId(controls, 'topFitId'),
    pantsId: activeOptionId(controls, 'pantsId'),
    bottomColorId: activeOptionId(controls, 'bottomColorId'),
  };

  const next = randomizePage1WardrobePanelLocks(
    locks,
    panel.id,
    panel.keys,
    defaults,
    controls,
  );

  PAGE1_SINGLE_SEPARATE_WARDROBE_KEYS.forEach((key) => {
    assert.equal(isActiveSelection(next, controls, key), false, `${key} should be inactive`);
  });
  assert.equal(next.outfitPresetId, '');
  assert.equal(next.dressId, '');

  const transitioned = transitionPage1Locks({
    previousLocks: locks,
    candidateLocks: next,
    lockControls: controls,
  });
  assert.equal(transitioned.outfitPresetId, '', 'outfit preset should remain in random mode');
  assert.equal(transitioned.dressId, '', 'dress should remain in random mode');
});

test('normal-separates panel random clears complete looks before randomizing', () => {
  const controls = getLockControls();
  const defaults = createEmptyLocks();
  const panel = SECTION_SUBPANELS.wardrobe.find((item) => item.id === 'garments');
  const locks = {
    ...defaults,
    dressId: activeOptionId(controls, 'dressId'),
    dressColorId: activeOptionId(controls, 'dressColorId'),
    completeLookPaletteId: activeOptionId(controls, 'completeLookPaletteId'),
  };

  const next = randomizePage1WardrobePanelLocks(
    locks,
    panel.id,
    panel.keys,
    defaults,
    controls,
  );

  PAGE1_SINGLE_COMPLETE_LOOK_STATE_KEYS.forEach((key) => {
    assert.equal(isActiveSelection(next, controls, key), false, `${key} should be inactive`);
  });
  assert.equal(next.topId, '');
  assert.equal(next.pantsId, '');
  assert.equal(next.skirtId, '');

  const transitioned = transitionPage1Locks({
    previousLocks: locks,
    candidateLocks: next,
    lockControls: controls,
  });
  assert.equal(transitioned.topId, '', 'top should remain in random mode');
  assert.equal(transitioned.pantsId, '', 'pants should remain in random mode');
  assert.equal(transitioned.skirtId, '', 'skirt should remain in random mode');
});

test('global random preserves random mode for both complete-look and separates families', () => {
  const controls = getLockControls();
  const defaults = createEmptyLocks();
  const locks = {
    ...defaults,
    dressId: activeOptionId(controls, 'dressId'),
    outerwearId: activeOptionId(controls, 'outerwearId'),
  };
  const randomized = randomizeLockKeys(
    locks,
    controls.map((control) => control.key),
    defaults,
    controls,
  );
  const transitioned = transitionPage1Locks({
    previousLocks: locks,
    candidateLocks: randomized,
    lockControls: controls,
  });

  ['outfitPresetId', 'dressId', 'topId', 'pantsId', 'skirtId'].forEach((key) => {
    assert.equal(transitioned[key], '', `${key} should remain in engine random mode`);
  });
});

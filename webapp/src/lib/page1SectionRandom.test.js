import assert from 'node:assert/strict';
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
  randomizeLockKeys,
  setLockKeysToNone,
} from './page1SectionRandom.js';
import { PAGE1_POSE_SUBPANELS } from './page1WorkspacePanels.js';
import { POSE_COMPOSER_KEYS } from '../features/page1/page1Schema.js';

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
  assert.equal(next.poseBaseId, 'random');
  assert.equal(next.imageTypePresetId, 'photorealistic-photo');
  assert.equal(next.topId, '');
});

test('single pose panel randomizes the five Pose Composer layers and leaves props independent', () => {
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

  for (const key of POSE_COMPOSER_KEYS) {
    const control = controls.find((entry) => entry.key === key);
    const explicitRandom = control?.options?.find((option) => option.meta?.tags?.includes('random'));
    assert.ok(explicitRandom, `Expected an explicit random option for ${key}`);
    assert.equal(randomized[key], explicitRandom.id, `${key} should enter explicit random mode`);
  }
  assert.equal(randomized.posePropId, 'none', 'The independent prop layer should keep its current none value');

  const [prompt] = generatePrompts(1, randomized, [], {
    random: createSeededRandom('pose-panel-random-contract-v1'),
  });

  for (const key of POSE_COMPOSER_KEYS) {
    assert.notEqual(prompt.selection[key], 'random', `${key} should not expose the random sentinel`);
    if (key !== 'poseAnchorId') {
      assert.notEqual(prompt.selection[key], 'none', `${key} should resolve to a concrete selection`);
    }
  }

  assert.deepEqual(
    Object.fromEntries(POSE_COMPOSER_KEYS.map((key) => [key, prompt.selection[key]])),
    {
      poseBaseId: 'standing',
      poseArrangementId: 'standing-deep-forward-lean',
      poseHandId: 'hands-relaxed-down',
      poseHeadId: 'head-low-rim-support',
      poseAnchorId: 'shared-clear-acrylic-cube',
    },
    'The migration seed should follow base, arrangement, hand, head, then anchor sampling order',
  );

  const arrangement = controls
    .find((entry) => entry.key === 'poseArrangementId')
    ?.options.find((option) => option.id === prompt.selection.poseArrangementId);
  const anchor = controls
    .find((entry) => entry.key === 'poseAnchorId')
    ?.options.find((option) => option.id === prompt.selection.poseAnchorId);
  const supportsBase = (option) => option?.base === prompt.selection.poseBaseId
    || option?.bases?.includes(prompt.selection.poseBaseId);

  assert.equal(supportsBase(arrangement), true, 'Resolved arrangement should match the resolved base');
  assert.equal(supportsBase(anchor), true, 'Resolved anchor should match the resolved base');
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
  assert.equal(prompt.selection.posePropId, propId);
  assert.equal(prompt.selection.poseHandId, 'none', 'The fixed prop should take over the hand layer');
  assert.notEqual(prompt.selection.poseBaseId, 'random');
  assert.notEqual(prompt.selection.poseArrangementId, 'random');
  assert.notEqual(prompt.selection.poseHeadId, 'random');
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

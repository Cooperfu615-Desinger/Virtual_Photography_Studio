import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks } from './engine.js';
import {
  getPage1ControlActionMode,
  getPage1SectionActionLabels,
  randomizeLockKeys,
  setLockKeysToNone,
} from './page1SectionRandom.js';

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
      options: [{ id: 'none', zh: '全無' }, { id: 'standing', zh: '站姿' }],
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
  assert.equal(next.poseBaseId, '');
  assert.equal(next.imageTypePresetId, 'photorealistic-photo');
  assert.equal(next.topId, '');
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

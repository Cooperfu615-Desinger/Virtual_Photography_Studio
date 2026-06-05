import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks } from './engine.js';
import { randomizeLockKeys, setLockKeysToNone } from './page1SectionRandom.js';

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

import assert from 'node:assert/strict';
import test from 'node:test';

import { buildAllNoneLocks } from './page1Selectors.js';

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

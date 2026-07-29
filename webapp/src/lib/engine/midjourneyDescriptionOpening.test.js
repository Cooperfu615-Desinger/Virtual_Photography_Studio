import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createEmptyLocks,
  createSeededRandom,
  generatePrompts,
  getLockControls,
} from '../engine.js';
import { MIDJOURNEY_IMAGE_TYPE_OPENING_FIXTURES } from './midjourneyDescriptionFixtures.js';
import { stripMidjourneyParameterTail } from './midjourneyParameterTail.js';

const controls = getLockControls();

function optionId(key, zh) {
  const control = controls.find((entry) => entry.key === key);
  const option = control?.options?.find((entry) => entry.zh === zh);
  assert.ok(option, `${key}: ${zh}`);
  return option.id;
}

function createOpeningLocks(imageTypePresetId, subjectCount = '1') {
  const locks = { ...createEmptyLocks() };
  for (const control of controls) {
    const noneOption = control.options?.find((entry) => entry.zh === '全無');
    if (noneOption) locks[control.key] = noneOption.id;
  }
  return {
    ...locks,
    subjectCount,
    imageTypePresetId,
    framingId: optionId('framingId', '中景鏡頭 (Medium Shot)'),
    angleId: optionId('angleId', '高位俯視鏡頭'),
    orbitId: optionId('orbitId', '正面 0 度'),
    aspectRatio: '9:16',
  };
}

test('phase 2 emits direct image-type openings for every Midjourney output type', () => {
  for (const fixture of MIDJOURNEY_IMAGE_TYPE_OPENING_FIXTURES) {
    const prompt = generatePrompts(1, createOpeningLocks(fixture.id), [], {
      random: createSeededRandom(`mj-opening-${fixture.id}`),
    })[0];
    const description = stripMidjourneyParameterTail(prompt.midjourneyPrompt);

    assert.ok(description.startsWith(fixture.expected), fixture.id);
    assert.doesNotMatch(description, /^Create an? /, fixture.id);
    assert.match(
      description,
      /Waist-up portrait, high angle, looking down, front view\. A 20s /,
      `${fixture.id}: composition-to-subject boundary`
    );
  }
});

test('phase 2 applies the same direct opening and sentence boundary to duo AI', () => {
  const fixture = MIDJOURNEY_IMAGE_TYPE_OPENING_FIXTURES.find(
    (entry) => entry.id === 'photorealistic-photo'
  );
  const prompt = generatePrompts(1, createOpeningLocks(fixture.id, '2'), [], {
    random: createSeededRandom('mj-opening-duo'),
  })[0];
  const description = stripMidjourneyParameterTail(prompt.midjourneyPrompt);

  assert.ok(description.startsWith(fixture.expected));
  assert.doesNotMatch(description, /^Create an? /);
  assert.match(description, /Waist-up portrait, high angle, looking down, front view\./);
  assert.match(description, /Woman 1:/);
  assert.match(description, /Woman 2:/);
});

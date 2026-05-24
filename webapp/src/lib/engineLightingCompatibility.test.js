import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls, getSceneDependentOptions } from './engine.js';

function optionId(controlKey, zh) {
  const control = getLockControls().find((entry) => entry.key === controlKey);
  const option = control?.options.find((entry) => entry.zh === zh);
  assert.ok(option, `Expected option ${zh} in ${controlKey}`);
  return option.id;
}

function optionNames(options) {
  return options.map((entry) => entry.zh);
}

test('scene attribute filters ambient light conditions by indoor and outdoor scope', () => {
  const indoorOptions = optionNames(getSceneDependentOptions([], {
    ...createEmptyLocks(),
    sceneAttributeId: 'indoor',
  }).lightingOptions);
  const outdoorOptions = optionNames(getSceneDependentOptions([], {
    ...createEmptyLocks(),
    sceneAttributeId: 'outdoor',
  }).lightingOptions);

  assert.ok(indoorOptions.includes('室內窗邊日光'));
  assert.ok(indoorOptions.includes('高調純白攝影棚'));
  assert.ok(!indoorOptions.includes('晴朗白日'));
  assert.ok(!indoorOptions.includes('夜晚街燈'));

  assert.ok(outdoorOptions.includes('晴朗白日'));
  assert.ok(outdoorOptions.includes('夜晚街燈'));
  assert.ok(!outdoorOptions.includes('室內窗邊日光'));
  assert.ok(!outdoorOptions.includes('高調純白攝影棚'));
});

test('rainy ambient conditions hide hard direct sunlight before a location is selected', () => {
  const options = optionNames(getSceneDependentOptions([], {
    ...createEmptyLocks(),
    lightingId: optionId('lightingId', '雨天陰濕'),
  }).lightDirectionOptions);

  assert.ok(options.includes('漫射霧光'));
  assert.ok(options.includes('潮濕反射光'));
  assert.ok(!options.includes('硬質晴光'));
});

test('studio ambient conditions hide natural outdoor subject-light patterns', () => {
  const options = optionNames(getSceneDependentOptions([], {
    ...createEmptyLocks(),
    lightingId: optionId('lightingId', '高調純白攝影棚'),
  }).lightDirectionOptions);

  assert.ok(options.includes('柔和順光'));
  assert.ok(options.includes('高調亮光'));
  assert.ok(!options.includes('斑駁樹影光'));
  assert.ok(!options.includes('潮濕反射光'));
});

test('optical effects stay in the camera summary while light style stays in lighting summary', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    locationId: optionId('locationId', '戶外：蘇荷區濕地反光街角'),
    lightingId: optionId('lightingId', '雨天陰濕'),
    lightDirectionId: optionId('lightDirectionId', '漫射霧光'),
    opticalEffectId: optionId('opticalEffectId', '霧化高光 Bloom'),
  });

  assert.match(prompt.summary, /鏡頭：[^|]*霧化高光 Bloom/);
  assert.match(prompt.summary, /光影：雨天陰濕 \/ 漫射霧光/);
  assert.doesNotMatch(prompt.summary, /光影：[^|]*霧化高光 Bloom/);
  assert.ok(prompt.structured['Camera & Film'].some((entry) => entry.zh === '霧化高光 Bloom'));
  assert.ok(!prompt.structured.Lighting.some((entry) => entry.zh === '霧化高光 Bloom'));
});

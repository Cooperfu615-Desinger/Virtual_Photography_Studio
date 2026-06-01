import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls } from './engine.js';

function optionId(controlKey, zh) {
  const control = getLockControls().find((entry) => entry.key === controlKey);
  const option = control.options.find((entry) => entry.zh === zh);
  assert.ok(option, `Expected option ${zh} in ${controlKey}`);
  return option.id;
}

test('Gpt prompt uses natural structured sections for GPT Image', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    locationId: optionId('locationId', '室內：深邃黑幕'),
    outfitPresetId: optionId('outfitPresetId', '套裝：空服員制服'),
    poseId: optionId('poseId', '站姿｜雙臂交疊'),
  });

  assert.match(prompt.grokPrompt, /^Image Type:\nCreate a photorealistic editorial portrait\./);
  assert.match(prompt.grokPrompt, /\nScene:\nThe portrait takes place in /);
  assert.match(prompt.grokPrompt, /\nSubject:\nThe subject is /);
  assert.match(prompt.grokPrompt, /\nWardrobe:\nShe wears /);
  assert.match(prompt.grokPrompt, /\nPose and Composition:\n/);
  assert.match(prompt.grokPrompt, /\nLighting:\n/);
  assert.match(prompt.grokPrompt, /\nCamera Look:\n/);
  assert.match(prompt.grokPrompt, /\nConstraints:\n/);
  assert.match(prompt.grokPrompt, /preserve the selected wardrobe as complete, realistic clothing/i);
  assert.doesNotMatch(prompt.grokPrompt, /no nudity|fully clothed|clothing covers the body/i);
  assert.match(prompt.grokPrompt, /\n\nmulti-cut sequence n=2$/);
  assert.doesNotMatch(prompt.grokPrompt, /^Subject Count:/m);
});

test('Grok/Z-Image prompt remains natural language and AI is compacted from Gpt sections', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    locationId: optionId('locationId', '室內：深邃黑幕'),
    outfitPresetId: optionId('outfitPresetId', '套裝：空服員制服'),
    outerwearId: optionId('outerwearId', '全無'),
    poseId: optionId('poseId', '站姿｜雙臂交疊'),
    lightingId: optionId('lightingId', '晴朗白日'),
    lightDirectionId: optionId('lightDirectionId', '側向柔光'),
    lensId: optionId('lensId', '50mm 標準鏡頭 (Standard)'),
    filmId: optionId('filmId', '富士 Provia 清透明亮'),
  });

  assert.match(prompt.zImagePrompt, /^Create a photorealistic editorial portrait /);
  assert.doesNotMatch(prompt.zImagePrompt, /^Subject Count:/m);
  assert.doesNotMatch(prompt.zImagePrompt, /multi-cut sequence n=2/);
  assert.doesNotMatch(prompt.midjourneyPrompt, /^(Image Type|Scene|Subject|Wardrobe):/m);
  assert.doesNotMatch(prompt.midjourneyPrompt, /multi-cut sequence n=2/);
  assert.match(prompt.midjourneyPrompt, /^Create a photorealistic editorial portrait/);
  assert.match(prompt.midjourneyPrompt, /deep black color field/);
  assert.match(prompt.midjourneyPrompt, /20-year-old Japanese or Korean/);
  assert.match(prompt.midjourneyPrompt, /She wears .*flight attendant uniform outfit/);
  assert.match(prompt.midjourneyPrompt, /standing pose with loosely crossed arms/);
  assert.match(prompt.midjourneyPrompt, /Lighting: /);
  assert.match(prompt.midjourneyPrompt, /Camera look: /);
  assert.ok(prompt.midjourneyPrompt.length < prompt.zImagePrompt.length);
});

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls } from './engine.js';

function optionId(controlKey, zh) {
  const control = getLockControls().find((entry) => entry.key === controlKey);
  const option = control.options.find((entry) => entry.zh === zh);
  assert.ok(option, `Expected option ${zh} in ${controlKey}`);
  return option.id;
}

test('Z-Image describes outfit presets with natural wardrobe language', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    outfitPresetId: optionId('outfitPresetId', '套裝：春日巴黎亞麻長褲'),
    outfitPresetPrimaryColorId: optionId('outfitPresetPrimaryColorId', '粉紅色'),
    outerwearId: optionId('outerwearId', '全無'),
    neckAccessoryId: optionId('neckAccessoryId', '全無'),
    legwearId: optionId('legwearId', '全無'),
    shoesId: optionId('shoesId', '全無'),
  });

  assert.doesNotMatch(prompt.zImagePrompt, /Wardrobe details:/);
  assert.match(prompt.zImagePrompt, /She wears pink Parisian linen trouser outfit/);
});

test('Z-Image keeps outerwear secondary when layered over an outfit preset', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    outfitPresetId: optionId('outfitPresetId', '套裝：春日巴黎亞麻長褲'),
    outfitPresetPrimaryColorId: optionId('outfitPresetPrimaryColorId', '粉紅色'),
    outerwearId: optionId('outerwearId', '運動連帽外套'),
    outerwearFitId: optionId('outerwearFitId', '全無'),
    outerwearColorId: optionId('outerwearColorId', '白色'),
    outerwearPatternId: optionId('outerwearPatternId', '全無'),
    outerwearOpeningId: optionId('outerwearOpeningId', '全無'),
    outerwearStylingId: optionId('outerwearStylingId', '正常穿著'),
    shoesId: optionId('shoesId', '尖頭細跟高跟鞋'),
    shoesColorId: optionId('shoesColorId', '黑色'),
  });

  const wardrobeSentence = prompt.zImagePrompt.match(/She wears[^.]+\./)?.[0] || '';

  assert.doesNotMatch(prompt.zImagePrompt, /Wardrobe details:/);
  assert.match(wardrobeSentence, /^She wears white sport zip-up hoodie/);
  assert.doesNotMatch(wardrobeSentence, /open oversized zip-up hoodie/);
  assert.match(wardrobeSentence, /layered over pink Parisian linen trouser outfit/);
  assert.match(wardrobeSentence, /paired with black pointed-toe stiletto heels/);
});

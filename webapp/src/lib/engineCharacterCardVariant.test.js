import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls, normalizeLocks } from './engine.js';

const PRIMARY_OUTPUT_KEYS = ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt'];

function optionId(controlKey, zh) {
  const control = getLockControls().find((entry) => entry.key === controlKey);
  assert.ok(control, `Expected control ${controlKey}`);
  const option = control.options.find((entry) => entry.zh === zh);
  assert.ok(option, `Expected option ${zh} in ${controlKey}`);
  return option.id;
}

function assertEveryPrimaryOutput(prompt, pattern, message) {
  for (const key of PRIMARY_OUTPUT_KEYS) {
    assert.match(prompt[key], pattern, `${key}: ${message}`);
  }
}

function assertNoPrimaryOutput(prompt, pattern, message) {
  for (const key of PRIMARY_OUTPUT_KEYS) {
    assert.doesNotMatch(prompt[key], pattern, `${key}: ${message}`);
  }
}

function countMatches(value, pattern) {
  return [...String(value || '').matchAll(pattern)].length;
}

test('normalizeLocks preserves character card variant fields', () => {
  const locks = normalizeLocks({
    characterProfileId: 'character-rika',
    characterCardHairVariantId: 'low-ponytail',
    characterCardWardrobeMode: 'selected-layers',
    characterCardWardrobeLayerIds: ['top', 'bottom'],
    characterCardPromptOverride: 'temporary override text',
  });

  assert.equal(locks.characterProfileId, 'character-rika');
  assert.equal(locks.characterCardHairVariantId, 'low-ponytail');
  assert.equal(locks.characterCardWardrobeMode, 'selected-layers');
  assert.deepEqual(locks.characterCardWardrobeLayerIds, ['top', 'bottom']);
  assert.equal(locks.characterCardPromptOverride, 'temporary override text');
});

test('plain PAGE1 character card keeps full default wardrobe for old behavior', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    characterProfileId: 'character-rika',
  });
  const text = [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt].join('\n');

  assert.match(text, /cropped white short-sleeve baby tee/i);
  assert.match(text, /low-rise light-wash blue jeans/i);
  assert.match(text, /white low-top sneakers/i);
  assert.match(text, /beaded choker/i);
});

test('character card variant can include selected card layers and PAGE1 missing layers', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    characterProfileId: 'character-rika',
    characterCardHairVariantId: 'low-ponytail',
    characterCardWardrobeMode: 'selected-layers',
    characterCardWardrobeLayerIds: ['top'],
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    pantsId: optionId('pantsId', '全無'),
    skirtId: optionId('skirtId', '牛仔短裙'),
    shoesId: optionId('shoesId', '高跟鞋'),
    neckAccessoryId: optionId('neckAccessoryId', '鎖骨細金屬鏈'),
  });
  const text = [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt].join('\n');

  assert.equal(prompt.selection.characterProfileId, 'character-rika');
  assert.equal(prompt.selection.characterCardHairVariantId, 'low-ponytail');
  assert.deepEqual(prompt.selection.characterCardWardrobeLayerIds, ['top']);
  assert.match(text, /low ponytail/i);
  assert.match(text, /cropped white short-sleeve baby tee/i);
  assert.match(text, /denim short skirt|牛仔/i);
  assert.match(text, /high heels|高跟鞋/i);
  assert.match(text, /collarbone|鎖骨/i);
  assert.doesNotMatch(text, /low-rise light-wash blue jeans/i);
  assert.doesNotMatch(text, /white low-top sneakers/i);
  assert.ok(prompt.structured.Wardrobe.length > 0);
});

test('full-default character card hair variant and override appear in every primary output', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    characterProfileId: 'character-rika',
    characterCardHairVariantId: 'low-ponytail',
    characterCardPromptOverride: 'temporary override text',
  });

  assertEveryPrimaryOutput(prompt, /low ponytail/i, 'low ponytail should be preserved');
  assertEveryPrimaryOutput(prompt, /temporary override text/i, 'prompt override should be preserved');
});

test('selected-layers character card hair override and missing PAGE1 layers appear in every primary output', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    characterProfileId: 'character-rika',
    characterCardHairVariantId: 'low-ponytail',
    characterCardWardrobeMode: 'selected-layers',
    characterCardWardrobeLayerIds: ['top'],
    characterCardPromptOverride: 'temporary override text',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    pantsId: optionId('pantsId', '全無'),
    skirtId: optionId('skirtId', '牛仔短裙'),
    shoesId: optionId('shoesId', '高跟鞋'),
    neckAccessoryId: optionId('neckAccessoryId', '鎖骨細金屬鏈'),
  });

  assertEveryPrimaryOutput(prompt, /low ponytail/i, 'low ponytail should be preserved');
  assertEveryPrimaryOutput(prompt, /temporary override text/i, 'prompt override should be preserved');
  assertEveryPrimaryOutput(prompt, /cropped white short-sleeve baby tee/i, 'selected card top should be preserved');
  assertEveryPrimaryOutput(prompt, /denim short skirt|牛仔/i, 'PAGE1 skirt should fill the missing bottom layer');
  assertEveryPrimaryOutput(prompt, /high heels|高跟鞋/i, 'PAGE1 shoes should fill the missing shoes layer');
  assertEveryPrimaryOutput(prompt, /collarbone|鎖骨/i, 'PAGE1 neck accessory should fill the missing accessory layer');
});

test('selected-layers character card accessory layers appear in AI and remain in GPT and Grok outputs', () => {
  const [sakuraPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    characterProfileId: 'character-sakura',
    characterCardWardrobeMode: 'selected-layers',
    characterCardWardrobeLayerIds: ['headAccessory'],
  });
  const [rikaPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    characterProfileId: 'character-rika',
    characterCardWardrobeMode: 'selected-layers',
    characterCardWardrobeLayerIds: ['waistAccessory'],
  });
  const [yuriPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    characterProfileId: 'character-yuri',
    characterCardWardrobeMode: 'selected-layers',
    characterCardWardrobeLayerIds: ['wristAccessory', 'waistAccessory'],
  });

  assert.match(sakuraPrompt.midjourneyPrompt, /white plush bunny-eared hood/i);
  assert.equal(countMatches(sakuraPrompt.midjourneyPrompt, /white plush bunny-eared hood/gi), 1);
  assert.match(rikaPrompt.midjourneyPrompt, /silver ring keychain clipped to the front belt loop/i);
  assert.match(yuriPrompt.midjourneyPrompt, /stacked silver bangles and rings/i);
  assert.match(yuriPrompt.midjourneyPrompt, /western-style belt buckle and metal-stud chain detail/i);

  assert.match(sakuraPrompt.grokPrompt, /white plush bunny-eared hood/i);
  assert.match(sakuraPrompt.zImagePrompt, /white plush bunny-eared hood/i);
  assert.match(rikaPrompt.grokPrompt, /silver ring keychain clipped to the front belt loop/i);
  assert.match(rikaPrompt.zImagePrompt, /silver ring keychain clipped to the front belt loop/i);
  assert.match(yuriPrompt.grokPrompt, /stacked silver bangles and rings/i);
  assert.match(yuriPrompt.zImagePrompt, /stacked silver bangles and rings/i);
  assert.match(yuriPrompt.grokPrompt, /western-style belt buckle and metal-stud chain detail/i);
  assert.match(yuriPrompt.zImagePrompt, /western-style belt buckle and metal-stud chain detail/i);
});

test('selected card top blocks PAGE1 top garment modifiers and color', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    characterProfileId: 'character-rika',
    characterCardWardrobeMode: 'selected-layers',
    characterCardWardrobeLayerIds: ['top'],
    topId: optionId('topId', '襯衫'),
    topFitId: optionId('topFitId', '緊身'),
    topStylingId: optionId('topStylingId', '下擺打結'),
    topPatternId: optionId('topPatternId', '粗橫條紋'),
    topColorId: optionId('topColorId', '紅色'),
    pantsId: optionId('pantsId', '全無'),
    skirtId: optionId('skirtId', '牛仔短裙'),
  });
  const wardrobeIds = prompt.structured.Wardrobe.map((item) => item.id || '');

  assert.ok(prompt.structured.Wardrobe.some((item) => item.meta?.characterCardLayer === 'top'));
  assert.equal(wardrobeIds.some((id) => id.includes('wardrobe:上身-tops:')), false);
  assert.equal(wardrobeIds.some((id) => id.includes('wardrobe:上身版型-top-fit:')), false);
  assert.equal(wardrobeIds.some((id) => id.includes('wardrobe:上身穿法-top-styling:')), false);
  assert.equal(wardrobeIds.some((id) => id.includes('wardrobe:上身圖案-top-surface-design:')), false);
  assert.equal(prompt.selection.topColorId, '');
  assertEveryPrimaryOutput(prompt, /cropped white short-sleeve baby tee/i, 'selected card top should stay visible');
  assertNoPrimaryOutput(prompt, /crisp cotton poplin|clean placket|tight body-skimming upper-body fit|front hem tied|bold horizontal stripe top|red fitted cropped white/i, 'PAGE1 top details should not alter the card top');
});

test('selection stores normalized character card variant fields', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    characterProfileId: 'character-rika',
    characterCardHairVariantId: 'not-compatible',
    characterCardWardrobeMode: 'invalid-mode',
    characterCardWardrobeLayerIds: ['top', 'missing-layer', 'bottom'],
    characterCardPromptOverride: '  trimmed override text  ',
  });

  assert.equal(prompt.selection.characterCardHairVariantId, 'default');
  assert.equal(prompt.selection.characterCardWardrobeMode, 'full-default');
  assert.deepEqual(prompt.selection.characterCardWardrobeLayerIds, []);
  assert.equal(prompt.selection.characterCardPromptOverride, 'trimmed override text');
});

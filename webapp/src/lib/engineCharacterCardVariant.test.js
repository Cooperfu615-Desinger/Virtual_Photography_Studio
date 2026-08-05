import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls, normalizeLocks } from './engine.js';
import { getCharacterCardOptions } from './characterCardLab.js';

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

function createAllNoneLocks() {
  const locks = createEmptyLocks();
  for (const control of getLockControls()) {
    if (control.multi) {
      locks[control.key] = [];
      continue;
    }
    const noneOption = control.options.find((option) => option.zh === '全無' || option.id === 'none');
    if (noneOption) locks[control.key] = noneOption.id;
  }
  locks.subjectCount = '1';
  return locks;
}

test('normalizeLocks preserves character card variant fields', () => {
  const locks = normalizeLocks({
    characterProfileId: 'character-rika',
    characterCardHairVariantId: 'low-ponytail',
    characterCardEyewearMode: 'glasses-on',
    characterCardWardrobeMode: 'selected-layers',
    characterCardWardrobeLayerIds: ['top', 'bottom'],
    characterCardPromptOverride: 'temporary override text',
  });

  assert.equal(locks.characterProfileId, 'character-rika');
  assert.equal(locks.characterCardHairVariantId, 'low-ponytail');
  assert.equal(locks.characterCardEyewearMode, 'glasses-on');
  assert.equal(locks.characterCardWardrobeMode, 'selected-layers');
  assert.deepEqual(locks.characterCardWardrobeLayerIds, ['top', 'bottom']);
  assert.equal(locks.characterCardPromptOverride, 'temporary override text');
});

test('plain PAGE1 character card keeps the complete default wardrobe in full-body framing', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    characterProfileId: 'character-rika',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
  });
  const text = [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt].join('\n');

  assert.match(text, /cropped white short-sleeve baby tee/i);
  assert.match(text, /low-rise light-wash blue jeans/i);
  assert.match(text, /white low-top sneakers/i);
  assert.match(text, /beaded choker/i);
});

test('new character cards keep permanent identity traits separate from removable wardrobe layers', () => {
  const [oliviaPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    characterProfileId: 'character-olivia',
    characterCardHairVariantId: 'low-ponytail',
    characterCardWardrobeMode: 'selected-layers',
    characterCardWardrobeLayerIds: ['top', 'bottom', 'outerwear', 'shoes', 'earrings', 'neckAccessory'],
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    specialOutfitId: optionId('specialOutfitId', '全無'),
    outfitPresetId: optionId('outfitPresetId', '全無'),
    dressId: optionId('dressId', '全無'),
  });
  const [eleanorPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    characterProfileId: 'character-eleanor',
    characterCardWardrobeMode: 'selected-layers',
    characterCardWardrobeLayerIds: [],
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
  });

  assertEveryPrimaryOutput(oliviaPrompt, /long rich dark chestnut-brown hair/i, 'Olivia base hair should remain visible');
  assertEveryPrimaryOutput(oliviaPrompt, /low ponytail/i, 'Olivia hair variation should be preserved');
  assertEveryPrimaryOutput(oliviaPrompt, /glossy black patent triangle bikini top/i, 'Olivia selected top should be preserved');
  assertNoPrimaryOutput(oliviaPrompt, /plain black baseball cap/i, 'Olivia omitted head accessory should stay removed');

  assertEveryPrimaryOutput(eleanorPrompt, /obsidian-black swept horns/i, 'Eleanor horns should remain part of her identity');
  assertEveryPrimaryOutput(eleanorPrompt, /arcane linework tattoos/i, 'Eleanor markings should remain part of her identity');
  assertNoPrimaryOutput(eleanorPrompt, /gothic armored corset gown/i, 'Eleanor omitted dress layer should stay removed');
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
  assertEveryPrimaryOutput(prompt, /denim (?:mini|short) skirt|牛仔/i, 'PAGE1 skirt should fill the missing bottom layer');
  assertEveryPrimaryOutput(prompt, /stiletto pumps|high heels|高跟鞋/i, 'PAGE1 shoes should fill the missing shoes layer');
  assertEveryPrimaryOutput(prompt, /collarbone|鎖骨/i, 'PAGE1 neck accessory should fill the missing accessory layer');
});

test('selected-layers character card eyewear mode can force default glasses into PAGE1 prompts', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    characterProfileId: 'character-rika',
    characterCardEyewearMode: 'glasses-on',
    characterCardWardrobeMode: 'selected-layers',
    characterCardWardrobeLayerIds: ['top'],
  });
  const wardrobeLayerIds = prompt.structured.Wardrobe.map((item) => item.id || '');

  assert.equal(prompt.selection.characterCardEyewearMode, 'glasses-on');
  assert.deepEqual(prompt.selection.characterCardWardrobeLayerIds, ['top', 'eyewear']);
  assert.ok(wardrobeLayerIds.includes('character-card-layer:character-rika:eyewear'));
  assertEveryPrimaryOutput(prompt, /thin-frame eyeglasses|transparent lenses/i, 'forced glasses should be preserved');
});

test('selected-layers character card eyewear mode can suppress card glasses', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    characterProfileId: 'character-yuri',
    characterCardEyewearMode: 'glasses-off',
    characterCardWardrobeMode: 'selected-layers',
    characterCardWardrobeLayerIds: ['top', 'eyewear'],
    eyewearId: optionId('eyewearId', '粗框眼鏡'),
  });
  const wardrobeLayerIds = prompt.structured.Wardrobe.map((item) => item.id || '');

  assert.equal(prompt.selection.characterCardEyewearMode, 'glasses-off');
  assert.deepEqual(prompt.selection.characterCardWardrobeLayerIds, ['top']);
  assert.equal(wardrobeLayerIds.includes('character-card-layer:character-yuri:eyewear'), false);
  assertNoPrimaryOutput(prompt, /round translucent brown acetate eyeglasses|thick-rimmed glasses/i, 'glasses-off should remove card and PAGE1 eyewear');
});

test('selected-layers character card accessory layers appear in AI and remain in GPT and Grok outputs', () => {
  const [sakuraPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    characterProfileId: 'character-sakura',
    characterCardWardrobeMode: 'selected-layers',
    characterCardWardrobeLayerIds: ['headAccessory'],
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
  });
  const [rikaPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    characterProfileId: 'character-rika',
    characterCardWardrobeMode: 'selected-layers',
    characterCardWardrobeLayerIds: ['waistAccessory'],
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
  });
  const [yuriPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    characterProfileId: 'character-yuri',
    characterCardWardrobeMode: 'selected-layers',
    characterCardWardrobeLayerIds: ['wristAccessory', 'waistAccessory'],
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
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

test('selected character-card wardrobe and accessories appear once in GPT and Grok-Z-Image outputs', () => {
  const cases = [
    {
      characterProfileId: 'character-48g',
      characterCardWardrobeLayerIds: ['outerwear', 'top', 'bottom', 'shoes', 'waistAccessory'],
      phrases: [
        /taupe-gray cropped hooded zip jacket/gi,
        /black lace bralette neckline/gi,
        /low-rise faded blue denim mini skirt/gi,
        /black lace-up ankle boots/gi,
      ],
    },
    {
      characterProfileId: 'character-rin',
      characterCardWardrobeLayerIds: ['top', 'bottom', 'shoes', 'eyewear', 'neckAccessory'],
      phrases: [
        /crisp white oversized button-down shirt/gi,
        /charcoal high-waisted tailored straight trousers/gi,
        /black leather loafers/gi,
        /signature thin rectangular brown-gold metal frame eyeglasses/gi,
        /layered delicate gold necklaces/gi,
      ],
    },
    {
      characterProfileId: 'character-sakura',
      characterCardWardrobeLayerIds: ['top', 'bottom', 'shoes', 'headAccessory'],
      phrases: [
        /white plush bunny-eared hood/gi,
        /clean white low-top sneakers/gi,
      ],
    },
  ];

  for (const testCase of cases) {
    const [prompt] = generatePrompts(1, {
      ...createAllNoneLocks(),
      characterProfileId: testCase.characterProfileId,
      characterCardWardrobeMode: 'selected-layers',
      characterCardWardrobeLayerIds: testCase.characterCardWardrobeLayerIds,
      framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    });

    for (const phrase of testCase.phrases) {
      assert.equal(countMatches(prompt.grokPrompt, phrase), 1, `${testCase.characterProfileId} GPT duplicate: ${phrase}`);
      assert.equal(countMatches(prompt.zImagePrompt, phrase), 1, `${testCase.characterProfileId} Grok/Z-Image duplicate: ${phrase}`);
    }
  }
});

test('AI character-card wardrobe keeps complete selected layer text without a compact duplicate list', () => {
  const [prompt] = generatePrompts(1, {
    ...createAllNoneLocks(),
    characterProfileId: 'character-48g',
    characterCardWardrobeMode: 'selected-layers',
    characterCardWardrobeLayerIds: ['outerwear', 'top', 'bottom', 'shoes', 'waistAccessory'],
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
  });

  const completeLayerPhrases = [
    /taupe-gray cropped hooded zip jacket worn open with the hood usually worn up framing the hair/gi,
    /black lace bralette neckline/gi,
    /low-rise faded blue denim mini skirt worn unbuttoned with the zipper slightly pulled down and visible thin-strap black lace thong waistband underneath/gi,
    /black lace-up ankle boots with glossy rounded toes/gi,
    /small off-white shoulder bag with thin black strap/gi,
  ];

  for (const phrase of completeLayerPhrases) {
    assert.equal(countMatches(prompt.midjourneyPrompt, phrase), 1, `AI duplicate: ${phrase}`);
  }
  assert.doesNotMatch(
    prompt.midjourneyPrompt,
    /Wearing black lace bralette neckline, low-rise faded blue denim mini skirt, black lace-up ankle boots,/i,
    'AI should not prepend the compact duplicate list before the complete card wardrobe'
  );
});

test('AI full-default character cards emit every effective wardrobe layer once', () => {
  const cards = getCharacterCardOptions(getLockControls());
  const fullBodyFramingId = optionId('framingId', '全身鏡頭 (Full Body Shot)');

  for (const card of cards) {
    const [prompt] = generatePrompts(1, {
      ...createAllNoneLocks(),
      characterProfileId: card.id,
      characterCardWardrobeMode: 'full-default',
      framingId: fullBodyFramingId,
    });

    for (const layer of Object.values(card.defaultWardrobeLayers || {})) {
      const escaped = layer.prompt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      assert.equal(
        countMatches(prompt.midjourneyPrompt, new RegExp(escaped, 'gi')),
        1,
        `${card.id} AI wardrobe layer should appear once: ${layer.prompt}`
      );
    }
  }
});

test('selected card top blocks PAGE1 top garment modifiers and color', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    characterProfileId: 'character-rika',
    characterCardWardrobeMode: 'selected-layers',
    characterCardWardrobeLayerIds: ['top'],
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
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

test('full-default character-card accessory sources are not repeated in Grok-Z-Image output', () => {
  const [prompt] = generatePrompts(1, {
    ...createAllNoneLocks(),
    characterProfileId: 'character-rin',
    characterCardWardrobeMode: 'full-default',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
  });

  assert.equal(countMatches(prompt.zImagePrompt, /thin rectangular brown-gold metal frame eyeglasses/gi), 1);
  assert.equal(countMatches(prompt.zImagePrompt, /stacked twin gold hoop earrings on both ears/gi), 1);
  assert.equal(countMatches(prompt.zImagePrompt, /layered delicate gold necklaces with tiny pendant charms/gi), 1);
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
  assert.equal(prompt.selection.characterCardEyewearMode, 'default');
  assert.equal(prompt.selection.characterCardWardrobeMode, 'full-default');
  assert.deepEqual(prompt.selection.characterCardWardrobeLayerIds, []);
  assert.equal(prompt.selection.characterCardPromptOverride, 'trimmed override text');
});

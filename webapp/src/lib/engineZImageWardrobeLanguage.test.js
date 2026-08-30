import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls } from './engine.js';

function optionId(controlKey, zh) {
  const control = getLockControls().find((entry) => entry.key === controlKey);
  const option = control.options.find((entry) => entry.zh === zh);
  assert.ok(option, `Expected option ${zh} in ${controlKey}`);
  return option.id;
}

function createAllNoneLocks() {
  const locks = { ...createEmptyLocks() };
  getLockControls().forEach((control) => {
    const noneOption = control.options?.find((entry) => entry.zh === '全無' || entry.zh === '無額外表情');
    if (noneOption) locks[control.key] = noneOption.id;
  });
  return locks;
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
    outerwearId: optionId('outerwearId', '連帽外套'),
    outerwearFitId: optionId('outerwearFitId', '全無'),
    outerwearColorId: optionId('outerwearColorId', '白色'),
    outerwearPatternId: optionId('outerwearPatternId', '全無'),
    outerwearOpeningId: optionId('outerwearOpeningId', '正常'),
    outerwearStylingId: optionId('outerwearStylingId', '正常穿著'),
    shoesId: optionId('shoesId', '尖頭細跟高跟鞋'),
    shoesColorId: optionId('shoesColorId', '黑色'),
  });

  const wardrobeSentence = prompt.zImagePrompt.match(/She wears[^.]+\./)?.[0] || '';

  assert.doesNotMatch(prompt.zImagePrompt, /Wardrobe details:/);
  assert.match(wardrobeSentence, /^She wears white sport zip-up hoodie/);
  assert.doesNotMatch(wardrobeSentence, /open oversized zip-up hoodie/);
  assert.match(wardrobeSentence, /layered over pink Parisian linen trouser outfit/);
  assert.match(wardrobeSentence, /black pointed-toe stiletto heels/);
  assert.doesNotMatch(wardrobeSentence, /paired with/i);
});

test('Z-Image moves special-outfit hair and body traits into the subject paragraph', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    specialOutfitId: optionId('specialOutfitId', '米色細肩背心蕾絲胸衣工裝寬褲造型'),
  });

  const paragraphs = prompt.zImagePrompt.split('\n\n');
  const subjectParagraph = paragraphs.find((value) => /long voluminous side-part black waves/i.test(value)) || '';
  const wardrobeParagraph = paragraphs.find((value) => /^She wears /i.test(value)) || '';

  assert.match(subjectParagraph, /long voluminous side-part black waves/i);
  assert.match(subjectParagraph, /small cherry tattoo on the right chest/i);
  assert.doesNotMatch(wardrobeParagraph, /long voluminous side-part black waves|small cherry tattoo/i);
  assert.match(wardrobeParagraph, /^She wears /i);
  assert.doesNotMatch(wardrobeParagraph, /complete special outfit:/i);
});

test('Z-Image chest-up outfit preset deletes hidden legwear and shoes add-ons', () => {
  const [prompt] = generatePrompts(1, {
    ...createAllNoneLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '胸上特寫'),
    outfitPresetId: optionId('outfitPresetId', '套裝：透視背心漆皮短褲長靴'),
    outfitPresetPrimaryColorId: optionId('outfitPresetPrimaryColorId', '白色'),
    legwearId: optionId('legwearId', '羅紋短襪'),
    shoesId: optionId('shoesId', '尖頭細跟高跟鞋'),
  });

  assert.match(prompt.zImagePrompt, /cropped sheer fitted tank top/i);
  assert.match(prompt.zImagePrompt, /strapless lace bra layer/i);
  assert.doesNotMatch(prompt.zImagePrompt, /exposed navel and abdomen/i);
  assert.doesNotMatch(prompt.zImagePrompt, /low-rise glossy micro shorts/i);
  assert.doesNotMatch(prompt.zImagePrompt, /knee-high leather boots/i);
  assert.doesNotMatch(prompt.zImagePrompt, /ribbed ankle socks/i);
  assert.doesNotMatch(prompt.zImagePrompt, /pointed-toe stiletto heels/i);
});

test('Z-Image chest-up normal separates keep upper garments and delete hidden lower wardrobe', () => {
  const [prompt] = generatePrompts(1, {
    ...createAllNoneLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '胸上特寫'),
    topId: optionId('topId', '棉質細肩背心'),
    pantsId: optionId('pantsId', '直筒牛仔褲'),
    legwearId: optionId('legwearId', '羅紋短襪'),
    shoesId: optionId('shoesId', '尖頭細跟高跟鞋'),
  });

  assert.match(prompt.zImagePrompt, /cotton camisole/i);
  assert.doesNotMatch(prompt.zImagePrompt, /straight-leg jeans/i);
  assert.doesNotMatch(prompt.zImagePrompt, /ribbed ankle socks/i);
  assert.doesNotMatch(prompt.zImagePrompt, /pointed-toe stiletto heels/i);
});

test('Z-Image cowboy framing keeps bottoms but deletes footwear details', () => {
  const [prompt] = generatePrompts(1, {
    ...createAllNoneLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '牛仔中景 (Cowboy Shot)'),
    topId: optionId('topId', '棉質細肩背心'),
    pantsId: optionId('pantsId', '直筒牛仔褲'),
    legwearId: optionId('legwearId', '羅紋短襪'),
    shoesId: optionId('shoesId', '尖頭細跟高跟鞋'),
  });

  assert.match(prompt.zImagePrompt, /cotton camisole/i);
  assert.match(prompt.zImagePrompt, /straight-leg jeans/i);
  assert.doesNotMatch(prompt.zImagePrompt, /ribbed ankle socks/i);
  assert.doesNotMatch(prompt.zImagePrompt, /pointed-toe stiletto heels/i);
});

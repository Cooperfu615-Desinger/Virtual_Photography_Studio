import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls, normalizeLocks } from './engine.js';

const controlOptions = (key) => getLockControls().find((control) => control.key === key).options;
const optionLabels = (key) => controlOptions(key).map((option) => option.zh);
const optionByLabel = (key, label) => {
  const option = controlOptions(key).find((item) => item.zh === label);
  assert.ok(option, `Missing option ${label} for ${key}`);
  return option;
};

test('outfit presets expose themed options and remove abstract style presets', () => {
  const labels = optionLabels('outfitPresetId');

  [
    '套裝：西裝長褲',
    '套裝：秘書短裙',
    '套裝：空服員制服',
    '套裝：護士制服',
    '套裝：醫生診療袍',
    '套裝：鏈條緞面內衣',
    '套裝：玫瑰哥德蘿莉塔洋裝',
  ].forEach((label) => {
    assert.ok(labels.includes(label), `${label} should be available`);
  });

  [
    '套裝：極簡高級',
    '套裝：日系街頭',
    '套裝：居家慵懶',
    '套裝：文青生活',
    '套裝：清爽運動',
    '套裝：甜辣街頭',
    '套裝：都會通勤',
    '套裝：旅行度假',
    '套裝：夜生活辣妹',
    '套裝：經典漢服',
    '套裝：改良漢服',
  ].forEach((label) => {
    assert.ok(!labels.includes(label), `${label} should be removed`);
  });
});

test('dress controls expose short and long one-piece silhouettes only', () => {
  assert.deepEqual(
    optionLabels('dressId'),
    [
      '全無',
      '連身：短版｜無袖迷你洋裝',
      '連身：短版｜細肩帶迷你洋裝',
      '連身：短版｜細肩帶蕾絲棉質迷你洋裝',
      '連身：短版｜亮面乳膠迷你洋裝',
      '連身：短版｜亮面深V掛脖迷你洋裝',
      '連身：短版｜一字領哥德迷你洋裝',
      '連身：短版｜復古雙排釦迷你洋裝',
      '連身：長版｜無袖長洋裝',
      '連身：長版｜細肩帶緞面長洋裝',
      '連身：長版｜波希米亞罩衫洋裝',
      '連身：長版｜針織長洋裝',
    ]
  );

  assert.ok(!optionLabels('dressId').includes('連身：雛菊背心丹寧吊帶短褲造型'));
});

test('cleaned outfit and dress prompts avoid fixed color wording', () => {
  [
    optionByLabel('outfitPresetId', '套裝：鏈條緞面內衣'),
    optionByLabel('outfitPresetId', '套裝：女僕'),
    optionByLabel('outfitPresetId', '套裝：兔女郎'),
    optionByLabel('dressId', '連身：短版｜亮面深V掛脖迷你洋裝'),
    optionByLabel('dressId', '連身：短版｜一字領哥德迷你洋裝'),
  ].forEach((option) => {
    const text = [option.zh, option.en, option.desc].join(' ');
    assert.doesNotMatch(text, /black|white|ivory|silver|rose pink|burgundy|jewel-tone|nude-beige|deep red|玫瑰粉|酒紅|象牙白|銀色|黑色|白色/i);
  });
});

test('nurse uniform outfit prompt does not include apron-like panel wording', () => {
  const nurseOutfit = optionByLabel('outfitPresetId', '套裝：護士制服');
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    outfitPresetId: nurseOutfit.id,
  });
  const text = [nurseOutfit.en, prompt.grokPrompt, prompt.zImagePrompt].join('\n');

  assert.match(text, /nurse uniform outfit/);
  assert.doesNotMatch(text, /apron-like panel/i);
});

test('doctor and secretary outfit prompts include updated signature props and silhouettes', () => {
  const doctorOutfit = optionByLabel('outfitPresetId', '套裝：醫生診療袍');
  const secretaryOutfit = optionByLabel('outfitPresetId', '套裝：秘書短裙');

  assert.match(doctorOutfit.en, /stethoscope/i);
  assert.match(doctorOutfit.en, /medical chart/i);
  assert.match(secretaryOutfit.en, /body-hugging blazer/i);
  assert.match(secretaryOutfit.en, /tight mini skirt/i);

  const [doctorPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    outfitPresetId: doctorOutfit.id,
  });
  const [secretaryPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    outfitPresetId: secretaryOutfit.id,
  });

  assert.match([doctorPrompt.grokPrompt, doctorPrompt.zImagePrompt].join('\n'), /stethoscope/i);
  assert.match([doctorPrompt.grokPrompt, doctorPrompt.zImagePrompt].join('\n'), /medical chart/i);
  assert.match([secretaryPrompt.grokPrompt, secretaryPrompt.zImagePrompt].join('\n'), /body-hugging blazer/i);
  assert.match([secretaryPrompt.grokPrompt, secretaryPrompt.zImagePrompt].join('\n'), /tight mini skirt/i);
});

test('wardrobe image metadata is available for outfit presets and dresses', () => {
  const doctorOutfit = optionByLabel('outfitPresetId', '套裝：醫生診療袍');
  const halterDress = optionByLabel('dressId', '連身：短版｜亮面深V掛脖迷你洋裝');

  assert.equal(doctorOutfit.meta.referenceImage, 'reference/wardrobe/outfit-presets/10_醫生.png');
  assert.equal(doctorOutfit.meta.referenceImageFormat, 'png');
  assert.equal(halterDress.meta.referenceImage, 'reference/wardrobe/dresses/31_深V掛脖迷你洋裝.png');
  assert.equal(halterDress.meta.referenceImageFormat, 'png');
});

test('wardrobe image metadata is available for special outfits', () => {
  const specialOutfit = optionByLabel('specialOutfitId', '粉紫蕾絲豹紋低腰喇叭褲造型');

  assert.equal(specialOutfit.meta.referenceImage, 'reference/wardrobe/special-outfits/09_粉紫蕾絲豹紋.png');
  assert.equal(specialOutfit.meta.referenceImageFormat, 'png');
});

test('moved and renamed outfit preset legacy locks normalize safely', () => {
  const movedLatexDress = normalizeLocks({
    ...createEmptyLocks(),
    outfitPresetId: 'wardrobe:套裝-outfit-presets:玫瑰粉乳膠迷你洋裝套裝:3',
  });
  assert.equal(movedLatexDress.outfitPresetId, 'outfit-preset-none');
  assert.equal(movedLatexDress.dressId, optionByLabel('dressId', '連身：短版｜亮面乳膠迷你洋裝').id);

  const movedDisplayLatexDress = normalizeLocks({
    ...createEmptyLocks(),
    outfitPresetId: 'wardrobe:套裝-outfit-presets:套裝-乳膠迷你洋裝:3',
  });
  assert.equal(movedDisplayLatexDress.outfitPresetId, 'outfit-preset-none');
  assert.equal(movedDisplayLatexDress.dressId, optionByLabel('dressId', '連身：短版｜亮面乳膠迷你洋裝').id);

  const renamedParisPreset = normalizeLocks({
    ...createEmptyLocks(),
    outfitPresetId: 'wardrobe:套裝-outfit-presets:象牙白春日巴黎套裝:4',
  });
  assert.equal(renamedParisPreset.outfitPresetId, optionByLabel('outfitPresetId', '套裝：春日巴黎亞麻長褲').id);

  const renamedDisplayParisPreset = normalizeLocks({
    ...createEmptyLocks(),
    outfitPresetId: 'wardrobe:套裝-outfit-presets:套裝-春日巴黎:4',
  });
  assert.equal(renamedDisplayParisPreset.outfitPresetId, optionByLabel('outfitPresetId', '套裝：春日巴黎亞麻長褲').id);

  const removedHanfu = normalizeLocks({
    ...createEmptyLocks(),
    outfitPresetId: 'wardrobe:套裝-outfit-presets:經典漢服套裝:26',
  });
  assert.equal(removedHanfu.outfitPresetId, 'outfit-preset-none');
});

test('generated prompts keep outfit preset color separate from clothing structure', () => {
  const outfit = optionByLabel('outfitPresetId', '套裝：鏈條緞面內衣');
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    outfitPresetId: outfit.id,
    outfitPresetPrimaryColorId: optionByLabel('outfitPresetPrimaryColorId', '紅色').id,
  });

  assert.equal(prompt.selection.outfitPresetId, outfit.id);
  assert.match(prompt.grokPrompt, /Wardrobe:\nShe wears [\s\S]*red satin lingerie set/);
  assert.match(prompt.grokPrompt, /satin lingerie set/);
});

test('complete look palette applies to special outfits, outfit presets, and dresses only', () => {
  const completePalette = optionByLabel('completeLookPaletteId', '黑紅街頭');
  const specialOutfit = optionByLabel('specialOutfitId', '粉紫蕾絲豹紋低腰喇叭褲造型');
  const outfitPreset = optionByLabel('outfitPresetId', '套裝：秘書短裙');
  const dress = optionByLabel('dressId', '連身：短版｜亮面乳膠迷你洋裝');
  const top = optionByLabel('topId', '短版 T 恤');
  const skirt = optionByLabel('skirtId', '百褶短裙');

  const [specialPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    specialOutfitId: specialOutfit.id,
    completeLookPaletteId: completePalette.id,
  });
  const [presetPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    outfitPresetId: outfitPreset.id,
    completeLookPaletteId: completePalette.id,
  });
  const [dressPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    dressId: dress.id,
    completeLookPaletteId: completePalette.id,
  });
  const [separatesPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    topId: top.id,
    skirtId: skirt.id,
    completeLookPaletteId: completePalette.id,
  });

  [specialPrompt, presetPrompt, dressPrompt].forEach((prompt) => {
    const text = [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt].join('\n');
    assert.equal(prompt.selection.completeLookPaletteId, completePalette.id);
    assert.match(text, /complete outfit palette direction: shift the complete outfit palette toward a black-and-red street color family/);
    assert.match(text, /preserving garment structure, accessory separation, material contrast, and multi-piece color variation/);
    assert.doesNotMatch(text, /flat color/i);
  });

  assert.equal(separatesPrompt.selection.completeLookPaletteId, '');
  assert.doesNotMatch(
    [separatesPrompt.grokPrompt, separatesPrompt.zImagePrompt, separatesPrompt.midjourneyPrompt].join('\n'),
    /complete outfit palette direction/
  );
});

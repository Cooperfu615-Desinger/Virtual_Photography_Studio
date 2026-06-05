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

test('reference outfit presets 27 to 38 preserve complete styling anchors and image metadata', () => {
  [
    [
      '套裝：豹紋蕾絲抹胸喇叭牛仔',
      /leopard-pattern strapless corset top/i,
      /lace bust cups/i,
      /low-rise flared jeans/i,
      'reference/wardrobe/outfit-presets/27_豹紋蕾絲抹胸喇叭牛仔.png',
    ],
    [
      '套裝：網紗掛脖背心牛仔迷你裙',
      /sheer mesh halter camisole/i,
      /denim micro mini skirt/i,
      /platform sandals/i,
      'reference/wardrobe/outfit-presets/28_網紗掛脖牛仔迷你裙.png',
    ],
    [
      '套裝：天使翅膀三角比基尼',
      /triangle bikini costume set/i,
      /feather angel wings/i,
      /layered body chains/i,
      'reference/wardrobe/outfit-presets/29_天使翅膀比基尼.png',
    ],
    [
      '套裝：透視背心漆皮短褲長靴',
      /sheer-panel fitted tank top/i,
      /glossy micro shorts/i,
      /knee-high leather boots/i,
      'reference/wardrobe/outfit-presets/30_透視背心漆皮短褲長靴.png',
    ],
    [
      '套裝：馬甲吊帶喇叭褲',
      /button-front corset camisole/i,
      /slim flared trousers/i,
      /lingerie-trim neckline/i,
      'reference/wardrobe/outfit-presets/31_馬甲吊帶喇叭褲.png',
    ],
    [
      '套裝：豹紋荷葉吊帶漆皮短褲',
      /leopard-pattern ruffled camisole/i,
      /glossy micro shorts/i,
      /knee-high open-toe boots/i,
      'reference/wardrobe/outfit-presets/32_豹紋荷葉吊帶漆皮短褲.png',
    ],
    [
      '套裝：拼接掛脖長背心漆皮短褲',
      /patchwork halter scarf top/i,
      /glossy micro shorts/i,
      /lace-up ankle boots/i,
      'reference/wardrobe/outfit-presets/33_拼接掛脖漆皮短褲.png',
    ],
    [
      '套裝：金屬三角比基尼',
      /metallic triangle bikini set/i,
      /side-tie bikini bottoms/i,
      /layered body chains/i,
      'reference/wardrobe/outfit-presets/34_金屬三角比基尼.png',
    ],
    [
      '套裝：單肩短上衣印花圍裙短裙',
      /one-shoulder cropped top/i,
      /printed scarf-wrap mini skirt/i,
      /lace-up heeled boots/i,
      'reference/wardrobe/outfit-presets/35_單肩短上衣印花圍裙短裙.png',
    ],
    [
      '套裝：垂墜背心腰鏈短裙',
      /draped sleeveless top/i,
      /asymmetric wrap mini skirt/i,
      /chain belt/i,
      'reference/wardrobe/outfit-presets/36_垂墜背心腰鏈短裙.png',
    ],
    [
      '套裝：皮革掛脖背心短褲長靴',
      /zip-front leather halter vest/i,
      /low-rise leather shorts/i,
      /knee-high leather boots/i,
      'reference/wardrobe/outfit-presets/37_皮革掛脖短褲長靴.png',
    ],
    [
      '套裝：斑馬紋馬甲短褲長靴',
      /zebra-pattern corset tank/i,
      /glossy micro shorts/i,
      /knee-high leather boots/i,
      'reference/wardrobe/outfit-presets/38_斑馬紋馬甲短褲長靴.png',
    ],
  ].forEach(([label, ...expectations]) => {
    const referenceImage = expectations.pop();
    const option = optionByLabel('outfitPresetId', label);
    const text = [option.en, option.desc].join(' ');

    expectations.forEach((pattern) => {
      assert.match(text, pattern);
    });

    assert.match(text, /controlled by the outfit color selection/i);
    assert.equal(option.meta.referenceImage, referenceImage);
    assert.equal(option.meta.referenceImageFormat, 'png');
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
      '連身：短版｜蝴蝶結抹胸迷你洋裝',
      '連身：長版｜細肩帶斜荷葉長洋裝',
      '連身：短版｜單肩披袖亮片迷你洋裝',
      '連身：短版｜格紋吊帶荷葉迷你洋裝',
      '連身：短版｜緞面細肩帶迷你洋裝',
      '連身：短版｜高領挖腰連身泳裝',
    ]
  );

  assert.ok(!optionLabels('dressId').includes('連身：雛菊背心丹寧吊帶短褲造型'));
});

test('reference dress entries describe garments without accessory or shoe details', () => {
  [
    [
      '連身：短版｜蝴蝶結抹胸迷你洋裝',
      /soft silk strapless mini dress/i,
      /tight cropped bodice ending above waistline/i,
      /oversized front bow/i,
      /ultra-short mini skirt/i,
    ],
    [
      '連身：長版｜細肩帶斜荷葉長洋裝',
      /sheer tulle spaghetti-strap maxi dress/i,
      /soft vertical drape/i,
      /diagonal ruffle hem/i,
    ],
    [
      '連身：短版｜單肩披袖亮片迷你洋裝',
      /one-shoulder sequined mini dress/i,
      /draped cape sleeve/i,
      /shimmering torso panel/i,
    ],
    [
      '連身：短版｜格紋吊帶荷葉迷你洋裝',
      /plaid spaghetti-strap mini dress/i,
      /ruched bust panel/i,
      /waterfall ruffle panels/i,
    ],
    [
      '連身：短版｜緞面細肩帶迷你洋裝',
      /satin spaghetti-strap mini dress/i,
      /inner lace bra detail/i,
      /ruched satin torso/i,
    ],
    [
      '連身：短版｜高領挖腰連身泳裝',
      /high-neck cut-out one-piece swimsuit/i,
      /open waist and abdomen cut-outs/i,
      /high-cut leg line/i,
    ],
  ].forEach(([label, ...patterns]) => {
    const option = optionByLabel('dressId', label);
    const text = [option.en, option.desc].join(' ');

    patterns.forEach((pattern) => {
      assert.match(text, pattern);
    });

    assert.doesNotMatch(text, /sandals|shoes|bag|bracelet|necklace|choker|cuff|earrings|bracelets|手環|項鍊|鞋|包|耳環/i);
    assert.match(text, /controlled by dress color selection/i);
  });
});

test('mirror chrome garment color applies scene-reflective material to the new cut-out one-piece', () => {
  const cutoutSwimsuit = optionByLabel('dressId', '連身：短版｜高領挖腰連身泳裝');
  const mirrorChrome = optionByLabel('dressColorId', '鏡面鉻銀');
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    outfitPresetId: optionByLabel('outfitPresetId', '全無').id,
    dressId: cutoutSwimsuit.id,
    dressColorId: mirrorChrome.id,
    topBottomPaletteId: optionByLabel('topBottomPaletteId', '全無').id,
  });

  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt].join('\n');

  assert.match(promptText, /mirror-chrome silver/i);
  assert.match(promptText, /scene-reflective surface/i);
  assert.match(promptText, /high-neck cut-out one-piece swimsuit/i);
  assert.match(promptText, /open waist and abdomen cut-outs/i);
  assert.equal(prompt.selection.outfitPresetId, '');
  assert.equal(prompt.selection.dressId, cutoutSwimsuit.id);
  assert.equal(prompt.selection.dressColorId, mirrorChrome.id);
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

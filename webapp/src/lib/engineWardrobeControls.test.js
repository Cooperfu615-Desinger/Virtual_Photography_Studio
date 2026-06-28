import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createEmptyLocks,
  generatePrompts,
  getCloseupAllowedKeys,
  getLockControls,
  isWardrobeIncompatibleCloseupFramingId,
  normalizeLocks,
  sanitizeLocksForCloseupMode,
} from './engine.js';

const optionId = (controlKey, zh) => {
  const control = getLockControls().find((item) => item.key === controlKey);
  const option = control?.options.find((item) => item.zh === zh);
  assert.ok(option, `${controlKey} should include ${zh}`);
  return option.id;
};

const optionByLabel = (controlKey, zh) => {
  const control = getLockControls().find((item) => item.key === controlKey);
  const option = control?.options.find((item) => item.zh === zh);
  assert.ok(option, `${controlKey} should include ${zh}`);
  return option;
};

test('bottom rise controls include a slightly unbuttoned and unzipped pants state', () => {
  const controls = getLockControls();
  const bottomRiseControl = controls.find((control) => control.key === 'bottomRiseId');
  const pantsControl = controls.find((control) => control.key === 'pantsId');
  const unbuttonedRise = bottomRiseControl.options.find((option) => option.zh === '扣子解開拉鏈微開');
  const jeans = pantsControl.options.find((option) => option.zh === '直筒牛仔褲');

  assert.ok(unbuttonedRise);
  assert.ok(jeans);

  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    pantsId: jeans.id,
    bottomRiseId: unbuttonedRise.id,
  });

  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.summary].join('\n');

  assert.match(promptText, /扣子解開拉鏈微開|waist button undone and front zipper slightly lowered/);
  assert.match(promptText, /直筒牛仔褲|straight-leg jeans/);
});

test('bottom rise and fit appear before the bottom garment in generated wardrobe text', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    pantsId: optionId('pantsId', '直筒牛仔褲'),
    bottomRiseId: optionId('bottomRiseId', '低腰'),
    bottomFitId: optionId('bottomFitId', '寬版'),
  });

  const grokPantsLine = prompt.grokPrompt.match(/Wardrobe:\n([\s\S]*?)(?:\n\n|$)/)?.[1] || '';
  assert.ok(grokPantsLine);
  assert.ok(
    grokPantsLine.indexOf('low-rise waistband sitting on the hips') < grokPantsLine.indexOf('wide-leg volume with a broad lower-body opening'),
    'bottom rise should appear before bottom fit'
  );
  assert.ok(
    grokPantsLine.indexOf('wide-leg volume with a broad lower-body opening') < grokPantsLine.indexOf('straight-leg jeans'),
    'bottom fit should appear before the pants item'
  );

  const zImageText = prompt.zImagePrompt;
  assert.ok(
    zImageText.indexOf('low-rise waistband sitting on the hips') < zImageText.indexOf('wide-leg volume with a broad lower-body opening'),
    'Z-Image bottom rise should appear before bottom fit'
  );
  assert.ok(
    zImageText.indexOf('wide-leg volume with a broad lower-body opening') < zImageText.indexOf('straight-leg jeans'),
    'Z-Image bottom fit should appear before the pants item'
  );
});

test('pants-specific unbuttoned zipper waist state is not applied to skirts', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    skirtId: optionId('skirtId', '迷你裙'),
    bottomRiseId: optionId('bottomRiseId', '扣子解開拉鏈微開'),
  });

  const promptText = [prompt.grokPrompt, prompt.zImagePrompt].join('\n');

  assert.doesNotMatch(promptText, /waist button undone and front zipper slightly lowered/);
  assert.match(promptText, /mini skirt/);
});

test('pants controls include dolphin micro shorts and knee-length fitted shorts', () => {
  const bootyShorts = optionByLabel('pantsId', '真理褲');
  const rhythmicShorts = optionByLabel('pantsId', '韻律緊身短褲');

  assert.match(bootyShorts.en, /low-rise dolphin micro shorts/);
  assert.match(bootyShorts.en, /front drawstring/);
  assert.match(bootyShorts.en, /side lace-up grommet detail/);
  assert.match(rhythmicShorts.en, /knee-length stretch leggings shorts/);

  const [bootyPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    pantsId: bootyShorts.id,
  });
  const [rhythmicPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    pantsId: rhythmicShorts.id,
  });

  assert.match([bootyPrompt.grokPrompt, bootyPrompt.zImagePrompt].join('\n'), /low-rise dolphin micro shorts/);
  assert.match([bootyPrompt.grokPrompt, bootyPrompt.zImagePrompt].join('\n'), /side lace-up grommet detail/);
  assert.match([rhythmicPrompt.grokPrompt, rhythmicPrompt.zImagePrompt].join('\n'), /knee-length stretch leggings shorts/);
  assert.equal(
    normalizeLocks({ ...createEmptyLocks(), pantsId: 'wardrobe:褲裝-pants:真理褲:4' }).pantsId,
    bootyShorts.id
  );
});

test('lace thong prompt uses thin-strap minimal-coverage thong structure', () => {
  const lacePanties = optionByLabel('pantsId', '蕾絲內褲');
  const laceThong = optionByLabel('pantsId', '蕾絲丁字褲');

  assert.match(lacePanties.en, /lace panties/);
  assert.match(laceThong.en, /seamless lace thong bottoms/);
  assert.match(laceThong.en, /ultra-thin side straps/);
  assert.match(laceThong.en, /minimal rear coverage/);
  assert.match(laceThong.en, /exposed buttock curve/);
  assert.doesNotMatch(lacePanties.en, /thong|minimal rear coverage|exposed buttock curve/i);

  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    pantsId: laceThong.id,
  });

  assert.match([prompt.grokPrompt, prompt.zImagePrompt].join('\n'), /seamless lace thong bottoms/);
  assert.match([prompt.grokPrompt, prompt.zImagePrompt].join('\n'), /ultra-thin side straps/);
});

test('top fit and styling appear before the top garment in generated wardrobe text', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    topId: optionId('topId', '襯衫'),
    topFitId: optionId('topFitId', '緊身'),
    topStylingId: optionId('topStylingId', '下擺打結'),
  });

  const grokTopLine = prompt.grokPrompt.match(/Wardrobe:\n([\s\S]*?)(?:\n\n|$)/)?.[1] || '';
  assert.ok(grokTopLine);
  assert.ok(
    grokTopLine.indexOf('tight body-skimming upper-body fit') < grokTopLine.indexOf('front hem tied into a compact knot below the waist'),
    'top fit should appear before top styling'
  );
  assert.ok(
    grokTopLine.indexOf('front hem tied into a compact knot below the waist') < grokTopLine.indexOf('shirt, crisp cotton poplin'),
    'top styling should appear before the top item'
  );

  const zImageText = prompt.zImagePrompt;
  assert.ok(
    zImageText.indexOf('tight body-skimming upper-body fit') < zImageText.indexOf('front hem tied into a compact knot below the waist'),
    'Z-Image top fit should appear before top styling'
  );
  assert.ok(
    zImageText.indexOf('front hem tied into a compact knot below the waist') < zImageText.indexOf('shirt, crisp cotton poplin'),
    'Z-Image top styling should appear before the top item'
  );
  assert.doesNotMatch(zImageText, /paired with crisp cotton poplin/);
});

test('outerwear styling appears after the outerwear garment while GPT omits normal-wear wording', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    outerwearId: optionId('outerwearId', '運動連帽外套'),
    outerwearStylingId: optionId('outerwearStylingId', '正常穿著'),
    topId: optionId('topId', '襯衫'),
  });

  const grokOuterwearLine = prompt.grokPrompt.match(/Wardrobe:\n([\s\S]*?)(?:\n\n|$)/)?.[1] || '';
  assert.ok(grokOuterwearLine);
  assert.match(grokOuterwearLine, /zip-up hoodie/);
  assert.doesNotMatch(grokOuterwearLine, /properly worn on both shoulders/);

  const zImageText = prompt.zImagePrompt;
  assert.match(zImageText, /zip-up hoodie/);
  assert.doesNotMatch(zImageText, /properly worn on both shoulders/);
});

test('outerwear and long shirt compose as explicit outer-over-inner layers', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    outerwearId: optionId('outerwearId', '丹寧外套'),
    outerwearOpeningId: optionId('outerwearOpeningId', '敞開穿'),
    outerwearColorId: optionId('outerwearColorId', '深灰色'),
    outerwearStylingId: optionId('outerwearStylingId', '正常穿著'),
    topId: optionId('topId', '長版襯衫'),
    topColorId: optionId('topColorId', '米白色'),
    topFitId: optionId('topFitId', '緊身'),
    pantsId: optionId('pantsId', '絲絨喇叭褲'),
    bottomRiseId: optionId('bottomRiseId', '超低腰'),
    bottomFitId: optionId('bottomFitId', '緊身'),
  });

  const grokWardrobeLine = prompt.grokPrompt.match(/Wardrobe:\n([\s\S]*?)(?:\n\n|$)/)?.[1] || '';
  assert.ok(grokWardrobeLine);
  assert.match(grokWardrobeLine, /dark grey washed denim jacket with chest pockets and metal buttons[\s\S]*layered over[\s\S]*off-white longline shirt/);
  assert.doesNotMatch(grokWardrobeLine, /properly worn on both shoulders/);
  assert.doesNotMatch(grokWardrobeLine, /She wears properly worn on both shoulders, dark grey denim jacket/);
  assert.doesNotMatch(grokWardrobeLine, /realistic outer-to-inner dressing order/);
  assert.match(grokWardrobeLine, /outerwear stays intact; inner garment visible only at neckline, opening, or hem/);
  assert.match(prompt.zImagePrompt, /dark grey washed denim jacket[\s\S]*layered over[\s\S]*off-white longline shirt/);
  assert.doesNotMatch(prompt.zImagePrompt, /properly worn on both shoulders|paired with off-white longline shirt/);
});

test('outerwear fit and opening compose before pattern and shoulder styling', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    outerwearId: optionId('outerwearId', '丹寧外套'),
    outerwearFitId: optionId('outerwearFitId', '短版 Oversize'),
    outerwearOpeningId: optionId('outerwearOpeningId', '敞開穿'),
    outerwearPatternId: optionId('outerwearPatternId', '粗橫條紋'),
    outerwearStylingId: optionId('outerwearStylingId', '滑落肩部'),
    topId: optionId('topId', '襯衫'),
  });

  const grokWardrobeLine = prompt.grokPrompt.match(/Wardrobe:\n([\s\S]*?)(?:\n\n|$)/)?.[1] || '';
  assert.ok(grokWardrobeLine);

  assert.match(grokWardrobeLine, /underbust-cropped oversized outerwear/);
  assert.match(grokWardrobeLine, /ending just below the bust/);
  assert.match(grokWardrobeLine, /worn open at the front/);
  assert.match(grokWardrobeLine, /slipped below one or both shoulders, sleeves still on the arms, intact jacket body/);
  assert.doesNotMatch(grokWardrobeLine, /jacket body hanging as an intact outer layer/);
  assert.ok(
    grokWardrobeLine.indexOf('underbust-cropped oversized outerwear') < grokWardrobeLine.indexOf('denim jacket'),
    'outerwear fit should appear before the outerwear item'
  );
  assert.ok(
    grokWardrobeLine.indexOf('denim jacket') < grokWardrobeLine.indexOf('bold horizontal stripe outerwear'),
    'outerwear item should appear before outerwear pattern'
  );
  assert.ok(
    grokWardrobeLine.indexOf('bold horizontal stripe outerwear') < grokWardrobeLine.indexOf('worn open at the front'),
    'outerwear opening should appear after outerwear pattern'
  );
  assert.ok(
    grokWardrobeLine.indexOf('worn open at the front') < grokWardrobeLine.indexOf('slipped below one or both shoulders'),
    'outerwear opening should appear before shoulder styling'
  );
  assert.match(prompt.zImagePrompt, /slipped below one or both shoulders/);
  assert.match(prompt.zImagePrompt, /intact jacket body/);
});

test('model-specific shoes stay concise while preserving signature accent details', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    shoesId: optionId('shoesId', 'Samba OG'),
    shoesColorId: optionId('shoesColorId', '白色'),
  });

  const grokShoesLine = prompt.grokPrompt.match(/Wardrobe:\n([\s\S]*?)(?:\n\n|$)/)?.[1] || '';
  assert.ok(grokShoesLine);
  assert.match(grokShoesLine, /white adidas samba og sneakers/);
  assert.match(grokShoesLine, /gum sole/);
  assert.match(grokShoesLine, /three-stripe side detail/);
  assert.doesNotMatch(grokShoesLine, /low-top classic terrace shoe silhouette/);

  assert.match(prompt.zImagePrompt, /white adidas samba og sneakers/);
  assert.match(prompt.zImagePrompt, /gum sole/);
  assert.match(prompt.zImagePrompt, /three-stripe side detail/);
});

test('generic shoe colors do not conflict with fixed color wording', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    shoesId: optionId('shoesId', '高跟鞋'),
    shoesColorId: optionId('shoesColorId', '白色'),
  });

  const grokShoesLine = prompt.grokPrompt.match(/Wardrobe:\n([\s\S]*?)(?:\n\n|$)/)?.[1] || '';
  assert.ok(grokShoesLine);
  assert.match(grokShoesLine, /white glossy pointed-toe stiletto pumps/);
  assert.doesNotMatch(grokShoesLine, /black glossy pointed-toe/);

  assert.match(prompt.zImagePrompt, /white glossy pointed-toe stiletto pumps/);
  assert.doesNotMatch(prompt.zImagePrompt, /black glossy pointed-toe/);
});

test('single-subject eyewear earrings and neck accessories are bound to the subject description', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    eyewearId: optionId('eyewearId', '復古圓框眼鏡'),
    earringsId: optionId('earringsId', '珍珠耳釘'),
    neckAccessoryId: optionId('neckAccessoryId', '金屬細頸圈'),
  });

  const subjectLine = prompt.grokPrompt.match(/Subject:\n([\s\S]*?)(?:\n\n|$)/)?.[1] || '';
  assert.ok(subjectLine);
  assert.match(subjectLine, /with .*retro round.*glasses.*pearl.*earrings?.*slim metal choker/i);
  assert.doesNotMatch(prompt.grokPrompt, /^Eyewear:/m);
  assert.doesNotMatch(prompt.grokPrompt, /^Earrings:/m);
  assert.doesNotMatch(prompt.grokPrompt, /^Neck Accessory:/m);

  assert.match(prompt.zImagePrompt, /with .*retro round.*glasses.*pearl.*earrings?.*slim metal choker/i);
});

test('duo eyewear earrings and neck accessories stay grouped by person in the subject description', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '2',
    eyewearAId: optionId('eyewearAId', '粗框眼鏡'),
    eyewearAColorId: optionId('eyewearAColorId', '黑色'),
    earringsAId: optionId('earringsAId', '小型金屬耳環'),
    neckAccessoryAId: optionId('neckAccessoryAId', '街頭風格金項鏈'),
    eyewearBId: optionId('eyewearBId', '太陽眼鏡'),
    eyewearBColorId: optionId('eyewearBColorId', '黑色'),
    earringsBId: optionId('earringsBId', '十字垂墜耳環'),
    neckAccessoryBId: optionId('neckAccessoryBId', '皮質扣環頸鏈'),
  });

  const subjectLine = prompt.grokPrompt.match(/Subject:\n([\s\S]*?)(?=\n\n(?:Shared Expression|Scene|Wardrobe|Pose and Composition|Lighting|Camera Look):\n|$)/)?.[1] || '';
  assert.ok(subjectLine);
  assert.match(subjectLine, /Woman 1:\nHas .*with .*black frame.*bold thick-frame glasses.*metallic earrings?.*gold chain/i);
  assert.match(subjectLine, /Woman 2:\nHas .*with .*black frame.*sunglasses.*cross.*earrings?.*leather buckle choker/i);
  assert.doesNotMatch(prompt.grokPrompt, /^Woman 1 Eyewear:/m);
  assert.doesNotMatch(prompt.grokPrompt, /^Woman 1 Earrings:/m);
  assert.doesNotMatch(prompt.grokPrompt, /^Woman 1 Neck Accessory:/m);
  assert.doesNotMatch(prompt.grokPrompt, /^Woman 2 Eyewear:/m);
  assert.doesNotMatch(prompt.grokPrompt, /^Woman 2 Earrings:/m);
  assert.doesNotMatch(prompt.grokPrompt, /^Woman 2 Neck Accessory:/m);

  assert.match(prompt.zImagePrompt, /Woman 1:\nWears .*black frame.*bold thick-frame glasses.*metallic earrings?.*gold chain/i);
  assert.match(prompt.zImagePrompt, /Woman 2:\nWears .*black frame.*sunglasses.*cross.*earrings?.*leather buckle choker/i);
});

test('duo random separates avoid duplicated top color styling', () => {
  const originalRandom = Math.random;
  Math.random = () => 0;

  try {
    const [prompt] = generatePrompts(1, {
      ...createEmptyLocks(),
      subjectCount: '2',
      framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
      topAId: optionId('topAId', '棉質細肩背心'),
      topBId: optionId('topBId', '襯衫'),
      pantsAId: optionId('pantsAId', '直筒牛仔褲'),
      pantsBId: optionId('pantsBId', '絲絨喇叭褲'),
    });

    assert.ok(prompt.selection.topAColorId);
    assert.ok(prompt.selection.topBColorId);
    assert.notEqual(prompt.selection.topAColorId, prompt.selection.topBColorId);

    const promptText = [prompt.grokPrompt, prompt.zImagePrompt].join('\n');
    assert.match(promptText, /Woman 1:\n(?:Has [\s\S]*?\. )?Wears black cotton camisole top/i);
    assert.match(promptText, /Woman 2:\n(?:Has [\s\S]*?\. )?Wears white shirt/i);
    assert.doesNotMatch(promptText, /coordinated but clearly distinct outfits|avoid identical garment colors|avoid matching top colors/i);
  } finally {
    Math.random = originalRandom;
  }
});

test('special top and bottom palette controls include the new color-card pairings', () => {
  const controls = getLockControls();
  const paletteControl = controls.find((control) => control.key === 'topBottomPaletteId');
  const expectedPalettes = [
    '櫻花粉 × 奶油黃',
    '皇家海軍藍 × 檸檬雪紡',
    '暗影灰 × 沙陶棕',
    '柔亞麻 × 櫻花粉',
    '藍灰 × 晨光奶油黃',
    '午夜潮汐藍 × 沙丘珍珠',
    '日光薄紗 × 鳳凰陶橘',
    '月騎士銀 × 黑色夜幕',
    '酒紅 × 香檳米',
    '薊花淡紫 × 深摩卡',
    '獵人綠 × 沙丘米',
    '萊姆奶油 × 復古葡萄紫',
    '電光玫瑰 × 查特酒綠',
    '熱情桃紅 × 棉花玫瑰',
    '咖啡豆棕黑 × 覆盆莓紅',
    '丁香紫 × 奶油白',
    '冰藍 × 鎗灰',
    '腮紅粉 × 晨光奶油黃',
    '濃縮咖啡棕 × 牡丹粉',
    '柔光光暈 × 龍焰橘',
    '日蝕紫 × 萊姆低語',
    '暗影木棕 × 月紗沙色',
    '冰藍 × 莓果紅',
    '午夜薰衣草紫 × 黑浪',
    '北極騎士白 × 暗星莓紫',
    '水晶潟湖藍 × 空靈晨曦',
    '宇宙港灣藍 × 櫻花粉',
    '虛空暗流 × 皮卡丘黃',
    '霜薄荷 × 黑水核心',
    '白色 × 黑色',
  ];

  assert.ok(paletteControl);
  for (const zh of expectedPalettes) {
    assert.ok(
      paletteControl.options.some((option) => option.zh === zh),
      `topBottomPaletteId should include ${zh}`
    );
  }
});

test('classic white top and black bottom palette applies separate colors', () => {
  const palette = optionByLabel('topBottomPaletteId', '白色 × 黑色');

  assert.equal(palette.en, 'white top with black bottom');
  assert.equal(palette.topColor.zh, '白色');
  assert.equal(palette.topColor.en, 'white');
  assert.equal(palette.bottomColor.zh, '黑色');
  assert.equal(palette.bottomColor.en, 'black');

  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    topId: optionId('topId', '棉質細肩背心'),
    pantsId: optionId('pantsId', '直筒牛仔褲'),
    topBottomPaletteId: palette.id,
  });

  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.summary].join('\n');

  assert.match(promptText, /white .*cotton camisole/);
  assert.match(promptText, /black straight-leg jeans/);
  assert.doesNotMatch(promptText, /#[0-9A-Fa-f]{6}/);
  assert.equal(prompt.selection.topBottomPaletteId, palette.id);
});

test('special top and bottom palettes expose two hex swatches for the wardrobe picker', () => {
  const controls = getLockControls();
  const paletteControl = controls.find((control) => control.key === 'topBottomPaletteId');

  assert.ok(paletteControl);
  const paletteOptions = paletteControl.options.filter((option) => option.topColor && option.bottomColor);
  assert.ok(paletteOptions.length > 0);

  for (const option of paletteOptions) {
    assert.match(option.topColor.hex || '', /^#[0-9A-Fa-f]{6}$/, `${option.zh} top color should have a hex swatch`);
    assert.match(option.bottomColor.hex || '', /^#[0-9A-Fa-f]{6}$/, `${option.zh} bottom color should have a hex swatch`);
  }
});

test('special top and bottom palettes apply separate colors to top and bottom garments', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    topId: optionId('topId', '棉質細肩背心'),
    pantsId: optionId('pantsId', '直筒牛仔褲'),
    topBottomPaletteId: optionId('topBottomPaletteId', '櫻花粉 × 奶油黃'),
  });

  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.summary].join('\n');

  assert.match(promptText, /cherry blossom pink/);
  assert.match(promptText, /cream yellow/);
  assert.doesNotMatch(promptText, /#[0-9A-Fa-f]{6}/);
  assert.match(promptText, /棉質細肩背心|cotton camisole/);
  assert.match(promptText, /直筒牛仔褲|straight-leg jeans/);
});

test('special outfit controls expose approved complete looks and remove stale extras', () => {
  const controls = getLockControls();
  const specialOutfitControl = controls.find((control) => control.key === 'specialOutfitId');

  assert.ok(specialOutfitControl);
  const optionLabels = specialOutfitControl.options.map((option) => option.zh);
  assert.equal(specialOutfitControl.options[0].zh, '隨機');
  assert.equal(specialOutfitControl.options[0].id, 'random');
  assert.ok(optionLabels.includes('黑色波點頭巾透紗套裝'));
  assert.ok(optionLabels.includes('金色貝雷帽皮草外套寬牛仔造型'));
  assert.ok(optionLabels.includes('黃色寬T條紋襯衫橄欖工裝褲造型'));
  assert.ok(optionLabels.includes('黃色皮革外套紅花洋裝銀靴造型'));
  assert.ok(optionLabels.includes('白色短袖背心格紋迷你裙白蕾絲襪造型'));
  assert.ok(optionLabels.includes('黑色哥德蕾絲短袖熱褲長靴造型'));
  assert.ok(optionLabels.includes('灰透紗荷葉吊帶熱褲涼鞋造型'));
  assert.ok(optionLabels.includes('奶白蕾絲荷葉短裙高筒襪造型'));
  assert.ok(optionLabels.includes('米白高領荷葉背心短裙涼鞋造型'));
  assert.ok(optionLabels.includes('白色透紗綁帶洋裝長襪軍靴造型'));
  assert.ok(optionLabels.includes('奶白透膚襯衫腰帶層裙短靴造型'));
  assert.ok(optionLabels.includes('螢光綠熱帶襯衫短褲運動鞋造型'));
  assert.ok(optionLabels.includes('粉色花朵抹胸洋裝草帽拖鞋造型'));
  assert.ok(optionLabels.includes('黃色圖像短T格紋喇叭褲分趾鞋造型'));
  assert.ok(optionLabels.includes('綠針織運動短褲藍包造型'));
  assert.ok(optionLabels.includes('紫色佩斯利襯衫短褲軍靴造型'));
  assert.ok(optionLabels.includes('粉色愛心T黑寬褲造型'));
  assert.ok(optionLabels.includes('白荷葉襯衫黑吊帶長裙波點包造型'));
  assert.ok(optionLabels.includes('白襯衫黑短褲西部靴造型'));
  assert.ok(optionLabels.includes('奶油掛脖棕紗裙軍靴造型'));
  assert.ok(optionLabels.includes('藍荷葉背心白紗長裙造型'));
  assert.equal(optionLabels.filter((label) => !['全無', '隨機'].includes(label)).length, 82);
  assert.ok(!optionLabels.includes('拼布絨呢外套塗鴉奶白工裝褲'));
  assert.ok(!optionLabels.includes('黑色鉚釘兜帽皮革迷你裙造型'));
});

test('wardrobe layering logic keeps long tops untucked over shorts', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    topId: optionId('topId', '長版寬鬆麻花針織毛衣'),
    pantsId: optionId('pantsId', '超短運動短褲'),
  });

  const promptText = [prompt.grokPrompt, prompt.zImagePrompt].join('\n');

  assert.match(promptText, /Wardrobe:\n[\s\S]*long top layer worn naturally untucked/);
  assert.match(promptText, /long top layer worn naturally untucked/);
  assert.match(promptText, /do not tuck the long top into the shorts/);
  assert.match(promptText, /shorts only peek out naturally below the hem/);
});

test('wardrobe layering logic preserves outerwear over strappy dresses', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    outerwearId: optionId('outerwearId', '西裝外套'),
    dressId: optionId('dressId', '連身：短版｜細肩帶迷你洋裝'),
  });

  const promptText = [prompt.grokPrompt, prompt.zImagePrompt].join('\n');

  assert.match(promptText, /outerwear stays intact; inner garment visible only at neckline, opening, or hem/);
  assert.match(promptText, /thin straps belong to the inner dress only/);
  assert.match(promptText, /do not turn the outerwear into slipped straps/);
});

test('outfit preset and dress option labels use unified prefixes without fixed color wording', () => {
  const controls = getLockControls();
  const outfitPresetControl = controls.find((control) => control.key === 'outfitPresetId');
  const dressControl = controls.find((control) => control.key === 'dressId');

  assert.equal(outfitPresetControl.options[0].zh, '隨機');
  assert.equal(outfitPresetControl.options[0].id, 'random');
  assert.equal(dressControl.options[0].zh, '隨機');
  assert.equal(dressControl.options[0].id, 'random');
  assert.ok(outfitPresetControl.options.some((option) => option.zh === '套裝：春日巴黎亞麻長褲'));
  assert.ok(outfitPresetControl.options.some((option) => option.zh === '套裝：西裝長褲'));
  assert.ok(outfitPresetControl.options.some((option) => option.zh === '套裝：鏈條緞面內衣'));
  assert.ok(outfitPresetControl.options.some((option) => option.zh === '套裝：浴巾裹身'));
  assert.ok(!outfitPresetControl.options.some((option) => option.zh === '套裝：極簡高級'));
  assert.ok(!outfitPresetControl.options.some((option) => option.zh === '套裝：日系街頭'));
  assert.ok(!outfitPresetControl.options.some((option) => option.zh === '象牙白春日巴黎套裝'));
  assert.ok(dressControl.options.some((option) => option.zh === '連身：短版｜無袖迷你洋裝'));
  assert.ok(dressControl.options.some((option) => option.zh === '連身：短版｜細肩帶迷你洋裝'));
});

test('random complete-look controls resolve to concrete wardrobe selections', () => {
  const fullBodyFramingId = optionId('framingId', '全身鏡頭 (Full Body Shot)');
  const noneOutfitPresetId = optionId('outfitPresetId', '全無');
  const noneDressId = optionId('dressId', '全無');
  const originalRandom = Math.random;
  Math.random = () => 0;

  try {
    const [specialPrompt] = generatePrompts(1, {
      ...createEmptyLocks(),
      framingId: fullBodyFramingId,
      specialOutfitId: 'random',
    });
    assert.ok(specialPrompt.selection.specialOutfitId);
    assert.notEqual(specialPrompt.selection.specialOutfitId, 'random');
    assert.doesNotMatch(specialPrompt.grokPrompt, /random special outfit/i);

    const [outfitPrompt] = generatePrompts(1, {
      ...createEmptyLocks(),
      framingId: fullBodyFramingId,
      outfitPresetId: 'random',
      dressId: noneDressId,
    });
    assert.ok(outfitPrompt.selection.outfitPresetId);
    assert.notEqual(outfitPrompt.selection.outfitPresetId, 'random');
    assert.doesNotMatch(outfitPrompt.grokPrompt, /random outfit preset/i);

    const [dressPrompt] = generatePrompts(1, {
      ...createEmptyLocks(),
      framingId: fullBodyFramingId,
      outfitPresetId: noneOutfitPresetId,
      dressId: 'random',
    });
    assert.ok(dressPrompt.selection.dressId);
    assert.notEqual(dressPrompt.selection.dressId, 'random');
    assert.doesNotMatch(dressPrompt.grokPrompt, /random dress/i);
  } finally {
    Math.random = originalRandom;
  }
});

test('bath towel outfit preset and sheer cover-up outerwear preserve requested garment structure', () => {
  const towelPreset = optionByLabel('outfitPresetId', '套裝：浴巾裹身');
  const sheerCoverUp = optionByLabel('outerwearId', '薄紗輕薄披衣外套');

  assert.match(towelPreset.en, /bath towel wrap outfit/);
  assert.match(towelPreset.en, /upper edge wrapped across the lower bust line/);
  assert.match(towelPreset.en, /above-knee length/);
  assert.match(sheerCoverUp.en, /sheer lightweight cover-up jacket/);
  assert.match(sheerCoverUp.en, /translucent gauze mesh fabric/);

  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    outfitPresetId: towelPreset.id,
    outerwearId: sheerCoverUp.id,
  });
  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.summary].join('\n');

  assert.match(promptText, /upper edge wrapped across the lower bust line/);
  assert.match(promptText, /thick terry towel texture/);
  assert.match(promptText, /sheer lightweight cover-up jacket/);
  assert.match(promptText, /translucent gauze mesh fabric/);
});

test('special top and bottom palette applies to outfit presets', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    outfitPresetId: optionId('outfitPresetId', '套裝：春日巴黎亞麻長褲'),
    topBottomPaletteId: optionId('topBottomPaletteId', '櫻花粉 × 奶油黃'),
  });

  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.summary].join('\n');

  assert.match(promptText, /cherry blossom pink/);
  assert.match(promptText, /cream yellow/);
  assert.doesNotMatch(promptText, /#[0-9A-Fa-f]{6}/);
  assert.equal(prompt.selection.topBottomPaletteId, optionId('topBottomPaletteId', '櫻花粉 × 奶油黃'));
});

test('special top and bottom palette applies to dress controls', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    dressId: optionId('dressId', '連身：短版｜無袖迷你洋裝'),
    topBottomPaletteId: optionId('topBottomPaletteId', '櫻花粉 × 奶油黃'),
  });

  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.summary].join('\n');

  assert.match(promptText, /cherry blossom pink/);
  assert.match(promptText, /cream yellow/);
  assert.doesNotMatch(promptText, /#[0-9A-Fa-f]{6}/);
  assert.match(promptText, /lower hem or skirt accent/);
});

test('wardrobe layering logic makes legwear secondary under long bottoms', () => {
  const [pantsPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    pantsId: optionId('pantsId', '直筒牛仔褲'),
    legwearId: optionId('legwearId', '羅紋短襪'),
  });
  const [skirtPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    skirtId: optionId('skirtId', '長裙'),
    legwearId: optionId('legwearId', '羅紋短襪'),
  });

  const pantsText = [pantsPrompt.grokPrompt, pantsPrompt.zImagePrompt].join('\n');
  const skirtText = [skirtPrompt.grokPrompt, skirtPrompt.zImagePrompt].join('\n');

  assert.match(pantsText, /legwear is secondary under the long bottom layer/);
  assert.match(pantsText, /do not force full socks or stockings to be completely displayed/);
  assert.match(skirtText, /legwear is secondary under the long bottom layer/);
  assert.match(skirtText, /long bottom layer keeps its natural full length and drape/);
});

test('face close-up framing locks wardrobe controls while keeping location and pose inputs available', () => {
  const controls = getLockControls();
  const faceCloseupId = optionId('framingId', '臉部特寫');
  const locks = {
    ...createEmptyLocks(),
    framingId: faceCloseupId,
    locationId: optionId('locationId', '室內：現代高樓公寓客廳'),
    topId: optionId('topId', '透膚刺繡襯衫'),
    pantsId: optionId('pantsId', '直筒牛仔褲'),
    shoesId: optionId('shoesId', '高跟鞋'),
    poseId: optionId('poseId', '坐姿｜微微前傾'),
    poseBaseId: optionId('poseBaseId', '坐姿'),
    poseHandId: optionId('poseHandId', '單手托下巴'),
    poseHeadId: optionId('poseHeadId', '頭部自然朝向鏡頭'),
  };

  assert.equal(isWardrobeIncompatibleCloseupFramingId(faceCloseupId), false);

  const allowedKeys = getCloseupAllowedKeys(faceCloseupId);
  assert.equal(allowedKeys.has('locationId'), true);
  assert.equal(allowedKeys.has('topId'), false);
  assert.equal(allowedKeys.has('pantsId'), false);
  assert.equal(allowedKeys.has('shoesId'), false);
  assert.equal(allowedKeys.has('poseId'), true);
  assert.equal(allowedKeys.has('specialActionId'), false);
  assert.equal(allowedKeys.has('poseBaseId'), true);
  assert.equal(allowedKeys.has('poseHandId'), true);
  assert.equal(allowedKeys.has('poseHeadId'), true);

  const sanitized = sanitizeLocksForCloseupMode(locks, controls);
  assert.equal(sanitized.framingId, locks.framingId);
  assert.equal(sanitized.locationId, locks.locationId);
  assert.equal(sanitized.topId, optionId('topId', '全無'));
  assert.equal(sanitized.pantsId, optionId('pantsId', '全無'));
  assert.equal(sanitized.shoesId, optionId('shoesId', '全無'));
  assert.equal(sanitized.poseId, locks.poseId);
  assert.equal(sanitized.specialActionId, optionId('specialActionId', '全無'));
  assert.equal(sanitized.poseBaseId, locks.poseBaseId);
  assert.equal(sanitized.poseHandId, locks.poseHandId);
  assert.equal(sanitized.poseHeadId, locks.poseHeadId);
});

test('face-only close-up prompts omit wardrobe text', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '臉部特寫'),
    locationId: optionId('locationId', '室內：現代高樓公寓客廳'),
    topId: optionId('topId', '透膚刺繡襯衫'),
    pantsId: optionId('pantsId', '直筒牛仔褲'),
    shoesId: optionId('shoesId', '高跟鞋'),
  });

  assert.equal(prompt.selection.framingId, optionId('framingId', '臉部特寫'));
  assert.equal(prompt.selection.locationId, optionId('locationId', '室內：現代高樓公寓客廳'));
  assert.equal(prompt.selection.topId, '');
  assert.equal(prompt.selection.pantsId, '');
  assert.equal(prompt.selection.shoesId, '');

  assert.match(prompt.grokPrompt, /tight facial close-up, face dominant in frame, minimal headroom/);
  assert.doesNotMatch(prompt.grokPrompt, /Wardrobe Visibility:/);
  assert.doesNotMatch(prompt.grokPrompt, /Wardrobe Integrity:/);
  assert.doesNotMatch(prompt.grokPrompt, /Keep the specified outfit visible where the chosen framing allows/i);
  assert.doesNotMatch(prompt.grokPrompt, /thin spaghetti-strap straight-neck one-piece dress/i);
  assert.doesNotMatch(prompt.grokPrompt, /semi-sheer embroidered shirt/i);
  assert.doesNotMatch(prompt.grokPrompt, /straight-leg jeans/);
  assert.doesNotMatch(prompt.grokPrompt, /glossy pointed-toe stiletto pumps/);
  assert.doesNotMatch(prompt.zImagePrompt, /thin spaghetti-strap straight-neck one-piece dress/i);
  assert.doesNotMatch(prompt.zImagePrompt, /semi-sheer embroidered shirt/i);
  assert.doesNotMatch(prompt.zImagePrompt, /straight-leg jeans/);
  assert.doesNotMatch(prompt.zImagePrompt, /glossy pointed-toe stiletto pumps/);
});

test('chest-up framing keeps full outfit-preset prompt active', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '胸上特寫'),
    locationId: optionId('locationId', '室內：現代高樓公寓客廳'),
    outfitPresetId: optionId('outfitPresetId', '套裝：輕盈浴衣'),
  });

  assert.equal(prompt.selection.framingId, optionId('framingId', '胸上特寫'));
  assert.equal(prompt.selection.outfitPresetId, optionId('outfitPresetId', '套裝：輕盈浴衣'));
  assert.match(prompt.grokPrompt, /lightweight yukata outfit/i);
  assert.match(prompt.grokPrompt, /ankle-length straight fall/i);
  assert.match(prompt.grokPrompt, /wide obi/i);
  assert.match(prompt.grokPrompt, /kinchaku pouch/i);
  assert.doesNotMatch(prompt.grokPrompt, /show lightweight yukata outfit only through/i);
  assert.doesNotMatch(prompt.grokPrompt, /only through nearby surfaces/i);
  assert.match(prompt.zImagePrompt, /lightweight yukata outfit/i);
  assert.match(prompt.zImagePrompt, /ankle-length straight fall/i);
  assert.match(prompt.zImagePrompt, /wide obi/i);
  assert.match(prompt.zImagePrompt, /kinchaku pouch/i);
  assert.doesNotMatch(prompt.zImagePrompt, /show lightweight yukata outfit only through/i);
});

test('close-up framing keeps direct wardrobe prompt details available', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '特寫鏡頭 (Close-Up)'),
    topId: optionId('topId', '透膚刺繡襯衫'),
  });

  assert.equal(prompt.selection.framingId, optionId('framingId', '特寫鏡頭 (Close-Up)'));
  assert.match(prompt.grokPrompt, /head and shoulders close-up, tight portrait crop/i);
  assert.match(prompt.grokPrompt, /semi-sheer embroidered shirt/i);
  assert.doesNotMatch(prompt.grokPrompt, /Wardrobe Visibility:/);
  assert.match(prompt.zImagePrompt, /semi-sheer embroidered shirt/i);
});

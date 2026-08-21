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

test('special latex materials are reusable outfit primary options but never contrast options', () => {
  const controls = getLockControls();
  const primary = controls.find((control) => control.key === 'outfitPresetPrimaryColorId');
  const contrast = controls.find((control) => control.key === 'outfitPresetContrastColorId');

  for (const label of ['亮面黑色乳膠', '亮面膚色乳膠']) {
    const primaryOption = primary.options.find((option) => option.zh === label);
    assert.ok(primaryOption, `primary color should include ${label}`);
    assert.equal(primaryOption.meta?.primaryMaterial, true);
    assert.equal(primaryOption.meta?.primaryOnly, true);
    assert.equal(contrast.options.some((option) => option.zh === label), false);
  }
});

test('random outfit primary color can resolve a reusable special latex material', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    outfitPresetId: optionId('outfitPresetId', '套裝：皮革馬甲束腰'),
    outfitPresetPrimaryColorId: '',
    locationId: optionId('locationId', '室內：深邃黑幕'),
  }, [], { random: () => 0.999 });

  assert.equal(prompt.selection.outfitPresetPrimaryColorId, 'glossy-skin-tone-latex');
  assert.match(prompt.grokPrompt, /glossy skin-tone latex/i);
  assert.match(prompt.zImagePrompt, /glossy skin-tone latex/i);
  assert.match(prompt.midjourneyPrompt, /glossy skin-tone latex/i);
});

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

test('multi-phrase garment colors use natural syntax across wardrobe layers and outfit targets', () => {
  const allNoneLocks = { ...createEmptyLocks() };
  for (const control of getLockControls()) {
    const noneOption = control.options?.find((option) => option.zh === '全無' || option.zh === '無額外表情');
    if (noneOption) allNoneLocks[control.key] = noneOption.id;
  }

  const cases = [
    {
      selectionKey: 'topColorId',
      locks: {
        topId: optionId('topId', '棉質細肩背心'),
        topColorId: optionId('topColorId', '彩色橫條紋'),
      },
      expected: /cotton camisole top[^.]*patterned with bold multicolored horizontal stripes, wide stripe bands, and clearly separated random colors/i,
      malformed: /random colors cotton camisole top/i,
    },
    {
      selectionKey: 'bottomColorId',
      locks: {
        pantsId: optionId('pantsId', '直筒牛仔褲'),
        bottomColorId: optionId('bottomColorId', '鏡面鉻銀'),
      },
      expected: /straight-leg jeans[^.]*finished in mirror-chrome silver with a highly polished scene-reflective surface and crisp environment reflections/i,
      malformed: /environment reflections straight-leg jeans/i,
    },
    {
      selectionKey: 'outerwearColorId',
      locks: {
        outerwearId: optionId('outerwearId', '短版合身西裝外套'),
        outerwearColorId: optionId('outerwearColorId', '彩色橫條紋'),
      },
      expected: /cropped fitted blazer[^.]*patterned with bold multicolored horizontal stripes, wide stripe bands, and clearly separated random colors/i,
      malformed: /random colors cropped fitted blazer/i,
    },
  ];

  for (const fixture of cases) {
    const [prompt] = generatePrompts(1, {
      ...allNoneLocks,
      subjectCount: '1',
      framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
      locationId: optionId('locationId', '室內：深邃黑幕'),
      ...fixture.locks,
    });
    const text = [prompt.grokPrompt, prompt.zImagePrompt, ...prompt.extraPrompts.map((entry) => entry.text)].join('\n');

    assert.match(text, fixture.expected);
    assert.doesNotMatch(text, fixture.malformed);
    assert.equal(prompt.selection[fixture.selectionKey], fixture.locks[fixture.selectionKey]);
  }

  const [outfitPrompt] = generatePrompts(1, {
    ...allNoneLocks,
    subjectCount: '1',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    outfitPresetId: optionId('outfitPresetId', '套裝：皮革馬甲束腰'),
    outfitPresetPrimaryColorId: optionId('outfitPresetPrimaryColorId', '彩色橫條紋'),
    outfitPresetContrastColorId: optionId('outfitPresetContrastColorId', '鏡面鉻銀'),
    locationId: optionId('locationId', '室內：深邃黑幕'),
  });
  const outfitText = [outfitPrompt.grokPrompt, outfitPrompt.zImagePrompt, ...outfitPrompt.extraPrompts.map((entry) => entry.text)].join('\n');

  assert.match(outfitText, /the corset bodice, the main leather panels, and the lower-half base panels with bold multicolored horizontal stripes/i);
  assert.match(outfitText, /the lace trims, the mesh panel accents, and the ribbon lacing in mirror-chrome silver with a highly polished scene-reflective surface/i);
  assert.doesNotMatch(outfitText, /random colors structured opaque leather corset|environment reflections structured opaque leather corset/i);
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
  assert.match(laceThong.en, /minimal back panel/);
  assert.doesNotMatch(laceThong.en, /exposed buttock curve/i);
  assert.doesNotMatch(lacePanties.en, /thong|minimal rear coverage|exposed buttock curve|delicate intimate styling|exposed hip line/i);

  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    pantsId: laceThong.id,
  });

  assert.match([prompt.grokPrompt, prompt.zImagePrompt].join('\n'), /seamless lace thong bottoms/);
  assert.match([prompt.grokPrompt, prompt.zImagePrompt].join('\n'), /ultra-thin side straps/);
});

test('single garment prompts remove contradictory wearing states and styling pollution', () => {
  const tieShirt = optionByLabel('topId', '領帶襯衫');
  const offShoulderTop = optionByLabel('topId', '一字領上衣');
  const laceBra = optionByLabel('topId', '蕾絲胸罩');
  const satinCheongsam = optionByLabel('topId', '素色緞面旗袍上衣');
  const embroideredCheongsam = optionByLabel('topId', '精緻刺繡旗袍上衣');
  const bikiniTop = optionByLabel('topId', '比基尼上身');
  const sportsBra = optionByLabel('topId', '運動型內衣');
  const bohemianTop = optionByLabel('topId', '波西米亞風上衣');
  const lowRiseJeans = optionByLabel('pantsId', '低腰牛仔褲');
  const bikiniBottom = optionByLabel('pantsId', '比基尼下身');
  const bohemianPants = optionByLabel('pantsId', '波西米亞風長褲');
  const bareFeet = optionByLabel('shoesId', '赤腳');
  const leatherChoker = optionByLabel('neckAccessoryId', '皮質扣環頸鏈');

  assert.match(tieShirt.en, /short soft necktie fastened at the collar/);
  assert.doesNotMatch(tieShirt.en, /relaxed collar opening/i);
  assert.doesNotMatch(offShoulderTop.en, /visible white bra straps/i);
  assert.doesNotMatch(laceBra.en, /or strapless/i);
  assert.doesNotMatch(satinCheongsam.en, /untucked hem worn loose|styling/i);
  assert.doesNotMatch(embroideredCheongsam.en, /untucked hem worn loose|styling/i);
  assert.doesNotMatch(bikiniTop.en, /clean beachwear styling/i);
  assert.doesNotMatch(sportsBra.en, /Calvin Klein|activewear styling/i);
  assert.doesNotMatch(bohemianTop.en, /loose untucked hem/i);
  assert.doesNotMatch(lowRiseJeans.en, /exposed waist styling/i);
  assert.doesNotMatch(bikiniBottom.en, /exposed hip line|clean beachwear silhouette/i);
  assert.doesNotMatch(bohemianPants.en, /earthy layered tones|resort mood/i);
  assert.doesNotMatch(bareFeet.en, /visible toes|relaxed barefoot styling/i);
  assert.doesNotMatch(leatherChoker.en, /not a wide belt-like collar/i);
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

test('outerwear styling appears after the outerwear garment while avoiding legacy normal-wear wording', () => {
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
  assert.match(grokWardrobeLine, /dark grey denim jacket, washed denim texture, chest pockets, metal buttons, casual structured outerwear[\s\S]*layered over[\s\S]*off-white longline shirt/);
  assert.match(grokWardrobeLine, /outerwear worn normally on both shoulders/);
  assert.doesNotMatch(grokWardrobeLine, /She wears properly worn on both shoulders, dark grey denim jacket/);
  assert.doesNotMatch(grokWardrobeLine, /realistic outer-to-inner dressing order/);
  assert.doesNotMatch(grokWardrobeLine, /outerwear remains a coherent outer layer|inner garment appears at natural openings/);
  assert.match(prompt.zImagePrompt, /dark grey denim jacket[\s\S]*layered over[\s\S]*off-white longline shirt/);
  assert.doesNotMatch(prompt.zImagePrompt, /properly worn on both shoulders|paired with off-white longline shirt/);
});

test('outerwear opening and styling prompts use positive flexible wording', () => {
  const openOuterwear = optionByLabel('outerwearOpeningId', '敞開穿');
  const normalOuterwear = optionByLabel('outerwearStylingId', '正常穿著');
  const slippedOuterwear = optionByLabel('outerwearStylingId', '滑落肩部');

  assert.match(openOuterwear.en, /front panels parted naturally/);
  assert.doesNotMatch(openOuterwear.en, /inner layer visible through the full front opening/i);
  assert.match(normalOuterwear.en, /standard outer-layer position/);
  assert.doesNotMatch(normalOuterwear.en, /properly worn|shoulder line fully covered/i);
  assert.match(slippedOuterwear.en, /slipped below the shoulder line/);
  assert.doesNotMatch(slippedOuterwear.en, /intentionally|one or both shoulders/i);
});

test('outerwear garment and pattern prompts avoid redundant structure and jacket-specific wording', () => {
  const techwearTrench = optionByLabel('outerwearId', '賽博反光科技風衣');
  const boldHorizontalStripe = optionByLabel('outerwearPatternId', '粗橫條紋');

  assert.match(techwearTrench.en, /iridescent reflective techwear trench coat/);
  assert.match(techwearTrench.en, /waterproof shell texture/);
  assert.doesNotMatch(techwearTrench.en, /futuristic long outerwear structure/i);
  assert.match(boldHorizontalStripe.en, /bold horizontal stripes across the outerwear/i);
  assert.doesNotMatch(boldHorizontalStripe.en, /bold horizontal stripe outerwear|stripe bands across the jacket/i);
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
  assert.match(grokWardrobeLine, /slipped below the shoulder line, sleeves loosely on the arms, jacket body still readable as an outer layer/);
  assert.doesNotMatch(grokWardrobeLine, /jacket body hanging as an intact outer layer/);
  assert.ok(
    grokWardrobeLine.indexOf('underbust-cropped oversized outerwear') < grokWardrobeLine.indexOf('denim jacket'),
    'outerwear fit should appear before the outerwear item'
  );
  assert.ok(
    grokWardrobeLine.indexOf('denim jacket') < grokWardrobeLine.indexOf('bold horizontal stripes across the outerwear'),
    'outerwear item should appear before outerwear pattern'
  );
  assert.ok(
    grokWardrobeLine.indexOf('bold horizontal stripes across the outerwear') < grokWardrobeLine.indexOf('worn open at the front'),
    'outerwear opening should appear after outerwear pattern'
  );
  assert.ok(
    grokWardrobeLine.indexOf('worn open at the front') < grokWardrobeLine.indexOf('slipped below the shoulder line'),
    'outerwear opening should appear before shoulder styling'
  );
  assert.match(prompt.zImagePrompt, /slipped below the shoulder line/);
  assert.match(prompt.zImagePrompt, /sleeves loosely on the arms/);
  assert.doesNotMatch(prompt.zImagePrompt, /jacket body still readable as an outer layer/);
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

test('new earring and dog-tag options remain traceable in single-subject outputs', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    earringsId: optionId('earringsId', '中型光滑金屬圈耳環'),
    neckAccessoryId: optionId('neckAccessoryId', '金屬狗牌項鍊'),
  });

  assert.match(prompt.grokPrompt, /medium smooth hoop earrings.*metal dog tag necklace/i);
  assert.match(prompt.zImagePrompt, /medium smooth hoop earrings.*metal dog tag necklace/i);
  assert.ok(prompt.structured.Wardrobe.some((item) => item.zh === '中型光滑金屬圈耳環'));
  assert.ok(prompt.structured.Wardrobe.some((item) => item.zh === '金屬狗牌項鍊'));
});

test('waist accessory options remain traceable in full-body outputs', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    topId: optionId('topId', '棉質細肩背心'),
    pantsId: optionId('pantsId', '直筒牛仔褲'),
    waistAccessoryId: optionId('waistAccessoryId', '雙層銀鏈水晶腰鍊'),
  });

  assert.match(prompt.grokPrompt, /two-layer silver waist chain, two delicate fine-link strands at slightly different heights/i);
  assert.match(prompt.zImagePrompt, /two-layer silver waist chain, two delicate fine-link strands at slightly different heights/i);
  assert.ok(prompt.structured.Wardrobe.some((item) => item.zh === '雙層銀鏈水晶腰鍊'));
  assert.equal(prompt.selection.waistAccessoryId, optionId('waistAccessoryId', '雙層銀鏈水晶腰鍊'));
});

test('duo waist accessories remain assigned to the selected person in compact output', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '2',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    topAId: optionId('topAId', '棉質細肩背心'),
    topBId: optionId('topBId', '襯衫'),
    pantsAId: optionId('pantsAId', '直筒牛仔褲'),
    pantsBId: optionId('pantsBId', '絲絨喇叭褲'),
    waistAccessoryAId: optionId('waistAccessoryAId', '細版皮革腰帶'),
    waistAccessoryBId: optionId('waistAccessoryBId', '銀色水鑽蝴蝶腰鏈'),
  });

  assert.match(prompt.midjourneyPrompt, /slim leather waist belt, simple buckle, understated waist accessory/i);
  assert.match(prompt.midjourneyPrompt, /silver rhinestone butterfly waist chain, sparkling butterfly centerpiece/i);
  assert.equal(prompt.selection.waistAccessoryAId, optionId('waistAccessoryAId', '細版皮革腰帶'));
  assert.equal(prompt.selection.waistAccessoryBId, optionId('waistAccessoryBId', '銀色水鑽蝴蝶腰鏈'));
});

test('street gold necklace stays short and spatially anchored at the neck across applicable single outputs', () => {
  const allNoneLocks = { ...createEmptyLocks() };
  for (const control of getLockControls()) {
    const noneOption = control.options?.find((option) => option.zh === '全無' || option.zh === '無額外表情');
    if (noneOption) allNoneLocks[control.key] = noneOption.id;
  }

  const [prompt] = generatePrompts(1, {
    ...allNoneLocks,
    subjectCount: '1',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    topId: optionId('topId', '棉質細肩背心'),
    pantsId: optionId('pantsId', '直筒牛仔褲'),
    neckAccessoryId: optionId('neckAccessoryId', '街頭風格金項鏈'),
    locationId: optionId('locationId', '室內：深邃黑幕'),
  }, [], { random: () => 0.42 });
  const extraById = new Map(prompt.extraPrompts.map((entry) => [entry.id, entry.text]));
  const applicableOutputs = [
    prompt.grokPrompt,
    prompt.zImagePrompt,
    extraById.get('chest-up-portrait'),
    extraById.get('full-body-character'),
  ];
  const omittedByCompactContract = [
    prompt.midjourneyPrompt,
    extraById.get('chest-up-mj-portrait'),
  ];
  const expected = /short gold curb-link necklace worn around the base of the neck at collarbone level/i;
  const retired = /street-style gold chain detail, subtle urban neck accent/i;

  for (const output of applicableOutputs) {
    assert.match(output, expected);
    assert.doesNotMatch(output, retired);
  }
  for (const output of omittedByCompactContract) {
    assert.doesNotMatch(output, retired);
  }
  assert.equal(prompt.selection.neckAccessoryId, optionId('neckAccessoryId', '街頭風格金項鏈'));
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
  assert.match(subjectLine, /Woman 1:\nHas .*with .*black frame.*bold thick-frame glasses.*metallic earrings?.*short gold curb-link necklace worn around the base of the neck at collarbone level/i);
  assert.match(subjectLine, /Woman 2:\nHas .*with .*black frame.*sunglasses.*cross.*earrings?.*leather buckle choker/i);
  assert.doesNotMatch(prompt.grokPrompt, /^Woman 1 Eyewear:/m);
  assert.doesNotMatch(prompt.grokPrompt, /^Woman 1 Earrings:/m);
  assert.doesNotMatch(prompt.grokPrompt, /^Woman 1 Neck Accessory:/m);
  assert.doesNotMatch(prompt.grokPrompt, /^Woman 2 Eyewear:/m);
  assert.doesNotMatch(prompt.grokPrompt, /^Woman 2 Earrings:/m);
  assert.doesNotMatch(prompt.grokPrompt, /^Woman 2 Neck Accessory:/m);

  assert.match(prompt.zImagePrompt, /Woman 1 has [\s\S]+\bShe wears .*black frame.*bold thick-frame glasses.*metallic earrings?.*short gold curb-link necklace worn around the base of the neck at collarbone level/i);
  assert.match(prompt.zImagePrompt, /Woman 2 has [\s\S]+\bShe wears .*black frame.*sunglasses.*cross.*earrings?.*leather buckle choker/i);
});

test('duo random separates avoid duplicated top color styling', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '2',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    topAId: optionId('topAId', '棉質細肩背心'),
    topBId: optionId('topBId', '襯衫'),
    pantsAId: optionId('pantsAId', '直筒牛仔褲'),
    pantsBId: optionId('pantsBId', '絲絨喇叭褲'),
  }, [], { random: () => 0 });

  assert.ok(prompt.selection.topAColorId);
  assert.ok(prompt.selection.topBColorId);
  assert.notEqual(prompt.selection.topAColorId, prompt.selection.topBColorId);

  const promptText = [prompt.grokPrompt, prompt.zImagePrompt].join('\n');
  assert.match(promptText, /Woman 1:\n(?:Has [\s\S]*?\. )?Wears black cotton camisole top/i);
  assert.match(promptText, /Woman 2:\n(?:Has [\s\S]*?\. )?Wears white shirt/i);
  assert.doesNotMatch(promptText, /coordinated but clearly distinct outfits|avoid identical garment colors|avoid matching top colors/i);
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
  assert.ok(optionLabels.includes('紫橘籃球球衣球鞋造型'));
  assert.ok(optionLabels.includes('白色馬甲黑色七分褲金飾造型'));
  assert.ok(optionLabels.includes('紅色亮面膠帶束帶造型'));
  assert.equal(optionLabels.filter((label) => !['全無', '隨機'].includes(label)).length, 90);
  assert.ok(!optionLabels.includes('拼布絨呢外套塗鴉奶白工裝褲'));
  assert.ok(!optionLabels.includes('黑色鉚釘兜帽皮革迷你裙造型'));
});

test('final prompts omit long-top over short-bottom guard wording', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    topId: optionId('topId', '長版寬鬆麻花針織毛衣'),
    pantsId: optionId('pantsId', '超短運動短褲'),
  });

  const promptText = [prompt.grokPrompt, prompt.zImagePrompt].join('\n');

  assert.match(promptText, /oversized cable-knit sweater/);
  assert.match(promptText, /micro athletic shorts/);
  assert.doesNotMatch(promptText, /long top falls over the waistband|shorts partly visible below the hem|do not tuck the long top into the shorts/);
});

test('final prompts omit outerwear over strappy dress guard wording', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    outerwearId: optionId('outerwearId', '西裝外套'),
    dressId: optionId('dressId', '連身：短版｜細肩帶迷你洋裝'),
  });

  const promptText = [prompt.grokPrompt, prompt.zImagePrompt].join('\n');

  assert.match(promptText, /blazer/);
  assert.match(promptText, /spaghetti-strap mini dress/);
  assert.doesNotMatch(promptText, /outerwear remains a coherent outer layer|inner garment appears at natural openings|thin straps read as the inner dress|outerwear keeps its own shoulder construction|do not turn the outerwear into slipped straps/);
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

test('adhesive tape look is a composable outfit preset while the original special outfit remains intact', () => {
  const preset = optionByLabel('outfitPresetId', '套裝：亮面膠帶束帶');
  const special = optionByLabel('specialOutfitId', '紅色亮面膠帶束帶造型');
  assert.match(preset.en, /body-wrapping construction/);
  assert.match(preset.en, /separate independent groups of wide glossy tape strips adhered directly to the skin/);
  assert.match(preset.en, /safety-yellow tape surfaces/);
  assert.match(preset.en, /bold black uppercase CAUTION lettering/);
  assert.match(preset.en, /solid black rectangular warning blocks/);
  assert.match(preset.en, /independent chest and ribcage wrap bands/);
  assert.match(preset.en, /independent hip and pelvis wrap bands/);
  assert.match(preset.en, /compressed skin with soft flesh bulges and slight spillover/);
  assert.doesNotMatch(preset.en, /halter|bralette|high-cut|tape bottoms/i);
  assert.doesNotMatch(preset.en, /controlled by the outfit color selection/i);
  assert.equal(preset.meta?.embeddedOuterwear, undefined);

  const composableLocks = {
    ...createEmptyLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    outfitPresetId: preset.id,
    outfitPresetPrimaryColorId: optionId('outfitPresetPrimaryColorId', '紅色'),
    outerwearId: optionId('outerwearId', '長版外套'),
    outerwearOpeningId: optionId('outerwearOpeningId', '敞開穿'),
    legwearId: optionId('legwearId', '泡泡襪'),
    shoesId: optionId('shoesId', '戰鬥靴'),
    headAccessoryId: optionId('headAccessoryId', '棒球帽'),
    eyewearId: optionId('eyewearId', '矩形眼鏡'),
    earringsId: optionId('earringsId', '小型金屬耳環'),
    neckAccessoryId: optionId('neckAccessoryId', '細領帶'),
  };
  const [defaultPrompt] = generatePrompts(1, {
    ...composableLocks,
    outfitPresetPrimaryColorId: optionId('outfitPresetPrimaryColorId', '全無'),
  });
  const defaultChestUpPrompt = defaultPrompt.extraPrompts.find((entry) => entry.id === 'chest-up-portrait')?.text || '';
  const defaultChestUpMjPrompt = defaultPrompt.extraPrompts.find((entry) => entry.id === 'chest-up-mj-portrait')?.text || '';
  const defaultFullBodyPrompt = defaultPrompt.extraPrompts.find((entry) => entry.id === 'full-body-character')?.text || '';
  for (const text of [
    defaultPrompt.grokPrompt,
    defaultPrompt.zImagePrompt,
    defaultPrompt.midjourneyPrompt,
    defaultChestUpPrompt,
    defaultChestUpMjPrompt,
    defaultFullBodyPrompt,
  ]) {
    assert.match(text, /safety-yellow/i);
    assert.match(text, /CAUTION/);
    assert.match(text, /solid black rectangular warning blocks/i);
  }
  assert.doesNotMatch(defaultFullBodyPrompt, /no visible text/i);

  const [presetPrompt] = generatePrompts(1, composableLocks);
  const wardrobeLabels = presetPrompt.structured.Wardrobe.map((item) => item.zh);

  assert.equal(presetPrompt.selection.specialOutfitId, '');
  assert.equal(presetPrompt.selection.outfitPresetId, preset.id);
  for (const label of ['套裝：亮面膠帶束帶', '長版外套', '泡泡襪', '戰鬥靴', '棒球帽', '矩形眼鏡', '小型金屬耳環', '細領帶']) {
    assert.ok(wardrobeLabels.includes(label), `Expected composable wardrobe item ${label}`);
  }
  assert.match(presetPrompt.grokPrompt, /body-wrapping construction/);
  assert.match(presetPrompt.grokPrompt, /independent chest and ribcage wrap bands/);
  assert.match(presetPrompt.grokPrompt, /localized waist and abdomen bands/);
  assert.match(presetPrompt.grokPrompt, /independent hip and pelvis wrap bands with overlapping center-front and rear coverage/);
  assert.match(presetPrompt.grokPrompt, /compressed skin with soft flesh bulges and slight spillover along the tape edges/);
  assert.match(presetPrompt.grokPrompt, /glossy tape surfaces in red/);
  assert.doesNotMatch(presetPrompt.grokPrompt, /halter|bralette|high-cut|tape bottoms/i);
  assert.match(presetPrompt.zImagePrompt, /independent chest and ribcage wrap bands/);
  assert.match(presetPrompt.zImagePrompt, /compressed skin with soft flesh bulges/i);
  assert.doesNotMatch(presetPrompt.zImagePrompt, /halter|bralette|high-cut|tape bottoms/i);
  assert.match(presetPrompt.midjourneyPrompt, /glossy adhesive tape wrapped directly around the skin/i);
  assert.match(presetPrompt.midjourneyPrompt, /independent chest and ribcage wrap bands/i);
  assert.match(presetPrompt.midjourneyPrompt, /compressed skin with soft flesh bulges/i);
  assert.doesNotMatch(presetPrompt.midjourneyPrompt, /halter|bralette|high-cut|tape bottoms/i);
  const chestUpPrompt = presetPrompt.extraPrompts.find((entry) => entry.id === 'chest-up-portrait')?.text || '';
  const chestUpMjPrompt = presetPrompt.extraPrompts.find((entry) => entry.id === 'chest-up-mj-portrait')?.text || '';
  const fullBodyPrompt = presetPrompt.extraPrompts.find((entry) => entry.id === 'full-body-character')?.text || '';
  for (const text of [chestUpPrompt, chestUpMjPrompt]) {
    assert.match(text, /independent chest and ribcage wrap bands/i);
    assert.match(text, /bare-shoulder|bare shoulders/i);
    assert.doesNotMatch(text, /hip and pelvis|thigh wrap|halter|bralette|high-cut|tape bottoms/i);
  }
  assert.match(fullBodyPrompt, /independent hip and pelvis wrap bands/i);
  assert.match(fullBodyPrompt, /separate thigh wrap bands/i);
  assert.match(fullBodyPrompt, /compressed skin with soft flesh bulges/i);
  assert.match(fullBodyPrompt, /no visible text/i);
  for (const text of [
    presetPrompt.grokPrompt,
    presetPrompt.zImagePrompt,
    presetPrompt.midjourneyPrompt,
    chestUpPrompt,
    chestUpMjPrompt,
    fullBodyPrompt,
  ]) {
    assert.doesNotMatch(text, /safety-yellow|CAUTION|solid black rectangular warning blocks/i);
  }
  assert.doesNotMatch(presetPrompt.grokPrompt, /complete outfit:/i);

  const [randomColorPrompt] = generatePrompts(1, {
    ...composableLocks,
    outfitPresetPrimaryColorId: '',
  }, [], { random: () => 0 });
  assert.equal(randomColorPrompt.selection.outfitPresetPrimaryColorId, 'black');
  for (const text of [
    randomColorPrompt.grokPrompt,
    randomColorPrompt.zImagePrompt,
    randomColorPrompt.midjourneyPrompt,
  ]) {
    assert.match(text, /black glossy adhesive tape|glossy tape surfaces in black/i);
    assert.doesNotMatch(text, /safety-yellow|CAUTION|solid black rectangular warning blocks/i);
  }

  const [specialPrompt] = generatePrompts(1, {
    ...composableLocks,
    outfitPresetId: optionId('outfitPresetId', '全無'),
    outfitPresetPrimaryColorId: '',
    specialOutfitId: special.id,
  });
  assert.equal(specialPrompt.selection.specialOutfitId, special.id);
  assert.equal(specialPrompt.selection.outfitPresetId, '');
  assert.match(special.en, /halter bralette/);
  assert.match(special.en, /high-cut tape bottom/);
  assert.match(specialPrompt.grokPrompt, /glossy adhesive tape body-wrap look/);
  assert.doesNotMatch(specialPrompt.grokPrompt, /baseball cap|long coat|combat boots/i);
});

test('random complete-look controls resolve to concrete wardrobe selections', () => {
  const fullBodyFramingId = optionId('framingId', '全身鏡頭 (Full Body Shot)');
  const noneOutfitPresetId = optionId('outfitPresetId', '全無');
  const noneDressId = optionId('dressId', '全無');
  const random = () => 0;

  const [specialPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: fullBodyFramingId,
    specialOutfitId: 'random',
  }, [], { random });
  assert.ok(specialPrompt.selection.specialOutfitId);
  assert.notEqual(specialPrompt.selection.specialOutfitId, 'random');
  assert.doesNotMatch(specialPrompt.grokPrompt, /random special outfit/i);

  const [outfitPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: fullBodyFramingId,
    outfitPresetId: 'random',
    dressId: noneDressId,
  }, [], { random });
  assert.ok(outfitPrompt.selection.outfitPresetId);
  assert.notEqual(outfitPrompt.selection.outfitPresetId, 'random');
  assert.doesNotMatch(outfitPrompt.grokPrompt, /random outfit preset/i);

  const [dressPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: fullBodyFramingId,
    outfitPresetId: noneOutfitPresetId,
    dressId: 'random',
  }, [], { random });
  assert.ok(dressPrompt.selection.dressId);
  assert.notEqual(dressPrompt.selection.dressId, 'random');
  assert.doesNotMatch(dressPrompt.grokPrompt, /random dress/i);
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
  assert.match(promptText, /lower hem or skirt (?:accent|area)/);
});

test('final prompts omit legwear under long-bottom guard wording', () => {
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

  assert.match(pantsText, /straight-leg jeans/);
  assert.match(skirtText, /maxi skirt|long skirt/);
  assert.doesNotMatch(pantsText, /legwear stays secondary|do not force full socks or stockings to be completely displayed/);
  assert.doesNotMatch(skirtText, /legwear stays secondary|long bottom keeps its natural drape|do not force full socks or stockings to be completely displayed/);
});

test('face close-up framing disables hidden controls without deleting their selections', () => {
  const controls = getLockControls();
  const faceCloseupId = optionId('framingId', '臉部特寫');
  const locks = {
    ...createEmptyLocks(),
    framingId: faceCloseupId,
    locationId: optionId('locationId', '室內：現代高樓公寓客廳'),
    topId: optionId('topId', '透膚刺繡襯衫'),
    pantsId: optionId('pantsId', '直筒牛仔褲'),
    shoesId: optionId('shoesId', '高跟鞋'),
    waistAccessoryId: optionId('waistAccessoryId', '銀色水鑽蝴蝶腰鏈'),
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
  assert.equal(allowedKeys.has('poseId'), false);
  assert.equal(allowedKeys.has('specialActionId'), false);
  assert.equal(allowedKeys.has('poseBaseId'), true);
  assert.equal(allowedKeys.has('poseArrangementId'), true);
  assert.equal(allowedKeys.has('poseHandId'), true);
  assert.equal(allowedKeys.has('poseHeadId'), true);

  const sanitized = sanitizeLocksForCloseupMode(locks, controls);
  assert.equal(sanitized.framingId, locks.framingId);
  assert.equal(sanitized.locationId, locks.locationId);
  assert.equal(sanitized.topId, locks.topId);
  assert.equal(sanitized.pantsId, locks.pantsId);
  assert.equal(sanitized.shoesId, locks.shoesId);
  assert.equal(sanitized.poseBaseId, locks.poseBaseId);
  assert.equal(sanitized.poseArrangementId, optionId('poseArrangementId', '微微前傾'));
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
    waistAccessoryId: optionId('waistAccessoryId', '銀色水鑽蝴蝶腰鏈'),
  });

  assert.equal(prompt.selection.framingId, optionId('framingId', '臉部特寫'));
  assert.equal(prompt.selection.locationId, optionId('locationId', '室內：現代高樓公寓客廳'));
  assert.equal(prompt.selection.topId, optionId('topId', '透膚刺繡襯衫'));
  assert.equal(prompt.selection.pantsId, optionId('pantsId', '直筒牛仔褲'));
  assert.equal(prompt.selection.shoesId, optionId('shoesId', '高跟鞋'));
  assert.equal(prompt.selection.waistAccessoryId, optionId('waistAccessoryId', '銀色水鑽蝴蝶腰鏈'));

  assert.match(prompt.grokPrompt, /Tight face close-up/);
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
  assert.doesNotMatch(prompt.grokPrompt, /silver rhinestone butterfly waist chain/i);
  assert.doesNotMatch(prompt.zImagePrompt, /silver rhinestone butterfly waist chain/i);

  const fullBodyPrompt = prompt.extraPrompts.find((entry) => entry.id === 'full-body-character')?.text || '';
  assert.match(fullBodyPrompt, /semi-sheer embroidered shirt/i);
  assert.match(fullBodyPrompt, /straight-leg jeans/i);
  assert.match(fullBodyPrompt, /glossy pointed-toe stiletto pumps/i);
  assert.match(fullBodyPrompt, /silver rhinestone butterfly waist chain/i);
});

test('chest-up framing keeps visible outfit-preset prompt active while removing bags', () => {
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
  assert.doesNotMatch(prompt.grokPrompt, /kinchaku pouch/i);
  assert.doesNotMatch(prompt.grokPrompt, /show lightweight yukata outfit only through/i);
  assert.doesNotMatch(prompt.grokPrompt, /only through nearby surfaces/i);
  assert.match(prompt.zImagePrompt, /lightweight yukata outfit/i);
  assert.match(prompt.zImagePrompt, /ankle-length straight fall/i);
  assert.match(prompt.zImagePrompt, /wide obi/i);
  assert.doesNotMatch(prompt.zImagePrompt, /kinchaku pouch/i);
  assert.doesNotMatch(prompt.zImagePrompt, /show lightweight yukata outfit only through/i);
});

test('close-up framing keeps direct wardrobe prompt details available', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '特寫鏡頭 (Close-Up)'),
    topId: optionId('topId', '透膚刺繡襯衫'),
  });

  assert.equal(prompt.selection.framingId, optionId('framingId', '特寫鏡頭 (Close-Up)'));
  assert.match(prompt.grokPrompt, /Head-and-shoulders portrait/i);
  assert.match(prompt.grokPrompt, /semi-sheer embroidered shirt/i);
  assert.doesNotMatch(prompt.grokPrompt, /Wardrobe Visibility:/);
  assert.match(prompt.zImagePrompt, /semi-sheer embroidered shirt/i);
});

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
    const noneOption = control.options?.find((entry) => entry.zh === '全無');
    if (noneOption) locks[control.key] = noneOption.id;
  });
  return locks;
}

function zImageParagraphs(prompt) {
  return prompt.zImagePrompt
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function assertNaturalZImageParagraphs(prompt, caseName, minParagraphs = 4) {
  const paragraphs = zImageParagraphs(prompt);

  assert.match(prompt.zImagePrompt, /\n\n/, `${caseName} should use blank-line paragraph breaks`);
  assert.ok(paragraphs.length >= minParagraphs, `${caseName} should have at least ${minParagraphs} paragraphs`);
  assert.doesNotMatch(
    prompt.zImagePrompt,
    /^(?:Image Type|Scene|Subject|Wardrobe|Pose and Composition|Lighting|Camera Look|Constraints):/m,
    `${caseName} should not use GPT-style section labels`
  );
  assert.doesNotMatch(prompt.zImagePrompt, /multi-cut sequence n=2/, `${caseName} should not include Gpt multi-cut tail`);

  for (const paragraph of paragraphs) {
    assert.match(paragraph, /[.!?]$/, `${caseName} paragraph should end with sentence punctuation: ${paragraph}`);
  }
}

function gptSection(prompt, label) {
  return prompt.grokPrompt.match(new RegExp(`${label}:\\n([\\s\\S]*?)(?:\\n\\n|$)`))?.[1] || '';
}

test('Gpt prompt uses natural structured sections for GPT Image', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
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
  assert.doesNotMatch(prompt.grokPrompt, /\nConstraints:\n/);
  assert.doesNotMatch(prompt.grokPrompt, /preserve the selected wardrobe as complete, realistic clothing/i);
  assert.doesNotMatch(prompt.grokPrompt, /Keep the specified outfit visible where the chosen framing allows/i);
  assert.doesNotMatch(prompt.grokPrompt, /natural body proportions|no extra people unless specified|no visible text or logos/i);
  assert.doesNotMatch(prompt.grokPrompt, /no nudity|fully clothed|clothing covers the body/i);
  assert.match(prompt.grokPrompt, /\n\nmulti-cut sequence n=2$/);
  assert.doesNotMatch(prompt.grokPrompt, /^Subject Count:/m);
});

test('Gpt duo prompt separates subject identity from role-ordered wardrobe', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '2',
    locationId: optionId('locationId', '室內：現代高樓公寓客廳'),
    outfitPresetAId: optionId('outfitPresetAId', '套裝：鏈條緞面內衣'),
    outfitPresetBId: optionId('outfitPresetBId', '套裝：BDSM 束縛'),
    eyewearBId: optionId('eyewearBId', '細框眼鏡'),
    duoExpressionId: optionId('duoExpressionId', '曖昧對視｜性感張力'),
    duoPoseId: optionId('duoPoseId', '性感互動'),
  });

  const subject = gptSection(prompt, 'Subject');
  const wardrobe = gptSection(prompt, 'Wardrobe');
  const scene = gptSection(prompt, 'Scene');

  assert.match(subject, /^The subjects are two 20-year-old Japanese or Korean female portrait subjects\./);
  assert.match(subject, /Woman 1:/);
  assert.match(subject, /Woman 2:/);
  assert.match(subject, /Shared expression:/);
  assert.ok(subject.indexOf('Woman 1:') < subject.indexOf('Woman 2:'));
  assert.ok(subject.indexOf('Woman 2:') < subject.indexOf('Shared expression:'));
  assert.match(subject, /woman 2 with .*thin-frame glasses/i);
  assert.doesNotMatch(subject, /woman 1 wears|woman 2 wears|BDSM-inspired leather harness outfit|satin lingerie set/i);
  assert.doesNotMatch(subject, /modern high-rise apartment living room/i);

  assert.match(wardrobe, /^Woman 1 wears /);
  assert.match(wardrobe, /Woman 2 wears /);
  assert.ok(wardrobe.indexOf('Woman 1 wears') < wardrobe.indexOf('Woman 2 wears'));
  assert.match(wardrobe, /satin lingerie set/i);
  assert.match(wardrobe, /BDSM-inspired leather harness outfit/i);
  assert.doesNotMatch(wardrobe, /coordinated but clearly distinct outfits|avoid identical garment colors|avoid matching top colors|keep each woman styling visually separate/i);
  assert.doesNotMatch(wardrobe, /distinct outfit-visible editorial|complete wardrobe visible on both women|visible torso and wardrobe details|no headshot-only crop/i);
  assert.doesNotMatch(wardrobe, /modern high-rise apartment living room/i);

  assert.match(scene, /modern high-rise apartment living room/i);
  assert.doesNotMatch(scene, /Woman 1 wears|Woman 2 wears/i);
  assert.match(prompt.grokPrompt, /\n\nmulti-cut sequence n=2$/);
});

test('Gpt duo wardrobe removes color-control metadata and punctuates role sentences', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '2',
    outfitPresetAId: optionId('outfitPresetAId', '套裝：豹紋蕾絲抹胸喇叭牛仔'),
    outfitPresetAColorId: optionId('outfitPresetAColorId', '金色'),
    outfitPresetBId: optionId('outfitPresetBId', '套裝：網紗掛脖背心牛仔迷你裙'),
    outfitPresetBColorId: optionId('outfitPresetBColorId', '深棕色'),
  });

  const wardrobe = gptSection(prompt, 'Wardrobe');

  assert.match(wardrobe, /^Woman 1 wears gold leopard-pattern strapless corset top, lace bust cups, long front ribbon ties, low-rise flared jeans, platform sandals\./);
  assert.match(wardrobe, /Woman 2 wears dark brown sheer mesh halter camisole, visible lace bra layer, denim micro mini skirt, stacked waist jewelry, platform sandals\./);
  assert.doesNotMatch(wardrobe, /controlled by .*color selection|dominant .*color|main .*color|contrast .*controlled/i);
  assert.doesNotMatch(wardrobe, /coordinated but clearly distinct outfits|avoid identical garment colors|avoid matching top colors|keep each woman styling visually separate/i);
  assert.doesNotMatch(wardrobe, /distinct outfit-visible editorial|complete wardrobe visible on both women|visible torso and wardrobe details|no headshot-only crop/i);
});

test('Grok/Z-Image prompt remains natural language with blank-line paragraphs and AI uses a legacy minimal paragraph', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
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
  assertNaturalZImageParagraphs(prompt, 'outfit preset z-image prompt');
  assert.doesNotMatch(prompt.zImagePrompt, /^Subject Count:/m);
  assert.doesNotMatch(prompt.zImagePrompt, /multi-cut sequence n=2/);
  assert.doesNotMatch(prompt.midjourneyPrompt, /^(Image Type|Scene|Subject|Wardrobe):/m);
  assert.doesNotMatch(prompt.midjourneyPrompt, /multi-cut sequence n=2/);
  assert.match(prompt.midjourneyPrompt, /^A seductive stunning 20-year-old Japanese or Korean woman/);
  assert.match(prompt.midjourneyPrompt, /deep black color field/);
  assert.match(prompt.midjourneyPrompt, /wearing a flight attendant uniform/);
  assert.match(prompt.midjourneyPrompt, /standing pose with loosely crossed arms/);
  assert.match(prompt.midjourneyPrompt, /captured (?:in film photography style|as a moody film still|as an editorial film still)/);
  assert.doesNotMatch(prompt.midjourneyPrompt, /\b(Lighting|Camera look|Pose and composition|Keep):/i);
  assert.ok(prompt.midjourneyPrompt.length < prompt.zImagePrompt.length);
});

test('Grok/Z-Image prompt keeps natural paragraphs across major selection modes', () => {
  const cases = [
    {
      name: 'character profile card',
      locks: {
        ...createEmptyLocks(),
        characterProfileId: 'character-yuri',
        locationId: optionId('locationId', '室內：英倫復古窗邊房間'),
      },
      expected: [
        /The image shows a 20-year-old adult East Asian woman/i,
        /signature outfit locked as a white ribbed off-shoulder cropped long-sleeve top/i,
        /The setting is/i,
      ],
      minParagraphs: 4,
    },
    {
      name: 'fixed composition special setup',
      locks: {
        ...createEmptyLocks(),
        fixedCompositionSetId: optionId('fixedCompositionSetId', '清水模牆面沙發棚'),
        fixedSetPositionId: optionId('fixedSetPositionId', '自由場景互動'),
        fixedSetCaptureModeId: optionId('fixedSetCaptureModeId', '自然自拍感'),
        fixedSetPerformanceStateId: optionId('fixedSetPerformanceStateId', '慵懶無力感'),
        angleId: optionId('angleId', '肩部高度鏡頭'),
        orbitId: optionId('orbitId', '右前 315 度'),
      },
      expected: [
        /real-scale compact living-room editorial set/i,
        /large brown vintage Chesterfield leather sofa/i,
        /self-shot social composition feeling/i,
        /lazy drained presence/i,
        /fixed-set rule: stable selected room architecture/i,
      ],
      minParagraphs: 5,
    },
    {
      name: 'general scene with separate wardrobe basics',
      locks: {
        ...createEmptyLocks(),
        outfitPresetId: optionId('outfitPresetId', '全無'),
        dressId: optionId('dressId', '全無'),
        topId: optionId('topId', '比基尼上身'),
        pantsId: optionId('pantsId', '牛仔短褲'),
        skirtId: optionId('skirtId', '全無'),
        outerwearId: optionId('outerwearId', '全無'),
        locationId: optionId('locationId', '室內：九龍城寨內部狹窄走道'),
        poseId: optionId('poseId', '站姿｜雙臂交疊'),
      },
      expected: [
        /triangle bikini top/i,
        /denim shorts/i,
        /Kowloon Walled City interior passage/i,
        /standing pose with loosely crossed arms/i,
      ],
      minParagraphs: 5,
    },
    {
      name: 'dress control',
      locks: {
        ...createEmptyLocks(),
        dressId: optionId('dressId', '連身：短版｜亮面乳膠迷你洋裝'),
        topId: optionId('topId', '全無'),
        pantsId: optionId('pantsId', '全無'),
        skirtId: optionId('skirtId', '全無'),
        outerwearId: optionId('outerwearId', '全無'),
        framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
      },
      expected: [
        /glossy latex mini dress/i,
        /one-piece bodycon silhouette/i,
      ],
      minParagraphs: 5,
    },
    {
      name: 'special outfit priority',
      locks: {
        ...createEmptyLocks(),
        specialOutfitId: optionId('specialOutfitId', '黑色哥德蕾絲短袖熱褲長靴造型'),
        framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
      },
      expected: [
        /She wears complete special outfit: black gothic Y2K lace punk look/i,
        /distressed black denim micro shorts/i,
        /black slouchy knee-high leather boots/i,
      ],
      minParagraphs: 5,
    },
    {
      name: 'special action setup',
      locks: {
        ...createEmptyLocks(),
        specialActionId: optionId('specialActionId', '塗口紅'),
        framingId: optionId('framingId', '中景鏡頭 (Medium Shot)'),
      },
      expected: [
        /applying lipstick with the lipstick bullet pressed to the lips/i,
        /visible hand-to-mouth contact/i,
      ],
      minParagraphs: 4,
    },
  ];

  for (const promptCase of cases) {
    const [prompt] = generatePrompts(1, promptCase.locks);
    assertNaturalZImageParagraphs(prompt, promptCase.name, promptCase.minParagraphs);

    for (const pattern of promptCase.expected) {
      assert.match(prompt.zImagePrompt, pattern, `${promptCase.name} should preserve ${pattern}`);
    }
  }
});

test('AI prompt uses a legacy minimal natural paragraph with wardrobe, pose, scene, and mood tail', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '2',
    locationId: optionId('locationId', '室內：九龍城寨內部狹窄走道'),
    outfitPresetAId: optionId('outfitPresetAId', '套裝：BDSM 束縛'),
    outfitPresetBId: optionId('outfitPresetBId', '套裝：泳裝度假'),
    duoPoseId: optionId('duoPoseId', '性感互動'),
    styleId: optionId('styleId', '南・戈爾丁｜私人相簿粗粒子'),
    filmId: optionId('filmId', 'VHS 錄影帶低畫質'),
    opticalEffectId: optionId('opticalEffectId', '漏光效果 Light Leaks'),
  });

  assert.doesNotMatch(prompt.midjourneyPrompt, /^(Image Type|Scene|Subject|Wardrobe):/m);
  assert.doesNotMatch(prompt.midjourneyPrompt, /\b(Lighting|Camera look|Pose and composition|Keep):/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /multi-cut sequence n=2/);
  assert.match(prompt.midjourneyPrompt, /^Two seductive stunning 20-year-old Japanese or Korean women\b/);
  assert.match(prompt.midjourneyPrompt, /BDSM-inspired leather harness outfit/i);
  assert.match(prompt.midjourneyPrompt, /bikini swimwear/i);
  assert.match(prompt.midjourneyPrompt, /intertwined silhouettes/i);
  assert.match(prompt.midjourneyPrompt, /tactile provocative chemistry/i);
  assert.match(prompt.midjourneyPrompt, /Kowloon Walled City interior passage/i);
  assert.match(prompt.midjourneyPrompt, /moody film still/i);
  assert.match(prompt.midjourneyPrompt, /analog tape noise/i);
  assert.match(prompt.midjourneyPrompt, /light leaks/i);
  assert.ok(prompt.midjourneyPrompt.length < 650);
});

test('AI prompt keeps special outfit clothing core while dropping accessory-heavy styling', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    specialOutfitId: optionId('specialOutfitId', '黑色哥德蕾絲短袖熱褲長靴造型'),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    poseId: optionId('poseId', '站姿｜雙臂交疊'),
  });

  assert.match(prompt.midjourneyPrompt, /wearing a black gothic Y2K lace punk outfit/i);
  assert.match(prompt.midjourneyPrompt, /fitted black short-sleeve top/i);
  assert.match(prompt.midjourneyPrompt, /distressed black denim micro shorts/i);
  assert.match(prompt.midjourneyPrompt, /black slouchy knee-high leather boots/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /snap choker|rosary|necklace|wrist cuffs|bracelets/i);
});

test('AI prompt compresses outfit presets and dresses into short wearable phrases', () => {
  const [presetPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    outfitPresetId: optionId('outfitPresetId', '套裝：護士制服'),
    outerwearId: optionId('outerwearId', '全無'),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    poseId: optionId('poseId', '站姿｜雙臂交疊'),
  });
  const [dressPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    dressId: optionId('dressId', '連身：短版｜亮面乳膠迷你洋裝'),
    topId: optionId('topId', '全無'),
    pantsId: optionId('pantsId', '全無'),
    skirtId: optionId('skirtId', '全無'),
    outerwearId: optionId('outerwearId', '全無'),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    poseId: optionId('poseId', '站姿｜雙臂交疊'),
  });

  assert.match(presetPrompt.midjourneyPrompt, /wearing a nurse uniform/i);
  assert.doesNotMatch(presetPrompt.midjourneyPrompt, /short white nurse dress|medical apron|white cap/i);
  assert.match(dressPrompt.midjourneyPrompt, /wearing a glossy latex mini dress/i);
  assert.doesNotMatch(dressPrompt.midjourneyPrompt, /one-piece short mini silhouette|smooth glossy latex/i);
});

test('AI prompt keeps two-piece outfit preset garments while omitting palette colors', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    outfitPresetId: optionId('outfitPresetId', '套裝：開扣長袖襯衫包臀裙'),
    outfitPresetPrimaryColorId: optionId('outfitPresetPrimaryColorId', '白色'),
    outfitPresetContrastColorId: optionId('outfitPresetContrastColorId', '黑色'),
    topBottomPaletteId: optionId('topBottomPaletteId', '白色 × 黑色'),
    framingId: optionId('framingId', '中景鏡頭 (Medium Shot)'),
    poseId: optionId('poseId', '坐姿｜微微前傾'),
  });

  assert.match(prompt.midjourneyPrompt, /wearing a tight long-sleeve button-up shirt and bodycon mini skirt/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /wearing a (?:white|black) tight long-sleeve button-up shirt/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /tight long-sleeve button-up shirt and (?:white|black) bodycon mini skirt/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /coordinated top-to-bottom palette|upper\/main garment|lower or secondary garment/i);
});

test('AI prompt keeps cheongsam outfit presets as a short wearable phrase', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    outfitPresetId: optionId('outfitPresetId', '套裝：素色緞面旗袍'),
    outfitPresetPrimaryColorId: optionId('outfitPresetPrimaryColorId', '螢光黃色'),
    outerwearId: optionId('outerwearId', '全無'),
    framingId: optionId('framingId', '牛仔中景 (Cowboy Shot)'),
    poseId: optionId('poseId', '坐姿｜單腿放鬆'),
  });

  assert.match(prompt.midjourneyPrompt, /wearing a satin cheongsam mini outfit/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /neon yellow/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /diagonal frog-button placket|ultra-short mini hem|dominant satin color/i);
});

test('AI prompt omits face-only hidden wardrobe instead of injecting a default dress', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '臉部特寫'),
    topId: optionId('topId', '透膚刺繡襯衫'),
    pantsId: optionId('pantsId', '直筒牛仔褲'),
    shoesId: optionId('shoesId', '高跟鞋'),
  });

  assert.doesNotMatch(prompt.midjourneyPrompt, /wearing a thin spaghetti-strap straight-neck one-piece dress/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /semi-sheer embroidered shirt|straight-leg jeans|stiletto pumps/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /[\u3400-\u9fff]/);
  assert.doesNotMatch(prompt.midjourneyPrompt, /wearing anchor wardrobe as|complete one-piece dress identity/i);
});

test('AI prompt converts recognizable separate pieces into a style shorthand', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    outfitPresetId: optionId('outfitPresetId', '全無'),
    dressId: optionId('dressId', '全無'),
    topId: optionId('topId', '比基尼上身'),
    pantsId: optionId('pantsId', '牛仔短褲'),
    skirtId: optionId('skirtId', '全無'),
    outerwearId: optionId('outerwearId', '全無'),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    poseId: optionId('poseId', '站姿｜雙臂交疊'),
  });

  assert.match(prompt.midjourneyPrompt, /wearing a summer bikini-and-denim look/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /slim halter strings|minimal sliding triangle cups|compact fitted seat/i);
});

test('AI prompt includes the complete imaging simulation description', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    outfitPresetId: optionId('outfitPresetId', '套裝：空服員制服'),
    outerwearId: optionId('outerwearId', '全無'),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    poseId: optionId('poseId', '站姿｜雙臂交疊'),
    filmId: optionId('filmId', '高銳利快照黑位'),
  });

  assert.match(
    prompt.midjourneyPrompt,
    /high-acutance snapshot rendering, snap-focus clarity, contrasty black levels, crisp APS-C-like color response, candid compact-camera texture/i
  );
});

test('none selections stay silent across all final prompt outputs', () => {
  const [prompt] = generatePrompts(1, {
    ...createAllNoneLocks(),
    subjectCount: '1',
    outfitPresetId: optionId('outfitPresetId', '套裝：空服員制服'),
  });

  for (const text of [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt]) {
    assert.match(text, /flight attendant uniform/i);
    assert.doesNotMatch(text, /\bnone\b/i);
    assert.doesNotMatch(text, /全無/);
  }
});

test('PAGE1 can layer imported PAGE3 world-scene architecture into all prompt outputs', () => {
  const importedWorldSceneArchitecture = 'world-scene architecture for the portrait: Shibuya Scramble Crossing remains visible around and behind the subject, large video billboards, station-front buildings, dense pedestrian crosswalk pattern, portrait subject remains the main subject, no no-human-subject restriction';
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    importedWorldSceneMode: 'architecture',
    importedWorldSceneLabel: '東京｜澀谷 Scramble Crossing',
    importedWorldSceneArchitectureText: importedWorldSceneArchitecture,
    outfitPresetId: optionId('outfitPresetId', '套裝：空服員制服'),
    topId: optionId('topId', '全無'),
    dressId: optionId('dressId', '全無'),
    pantsId: optionId('pantsId', '全無'),
    skirtId: optionId('skirtId', '全無'),
    outerwearId: optionId('outerwearId', '全無'),
    topBottomPaletteId: optionId('topBottomPaletteId', '全無'),
    poseId: optionId('poseId', '站姿｜雙臂交疊'),
  });

  assert.match(prompt.grokPrompt, /world-scene architecture for the portrait/i);
  assert.match(prompt.grokPrompt, /Shibuya Scramble Crossing remains visible around and behind the subject/i);
  assert.match(prompt.grokPrompt, /large video billboards/i);
  assert.match(prompt.grokPrompt, /flight attendant uniform outfit/i);
  assert.match(prompt.grokPrompt, /standing pose with loosely crossed arms/i);
  assert.match(prompt.grokPrompt, /\n\nmulti-cut sequence n=2$/);

  assert.match(prompt.zImagePrompt, /Shibuya Scramble Crossing remains visible around and behind the subject/i);
  assert.match(prompt.zImagePrompt, /flight attendant uniform outfit/i);
  assert.match(prompt.zImagePrompt, /standing pose with loosely crossed arms/i);
  assert.doesNotMatch(prompt.zImagePrompt, /multi-cut sequence n=2/);

  assert.match(prompt.midjourneyPrompt, /Shibuya Scramble Crossing remains visible around and behind the subject/i);
  assert.match(prompt.midjourneyPrompt, /flight attendant uniform/i);
  assert.match(prompt.midjourneyPrompt, /standing pose with loosely crossed arms/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /multi-cut sequence n=2/);
  assert.equal(prompt.selection.locationId, optionId('locationId', '全無'));
  assert.equal(prompt.selection.importedWorldSceneMode, 'architecture');
  assert.equal(prompt.selection.importedWorldSceneLabel, '東京｜澀谷 Scramble Crossing');
});

test('PAGE3 world-scene import preserves locked PAGE1 ambient and subject lighting', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    importedWorldSceneMode: 'architecture',
    importedWorldSceneLabel: '大阪｜梅田高架橋下街景',
    importedWorldSceneArchitectureText: 'world-scene architecture for the portrait: Osaka, Umeda, Umeda elevated railway and underpass street stays visible around and behind the subject',
    lightingId: optionId('lightingId', '夏日深藍積雲'),
    lightDirectionId: optionId('lightDirectionId', '硬質晴光'),
    aspectRatio: optionId('aspectRatio', '16:9 寬螢幕'),
  });

  assert.match(prompt.grokPrompt, /deep azure summer sky/i);
  assert.match(prompt.grokPrompt, /hard direct sunlight on the subject/i);
  assert.doesNotMatch(prompt.grokPrompt, /candlelit interior environment/i);
  assert.doesNotMatch(prompt.grokPrompt, /warm-white practical-lamp subject color/i);
  assert.equal(prompt.selection.lightingId, optionId('lightingId', '夏日深藍積雲'));
  assert.equal(prompt.selection.lightDirectionId, optionId('lightDirectionId', '硬質晴光'));
});

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

function zImageWardrobeParagraph(prompt) {
  return zImageParagraphs(prompt).find((paragraph) => /^She wears\b/i.test(paragraph)) || '';
}

function extraPromptById(prompt, id) {
  return prompt.extraPrompts?.find((entry) => entry.id === id)?.text || '';
}

function assertNaturalZImageParagraphs(prompt, caseName, minParagraphs = 4) {
  const paragraphs = zImageParagraphs(prompt);

  assert.match(prompt.zImagePrompt, /\n\n/, `${caseName} should use blank-line paragraph breaks`);
  assert.ok(paragraphs.length >= minParagraphs, `${caseName} should have at least ${minParagraphs} paragraphs`);
  assert.doesNotMatch(
    prompt.zImagePrompt,
    /^(?:Image Type|Subject|Wardrobe|Pose and Composition|Lighting|Camera Look|Constraints):/m,
    `${caseName} should not use GPT-style section labels except the lightweight Scene label`
  );
  assert.doesNotMatch(prompt.zImagePrompt, /multi-cut sequence n=2/, `${caseName} should not include Gpt multi-cut tail`);

  for (const paragraph of paragraphs) {
    if (/^(?:Half-face|Facial-detail|Tight face|Head-and-shoulders|Chest-up|Waist-up|Knee-up|Full-body|Shoulder-level|Eye-level|Waist-level|Knee-level|High angle|Low angle|Top-down|Bird's-eye|Worm's-eye|Tilted frame)\b/i.test(paragraph)) continue;
    assert.match(paragraph, /[.!?]$/, `${caseName} paragraph should end with sentence punctuation: ${paragraph}`);
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function gptSection(prompt, label) {
  const sectionLabels = [
    'Image Type',
    'Subject',
    'Shared Expression',
    'Scene',
    'Wardrobe',
    'Pose and Composition',
    'Lighting',
    'Camera Look',
  ];
  const nextLabels = sectionLabels
    .filter((entry) => entry !== label)
    .map(escapeRegExp)
    .join('|');
  return prompt.grokPrompt.match(new RegExp(`${escapeRegExp(label)}:\\n([\\s\\S]*?)(?=\\n\\n(?:${nextLabels}):\\n|\\n\\nmulti-cut sequence n=2$|$)`))?.[1] || '';
}

function gptDuoRoleCard(subject, roleNumber) {
  return subject.match(new RegExp(`Woman ${roleNumber}:\\n([\\s\\S]*?)(?=\\n\\nWoman \\d:|$)`))?.[1] || '';
}

function promptSection(text, label, sectionLabels) {
  const nextLabels = sectionLabels
    .filter((entry) => entry !== label)
    .map(escapeRegExp)
    .join('|');
  return text.match(new RegExp(`${escapeRegExp(label)}:\\n([\\s\\S]*?)(?=\\n\\n(?:${nextLabels}):\\n|$)`))?.[1] || '';
}

function zImageSection(prompt, label) {
  return promptSection(prompt.zImagePrompt, label, [
    'Image Type',
    'Subject',
    'Woman 1',
    'Woman 2',
    'Shared Expression',
    'Pose and Composition',
    'Scene',
    'Lighting',
    'Camera Look',
  ]);
}

function aiSection(prompt, label) {
  const sectionLabels = [
    'Woman 1',
    'Woman 2',
    'Pose',
    'Scene',
    'Lighting',
    'Camera Look',
  ];
  const nextLabels = sectionLabels
    .filter((entry) => entry !== label)
    .map(escapeRegExp)
    .join('|');
  return prompt.midjourneyPrompt.match(new RegExp(`${escapeRegExp(label)}:\\s*([\\s\\S]*?)(?=\\n\\n(?:${nextLabels}):\\s*|$)`))?.[1] || '';
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
  assert.ok(prompt.grokPrompt.indexOf('\nSubject:\n') < prompt.grokPrompt.indexOf('\nWardrobe:\n'));
  assert.ok(prompt.grokPrompt.indexOf('\nWardrobe:\n') < prompt.grokPrompt.indexOf('\nPose and Composition:\n'));
  assert.ok(prompt.grokPrompt.indexOf('\nPose and Composition:\n') < prompt.grokPrompt.indexOf('\nScene:\n'));
  assert.ok(prompt.grokPrompt.indexOf('\nScene:\n') < prompt.grokPrompt.indexOf('\nLighting:\n'));
  assert.ok(prompt.grokPrompt.indexOf('\nLighting:\n') < prompt.grokPrompt.indexOf('\nCamera Look:\n'));
  assert.doesNotMatch(prompt.grokPrompt, /\nConstraints:\n/);
  assert.doesNotMatch(prompt.grokPrompt, /preserve the selected wardrobe as complete, realistic clothing/i);
  assert.doesNotMatch(prompt.grokPrompt, /Keep the specified outfit visible where the chosen framing allows/i);
  assert.doesNotMatch(prompt.grokPrompt, /natural body proportions|no extra people unless specified|no visible text or logos/i);
  assert.doesNotMatch(prompt.grokPrompt, /no nudity|fully clothed|clothing covers the body/i);
  assert.doesNotMatch(prompt.grokPrompt, /\.,|,\s*,/);
  assert.match(prompt.grokPrompt, /\n\nmulti-cut sequence n=2$/);
  assert.doesNotMatch(prompt.grokPrompt, /^Subject Count:/m);
});

test('full-body character prompt keeps complete separate wardrobe regardless of selected framing', () => {
  const [prompt] = generatePrompts(1, {
    ...createAllNoneLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '胸上特寫'),
    bodyTypeId: optionId('bodyTypeId', '柔和沙漏身形'),
    hairstyleId: optionId('hairstyleId', '半綁公主頭'),
    hairColorId: optionId('hairColorId', '深咖啡棕'),
    eyewearId: optionId('eyewearId', '細框眼鏡'),
    eyewearColorId: optionId('eyewearColorId', '黑色'),
    topId: optionId('topId', '襯衫'),
    topColorId: optionId('topColorId', '米白色'),
    skirtId: optionId('skirtId', '百褶短裙'),
    bottomColorId: optionId('bottomColorId', '深灰色'),
    outerwearId: optionId('outerwearId', '丹寧外套'),
    outerwearColorId: optionId('outerwearColorId', '深灰色'),
    legwearId: optionId('legwearId', '羅紋短襪'),
    legwearColorId: optionId('legwearColorId', '白色'),
    shoesId: optionId('shoesId', 'Samba OG'),
    shoesColorId: optionId('shoesColorId', '白色'),
  });
  const fullBodyPrompt = extraPromptById(prompt, 'full-body-character');

  assert.match(fullBodyPrompt, /^Image Type:\nCreate a photorealistic character reference portrait in a single 9:16 vertical image\./);
  assert.match(fullBodyPrompt, /\n\nSubject:\nThe subject is /);
  assert.match(fullBodyPrompt, /half-up long hair, soft crown lift, loose face-framing strands/i);
  assert.match(fullBodyPrompt, /deep coffee-brown hair/i);
  assert.match(fullBodyPrompt, /black .*glasses/i);
  assert.match(fullBodyPrompt, /\n\nWardrobe:\nShe wears /);
  assert.match(fullBodyPrompt, /off-white shirt/i);
  assert.match(fullBodyPrompt, /dark grey .*pleated mini skirt/i);
  assert.match(fullBodyPrompt, /dark grey denim jacket/i);
  assert.match(fullBodyPrompt, /white ribbed ankle socks/i);
  assert.match(fullBodyPrompt, /white adidas samba og sneakers/i);
  assert.match(fullBodyPrompt, /\n\nLighting:\nClean even lighting with clear facial, body, fabric, and footwear readability\./);
  assert.match(
    fullBodyPrompt,
    /\n\nCamera Look:\nFull-body view of the subject standing naturally, centered vertical framing, complete figure visible from head to toe, both hands and both feet completely visible, comfortable space above the hair and below the shoes, natural body proportions, no crop, no hidden limbs, clean realistic character-reference photography, clear facial and garment detail, no visible text\.$/
  );
  assert.doesNotMatch(fullBodyPrompt, /^(?:Pose and Composition|Scene):/m);
  assert.doesNotMatch(fullBodyPrompt, /multi-cut sequence n=2/);
});

test('full-body character prompt restores bags and footwear removed from cropped special-outfit prompts', () => {
  const [prompt] = generatePrompts(1, {
    ...createAllNoneLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '中景鏡頭 (Medium Shot)'),
    specialOutfitId: optionId('specialOutfitId', '白襯衫黑色長裙細領帶造型'),
  });
  const fullBodyPrompt = extraPromptById(prompt, 'full-body-character');

  assert.doesNotMatch(gptSection(prompt, 'Wardrobe'), /black soft shoulder tote|black lace-up leather shoes/i);
  assert.match(fullBodyPrompt, /black soft shoulder tote/i);
  assert.match(fullBodyPrompt, /black lace-up leather shoes/i);
});

test('full-body character prompt keeps character-card outfit out of the subject section', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    characterProfileId: 'character-rika',
  });
  const fullBodyPrompt = extraPromptById(prompt, 'full-body-character');
  const subject = promptSection(fullBodyPrompt, 'Subject', ['Image Type', 'Subject', 'Wardrobe', 'Lighting', 'Camera Look']);
  const wardrobe = promptSection(fullBodyPrompt, 'Wardrobe', ['Image Type', 'Subject', 'Wardrobe', 'Lighting', 'Camera Look']);

  assert.match(subject, /Character Profile Card:\n11_Rika/i);
  assert.match(subject, /Facial geometry:/i);
  assert.match(subject, /Body:/i);
  assert.doesNotMatch(subject, /Identity and body:/i);
  assert.match(subject, /Hair:/i);
  assert.doesNotMatch(subject, /^Outfit:|^Photographic direction:/mi);
  assert.match(wardrobe, /cropped white short-sleeve baby tee/i);
  assert.match(wardrobe, /low-rise light-wash blue jeans/i);
  assert.match(wardrobe, /white low-top sneakers/i);
});

test('image type presets expose six finished-image directions with photorealistic photography as default', () => {
  const control = getLockControls().find((entry) => entry.key === 'imageTypePresetId');

  assert.ok(control, 'Expected imageTypePresetId control');
  assert.equal(control.label, '成品類型');
  assert.equal(createEmptyLocks().imageTypePresetId, 'photorealistic-photo');
  assert.deepEqual(
    control.options.map((entry) => entry.zh),
    ['寫實攝影', '時尚廣告', '水彩插畫', '油畫肖像', '時尚插畫', '粉彩插畫']
  );
});

test('selected image type preset drives Gpt Grok/Z-Image and AI openings without losing selection state', () => {
  const [prompt] = generatePrompts(1, {
    ...createAllNoneLocks(),
    imageTypePresetId: 'pastel-illustration',
    subjectCount: '1',
    topId: optionId('topId', '棉質細肩背心'),
    pantsId: optionId('pantsId', '直筒牛仔褲'),
    poseBaseId: 'standing',
    poseArrangementId: 'standing-one-leg-weight',
  });

  assert.match(gptSection(prompt, 'Image Type'), /^Create a pastel illustration portrait\b/i);
  assert.match(prompt.zImagePrompt, /^Create a pastel illustration portrait\./i);
  assert.match(prompt.zImagePrompt, /A 20s seductive stunning Japanese or Korean woman(?:\.| with)/i);
  assert.match(prompt.midjourneyPrompt, /^Create a pastel illustration portrait\./i);
  assert.match(prompt.midjourneyPrompt, /A 20s seductive stunning Japanese or Korean woman/i);
  assert.match(prompt.midjourneyPrompt, /Wearing /i);
  assert.equal(prompt.selection.imageTypePresetId, 'pastel-illustration');
  assert.equal(prompt.structured.Style[0].zh, '粉彩插畫');
});

test('Gpt single-subject prompt preserves full-fidelity normal subject and wardrobe wording', () => {
  const [prompt] = generatePrompts(1, {
    ...createAllNoneLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    bodyTypeId: optionId('bodyTypeId', '性感曲線身形'),
    facialFeaturesId: optionId('facialFeaturesId', '成熟性感臉'),
    hairstyleId: optionId('hairstyleId', '柔波：深側分'),
    hairColorId: optionId('hairColorId', '銀灰白'),
    eyewearId: optionId('eyewearId', '粗框眼鏡'),
    eyewearColorId: optionId('eyewearColorId', '黑色'),
    eyewearPlacementId: optionId('eyewearPlacementId', '正常戴在臉上'),
    topId: optionId('topId', '棉質細肩背心'),
    pantsId: optionId('pantsId', '直筒牛仔褲'),
    topBottomPaletteId: optionId('topBottomPaletteId', '白色 × 靛藍'),
    topFitId: optionId('topFitId', '緊身'),
    bottomRiseId: optionId('bottomRiseId', '高腰'),
    bottomFitId: optionId('bottomFitId', '合身'),
  });

  const subject = gptSection(prompt, 'Subject');
  const wardrobe = gptSection(prompt, 'Wardrobe');

  assert.match(subject, /black frame, bold thick-frame glasses, worn normally on the face, lenses aligned over the eyes/i);
  assert.match(subject, /sexy tall slim-curvy silhouette, about 168-173 cm visual height and 53-58 kg lean visual weight/i);
  assert.match(subject, /94-58-92 body proportion anchor, long legs with about 3\.8:6\.2 torso-to-leg balance/i);
  assert.match(subject, /full F-to-G-cup-scale bust, narrow defined waist, rounded hips, flat abdomen, dramatic but lean bust-waist-hip curve/i);
  assert.match(subject, /young seductive alluring beauty face, magnetic feminine facial balance, defined eyes and lips, sensual captivating portrait presence/i);
  assert.match(subject, /deep side-parted long soft waves, polished Korean-style face-framing flow/i);
  assert.match(subject, /silver-gray white hair, cool pale fashion color, realistic dyed hair texture/i);
  assert.doesNotMatch(subject, /tall slim-curvy hourglass body, long legs, narrow waist, rounded hips/i);
  assert.doesNotMatch(subject, /\.\s*,/);

  assert.match(wardrobe, /tight body-skimming upper-body fit, white cotton camisole top, slim shoulder straps, soft ribbed knit, clean compact upper-body line/i);
  assert.match(wardrobe, /high-rise waistband sitting above the natural waist, fitted lower-body line following the garment shape/i);
  assert.match(wardrobe, /indigo straight-leg jeans, clean denim texture, balanced leg line, classic five-pocket construction/i);
  assert.doesNotMatch(wardrobe, /tight white ribbed cotton camisole with slim straps|high-rise fitted indigo straight-leg jeans/i);
  assert.doesNotMatch(wardrobe, /\.\s*,/);

  assert.doesNotMatch(prompt.zImagePrompt, /worn normally on the face|lenses aligned over the eyes/i);
  assert.doesNotMatch(prompt.zImagePrompt, /realistic outer-to-inner dressing order/i);
  assert.match(prompt.zImagePrompt, /A 20s seductive stunning Japanese or Korean woman(?:\.| with)/i);
  assert.match(prompt.zImagePrompt, /sexy tall slim-curvy silhouette, about 168-173 cm visual height and 53-58 kg lean visual weight/i);
  assert.match(prompt.zImagePrompt, /94-58-92 body proportion anchor, long legs with about 3\.8:6\.2 torso-to-leg balance/i);
  assert.match(prompt.zImagePrompt, /full F-to-G-cup-scale bust, narrow defined waist, rounded hips, flat abdomen, dramatic but lean bust-waist-hip curve/i);
});

test('Grok/Z-Image single-subject prompt keeps fixed subject lead and full body type while keeping natural paragraphs', () => {
  const [prompt] = generatePrompts(1, {
    ...createAllNoneLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    bodyTypeId: optionId('bodyTypeId', '性感曲線身形'),
    facialFeaturesId: optionId('facialFeaturesId', '成熟性感臉'),
    hairstyleId: optionId('hairstyleId', '濕潤感長波浪'),
    hairColorId: optionId('hairColorId', '自然黑'),
    eyewearId: optionId('eyewearId', '粗框眼鏡'),
    eyewearColorId: optionId('eyewearColorId', '黑色'),
    eyewearPlacementId: optionId('eyewearPlacementId', '正常戴在臉上'),
    expressionId: optionId('expressionId', '直視鏡頭｜柔和微笑'),
    topId: optionId('topId', '比基尼上身'),
    topColorId: optionId('topColorId', '白色'),
    pantsId: optionId('pantsId', '比基尼下身'),
    bottomColorId: optionId('bottomColorId', '白色'),
    poseBaseId: optionId('poseBaseId', '坐姿'),
    poseArrangementId: optionId('poseArrangementId', '自然坐姿'),
    poseHeadId: optionId('poseHeadId', '頭部自然朝向鏡頭'),
  });
  const paragraphs = zImageParagraphs(prompt);

  assertNaturalZImageParagraphs(prompt, 'single z-image compact prompt', 4);
  assert.match(paragraphs[0], /^Create a photorealistic editorial portrait\./i);
  assert.match(paragraphs.find((paragraph) => /A 20s seductive stunning Japanese or Korean woman/i.test(paragraph)) || '', /bold thick-frame glasses/i);
  assert.match(prompt.zImagePrompt, /sexy tall slim-curvy silhouette, about 168-173 cm visual height and 53-58 kg lean visual weight/i);
  assert.match(prompt.zImagePrompt, /94-58-92 body proportion anchor, long legs with about 3\.8:6\.2 torso-to-leg balance/i);
  assert.match(prompt.zImagePrompt, /full F-to-G-cup-scale bust, narrow defined waist, rounded hips, flat abdomen, dramatic but lean bust-waist-hip curve/i);
  assert.match(prompt.zImagePrompt, /natural black wet-look long wavy hair, damp separated strands/i);

  assert.match(paragraphs.find((paragraph) => /^She wears /i.test(paragraph)) || '', /white triangle bikini top/i);
  assert.match(prompt.zImagePrompt, /white low-rise side-tie bikini bottoms/i);
  assert.doesNotMatch(prompt.zImagePrompt, /clean beachwear styling|clean beachwear silhouette|top length extending below|not cropped into an unintended midriff reveal|realistic outer-to-inner dressing order/i);

  assert.match(prompt.zImagePrompt, /head naturally facing the camera[\s\S]*presents a natural seated pose/i);
});

test('AI single-subject prompt uses fixed subject lead while preserving eyewear and core prompt details', () => {
  const [prompt] = generatePrompts(1, {
    ...createAllNoneLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    bodyTypeId: optionId('bodyTypeId', '性感曲線身形'),
    facialFeaturesId: optionId('facialFeaturesId', '成熟性感臉'),
    hairstyleId: optionId('hairstyleId', '濕潤感長波浪'),
    hairColorId: optionId('hairColorId', '自然黑'),
    eyewearId: optionId('eyewearId', '粗框眼鏡'),
    eyewearColorId: optionId('eyewearColorId', '黑色'),
    eyewearPlacementId: optionId('eyewearPlacementId', '正常戴在臉上'),
    expressionId: optionId('expressionId', '直視鏡頭｜柔和微笑'),
    topId: optionId('topId', '比基尼上身'),
    topColorId: optionId('topColorId', '白色'),
    pantsId: optionId('pantsId', '比基尼下身'),
    bottomColorId: optionId('bottomColorId', '白色'),
    poseBaseId: optionId('poseBaseId', '坐姿'),
    poseArrangementId: optionId('poseArrangementId', '自然坐姿'),
    poseHeadId: optionId('poseHeadId', '頭部自然朝向鏡頭'),
  });
  const aiPrompt = prompt.midjourneyPrompt;

  assert.match(aiPrompt, /^Create a photorealistic editorial portrait\.\n\nFull-body portrait\n\nA 20s seductive stunning Japanese or Korean woman/i);
  assert.match(aiPrompt, /sexy tall slim-curvy silhouette[\s\S]*94-58-88 body proportion anchor|94-58-92 body proportion anchor/i);
  assert.match(aiPrompt, /wet-look long wavy hair[\s\S]*black bold-frame glasses/i);
  assert.match(aiPrompt, /Wearing white triangle bikini top, white low-rise side-tie bikini bottoms/i);
  assert.doesNotMatch(aiPrompt, /^(Image Type|Scene|Subject|Wardrobe|Pose and Composition):/m);
  assert.doesNotMatch(aiPrompt, /A stunning mid-20s/i);
  assert.doesNotMatch(aiPrompt, /defined eyes and lips|moody glossy texture|soft realistic shine|clean dark depth|soft smile/i);
  assert.doesNotMatch(aiPrompt, /visual height|visual weight|torso-to-leg|F-to-G-cup-scale|worn normally|clean beachwear|top length extending|She is sitting with natural seated arrangement|bottoms She is/i);
  assert.doesNotMatch(aiPrompt, /\bnone\b|[\u3400-\u9fff]/i);
  assert.match(aiPrompt, /\n\n/);
  assert.ok(aiPrompt.length < prompt.zImagePrompt.length);
});

test('AI single-subject prompt keeps compact hairstyle and hair color before special outfit clothing', () => {
  const [prompt] = generatePrompts(1, {
    ...createAllNoneLocks(),
    subjectCount: '1',
    bodyTypeId: optionId('bodyTypeId', '性感曲線身形'),
    hairstyleId: optionId('hairstyleId', '半綁公主頭'),
    hairColorId: optionId('hairColorId', '深咖啡棕'),
    specialOutfitId: optionId('specialOutfitId', '白襯衫黑色長裙細領帶造型'),
    poseId: optionId('poseId', '站姿｜雙臂交疊'),
  });
  const aiPrompt = prompt.midjourneyPrompt;
  assert.match(aiPrompt, /half-up long hair, soft crown lift, loose face-framing strands/i);
  assert.ok(aiPrompt.indexOf('half-up long hair') < aiPrompt.indexOf('Wearing '));
  assert.doesNotMatch(aiPrompt, /rich brunette depth|soft warm reflection/i);
  assert.doesNotMatch(aiPrompt, /[\u3400-\u9fff]/);
});

test('AI single-subject prompt uses simplified body type anchors for each body selection', () => {
  const cases = [
    {
      zh: '高挑時裝模特',
      expected: 'Tall slim fashion body, 80-58-88 body proportion anchor, long legs, high waistline, narrow ribcage, clean editorial silhouette.',
    },
    {
      zh: '一般基本體型',
      expected: 'Natural basic body, 83-62-88 body proportion anchor, low-contrast waist curve, modest bust and hips, smooth natural silhouette.',
    },
    {
      zh: '柔和沙漏身形',
      expected: 'Soft natural hourglass body, 90-62-94 body proportion anchor, fuller bust, wider hips, elongated abdomen with subtle contour lines.',
    },
    {
      zh: '性感曲線身形',
      expected: 'Sexy tall slim-curvy silhouette, 94-58-92 body proportion anchor, narrow defined waist, rounded hips, flat abdomen.',
    },
    {
      zh: '運動緊實身形',
      expected: 'Fit toned athletic body, firm silhouette, subtle muscle definition, energetic balanced proportions.',
    },
    {
      zh: '小隻精緻身形',
      expected: 'Petite polished body, compact refined proportions, delicate idol-like silhouette, graceful small-frame presence.',
    },
  ];

  for (const { zh, expected } of cases) {
    const [prompt] = generatePrompts(1, {
      ...createAllNoneLocks(),
      subjectCount: '1',
      bodyTypeId: optionId('bodyTypeId', zh),
      topId: optionId('topId', '棉質細肩背心'),
      poseId: optionId('poseId', '站姿｜自然站姿'),
    });

    const bodyLead = expected.split(',')[0];
    const bodyAnchor = expected.match(/\d{2,3}-\d{2}-\d{2}/)?.[0] || '';
    assert.match(
      prompt.midjourneyPrompt,
      new RegExp(`${escapeRegExp(bodyLead)}${bodyAnchor ? `[\\s\\S]*${escapeRegExp(bodyAnchor)}` : ''}`, 'i'),
      `${zh} should preserve the selected AI body anchor`
    );
    assert.doesNotMatch(prompt.midjourneyPrompt, /visual height|visual weight|torso-to-leg|cup-scale/i);
  }
});

test('AI single-subject prompt orders eyewear and headphones before clothing', () => {
  const [prompt] = generatePrompts(1, {
    ...createAllNoneLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    bodyTypeId: optionId('bodyTypeId', '性感曲線身形'),
    eyewearId: optionId('eyewearId', '粗框眼鏡'),
    eyewearColorId: optionId('eyewearColorId', '黑色'),
    eyewearPlacementId: optionId('eyewearPlacementId', '正常戴在臉上'),
    headAccessoryId: optionId('headAccessoryId', '耳罩式耳機（掛在脖子上）'),
    topId: optionId('topId', '短版蕾絲背心'),
    topColorId: optionId('topColorId', '米白色'),
    pantsId: optionId('pantsId', '牛仔短褲'),
    bottomColorId: optionId('bottomColorId', '深藍色'),
    poseId: optionId('poseId', '站姿｜雙臂交疊'),
  });

  const aiPrompt = prompt.midjourneyPrompt;

  assert.match(aiPrompt, /^Create a photorealistic editorial portrait\.[\s\S]*A 20s seductive stunning Japanese or Korean woman/i);
  assert.match(aiPrompt, /black bold-frame glasses[\s\S]*black Marshall Major V on-ear headphones resting around the neck[\s\S]*Wearing /i);
  assert.match(aiPrompt, /off-white sheer floral lace cropped camisole[\s\S]*dark blue denim shorts/i);
  assert.ok(
    aiPrompt.indexOf('black bold-frame glasses') < aiPrompt.indexOf('black Marshall Major V on-ear headphones resting around the neck')
  );
  assert.ok(
    aiPrompt.indexOf('black Marshall Major V on-ear headphones resting around the neck') < aiPrompt.indexOf('Wearing ')
  );
  assert.doesNotMatch(aiPrompt, /compact black earcups|slim structured headband|worn normally|lenses aligned/i);
  assert.doesNotMatch(aiPrompt, /defined eyes and lips|hair|soft smile|[\u3400-\u9fff]/i);
});

test('Gpt single-subject prompt preserves full-fidelity identity descriptions', () => {
  const baseLocks = {
    ...createAllNoneLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
  };
  const buildSubject = (locks) => {
    const [prompt] = generatePrompts(1, { ...baseLocks, ...locks });
    return {
      subject: gptSection(prompt, 'Subject'),
      zImagePrompt: prompt.zImagePrompt,
    };
  };

  const cases = [
    {
      name: 'curvy editorial dyed hair',
      locks: {
        bodyTypeId: optionId('bodyTypeId', '性感曲線身形'),
        facialFeaturesId: optionId('facialFeaturesId', '成熟性感臉'),
        hairstyleId: optionId('hairstyleId', '柔波：深側分'),
        hairColorId: optionId('hairColorId', '銀灰白'),
      },
      gptKeeps: [
        /sexy tall slim-curvy silhouette, about 168-173 cm visual height and 53-58 kg lean visual weight/i,
        /94-58-92 body proportion anchor, long legs with about 3\.8:6\.2 torso-to-leg balance/i,
        /young seductive alluring beauty face, magnetic feminine facial balance, defined eyes and lips, sensual captivating portrait presence/i,
        /deep side-parted long soft waves, polished Korean-style face-framing flow/i,
        /silver-gray white hair, cool pale fashion color, realistic dyed hair texture/i,
      ],
      zKeeps: [
        /A 20s seductive stunning Japanese or Korean woman(?:\.| with)/i,
        /sexy tall slim-curvy silhouette, about 168-173 cm visual height and 53-58 kg lean visual weight/i,
        /94-58-92 body proportion anchor, long legs with about 3\.8:6\.2 torso-to-leg balance/i,
        /full F-to-G-cup-scale bust, narrow defined waist, rounded hips, flat abdomen, dramatic but lean bust-waist-hip curve/i,
      ],
      zOmits: /magnetic feminine facial balance|polished Korean-style face-framing flow/i,
    },
    {
      name: 'idol glass skin bob',
      locks: {
        bodyTypeId: optionId('bodyTypeId', '高挑時裝模特'),
        facialFeaturesId: optionId('facialFeaturesId', '韓系偶像臉'),
        skinDetailsId: optionId('skinDetailsId', '玻璃水光肌'),
        hairstyleId: optionId('hairstyleId', '輕透齊瀏海內彎鮑伯'),
        hairColorId: optionId('hairColorId', '自然黑'),
      },
      gptKeeps: [
        /tall slim fashion body, about 170-175 cm visual height, 80-58-88 body proportion anchor/i,
        /young beautiful Korean idol face, refined small face, clear bright eyes, polished youthful beauty, photogenic K-pop portrait balance/i,
        /chin-length inward-curved bob, airy straight bangs, smooth face-framing rounded ends, clean salon shape/i,
        /natural black hair, soft realistic shine, clean dark depth/i,
        /glass skin, dewy luminous skin texture, hydrated reflective complexion/i,
      ],
      zKeeps: [
        /A 20s seductive stunning Japanese or Korean woman(?:\.| with)/i,
        /tall slim fashion body, about 170-175 cm visual height, 80-58-88 body proportion anchor/i,
        /long legs with about 3\.5:6\.5 torso-to-leg balance, shorter upper torso, high waistline, narrow ribcage, gently wider hips/i,
      ],
      zOmits: /photogenic K-pop portrait balance|hydrated reflective complexion|clean salon shape/i,
    },
    {
      name: 'freckles wet straight hair',
      locks: {
        bodyTypeId: optionId('bodyTypeId', '柔和沙漏身形'),
        facialFeaturesId: optionId('facialFeaturesId', '甜美可愛臉'),
        skinDetailsId: optionId('skinDetailsId', '自然雀斑'),
        hairstyleId: optionId('hairstyleId', '直髮：濕感'),
        hairColorId: optionId('hairColorId', '蜂蜜焦糖棕'),
      },
      gptKeeps: [
        /soft natural hourglass body, about 165-170 cm visual height, 90-62-94 body proportion anchor/i,
        /young sweet pretty face, soft rounded charm, bright friendly eyes, gentle cute beauty, approachable youthful portrait look/i,
        /straight medium-to-long hair with a sleek wet texture, clean straight lengths, separated damp strands, minimal wave/i,
        /honey caramel-brown hair, warm golden brown salon color/i,
        /natural freckles across nose and cheeks, sun-kissed freckles, authentic skin detail/i,
      ],
      zKeeps: [
        /A 20s seductive stunning Japanese or Korean woman(?:\.| with)/i,
        /soft natural hourglass body, about 165-170 cm visual height, 90-62-94 body proportion anchor/i,
        /balanced torso-to-leg ratio around 4:6, longer upper torso, lower waistline, fuller bust, wider hips, elongated abdomen with subtle contour lines/i,
      ],
      zOmits: /approachable youthful portrait look|clean straight lengths|authentic skin detail/i,
    },
  ];

  for (const item of cases) {
    const result = buildSubject(item.locks);
    for (const pattern of item.gptKeeps) {
      assert.match(result.subject, pattern, `${item.name} should preserve full GPT wording`);
    }
    for (const pattern of item.zKeeps) {
      assert.match(result.zImagePrompt, pattern, `${item.name} should preserve full Z-Image body wording`);
    }
    assert.doesNotMatch(result.zImagePrompt, item.zOmits, `${item.name} should keep Z-Image compact`);
  }
});

test('Gpt single-subject prompt preserves separate hairstyle and hair color wording', () => {
  const baseLocks = {
    ...createAllNoneLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    bodyTypeId: optionId('bodyTypeId', '性感曲線身形'),
    facialFeaturesId: optionId('facialFeaturesId', '成熟性感臉'),
  };
  const cases = [
    {
      name: 'natural black wet long waves',
      hairstyle: '濕潤感長波浪',
      hairColor: '自然黑',
      gptHairstyle: /wet-look long wavy hair, damp separated strands, moody glossy texture/i,
      gptHairColor: /natural black hair, soft realistic shine, clean dark depth/i,
      gptMerged: /natural black wet-look long wavy hair/i,
      zImageColor: /natural black wet-look long wavy hair, damp separated strands/i,
    },
    {
      name: 'silver-gray deep side waves',
      hairstyle: '柔波：深側分',
      hairColor: '銀灰白',
      gptHairstyle: /deep side-parted long soft waves, polished Korean-style face-framing flow/i,
      gptHairColor: /silver-gray white hair, cool pale fashion color, realistic dyed hair texture/i,
      gptMerged: /silver-gray white deep side-parted long soft waves/i,
      zImageColor: /silver-gray white deep side-parted long soft waves/i,
    },
    {
      name: 'honey caramel wet straight hair',
      hairstyle: '直髮：濕感',
      hairColor: '蜂蜜焦糖棕',
      gptHairstyle: /straight medium-to-long hair with a sleek wet texture, clean straight lengths, separated damp strands, minimal wave/i,
      gptHairColor: /honey caramel-brown hair, warm golden brown salon color/i,
      gptMerged: /honey caramel-brown sleek wet straight medium-to-long hair/i,
      zImageColor: /honey caramel-brown sleek wet straight medium-to-long hair, separated damp strands/i,
    },
    {
      name: 'cobalt-blue slight waves with bangs',
      hairstyle: '輕透瀏海自然微彎長髮',
      hairColor: '寶石藍',
      gptHairstyle: /long naturally slightly wavy hair with airy see-through bangs, soft side-draped face-framing strands/i,
      gptHairColor: /jewel cobalt-blue fashion hair color, rich blue tone with realistic dyed hair texture/i,
      gptMerged: /cobalt-blue fashion long slightly wavy hair/i,
      zImageColor: /cobalt-blue fashion long slightly wavy hair/i,
    },
    {
      name: 'soft black-tea high ponytail',
      hairstyle: '蓬鬆高馬尾',
      hairColor: '柔霧黑茶',
      gptHairstyle: /voluminous high ponytail, loose natural strands, lifted active movement/i,
      gptHairColor: /soft black-tea brown hair, muted brown-black salon tone/i,
      gptMerged: /soft black-tea brown voluminous high ponytail/i,
      zImageColor: /soft black-tea brown voluminous high ponytail/i,
    },
  ];

  for (const item of cases) {
    const [prompt] = generatePrompts(1, {
      ...baseLocks,
      hairstyleId: optionId('hairstyleId', item.hairstyle),
      hairColorId: optionId('hairColorId', item.hairColor),
    });
    const subject = gptSection(prompt, 'Subject');

    assert.match(subject, item.gptHairstyle, `${item.name} should preserve the full hairstyle wording`);
    assert.match(subject, item.gptHairColor, `${item.name} should preserve the full hair color wording`);
    assert.doesNotMatch(subject, item.gptMerged, `${item.name} should not merge GPT hair color into hairstyle`);
      assert.match(prompt.zImagePrompt, item.zImageColor, `${item.name} should merge Z-Image hair color into hairstyle`);
  }
});

test('Gpt single-subject prompt preserves full-fidelity expression and special action wording', () => {
  const baseLocks = {
    ...createAllNoneLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
  };
  const buildSections = (locks) => {
    const [prompt] = generatePrompts(1, { ...baseLocks, ...locks });
    return {
      prompt,
      subject: gptSection(prompt, 'Subject'),
      pose: gptSection(prompt, 'Pose and Composition'),
    };
  };

  const crossedArms = buildSections({
    expressionId: optionId('expressionId', '直視鏡頭｜柔和微笑'),
    poseId: optionId('poseId', '站姿｜雙臂交疊'),
  });
  assert.match(crossedArms.subject, /looking directly at the camera, direct eye contact, soft natural smile, gentle confidence, bright approachable expression/i);
  assert.match(crossedArms.pose, /arms crossed loosely in front of the body[\s\S]*presents a natural relaxed standing pose/i);
  assert.doesNotMatch(crossedArms.pose, /\.,/i);
  assert.match(crossedArms.prompt.zImagePrompt, /direct eye contact/i);
  assert.doesNotMatch(crossedArms.prompt.zImagePrompt, /cool composed body language/i);

  const downwardRecline = buildSections({
    expressionId: optionId('expressionId', '低頭垂眼｜內斂'),
    poseId: optionId('poseId', '半躺低姿態｜側身半躺'),
  });
  assert.match(downwardRecline.subject, /eyes cast downward away from camera, lowered gaze, inward quiet expression, restrained emotion/i);
  assert.match(downwardRecline.pose, /side-lying pose/i);
  assert.doesNotMatch(downwardRecline.pose, /soft flowing body line|\.,/i);

  const supine = buildSections({
    poseId: optionId('poseId', '半躺低姿態｜正面仰躺'),
  });
  assert.match(supine.pose, /supine lying pose with a relaxed upward-facing body line/i);
  assert.doesNotMatch(supine.pose, /facing upward|raised loosely|resting casually|soft asymmetrical way|\.,/i);

  const lipstick = buildSections({
    poseId: optionId('poseId', '站姿｜自然站姿'),
    specialActionId: optionId('specialActionId', '塗口紅'),
  });
  assert.match(lipstick.pose, /one hand applying lipstick directly to the lips with visible hand-to-mouth contact/i);
  assert.match(lipstick.pose, /finish varying naturally between clean application and a slightly smudged lip line/i);
  assert.doesNotMatch(lipstick.pose, /\.,/i);
  assert.doesNotMatch(lipstick.prompt.zImagePrompt, /polished beauty touch-up portrait moment/i);

  const icedCoffee = buildSections({
    specialActionId: optionId('specialActionId', '喝冰咖啡'),
  });
  assert.match(icedCoffee.pose, /clear plastic takeaway cup of iced coffee held naturally in one hand/i);
  assert.doesNotMatch(icedCoffee.pose, /\.,/i);
  assert.doesNotMatch(icedCoffee.prompt.zImagePrompt, /relaxed everyday cafe portrait moment/i);
});

test('Gpt single-subject prompt preserves full-fidelity pose composer special-settings wording', () => {
  const baseLocks = {
    ...createAllNoneLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
  };
  const buildSections = (locks) => {
    const [prompt] = generatePrompts(1, { ...baseLocks, ...locks });
    return {
      prompt,
      pose: gptSection(prompt, 'Pose and Composition'),
    };
  };

  const standingSceneObject = buildSections({
    poseBaseId: optionId('poseBaseId', '站姿'),
    poseArrangementId: optionId('poseArrangementId', '背對回身站姿'),
    poseHandId: optionId('poseHandId', '單手撩髮'),
    poseHeadId: optionId('poseHeadId', '越肩回望'),
    poseAnchorId: optionId('poseAnchorId', '倚靠現有場景物件'),
  });
  assert.match(standingSceneObject.pose, /leaning against any suitable existing object within the current scene/i);
  assert.match(standingSceneObject.pose, /body weight lightly supported by that existing scene object, using only a naturally available scene object for support/i);
  assert.match(standingSceneObject.pose, /one hand brushing hair back from the side of the face, fingers visibly touching the hair near the temple or ear/i);
  assert.match(standingSceneObject.prompt.zImagePrompt, /using only a naturally available scene object for support/i);

  const sittingChair = buildSections({
    poseBaseId: optionId('poseBaseId', '坐姿'),
    poseArrangementId: optionId('poseArrangementId', '開闊自信坐姿'),
    poseHandId: optionId('poseHandId', '雙手撐腰'),
    poseHeadId: optionId('poseHeadId', '近鏡頭偏轉頭部'),
    poseAnchorId: optionId('poseAnchorId', '坐在椅子上'),
  });
  assert.match(sittingChair.pose, /on a chair that naturally fits the current scene with the chair style material and scale chosen to match the environment/i);
  assert.match(sittingChair.pose, /open, confident seated pose with knees set wider in a grounded posture, torso upright, and strong spatial presence/i);
  assert.match(sittingChair.pose, /both hands placed on the waist or hip line with elbows naturally adapted to the pose/i);
  assert.match(sittingChair.pose, /head turned slightly off-axis near the lens with the face plane angled diagonally instead of flat to camera/i);

  const waterEdge = buildSections({
    locationId: optionId('locationId', '戶外：飯店度假村泳池露台'),
    poseBaseId: optionId('poseBaseId', '躺姿'),
    poseArrangementId: optionId('poseArrangementId', '隨性慵懶'),
    poseHandId: optionId('poseHandId', '一手撐地一手放腿上'),
    poseHeadId: optionId('poseHeadId', '頭靠近邊緣支撐'),
    poseAnchorId: optionId('poseAnchorId', '靠在水邊支撐'),
  });
  assert.match(waterEdge.pose, /water-contact realism with the whole lower body submerged and only the upper body above the water surface/i);
  assert.match(waterEdge.pose, /visible waterline across the body, natural ripples around the torso and limbs, wet skin and damp fabric edges, clothing remains complete and non-transparent/i);
  assert.match(waterEdge.pose, /one hand planted on the floor or a nearby surface for support, with the other hand resting on the leg/i);
  assert.match(waterEdge.pose, /head angled low near a rim or support edge with cheek and jawline close to the supporting surface/i);

  const bathtubWet = buildSections({
    poseBaseId: optionId('poseBaseId', '躺姿'),
    poseArrangementId: optionId('poseArrangementId', '半躺倚靠'),
    poseHandId: optionId('poseHandId', '雙手放在大腿上'),
    poseHeadId: optionId('poseHeadId', '頭部貼近支撐面'),
    poseAnchorId: optionId('poseAnchorId', '浴缸'),
  });
  assert.match(bathtubWet.pose, /the outfit and exposed skin are soaked by bath water/i);
  assert.match(bathtubWet.pose, /visible water sheen and droplets, darker damp fabric tones, heavier wet folds/i);
  assert.match(bathtubWet.pose, /both hands resting on the thighs or nearest upper-leg surface/i);
  assert.match(bathtubWet.pose, /head angled close to a support surface or shoulder line with the cheek plane following the selected support contact/i);
});

test('Gpt single-subject prompt preserves full-fidelity footwear and outerwear details without guard text', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    specialOutfitId: optionId('specialOutfitId', '全無'),
    outfitPresetId: optionId('outfitPresetId', '全無'),
    dressId: optionId('dressId', '全無'),
    outerwearId: optionId('outerwearId', '丹寧外套'),
    outerwearColorId: optionId('outerwearColorId', '深灰色'),
    outerwearFitId: optionId('outerwearFitId', '短版 Oversize'),
    outerwearPatternId: optionId('outerwearPatternId', '粗橫條紋'),
    outerwearOpeningId: optionId('outerwearOpeningId', '敞開穿'),
    outerwearStylingId: optionId('outerwearStylingId', '滑落肩部'),
    topId: optionId('topId', '襯衫'),
    topColorId: optionId('topColorId', '米白色'),
    topFitId: optionId('topFitId', '全無'),
    topStylingId: optionId('topStylingId', '全無'),
    topPatternId: optionId('topPatternId', '全無'),
    pantsId: optionId('pantsId', '全無'),
    skirtId: optionId('skirtId', '百褶短裙'),
    bottomRiseId: optionId('bottomRiseId', '全無'),
    bottomFitId: optionId('bottomFitId', '全無'),
    bottomPatternId: optionId('bottomPatternId', '全無'),
    legwearId: optionId('legwearId', '羅紋短襪'),
    legwearColorId: optionId('legwearColorId', '白色'),
    shoesId: optionId('shoesId', 'Samba OG'),
    shoesColorId: optionId('shoesColorId', '白色'),
  });

  const wardrobe = gptSection(prompt, 'Wardrobe');

  assert.match(wardrobe, /dark grey denim jacket, washed denim texture, chest pockets, metal buttons, casual structured outerwear/i);
  assert.match(wardrobe, /outerwear slipped below the shoulder line, sleeves loosely on the arms, jacket body still readable as an outer layer/i);
  assert.match(wardrobe, /white ribbed ankle socks, soft cotton texture/i);
  assert.match(wardrobe, /white adidas samba og sneakers, gum sole, three-stripe side detail, terrace football styling/i);
  assert.doesNotMatch(wardrobe, /outerwear remains a coherent outer layer; inner garment appears at natural openings/i);
  assert.doesNotMatch(wardrobe, /properly worn with intact shoulders, sleeves, lapels and hem/i);

  assert.doesNotMatch(prompt.zImagePrompt, /casual structured outerwear/i);
  assert.doesNotMatch(prompt.zImagePrompt, /soft cotton texture/i);
  assert.match(prompt.zImagePrompt, /terrace football styling/i);

  const [normalOuterwearPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    specialOutfitId: optionId('specialOutfitId', '全無'),
    outfitPresetId: optionId('outfitPresetId', '全無'),
    dressId: optionId('dressId', '全無'),
    outerwearId: optionId('outerwearId', '西裝外套'),
    outerwearStylingId: optionId('outerwearStylingId', '正常穿著'),
    topId: optionId('topId', '襯衫'),
    pantsId: optionId('pantsId', '全無'),
    skirtId: optionId('skirtId', '全無'),
  });

  assert.match(gptSection(normalOuterwearPrompt, 'Wardrobe'), /outerwear worn normally on both shoulders/i);
  assert.doesNotMatch(normalOuterwearPrompt.zImagePrompt, /properly worn on both shoulders/i);
});

test('Gpt single-subject prompt preserves full-fidelity outfit preset and dress wording', () => {
  const baseLocks = {
    ...createAllNoneLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    specialOutfitId: optionId('specialOutfitId', '全無'),
  };
  const buildWardrobe = (locks) => {
    const [prompt] = generatePrompts(1, { ...baseLocks, ...locks });
    return {
      prompt,
      wardrobe: gptSection(prompt, 'Wardrobe'),
    };
  };

  const bunnyCorset = buildWardrobe({
    outfitPresetId: optionId('outfitPresetId', '套裝：粉紅哥德兔耳吊帶束身'),
    dressId: optionId('dressId', '全無'),
  });
  assert.match(bunnyCorset.wardrobe, /gothic bunny corset outfit, bunny-ear headband with lace inner panels/i);
  assert.match(bunnyCorset.wardrobe, /one bunny ear standing upright and the other half-drooping/i);
  assert.match(bunnyCorset.wardrobe, /bow accents placed clearly on both the left and right sides of the headband/i);
  assert.match(bunnyCorset.wardrobe, /fitted corset bodysuit with shaped cup seams and vertical boning lines/i);
  assert.match(bunnyCorset.wardrobe, /matching main-color garter lace thigh-high stockings, leather neck choker with metal cross pendant/i);
  assert.match(bunnyCorset.wardrobe, /main fabric color controlled by outfit primary color/i);
  assert.match(bunnyCorset.wardrobe, /cross decorations controlled by contrast palette/i);
  assert.doesNotMatch(bunnyCorset.prompt.zImagePrompt, /bow accents placed clearly on both the left and right sides/i);

  const openButtonSet = buildWardrobe({
    outfitPresetId: optionId('outfitPresetId', '套裝：開扣長袖襯衫包臀裙'),
    dressId: optionId('dressId', '全無'),
  });
  assert.match(openButtonSet.wardrobe, /tight long-sleeve button-up shirt outfit, opaque stretch cotton shirting fabric, structured collar and long fitted sleeves/i);
  assert.match(openButtonSet.wardrobe, /upper buttons left open, remaining front buttons fastened under tension/i);
  assert.match(openButtonSet.wardrobe, /visible button placket pulling at the chest and waist, horizontal fabric wrinkles across the bust and midriff/i);
  assert.match(openButtonSet.wardrobe, /tight bodycon mini skirt, smooth hip-hugging skirt silhouette/i);
  assert.match(openButtonSet.wardrobe, /dominant fabric color controlled by the outfit color selection/i);
  assert.doesNotMatch(openButtonSet.prompt.zImagePrompt, /remaining front buttons fastened under tension/i);

  const sleevelessDress = buildWardrobe({
    outfitPresetId: optionId('outfitPresetId', '全無'),
    dressId: optionId('dressId', '連身：短版｜無袖迷你洋裝'),
  });
  assert.match(sleevelessDress.wardrobe, /sleeveless mini dress, one-piece silhouette, clean shoulder line, compact short hem/i);
  assert.match(sleevelessDress.wardrobe, /main fabric color controlled by dress color selection/i);
  assert.doesNotMatch(sleevelessDress.prompt.zImagePrompt, /one-piece silhouette/i);

  const cutoutSwimsuit = buildWardrobe({
    outfitPresetId: optionId('outfitPresetId', '全無'),
    dressId: optionId('dressId', '連身：短版｜高領挖腰連身泳裝'),
  });
  assert.match(cutoutSwimsuit.wardrobe, /high-neck extreme front cut-out monokini swimsuit/i);
  assert.match(cutoutSwimsuit.wardrobe, /bikini-like one-piece construction/i);
  assert.match(cutoutSwimsuit.wardrobe, /separate high-neck chest panel and high-cut bikini bottom connected only by thin side straps/i);
  assert.match(cutoutSwimsuit.wardrobe, /oversized open front torso gap exposing most of the abdomen and navel/i);
  assert.match(cutoutSwimsuit.wardrobe, /main swim fabric color controlled by dress color selection/i);
  assert.doesNotMatch(cutoutSwimsuit.prompt.zImagePrompt, /bikini-like one-piece construction/i);
});

test('Gpt single-subject prompt preserves outfit preset and dress palette control wording', () => {
  const baseLocks = {
    ...createAllNoneLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    specialOutfitId: optionId('specialOutfitId', '全無'),
  };
  const buildWardrobe = (locks) => {
    const [prompt] = generatePrompts(1, { ...baseLocks, ...locks });
    return {
      prompt,
      wardrobe: gptSection(prompt, 'Wardrobe'),
    };
  };
  const controlPhrase = /controlled by|complete outfit palette direction|shift the complete outfit palette|preserving garment structure|multi-piece color variation/i;

  const cheongsam = buildWardrobe({
    outfitPresetId: optionId('outfitPresetId', '套裝：素色緞面旗袍'),
    dressId: optionId('dressId', '全無'),
    completeLookPaletteId: optionId('completeLookPaletteId', '黑紅街頭'),
  });
  assert.match(cheongsam.wardrobe, /dominant satin color controlled by the outfit color selection/i);
  assert.match(cheongsam.wardrobe, /complete outfit palette direction: shift the complete outfit palette toward a black-and-red street color family/i);
  assert.match(cheongsam.wardrobe, controlPhrase);
  assert.doesNotMatch(cheongsam.prompt.zImagePrompt, /complete outfit palette direction: shift the complete outfit palette/i);

  const lingerie = buildWardrobe({
    outfitPresetId: optionId('outfitPresetId', '套裝：鏈條緞面內衣'),
    dressId: optionId('dressId', '全無'),
    completeLookPaletteId: optionId('completeLookPaletteId', '銀灰金屬'),
  });
  assert.match(lingerie.wardrobe, /complete outfit palette direction:/i);
  assert.match(lingerie.wardrobe, controlPhrase);

  const maid = buildWardrobe({
    outfitPresetId: optionId('outfitPresetId', '套裝：女僕'),
    dressId: optionId('dressId', '全無'),
    completeLookPaletteId: optionId('completeLookPaletteId', '粉色甜酷'),
  });
  assert.match(maid.wardrobe, /complete outfit palette direction:/i);
  assert.match(maid.wardrobe, controlPhrase);

  const laceDress = buildWardrobe({
    outfitPresetId: optionId('outfitPresetId', '全無'),
    dressId: optionId('dressId', '連身：短版｜細肩帶蕾絲棉質迷你洋裝'),
    completeLookPaletteId: optionId('completeLookPaletteId', '奶油米白'),
  });
  assert.match(laceDress.wardrobe, /main fabric color controlled by dress color selection/i);
  assert.match(laceDress.wardrobe, controlPhrase);

  const cutoutSwimsuit = buildWardrobe({
    outfitPresetId: optionId('outfitPresetId', '全無'),
    dressId: optionId('dressId', '連身：短版｜高領挖腰連身泳裝'),
    completeLookPaletteId: optionId('completeLookPaletteId', '黑紅街頭'),
  });
  assert.match(cutoutSwimsuit.wardrobe, /main swim fabric color controlled by dress color selection/i);
  assert.match(cutoutSwimsuit.wardrobe, controlPhrase);

  const halterDress = buildWardrobe({
    outfitPresetId: optionId('outfitPresetId', '全無'),
    dressId: optionId('dressId', '連身：短版｜亮面深V掛脖迷你洋裝'),
    topBottomPaletteId: optionId('topBottomPaletteId', '日蝕紫 × 萊姆低語'),
  });
  assert.match(halterDress.wardrobe, /coordinated top-to-bottom palette: upper\/main dress area/i);
  assert.match(halterDress.wardrobe, /lower hem or skirt area/i);
});

test('Gpt duo prompt uses role cards with wardrobe inside each subject block', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '2',
    locationId: optionId('locationId', '室內：現代高樓公寓客廳'),
    outfitPresetAId: optionId('outfitPresetAId', '套裝：鏈條緞面內衣'),
    outfitPresetBId: optionId('outfitPresetBId', '套裝：BDSM 束縛'),
    eyewearBId: optionId('eyewearBId', '細框眼鏡'),
    duoExpressionId: optionId('duoExpressionId', '曖昧對視｜性感張力'),
    duoPoseId: optionId('duoPoseId', '充滿情慾的時尚寫真'),
  });

  const subject = gptSection(prompt, 'Subject');
  const sharedExpression = gptSection(prompt, 'Shared Expression');
  const pose = gptSection(prompt, 'Pose and Composition');
  const scene = gptSection(prompt, 'Scene');

  assert.match(subject, /^Two 20-year-old Japanese or Korean female portrait subjects\./);
  assert.match(subject, /Woman 1:\nHas /);
  assert.match(subject, /Woman 2:\nHas /);
  assert.ok(subject.indexOf('Woman 1:') < subject.indexOf('Woman 2:'));
  assert.match(subject, /Woman 1:\nHas [\s\S]*\. Wears [\s\S]*satin lingerie set[\s\S]*\./i);
  assert.match(subject, /Woman 2:\nHas [\s\S]*thin-frame glasses[\s\S]*\. Wears [\s\S]*BDSM-inspired leather lingerie harness set[\s\S]*\./i);
  assert.doesNotMatch(subject, /modern high-rise apartment living room/i);
  assert.doesNotMatch(subject, /coordinated but clearly distinct outfits|avoid identical garment colors|avoid matching top colors|keep each woman styling visually separate/i);
  assert.doesNotMatch(subject, /distinct outfit-visible editorial|complete wardrobe visible on both women|visible torso and wardrobe details|no headshot-only crop/i);

  assert.equal(gptSection(prompt, 'Wardrobe'), '');
  assert.match(sharedExpression, /^both women share a flirtatious ambiguous gaze/i);
  assert.ok(prompt.grokPrompt.indexOf('\nSubject:\n') < prompt.grokPrompt.indexOf('\nShared Expression:\n'));
  assert.ok(prompt.grokPrompt.indexOf('\nShared Expression:\n') < prompt.grokPrompt.indexOf('\nPose and Composition:\n'));
  assert.ok(prompt.grokPrompt.indexOf('\nPose and Composition:\n') < prompt.grokPrompt.indexOf('\nScene:\n'));
  assert.ok(prompt.grokPrompt.indexOf('\nScene:\n') < prompt.grokPrompt.indexOf('\nLighting:\n'));
  assert.match(pose, /erotic high-fashion photo-story/i);
  assert.match(scene, /modern high-rise apartment living room/i);
  assert.doesNotMatch(scene, /Woman 1 wears|Woman 2 wears/i);
  assert.match(prompt.grokPrompt, /\n\nmulti-cut sequence n=2$/);
});

test('Gpt duo subject role wardrobes preserve color-control metadata and punctuate sentences', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '2',
    outfitPresetAId: optionId('outfitPresetAId', '套裝：豹紋蕾絲抹胸喇叭牛仔'),
    outfitPresetAColorId: optionId('outfitPresetAColorId', '金色'),
    outfitPresetBId: optionId('outfitPresetBId', '套裝：網紗掛脖背心牛仔迷你裙'),
    outfitPresetBColorId: optionId('outfitPresetBColorId', '深棕色'),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
  });

  const subject = gptSection(prompt, 'Subject');

  assert.equal(gptSection(prompt, 'Wardrobe'), '');
  assert.match(subject, /Woman 1:\nHas [\s\S]*\. Wears gold leopard-pattern strapless corset top, lace bust cups, long front ribbon ties, low-rise flared jeans, platform sandals, dominant fabric color controlled by the outfit color selection\./);
  assert.match(subject, /Woman 2:\nHas [\s\S]*\. Wears dark brown sheer mesh halter camisole, visible lace bra layer, denim micro mini skirt, stacked waist jewelry, platform sandals, dominant fabric color controlled by the outfit color selection\./);
  assert.doesNotMatch(subject, /coordinated but clearly distinct outfits|avoid identical garment colors|avoid matching top colors|keep each woman styling visually separate/i);
  assert.doesNotMatch(subject, /distinct outfit-visible editorial|complete wardrobe visible on both women|visible torso and wardrobe details|no headshot-only crop/i);
});

test('Gpt duo role cards keep shared special outfits without internal guard text', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '2',
    specialOutfitId: optionId('specialOutfitId', '藍灰長外套蕾絲胸衣寬褲造型'),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
  });

  const subject = gptSection(prompt, 'Subject');
  const woman1 = gptDuoRoleCard(subject, 1);
  const woman2 = gptDuoRoleCard(subject, 2);

  assert.equal(gptSection(prompt, 'Wardrobe'), '');
  assert.match(woman1, /Wears avant-garde blue-gray tailored street look/i);
  assert.match(woman1, /oversized blue-gray long coat worn open/i);
  assert.match(woman2, /Wears avant-garde blue-gray tailored street look/i);
  assert.match(woman2, /round gold statement sunglasses/i);
  assert.match(woman2, /pale blue sticker-patch handbag/i);
  assert.doesNotMatch(subject, /complete special outfit:|complete wardrobe visible|no additional clothing or accessory overrides/i);
});

test('Gpt duo role cards keep role special outfits without guard text', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '2',
    specialOutfitAId: optionId('specialOutfitAId', '藍灰長外套蕾絲胸衣寬褲造型'),
    specialOutfitBId: optionId('specialOutfitBId', '米色潑染破壞工裝套裝造型'),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
  });

  const subject = gptSection(prompt, 'Subject');
  const woman1 = gptDuoRoleCard(subject, 1);
  const woman2 = gptDuoRoleCard(subject, 2);

  assert.equal(gptSection(prompt, 'Wardrobe'), '');
  assert.match(woman1, /Wears avant-garde blue-gray tailored street look/i);
  assert.match(woman1, /round gold statement sunglasses/i);
  assert.match(woman1, /coordinated editorial street-fashion styling/i);
  assert.match(woman2, /Wears distressed painter-workwear street look/i);
  assert.match(woman2, /fuzzy multicolor frayed bucket hat/i);
  assert.match(woman2, /coordinated deconstructed workwear styling/i);
  assert.doesNotMatch(subject, /complete special outfit:|complete wardrobe visible|no additional clothing or accessory overrides/i);
});

test('Grok/Z-Image duo prompt uses compact role sections', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '2',
    locationId: optionId('locationId', '戶外：社區自動販賣機旁'),
    outfitPresetAId: optionId('outfitPresetAId', '套裝：深灰短背心氣球寬褲'),
    completeLookPaletteAId: optionId('completeLookPaletteAId', '深藍丹寧'),
    outfitPresetBId: optionId('outfitPresetBId', '套裝：網紗掛脖背心牛仔迷你裙'),
    completeLookPaletteBId: optionId('completeLookPaletteBId', '銀灰金屬'),
    duoExpressionId: optionId('duoExpressionId', '彼此大笑｜自然開心'),
    duoPoseId: optionId('duoPoseId', '時尚雜誌雙人模特兒'),
    framingId: optionId('framingId', '全無'),
    angleId: optionId('angleId', '全無'),
    orbitId: optionId('orbitId', '全無'),
    lensId: optionId('lensId', '全無'),
    apertureId: optionId('apertureId', '全無'),
    shutterId: optionId('shutterId', '全無'),
    opticalEffectId: optionId('opticalEffectId', '全無'),
    lightingId: optionId('lightingId', '藍天白雲'),
    lightDirectionId: optionId('lightDirectionId', '全無'),
    styleId: optionId('styleId', '上田義彥｜靜默自然暗調'),
    filmId: optionId('filmId', '富士 Superia 青綠陰影底片'),
  });

  const zPrompt = prompt.zImagePrompt;
  const woman1 = zImageSection(prompt, 'Woman 1');
  const woman2 = zImageSection(prompt, 'Woman 2');

  assert.match(zPrompt, /^Image Type:\nCreate a photorealistic editorial portrait\./i);
  assert.match(zImageSection(prompt, 'Subject'), /^Two stunning seductive 20-year-old Japanese or Korean women\./);
  assert.ok(zPrompt.indexOf('\nSubject:\n') < zPrompt.indexOf('\nWoman 1:\n'));
  assert.ok(zPrompt.indexOf('\nWoman 1:\n') < zPrompt.indexOf('\nWoman 2:\n'));
  assert.ok(zPrompt.indexOf('\nWoman 2:\n') < zPrompt.indexOf('\nShared Expression:\n'));
  assert.ok(zPrompt.indexOf('\nShared Expression:\n') < zPrompt.indexOf('\nPose and Composition:\n'));
  assert.ok(zPrompt.indexOf('\nPose and Composition:\n') < zPrompt.indexOf('\nScene:\n'));
  assert.ok(zPrompt.indexOf('\nScene:\n') < zPrompt.indexOf('\nLighting:\n'));
  assert.ok(zPrompt.indexOf('\nLighting:\n') < zPrompt.indexOf('\nCamera Look:\n'));
  assert.match(woman1, /^Has [\s\S]+\bWears /);
  assert.match(woman1, /cropped sleeveless tank[\s\S]*balloon wide pants[\s\S]*deep indigo denim color family/i);
  assert.match(woman2, /^Has [\s\S]+\bWears /);
  assert.match(woman2, /sheer mesh halter camisole[\s\S]*denim micro mini skirt[\s\S]*silver, graphite, and metallic gray color family/i);
  assert.match(zImageSection(prompt, 'Shared Expression'), /laugh naturally with each other/i);
  assert.match(zImageSection(prompt, 'Pose and Composition'), /posing like fashion magazine models/i);
  assert.match(zImageSection(prompt, 'Scene'), /Japanese residential vending-machine corner/i);
  assert.match(zImageSection(prompt, 'Lighting'), /clear blue-sky daylight/i);
  assert.match(zImageSection(prompt, 'Camera Look'), /Yoshihiko Ueda[\s\S]*Fujifilm Superia/i);
  assert.doesNotMatch(zPrompt, /controlled by .*color selection|dominant .*color|main .*color|contrast .*controlled/i);
  assert.doesNotMatch(zPrompt, /coordinated but clearly distinct outfits|avoid identical garment colors|avoid matching top colors|keep each woman styling visually separate/i);
  assert.doesNotMatch(zPrompt, /natural photographic detail|do not add visible text/i);
});

test('Grok/Z-Image prompt remains natural language with blank-line paragraphs and AI uses a compact natural sentence', () => {
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

  assert.match(prompt.zImagePrompt, /^Create a photorealistic editorial portrait\./);
  assert.match(prompt.zImagePrompt, /\n\nA 20s seductive stunning Japanese or Korean woman(?:\.| with)/);
  assertNaturalZImageParagraphs(prompt, 'outfit preset z-image prompt');
  assert.match(prompt.zImagePrompt, /\n\nScene: The portrait takes place in horizonless seamless matte deep black color field/i);
  assert.doesNotMatch(prompt.zImagePrompt, /^Subject Count:/m);
  assert.doesNotMatch(prompt.zImagePrompt, /multi-cut sequence n=2/);
  assert.doesNotMatch(prompt.midjourneyPrompt, /^(Image Type|Scene|Subject|Wardrobe):/m);
  assert.doesNotMatch(prompt.midjourneyPrompt, /multi-cut sequence n=2/);
  assert.match(prompt.midjourneyPrompt, /^Create a photorealistic editorial portrait\./);
  assert.match(prompt.midjourneyPrompt, /\n\nA 20s seductive stunning Japanese or Korean woman(?:\.|,)/);
  assert.doesNotMatch(prompt.midjourneyPrompt, /20-year-old|defined eyes and lips/i);
  assert.match(prompt.midjourneyPrompt, /deep black color field/);
  assert.match(prompt.midjourneyPrompt, /Wearing [^\n]*flight attendant uniform outfit/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /standing with natural relaxed standing arrangement; arms crossed loosely/i);
  assert.match(prompt.midjourneyPrompt, /Inspired by /i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /\b(Lighting|Camera look|Pose and composition|Keep):/i);
  assert.ok(prompt.midjourneyPrompt.length < prompt.zImagePrompt.length);
});

test('Grok/Z-Image and AI keep selected lighting and camera controls with model-specific compression', () => {
  const [prompt] = generatePrompts(1, {
    ...createAllNoneLocks(),
    locationId: optionId('locationId', '室內：深邃黑幕'),
    lightingId: optionId('lightingId', '室內午後柔亮日光'),
    lightDirectionId: optionId('lightDirectionId', '暖金黃昏色溫'),
    styleId: optionId('styleId', '橫浪修｜群像留白秩序'),
    lensId: optionId('lensId', '135mm 長焦壓縮'),
    opticalEffectId: optionId('opticalEffectId', '前景遮擋散景'),
    filmId: optionId('filmId', '日系亮膚高彩濾鏡'),
  });

  assert.match(gptSection(prompt, 'Lighting'), /indoor late-afternoon daylight environment[\s\S]*warm-neutral daylight spread[\s\S]*warm golden-amber subject light color[\s\S]*no sunset or sky cues/);
  assert.match(gptSection(prompt, 'Camera Look'), /high-key minimalist portraiture[\s\S]*flattened spatial layers[\s\S]*meaningful partial frame coverage[\s\S]*vivid saturation[\s\S]*clean deep blacks/);

  assertNaturalZImageParagraphs(prompt, 'compressed imaging z-image prompt');
  assert.match(prompt.zImagePrompt, /indoor late-afternoon daylight environment, bright softened room illumination/i);
  assert.match(prompt.zImagePrompt, /(?:honey-amber subject light|honey-orange cast) on skin and clothing/i);
  assert.match(prompt.zImagePrompt, /Inspired by Osamu Yokonami, high-key minimalist image language/i);
  assert.match(prompt.zImagePrompt, /shot on 135mm long telephoto lens, strong background compression, narrow field of view/i);
  assert.match(prompt.zImagePrompt, /blurred foreground occlusion near the lens[\s\S]*thick near-field bokeh veil[\s\S]*clear opening toward the subject/i);
  assert.match(prompt.zImagePrompt, /glossy Japanese portrait color grade[\s\S]*creamy pale highlights[\s\S]*warm peach skin-tone protection[\s\S]*cyan-green shadows/i);
  assert.doesNotMatch(prompt.zImagePrompt, /warm-neutral daylight spread|mellow exterior brightness|no sunset or sky cues/i);
  assert.doesNotMatch(prompt.zImagePrompt, /high-key minimalist portraiture|generous negative space|flattened spatial layers|distant working distance|meaningful partial frame coverage|vivid saturation|clean deep blacks/i);

  assert.doesNotMatch(prompt.midjourneyPrompt, /indoor late-afternoon daylight/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /warm honey-amber subject light/i);
  assert.match(prompt.midjourneyPrompt, /Inspired by Osamu Yokonami, high-key minimalist image language/i);
  assert.match(prompt.midjourneyPrompt, /135mm long telephoto lens/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /soft foreground occlusion/i);
  assert.match(prompt.midjourneyPrompt, /Inspired by Osamu Yokonami/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /warm-neutral daylight spread|mellow exterior brightness|no sunset or sky cues/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /flattened spatial layers|pronounced subject isolation|distant working distance|meaningful partial frame coverage|vivid saturation|clean deep blacks/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /[\u4e00-\u9fff]/);
  assert.ok(prompt.midjourneyPrompt.length < prompt.zImagePrompt.length);
});

test('Grok/Z-Image and AI use model-specific compact scene wording for solid color studio scenes', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    locationId: optionId('locationId', '室內：純潔白幕'),
    outfitPresetId: optionId('outfitPresetId', '套裝：空服員制服'),
    outerwearId: optionId('outerwearId', '全無'),
    poseId: optionId('poseId', '站姿｜雙臂交疊'),
    lightingId: optionId('lightingId', '全無'),
    lightDirectionId: optionId('lightDirectionId', '全無'),
    styleId: optionId('styleId', '全無'),
    lensId: optionId('lensId', '全無'),
    apertureId: optionId('apertureId', '全無'),
    shutterId: optionId('shutterId', '全無'),
    opticalEffectId: optionId('opticalEffectId', '全無'),
    filmId: optionId('filmId', '全無'),
  });

  assert.match(
    prompt.zImagePrompt,
    /\n\nScene: The portrait takes place in horizonless seamless matte pure white color field, continuous white ground-and-background plane blending into a solid white void, full-bleed white surface(?:, subtle natural contact shadow under the subject)?\./
  );
  assert.doesNotMatch(prompt.zImagePrompt, /no paper roll|no backdrop stand|no light stands|no studio equipment/i);
  assert.doesNotMatch(prompt.zImagePrompt, /Scene priority:/i);

  assert.match(prompt.midjourneyPrompt, /in horizonless seamless matte pure white color field,/i);
  assert.match(prompt.midjourneyPrompt, /\n\nIn horizonless seamless matte pure white color field/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /no paper roll|no studio equipment/i);
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
        /Scene: The portrait takes place/i,
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
        /For self-shot capture, allow close-lens proximity, off-center crop, and incomplete set visibility/i,
        /lazy drained presence/i,
        /Keep the fixed lounge architecture stable\. Vary only subject placement, pose, crop, lighting, and mood/i,
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
        framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
      },
      expected: [
        /triangle bikini top/i,
        /denim shorts/i,
        /Kowloon Walled City interior passage/i,
        /arms crossed loosely[\s\S]*presents a natural relaxed standing pose/i,
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
        /bodycon silhouette/i,
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
        /She wears black gothic Y2K lace punk look/i,
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
        /one hand applying lipstick directly to the lips/i,
        /visible hand-to-mouth contact/i,
        /clean application and a slightly smudged lip line/i,
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

test('Grok/Z-Image keeps subject, wardrobe, pose, and scene order across single wardrobe modes', () => {
  const wardrobeCases = [
    {
      name: 'outfit preset',
      locks: {
        outfitPresetId: optionId('outfitPresetId', '套裝：透視背心漆皮短褲長靴'),
      },
      wardrobePattern: /^She wears .*cropped sheer fitted tank top/i,
    },
    {
      name: 'special outfit',
      locks: {
        specialOutfitId: optionId('specialOutfitId', '黑色哥德蕾絲短袖熱褲長靴造型'),
      },
      wardrobePattern: /^She wears .*gothic Y2K lace punk look/i,
    },
    {
      name: 'dress',
      locks: {
        dressId: optionId('dressId', '連身：短版｜一字領哥德迷你洋裝'),
      },
      wardrobePattern: /^She wears .*off-shoulder gothic mini dress/i,
    },
    {
      name: 'separates',
      locks: {
        topId: optionId('topId', '棉質細肩背心'),
        pantsId: optionId('pantsId', '直筒牛仔褲'),
      },
      wardrobePattern: /^She wears .*cotton camisole top/i,
    },
  ];

  for (const wardrobeCase of wardrobeCases) {
    const [prompt] = generatePrompts(1, {
      ...createAllNoneLocks(),
      subjectCount: '1',
      framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
      locationId: optionId('locationId', '室內：英倫復古窗邊房間'),
      poseBaseId: optionId('poseBaseId', '站姿'),
      ...wardrobeCase.locks,
    });
    const paragraphs = zImageParagraphs(prompt);
    const canonicalPose = gptSection(prompt, 'Pose and Composition');
    const subjectIndex = paragraphs.findIndex((paragraph) => /A 20s seductive stunning Japanese or Korean woman/i.test(paragraph));
    const wardrobeIndex = paragraphs.findIndex((paragraph) => wardrobeCase.wardrobePattern.test(paragraph));
    const poseIndex = paragraphs.findIndex((paragraph) => paragraph === canonicalPose);
    const sceneIndex = paragraphs.findIndex((paragraph) => /^Scene: The portrait takes place/i.test(paragraph));

    assert.ok(subjectIndex >= 0, `${wardrobeCase.name}: expected a subject paragraph`);
    assert.ok(wardrobeIndex >= 0, `${wardrobeCase.name}: expected a wardrobe paragraph`);
    assert.ok(poseIndex >= 0, `${wardrobeCase.name}: expected the canonical pose paragraph`);
    assert.ok(sceneIndex >= 0, `${wardrobeCase.name}: expected a scene paragraph`);
    assert.ok(subjectIndex < wardrobeIndex, `${wardrobeCase.name}: expected subject before wardrobe`);
    assert.ok(wardrobeIndex < poseIndex, `${wardrobeCase.name}: expected wardrobe before pose`);
    assert.ok(poseIndex < sceneIndex, `${wardrobeCase.name}: expected pose before scene`);
  }
});

test('chest-up framing keeps only the visible Body Type chest anchor', () => {
  const [prompt] = generatePrompts(1, {
    ...createAllNoneLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '胸上特寫'),
    bodyTypeId: optionId('bodyTypeId', '柔和沙漏身形'),
    topId: optionId('topId', '棉質細肩背心'),
  });

  for (const output of [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt]) {
    assert.match(output, /fuller bust/i);
    assert.doesNotMatch(output, /soft natural hourglass body/i);
    assert.doesNotMatch(output, /visual height|90-62-94 body proportion anchor|torso-to-leg ratio/i);
    assert.doesNotMatch(output, /wider hips|longer upper torso|lower waistline|elongated abdomen/i);
  }
  assert.match(prompt.zImagePrompt, /cotton camisole top/i);
});

test('chest-up framing shares visible pose fragments while Z-Image removes camera and scene pressure', () => {
  const [prompt] = generatePrompts(1, {
    ...createAllNoneLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '胸上特寫'),
    locationId: optionId('locationId', '室內：狹小都會旅館房間'),
    outfitPresetId: optionId('outfitPresetId', '套裝：透視背心漆皮短褲長靴'),
    poseBaseId: optionId('poseBaseId', '坐姿'),
    poseArrangementId: optionId('poseArrangementId', '坐姿身體前傾'),
    poseHandId: optionId('poseHandId', '一手撐地一手放腿上'),
    poseHeadId: optionId('poseHeadId', '側臉看向遠方'),
    angleId: optionId('angleId', '膝蓋高度鏡頭'),
    expressionId: optionId('expressionId', '直視鏡頭｜平靜淡然'),
  });

  const canonicalPose = prompt.grokPrompt.match(/Pose and Composition:\n([^\n]+)/)?.[1] || '';
  assert.match(canonicalPose, /upper-body pose with the upper body angled forward/i);
  assert.match(canonicalPose, /head turned into a clean side profile/i);
  assert.doesNotMatch(canonicalPose, /grounded forward-leaning seated pose|sitting on the floor|supporting on floor|resting on the leg/i);
  assert.equal(prompt.zImagePrompt.split(canonicalPose).length - 1, 1);
  assert.equal(prompt.midjourneyPrompt.split(canonicalPose).length - 1, 1);
  assert.doesNotMatch(prompt.zImagePrompt, /legs and shoes emphasized/i);
  assert.match(prompt.zImagePrompt, /face oriented away from the camera/i);
  assert.doesNotMatch(prompt.zImagePrompt, /clear spatial context/i);
  assert.match(prompt.zImagePrompt, /small urban hotel room, compact bedding, practical lamp fixtures/i);
  assert.doesNotMatch(prompt.zImagePrompt, /narrow bedside table|close wall surfaces|luggage corner|enclosed room layout/i);
  assert.doesNotMatch(prompt.zImagePrompt, /without widening the portrait crop|softly blurred|faint spatial shapes/i);
});

test('AI duo prompt uses compact labeled role sections', () => {
  const originalRandom = Math.random;
  Math.random = () => 0.5;
  let prompt;
  try {
    [prompt] = generatePrompts(1, {
      ...createEmptyLocks(),
      subjectCount: '2',
      locationId: optionId('locationId', '戶外：大阪道頓堀心齋橋河道'),
      outfitPresetAId: optionId('outfitPresetAId', '套裝：白蕾絲長罩衫牛仔褲'),
      completeLookPaletteAId: optionId('completeLookPaletteAId', '深藍丹寧'),
      outfitPresetBId: optionId('outfitPresetBId', '套裝：運動外套荷葉七分褲'),
      completeLookPaletteBId: optionId('completeLookPaletteBId', '銀灰金屬'),
      duoPoseId: optionId('duoPoseId', '好朋友之間的親密自拍'),
      duoPoseBaseId: optionId('duoPoseBaseId', '行走中'),
      framingId: optionId('framingId', '全無'),
      angleId: optionId('angleId', '全無'),
      orbitId: optionId('orbitId', '全無'),
      lensId: optionId('lensId', '全無'),
      apertureId: optionId('apertureId', 'f/2.0 強背景分離'),
      shutterId: optionId('shutterId', '全無'),
      opticalEffectId: optionId('opticalEffectId', '全無'),
      lightingId: optionId('lightingId', '正午烈日'),
      lightDirectionId: optionId('lightDirectionId', '頂部照明'),
      styleId: optionId('styleId', '市橋織江｜透明自然低飽和'),
      filmId: optionId('filmId', '柯達 Portra 暖膚底片'),
    });
  } finally {
    Math.random = originalRandom;
  }

  const aiPrompt = prompt.midjourneyPrompt;
  assert.match(aiPrompt, /^Create a photorealistic editorial portrait\./);
  assert.match(aiPrompt, /\n\nWoman 1:/);
  assert.ok(aiPrompt.indexOf('\n\nWoman 1:') < aiPrompt.indexOf('\n\nWoman 2:'));
  assert.ok(aiPrompt.indexOf('\n\nWoman 2:') < aiPrompt.indexOf('\n\nPose:'));
  assert.ok(aiPrompt.indexOf('\n\nPose:') < aiPrompt.indexOf('\n\nScene:'));
  assert.ok(aiPrompt.indexOf('\n\nScene:') < aiPrompt.indexOf('\n\nLighting:'));
  assert.ok(aiPrompt.indexOf('\n\nLighting:') < aiPrompt.indexOf('\n\nCamera Look:'));
  assert.match(aiSection(prompt, 'Woman 1'), /^Has [\s\S]+\bWears .*long white lace robe cardigan[\s\S]*ripped light blue jeans[\s\S]*brown leather shoulder bag[\s\S]*burgundy ballet flats/i);
  assert.match(aiSection(prompt, 'Woman 2'), /^Has [\s\S]+\bWears .*navy zip-up track jacket[\s\S]*white ruffled camisole[\s\S]*black cropped jogger pants[\s\S]*black ballet flats[\s\S]*silver shoulder bag\./i);
  assert.match(aiSection(prompt, 'Pose'), /intimate best-friends selfie moment[\s\S]*casual affectionate body language[\s\S]*playful candid interaction[\s\S]*walking or mid-step/i);
  assert.match(aiSection(prompt, 'Scene'), /Dotonbori Shinsaibashi riverside edge in Osaka[\s\S]*iconic billboard signage[\s\S]*canal water visible below/i);
  assert.match(aiSection(prompt, 'Lighting'), /harsh midday environment[\s\S]*overhead summer sun position[\s\S]*downward facial shadows/i);
  assert.match(aiSection(prompt, 'Camera Look'), /transparent natural-light image language[\s\S]*f\/2\.0-style large-aperture portrait depth[\s\S]*Kodak Portra film rendering/i);
  assert.doesNotMatch(aiPrompt, /^Image Type:/m);
  assert.doesNotMatch(aiPrompt, /^Subject:/m);
  assert.doesNotMatch(aiPrompt, /complete outfit palette direction|multi-piece color variation/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /multi-cut sequence n=2/);
});

test('AI prompt keeps special outfit clothing core while dropping accessory-heavy styling', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    specialOutfitId: optionId('specialOutfitId', '黑色哥德蕾絲短袖熱褲長靴造型'),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    poseId: optionId('poseId', '站姿｜雙臂交疊'),
  });

  assert.match(prompt.midjourneyPrompt, /Wearing black gothic Y2K lace punk look/i);
  assert.match(prompt.midjourneyPrompt, /fitted black short-sleeve top/i);
  assert.match(prompt.midjourneyPrompt, /distressed black denim micro shorts/i);
  assert.match(prompt.midjourneyPrompt, /black slouchy knee-high leather boots/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /rosary|necklace|wrist cuffs|bracelets/i);
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

  assert.match(presetPrompt.midjourneyPrompt, /Wearing [^\n]*nurse uniform outfit/i);
  assert.doesNotMatch(presetPrompt.midjourneyPrompt, /short white nurse dress|medical apron|white cap/i);
  assert.match(dressPrompt.midjourneyPrompt, /Wearing [^\n]*glossy latex mini dress/i);
  assert.doesNotMatch(dressPrompt.midjourneyPrompt, /wearing a glossy latex mini dress|one-piece short mini silhouette|smooth glossy latex/i);
});

test('AI prompt keeps the first complete dress phrase without structural dress details', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    dressId: optionId('dressId', '連身：短版｜亮面深V掛脖迷你洋裝'),
    dressColorId: optionId('dressColorId', '淡藍色'),
    topId: optionId('topId', '全無'),
    pantsId: optionId('pantsId', '全無'),
    skirtId: optionId('skirtId', '全無'),
    outerwearId: optionId('outerwearId', '全無'),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    poseId: optionId('poseId', '站姿｜雙臂交疊'),
  });

  assert.match(prompt.zImagePrompt, /She wears light blue glossy deep-V halter mini dress, bodycon silhouette, plunging neckline, open shoulder line, short hem/i);
  assert.match(prompt.midjourneyPrompt, /wearing light blue glossy deep-V halter mini dress/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /wearing a mini dress|bodycon silhouette|plunging neckline|open shoulder line|short hem/i);
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

  assert.match(prompt.midjourneyPrompt, /Wearing tight long-sleeve button-up shirt outfit, tight bodycon mini skirt/i);
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

  assert.match(prompt.midjourneyPrompt, /Wearing solid satin cheongsam mini outfit/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /the cheongsam body in neon yellow/i);
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

test('face-only prompts keep close-up composition when wardrobe is visibility-filtered', () => {
  const [prompt] = generatePrompts(1, {
    ...createAllNoneLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '臉部特寫'),
    orbitId: optionId('orbitId', '左前 45 度'),
    locationId: optionId('locationId', '室內：廢棄校舍體育器材室'),
    lightingId: optionId('lightingId', '室內窗邊日光'),
    lightDirectionId: optionId('lightDirectionId', '側逆光'),
    earringsId: optionId('earringsId', '十字垂墜耳環'),
    topId: optionId('topId', '透膚刺繡襯衫'),
    pantsId: optionId('pantsId', '直筒牛仔褲'),
    shoesId: optionId('shoesId', '高跟鞋'),
  });

  assert.match(prompt.grokPrompt, /Tight face close-up(?:, shoulder-level view)?, front-left three-quarter view/i);

  assert.match(prompt.zImagePrompt, /Tight face close-up(?:, shoulder-level view)?, front-left three-quarter view/i);
  assert.doesNotMatch(prompt.zImagePrompt, /\bwoman\. with\b/i);
  assert.doesNotMatch(prompt.zImagePrompt, /front three-quarter torso angle|torso toward camera/i);
  assert.doesNotMatch(prompt.zImagePrompt, /semi-sheer embroidered shirt|straight-leg jeans|stiletto pumps/i);

  assert.match(prompt.midjourneyPrompt, /tight face close-up|face fills the frame/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /semi-sheer embroidered shirt|straight-leg jeans|stiletto pumps/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /[\u3400-\u9fff]/);
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

  assert.match(prompt.midjourneyPrompt, /Wearing [^\n]*triangle bikini top[\s\S]*(?:denim shorts|denim)/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /slim halter strings|minimal sliding triangle cups|compact fitted seat/i);
});

test('AI prompt keeps top and bottom garments for arbitrary separates', () => {
  const baseLocks = {
    ...createAllNoneLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
  };

  const [tieShirtPrompt] = generatePrompts(1, {
    ...baseLocks,
    topId: optionId('topId', '領帶襯衫'),
    topColorId: optionId('topColorId', '白色'),
    pantsId: optionId('pantsId', '皮革短褲'),
    bottomColorId: optionId('bottomColorId', '螢光綠色'),
    bottomRiseId: optionId('bottomRiseId', '低腰'),
    bottomFitId: optionId('bottomFitId', '緊身'),
  });

  assert.match(tieShirtPrompt.midjourneyPrompt, /white collared shirt with a short soft necktie/i);
  assert.match(tieShirtPrompt.midjourneyPrompt, /neon green leather shorts/i);
  assert.doesNotMatch(tieShirtPrompt.midjourneyPrompt, /[\u3400-\u9fff]/);

  const [sweaterPrompt] = generatePrompts(1, {
    ...baseLocks,
    topId: optionId('topId', '長版寬鬆麻花針織毛衣'),
    topColorId: optionId('topColorId', '白色'),
    topStylingId: optionId('topStylingId', '自然放出'),
    pantsId: optionId('pantsId', 'leggings'),
    bottomColorId: optionId('bottomColorId', '螢光綠色'),
    bottomRiseId: optionId('bottomRiseId', '低腰'),
    bottomFitId: optionId('bottomFitId', '緊身'),
  });

  assert.match(sweaterPrompt.midjourneyPrompt, /white oversized cable-knit sweater/i);
  assert.match(sweaterPrompt.midjourneyPrompt, /neon green leggings/i);
  assert.doesNotMatch(sweaterPrompt.midjourneyPrompt, /[\u3400-\u9fff]/);
});

test('Grok/Z-Image uses X-prompt wardrobe wording without guard clauses for representative looks', () => {
  const baseLocks = {
    ...createAllNoneLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
  };
  const noZGuard = /top length meets|top hem overlaps|top hem worn naturally|waistband sitting on the hips|body-skimming lower-body fit|realistic outer-to-inner dressing order|outerwear remains a coherent outer layer|inner garment appears at natural openings|thin straps read as the inner|outerwear keeps its own shoulder construction|jacket body still readable|legwear stays secondary|long bottom keeps/i;

  const [tieShirtPrompt] = generatePrompts(1, {
    ...baseLocks,
    topId: optionId('topId', '領帶襯衫'),
    topColorId: optionId('topColorId', '白色'),
    pantsId: optionId('pantsId', '皮革短褲'),
    bottomColorId: optionId('bottomColorId', '螢光綠色'),
    bottomRiseId: optionId('bottomRiseId', '低腰'),
    bottomFitId: optionId('bottomFitId', '緊身'),
  });
  assert.match(gptSection(tieShirtPrompt, 'Wardrobe'), /top length meets or slightly overlaps the low-rise waistband/i);
  assert.match(zImageWardrobeParagraph(tieShirtPrompt), /white collared shirt with a short soft necktie/i);
  assert.match(zImageWardrobeParagraph(tieShirtPrompt), /neon green leather shorts/i);
  assert.doesNotMatch(zImageWardrobeParagraph(tieShirtPrompt), noZGuard);

  const [sweaterPrompt] = generatePrompts(1, {
    ...baseLocks,
    topId: optionId('topId', '長版寬鬆麻花針織毛衣'),
    topColorId: optionId('topColorId', '白色'),
    topStylingId: optionId('topStylingId', '自然放出'),
    pantsId: optionId('pantsId', 'leggings'),
    bottomColorId: optionId('bottomColorId', '螢光綠色'),
    bottomRiseId: optionId('bottomRiseId', '低腰'),
    bottomFitId: optionId('bottomFitId', '緊身'),
  });
  assert.match(zImageWardrobeParagraph(sweaterPrompt), /white oversized cable-knit sweater/i);
  assert.match(zImageWardrobeParagraph(sweaterPrompt), /neon green leggings/i);
  assert.doesNotMatch(zImageWardrobeParagraph(sweaterPrompt), noZGuard);

  const [outerwearPrompt] = generatePrompts(1, {
    ...baseLocks,
    outerwearId: optionId('outerwearId', '丹寧外套'),
    outerwearColorId: optionId('outerwearColorId', '深灰色'),
    outerwearOpeningId: optionId('outerwearOpeningId', '敞開穿'),
    outerwearStylingId: optionId('outerwearStylingId', '滑落肩部'),
    topId: optionId('topId', '襯衫'),
    topColorId: optionId('topColorId', '米白色'),
    skirtId: optionId('skirtId', '百褶短裙'),
    legwearId: optionId('legwearId', '羅紋短襪'),
    legwearColorId: optionId('legwearColorId', '白色'),
    shoesId: optionId('shoesId', 'Samba OG'),
    shoesColorId: optionId('shoesColorId', '白色'),
  });
  assert.match(zImageWardrobeParagraph(outerwearPrompt), /dark grey denim jacket, washed denim texture, chest pockets, metal buttons/i);
  assert.match(zImageWardrobeParagraph(outerwearPrompt), /outerwear worn open at the front, front panels parted naturally/i);
  assert.match(zImageWardrobeParagraph(outerwearPrompt), /slipped below the shoulder line, sleeves loosely on the arms/i);
  assert.match(zImageWardrobeParagraph(outerwearPrompt), /layered over off-white shirt/i);
  assert.match(zImageWardrobeParagraph(outerwearPrompt), /pleated mini skirt/i);
  assert.doesNotMatch(zImageWardrobeParagraph(outerwearPrompt), noZGuard);

  const [techwearPrompt] = generatePrompts(1, {
    ...baseLocks,
    outerwearId: optionId('outerwearId', '賽博反光科技風衣'),
    outerwearColorId: optionId('outerwearColorId', '淺灰色'),
    outerwearPatternId: optionId('outerwearPatternId', '粗橫條紋'),
    topId: optionId('topId', '棉質細肩背心'),
    topColorId: optionId('topColorId', '粉紅色'),
    skirtId: optionId('skirtId', '網紗長裙'),
    bottomColorId: optionId('bottomColorId', '紅色'),
  });
  assert.match(gptSection(techwearPrompt, 'Wardrobe'), /light grey iridescent reflective techwear trench coat/i);
  assert.doesNotMatch(gptSection(techwearPrompt, 'Wardrobe'), noZGuard);
  assert.match(zImageWardrobeParagraph(techwearPrompt), /light grey iridescent reflective techwear trench coat, waterproof shell texture/i);
  assert.match(zImageWardrobeParagraph(techwearPrompt), /bold horizontal stripes across the outerwear/i);
  assert.match(zImageWardrobeParagraph(techwearPrompt), /layered over pink cotton camisole top/i);
  assert.match(zImageWardrobeParagraph(techwearPrompt), /red mesh maxi skirt/i);
  assert.doesNotMatch(zImageWardrobeParagraph(techwearPrompt), /futuristic long outerwear structure|bold horizontal stripe outerwear|clearly defined stripe bands across the jacket/i);
  assert.doesNotMatch(zImageWardrobeParagraph(techwearPrompt), noZGuard);

  const [bikiniPrompt] = generatePrompts(1, {
    ...baseLocks,
    topId: optionId('topId', '比基尼上身'),
    topColorId: optionId('topColorId', '白色'),
    pantsId: optionId('pantsId', '比基尼下身'),
    bottomColorId: optionId('bottomColorId', '白色'),
  });
  assert.match(zImageWardrobeParagraph(bikiniPrompt), /white triangle bikini top (?:with|,) slim halter strings/i);
  assert.match(zImageWardrobeParagraph(bikiniPrompt), /white low-rise side-tie bikini bottoms/i);
  assert.doesNotMatch(zImageWardrobeParagraph(bikiniPrompt), noZGuard);

  const [lacePrompt] = generatePrompts(1, {
    ...baseLocks,
    topId: optionId('topId', '蕾絲胸罩'),
    topColorId: optionId('topColorId', '黑色'),
    pantsId: optionId('pantsId', '蕾絲內褲'),
    bottomColorId: optionId('bottomColorId', '黑色'),
  });
  assert.match(zImageWardrobeParagraph(lacePrompt), /black lace bra top, delicate shoulder straps/i);
  assert.match(zImageWardrobeParagraph(lacePrompt), /black low-rise lace panties/i);
  assert.doesNotMatch(zImageWardrobeParagraph(lacePrompt), noZGuard);
});

test('AI prompt uses simplified X-prompt wardrobe wording for representative looks', () => {
  const baseLocks = {
    ...createAllNoneLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
  };

  const [lacePrompt] = generatePrompts(1, {
    ...baseLocks,
    topId: optionId('topId', '蕾絲胸罩'),
    topColorId: optionId('topColorId', '黑色'),
    pantsId: optionId('pantsId', '蕾絲內褲'),
    bottomColorId: optionId('bottomColorId', '黑色'),
  });
  assert.match(lacePrompt.midjourneyPrompt, /Wearing black lace bra top, (?:black low-rise lace panties|lingerie bottoms)/i);
  assert.doesNotMatch(lacePrompt.midjourneyPrompt, /gothic lace street look|top length|waistband|[\u3400-\u9fff]/i);

  const [dressPrompt] = generatePrompts(1, {
    ...baseLocks,
    dressId: optionId('dressId', '連身：短版｜細肩帶蕾絲棉質迷你洋裝'),
    dressColorId: optionId('dressColorId', '米白色'),
  });
  assert.match(dressPrompt.midjourneyPrompt, /wearing off-white spaghetti-strap lace cotton mini dress/i);
  assert.doesNotMatch(dressPrompt.midjourneyPrompt, /delicate lace trim|short hem|one-piece|[\u3400-\u9fff]/i);
});

test('AI prompt keeps a compact imaging simulation cue', () => {
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
    /high-acutance snapshot rendering, snap-focus clarity/i
  );
  assert.doesNotMatch(prompt.midjourneyPrompt, /crisp APS-C-like color response|candid compact-camera texture/i);
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
  assert.match(prompt.grokPrompt, /arms crossed loosely[\s\S]*presents a natural relaxed standing pose/i);
  assert.match(prompt.grokPrompt, /\n\nmulti-cut sequence n=2$/);

  assert.match(prompt.zImagePrompt, /Shibuya Scramble Crossing remains visible around and behind the subject/i);
  assert.match(prompt.zImagePrompt, /flight attendant uniform outfit/i);
  assert.match(prompt.zImagePrompt, /arms crossed loosely[\s\S]*presents a natural relaxed standing pose/i);
  assert.doesNotMatch(prompt.zImagePrompt, /multi-cut sequence n=2/);

  assert.match(prompt.midjourneyPrompt, /Shibuya Scramble Crossing remains visible around and behind the subject/i);
  assert.match(prompt.midjourneyPrompt, /flight attendant uniform/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /standing with natural relaxed standing arrangement; arms crossed loosely/i);
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

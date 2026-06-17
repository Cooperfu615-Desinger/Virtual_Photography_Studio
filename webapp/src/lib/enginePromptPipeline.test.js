import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls } from './engine.js';

function optionId(controlKey, zh) {
  const control = getLockControls().find((entry) => entry.key === controlKey);
  const option = control.options.find((entry) => entry.zh === zh);
  assert.ok(option, `Expected option ${zh} in ${controlKey}`);
  return option.id;
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
  assert.match(prompt.grokPrompt, /\nConstraints:\n/);
  assert.match(prompt.grokPrompt, /preserve the selected wardrobe as complete, realistic clothing/i);
  assert.doesNotMatch(prompt.grokPrompt, /no nudity|fully clothed|clothing covers the body/i);
  assert.match(prompt.grokPrompt, /\n\nmulti-cut sequence n=2$/);
  assert.doesNotMatch(prompt.grokPrompt, /^Subject Count:/m);
});

test('Grok/Z-Image prompt remains natural language and AI uses a legacy minimal paragraph', () => {
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
  assert.doesNotMatch(prompt.zImagePrompt, /^Subject Count:/m);
  assert.doesNotMatch(prompt.zImagePrompt, /multi-cut sequence n=2/);
  assert.doesNotMatch(prompt.midjourneyPrompt, /^(Image Type|Scene|Subject|Wardrobe):/m);
  assert.doesNotMatch(prompt.midjourneyPrompt, /multi-cut sequence n=2/);
  assert.match(prompt.midjourneyPrompt, /^A seductive stunning 20-year-old Japanese or Korean woman/);
  assert.match(prompt.midjourneyPrompt, /deep black color field/);
  assert.match(prompt.midjourneyPrompt, /wearing .*flight attendant uniform outfit/);
  assert.match(prompt.midjourneyPrompt, /standing pose with loosely crossed arms/);
  assert.match(prompt.midjourneyPrompt, /captured (?:in film photography style|as a moody film still|as an editorial film still)/);
  assert.doesNotMatch(prompt.midjourneyPrompt, /\b(Lighting|Camera look|Pose and composition|Keep):/i);
  assert.ok(prompt.midjourneyPrompt.length < prompt.zImagePrompt.length);
});

test('AI prompt uses a legacy minimal natural paragraph with wardrobe, pose, scene, and mood tail', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '2',
    locationId: optionId('locationId', '室內：九龍城寨內部狹窄走道'),
    outfitPresetAId: optionId('outfitPresetAId', '套裝：BDSM 束縛'),
    outfitPresetBId: optionId('outfitPresetBId', '套裝：泳裝度假'),
    duoPoseId: optionId('duoPoseId', '性感互動'),
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
  assert.match(prompt.midjourneyPrompt, /flight attendant uniform outfit/i);
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

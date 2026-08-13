import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls } from './engine.js';
import { stripMidjourneyParameterTail } from './engine/midjourneyParameterTail.js';

function control(key) {
  const found = getLockControls().find((entry) => entry.key === key);
  assert.ok(found, `Missing control ${key}`);
  return found;
}

function optionId(controlKey, zh) {
  const option = control(controlKey).options.find((entry) => entry.zh === zh);
  assert.ok(option, `Expected option ${zh} in ${controlKey}`);
  return option.id;
}

function optionIdByRawId(controlKey, id) {
  const option = control(controlKey).options.find((entry) => entry.id === id);
  assert.ok(option, `Expected option id ${id} in ${controlKey}`);
  return option.id;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function gptSection(prompt, label) {
  const sectionLabels = ['Image Type', 'Subject', 'Wardrobe', 'Pose and Composition', 'Scene', 'Lighting', 'Camera Look'];
  const labelPattern = sectionLabels.map(escapeRegExp).join('|');
  const match = prompt.grokPrompt.match(new RegExp(`(?:^|\\n\\n)${escapeRegExp(label)}:\\n([\\s\\S]*?)(?=\\n\\n(?:${labelPattern}):|\\n\\nmulti-cut sequence n=2|$)`));
  assert.ok(match, `Expected ${label} section in Gpt prompt`);
  return match[1].trim();
}

function promptParagraphs(value) {
  return value.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);
}

test('fixed composition controls expose fixed sets and fixed-set-only option groups', () => {
  assert.deepEqual(
    control('fixedCompositionSetId').options.map((entry) => entry.zh),
    ['全無', '清水模牆面沙發棚', '暖灰泥黑絲絨工業沙發棚', '高級飯店落地窗都市夜景', '高級飯店落地窗富士山春景', '高級飯店落地窗富士山冬景', '復古磁磚浴室浴缸', '海邊坡道平交道', '海邊階梯小巷']
  );

  assert.ok(control('fixedSetPositionId').options.some((entry) => entry.zh === '沙發座面中央'));
  assert.ok(control('fixedSetPositionId').options.some((entry) => entry.zh === '自由場景互動'));
  assert.ok(control('fixedSetPositionId').options.some((entry) => entry.id === 'hotel-free-interaction'));
  assert.ok(control('fixedSetPositionId').options.some((entry) => entry.zh === '床邊靠窗'));
  assert.ok(control('fixedSetPositionId').options.some((entry) => entry.zh === '浴缸前景遮擋'));
  assert.ok(control('fixedSetPositionId').options.some((entry) => entry.id === 'bathtub-free-interaction'));
  assert.ok(control('fixedSetPositionId').options.some((entry) => entry.zh === '沙發扶手前景遮擋'));
  assert.ok(control('fixedSetPositionId').options.some((entry) => entry.zh === '床單前景遮擋'));
  assert.ok(control('fixedSetPositionId').options.some((entry) => entry.zh === '泡泡前景遮擋'));
  assert.ok(control('fixedSetPositionId').options.some((entry) => entry.id === 'crossing-road-free-interaction'));
  assert.ok(control('fixedSetPositionId').options.some((entry) => entry.zh === '坡道平交道旁'));
  assert.ok(control('fixedSetPositionId').options.some((entry) => entry.id === 'stair-alley-free-interaction'));
  assert.ok(control('fixedSetPositionId').options.some((entry) => entry.zh === '階梯中段欄杆旁'));

  assert.deepEqual(
    control('fixedSetBackgroundStateId').options.map((entry) => entry.zh),
    ['全無', '空無一人', '稀疏路人', '普通生活瞬間', '清空平交道', '電車經過中', '少量生活車輛']
  );

  assert.deepEqual(
    control('fixedSetCaptureModeId').options.map((entry) => entry.zh),
    ['全無', '攝影師拍攝', '自然自拍感', '失控自拍感']
  );
  assert.deepEqual(
    control('fixedSetPerformanceStateId').options.map((entry) => entry.zh),
    ['全無', '模型自然發揮', '自信力量感', '慵懶無力感', '冷淡疏離感', '俏皮挑釁感', '安靜脆弱感', '都市疲憊感', '夢遊恍神感', '優雅克制感', '失控隨性感']
  );
});

test('outdoor fixed compositions add locked coastal road and stair sets with background state control', () => {
  const cases = [
    {
      setZh: '海邊坡道平交道',
      positionId: 'crossing-road-free-interaction',
      backgroundZh: '電車經過中',
      setText: /within a real-scale outdoor coastal downhill-road fixed composition set/,
      anchorText: /railway crossing gate cuts across the lower-middle frame/,
      cameraText: /camera is positioned near the upper slope, looking downhill along the road plane toward the ocean horizon/,
      backgroundText: /one local train may pass across the railway crossing/,
      zBackgroundText: /One local train passes through the middle distance/,
      gptIntegrityText: /Keep the selected outdoor architecture stable; vary only subject placement, pose, crop, lighting, mood, and selected background life state inside the same real-scale set/,
      gptReplacementText: /Do not shift into generic beach, train station, train-dominant scene, city intersection, cafe, indoor set, or unrelated coastal road\./,
      aiText: /(?:The central scene is|In(?: The portrait takes place)?)[\s\S]*(?:coastal downhill road|outdoor coastal downhill-road)/,
    },
    {
      setZh: '海邊階梯小巷',
      positionId: 'stair-alley-free-interaction',
      backgroundZh: '稀疏路人',
      setText: /within a real-scale outdoor descending seaside stair-alley fixed composition set/,
      anchorText: /Descending pale stairs form the foreground and midground path toward the sea/,
      cameraText: /camera is positioned near the upper stairs, looking down the stair alley toward the ocean horizon/,
      backgroundText: /a few distant pedestrians may appear as small background life details/,
      zBackgroundText: /A few small distant pedestrians add sparse background life/,
      gptIntegrityText: /Keep the selected outdoor architecture stable; vary only subject placement, pose, crop, lighting, mood, and selected background life state inside the same real-scale set/,
      gptReplacementText: /Do not shift into indoor staircase, generic beach, city alley without stairs, cafe, plain street, train crossing, or unrelated stairway\./,
      aiText: /(?:The central scene is|In(?: The portrait takes place)?)[\s\S]*(?:descending seaside stair alley|outdoor descending seaside stair-alley)/,
    },
  ];

  cases.forEach((fixedSetCase) => {
    const [prompt] = generatePrompts(1, {
      ...createEmptyLocks(),
      fixedCompositionSetId: optionId('fixedCompositionSetId', fixedSetCase.setZh),
      fixedSetPositionId: optionIdByRawId('fixedSetPositionId', fixedSetCase.positionId),
      fixedSetBackgroundStateId: optionId('fixedSetBackgroundStateId', fixedSetCase.backgroundZh),
      fixedSetCaptureModeId: optionId('fixedSetCaptureModeId', '全無'),
      fixedSetPerformanceStateId: optionId('fixedSetPerformanceStateId', '全無'),
      angleId: optionId('angleId', '肩部高度鏡頭'),
      orbitId: optionId('orbitId', '右前 315 度'),
      locationId: optionId('locationId', '戶外：日本住宅外樓梯間'),
      lightingId: optionId('lightingId', '室內暖色夜景'),
      lightDirectionId: optionId('lightDirectionId', '局部暖光'),
    });

    assert.equal(prompt.selection.fixedSetBackgroundStateId, optionId('fixedSetBackgroundStateId', fixedSetCase.backgroundZh));
    assert.equal(prompt.selection.locationId, optionId('locationId', '全無'));
    assert.equal(prompt.selection.angleId, optionId('angleId', '全無'));
    assert.equal(prompt.selection.orbitId, optionId('orbitId', '全無'));
    assert.notEqual(prompt.selection.lightingId, optionId('lightingId', '室內暖色夜景'));
    assert.notEqual(prompt.selection.lightDirectionId, optionId('lightDirectionId', '局部暖光'));
    assert.match(prompt.grokPrompt, fixedSetCase.setText);
    assert.match(prompt.grokPrompt, fixedSetCase.anchorText);
    assert.match(prompt.grokPrompt, fixedSetCase.cameraText);
    assert.match(prompt.grokPrompt, fixedSetCase.backgroundText);
    assert.match(prompt.grokPrompt, fixedSetCase.gptIntegrityText);
    assert.match(prompt.grokPrompt, fixedSetCase.gptReplacementText);
    assert.doesNotMatch(prompt.grokPrompt, /preserve anchors:|avoid generic beach|avoid indoor staircase/);
    assert.doesNotMatch(prompt.grokPrompt, /shoulder-level camera|camera at the subject's front-right/);
    assert.doesNotMatch(prompt.grokPrompt, /indoor warm night ambience|local warm practical-light pool/);
    assert.match(prompt.grokPrompt, /\n\nmulti-cut sequence n=2$/);

    assert.match(prompt.zImagePrompt, fixedSetCase.setText);
    assert.match(prompt.zImagePrompt, fixedSetCase.anchorText);
    assert.match(prompt.zImagePrompt, fixedSetCase.cameraText);
    assert.match(prompt.zImagePrompt, fixedSetCase.zBackgroundText);
    assert.doesNotMatch(prompt.zImagePrompt, /fixed-set rule:|preserve anchors:|avoid generic beach|avoid indoor staircase|Keep the fixed|Vary only/);
    assert.doesNotMatch(prompt.zImagePrompt, /shoulder-level camera|camera at the subject's front-right/);

    assert.match(prompt.midjourneyPrompt, fixedSetCase.aiText);
    assert.doesNotMatch(prompt.midjourneyPrompt, /fixed-set rule:|preserve anchors:/);
  });
});

test('fixed composition capture mode and performance state can be set to none', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    fixedCompositionSetId: optionId('fixedCompositionSetId', '清水模牆面沙發棚'),
    fixedSetPositionId: optionId('fixedSetPositionId', '沙發座面中央'),
    fixedSetCaptureModeId: optionId('fixedSetCaptureModeId', '全無'),
    fixedSetPerformanceStateId: optionId('fixedSetPerformanceStateId', '全無'),
  });

  assert.equal(prompt.selection.fixedSetCaptureModeId, optionId('fixedSetCaptureModeId', '全無'));
  assert.equal(prompt.selection.fixedSetPerformanceStateId, optionId('fixedSetPerformanceStateId', '全無'));
  assert.doesNotMatch(prompt.grokPrompt, /Fixed Set Capture Mode:/);
  assert.doesNotMatch(prompt.grokPrompt, /Fixed Set Performance State:/);
  assert.doesNotMatch(prompt.zImagePrompt, /photographer-shot fixed set portrait|self-shot social composition feeling|model natural performance/);
  assert.doesNotMatch(prompt.midjourneyPrompt, /photographer-shot fixed set portrait|self-shot social composition feeling|model natural performance/);
});

test('sofa fixed composition keeps flexible camera angle and orbit while overriding normal location, PAGE3 import, framing, lens, and optical effect', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    fixedCompositionSetId: optionId('fixedCompositionSetId', '清水模牆面沙發棚'),
    fixedSetPositionId: optionId('fixedSetPositionId', '自由場景互動'),
    fixedSetCaptureModeId: optionId('fixedSetCaptureModeId', '攝影師拍攝'),
    fixedSetPerformanceStateId: optionId('fixedSetPerformanceStateId', '自信力量感'),
    importedWorldSceneMode: 'architecture',
    importedWorldSceneLabel: '東京｜澀谷 Scramble Crossing',
    importedWorldSceneArchitectureText: 'world-scene architecture for the portrait: Shibuya should not remain',
    sceneAttributeId: 'outdoor',
    locationId: optionId('locationId', '戶外：首爾聖水洞街區'),
    aspectRatio: optionId('aspectRatio', '9:16 手機直式'),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    angleId: optionId('angleId', '肩部高度鏡頭'),
    orbitId: optionId('orbitId', '右前 315 度'),
    lensId: optionId('lensId', '135mm 長焦壓縮'),
    opticalEffectId: optionId('opticalEffectId', '前景遮擋散景'),
    lightingId: optionId('lightingId', '室內暖色夜景'),
    lightDirectionId: optionId('lightDirectionId', '局部暖光'),
    styleId: optionId('styleId', '森山大道｜噪訊黑白暗調'),
    filmId: optionId('filmId', '高銳利快照黑位'),
  });

  assert.equal(prompt.selection.fixedCompositionSetId, optionId('fixedCompositionSetId', '清水模牆面沙發棚'));
  assert.equal(prompt.selection.fixedSetPositionId, optionId('fixedSetPositionId', '自由場景互動'));
  assert.equal(prompt.selection.fixedSetCaptureModeId, optionId('fixedSetCaptureModeId', '攝影師拍攝'));
  assert.equal(prompt.selection.fixedSetPerformanceStateId, optionId('fixedSetPerformanceStateId', '自信力量感'));
  assert.equal(prompt.selection.aspectRatio, optionId('aspectRatio', '9:16 手機直式'));
  assert.equal(prompt.selection.locationId, optionId('locationId', '全無'));
  assert.equal(prompt.selection.importedWorldSceneMode, 'none');
  assert.equal(prompt.selection.sceneAttributeId, '');
  assert.equal(prompt.selection.framingId, optionId('framingId', '全無'));
  assert.equal(prompt.selection.angleId, optionId('angleId', '肩部高度鏡頭'));
  assert.equal(prompt.selection.orbitId, optionId('orbitId', '右前 315 度'));
  assert.equal(prompt.selection.lensId, optionId('lensId', '全無'));
  assert.equal(prompt.selection.opticalEffectId, optionId('opticalEffectId', '全無'));

  assert.match(prompt.grokPrompt, /Scene:\nThe portrait takes place inside a real-scale compact living-room editorial set/);
  assert.doesNotMatch(prompt.grokPrompt, /The portrait takes place in Fixed Composition Set/);
  assert.doesNotMatch(prompt.grokPrompt, /Fixed Composition Set:|Fixed Set Position:|Fixed Set Capture Mode:|Fixed Set Performance State:|Fixed Set Integrity:/);
  assert.match(prompt.grokPrompt, /real-scale compact living-room editorial set/);
  assert.match(prompt.grokPrompt, /large brown vintage Chesterfield leather sofa/);
  assert.match(prompt.grokPrompt, /approximately 3 to 4 meters away from the sofa/);
  assert.match(prompt.grokPrompt, /low coffee table/);
  assert.match(prompt.grokPrompt, /thick rolled armrests, high tufted backrest, deep adult-sized seat cushions, worn leather texture, and believable adult-scale furniture clearly visible/);
  assert.match(prompt.grokPrompt, /art books, a cup, a small lamp, textured cushions, and quiet modern-retro interior props/);
  assert.match(prompt.grokPrompt, /Subject placement can vary across one primary zone within the fixed sofa set: sofa seating plane, floor plane in front of the sofa, coffee-table foreground, armrest edge, wall-side space, decorative side area, off-center negative space, or close foreground layer/);
  assert.match(prompt.grokPrompt, /shoulder-level (?:camera|view)/);
  assert.match(prompt.grokPrompt, /(?:315-degree front-right view|front-right three-quarter view|right profile view)/);
  assert.match(prompt.grokPrompt, /Photographer-shot fixed-set portrait/);
  assert.match(prompt.grokPrompt, /Confident powerful presence/);
  assert.match(prompt.grokPrompt, /Keep the selected room architecture stable; vary only subject placement, pose, crop, camera distance, camera orbit, lighting, and mood inside the same real-scale set/);
  assert.match(prompt.grokPrompt, /Preserve raw-concrete wall, brown Chesterfield sofa, branch-side area, coffee-table foreground as fixed anchors/);
  assert.match(prompt.grokPrompt, /Do not shift into plain studio backdrop, bedroom, cafe, outdoor street, or unrelated room\./);
  assert.doesNotMatch(prompt.grokPrompt, /preserve anchors:|avoid plain studio backdrop/);
  assert.match(prompt.grokPrompt, /Lighting:\n[\s\S]*indoor warm night ambience/);
  assert.match(prompt.grokPrompt, /Lighting:\n[\s\S]*local warm practical-light pool on the subject/);
  assert.match(prompt.grokPrompt, /Camera Look:\n[\s\S]*Daido Moriyama/);
  assert.match(prompt.grokPrompt, /Camera Look:\n[\s\S]*high-acutance snapshot rendering/);
  assert.doesNotMatch(prompt.grokPrompt, /Seoul Seongsu-dong urban corner/);
  assert.doesNotMatch(prompt.grokPrompt, /Shibuya should not remain/);
  assert.doesNotMatch(prompt.grokPrompt, /135mm long telephoto lens/);
  assert.doesNotMatch(prompt.grokPrompt, /blurred foreground occlusion near the lens/);
  assert.doesNotMatch(prompt.grokPrompt, /Aspect Ratio:/);
  assert.doesNotMatch(prompt.grokPrompt, /1:1 square|16:9|9:16|aspect ratio/i);
  assert.match(prompt.grokPrompt, /\n\nmulti-cut sequence n=2$/);

  assert.match(prompt.zImagePrompt, /real-scale compact living-room editorial set/);
  assert.match(prompt.zImagePrompt, /large brown vintage Chesterfield leather sofa/);
  assert.match(prompt.zImagePrompt, /The subject occupies one off-center primary zone near the sofa, floor, coffee table, armrest, wall-side space, or side decor/);
  assert.match(prompt.zImagePrompt, /Shoulder-level (?:camera|view) and (?:315-degree front-right view|front-right (?:three-quarter|profile) view|right profile view)/i);
  assert.doesNotMatch(prompt.zImagePrompt, /Keep the fixed lounge architecture stable|Vary only/);
  assert.doesNotMatch(prompt.zImagePrompt, /approximately 3 to 4 meters away from the sofa|subject placement can vary across one primary zone|fixed-set rule:|preserve anchors:/);
  assert.doesNotMatch(prompt.zImagePrompt, /1:1 square|16:9|9:16|aspect ratio/i);
  assert.doesNotMatch(prompt.zImagePrompt, /multi-cut sequence n=2/);

  assert.match(prompt.midjourneyPrompt, /(?:The central scene is|In(?: The portrait takes place)?)[\s\S]*(?:raw concrete wall|compact living-room editorial set)/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /The subject can interact with the sofa seat/);
  assert.doesNotMatch(prompt.midjourneyPrompt, /real-scale compact living-room editorial set|fixed-set rule:|preserve anchors:/);
  assert.doesNotMatch(
    stripMidjourneyParameterTail(prompt.midjourneyPrompt),
    /1:1 square|16:9|9:16|aspect ratio/i
  );
});

test('black velvet industrial sofa fixed composition shares sofa placement controls with distinct set anchors', () => {
  const sofaFloorPositionId = optionIdByRawId('fixedSetPositionId', 'sofa-floor-off-center');
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    fixedCompositionSetId: optionId('fixedCompositionSetId', '暖灰泥黑絲絨工業沙發棚'),
    fixedSetPositionId: sofaFloorPositionId,
    fixedSetCaptureModeId: optionId('fixedSetCaptureModeId', '全無'),
    fixedSetPerformanceStateId: optionId('fixedSetPerformanceStateId', '全無'),
    angleId: optionId('angleId', '肩部高度鏡頭'),
    orbitId: optionId('orbitId', '右前 315 度'),
    locationId: optionId('locationId', '室內：英倫復古窗邊房間'),
  });

  assert.equal(prompt.selection.fixedCompositionSetId, optionId('fixedCompositionSetId', '暖灰泥黑絲絨工業沙發棚'));
  assert.equal(prompt.selection.fixedSetPositionId, sofaFloorPositionId);
  assert.equal(prompt.selection.locationId, optionId('locationId', '全無'));
  assert.match(prompt.grokPrompt, /Scene:\nThe portrait takes place inside a real-scale compact editorial lounge set/);
  assert.match(prompt.grokPrompt, /warm ivory limewash plaster wall/);
  assert.match(prompt.grokPrompt, /hand-troweled texture/);
  assert.match(prompt.grokPrompt, /large black velvet sofa/);
  assert.match(prompt.grokPrompt, /visible velvet nap, subtle directional fabric sheen, and believable adult-scale furniture clearly visible, not leather or glossy vinyl/);
  assert.match(prompt.grokPrompt, /simple black-framed abstract artwork or irregular antique-brass mirror/);
  assert.match(prompt.grokPrompt, /industrial low coffee table|low coffee table/);
  assert.match(prompt.grokPrompt, /art books, a ceramic cup, a clear glass, and a compact brass or black-metal table lamp/);
  assert.match(prompt.grokPrompt, /approximately 3 to 4 meters away from the sofa/);
  assert.match(prompt.grokPrompt, /Subject on the floor plane near the sofa but off center/);
  assert.match(prompt.grokPrompt, /shoulder-level (?:camera|view)/);
  assert.match(prompt.grokPrompt, /(?:315-degree front-right view|front-right three-quarter view|right profile view)/);
  assert.match(prompt.grokPrompt, /Keep the selected room architecture stable; vary only subject placement, pose, crop, camera distance, camera orbit, lighting, and mood inside the same real-scale set/);
  assert.match(prompt.grokPrompt, /Preserve warm limewash plaster wall, black velvet sofa, wall-art or mirror zone, industrial coffee-table foreground as fixed anchors/);
  assert.match(prompt.grokPrompt, /Do not shift into raw concrete set, brown leather sofa, bare dry-branch decor, plain studio backdrop, bedroom, cafe, outdoor street, or unrelated room\./);
  assert.doesNotMatch(prompt.grokPrompt, /preserve anchors:|avoid raw concrete set/);
  assert.doesNotMatch(prompt.grokPrompt, /large brown vintage Chesterfield leather sofa/);
  assert.doesNotMatch(prompt.grokPrompt, /Bare sculptural dry branches/);
  assert.doesNotMatch(prompt.grokPrompt, /raw concrete wall fills the back plane/);
  assert.match(prompt.grokPrompt, /\n\nmulti-cut sequence n=2$/);

  assert.ok(
    prompt.zImagePrompt.indexOf('A 20s seductive stunning Japanese or Korean woman') <
      prompt.zImagePrompt.indexOf('real-scale compact editorial lounge set'),
    'Expected subject description to appear before the black velvet sofa scene in Z-Image prompt'
  );
  assert.match(prompt.zImagePrompt, /large matte black velvet sofa/);
  assert.match(prompt.zImagePrompt, /low industrial coffee table/);
  assert.match(prompt.zImagePrompt, /Subject on the floor plane near the sofa but off center/);
  assert.doesNotMatch(prompt.zImagePrompt, /visible velvet nap|fixed-set rule:|preserve anchors:/);
  assert.match(prompt.midjourneyPrompt, /(?:The central scene is|In(?: The portrait takes place)?)[\s\S]*warm ivory limewash(?: plaster)? wall[\s\S]*(?:black velvet sofa|compact editorial lounge set)/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /Subject on the floor plane near the sofa/);
});

test('Gpt fixed composition scene uses full-fidelity three-paragraph self-shot format', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    fixedCompositionSetId: optionId('fixedCompositionSetId', '暖灰泥黑絲絨工業沙發棚'),
    fixedSetPositionId: optionId('fixedSetPositionId', '自由場景互動'),
    fixedSetCaptureModeId: optionId('fixedSetCaptureModeId', '自然自拍感'),
    fixedSetPerformanceStateId: optionId('fixedSetPerformanceStateId', '模型自然發揮'),
    angleId: optionId('angleId', '肩部高度鏡頭'),
    orbitId: optionId('orbitId', '右側 270 度'),
  });

  const poseText = gptSection(prompt, 'Pose and Composition');
  const sceneText = gptSection(prompt, 'Scene');
  const sceneParagraphs = sceneText.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);

  assert.equal(sceneParagraphs.length, 3);
  assert.match(sceneParagraphs[0], /^The portrait takes place inside a real-scale compact editorial lounge set/);
  assert.match(sceneParagraphs[0], /warm ivory limewash plaster wall/);
  assert.match(sceneParagraphs[0], /large black velvet sofa/);
  assert.match(sceneParagraphs[0], /industrial low coffee table|low coffee table/);
  assert.match(sceneParagraphs[0], /visible velvet nap, subtle directional fabric sheen, and believable adult-scale furniture clearly visible, not leather or glossy vinyl/);
  assert.match(sceneParagraphs[0], /simple black-framed abstract artwork or irregular antique-brass mirror/);
  assert.match(sceneParagraphs[0], /art books, a ceramic cup, a clear glass, and a compact brass or black-metal table lamp/);
  assert.match(sceneParagraphs[0], /approximately 3 to 4 meters away from the sofa/);
  assert.match(sceneParagraphs[0], /must not replace the set, collapse into a tight portrait, or lose the limewash wall, black velvet sofa, wall-art or mirror zone, and industrial coffee table/);

  assert.match(sceneParagraphs[1], /Subject placement can vary across one primary zone within the fixed sofa set: sofa seating plane, floor plane in front of the sofa, coffee-table foreground, armrest edge, wall-side space, decorative side area, off-center negative space, or close foreground layer\./);
  assert.match(sceneParagraphs[1], /Choose one secondary interaction anchor such as the coffee table edge, art book, cup, lamp light, cushion, armrest, wall surface, side decor, floor plane, or foreground negative space\./);
  assert.match(sceneParagraphs[1], /Self-shot social composition feeling, subject may move close to the lens, off-center partial face or half-body crop allowed, fixed set may remain only as recognizable background fragments, no visible phone required\./);
  assert.match(sceneParagraphs.find((paragraph) => /Use shoulder-level (?:camera|view)/i.test(paragraph)) || '', /Use shoulder-level (?:camera|view) and (?:270-degree right profile|right profile) view within the fixed set\./);
  assert.match(sceneParagraphs[1], /Natural body attitude and expression should align with the selected set position and capture mode\./);

  assert.match(sceneParagraphs[2], /Keep the selected room architecture stable; vary only subject placement, pose, crop, camera distance, camera orbit, lighting, and mood inside the same real-scale set/);
  assert.match(sceneParagraphs[2], /Preserve warm limewash plaster wall, black velvet sofa, wall-art or mirror zone, industrial coffee-table foreground as fixed anchors; keep their relative positions stable\./);
  assert.match(sceneParagraphs[2], /Do not shift into raw concrete set, brown leather sofa, bare dry-branch decor, plain studio backdrop, bedroom, cafe, outdoor street, or unrelated room\./);

  assert.match(poseText, /allow imperfect self-shot framing/);
  assert.doesNotMatch(sceneText, /let the image model choose|preserve anchors:|fixed-set rule:/i);
  assert.match(prompt.zImagePrompt, /Close-lens self-shot framing, off-center crop, incomplete set visibility/);
  assert.doesNotMatch(prompt.zImagePrompt, /self-shot social composition feeling|let the image model choose|fixed-set rule:|preserve anchors:/);
});

test('Gpt fixed composition preserves full-fidelity sofa set and interaction wording', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    fixedCompositionSetId: optionId('fixedCompositionSetId', '暖灰泥黑絲絨工業沙發棚'),
    fixedSetPositionId: optionId('fixedSetPositionId', '自由場景互動'),
    fixedSetCaptureModeId: optionId('fixedSetCaptureModeId', '自然自拍感'),
    fixedSetPerformanceStateId: optionId('fixedSetPerformanceStateId', '模型自然發揮'),
    angleId: optionId('angleId', '肩部高度鏡頭'),
    orbitId: optionId('orbitId', '右側 270 度'),
  });

  const sceneText = gptSection(prompt, 'Scene');
  const sceneParagraphs = promptParagraphs(sceneText);

  assert.equal(sceneParagraphs.length, 3);
  assert.match(sceneParagraphs[0], /visible velvet nap, subtle directional fabric sheen, and believable adult-scale furniture clearly visible, not leather or glossy vinyl/i);
  assert.match(sceneParagraphs[0], /simple black-framed abstract artwork or irregular antique-brass mirror sits on the wall/i);
  assert.match(sceneParagraphs[0], /ceramic cup, a clear glass, and a compact brass or black-metal table lamp/i);
  assert.match(sceneParagraphs[0], /must not replace the set, collapse into a tight portrait, or lose the limewash wall, black velvet sofa, wall-art or mirror zone, and industrial coffee table/i);

  assert.match(sceneParagraphs[1], /close foreground layer/i);
  assert.match(sceneParagraphs[1], /Choose one secondary interaction anchor such as the coffee table edge, art book, cup, lamp light, cushion, armrest, wall surface, side decor, floor plane, or foreground negative space/i);
  assert.match(sceneParagraphs[1], /Avoid defaulting every result to a centered seated sofa pose/i);
  assert.match(sceneParagraphs[1], /self-shot social composition feeling, subject may move close to the lens, off-center partial face or half-body crop allowed/i);

  assert.match(sceneParagraphs[2], /Keep the selected room architecture stable; vary only subject placement, pose, crop, camera distance, camera orbit, lighting, and mood inside the same real-scale set/i);
  assert.match(sceneParagraphs[2], /Preserve warm limewash plaster wall, black velvet sofa, wall-art or mirror zone, industrial coffee-table foreground as fixed anchors; keep their relative positions stable/i);
  assert.match(sceneParagraphs[2], /Do not shift into raw concrete set, brown leather sofa, bare dry-branch decor, plain studio backdrop, bedroom, cafe, outdoor street, or unrelated room/i);
  assert.doesNotMatch(sceneText, /fixed-set rule:|preserve anchors:|replacementGuardEn|Fixed Composition Set:/i);
});

test('Gpt fixed composition preserves full-fidelity hotel window guards', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    fixedCompositionSetId: optionId('fixedCompositionSetId', '高級飯店落地窗富士山春景'),
    fixedSetPositionId: optionIdByRawId('fixedSetPositionId', 'hotel-window-silhouette'),
    fixedSetCaptureModeId: optionId('fixedSetCaptureModeId', '攝影師拍攝'),
    fixedSetPerformanceStateId: optionId('fixedSetPerformanceStateId', '全無'),
    angleId: optionId('angleId', '肩部高度鏡頭'),
    orbitId: optionId('orbitId', '右前 315 度'),
  });

  const sceneText = gptSection(prompt, 'Scene');

  assert.match(sceneText, /oversized near-wall-to-wall panoramic floor-to-ceiling glass wall dominates the back plane/i);
  assert.match(sceneText, /Avoid grid-like window panels, heavy black frames, boxed window sections, many repeated dividers, balcony doors, or apartment-style segmented windows/i);
  assert.match(sceneText, /subtle cherry blossoms or spring foliage that never cover or replace the mountain/i);
  assert.match(sceneText, /The viewpoint may vary around the same fixed Fuji hotel-window set/i);
  assert.match(sceneText, /Subject near the floor-to-ceiling window; the exterior view becomes the dominant background/i);
  assert.match(sceneText, /Preserve broad panoramic glass wall, Mount Fuji spring landscape, bed\/bedding foreground, bedside lamp\/table zone as fixed anchors/i);
  assert.match(sceneText, /Do not shift into heavy window grids, boxed panes, generic city skyline, plain wall, studio backdrop, outdoor mountain scene, onsen ryokan, or unrelated hotel room/i);
  assert.doesNotMatch(sceneText, /fixed-set rule:|preserve anchors:|Fixed Set Integrity:/i);
});

test('Gpt fixed composition preserves bathtub and outdoor full-fidelity guards', () => {
  const [bathtubPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    fixedCompositionSetId: optionId('fixedCompositionSetId', '復古磁磚浴室浴缸'),
    fixedSetPositionId: optionIdByRawId('fixedSetPositionId', 'bathtub-free-interaction'),
    fixedSetCaptureModeId: optionId('fixedSetCaptureModeId', '攝影師拍攝'),
    fixedSetPerformanceStateId: optionId('fixedSetPerformanceStateId', '全無'),
  });
  const bathtubScene = gptSection(bathtubPrompt, 'Scene');

  assert.match(bathtubScene, /shoot from inside the tub, or lose the bathtub, wet floor, tiled wall, sink, and mirror as recognizable anchors/i);
  assert.match(bathtubScene, /towel foreground, foam-covered water surface, close foreground layer, or off-center negative space/i);
  assert.match(bathtubScene, /Choose one secondary interaction anchor such as tub rim, foam, water surface, puddle reflection, sink, mirror, faucet hardware, towel, bath bottle, stool, or wet floor/i);
  assert.match(bathtubScene, /Avoid defaulting every result to a centered soaking pose/i);
  assert.match(bathtubScene, /Do not shift into shower room, pool, spa lobby, bedroom, plain studio backdrop, unrelated bathroom, inside-tub POV, low tub-edge POV, dutch tilt, or tight crop losing the tub body or wet floor/i);
  assert.doesNotMatch(bathtubScene, /fixed-set rule:|preserve anchors:/i);

  const [outdoorPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    fixedCompositionSetId: optionId('fixedCompositionSetId', '海邊坡道平交道'),
    fixedSetPositionId: optionId('fixedSetPositionId', '坡道平交道旁'),
    fixedSetBackgroundStateId: optionId('fixedSetBackgroundStateId', '電車經過中'),
    fixedSetCaptureModeId: optionId('fixedSetCaptureModeId', '攝影師拍攝'),
    fixedSetPerformanceStateId: optionId('fixedSetPerformanceStateId', '全無'),
  });
  const outdoorScene = gptSection(outdoorPrompt, 'Scene');

  assert.match(outdoorScene, /Sky color, cloud shape, sun strength, water brightness, and weather mood are controlled by the selected ambient light and subject-light options, not by this fixed set/i);
  assert.match(outdoorScene, /Keep the road, railway crossing, wires, town edges, and ocean depth readable even when the subject moves or crops into the foreground/i);
  assert.match(outdoorScene, /Do not shift into generic beach, train station, train-dominant scene, city intersection, cafe, indoor set, or unrelated coastal road/i);
  assert.doesNotMatch(outdoorScene, /fixed-set rule:|preserve anchors:/i);
});

test('Grok Z-Image and AI fixed composition scene use compact model-specific wording', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    fixedCompositionSetId: optionId('fixedCompositionSetId', '暖灰泥黑絲絨工業沙發棚'),
    fixedSetPositionId: optionId('fixedSetPositionId', '自由場景互動'),
    fixedSetCaptureModeId: optionId('fixedSetCaptureModeId', '自然自拍感'),
    fixedSetPerformanceStateId: optionId('fixedSetPerformanceStateId', '模型自然發揮'),
    angleId: optionId('angleId', '肩部高度鏡頭'),
    orbitId: optionId('orbitId', '右側 270 度'),
  });

  const zImageParagraphs = promptParagraphs(prompt.zImagePrompt);
  const zSceneParagraph = zImageParagraphs.find((paragraph) => /real-scale compact editorial lounge set/i.test(paragraph)) || '';
  const zInteractionParagraph = zImageParagraphs.find((paragraph) => /The subject occupies one off-center primary zone near the sofa/i.test(paragraph)) || '';

  assert.match(zSceneParagraph, /^The portrait takes place inside a real-scale compact editorial lounge set/);
  assert.match(
    zInteractionParagraph,
    /The subject occupies one off-center primary zone near the sofa, floor, coffee table, armrest, wall-side space, or side decor\. Close-lens self-shot framing, off-center crop, incomplete set visibility\. Shoulder-level (?:camera|view) and (?:270-degree right profile|right profile) view\./i
  );
  assert.doesNotMatch(prompt.zImagePrompt, /Keep the fixed lounge architecture stable|Vary only/);

  assert.match(prompt.midjourneyPrompt, /(?:The central scene is|In(?: The portrait takes place)?)[\s\S]*warm ivory limewash(?: plaster)? wall[\s\S]*(?:black velvet sofa|compact editorial lounge set)/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /The subject can interact with the sofa seat/);

  assert.doesNotMatch(prompt.zImagePrompt, /Treat the fixed set|not a flat backdrop|fixed-set rule|preserve anchors:|avoid raw concrete set|let the image model choose|self-shot social composition feeling/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /Treat the fixed set|not a flat backdrop|fixed-set rule|preserve anchors:|avoid raw concrete set|let the image model choose|self-shot social composition feeling/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, / In /);
  assert.doesNotMatch(prompt.midjourneyPrompt, /\.\s*,/);
  assert.doesNotMatch(prompt.zImagePrompt, /multi-cut sequence n=2/);
  assert.doesNotMatch(prompt.midjourneyPrompt, /[\u3400-\u9fff]/);
});

test('hotel and bathtub fixed compositions preserve camera angle and orbit locks', () => {
  const cases = [
    {
      setZh: '高級飯店落地窗都市夜景',
      positionId: 'hotel-free-interaction',
      angleZh: '肩部高度鏡頭',
      orbitZh: '右前 315 度',
      angleText: /shoulder-level (?:camera|view)/i,
      orbitText: /(?:315-degree front-right view|front-right three-quarter view|right profile view)/,
    },
    {
      setZh: '復古磁磚浴室浴缸',
      positionId: 'bathtub-free-interaction',
      angleZh: '高位俯視鏡頭',
      orbitZh: '左前 45 度',
      angleText: /high camera position|High angle/i,
      orbitText: /45-degree front-left view|front-left three-quarter view/,
    },
  ];

  cases.forEach((cameraCase) => {
    const angleId = optionId('angleId', cameraCase.angleZh);
    const orbitId = optionId('orbitId', cameraCase.orbitZh);
    const [prompt] = generatePrompts(1, {
      ...createEmptyLocks(),
      fixedCompositionSetId: optionId('fixedCompositionSetId', cameraCase.setZh),
      fixedSetPositionId: optionIdByRawId('fixedSetPositionId', cameraCase.positionId),
      angleId,
      orbitId,
    });

    assert.equal(prompt.selection.angleId, angleId);
    assert.equal(prompt.selection.orbitId, orbitId);
    assert.match(prompt.grokPrompt, cameraCase.angleText);
    assert.match(prompt.grokPrompt, cameraCase.orbitText);
    assert.match(prompt.zImagePrompt, cameraCase.angleText);
    assert.match(prompt.zImagePrompt, cameraCase.orbitText);
    assert.match(prompt.midjourneyPrompt, cameraCase.orbitText);
    if (/shoulder-level/i.test(cameraCase.angleText.source)) {
      assert.match(prompt.midjourneyPrompt, /shoulder-level/i);
    }
  });
});

test('hotel window fixed composition uses shared real-scale set structure and free interaction placement', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    fixedCompositionSetId: optionId('fixedCompositionSetId', '高級飯店落地窗都市夜景'),
    fixedSetPositionId: optionIdByRawId('fixedSetPositionId', 'hotel-free-interaction'),
    fixedSetCaptureModeId: optionId('fixedSetCaptureModeId', '攝影師拍攝'),
    fixedSetPerformanceStateId: optionId('fixedSetPerformanceStateId', '都市疲憊感'),
    aspectRatio: optionId('aspectRatio', '9:16 手機直式'),
    locationId: optionId('locationId', '室內：英倫復古窗邊房間'),
  });

  assert.equal(prompt.selection.fixedSetPositionId, 'hotel-free-interaction');
  assert.equal(prompt.selection.aspectRatio, optionId('aspectRatio', '9:16 手機直式'));
  assert.equal(prompt.selection.locationId, optionId('locationId', '全無'));

  assert.match(prompt.grokPrompt, /real-scale luxury hotel room editorial set/);
  assert.match(prompt.grokPrompt, /oversized near-wall-to-wall panoramic floor-to-ceiling glass wall/);
  assert.match(prompt.grokPrompt, /one broad mostly uninterrupted glass plane/);
  assert.match(prompt.grokPrompt, /open, expansive, and lightly reflective/);
  assert.match(prompt.grokPrompt, /Avoid grid-like window panels, heavy black frames, boxed window sections, many repeated dividers, balcony doors, or apartment-style segmented windows/);
  assert.match(prompt.grokPrompt, /approximately 3 to 5 meters away from the bed and glass wall/);
  assert.match(prompt.grokPrompt, /Subject placement can vary across one primary zone within the fixed hotel-window set: bed surface, bed edge, window-side floor plane, bedside-table side, curtain edge, pillow foreground, rumpled-bedding foreground, close foreground layer, or off-center negative space/);
  assert.match(prompt.grokPrompt, /Choose one secondary interaction anchor such as bedding, pillow, open book, wine glass, warm lamp, bedside table, curtain, glass reflection, exterior window view, or room floor/);
  assert.match(prompt.grokPrompt, /Keep the selected room architecture stable; vary only subject placement, pose, crop, camera distance, camera orbit, lighting, and mood inside the same real-scale set/);
  assert.match(prompt.grokPrompt, /Preserve broad panoramic glass wall, New York skyline depth, bed\/bedding foreground, bedside lamp\/table zone as fixed anchors/);
  assert.match(prompt.grokPrompt, /Do not shift into heavy window grids, boxed panes, generic bedroom, plain wall, studio backdrop, outdoor scene, or unrelated hotel room\./);
  assert.doesNotMatch(prompt.grokPrompt, /preserve anchors: broad panoramic glass wall|avoid heavy window grids/);
  assert.doesNotMatch(prompt.grokPrompt, /fixed-scene shared structure|fixed set integrity:|real-scale guard:/);
  assert.match(prompt.grokPrompt, /Urban fatigue presence/);
  assert.doesNotMatch(prompt.grokPrompt, /British vintage room with window-side interior/);
  assert.doesNotMatch(prompt.grokPrompt, /Aspect Ratio:/);
  assert.match(prompt.grokPrompt, /\n\nmulti-cut sequence n=2$/);

  assert.match(prompt.zImagePrompt, /broad panoramic floor-to-ceiling glass wall/);
  assert.match(prompt.zImagePrompt, /The subject occupies one primary zone near the bed, bed edge, window-side floor, bedside table, curtain edge, or pillow foreground/);
  assert.doesNotMatch(prompt.zImagePrompt, /Keep the fixed hotel-window architecture stable|Vary only/);
  assert.doesNotMatch(prompt.zImagePrompt, /oversized near-wall-to-wall|subject placement can vary across one primary zone|fixed-set rule:|preserve anchors:|fixed-scene shared structure|real-scale guard:/);
  assert.doesNotMatch(prompt.zImagePrompt, /1:1 square|16:9|9:16|aspect ratio/i);

  assert.match(prompt.midjourneyPrompt, /(?:The central scene is|In(?: The portrait takes place)?)[\s\S]*panoramic floor-to-ceiling glass wall[\s\S]*New York(?:-style high-rise)? skyline/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /The subject can interact with the bed/);
  assert.doesNotMatch(prompt.midjourneyPrompt, /real-scale luxury hotel room editorial set|subject placement can vary across one primary zone|fixed-set rule:|preserve anchors:/);
  assert.doesNotMatch(
    stripMidjourneyParameterTail(prompt.midjourneyPrompt),
    /1:1 square|16:9|9:16|aspect ratio/i
  );
});

test('Fuji hotel fixed compositions share hotel placement controls and seasonal landscape anchors', () => {
  const hotelWindowPositionId = optionIdByRawId('fixedSetPositionId', 'hotel-window-silhouette');
  const phoneAspectId = optionId('aspectRatio', '9:16 手機直式');
  const indoorLocationId = optionId('locationId', '室內：英倫復古窗邊房間');
  const cases = [
    {
      setZh: '高級飯店落地窗富士山春景',
      anchorText: /Preserve broad panoramic glass wall, Mount Fuji spring landscape, bed\/bedding foreground, bedside lamp\/table zone as fixed anchors/,
      seasonText: /spring Mount Fuji landscape|residual snow on the summit|fresh green foothills|subtle cherry blossoms/,
      replacementText: /Do not shift into heavy window grids, boxed panes, generic city skyline, plain wall, studio backdrop, outdoor mountain scene, onsen ryokan, or unrelated hotel room\./,
    },
    {
      setZh: '高級飯店落地窗富士山冬景',
      anchorText: /Preserve broad panoramic glass wall, snow-covered Mount Fuji winter landscape, bed\/bedding foreground, bedside lamp\/table zone as fixed anchors/,
      seasonText: /snow-covered Mount Fuji|snowy foothills|cold clear air/,
      replacementText: /Do not shift into heavy window grids, boxed panes, generic city skyline, plain wall, studio backdrop, outdoor snowfield, ski resort, onsen ryokan, or unrelated hotel room\./,
    },
  ];

  cases.forEach((fixedSetCase) => {
    const [prompt] = generatePrompts(1, {
      ...createEmptyLocks(),
      fixedCompositionSetId: optionId('fixedCompositionSetId', fixedSetCase.setZh),
      fixedSetPositionId: hotelWindowPositionId,
      fixedSetCaptureModeId: optionId('fixedSetCaptureModeId', '全無'),
      fixedSetPerformanceStateId: optionId('fixedSetPerformanceStateId', '全無'),
      aspectRatio: phoneAspectId,
      locationId: indoorLocationId,
      angleId: optionId('angleId', '肩部高度鏡頭'),
      orbitId: optionId('orbitId', '右前 315 度'),
    });

    assert.equal(prompt.selection.fixedSetPositionId, hotelWindowPositionId);
    assert.equal(prompt.selection.aspectRatio, phoneAspectId);
    assert.equal(prompt.selection.locationId, optionId('locationId', '全無'));
    assert.match(prompt.grokPrompt, /Scene:\nThe portrait takes place inside a real-scale luxury hotel room editorial set/);
    assert.match(prompt.grokPrompt, /oversized near-wall-to-wall panoramic floor-to-ceiling glass wall/);
    assert.match(prompt.grokPrompt, /Mount Fuji/);
    assert.match(prompt.grokPrompt, fixedSetCase.seasonText);
    assert.match(prompt.grokPrompt, /Subject near the floor-to-ceiling window/);
    assert.match(prompt.grokPrompt, /shoulder-level (?:camera|view)/);
    assert.match(prompt.grokPrompt, /(?:315-degree front-right view|front-right three-quarter view|right profile view)/);
    assert.match(prompt.grokPrompt, /Keep the selected room architecture stable; vary only subject placement, pose, crop, camera distance, camera orbit, lighting, and mood inside the same real-scale set/);
    assert.match(prompt.grokPrompt, fixedSetCase.anchorText);
    assert.match(prompt.grokPrompt, fixedSetCase.replacementText);
    assert.doesNotMatch(prompt.grokPrompt, /preserve anchors: broad panoramic glass wall|avoid heavy window grids/);
    assert.doesNotMatch(prompt.grokPrompt, /New York skyline depth/);
    assert.doesNotMatch(prompt.grokPrompt, /New York-style high-rise skyline/);
    assert.doesNotMatch(prompt.grokPrompt, /city towers|city view|city depth|skyline view|city window/);
    assert.doesNotMatch(prompt.grokPrompt, /British vintage room with window-side interior/);
    assert.match(prompt.grokPrompt, /\n\nmulti-cut sequence n=2$/);

    assert.ok(
      prompt.zImagePrompt.indexOf('A 20s seductive stunning Japanese or Korean woman') <
        prompt.zImagePrompt.indexOf('real-scale luxury hotel room editorial set'),
      'Expected subject description to appear before the fixed Fuji hotel scene in Z-Image prompt'
    );
    assert.match(prompt.zImagePrompt, /Mount Fuji/);
    assert.match(prompt.zImagePrompt, /Subject near the floor-to-ceiling window/);
    assert.doesNotMatch(prompt.zImagePrompt, /preserve anchors: broad panoramic glass wall|fixed-set rule:|avoid heavy window grids/);
    assert.match(prompt.midjourneyPrompt, /(?:The central scene is|In(?: The portrait takes place)?)[\s\S]*panoramic floor-to-ceiling glass wall/i);
    assert.match(prompt.midjourneyPrompt, /Mount Fuji/);
    assert.doesNotMatch(prompt.midjourneyPrompt, /real-scale luxury hotel room editorial set|preserve anchors:|fixed-set rule:/);
    assert.doesNotMatch(
      stripMidjourneyParameterTail(prompt.midjourneyPrompt),
      /1:1 square|16:9|9:16|aspect ratio/i
    );
  });
});

test('self-shot fixed composition mode relaxes set, focus, face, and wardrobe completeness guards', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    fixedCompositionSetId: optionId('fixedCompositionSetId', '高級飯店落地窗都市夜景'),
    fixedSetPositionId: optionId('fixedSetPositionId', '近鏡頭床面前景'),
    fixedSetCaptureModeId: optionId('fixedSetCaptureModeId', '失控自拍感'),
    fixedSetPerformanceStateId: optionId('fixedSetPerformanceStateId', '慵懶無力感'),
    outfitPresetId: optionId('outfitPresetId', '套裝：空服員制服'),
    poseBaseId: 'sitting',
    poseArrangementId: 'model-natural-body-arrangement',
    poseHandId: 'model-natural-hand-placement',
  });

  assert.match(prompt.grokPrompt, /oversized near-wall-to-wall panoramic floor-to-ceiling glass wall/);
  assert.match(prompt.grokPrompt, /one broad mostly uninterrupted glass plane/);
  assert.match(prompt.grokPrompt, /open, expansive, and lightly reflective/);
  assert.match(prompt.grokPrompt, /Avoid grid-like window panels, heavy black frames, boxed window sections, many repeated dividers, balcony doors/);
  assert.match(prompt.grokPrompt, /Subject close to the camera or bed foreground/);
  assert.match(prompt.grokPrompt, /Imperfect self-shot camera behavior, focus may fall on the background or set objects instead of the face, subject may be slightly blurred or partially cropped/);
  assert.match(prompt.grokPrompt, /Lazy drained presence/);
  assert.match(prompt.grokPrompt, /flight attendant uniform outfit/);
  assert.match(prompt.grokPrompt, /presents a casual, relaxed, and natural sitting pose/);
  assert.doesNotMatch(prompt.grokPrompt, /Let the image model choose/i);
  assert.doesNotMatch(prompt.grokPrompt, /distinct weight shift limb angles torso orientation and asymmetry/i);
  assert.doesNotMatch(prompt.grokPrompt, /avoid collapsing into a face-only crop/);
  assert.doesNotMatch(prompt.grokPrompt, /clear facial readability/);
  assert.doesNotMatch(prompt.grokPrompt, /preserve the selected environment as a visible, recognizable background/);

  assert.match(prompt.zImagePrompt, /Imperfect close-lens self-shot framing, background-object focus, slight subject blur, off-center crop, incomplete set visibility/);
  assert.match(prompt.zImagePrompt, /broad panoramic floor-to-ceiling glass wall/);
  assert.doesNotMatch(prompt.zImagePrompt, /imperfect self-shot camera behavior|no visible phone required|fixed-set rule:/);
  assert.match(prompt.midjourneyPrompt, /(?:The central scene is|In(?: The portrait takes place)?)[\s\S]*panoramic floor-to-ceiling glass wall[\s\S]*New York(?:-style high-rise)? skyline/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /close-lens self-shot framing/);
  assert.doesNotMatch(prompt.midjourneyPrompt, /focus may fall on the background|oversized near-wall-to-wall|fixed-set rule:/);
});

test('fixed composition prompts reinforce set anchors while allowing self-shot fragments', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    fixedCompositionSetId: optionId('fixedCompositionSetId', '清水模牆面沙發棚'),
    fixedSetPositionId: optionId('fixedSetPositionId', '沙發扶手前景遮擋'),
    fixedSetCaptureModeId: optionId('fixedSetCaptureModeId', '自然自拍感'),
    fixedSetPerformanceStateId: optionId('fixedSetPerformanceStateId', '夢遊恍神感'),
  });

  assert.doesNotMatch(prompt.grokPrompt, /Fixed Composition Set:|Fixed Set Position:|Fixed Set Capture Mode:|Fixed Set Performance State:|Fixed Set Integrity:/);
  assert.match(prompt.grokPrompt, /Keep the selected room architecture stable; vary only subject placement, pose, crop, camera distance, camera orbit, lighting, and mood inside the same real-scale set/);
  assert.match(prompt.grokPrompt, /Do not shift into plain studio backdrop, bedroom, cafe, outdoor street, or unrelated room\./);
  assert.match(prompt.grokPrompt, /Self-shot social composition feeling, subject may move close to the lens, off-center partial face or half-body crop allowed, fixed set may remain only as recognizable background fragments, no visible phone required/);
  assert.doesNotMatch(prompt.grokPrompt, /preserve anchors: raw-concrete wall|avoid plain studio backdrop/);
  assert.doesNotMatch(prompt.grokPrompt, /fixed set integrity:|real-scale guard:|at least one or two selected set anchors/);
  assert.match(prompt.grokPrompt, /Dreamlike dazed presence/);

  assert.match(prompt.zImagePrompt, /Close-lens self-shot framing, off-center crop, incomplete set visibility/);
  assert.match(prompt.zImagePrompt, /large brown vintage Chesterfield leather sofa/);
  assert.doesNotMatch(prompt.zImagePrompt, /self-shot crops may hide set parts|preserve anchors:|real-scale guard:/);
  assert.match(prompt.midjourneyPrompt, /(?:The central scene is|In(?: The portrait takes place)?)[\s\S]*(?:raw concrete wall|compact living-room editorial set)/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /close-lens self-shot framing/);
  assert.doesNotMatch(prompt.midjourneyPrompt, /real-scale compact living-room editorial set|fixed-set rule:|preserve anchors:/);
});

test('bathtub fixed composition keeps a frontal wall plane and sink mirror interaction anchors', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    fixedCompositionSetId: optionId('fixedCompositionSetId', '復古磁磚浴室浴缸'),
    fixedSetPositionId: optionIdByRawId('fixedSetPositionId', 'bathtub-free-interaction'),
    fixedSetCaptureModeId: optionId('fixedSetCaptureModeId', '攝影師拍攝'),
    aspectRatio: optionId('aspectRatio', '9:16 手機直式'),
    angleId: optionId('angleId', '全無'),
    orbitId: optionId('orbitId', '全無'),
  });

  assert.equal(prompt.selection.aspectRatio, optionId('aspectRatio', '9:16 手機直式'));
  assert.equal(prompt.selection.fixedSetPositionId, 'bathtub-free-interaction');
  assert.match(prompt.grokPrompt, /Scene:\nThe portrait takes place inside a real-scale vintage bathroom editorial set/);
  assert.doesNotMatch(prompt.grokPrompt, /The portrait takes place in Fixed Composition Set/);
  assert.doesNotMatch(prompt.grokPrompt, /Fixed Composition Set:|Fixed Set Position:|Fixed Set Integrity:/);
  assert.match(prompt.grokPrompt, /real-scale vintage bathroom editorial set/);
  assert.match(prompt.grokPrompt, /freestanding clawfoot bathtub remains the main horizontal fixture across the lower room plane/);
  assert.match(prompt.grokPrompt, /visible wet tile floor beneath and in front of the bathtub, tub feet, tub rim, and full outer tub wall remaining readable/);
  assert.match(prompt.grokPrompt, /subtle steam, small puddles, water trails, and floor reflections as readable interaction anchors/);
  assert.match(prompt.grokPrompt, /fully soaked from head to toe/);
  assert.match(prompt.grokPrompt, /wet hair, damp skin, and water-clinging wardrobe or bare skin/);
  assert.match(prompt.grokPrompt, /porcelain sink or vanity/);
  assert.match(prompt.grokPrompt, /mirror above the sink/);
  assert.match(prompt.grokPrompt, /approximately 2\.5 to 4 meters away from the bathtub/);
  assert.match(prompt.grokPrompt, /Subject placement can vary across one primary zone within the fixed bathtub set: inside the bathtub, on the bathtub rim, beside the tub on the wet floor, near the sink and mirror, by the chrome faucet hardware, stool-side foreground, towel foreground, foam-covered water surface, close foreground layer, or off-center negative space/);
  assert.match(prompt.grokPrompt, /Photographer-shot fixed-set portrait/);
  assert.match(prompt.grokPrompt, /Keep the selected room architecture stable; vary only subject placement, pose, crop, camera distance, camera orbit, lighting, and mood inside the same real-scale set/);
  assert.match(prompt.grokPrompt, /Preserve horizontal clawfoot bathtub, visible wet floor, aged tile wall, sink\/mirror side zone, bath-prop foreground as fixed anchors/);
  assert.match(prompt.grokPrompt, /Do not shift into shower room, pool, spa lobby, bedroom, plain studio backdrop, unrelated bathroom, inside-tub POV, low tub-edge POV, dutch tilt, or tight crop losing the tub body or wet floor\./);
  assert.doesNotMatch(prompt.grokPrompt, /preserve anchors: horizontal clawfoot bathtub|avoid shower room/);
  assert.doesNotMatch(prompt.grokPrompt, /fixed-scene shared structure|fixed set integrity:|real-scale guard:/);
  assert.doesNotMatch(prompt.grokPrompt, /no diagonal corner view/);
  assert.doesNotMatch(prompt.grokPrompt, /no 3\/4 bathroom angle/);
  assert.doesNotMatch(prompt.grokPrompt, /no side-wall perspective/);
  assert.doesNotMatch(prompt.grokPrompt, /low horizontal camera view from the tub edge/);
  assert.doesNotMatch(prompt.grokPrompt, /camera near the tub edge or waterline/);

  assert.ok(
    prompt.zImagePrompt.indexOf('A 20s seductive stunning Japanese or Korean woman') < prompt.zImagePrompt.indexOf('real-scale vintage bathroom editorial set'),
    'Expected subject description to appear before the fixed bathtub scene in Z-Image prompt'
  );
  assert.doesNotMatch(prompt.zImagePrompt, /The portrait uses The portrait takes place/);
  assert.doesNotMatch(prompt.zImagePrompt, /Fixed Composition Set:|Fixed Set Position:|Fixed Set Integrity:/);
  assert.match(prompt.zImagePrompt, /porcelain sink or vanity/);
  assert.match(prompt.zImagePrompt, /visible wet tile floor/);
  assert.match(prompt.zImagePrompt, /fully soaked from head to toe/);
  assert.match(prompt.zImagePrompt, /The subject occupies one primary zone inside the bathtub, on the tub rim, on the wet floor, near the sink and mirror, or beside the chrome faucet hardware/);
  assert.doesNotMatch(prompt.zImagePrompt, /Keep the fixed bathroom architecture stable|Vary only/);
  assert.doesNotMatch(prompt.zImagePrompt, /subject placement can vary across one primary zone|fixed-set rule:|preserve anchors:|real-scale guard:/);
  assert.match(prompt.midjourneyPrompt, /(?:The central scene is|In(?: The portrait takes place)?)[\s\S]*freestanding clawfoot bathtub/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /The subject can interact with the bathtub/);
  assert.doesNotMatch(prompt.midjourneyPrompt, /subject placement can vary across one primary zone|fixed-set rule:|preserve anchors:/);
});

test('fixed composition sets are ignored for duo mode in V1', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '2',
    fixedCompositionSetId: optionId('fixedCompositionSetId', '復古磁磚浴室浴缸'),
    fixedSetPositionId: optionId('fixedSetPositionId', '浴缸內中央'),
    fixedSetCaptureModeId: optionId('fixedSetCaptureModeId', '自然自拍感'),
    fixedSetPerformanceStateId: optionId('fixedSetPerformanceStateId', '自信力量感'),
    aspectRatio: optionId('aspectRatio', '9:16 手機直式'),
    locationId: optionId('locationId', '戶外：首爾聖水洞街區'),
  });

  assert.equal(prompt.selection.subjectCount, '2');
  assert.equal(prompt.selection.fixedCompositionSetId, 'none');
  assert.equal(prompt.selection.fixedSetPositionId, 'none');
  assert.equal(prompt.selection.fixedSetCaptureModeId, 'photographer-shot');
  assert.equal(prompt.selection.fixedSetPerformanceStateId, 'model-natural');
  assert.equal(prompt.selection.aspectRatio, optionId('aspectRatio', '9:16 手機直式'));
  assert.match(prompt.grokPrompt, /Seoul Seongsu-dong urban corner/);
  assert.doesNotMatch(prompt.grokPrompt, /fixed bathtub portrait composition/);
});

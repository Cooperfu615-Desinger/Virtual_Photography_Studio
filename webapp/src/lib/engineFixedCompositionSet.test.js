import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls } from './engine.js';

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

test('fixed composition controls expose three sets and fixed-set-only option groups', () => {
  assert.deepEqual(
    control('fixedCompositionSetId').options.map((entry) => entry.zh),
    ['全無', '清水模牆面沙發棚', '高級飯店落地窗都市夜景', '復古磁磚浴室浴缸']
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

  assert.deepEqual(
    control('fixedSetCaptureModeId').options.map((entry) => entry.zh),
    ['全無', '攝影師拍攝', '自然自拍感', '失控自拍感']
  );
  assert.deepEqual(
    control('fixedSetPerformanceStateId').options.map((entry) => entry.zh),
    ['全無', '模型自然發揮', '自信力量感', '慵懶無力感', '冷淡疏離感', '俏皮挑釁感', '安靜脆弱感', '都市疲憊感', '夢遊恍神感', '優雅克制感', '失控隨性感']
  );
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
    lightingId: optionId('lightingId', '室內暖光夜景'),
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
  assert.match(prompt.grokPrompt, /selected camera angle and orbit may vary/);
  assert.match(prompt.grokPrompt, /low coffee table/);
  assert.match(prompt.grokPrompt, /subject placement can vary across one primary zone within the fixed sofa set/);
  assert.match(prompt.grokPrompt, /The sofa can support the subject or remain a background architecture anchor/);
  assert.match(prompt.grokPrompt, /Avoid defaulting every result to a centered seated sofa pose/);
  assert.match(prompt.grokPrompt, /shoulder-level camera position/);
  assert.match(prompt.grokPrompt, /camera at the subject's front-right/);
  assert.match(prompt.grokPrompt, /photographer-shot fixed set portrait/);
  assert.match(prompt.grokPrompt, /confident powerful presence/);
  assert.match(prompt.grokPrompt, /Lighting:\n[\s\S]*indoor warm night environment/);
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
  assert.match(prompt.zImagePrompt, /approximately 3 to 4 meters away from the sofa/);
  assert.match(prompt.zImagePrompt, /subject placement can vary across one primary zone within the fixed sofa set/);
  assert.match(prompt.zImagePrompt, /shoulder-level camera position/);
  assert.match(prompt.zImagePrompt, /camera at the subject's front-right/);
  assert.doesNotMatch(prompt.zImagePrompt, /1:1 square|16:9|9:16|aspect ratio/i);
  assert.doesNotMatch(prompt.zImagePrompt, /multi-cut sequence n=2/);

  assert.match(prompt.midjourneyPrompt, /real-scale compact living-room editorial set/);
  assert.match(prompt.midjourneyPrompt, /large brown vintage Chesterfield leather sofa/);
  assert.doesNotMatch(prompt.midjourneyPrompt, /1:1 square|16:9|9:16|aspect ratio/i);
});

test('hotel and bathtub fixed compositions preserve camera angle and orbit locks', () => {
  const cases = [
    {
      setZh: '高級飯店落地窗都市夜景',
      positionId: 'hotel-free-interaction',
      angleZh: '肩部高度鏡頭',
      orbitZh: '右前 315 度',
      angleText: /shoulder-level camera position/,
      orbitText: /camera at the subject's front-right/,
    },
    {
      setZh: '復古磁磚浴室浴缸',
      positionId: 'bathtub-free-interaction',
      angleZh: '高位俯視鏡頭',
      orbitZh: '左前 45 度',
      angleText: /high camera position above the subject's head/,
      orbitText: /camera at the subject's front-left/,
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
    assert.doesNotMatch(prompt.midjourneyPrompt, /shoulder-level camera position|high camera position above the subject's head|camera at the subject's front-right|camera at the subject's front-left/);
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
  assert.match(prompt.grokPrompt, /Avoid grid-like window panels, heavy black frames, boxed window sections/);
  assert.match(prompt.grokPrompt, /approximately 3 to 5 meters away from the bed and glass wall/);
  assert.match(prompt.grokPrompt, /subject-to-bed and subject-to-window scale/);
  assert.match(prompt.grokPrompt, /subject placement can vary across one primary zone within the fixed hotel-window set/);
  assert.match(prompt.grokPrompt, /The bed can support the subject or remain a foreground or side architecture anchor/);
  assert.match(prompt.grokPrompt, /Avoid defaulting every result to a centered bed pose/);
  assert.match(prompt.grokPrompt, /fixed-set rule: stable selected room architecture/);
  assert.match(prompt.grokPrompt, /vary only subject placement, pose, crop, camera distance, camera orbit, lighting, and mood inside the same real-scale set/);
  assert.match(prompt.grokPrompt, /keep adult scale believable against furniture, fixtures, and props/);
  assert.match(prompt.grokPrompt, /avoid enlarging the subject or shrinking set anchors/);
  assert.match(prompt.grokPrompt, /preserve anchors: broad panoramic glass wall, New York skyline depth, bed\/bedding foreground, bedside lamp\/table zone/);
  assert.match(prompt.grokPrompt, /avoid heavy window grids, boxed panes, generic bedroom, plain wall, studio backdrop, outdoor scene, or unrelated hotel room/);
  assert.doesNotMatch(prompt.grokPrompt, /fixed-scene shared structure|fixed set integrity:|real-scale guard:/);
  assert.ok(
    prompt.grokPrompt.indexOf('preserve anchors: broad panoramic glass wall') <
      prompt.grokPrompt.indexOf('avoid heavy window grids'),
    'Expected set-specific anchors to lead the replacement guard'
  );
  assert.match(prompt.grokPrompt, /urban fatigue presence/);
  assert.doesNotMatch(prompt.grokPrompt, /British vintage room with window-side interior/);
  assert.doesNotMatch(prompt.grokPrompt, /Aspect Ratio:/);
  assert.match(prompt.grokPrompt, /\n\nmulti-cut sequence n=2$/);

  assert.match(prompt.zImagePrompt, /oversized near-wall-to-wall panoramic floor-to-ceiling glass wall/);
  assert.match(prompt.zImagePrompt, /subject placement can vary across one primary zone within the fixed hotel-window set/);
  assert.match(prompt.zImagePrompt, /fixed-set rule: stable selected room architecture/);
  assert.match(prompt.zImagePrompt, /preserve anchors: broad panoramic glass wall/);
  assert.doesNotMatch(prompt.zImagePrompt, /fixed-scene shared structure|real-scale guard:/);
  assert.doesNotMatch(prompt.zImagePrompt, /1:1 square|16:9|9:16|aspect ratio/i);

  assert.match(prompt.midjourneyPrompt, /real-scale luxury hotel room editorial set/);
  assert.match(prompt.midjourneyPrompt, /oversized near-wall-to-wall panoramic floor-to-ceiling glass wall/);
  assert.match(prompt.midjourneyPrompt, /subject placement can vary across one primary zone within the fixed hotel-window set/);
  assert.doesNotMatch(prompt.midjourneyPrompt, /1:1 square|16:9|9:16|aspect ratio/i);
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
  assert.match(prompt.grokPrompt, /Avoid grid-like window panels, heavy black frames, boxed window sections, many repeated dividers, balcony doors/);
  assert.match(prompt.grokPrompt, /subject close to the camera or bed foreground/);
  assert.match(prompt.grokPrompt, /focus may fall on the background or set objects instead of the face/);
  assert.match(prompt.grokPrompt, /subject may be slightly blurred or partially cropped/);
  assert.match(prompt.grokPrompt, /fixed set may remain only as recognizable background fragments/);
  assert.match(prompt.grokPrompt, /lazy drained presence/);
  assert.match(prompt.grokPrompt, /flight attendant uniform outfit/);
  assert.match(prompt.grokPrompt, /She is sitting\./);
  assert.doesNotMatch(prompt.grokPrompt, /Let the image model choose/i);
  assert.doesNotMatch(prompt.grokPrompt, /distinct weight shift limb angles torso orientation and asymmetry/i);
  assert.doesNotMatch(prompt.grokPrompt, /avoid collapsing into a face-only crop/);
  assert.doesNotMatch(prompt.grokPrompt, /clear facial readability/);
  assert.doesNotMatch(prompt.grokPrompt, /preserve the selected environment as a visible, recognizable background/);

  assert.match(prompt.zImagePrompt, /imperfect self-shot camera behavior/);
  assert.match(prompt.zImagePrompt, /oversized near-wall-to-wall panoramic floor-to-ceiling glass wall/);
  assert.match(prompt.zImagePrompt, /no visible phone required/);
  assert.match(prompt.midjourneyPrompt, /focus may fall on the background or set objects instead of the face/);
  assert.match(prompt.midjourneyPrompt, /oversized near-wall-to-wall panoramic floor-to-ceiling glass wall/);
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
  assert.match(prompt.grokPrompt, /fixed-set rule: stable selected room architecture/);
  assert.match(prompt.grokPrompt, /preserve anchors: raw-concrete wall, brown Chesterfield sofa, branch-side area, coffee-table foreground/);
  assert.match(prompt.grokPrompt, /avoid enlarging the subject or shrinking set anchors/);
  assert.match(prompt.grokPrompt, /self-shot crops may hide set parts, but at least one selected anchor must remain readable/);
  assert.match(prompt.grokPrompt, /avoid plain studio backdrop, bedroom, cafe, outdoor street, or unrelated room/);
  assert.doesNotMatch(prompt.grokPrompt, /fixed set integrity:|real-scale guard:|at least one or two selected set anchors/);
  assert.match(prompt.grokPrompt, /dreamlike dazed presence/);

  assert.match(prompt.zImagePrompt, /self-shot crops may hide set parts, but at least one selected anchor must remain readable/);
  assert.match(prompt.zImagePrompt, /preserve anchors: raw-concrete wall, brown Chesterfield sofa/);
  assert.doesNotMatch(prompt.zImagePrompt, /real-scale guard:/);
  assert.match(prompt.midjourneyPrompt, /real-scale compact living-room editorial set/);
  assert.match(prompt.midjourneyPrompt, /large brown vintage Chesterfield leather sofa/);
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
  assert.match(prompt.grokPrompt, /visible wet tile floor beneath and in front of the bathtub/);
  assert.match(prompt.grokPrompt, /tub feet, tub rim, and full outer tub wall remaining readable/);
  assert.match(prompt.grokPrompt, /small puddles, water trails, and floor reflections/);
  assert.match(prompt.grokPrompt, /fully soaked from head to toe/);
  assert.match(prompt.grokPrompt, /wet hair, damp skin, and water-clinging wardrobe or bare skin/);
  assert.match(prompt.grokPrompt, /porcelain sink or vanity/);
  assert.match(prompt.grokPrompt, /mirror above the sink/);
  assert.match(prompt.grokPrompt, /approximately 2\.5 to 4 meters away from the bathtub/);
  assert.match(prompt.grokPrompt, /subject-to-bathtub scale/);
  assert.match(prompt.grokPrompt, /subject placement can vary across one primary zone within the fixed bathtub set/);
  assert.match(prompt.grokPrompt, /The bathtub can contain the subject or remain the central fixture anchor/);
  assert.match(prompt.grokPrompt, /Avoid defaulting every result to a centered soaking pose/);
  assert.match(prompt.grokPrompt, /selected camera angle and orbit may vary the viewpoint around the same fixed bathtub set/);
  assert.match(prompt.grokPrompt, /fixed-set rule: stable selected room architecture/);
  assert.match(prompt.grokPrompt, /preserve anchors: horizontal clawfoot bathtub, visible wet floor, aged tile wall, sink\/mirror side zone, bath-prop foreground/);
  assert.match(prompt.grokPrompt, /avoid shower room, pool, spa lobby, bedroom, plain studio backdrop, unrelated bathroom, inside-tub POV, low tub-edge POV, dutch tilt, or tight crop losing the tub body or wet floor/);
  assert.doesNotMatch(prompt.grokPrompt, /fixed-scene shared structure|fixed set integrity:|real-scale guard:/);
  assert.match(prompt.grokPrompt, /inside-tub POV/);
  assert.match(prompt.grokPrompt, /tight crop losing the tub body or wet floor/);
  assert.doesNotMatch(prompt.grokPrompt, /no diagonal corner view/);
  assert.doesNotMatch(prompt.grokPrompt, /no 3\/4 bathroom angle/);
  assert.doesNotMatch(prompt.grokPrompt, /no side-wall perspective/);
  assert.doesNotMatch(prompt.grokPrompt, /low horizontal camera view from the tub edge/);
  assert.doesNotMatch(prompt.grokPrompt, /camera near the tub edge or waterline/);

  assert.ok(
    prompt.zImagePrompt.indexOf('real-scale vintage bathroom editorial set') < prompt.zImagePrompt.indexOf('20-year-old Japanese or Korean female portrait subject'),
    'Expected fixed bathtub scene to appear before subject description in Z-Image prompt'
  );
  assert.doesNotMatch(prompt.zImagePrompt, /The portrait uses The portrait takes place/);
  assert.doesNotMatch(prompt.zImagePrompt, /Fixed Composition Set:|Fixed Set Position:|Fixed Set Integrity:/);
  assert.match(prompt.zImagePrompt, /porcelain sink or vanity/);
  assert.match(prompt.zImagePrompt, /visible wet tile floor beneath and in front of the bathtub/);
  assert.match(prompt.zImagePrompt, /fully soaked from head to toe/);
  assert.match(prompt.zImagePrompt, /subject placement can vary across one primary zone within the fixed bathtub set/);
  assert.match(prompt.zImagePrompt, /fixed-set rule: stable selected room architecture/);
  assert.match(prompt.zImagePrompt, /preserve anchors: horizontal clawfoot bathtub, visible wet floor/);
  assert.doesNotMatch(prompt.zImagePrompt, /real-scale guard:/);
  assert.match(prompt.midjourneyPrompt, /visible wet tile floor beneath and in front of the bathtub/);
  assert.match(prompt.midjourneyPrompt, /subject placement can vary across one primary zone within the fixed bathtub set/);
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

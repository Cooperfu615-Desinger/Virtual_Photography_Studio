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

  assert.match(prompt.grokPrompt, /Fixed Composition Set:/);
  assert.match(prompt.grokPrompt, /real-scale compact living-room editorial set/);
  assert.match(prompt.grokPrompt, /large brown vintage Chesterfield leather sofa/);
  assert.match(prompt.grokPrompt, /approximately 3 to 4 meters away from the sofa/);
  assert.match(prompt.grokPrompt, /selected camera angle and orbit may vary/);
  assert.match(prompt.grokPrompt, /low coffee table/);
  assert.match(prompt.grokPrompt, /subject placement is flexible and chosen naturally as one primary spatial zone/);
  assert.match(prompt.grokPrompt, /Do not default every image to a centered seated sofa pose/);
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
  assert.match(prompt.zImagePrompt, /subject placement is flexible and chosen naturally as one primary spatial zone/);
  assert.match(prompt.zImagePrompt, /shoulder-level camera position/);
  assert.match(prompt.zImagePrompt, /camera at the subject's front-right/);
  assert.doesNotMatch(prompt.zImagePrompt, /1:1 square|16:9|9:16|aspect ratio/i);
  assert.doesNotMatch(prompt.zImagePrompt, /multi-cut sequence n=2/);

  assert.match(prompt.midjourneyPrompt, /real-scale compact living-room editorial set/);
  assert.match(prompt.midjourneyPrompt, /large brown vintage Chesterfield leather sofa/);
  assert.match(prompt.midjourneyPrompt, /approximately 3 to 4 meters away from the sofa/);
  assert.match(prompt.midjourneyPrompt, /subject placement is flexible and chosen naturally as one primary spatial zone/);
  assert.match(prompt.midjourneyPrompt, /shoulder-level camera position/);
  assert.match(prompt.midjourneyPrompt, /camera at the subject's front-right/);
  assert.match(prompt.midjourneyPrompt, /confident powerful presence/);
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
    assert.match(prompt.midjourneyPrompt, cameraCase.angleText);
    assert.match(prompt.midjourneyPrompt, cameraCase.orbitText);
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
  assert.match(prompt.grokPrompt, /subject placement is flexible and chosen naturally as one primary spatial zone within the fixed hotel-window set/);
  assert.match(prompt.grokPrompt, /Do not default every image to a centered subject sitting on the bed/);
  assert.match(prompt.grokPrompt, /fixed-scene shared structure/);
  assert.match(prompt.grokPrompt, /normal adult-scale hotel furniture-to-body relationship/);
  assert.match(prompt.grokPrompt, /urban fatigue presence/);
  assert.doesNotMatch(prompt.grokPrompt, /British vintage room with window-side interior/);
  assert.doesNotMatch(prompt.grokPrompt, /Aspect Ratio:/);
  assert.match(prompt.grokPrompt, /\n\nmulti-cut sequence n=2$/);

  assert.match(prompt.zImagePrompt, /oversized near-wall-to-wall panoramic floor-to-ceiling glass wall/);
  assert.match(prompt.zImagePrompt, /subject placement is flexible and chosen naturally as one primary spatial zone within the fixed hotel-window set/);
  assert.match(prompt.zImagePrompt, /normal adult-scale hotel furniture-to-body relationship/);
  assert.doesNotMatch(prompt.zImagePrompt, /1:1 square|16:9|9:16|aspect ratio/i);

  assert.match(prompt.midjourneyPrompt, /real-scale luxury hotel room editorial set/);
  assert.match(prompt.midjourneyPrompt, /oversized near-wall-to-wall panoramic floor-to-ceiling glass wall/);
  assert.match(prompt.midjourneyPrompt, /subject placement is flexible and chosen naturally as one primary spatial zone within the fixed hotel-window set/);
  assert.match(prompt.midjourneyPrompt, /normal adult-scale hotel furniture-to-body relationship/);
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
  assert.match(prompt.grokPrompt, /Let the image model choose a clearly varied non-default physically believable body arrangement/);
  assert.match(prompt.grokPrompt, /distinct weight shift limb angles torso orientation and asymmetry/);
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

  assert.match(prompt.grokPrompt, /Fixed Set Integrity:/);
  assert.match(prompt.grokPrompt, /raw concrete wall, large brown vintage Chesterfield leather sofa, and bare sculptural branches/);
  assert.match(prompt.grokPrompt, /normal adult-scale furniture-to-body relationship/);
  assert.match(prompt.grokPrompt, /do not enlarge the subject or shrink the sofa/);
  assert.match(prompt.grokPrompt, /at least one or two selected set anchors must remain recognizable/);
  assert.match(prompt.grokPrompt, /do not replace the fixed set with a plain studio backdrop, bedroom, cafe, outdoor street, or unrelated room/);
  assert.match(prompt.grokPrompt, /dreamlike dazed presence/);

  assert.match(prompt.zImagePrompt, /at least one or two selected set anchors must remain recognizable/);
  assert.match(prompt.zImagePrompt, /normal adult-scale furniture-to-body relationship/);
  assert.match(prompt.midjourneyPrompt, /must not replace the set/);
  assert.match(prompt.midjourneyPrompt, /subject-to-furniture scale/);
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
  assert.match(prompt.grokPrompt, /real-scale vintage bathroom editorial set/);
  assert.match(prompt.grokPrompt, /freestanding clawfoot bathtub remains the main horizontal fixture across the lower room plane/);
  assert.match(prompt.grokPrompt, /visible wet tile floor beneath and in front of the bathtub/);
  assert.match(prompt.grokPrompt, /tub feet, tub rim, and full outer tub wall remaining readable/);
  assert.match(prompt.grokPrompt, /small puddles, water trails, and floor reflections/);
  assert.match(prompt.grokPrompt, /fully soaked from head to toe/);
  assert.match(prompt.grokPrompt, /wet hair, damp skin, and water-clinging wardrobe or bare skin/);
  assert.match(prompt.grokPrompt, /porcelain sink or vanity/);
  assert.match(prompt.grokPrompt, /mirror above it/);
  assert.match(prompt.grokPrompt, /approximately 2\.5 to 4 meters away from the bathtub/);
  assert.match(prompt.grokPrompt, /subject-to-bathtub scale/);
  assert.match(prompt.grokPrompt, /subject placement is flexible and chosen naturally as one primary spatial zone within the fixed bathtub set/);
  assert.match(prompt.grokPrompt, /Do not default every image to a centered subject soaking in the tub/);
  assert.match(prompt.grokPrompt, /selected camera angle and orbit may vary the viewpoint around the same fixed bathtub set/);
  assert.match(prompt.grokPrompt, /fixed-scene shared structure/);
  assert.match(prompt.grokPrompt, /normal adult-scale bathroom fixture-to-body relationship/);
  assert.match(prompt.grokPrompt, /no camera from inside the tub/);
  assert.match(prompt.grokPrompt, /no tight crop that removes the tub body or wet floor plane/);
  assert.doesNotMatch(prompt.grokPrompt, /no diagonal corner view/);
  assert.doesNotMatch(prompt.grokPrompt, /no 3\/4 bathroom angle/);
  assert.doesNotMatch(prompt.grokPrompt, /no side-wall perspective/);
  assert.doesNotMatch(prompt.grokPrompt, /low horizontal camera view from the tub edge/);
  assert.doesNotMatch(prompt.grokPrompt, /camera near the tub edge or waterline/);

  assert.match(prompt.zImagePrompt, /porcelain sink or vanity/);
  assert.match(prompt.zImagePrompt, /visible wet tile floor beneath and in front of the bathtub/);
  assert.match(prompt.zImagePrompt, /fully soaked from head to toe/);
  assert.match(prompt.zImagePrompt, /subject placement is flexible and chosen naturally as one primary spatial zone within the fixed bathtub set/);
  assert.match(prompt.zImagePrompt, /normal adult-scale bathroom fixture-to-body relationship/);
  assert.match(prompt.midjourneyPrompt, /mirror above the sink/);
  assert.match(prompt.midjourneyPrompt, /visible wet tile floor beneath and in front of the bathtub/);
  assert.match(prompt.midjourneyPrompt, /fully soaked from head to toe/);
  assert.match(prompt.midjourneyPrompt, /subject placement is flexible and chosen naturally as one primary spatial zone within the fixed bathtub set/);
  assert.match(prompt.midjourneyPrompt, /normal adult-scale bathroom fixture-to-body relationship/);
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

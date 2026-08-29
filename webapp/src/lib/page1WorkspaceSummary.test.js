import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, getLockControls } from './engine.js';
import {
  buildPage1GenerationSummary,
  buildWardrobeLayerInsights,
  buildWorkspaceSummary,
} from './page1WorkspaceSummary.js';

const controls = getLockControls();

const optionId = (key, zh) => {
  const control = controls.find((item) => item.key === key);
  const option = control?.options?.find((item) => item.zh === zh);
  assert.ok(option, `Missing ${zh} for ${key}`);
  return option.id;
};

test('workspace wardrobe summary hides granular top and bottom selections when an outfit preset is active', () => {
  const locks = {
    ...createEmptyLocks(),
    outfitPresetId: optionId('outfitPresetId', '套裝：空服員制服'),
    topId: optionId('topId', '比基尼上身'),
    pantsId: optionId('pantsId', '比基尼下身'),
    topFitId: optionId('topFitId', '緊身'),
    bottomFitId: optionId('bottomFitId', '緊身'),
    bottomRiseId: optionId('bottomRiseId', '超低腰'),
  };

  const summary = buildWorkspaceSummary(locks, controls);
  const insights = buildWardrobeLayerInsights(locks, controls, false, true);

  assert.match(summary.wardrobe.summary, /套裝：空服員制服/);
  assert.doesNotMatch(summary.wardrobe.summary, /比基尼上身|比基尼下身|緊身|超低腰/);
  assert.deepEqual(insights.main, ['套裝：空服員制服']);
});

test('workspace wardrobe summary hides stale separates when a dress is active', () => {
  const locks = {
    ...createEmptyLocks(),
    dressId: optionId('dressId', '連身：短版｜一字領哥德迷你洋裝'),
    topId: optionId('topId', '襯衫'),
    skirtId: optionId('skirtId', '百褶短裙'),
    topFitId: optionId('topFitId', '緊身'),
    topStylingId: optionId('topStylingId', '正常穿著'),
  };

  const summary = buildWorkspaceSummary(locks, controls);
  const insights = buildWardrobeLayerInsights(locks, controls, false, true);

  assert.match(summary.wardrobe.summary, /連身：短版｜一字領哥德迷你洋裝/);
  assert.doesNotMatch(summary.wardrobe.summary, /襯衫|百褶短裙|緊身|正常穿著/);
  assert.deepEqual(insights.main, ['連身：短版｜一字領哥德迷你洋裝']);
});

test('workspace scene summary shows imported PAGE3 world-scene architecture label', () => {
  const summary = buildWorkspaceSummary({
    ...createEmptyLocks(),
    importedWorldSceneMode: 'architecture',
    importedWorldSceneLabel: '東京｜澀谷 Scramble Crossing',
    importedWorldSceneArchitectureText: 'world-scene architecture for the portrait',
  }, controls);

  assert.match(summary.scene.summary, /PAGE3：東京｜澀谷 Scramble Crossing/);
});

test('workspace pose summary is separate from character identity summary', () => {
  const summary = buildWorkspaceSummary({
    ...createEmptyLocks(),
    bodyTypeId: optionId('bodyTypeId', '性感曲線身形'),
    expressionId: optionId('expressionId', '平靜淡然'),
    poseBaseId: 'standing',
    poseHandId: 'one-hand-waist-one-down',
  }, controls);

  assert.match(summary.character.summary, /性感曲線身形/);
  assert.doesNotMatch(summary.character.summary, /平靜淡然|站姿|一手扶腰一手自然放下/);
  assert.match(summary.pose.summary, /平靜淡然|站姿|一手扶腰一手自然放下/);
});

test('workspace pose summary includes the independent prop action', () => {
  const summary = buildWorkspaceSummary({
    ...createEmptyLocks(),
    posePropId: optionId('posePropId', '手持冰咖啡'),
  }, controls);

  assert.match(summary.pose.summary, /手持冰咖啡/);
});

test('generation summary follows the resolved preview selection instead of conflicting raw locks', () => {
  const locks = {
    ...createEmptyLocks(),
    orbitId: optionId('orbitId', '背面 180 度'),
    poseBaseId: 'random',
    poseArrangementId: 'random',
    poseHandId: 'random',
    poseHeadId: 'random',
    poseAnchorId: 'random',
  };
  const previewPrompt = {
    selection: {
      ...locks,
      orbitId: optionId('orbitId', '全無'),
      poseBaseId: 'standing',
      poseArrangementId: 'standing-natural',
      poseHandId: 'selfie-natural-right-arm',
      poseHeadId: 'head-camera-natural',
      poseAnchorId: 'standing-wall',
    },
  };

  const resolvedSummary = buildPage1GenerationSummary(locks, previewPrompt, controls);
  assert.match(resolvedSummary, /站姿|自然站姿|自然自拍|頭部自然朝向鏡頭|靠牆站立/);
  assert.doesNotMatch(resolvedSummary, /背面/);
  assert.match(buildPage1GenerationSummary(locks, null, controls), /背面/);
});

test('generation summary traces the resolved waist accessory selection', () => {
  const locks = {
    ...createEmptyLocks(),
    waistAccessoryId: optionId('waistAccessoryId', '細版皮革腰帶'),
  };
  const previewPrompt = {
    selection: {
      ...locks,
      waistAccessoryId: optionId('waistAccessoryId', '肚臍環'),
    },
  };

  const resolvedSummary = buildPage1GenerationSummary(locks, previewPrompt, controls);
  assert.match(resolvedSummary, /肚臍環/);
});

test('workspace pose summary shows the active single action pose card as the B pose override', () => {
  const summary = buildWorkspaceSummary({
    ...createEmptyLocks(),
    actionPoseCardId: 'bratty-frustration-mock-kick',
    expressionId: optionId('expressionId', '平靜淡然'),
    poseBaseId: 'standing',
    poseHandId: 'one-hand-waist-one-down',
  }, controls);

  assert.equal(summary.pose.summary, '動作卡：不爽發洩踢擊');
  assert.doesNotMatch(summary.pose.summary, /平靜淡然|站姿|一手扶腰一手自然放下/);
});

test('workspace summary treats legacy reference subject count as single mode', () => {
  const summary = buildWorkspaceSummary({
    ...createEmptyLocks(),
    subjectCount: 'reference',
  }, controls);

  assert.doesNotMatch(summary.character.summary, /上傳人物|附圖人物/);
});

test('workspace pose summary uses duo action scenario and posture base controls', () => {
  const summary = buildWorkspaceSummary({
    ...createEmptyLocks(),
    subjectCount: '2',
    duoPoseId: optionId('duoPoseId', '購物逛街'),
    duoPoseBaseId: optionId('duoPoseBaseId', '行走中'),
    duoInteractionId: optionId('duoInteractionId', '親密'),
  }, controls);

  assert.match(summary.pose.summary, /購物逛街/);
  assert.match(summary.pose.summary, /行走中/);
  assert.doesNotMatch(summary.pose.summary, /親密/);
});

test('workspace pose summary uses the merged duo expression control', () => {
  const summary = buildWorkspaceSummary({
    ...createEmptyLocks(),
    subjectCount: '2',
    duoExpressionId: optionId('duoExpressionId', '兩人相互凝視｜安靜親密'),
    expressionAId: optionId('expressionAId', '柔和微笑'),
    expressionBId: optionId('expressionBId', '自然喜悅'),
  }, controls);

  assert.match(summary.pose.summary, /兩人相互凝視｜安靜親密/);
  assert.doesNotMatch(summary.pose.summary, /柔和微笑|自然喜悅/);
});

test('workspace summary omits PAGE1 aspect ratio from scene and photography summaries', () => {
  const summary = buildWorkspaceSummary({
    ...createEmptyLocks(),
    sceneAttributeId: 'indoor',
    aspectRatio: '9:16',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
  }, controls);

  assert.doesNotMatch(summary.scene.summary, /9:16|portrait vertical/);
  assert.doesNotMatch(summary.photography.summary, /9:16|portrait vertical/);
  assert.match(summary.photography.summary, /全身鏡頭/);
});

test('workspace wardrobe summary and palette insights include complete look palette', () => {
  const locks = {
    ...createEmptyLocks(),
    specialOutfitId: optionId('specialOutfitId', '粉紫蕾絲豹紋低腰喇叭褲造型'),
    completeLookPaletteId: optionId('completeLookPaletteId', '黑紅街頭'),
  };

  const summary = buildWorkspaceSummary(locks, controls);
  const insights = buildWardrobeLayerInsights(locks, controls, true, false);

  assert.match(summary.wardrobe.summary, /粉紫蕾絲豹紋低腰喇叭褲造型/);
  assert.match(summary.wardrobe.summary, /黑紅街頭/);
  assert.deepEqual(insights.palette, ['黑紅街頭']);
  assert.match(insights.notes.join('\n'), /完整造型色系只調整/);
});

test('workspace wardrobe summary includes imported character-card layers when character profile is active', () => {
  const summary = buildWorkspaceSummary({
    ...createEmptyLocks(),
    characterProfileId: 'character-rika',
    characterCardWardrobeLayerIds: ['top', 'shoes'],
  }, controls);

  assert.equal(summary.wardrobe.summary, '角色卡上身 / 角色卡鞋子');
});

test('workspace wardrobe summary ignores stale character-card layers outside character profile mode', () => {
  const summary = buildWorkspaceSummary({
    ...createEmptyLocks(),
    characterCardWardrobeLayerIds: ['top', 'bottom'],
  }, controls);

  assert.equal(summary.wardrobe.summary, '尚未形成明確選項');
});

test('workspace wardrobe summary suppresses character-card layers for true special subjects', () => {
  const summary = buildWorkspaceSummary({
    ...createEmptyLocks(),
    specialSubjectId: 'white-skeleton',
    characterProfileId: 'character-rika',
    characterCardWardrobeLayerIds: ['top', 'bottom'],
  }, controls);

  assert.equal(summary.wardrobe.summary, '');
});

test('workspace wardrobe summary dedupes valid character-card layers in canonical order', () => {
  const summary = buildWorkspaceSummary({
    ...createEmptyLocks(),
    characterProfileId: 'character-rika',
    characterCardWardrobeLayerIds: ['bottom', 'unknown-layer', 'top', 'bottom', 'eyewear'],
  }, controls);

  assert.equal(summary.wardrobe.summary, '角色卡上身 / 角色卡下身 / 角色卡眼鏡');
});

test('workspace scene summary includes fixed composition set controls', () => {
  const summary = buildWorkspaceSummary({
    ...createEmptyLocks(),
    fixedCompositionSetId: optionId('fixedCompositionSetId', '復古磁磚浴室浴缸'),
    fixedSetPositionId: optionId('fixedSetPositionId', '浴缸前景遮擋'),
    fixedSetCaptureModeId: optionId('fixedSetCaptureModeId', '失控自拍感'),
    fixedSetPerformanceStateId: optionId('fixedSetPerformanceStateId', '慵懶無力感'),
  }, controls);

  assert.match(summary.scene.summary, /復古磁磚浴室浴缸/);
  assert.match(summary.scene.summary, /浴缸前景遮擋/);
  assert.match(summary.scene.summary, /失控自拍感/);
  assert.match(summary.scene.summary, /慵懶無力感/);
});

test('workspace scene summary includes outdoor fixed background state', () => {
  const summary = buildWorkspaceSummary({
    ...createEmptyLocks(),
    fixedCompositionSetId: optionId('fixedCompositionSetId', '海邊坡道平交道'),
    fixedSetPositionId: optionId('fixedSetPositionId', '坡道平交道旁'),
    fixedSetBackgroundStateId: optionId('fixedSetBackgroundStateId', '電車經過中'),
  }, controls);

  assert.match(summary.scene.summary, /海邊坡道平交道/);
  assert.match(summary.scene.summary, /坡道平交道旁/);
  assert.match(summary.scene.summary, /電車經過中/);
});

test('workspace scene summary ignores fixed set dependent controls when fixed composition is none', () => {
  const summary = buildWorkspaceSummary({
    ...createEmptyLocks(),
    fixedCompositionSetId: optionId('fixedCompositionSetId', '全無'),
    fixedSetPositionId: optionId('fixedSetPositionId', '全無'),
    fixedSetBackgroundStateId: optionId('fixedSetBackgroundStateId', '電車經過中'),
    fixedSetCaptureModeId: optionId('fixedSetCaptureModeId', '自然自拍感'),
    fixedSetPerformanceStateId: optionId('fixedSetPerformanceStateId', '模型自然發揮'),
  }, controls);

  assert.doesNotMatch(summary.scene.summary, /電車經過中|自然自拍感|模型自然發揮/);
});

test('fixed composition set leaves PAGE1 aspect ratio out of photography summary', () => {
  const summary = buildWorkspaceSummary({
    ...createEmptyLocks(),
    fixedCompositionSetId: optionId('fixedCompositionSetId', '清水模牆面沙發棚'),
    aspectRatio: optionId('aspectRatio', '16:9 寬螢幕'),
    styleId: optionId('styleId', '森山大道｜噪訊黑白暗調'),
    filmId: optionId('filmId', '高銳利快照黑位'),
  }, controls);

  assert.match(summary.scene.summary, /清水模牆面沙發棚/);
  assert.doesNotMatch(summary.photography.summary, /16:9/);
  assert.match(summary.photography.summary, /森山大道｜噪訊黑白暗調/);
  assert.match(summary.photography.summary, /高銳利快照黑位/);
});

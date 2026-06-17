import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, getLockControls } from './engine.js';
import { buildWardrobeLayerInsights, buildWorkspaceSummary } from './page1WorkspaceSummary.js';

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
    expressionId: optionId('expressionId', '直視鏡頭｜平靜淡然'),
    poseBaseId: 'standing',
    poseHandId: 'one-hand-waist-one-down',
  }, controls);

  assert.match(summary.character.summary, /性感曲線身形/);
  assert.doesNotMatch(summary.character.summary, /直視鏡頭｜平靜淡然|站姿|一手扶腰一手自然放下/);
  assert.match(summary.pose.summary, /直視鏡頭｜平靜淡然|站姿|一手扶腰一手自然放下/);
});

test('workspace pose summary uses the merged duo layout/contact control', () => {
  const summary = buildWorkspaceSummary({
    ...createEmptyLocks(),
    subjectCount: '2',
    duoPoseId: optionId('duoPoseId', '性感互動'),
    duoInteractionId: optionId('duoInteractionId', '親密'),
  }, controls);

  assert.match(summary.pose.summary, /性感互動/);
  assert.doesNotMatch(summary.pose.summary, /親密/);
});

test('workspace pose summary uses the merged duo expression control', () => {
  const summary = buildWorkspaceSummary({
    ...createEmptyLocks(),
    subjectCount: '2',
    duoExpressionId: optionId('duoExpressionId', '兩人相互凝視｜安靜親密'),
    expressionAId: optionId('expressionAId', '直視鏡頭｜柔和微笑'),
    expressionBId: optionId('expressionBId', '大笑｜自然喜悅'),
  }, controls);

  assert.match(summary.pose.summary, /兩人相互凝視｜安靜親密/);
  assert.doesNotMatch(summary.pose.summary, /直視鏡頭｜柔和微笑|大笑｜自然喜悅/);
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

import { assertChestUpRevision, PROTECTED_OUTPUT_FIELDS } from './chestUpSameStateTestSupport.js';
import assert from 'node:assert/strict';
import { normalizeCloseWormForLegacy } from './closeWormEyeTestSupport.js';
import { test } from 'node:test';
import { buildGptCameraSpatialText } from './gptCameraSpatial.js';
import { cameraBaseline, normalizeGptCameraForLegacy, normalizeGptHighAngleDistanceForLegacy, expectedCameraComposition } from './gptCameraSpatialTestSupport.js';
import { GPT_CAMERA_SPATIAL_FIXTURES } from './gptCameraSpatialFixtures.js';
import { fullCameraFixture } from './zImageFullBodyCameraFixtures.js';
import { normalizeHighAngleDistanceForLegacy } from './zImageFullBodyCameraTestSupport.js';
import { runSceneFixture, digest } from './sceneIntegratedAssemblyTestSupport.js';
import { serializeFavoritePrompt, deserializeFavoritePrompt, buildMarkdownExport, parseExportedMarkdownPrompt } from '../../features/saved-cards/cardCodec.js';
import { getLockControls } from '../engine.js';
import { normalizeSubjectLightForLegacy } from './subjectLightFixtures.js';
import { normalizeExplicitWardrobeFitForLegacy } from './wardrobeFitTestSupport.js';

test('GPT main Composition expresses camera distance without changing crop, pose or orbit',()=>{
  const floor = runSceneFixture(fullCameraFixture('地面高度鏡頭')).outputs;
  assert.match(floor.grokPrompt,/Composition:\n[^]*?set back from her and tilted upward/);
  assert.doesNotMatch(floor.grokPrompt.match(/Composition:\n([^]*?)\n\n/)?.[1] || '', /low angle from floor level/);
  const worm = runSceneFixture(fullCameraFixture('蟲眼視角鏡頭',{poseBaseId:'kneeling'})).outputs;
  assert.match(worm.grokPrompt,/closest parts of her body loom large/);
  assert.doesNotMatch(worm.grokPrompt,/very close to her feet/);
  assert.doesNotMatch(worm.chestUpPortraitPrompt,/entire figure remains in the frame/);
});

test('camera source distinguishes six full-body groups and preserves non-full crop boundaries',()=>{
  const text = (zh,bucket='fullBody',pose='standing')=>buildGptCameraSpatialText({zh},bucket,pose);
  assert.match(text('平視高度鏡頭'),/natural-looking proportions/);
  assert.match(text('荷蘭角/傾斜 (Dutch Angle)'),/tilted diagonally/);
  assert.match(text('地面高度鏡頭'),/set back/);
  assert.match(text('蟲眼視角鏡頭'),/feet and lower legs loom large/);
  assert.match(text('高位俯視鏡頭'),/roughly 1\.5–2 meters from her[\s\S]*angled downward/);
  assert.match(text('鳥瞰視角'),/roughly 3–5 meters above and set back from her[\s\S]*diagonally downward/);
  assert.match(text('正上方俯視鏡頭'),/roughly 1–2 meters above her[\s\S]*90-degree angle/);
  for (const bucket of ['faceDetail','headShoulders','chestUp','mediumWaist','cowboyKnee']) {
    for (const zh of ['地面高度鏡頭','蟲眼視角鏡頭','高位俯視鏡頭','正上方俯視鏡頭']) {
      assert.doesNotMatch(text(zh,bucket),/entire figure|head to feet|ground plane|fisheye/);
    }
  }
  assert.equal(text('unknown'),'');
  assert.equal(text('全無'),'');
  assert.equal(text('地面高度鏡頭','unconstrained'),'');
});

test('GPT keeps the high-angle distance families distinct outside full body', () => {
  const high = buildGptCameraSpatialText({ zh: '高位俯視鏡頭' }, 'mediumWaist');
  const bird = buildGptCameraSpatialText({ zh: '鳥瞰視角' }, 'mediumWaist');
  const top = buildGptCameraSpatialText({ zh: '正上方俯視鏡頭' }, 'mediumWaist');

  assert.match(high, /roughly 1\.5–2 meters from her/i);
  assert.match(bird, /roughly 3–5 meters above and set back from her[\s\S]*selected crop/i);
  assert.match(top, /roughly 1–2 meters above her[\s\S]*90-degree angle/i);
  for (const text of [high, bird, top]) {
    assert.doesNotMatch(text, /entire figure|ground plane/i);
  }
  assert.notEqual(high, bird);
  assert.notEqual(bird, top);
  assert.notEqual(high, top);
});

test('GPT distance bridge retains the prior GPT camera policy', () => {
  const high = `Composition:\nFull-body portrait. ${buildGptCameraSpatialText({ zh: '高位俯視鏡頭' }, 'fullBody', 'kneeling')}`;
  assert.equal(normalizeGptHighAngleDistanceForLegacy(high, { poseBaseId: 'kneeling' }),
    'Composition:\nFull-body portrait. The camera is above her and angled downward, framing her entire figure from head to feet, with the nearest body areas appearing larger than those farther away.');
  const bird = `Composition:\nWaist-up portrait. ${buildGptCameraSpatialText({ zh: '鳥瞰視角' }, 'mediumWaist')}`;
  assert.equal(normalizeGptHighAngleDistanceForLegacy(bird),
    'Composition:\nWaist-up portrait. The camera is high above her and looks diagonally downward, keeping the selected crop on her rather than widening to a full-body view.');
  const natural = 'Composition:\nFull-body portrait. Her entire figure is framed with natural-looking proportions.';
  assert.equal(normalizeGptHighAngleDistanceForLegacy(natural), natural);
});

test('frozen camera/scene/lighting matrix permits only the exact main GPT Composition change',()=>{
  const results = GPT_CAMERA_SPATIAL_FIXTURES.map(runSceneFixture);
  assert.equal(results.length,cameraBaseline.count);
  assertChestUpRevision('camera', results);
  for (const field of PROTECTED_OUTPUT_FIELDS) assert.equal(digest(results.map(r=>normalizeSubjectLightForLegacy(field==='grokPrompt'
    ? normalizeGptCameraForLegacy(r.outputs[field]) : normalizeHighAngleDistanceForLegacy(normalizeCloseWormForLegacy(normalizeExplicitWardrobeFitForLegacy(r.outputs[field], field), field))))),cameraBaseline.hashes[field],field);
  assert.equal(digest(results.map(r=>r.selection)),cameraBaseline.selectionHash);
  assert.equal(digest(results.map(r=>r.randomDraws)),cameraBaseline.randomHash);
  const composition = t => t.match(/(?:^|\n\n)Composition:\n([^]*?)(?=\n\n[A-Z][^\n]*:\n|$)/)?.[1] || '';
  for (const [i,f] of GPT_CAMERA_SPATIAL_FIXTURES.entries()) {
    const r = results[i];
    const current = normalizeSubjectLightForLegacy(r.outputs.grokPrompt);
    const original = normalizeGptCameraForLegacy(current);
    if (f.excluded) assert.equal(original,current,f.id);
    else assert.equal(composition(current),expectedCameraComposition(composition(original),r.selection),f.id);
  }
});

test('new camera text survives Saved Cards and Markdown; exact bridge does not hide regressions',()=>{
  const {prompt} = runSceneFixture(fullCameraFixture('地面高度鏡頭'));
  const saved = deserializeFavoritePrompt(serializeFavoritePrompt(prompt));
  const parsed = parseExportedMarkdownPrompt(buildMarkdownExport(prompt),getLockControls(),'camera-spatial');
  assert.equal(saved.grokPrompt,prompt.grokPrompt);
  assert.equal(parsed.grokPrompt,prompt.grokPrompt);
  assert.deepEqual(saved.extraPrompts,prompt.extraPrompts);
  for (const key of ['angleId','framingId','poseBaseId']) assert.equal(saved.selection[key],prompt.selection[key]);
  const bad = prompt.grokPrompt.replace('set back from her','UNAPPROVED');
  assert.equal(normalizeGptCameraForLegacy(bad),bad);
});

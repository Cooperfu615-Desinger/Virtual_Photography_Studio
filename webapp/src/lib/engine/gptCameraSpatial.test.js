import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildGptCameraSpatialText } from './gptCameraSpatial.js';
import { cameraBaseline, normalizeGptCameraForLegacy, expectedCameraComposition } from './gptCameraSpatialTestSupport.js';
import { GPT_CAMERA_SPATIAL_FIXTURES } from './gptCameraSpatialFixtures.js';
import { fullCameraFixture } from './zImageFullBodyCameraFixtures.js';
import { runSceneFixture, digest, OUTPUT_FIELDS } from './sceneIntegratedAssemblyTestSupport.js';
import { serializeFavoritePrompt, deserializeFavoritePrompt, buildMarkdownExport, parseExportedMarkdownPrompt } from '../../features/saved-cards/cardCodec.js';
import { getLockControls } from '../engine.js';

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
  assert.match(text('高位俯視鏡頭'),/angled downward/);
  assert.match(text('鳥瞰視角'),/diagonally down/);
  assert.match(text('正上方俯視鏡頭'),/vertically downward/);
  for (const bucket of ['faceDetail','headShoulders','chestUp','mediumWaist','cowboyKnee']) {
    for (const zh of ['地面高度鏡頭','蟲眼視角鏡頭','高位俯視鏡頭','正上方俯視鏡頭']) {
      assert.doesNotMatch(text(zh,bucket),/entire figure|head to feet|ground plane|fisheye/);
    }
  }
  assert.equal(text('unknown'),'');
  assert.equal(text('全無'),'');
  assert.equal(text('地面高度鏡頭','unconstrained'),'');
});

test('frozen camera/scene/lighting matrix permits only the exact main GPT Composition change',()=>{
  const results = GPT_CAMERA_SPATIAL_FIXTURES.map(runSceneFixture);
  assert.equal(results.length,cameraBaseline.count);
  for (const field of OUTPUT_FIELDS) assert.equal(digest(results.map(r=>field==='grokPrompt'
    ? normalizeGptCameraForLegacy(r.outputs[field]) : r.outputs[field])),cameraBaseline.hashes[field],field);
  assert.equal(digest(results.map(r=>r.selection)),cameraBaseline.selectionHash);
  assert.equal(digest(results.map(r=>r.randomDraws)),cameraBaseline.randomHash);
  const composition = t => t.match(/(?:^|\n\n)Composition:\n([^]*?)(?=\n\n[A-Z][^\n]*:\n|$)/)?.[1] || '';
  for (const [i,f] of GPT_CAMERA_SPATIAL_FIXTURES.entries()) {
    const r = results[i];
    const original = normalizeGptCameraForLegacy(r.outputs.grokPrompt);
    if (f.excluded) assert.equal(original,r.outputs.grokPrompt,f.id);
    else assert.equal(composition(r.outputs.grokPrompt),expectedCameraComposition(composition(original),r.selection),f.id);
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

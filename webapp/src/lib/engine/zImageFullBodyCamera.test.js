import assert from 'node:assert/strict';
import { normalizeGptVisibilityForLegacy } from './gptSceneVisibilityTestSupport.js';
import { normalizeCloseWormForLegacy } from './closeWormEyeTestSupport.js';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { getLockControls } from '../engine.js';
import { buildZImageFullBodyCamera, FULL_BODY_CAMERA_GROUPS } from './zImageFullBodyCamera.js';
import { runSceneFixture, OUTPUT_FIELDS, digest } from './sceneIntegratedAssemblyTestSupport.js';
import { FULL_CAMERA_ANGLES, FULL_CAMERA_REGRESSION, fullCameraFixture } from './zImageFullBodyCameraFixtures.js';
import { FULL_CAMERA_TEXT_PAIRS, normalizeFullCameraForLegacy, normalizeHighAngleDistanceForLegacy } from './zImageFullBodyCameraTestSupport.js';
import { normalizeSubjectLightForLegacy } from './subjectLightFixtures.js';
import { normalizeExplicitWardrobeFitForLegacy } from './wardrobeFitTestSupport.js';
import { serializeFavoritePrompt, deserializeFavoritePrompt, buildMarkdownExport, parseExportedMarkdownPrompt } from '../../features/saved-cards/cardCodec.js';

test('full camera policy has six groups; Dutch keeps roll; no unknown/default angle injection', () => {
  assert.equal(new Set(Object.values(FULL_BODY_CAMERA_GROUPS)).size, 6);
  for (const label of FULL_CAMERA_ANGLES.slice(0, 4)) {
    assert.equal(FULL_BODY_CAMERA_GROUPS[label], 'natural');
    assert.equal(buildZImageFullBodyCamera({ zh: label }, 'standing'), FULL_CAMERA_TEXT_PAIRS[0][0]);
  }
  assert.equal(buildZImageFullBodyCamera({ zh: FULL_CAMERA_ANGLES[4] }, 'standing'), FULL_CAMERA_TEXT_PAIRS[1][0]);
  assert.equal(buildZImageFullBodyCamera({ zh: '全無' }, 'standing'), '');
  assert.equal(buildZImageFullBodyCamera({ zh: 'unknown' }, 'standing'), '');
  assert.equal(buildZImageFullBodyCamera(), '');
});

test('full camera wording matches approved sources without imposing pose, footwear, or fisheye', () => {
  const indices = [2, 3, 5, 6, 7];
  for (const [i, label] of FULL_CAMERA_ANGLES.slice(5, 10).entries()) {
    const text = buildZImageFullBodyCamera({ zh: label }, 'standing');
    assert.equal(text, FULL_CAMERA_TEXT_PAIRS[indices[i]][0]);
    assert.doesNotMatch(text, /barefoot|bare feet|stands|planted|fisheye|front view/i);
  }
  for (const pose of ['sitting', 'kneeling', 'squatting', 'lying', '']) {
    const text = buildZImageFullBodyCamera({ zh: '蟲眼視角鏡頭' }, pose);
    assert.equal(text, FULL_CAMERA_TEXT_PAIRS[4][0]);
    assert.doesNotMatch(text, /feet|standing|upright|planted/i);
  }
});

test('high-angle families use distinct soft distance and geometry cues', () => {
  const high = buildZImageFullBodyCamera({ zh: '高位俯視鏡頭' });
  const bird = buildZImageFullBodyCamera({ zh: '鳥瞰視角' });
  const top = buildZImageFullBodyCamera({ zh: '正上方俯視鏡頭' });

  assert.match(high, /roughly 1\.5–2 meters from her[\s\S]*subject remains dominant/i);
  assert.match(bird, /roughly 3–5 meters above and set back from her[\s\S]*surrounding spatial layout/i);
  assert.match(top, /roughly 1–2 meters above her[\s\S]*90-degree angle[\s\S]*no diagonal viewing direction/i);
  assert.notEqual(high, bird);
  assert.notEqual(bird, top);
  assert.notEqual(high, top);
});

test('distance-only bridge preserves the already-approved full-body camera policy', () => {
  const old = [
    'The camera is above her and angled downward, framing her entire figure from head to feet. The top of her head and shoulders are nearer the lens, with the rest of her body receding below them.',
    "A bird's-eye view from high above, looking diagonally down at her entire figure within the surrounding space.",
    'The camera is directly above her and points vertically downward, framing her entire figure in a top-down composition.',
  ];
  for (const [i, label] of ['高位俯視鏡頭', '鳥瞰視角', '正上方俯視鏡頭'].entries()) {
    const current = buildZImageFullBodyCamera({ zh: label });
    const prompt = `Photorealistic editorial portrait.\n\nFull-body portrait. ${current} Photographed directly from the front.`;
    assert.equal(normalizeHighAngleDistanceForLegacy(prompt),
      `Photorealistic editorial portrait.\n\nFull-body portrait. ${old[i]} Photographed directly from the front.`);
  }
  const natural = 'Photorealistic editorial portrait.\n\nFull-body portrait. Her entire figure is framed with natural-looking proportions.';
  assert.equal(normalizeHighAngleDistanceForLegacy(natural), natural);
});

test('main full-body runtime retains height/roll hints and replaces only effective angle sentences', () => {
  const angles = getLockControls().find((c) => c.key === 'angleId').options;
  const hints = ['eye-level view', 'shoulder-level view', 'waist-level view', 'knee-level view', 'tilted frame'];
  for (const [i, label] of FULL_CAMERA_ANGLES.entries()) {
    const result = runSceneFixture(fullCameraFixture(label));
    assert.equal(angles.find((a) => a.id === result.selection.angleId)?.zh, label);
    const opening = result.outputs.zImagePrompt.split('\n\n')[1];
    const expected = buildZImageFullBodyCamera({ zh: label }, 'standing');
    if (expected) assert.equal(opening.split(expected).length - 1, 1, label);
    if (i < 5) assert.ok(opening.includes(hints[i]), label);
    assert.match(opening, /Full-body portrait/);
    if (label === '蟲眼視角鏡頭') assert.match(opening, /feet and lower legs loom large/);
    // Main GPT now shares the approved camera vocabulary; derivatives/MJ do not.
    for (const field of OUTPUT_FIELDS.filter((f) => !['zImagePrompt', 'grokPrompt'].includes(f))) {
      for (const [text] of FULL_CAMERA_TEXT_PAIRS) assert.ok(!result.outputs[field].includes(text), field);
    }
  }
});

test('431-case frozen baseline: only approved main Z camera text changes; selections and other outputs identical', () => {
  const baseline = JSON.parse(readFileSync(new URL('./zImageFullBodyCameraBaseline.json', import.meta.url), 'utf8'));
  const results = FULL_CAMERA_REGRESSION.map(runSceneFixture);
  assert.equal(results.length, baseline.count);
  for (const field of OUTPUT_FIELDS) {
    assert.equal(digest(results.map((r) => {
      let value = r.outputs[field];
      if (field === 'zImagePrompt') value = normalizeFullCameraForLegacy(value);
      if (field === 'grokPrompt') value = normalizeGptVisibilityForLegacy(value, r.selection);
      return normalizeSubjectLightForLegacy(normalizeExplicitWardrobeFitForLegacy(value, field));
    })), baseline.hashes[field], field);
  }
  assert.equal(digest(results.map((r) => r.selection)), baseline.selectionHash);
  assert.equal(digest(results.map((r) => r.randomDraws)), baseline.randomHash);
  for (const [i, row] of FULL_CAMERA_REGRESSION.entries()) {
    const result = results[i];
    if (row.excluded) {
      assert.equal(normalizeFullCameraForLegacy(result.outputs.zImagePrompt), normalizeCloseWormForLegacy(result.outputs.zImagePrompt), row.id);
    }
  }
});

test('new full camera output round-trips through saved text and Markdown without a schema change', () => {
  for (const label of ['荷蘭角/傾斜 (Dutch Angle)', '蟲眼視角鏡頭', '正上方俯視鏡頭']) {
    const { prompt } = runSceneFixture(fullCameraFixture(label));
    const restored = deserializeFavoritePrompt(serializeFavoritePrompt(prompt));
    const parsed = parseExportedMarkdownPrompt(buildMarkdownExport(prompt), getLockControls(), 'full-camera-test');
    for (const field of ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt']) {
      assert.equal(restored[field], prompt[field]);
      assert.equal(parsed[field], prompt[field]);
    }
    assert.equal(restored.selection.angleId, prompt.selection.angleId);
    assert.equal(restored.selection.framingId, prompt.selection.framingId);
  }
});

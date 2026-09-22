import { assertChestUpRevision, PROTECTED_OUTPUT_FIELDS } from './chestUpSameStateTestSupport.js';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { CLOSE_WORM_CASES, CLOSE_WORM_EXCLUDED } from './closeWormEyeFixtures.js';
import { CLOSE_WORM_EXPECTED, OLD_WORM, normalizeCloseWormForLegacy } from './closeWormEyeTestSupport.js';
import { GPT_CAMERA_SPATIAL_FIXTURES } from './gptCameraSpatialFixtures.js';
import { normalizeGptHighAngleDistanceForLegacy } from './gptCameraSpatialTestSupport.js';
import { normalizeHighAngleDistanceForLegacy } from './zImageFullBodyCameraTestSupport.js';
import { normalizeExplicitWardrobeFitForLegacy } from './wardrobeFitTestSupport.js';
import { runSceneFixture, digest, OUTPUT_FIELDS } from './sceneIntegratedAssemblyTestSupport.js';
import { serializeFavoritePrompt, deserializeFavoritePrompt, buildMarkdownExport, parseExportedMarkdownPrompt } from '../../features/saved-cards/cardCodec.js';
import { getLockControls } from '../engine.js';
import { buildCloseWormEyeText } from './closeWormEye.js';

test('close camera source matches approved copy and leaves every other crop/angle untouched', () => {
  const angle = { zh: '蟲眼視角鏡頭' };
  assert.equal(buildCloseWormEyeText(angle, 'mediumWaist', 'standing'), CLOSE_WORM_EXPECTED.medium);
  assert.equal(buildCloseWormEyeText(angle, 'cowboyKnee', 'standing'), CLOSE_WORM_EXPECTED.cowboy);
  for (const bucket of ['mediumWaist', 'cowboyKnee']) {
    for (const pose of ['sitting', 'kneeling', 'squatting', 'lying', '']) assert.equal(buildCloseWormEyeText(angle, bucket, pose), CLOSE_WORM_EXPECTED.neutral);
    for (const zh of ['地面高度鏡頭', '高位俯視鏡頭', '全無', 'unknown']) assert.equal(buildCloseWormEyeText({ zh }, bucket, 'standing'), '');
  }
  for (const bucket of ['faceDetail', 'headShoulders', 'chestUp', 'fullBody', 'unconstrained', 'fixedComposition', 'unknown']) assert.equal(buildCloseWormEyeText(angle, bucket, 'standing'), '');
});

test('approved near-contact medium and cowboy copy appears exactly once in main GPT/Z only', () => {
  for (const fixture of CLOSE_WORM_CASES) {
    const { outputs } = runSceneFixture(fixture);
    for (const field of ['grokPrompt', 'zImagePrompt']) {
      const expected = CLOSE_WORM_EXPECTED[fixture.expectedKind];
      assert.equal(outputs[field].split(expected).length - 1, 1, `${fixture.id}/${field}`);
      assert.ok(!outputs[field].includes(OLD_WORM));
      if (fixture.expectedKind === 'neutral') assert.doesNotMatch(outputs[field], /lens almost against her thighs|head recede sharply above/);
    }
    for (const field of OUTPUT_FIELDS.filter(f => !['grokPrompt', 'zImagePrompt'].includes(f))) {
      assert.doesNotMatch(outputs[field], /extreme close-range worm/);
    }
  }
});

test('frozen matrix permits only the exact GPT/Z camera text and no selection or RNG changes', () => {
  const baseline = JSON.parse(readFileSync(new URL('./closeWormEyeBaseline.json', import.meta.url), 'utf8'));
  const rows = [...GPT_CAMERA_SPATIAL_FIXTURES, ...CLOSE_WORM_CASES, ...CLOSE_WORM_EXCLUDED].map(runSceneFixture);
  assert.equal(rows.length, baseline.count);
  assertChestUpRevision('worm', rows);
  for (const field of PROTECTED_OUTPUT_FIELDS) assert.equal(digest(rows.map(r => {
    const value = normalizeExplicitWardrobeFitForLegacy(
      normalizeCloseWormForLegacy(r.outputs[field], field),
      field,
    );
    if (field === 'grokPrompt') return normalizeGptHighAngleDistanceForLegacy(value, r.selection);
    if (field === 'zImagePrompt') return normalizeHighAngleDistanceForLegacy(value);
    return value;
  })), baseline.hashes[field], field);
  assert.equal(digest(rows.map(r => r.selection)), baseline.selections);
  assert.equal(digest(rows.map(r => r.randomDraws)), baseline.random);
  for (const f of CLOSE_WORM_EXCLUDED) for (const text of Object.values(runSceneFixture(f).outputs)) assert.doesNotMatch(text, /extreme close-range worm/);
});

test('near-contact text round trips through saved cards and Markdown without changing camera choices', () => {
  for (const fixture of CLOSE_WORM_CASES.filter(f => f.expectedKind !== 'neutral').slice(0, 4)) {
    const { prompt } = runSceneFixture(fixture);
    const saved = deserializeFavoritePrompt(serializeFavoritePrompt(prompt));
    const parsed = parseExportedMarkdownPrompt(buildMarkdownExport(prompt), getLockControls(), 'close-worm');
    for (const field of ['grokPrompt', 'zImagePrompt']) {
      assert.equal(saved[field], prompt[field]); assert.equal(parsed[field], prompt[field]);
      const altered = prompt[field].replace('almost against', 'UNAPPROVED');
      assert.equal(normalizeCloseWormForLegacy(altered, field), altered);
    }
    for (const key of ['angleId', 'framingId', 'poseBaseId']) assert.equal(saved.selection[key], prompt.selection[key]);
  }
});

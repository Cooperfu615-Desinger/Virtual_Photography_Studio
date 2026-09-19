import assert from 'node:assert/strict';
import { normalizeGptVisibilityForLegacy } from './gptSceneVisibilityTestSupport.js';
import { normalizeCloseWormForLegacy } from './closeWormEyeTestSupport.js';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { getLockControls } from '../engine.js';
import { appendZImageUpperScene, Z_IMAGE_UPPER_SCENE_SOURCES, Z_IMAGE_UPPER_SCENE_VERSION } from './zImageUpperScene.js';
import { LOW_CAMERA_LABELS } from './zImageSceneDirection.js';
import { UPPER_SCENE_EXTENSION_CASES, UPPER_SCENE_EXTENSION_MATRIX, UPPER_SCENE_EXTENSION_REGRESSION } from './zImageUpperSceneExtensionFixtures.js';
import { upperSceneFixture } from './zImageUpperSceneFixtures.js';
import { runSceneFixture, digest, OUTPUT_FIELDS } from './sceneIntegratedAssemblyTestSupport.js';
import { serializeFavoritePrompt, deserializeFavoritePrompt, buildMarkdownExport, parseExportedMarkdownPrompt } from '../../features/saved-cards/cardCodec.js';
import { normalizeSubjectLightForLegacy } from './subjectLightFixtures.js';
import { normalizeHighAngleDistanceForLegacy } from './zImageFullBodyCameraTestSupport.js';
import { normalizeExplicitWardrobeFitForLegacy } from './wardrobeFitTestSupport.js';

const controls = getLockControls();
const locations = controls.find(c => c.key === 'locationId').options;
const angles = controls.find(c => c.key === 'angleId').options;

test('14 approved additions bind exact catalog IDs and retain the four original records', () => {
  assert.equal(Object.keys(Z_IMAGE_UPPER_SCENE_SOURCES).length, 18);
  assert.equal(Z_IMAGE_UPPER_SCENE_VERSION, '1.1.0');
  for (const [label, addition] of UPPER_SCENE_EXTENSION_CASES) {
    const location = locations.find(l => l.zh === label);
    const record = Z_IMAGE_UPPER_SCENE_SOURCES[location.id];
    assert.equal(record.identity, location.en.split(',')[0]);
    assert.equal(record.clauses.join(', '), addition);
    assert.ok(Object.isFrozen(record.clauses));
    assert.ok(record.clauses.length >= 1 && record.clauses.length <= 2);
    const source = `${record.identity}, existing scene detail`;
    for (const angle of LOW_CAMERA_LABELS) {
      const first = appendZImageUpperScene(source, location, { zh: angle });
      assert.equal(first, `${source}, ${addition}`);
      assert.equal(appendZImageUpperScene(first, location, { zh: angle }), first);
      assert.equal(appendZImageUpperScene('', location, { zh: angle }), '');
      assert.equal(appendZImageUpperScene('custom scene', location, { zh: angle }), 'custom scene');
      assert.equal(appendZImageUpperScene(source, { id: 'unknown' }, { zh: angle }), source);
    }
    for (const angle of ['平視高度鏡頭', '肩部高度鏡頭', '高位俯視鏡頭', '鳥瞰視角', '正上方俯視鏡頭', '全無', 'unknown']) {
      assert.equal(appendZImageUpperScene(source, location, { zh: angle }), source);
    }
  }
});

test('930 frozen cases permit only the 14 authored additions in eligible main Z openings', () => {
  const baseline = JSON.parse(readFileSync(new URL('./zImageUpperSceneExtensionBaseline.json', import.meta.url), 'utf8'));
  const results = UPPER_SCENE_EXTENSION_REGRESSION.map(runSceneFixture);
  assert.equal(results.length, baseline.count);
  const normalized = results.map((r, i) => {
    const row = UPPER_SCENE_EXTENSION_REGRESSION[i];
    const addition = UPPER_SCENE_EXTENSION_CASES.find(([label]) => label === row.locks.locationId?.byZh)?.[1];
    const eligible = i < UPPER_SCENE_EXTENSION_MATRIX.length && LOW_CAMERA_LABELS.includes(angles.find(a => a.id === r.selection.angleId)?.zh);
    const outputs = { ...r.outputs };
    if (eligible) {
      const blocks = outputs.zImagePrompt.split('\n\n');
      assert.ok(blocks[1].split('. ')[0].endsWith(addition), row.id);
      assert.equal(outputs.zImagePrompt.split(addition).length - 1, 1, row.id);
      blocks[1] = blocks[1].replace(`, ${addition}`, '');
      outputs.zImagePrompt = blocks.join('\n\n');
    } else if (addition) {
      assert.ok(!outputs.zImagePrompt.includes(addition), row.id);
    }
    outputs.grokPrompt = normalizeGptVisibilityForLegacy(outputs.grokPrompt, r.selection);
    outputs.zImagePrompt = normalizeHighAngleDistanceForLegacy(normalizeCloseWormForLegacy(outputs.zImagePrompt));
    for (const field of OUTPUT_FIELDS) outputs[field] = normalizeSubjectLightForLegacy(normalizeExplicitWardrobeFitForLegacy(outputs[field], field));
    return outputs;
  });
  for (const field of OUTPUT_FIELDS) assert.equal(digest(normalized.map(o => o[field])), baseline.hashes[field], field);
  assert.equal(digest(results.map(r => r.selection)), baseline.selectionHash);
  assert.equal(digest(results.map(r => r.randomDraws)), baseline.randomHash);
});

test('all 14 additions preserve saved selections and exported text; legacy Markdown scene inference is unchanged', () => {
  for (const [label, addition] of UPPER_SCENE_EXTENSION_CASES) {
    const { prompt } = runSceneFixture(upperSceneFixture(label, '腰部高度鏡頭'));
    assert.ok(prompt.zImagePrompt.includes(addition));
    const saved = deserializeFavoritePrompt(serializeFavoritePrompt(prompt));
    const parsed = parseExportedMarkdownPrompt(buildMarkdownExport(prompt), controls, 'upper-extension-test');
    for (const restored of [saved, parsed]) {
      for (const field of ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt']) assert.equal(restored[field], prompt[field]);
    }
    assert.equal(saved.selection.locationId, prompt.selection.locationId);
    // HEAD 71b4b20 (old source module loaded read-only) resolves these same
    // all-none-style fixtures to no scene on Markdown inference, despite keeping
    // the exported prose. Pin the known boundary; do not claim full ID round-trip.
    assert.equal(parsed.selection.locationId, locations.find(l => l.zh === '全無').id);
  }
});

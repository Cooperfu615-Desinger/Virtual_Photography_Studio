import assert from 'node:assert/strict';
import { normalizeGptVisibilityForLegacy } from './gptSceneVisibilityTestSupport.js';
import { normalizeCloseWormForLegacy } from './closeWormEyeTestSupport.js';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { getLockControls } from '../engine.js';
import { selectZImageSceneDetails, Z_IMAGE_SCENE_DETAIL_PRIORITIES } from './zImageSceneDetailPriority.js';
import { LOW_CAMERA_LABELS } from './zImageSceneDirection.js';
import {
  SCENE_DETAIL_PRIORITY_CASES,
  SCENE_DETAIL_PRIORITY_REMAINING_CASES,
  SCENE_DETAIL_PRIORITY_REMAINING_LOW_MATRIX,
  SCENE_DETAIL_PRIORITY_MATRIX,
  SCENE_DETAIL_PRIORITY_REGRESSION,
} from './zImageSceneDetailPriorityFixtures.js';
import { upperSceneFixture } from './zImageUpperSceneFixtures.js';
import { runSceneFixture, digest, OUTPUT_FIELDS } from './sceneIntegratedAssemblyTestSupport.js';
import { normalizeSubjectLightForLegacy } from './subjectLightFixtures.js';
import { normalizeHighAngleDistanceForLegacy } from './zImageFullBodyCameraTestSupport.js';
import { normalizeExplicitWardrobeFitForLegacy } from './wardrobeFitTestSupport.js';
import { serializeFavoritePrompt, deserializeFavoritePrompt, buildMarkdownExport, parseExportedMarkdownPrompt } from '../../features/saved-cards/cardCodec.js';

const controls = getLockControls();
const locations = controls.find(c => c.key === 'locationId').options;
const angles = controls.find(c => c.key === 'angleId').options;

test('reviewed priorities are source-backed, low-only, idempotent and fail closed', () => {
  assert.equal(Object.keys(Z_IMAGE_SCENE_DETAIL_PRIORITIES).length, 45);
  for (const [label, before, after] of SCENE_DETAIL_PRIORITY_CASES) {
    const location = locations.find(l => l.zh === label);
    assert.ok(Z_IMAGE_SCENE_DETAIL_PRIORITIES[location.id]);
    for (const zh of LOW_CAMERA_LABELS) {
      assert.equal(selectZImageSceneDetails(before, location, { zh }), after);
      assert.equal(selectZImageSceneDetails(after, location, { zh }), after);
      assert.equal(selectZImageSceneDetails(`${before}, evening condition`, location, { zh }), `${after}, evening condition`);
      assert.equal(selectZImageSceneDetails('', location, { zh }), '');
      assert.equal(selectZImageSceneDetails('custom scene', location, { zh }), 'custom scene');
      assert.equal(selectZImageSceneDetails(before, { ...location, id: 'unknown' }, { zh }), before);
      assert.equal(selectZImageSceneDetails(before, { ...location, en: 'custom scene' }, { zh }), before);
      assert.equal(selectZImageSceneDetails(before, { ...location, en: before }, { zh }), before);
    }
    for (const zh of ['平視高度鏡頭', '肩部高度鏡頭', '高位俯視鏡頭', '鳥瞰視角', '正上方俯視鏡頭', '全無', 'unknown']) {
      assert.equal(selectZImageSceneDetails(before, location, { zh }), before);
    }
  }
});

test('38 remaining priorities use only exact catalog clauses and preserve non-low cameras', () => {
  assert.equal(SCENE_DETAIL_PRIORITY_REMAINING_CASES.length, 38);
  for (const [label, before, after] of SCENE_DETAIL_PRIORITY_REMAINING_CASES) {
    const location = locations.find((l) => l.zh === label);
    assert.ok(location, `Missing location ${label}`);
    const rule = Z_IMAGE_SCENE_DETAIL_PRIORITIES[location.id];
    assert.ok(rule, `Missing priority rule ${location.id}`);
    assert.equal(selectZImageSceneDetails(before, location, { zh: '腰部高度鏡頭' }), after);
    assert.equal(selectZImageSceneDetails(after, location, { zh: '蟲眼視角鏡頭' }), after);
    assert.equal(selectZImageSceneDetails(`${before}, evening condition`, location, { zh: '膝蓋高度鏡頭' }), `${after}, evening condition`);
    assert.equal(selectZImageSceneDetails('', location, { zh: '地面高度鏡頭' }), '');
    assert.equal(selectZImageSceneDetails('custom scene', location, { zh: '地面高度鏡頭' }), 'custom scene');
    assert.equal(selectZImageSceneDetails(before, { ...location, id: 'unknown' }, { zh: '腰部高度鏡頭' }), before);
    assert.equal(selectZImageSceneDetails(before, { ...location, en: 'custom scene' }, { zh: '腰部高度鏡頭' }), before);
    for (const zh of ['平視高度鏡頭', '肩部高度鏡頭', '高位俯視鏡頭', '鳥瞰視角', '正上方俯視鏡頭', '全無']) {
      assert.equal(selectZImageSceneDetails(before, location, { zh }), before);
    }
  }
});

test('remaining priorities integrate into the low-camera Z-Image scene opening', () => {
  const results = SCENE_DETAIL_PRIORITY_REMAINING_LOW_MATRIX.map(runSceneFixture);
  assert.equal(results.length, 456);
  for (const [index, result] of results.entries()) {
    const fixture = SCENE_DETAIL_PRIORITY_REMAINING_LOW_MATRIX[index];
    const entry = SCENE_DETAIL_PRIORITY_REMAINING_CASES.find(([label]) => label === fixture.locks.locationId.byZh);
    assert.ok(entry, fixture.id);
    const [, , after] = entry;
    const sceneBlock = result.outputs.zImagePrompt.split('\n\n').find((block) => block.startsWith('The setting is '));
    assert.ok(sceneBlock?.startsWith(`The setting is ${after}.`), fixture.id);
    assert.equal(sceneBlock.split(after).length - 1, 1, fixture.id);
  }
});

test('scene-integrated assembly does not duplicate a selected location detail', () => {
  const fixture = SCENE_DETAIL_PRIORITY_REMAINING_LOW_MATRIX.find((candidate) =>
    candidate.locks.locationId?.byZh === '室內：CRT 電視牆攝影棚'
      && candidate.locks.framingId?.byZh === '中景鏡頭 (Medium Shot)'
      && candidate.locks.angleId?.byZh === '腰部高度鏡頭');
  assert.ok(fixture);
  const result = runSceneFixture(fixture);
  const sceneBlock = result.outputs.zImagePrompt.split('\n\n').find((block) => block.startsWith('The setting is '));
  assert.ok(sceneBlock);
  assert.ok(sceneBlock.split('glowing screens with analog static').length - 1 <= 1, sceneBlock);
});

test('1430 frozen cases permit only reviewed low-camera scene substitutions', () => {
  const baseline = JSON.parse(readFileSync(new URL('./zImageSceneDetailPriorityBaseline.json', import.meta.url), 'utf8'));
  const results = SCENE_DETAIL_PRIORITY_REGRESSION.map(runSceneFixture);
  assert.equal(results.length, baseline.count);
  const normalized = results.map((r, i) => {
    const row = SCENE_DETAIL_PRIORITY_REGRESSION[i];
    const entry = SCENE_DETAIL_PRIORITY_CASES.find(([label]) => label === row.locks.locationId?.byZh)
      || SCENE_DETAIL_PRIORITY_REMAINING_CASES.find(([label]) => label === row.locks.locationId?.byZh);
    const output = { ...r.outputs };
    const lowCamera = LOW_CAMERA_LABELS.includes(angles.find(a => a.id === r.selection.angleId)?.zh);
    if (entry && lowCamera) {
      const [, before, after] = entry;
      const prefix = `The setting is ${after}.`;
      const blocks = output.zImagePrompt.split('\n\n');
      if (blocks[1]?.startsWith(prefix)) {
        assert.equal(output.zImagePrompt.split(after).length - 1, 1, row.id);
        blocks[1] = `The setting is ${before}.` + blocks[1].slice(prefix.length);
        output.zImagePrompt = blocks.join('\n\n');
      }
    }
    output.grokPrompt = normalizeGptVisibilityForLegacy(output.grokPrompt, r.selection);
    output.zImagePrompt = normalizeHighAngleDistanceForLegacy(normalizeCloseWormForLegacy(output.zImagePrompt));
    for (const field of OUTPUT_FIELDS) output[field] = normalizeSubjectLightForLegacy(normalizeExplicitWardrobeFitForLegacy(output[field], field));
    return output;
  });
  for (const field of OUTPUT_FIELDS) assert.equal(digest(normalized.map(o => o[field])), baseline.hashes[field], field);
  assert.equal(digest(results.map(r => r.selection)), baseline.selectionHash);
  assert.equal(digest(results.map(r => r.randomDraws)), baseline.randomHash);
});

test('Saved Cards retain six texts; Markdown exports six and restores the established three primary texts', () => {
  for (const [label] of SCENE_DETAIL_PRIORITY_CASES) {
    const { prompt } = runSceneFixture(upperSceneFixture(label, '地面高度鏡頭'));
    const saved = deserializeFavoritePrompt(serializeFavoritePrompt(prompt));
    const markdown = buildMarkdownExport(prompt);
    const parsed = parseExportedMarkdownPrompt(markdown, controls, 'priority-roundtrip');
    assert.equal(saved.selection.locationId, prompt.selection.locationId);
    assert.deepEqual(saved.extraPrompts, prompt.extraPrompts);
    for (const entry of prompt.extraPrompts) assert.ok(markdown.includes(entry.text));
    // Existing generic Markdown parser returns primary texts only; no migration.
    assert.equal(parsed.extraPrompts, undefined);
    for (const restored of [saved, parsed]) {
      for (const field of ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt']) assert.equal(restored[field], prompt[field]);
    }
  }
});

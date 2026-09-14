import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { getLockControls } from '../engine.js';
import { selectZImageSceneDetails, Z_IMAGE_SCENE_DETAIL_PRIORITIES } from './zImageSceneDetailPriority.js';
import { LOW_CAMERA_LABELS } from './zImageSceneDirection.js';
import { SCENE_DETAIL_PRIORITY_CASES, SCENE_DETAIL_PRIORITY_MATRIX, SCENE_DETAIL_PRIORITY_REGRESSION } from './zImageSceneDetailPriorityFixtures.js';
import { upperSceneFixture } from './zImageUpperSceneFixtures.js';
import { runSceneFixture, digest, OUTPUT_FIELDS } from './sceneIntegratedAssemblyTestSupport.js';
import { serializeFavoritePrompt, deserializeFavoritePrompt, buildMarkdownExport, parseExportedMarkdownPrompt } from '../../features/saved-cards/cardCodec.js';

const controls = getLockControls();
const locations = controls.find(c => c.key === 'locationId').options;
const angles = controls.find(c => c.key === 'angleId').options;

test('seven approved priorities are source-backed, low-only, idempotent and fail closed', () => {
  assert.equal(Object.keys(Z_IMAGE_SCENE_DETAIL_PRIORITIES).length, 7);
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

test('1430 frozen cases permit only reviewed low-camera scene substitutions', () => {
  const baseline = JSON.parse(readFileSync(new URL('./zImageSceneDetailPriorityBaseline.json', import.meta.url), 'utf8'));
  const results = SCENE_DETAIL_PRIORITY_REGRESSION.map(runSceneFixture);
  assert.equal(results.length, baseline.count);
  const normalized = results.map((r, i) => {
    const row = SCENE_DETAIL_PRIORITY_REGRESSION[i];
    const entry = SCENE_DETAIL_PRIORITY_CASES.find(([label]) => label === row.locks.locationId?.byZh);
    const eligible = i < SCENE_DETAIL_PRIORITY_MATRIX.length && entry
      && LOW_CAMERA_LABELS.includes(angles.find(a => a.id === r.selection.angleId)?.zh);
    const output = { ...r.outputs };
    if (eligible) {
      const [, before, after] = entry;
      const prefix = `The setting is ${after}.`;
      const blocks = output.zImagePrompt.split('\n\n');
      assert.ok(blocks[1].startsWith(prefix), row.id);
      assert.equal(output.zImagePrompt.split(after).length - 1, 1, row.id);
      blocks[1] = `The setting is ${before}.` + blocks[1].slice(prefix.length);
      output.zImagePrompt = blocks.join('\n\n');
    }
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

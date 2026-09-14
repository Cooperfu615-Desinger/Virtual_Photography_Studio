import assert from 'node:assert/strict';
import { normalizeGptCameraForLegacy } from './gptCameraSpatialTestSupport.js';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { getLockControls } from '../engine.js';
import { AMBIENT_LIGHT_DESCRIPTIONS, resolveAmbientLightDescription, renderAmbientLightDescription } from './ambientLightDescriptions.js';
import { AMBIENT_MATRIX, AMBIENT_EXCLUDED } from './ambientLightFixtures.js';
import { runSceneFixture, digest, OUTPUT_FIELDS } from './sceneIntegratedAssemblyTestSupport.js';
import { serializeFavoritePrompt, deserializeFavoritePrompt, buildMarkdownExport, parseExportedMarkdownPrompt } from '../../features/saved-cards/cardCodec.js';
const baseline = JSON.parse(readFileSync(new URL('./ambientLightBaseline.json', import.meta.url), 'utf8'));
const controls = getLockControls();
const lights = controls.find(c => c.key === 'lightingId').options;
const angles = controls.find(c => c.key === 'angleId').options;
const sentence = s => s[0].toUpperCase() + s.slice(1) + '.';

test('36 authored ambient descriptions retain light cores, exact source pins and renderer-only details', () => {
  assert.equal(Object.keys(AMBIENT_LIGHT_DESCRIPTIONS).length, 36);
  for (const item of Object.values(AMBIENT_LIGHT_DESCRIPTIONS)) {
    const source = lights.find(l => l.id === item.id);
    assert.equal(source.en, item.source);
    assert.equal(resolveAmbientLightDescription(source), item);
    assert.equal(resolveAmbientLightDescription({ ...source, en: 'custom light' }), null);
    assert.equal(resolveAmbientLightDescription({ ...source, id: 'unknown' }), null);
    for (const angle of angles) {
      const z = renderAmbientLightDescription(item, 'z', angle);
      assert.ok(z.startsWith(item.core));
      assert.equal(renderAmbientLightDescription(item, 'gpt', angle), renderAmbientLightDescription(item, 'gpt'));
      assert.doesNotMatch(z, /crowded|unstable|no background|without generating|on the subject/i);
    }
  }
  assert.equal(resolveAmbientLightDescription(null), null);
  const byZh = zh => resolveAmbientLightDescription(lights.find(l => l.zh === zh));
  assert.match(renderAmbientLightDescription(byZh('藍天白雲'), 'z'), /white cloud/);
  assert.match(renderAmbientLightDescription(byZh('夏日深藍積雲'), 'z'), /cumulus/);
  assert.doesNotMatch(renderAmbientLightDescription(byZh('藍天白雲'), 'z', { zh: '高位俯視鏡頭' }), /sky|cloud/);
  assert.match(renderAmbientLightDescription(byZh('藍調傍晚'), 'z', { zh: '高位俯視鏡頭' }), /fading daylight.*cool evening/);
  assert.match(renderAmbientLightDescription(byZh('雪地冷光'), 'z', { zh: '地面高度鏡頭' }), /brightness from snow/);
  assert.match(renderAmbientLightDescription(byZh('雨後反光'), 'z', { zh: '地面高度鏡頭' }), /reflective wall textures/);
});

test('720 frozen main cases change only authored directional GPT/Z ambient', () => {
  const results = AMBIENT_MATRIX.map(runSceneFixture);
  assert.equal(results.length, baseline.count);
  const normalized = results.map((r, i) => {
    const source = lights.find(l => l.id === r.selection.lightingId);
    assert.equal(source.id, AMBIENT_MATRIX[i].locks.lightingId);
    const description = resolveAmbientLightDescription(source);
    const angle = angles.find(a => a.id === r.selection.angleId);
    const gpt = renderAmbientLightDescription(description, 'directional', angle) + '.';
    const z = sentence(renderAmbientLightDescription(description, 'z', angle));
    assert.equal(r.outputs.grokPrompt.match(/Lighting:\n([^\n]+)/)?.[1], gpt, AMBIENT_MATRIX[i].id);
    assert.equal(r.outputs.zImagePrompt.split('\n\n').at(-1), z, AMBIENT_MATRIX[i].id);
    return { ...r.outputs, grokPrompt: normalizeGptCameraForLegacy(r.outputs.grokPrompt).replace(`Lighting:\n${gpt}`, `Lighting:\n${baseline.lighting[i]}`),
      zImagePrompt: r.outputs.zImagePrompt.slice(0, -z.length) + baseline.ambient[i] };
  });
  for (const field of OUTPUT_FIELDS) assert.equal(digest(normalized.map(r => r[field])), baseline.hashes[field], field);
  assert.equal(digest(results.map(r => r.selection)), baseline.selectionHash);
  assert.equal(digest(results.map(r => r.randomDraws)), baseline.randomHash);
  for (const [i, f] of AMBIENT_EXCLUDED.entries()) {
    const r = runSceneFixture(f);
    assert.equal(digest(r.outputs), baseline.excluded[i].hash, f.id);
    assert.equal(digest(r.selection), baseline.excluded[i].selection, f.id);
    assert.equal(r.randomDraws, baseline.excluded[i].random, f.id);
  }
});

test('ambient text survives Saved Cards and Markdown without changing selection IDs', () => {
  for (const f of AMBIENT_MATRIX.filter((_, i) => i % 20 === 0)) {
    const { prompt } = runSceneFixture(f);
    const saved = deserializeFavoritePrompt(serializeFavoritePrompt(prompt));
    const md = buildMarkdownExport(prompt);
    const parsed = parseExportedMarkdownPrompt(md, controls, 'ambient-roundtrip');
    assert.equal(saved.selection.lightingId, prompt.selection.lightingId);
    assert.deepEqual(saved.extraPrompts, prompt.extraPrompts);
    for (const result of [saved, parsed]) for (const field of ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt']) assert.equal(result[field], prompt[field]);
  }
});

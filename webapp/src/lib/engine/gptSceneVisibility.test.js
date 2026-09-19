import assert from 'node:assert/strict';
import { normalizeCloseWormForLegacy } from './closeWormEyeTestSupport.js';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { getLockControls } from '../engine.js';
import { projectGptSceneSource, projectGptSceneLightingModel } from './gptSceneVisibility.js';
import { GPT_VISIBILITY_ALL } from './gptSceneVisibilityFixtures.js';
import { runSceneFixture, digest, OUTPUT_FIELDS } from './sceneIntegratedAssemblyTestSupport.js';
import { gptSection, withoutSceneLighting, expectedSceneProjection } from './gptSceneVisibilityTestSupport.js';
import { AMBIENT_LIGHT_DESCRIPTIONS, renderAmbientLightDescription } from './ambientLightDescriptions.js';
import { normalizeSubjectLightForLegacy } from './subjectLightFixtures.js';
import { normalizeHighAngleDistanceForLegacy } from './zImageFullBodyCameraTestSupport.js';
import { normalizeExplicitWardrobeFitForLegacy } from './wardrobeFitTestSupport.js';
import { serializeFavoritePrompt, deserializeFavoritePrompt, buildMarkdownExport, parseExportedMarkdownPrompt } from '../../features/saved-cards/cardCodec.js';
const baseline = JSON.parse(readFileSync(new URL('./gptSceneVisibilityBaseline.json', import.meta.url), 'utf8'));
const controls = getLockControls();
const angles = controls.find(c => c.key === 'angleId').options;

test('GPT reviewed source projection preserves identity, mixed fragments, unknown prose and punctuation', () => {
  const low = { zh: '腰部高度鏡頭' }, high = { zh: '高位俯視鏡頭' };
  assert.equal(projectGptSceneSource('engawa veranda, raised wooden deck edge, sliding door frames.', low), 'engawa veranda, sliding door frames.');
  assert.equal(projectGptSceneSource('tatami flooring, mirrored floor and mirrored ceiling.', low), 'tatami flooring, mirrored ceiling.');
  assert.equal(projectGptSceneSource('conservatory, sky and treetop fragments outside.', high), 'conservatory, treetop fragments outside.');
  assert.equal(projectGptSceneSource('tiled floor.', low, false), '');
  for (const angle of [low, high, null, { zh: 'unknown' }]) {
    const custom = 'Custom floor facts,  floor-to-ceiling window.\nLiteral text: FLOOR!';
    assert.equal(projectGptSceneSource(custom, angle), custom);
  }
});

test('GPT projection clones source roles, preserves full scene detail and all non-scene roles', () => {
  const valuesByLabel = new Map([
    ['Location', ['engawa veranda, raised wooden deck edge, sliding door frames, polished timber posts, custom detail.']],
    ['Scene Accent', ['tiled floor.']],
    ['World Scene Architecture', ['custom world, unknown ground feature.']],
    ['Action Pose', ['both heels on the floor, shoulder resting on a wall.']],
    ['Subject Light Style', ['upward bounce from damp ground or walls.']],
  ]);
  const source = { valuesByLabel, context: { angle: { zh: '地面高度鏡頭' } } };
  const before = structuredClone(source);
  const projected = projectGptSceneLightingModel(source);
  assert.deepEqual(source, before);
  assert.deepEqual(projected.valuesByLabel.get('Location'), ['engawa veranda, sliding door frames, polished timber posts, custom detail.']);
  assert.deepEqual(projected.valuesByLabel.get('Scene Accent'), []);
  for (const key of ['Action Pose', 'Subject Light Style', 'World Scene Architecture']) assert.deepEqual(projected.valuesByLabel.get(key), valuesByLabel.get(key));
});

test('frozen all-scene / ambient matrix changes only approved GPT Scene and Lighting; every other byte and selection stays fixed', () => {
  const results = GPT_VISIBILITY_ALL.map(runSceneFixture);
  assert.equal(results.length, baseline.count);
  for (const [i, r] of results.entries()) {
    const angle = angles.find(a => a.id === r.selection.angleId);
    const excluded = GPT_VISIBILITY_ALL[i].excluded;
    const oldScene = baseline.scenes[baseline.indices[i][0]];
    const oldLight = baseline.lighting[baseline.indices[i][1]];
    const ambient = AMBIENT_LIGHT_DESCRIPTIONS[r.selection.lightingId];
    const expectedLight = !excluded && ambient
      ? oldLight.replace(renderAmbientLightDescription(ambient), renderAmbientLightDescription(ambient, 'z', angle)) : oldLight;
    assert.equal(gptSection(r.outputs.grokPrompt, 'Scene'), excluded ? oldScene : expectedSceneProjection(oldScene, angle), GPT_VISIBILITY_ALL[i].id);
    assert.equal(normalizeSubjectLightForLegacy(gptSection(r.outputs.grokPrompt, 'Lighting')), expectedLight, GPT_VISIBILITY_ALL[i].id);
  }
  for (const field of OUTPUT_FIELDS) assert.equal(digest(results.map(r => field === 'grokPrompt'
    ? withoutSceneLighting(r.outputs[field])
    : normalizeHighAngleDistanceForLegacy(normalizeCloseWormForLegacy(normalizeExplicitWardrobeFitForLegacy(r.outputs[field], field), field)))), baseline.hashes[field], field);
  assert.equal(digest(results.map(r => r.selection)), baseline.selectionHash);
  assert.equal(digest(results.map(r => r.randomDraws)), baseline.randomHash);
});

test('projected GPT texts survive Saved Cards and Markdown without changing stored selection', () => {
  for (const f of GPT_VISIBILITY_ALL.filter((_, i) => i % 83 === 0)) {
    const { prompt } = runSceneFixture(f);
    const saved = deserializeFavoritePrompt(serializeFavoritePrompt(prompt));
    const parsed = parseExportedMarkdownPrompt(buildMarkdownExport(prompt), controls, 'gpt-visibility');
    // Existing codec materializes inactive empty/default values; pin selected
    // visibility controls rather than asserting a new codec normalization policy.
    for (const key of ['locationId', 'framingId', 'angleId', 'lightingId', 'lightDirectionId', 'poseBaseId', 'poseAnchorId']) {
      assert.equal(saved.selection[key], prompt.selection[key], key);
    }
    assert.deepEqual(saved.extraPrompts, prompt.extraPrompts);
    for (const field of ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt']) {
      assert.equal(saved[field], prompt[field]);
      assert.equal(parsed[field], prompt[field]);
    }
  }
});

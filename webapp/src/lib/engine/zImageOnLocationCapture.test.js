import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { Z_IMAGE_ON_LOCATION_FIXTURES as fixtures } from './zImageOnLocationFixtures.js';
import { digest, runSceneFixture, assertZImagePoseProjection } from './sceneIntegratedAssemblyTestSupport.js';
import { normalizeZImageOnLocationForLegacy } from './zImageOnLocationTestSupport.js';
import { buildZImageOnLocationCapture } from './zImageOnLocationCapture.js';
import { serializeFavoritePrompt, deserializeFavoritePrompt, buildMarkdownExport, parseExportedMarkdownPrompt } from '../../features/saved-cards/cardCodec.js';
import { getLockControls } from '../engine.js';

const baseline = JSON.parse(readFileSync(new URL('./zImageOnLocationBaseline.json', import.meta.url), 'utf8'));
const results = new Map(fixtures.map((f) => [f.id, runSceneFixture(f)]));
const get = (id) => results.get(id);

test('capture helper joins only supplied sources without changing or inventing them', () => {
  assert.equal(buildZImageOnLocationCapture(), '');
  assert.equal(buildZImageOnLocationCapture({ scene: 'Scene.', pose: 'Pose.', lighting: 'Light.', composition: 'Camera.' }),
    'Scene.\nPose.\nLight.\nCamera.');
  assert.doesNotMatch(buildZImageOnLocationCapture({ scene: 'Scene.', pose: 'Pose.' }), /light|chair|bench|bed/);
  assert.doesNotMatch(buildZImageOnLocationCapture({ hasAmbientLight: true, sceneSharesAmbientLight: true }), /photographed/);
});

test('published test prompts are the actual main renderer outputs', () => {
  const document = readFileSync(new URL('../../../../Docs/specs/z-image-on-location-v1-test-prompts.md', import.meta.url), 'utf8');
  const published = [...document.matchAll(/```text\n([\s\S]*?)\n```/g)].map((match) => match[1]);
  assert.deepEqual(published, ['bedroom-eye', 'park-eye', 'carriage-0'].map((id) => get(id).outputs.zImagePrompt));
});

for (const fixture of fixtures) test(`main-Z-only source relocation: ${fixture.id}`, () => {
  const current = get(fixture.id);
  const before = baseline.cases[fixture.id];
  assert.equal(digest(current.selection), before.selectionHash, 'selections unchanged');
  assert.equal(current.inputHash, before.inputHash);
  assert.equal(current.randomDraws, before.randomDraws);
  assert.deepEqual(runSceneFixture(fixture).outputs, current.outputs, 'same seed');
  for (const [field, value] of Object.entries(current.outputs)) {
    if (field === 'zImagePrompt') {
      assert.equal(normalizeZImageOnLocationForLegacy(value), before.zImagePrompt,
        'only reviewed relocation/ambient connection; every surviving source unchanged');
    } else assert.equal(digest(value), before.outputHashes[field], `${field}: byte-exact isolation`);
  }
  if (fixture.mode !== 'duo') assertZImagePoseProjection(current.prompt);
});

test('bedroom and park bind selected seats, hands and light without replacing support', () => {
  for (const [id, seat] of [['bedroom-eye', 'bed'], ['park-eye', 'bench'], ['bedroom-worm', 'bed'], ['park-worm', 'bench']]) {
    const text = get(id).outputs.zImagePrompt;
    const capture = text.split('\n\n')[1];
    assert.match(capture, new RegExp(`sitting pose on a ${seat}`));
    assert.match(capture, /both hands gathering one thick bundle of hair/);
    assert.match(capture, /warm golden-amber subject color/);
    assert.equal(text.split("She is photographed within the scene's ambient light.").length - 1, 1);
    assert.match(text, /94-58-92 body proportion anchor/);
    assert.match(text, /tight body-skimming upper-body fit/);
  }
  assert.match(get('park-bed-not-replaced').outputs.zImagePrompt, /sitting pose on a bed/);
  assert.doesNotMatch(get('park-bed-not-replaced').outputs.zImagePrompt, /on a bench/);
});

test('fixed carriage keeps preset takeover, window/camera layout and one ambient relationship', () => {
  const text = get('carriage-0').outputs.zImagePrompt;
  const capture = text.split('\n\n')[1];
  assert.match(capture, /perpendicular to the window wall/);
  assert.match(capture, /sea, coastal scenery/);
  assert.match(capture, /hips resting on the cushion[\s\S]*hands rest loosely in her lap/);
  assert.doesNotMatch(text, /both hands gathering/);
  assert.equal(text.split('shares its ambient light').length - 1, 1);
  assert.doesNotMatch(text, /She is photographed within/);
});

test('none and excluded paths do not acquire a fictitious capture or ambient source', () => {
  for (const id of ['no-scene', 'no-pose', ...fixtures.filter((f) => f.excluded).map((f) => f.id)]) {
    assert.equal(get(id).outputs.zImagePrompt, baseline.cases[id].zImagePrompt, id);
  }
  for (const id of ['no-lights', 'subject-light-only']) assert.doesNotMatch(get(id).outputs.zImagePrompt, /within the scene's ambient light/);
  assert.doesNotMatch(get('no-lights').outputs.zImagePrompt.split('\n\n')[1], /golden-amber|daylight|scene's ambient/);
  assert.match(get('subject-light-only').outputs.zImagePrompt, /warm golden-amber subject color/i);
});

test('new capture text round-trips without a new selection/storage schema', () => {
  for (const id of ['bedroom-eye', 'park-eye', 'carriage-0']) {
    const { prompt } = get(id);
    const saved = deserializeFavoritePrompt(serializeFavoritePrompt(prompt));
    const markdown = parseExportedMarkdownPrompt(buildMarkdownExport(prompt), getLockControls(), 'on-location');
    assert.equal(saved.zImagePrompt, prompt.zImagePrompt);
    assert.equal(markdown.zImagePrompt, prompt.zImagePrompt);
    for (const key of ['poseBaseId', 'poseHandId', 'poseAnchorId', 'locationId', 'fixedCompositionSetId']) {
      assert.deepEqual(saved.selection[key], prompt.selection[key], key);
    }
  }
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  SCENE_INTEGRATED_ASSEMBLY_FIXTURES as fixtures,
  SCENE_INTEGRATED_OBSERVATION_CARD as observationCard,
} from './sceneIntegratedAssemblyFixtures.js';
import {
  digest, materializeSceneFixture, OUTPUT_FIELDS, readSceneOutputs,
  restoreBaselineSelection, runSceneFixture, stableValue, assertZImagePoseProjection,
} from './sceneIntegratedAssemblyTestSupport.js';
import { validatePromptOutputContract } from './promptOutputContracts.js';
import { createEmptyLocks, getLockControls, normalizeLocks } from '../engine.js';
import { buildObservationCapturePrompt } from '../observationCaptureLab.js';
import {
  buildMarkdownExport, compactPromptSelection, deserializeFavoritePrompt,
  parseExportedMarkdownPrompt, serializeFavoritePrompt,
} from '../../features/saved-cards/cardCodec.js';

// Historical reference: do not regenerate this baseline to make a future
// renderer change pass. Introduce scoped new expectations in the rollout phase,
// keeping the excluded fields and selection reference immutable.
const baseline = JSON.parse(readFileSync(new URL('./sceneIntegratedAssemblyBaseline.json', import.meta.url), 'utf8'));
const zExpected = JSON.parse(readFileSync(new URL('./sceneDirectionalZImageExpected.json', import.meta.url), 'utf8'));
const mjExpected = JSON.parse(readFileSync(new URL('./sceneIntegratedMidjourneyExpected.json', import.meta.url), 'utf8'));
const results = new Map(fixtures.map((fixture) => [fixture.id, runSceneFixture(fixture)]));
const get = (id) => { assert.ok(results.has(id), id); return results.get(id); };
const pose = (result) => result.outputs.grokPrompt.match(/Pose and Composition:\n([\s\S]*?)(?:\n\n|$)/)?.[1] || '';

test('main MJ integrates location and intact pose before wardrobe, with optics but no style or film', () => {
  for (const id of ['R01-squat-low-selfie', 'R02-kneel-high-selfie', 'R14-mj-imaging']) {
    const result = get(id);
    const text = result.outputs.midjourneyPrompt;
    const canonical = pose(result);
    assert.ok(text.indexOf('The setting is ') > 0);
    assert.ok(text.indexOf('The setting is ') < text.indexOf('A 20s'));
    assert.ok(text.indexOf(canonical) < text.indexOf('Wearing '));
    assert.equal(text.split(canonical).length - 1, 1);
    assert.doesNotMatch(text, /Guy Bourdin|neon cross-processed/i);
    assert.match(result.outputs.chestUpMjPortraitPrompt, /Guy Bourdin|neon cross-processed/i);
  }
  const imaging = get('R14-mj-imaging').outputs.midjourneyPrompt;
  assert.match(imaging, /50mm/);
  assert.match(imaging, /bloom/i);
  assert.match(imaging, /f\/2\.8/);
  assert.match(imaging, /1\/1000s/);
  assert.doesNotMatch(get('R12-scene-none').outputs.midjourneyPrompt, /The setting is|\bnone\b/i);
});

test('MJ style/film omission is source-owned, with no effect on selected optics or saved choices', () => {
  const source = fixtures.find((f) => f.id === 'R14-mj-imaging');
  const omitted = { styleId: { byZh: '全無' }, filmId: { byZh: '全無' } };
  const base = runSceneFixture({ ...source, locks: { ...source.locks, ...omitted } });
  for (const key of ['styleId', 'filmId']) {
    const options = getLockControls().find((c) => c.key === key).options
      .filter((o) => !['全無', '隨機'].includes(o.zh));
    for (const option of options) {
      const result = runSceneFixture({ ...source, locks: { ...source.locks, ...omitted, [key]: option.id } });
      assert.equal(result.selection[key], option.id);
      assert.equal(result.outputs.midjourneyPrompt, base.outputs.midjourneyPrompt, `${key}/${option.id}: no owned prose aliases leak`);
      assert.match(result.outputs.midjourneyPrompt, /50mm.*f\/2\.8.*1\/1000s.*bloom/i);
    }
  }
});

test('MJ source order retains capture once, omits hidden hands, and keeps composition modifiers early', () => {
  for (const [id, pattern] of [
    ['R01-squat-low-selfie', /front-camera self-shot/gi],
    ['R06-mirror-selfie', /for a mirror selfie/gi],
    ['R07-companion-selfie', /boyfriend-or-best-friend point of view/gi],
  ]) {
    const text = get(id).outputs.midjourneyPrompt;
    assert.equal(text.match(pattern)?.length, 1);
    assert.ok(text.indexOf(pose(get(id))) < text.indexOf('Wearing '));
  }
  for (const id of ['R08-crop-head', 'R08-crop-face']) {
    assert.doesNotMatch(get(id).outputs.midjourneyPrompt, /self-shot|right arm extended|phone just beyond/i);
  }
  const palm = get('R10-palm-occlusion').outputs.midjourneyPrompt;
  assert.ok(palm.indexOf('The camera lens is intentionally blocked') < palm.indexOf('A 20s'));
  for (const id of ['R01-squat-low-selfie', 'R02-kneel-high-selfie']) {
    const text = get(id).outputs.midjourneyPrompt;
    assert.equal(text.match(/Shinjuku Kabukicho Ichibangai entrance/g)?.length, 1);
    const previous = baseline.cases[id].outputs.midjourneyPrompt;
    const wardrobe = previous.match(/Wearing [\s\S]*?(?= She )/)?.[0];
    assert.ok(wardrobe && text.includes(wardrobe), 'visible wardrobe is not shortened by scene integration');
    assert.equal(text.match(/--v [\s\S]+$/)?.[0], previous.match(/--v [\s\S]+$/)?.[0]);
  }
});

test('scene assembly baseline covers all 19 families with immutable test inputs', () => {
  assert.equal(baseline.phase, 'behavior-neutral-baseline');
  assert.equal(fixtures.length, 45);
  assert.equal(new Set(fixtures.map((f) => f.id)).size, fixtures.length);
  assert.deepEqual(Object.keys(baseline.cases).sort(), fixtures.map((f) => f.id).sort());
  assert.deepEqual([...new Set(fixtures.map((f) => f.family))].sort(),
    Array.from({ length: 19 }, (_, i) => `R${String(i + 1).padStart(2, '0')}`));
  assert.ok(Object.isFrozen(fixtures[0].locks));
  assert.equal(fixtures.filter((f) => f.excluded).length, 10);
});

test('fixture selectors fail closed instead of falling back or silently accepting ambiguous labels', () => {
  assert.throws(() => materializeSceneFixture({ id: 'bad', locks: { typoControl: 'none' } }), /unknown control/);
  assert.throws(() => materializeSceneFixture({ id: 'bad', locks: { shoesId: 'none' } }), /unknown raw id/);
  assert.throws(() => materializeSceneFixture({ id: 'bad', locks: { topId: { byZh: 'missing' } } }), /missing/);
  assert.throws(() => materializeSceneFixture({ id: 'bad', locks: { topId: { byZh: 'duplicate' } } }, [
    { key: 'topId', options: [{ id: 'a', zh: 'duplicate' }, { id: 'b', zh: 'duplicate' }] },
  ]), /ambiguous/);
});

for (const fixture of fixtures) {
  test(`scene assembly scoped Z/MJ revisions and unchanged baseline: ${fixture.id}`, () => {
    const first = get(fixture.id);
    const repeated = runSceneFixture(fixture);
    const entry = baseline.cases[fixture.id];
    assert.equal(first.inputHash, entry.inputHash, 'resolved fixture inputs changed');
    assert.equal(first.randomDraws, entry.randomDraws, 'random stream consumption changed');
    assert.deepEqual(first.selection, restoreBaselineSelection(baseline, entry), 'resolved selections changed');
    assert.deepEqual(first.outputs, repeated.outputs, 'same-seed outputs changed');
    assert.deepEqual(first.selection, repeated.selection);
    assert.equal(repeated.randomDraws, first.randomDraws);
    for (const field of OUTPUT_FIELDS) {
      const expectedHash = field === 'zImagePrompt' && !fixture.excluded
        ? zExpected.cases[fixture.id].hash : field === 'midjourneyPrompt' && !fixture.excluded
          ? mjExpected.cases[fixture.id].hash : entry.outputHashes[field];
      assert.equal(digest(first.outputs[field]), expectedHash, `${field}: scoped output drift`);
      assert.deepEqual(validatePromptOutputContract(field, first.outputs[field], {
        mode: fixture.mode,
        allowedLanguageLiterals: field === 'zImagePrompt' && first.selection.zImageVisibleTextEnabled
          ? [first.selection.zImageVisibleTextContent] : [],
      }), [], `${field}: output contract`);
    }
    if (entry.outputs) assert.deepEqual(first.outputs, {
      ...entry.outputs, zImagePrompt: zExpected.cases[fixture.id].text,
      midjourneyPrompt: mjExpected.cases[fixture.id].text,
    }, 'only the approved Z/MJ core text changes');
    if (fixture.mode === 'single') assertZImagePoseProjection(first.prompt);
  });
}

test('GPT and MJ retain canonical contact while Z omits only the independent anchor', () => {
  for (const fixture of fixtures.filter((f) => !f.excluded)) {
    const result = get(fixture.id);
    const canonical = pose(result);
    if (!canonical) continue;
    assertZImagePoseProjection(result.prompt);
    assert.ok(result.outputs.midjourneyPrompt.includes(canonical), fixture.id);
  }
  const withAnchor = get('R01-squat-low-selfie');
  const withoutAnchor = get('R03-squat-no-anchor');
  const left = { ...withAnchor.selection, poseAnchorId: 'none' };
  assert.deepEqual(left, withoutAnchor.selection, 'anchor pair must differ in one selection only');
  assert.equal(withAnchor.randomDraws, withoutAnchor.randomDraws);
  assert.match(pose(withAnchor), /upper back resting against an existing vertical surface/);
  assert.doesNotMatch(pose(withoutAnchor), /vertical surface|body-weight support/);
  assert.equal(withAnchor.outputs.zImagePrompt, withoutAnchor.outputs.zImagePrompt);
  assert.doesNotMatch(withAnchor.outputs.zImagePrompt, /upper back resting against/);
  assert.match(pose(get('R05-elbows-on-knees')), /both elbows resting firmly on top of the knees/);
});

test('core Z cases reorder existing scene and capture without reducing subject, wardrobe or imaging', () => {
  for (const id of ['R01-squat-low-selfie', 'R02-kneel-high-selfie']) {
    const previous = baseline.cases[id].outputs.zImagePrompt.split('\n\n');
    const current = get(id).outputs.zImagePrompt.split('\n\n');
    assert.equal(current[0], previous[0], 'image type');
    assert.equal(current[2], previous[2], 'all effective subject sources');
    assert.equal(current[4], previous[3], 'all crop-visible wardrobe sources');
    assert.deepEqual(current.slice(-2), previous.slice(-2), 'style and imaging');
    assert.ok(current[1].includes(previous[1]), 'existing composition remains intact');
    const sourceScene = previous[5].replace(/^The scene is /, '').replace(/\.$/, '');
    const [identity] = sourceScene.split(', ');
    assert.ok(current[1].startsWith(`The setting is ${sourceScene}.`));
    assert.equal(current.join('\n').split(identity).length - 1, 1, 'location identity is not repeated');
    assert.doesNotMatch(current[5], /steel arch supports|layered signboards/i, 'scene details occur only in the opening');
    assert.match(current[5], id === 'R02-kneel-high-selfie' ? /^Blue hour environment, neon color spill/i : /^Golden sunset environment, warm orange-pink sky gradient/i);
    assert.doesNotMatch(current[5], /deep blue dusk sky/i);
    assert.match(current[1], /self-shot.*right arm extended/i);
    assert.doesNotMatch(current[3], /self-shot|phone|vertical surface/);
  }
  assert.match(get('R05-elbows-on-knees').outputs.zImagePrompt, /both elbows resting firmly on top of the knees/);
});

test('Z does not invent settings or restore selfie hands hidden by the selected crop', () => {
  assert.doesNotMatch(get('R12-scene-none').outputs.zImagePrompt, /The setting is|The scene is|\bnone\b|全無/i);
  for (const id of ['R08-crop-head', 'R08-crop-face']) {
    assert.doesNotMatch(get(id).outputs.zImagePrompt, /self-shot|right arm extended|phone just beyond/i);
  }
  assert.match(get('R06-mirror-selfie').outputs.zImagePrompt.split('\n\n')[1], /visible phone.*mirror/);
  assert.doesNotMatch(get('R06-mirror-selfie').outputs.zImagePrompt, /phone just beyond the frame/);
  assert.match(get('R07-companion-selfie').outputs.zImagePrompt.split('\n\n')[1], /boyfriend-or-best-friend point of view/);
});

test('an explicit prop keeps priority and cannot leak a second selfie action into capture context', () => {
  const source = fixtures.find((f) => f.id === 'R02-kneel-high-selfie');
  const result = runSceneFixture({ ...source, locks: { ...source.locks, posePropId: 'hand-hold-iced-coffee' } });
  assertZImagePoseProjection(result.prompt);
  assert.match(result.outputs.zImagePrompt, /iced coffee/i);
  assert.doesNotMatch(result.outputs.zImagePrompt, /front-camera self-shot|phone just beyond|right arm extended/i);
  assert.ok(!result.outputs.zImagePrompt.split('\n\n')[1].includes('iced coffee'), 'prop remains in pose rather than capture');
});

test('selfie types, arbitrary kneeling and optics keep their existing source semantics', () => {
  assert.match(pose(get('R02-kneel-high-selfie')), /natural kneeling pose/);
  assert.match(pose(get('R02-kneel-high-selfie')), /right arm extended/);
  assert.doesNotMatch(pose(get('R02-kneel-high-selfie')), /free hand rests|both knees|one knee/);
  assert.match(pose(get('R06-mirror-selfie')), /visible phone.*mirror/);
  assert.doesNotMatch(pose(get('R06-mirror-selfie')), /phone just beyond the frame/);
  assert.match(pose(get('R07-companion-selfie')), /boyfriend-or-best-friend point of view/);
  for (const field of ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt']) {
    if (field !== 'midjourneyPrompt') {
      assert.match(get('R14-mj-imaging').outputs[field], /Guy Bourdin/);
      assert.match(get('R14-mj-imaging').outputs[field], /neon cross-processed/i);
    }
    assert.match(get('R14-mj-imaging').outputs[field], /50mm/);
    assert.match(get('R14-mj-imaging').outputs[field], /bloom/i);
  }
  assert.match(get('R13-optics').outputs.zImagePrompt, /f\/2\.8/);
  assert.match(get('R13-optics').outputs.zImagePrompt, /1\/1000s/);
});

test('supine surface sources survive tight crops while ordinary hidden footwear stays omitted', () => {
  for (const fixture of fixtures.filter((f) => f.family === 'R17')) {
    const result = get(fixture.id);
    assert.equal(result.selection.locationId, 'none');
    assert.equal(result.selection.sceneAttributeId, 'none');
    const source = fixture.locks.poseAnchorId;
    const pattern = source === 'lying-bed-surface' ? /bed that dominates the composition/
      : source === 'water-immersed' ? /floating on her back.*clear water/ : /floating on her back.*seawater/;
    for (const field of ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt']) {
      assert.match(result.outputs[field], pattern, `${fixture.id}/${field}`);
    }
  }
  for (const id of ['R08-crop-medium', 'R08-crop-face']) {
    const result = get(id);
    for (const field of ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt']) {
      assert.doesNotMatch(result.outputs[field], /barefoot/i);
    }
    assert.match(result.outputs.fullBodyCharacterPrompt, /barefoot/i);
  }
});

test('exact visible text remains Z-only and saved text round-trips through the existing codec', () => {
  const on = get('R18-exact-text-on');
  const off = get('R18-exact-text-off');
  assert.equal(on.outputs.zImagePrompt.split('測試招牌').length - 1, 1);
  for (const field of OUTPUT_FIELDS) {
    if (field !== 'zImagePrompt') assert.ok(!on.outputs[field].includes('測試招牌'));
    assert.ok(!off.outputs[field].includes('測試招牌'));
  }
  for (const id of ['R01-squat-low-selfie', 'R02-kneel-high-selfie', 'R18-exact-text-on']) {
    const { prompt, outputs } = get(id);
    const record = serializeFavoritePrompt(prompt);
    const restored = deserializeFavoritePrompt(record);
    assert.deepEqual(readSceneOutputs(restored), outputs);
    // Storage normalizes missing/empty legacy values to its established defaults.
    // Assert the established restore rule, not raw generation field presence.
    assert.deepEqual(restored.selection, normalizeLocks({ ...createEmptyLocks(), ...record.l }));
    for (const [key, value] of Object.entries(compactPromptSelection(prompt.selection))) {
      assert.deepEqual(record.l[key], value, `${id}: effective saved selection ${key}`);
    }
    // Markdown historically restores primary text and inferred locks, not a
    // lossless ZIP round trip. Do not silently demand a new import contract.
    const markdown = buildMarkdownExport(prompt);
    for (const heading of ['Z-Image', 'Grok/Z-Image', 'Z-Image Prompt']) {
      const parsed = parseExportedMarkdownPrompt(markdown.replace('## Z-Image\n', `## ${heading}\n`), getLockControls(), 'test-import');
      for (const field of ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt']) {
        assert.equal(parsed[field], outputs[field], `${id}/${heading}/${field}`);
      }
    }
  }
});

test('reverse generation order and independent observation workspace preserve baseline state', () => {
  const observe = () => buildObservationCapturePrompt([observationCard], {
    characterProfileId: observationCard.id, generationSeed: 17,
  });
  const before = stableValue(observe());
  assert.equal(digest(before), baseline.observationHash);
  for (const fixture of [...fixtures].reverse()) {
    const result = runSceneFixture(fixture);
    assert.deepEqual(result.outputs, get(fixture.id).outputs, fixture.id);
    assert.deepEqual(result.selection, get(fixture.id).selection, fixture.id);
  }
  assert.deepEqual(stableValue(observe()), before);
});

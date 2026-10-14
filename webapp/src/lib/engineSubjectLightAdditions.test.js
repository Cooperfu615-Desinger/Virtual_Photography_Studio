import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls, normalizeLocks } from './engine.js';
import { SUBJECT_LIGHT_SOURCE_CASES } from './engine/subjectLightFixtures.js';
import { deserializeFavoritePrompt, parseLocksFromStandardPrompt, serializeFavoritePrompt } from '../features/saved-cards/cardCodec.js';

const NEW_SUBJECT_LIGHT_CASES = Object.freeze([
  ['正面強硬光', 'strong hard key light from in front of the subject, bright frontal highlights and compact crisp shadows, preserved skin and clothing detail'],
  ['機頂直閃', 'hard direct flash from near the camera axis, bright highlights on the visible subject and crisp compact shadows, natural light falloff'],
  ['蝴蝶光', 'raised frontal butterfly key light on the subject, a small centered shadow beneath the nose, defined cheekbone highlights'],
  ['倫勃朗光', 'raised oblique Rembrandt key light on the subject, a small light triangle on the shadowed cheek, pronounced facial modeling'],
  ['分割光', 'side split key light on the subject, one facial half illuminated and the other in shadow, clear light-dark separation'],
  ['下方硬質主光', 'hard upward key light on the subject, upward-cast nose and brow shadows, bright lower facial planes'],
]);

const controls = getLockControls();
const options = key => {
  const control = controls.find(entry => entry.key === key);
  assert.ok(control, `Missing control ${key}`);
  return control.options;
};
const option = (key, zh) => {
  const result = options(key).find(entry => entry.zh === zh);
  assert.ok(result, `Missing ${key}: ${zh}`);
  return result;
};
const noneLocks = () => Object.fromEntries([
  ...Object.entries(createEmptyLocks()),
  ...controls.filter(control => control.options.some(entry => ['全無', '無額外表情'].includes(entry.zh)))
    .map(control => [control.key, control.options.find(entry => ['全無', '無額外表情'].includes(entry.zh)).id]),
]);
const baseLocks = () => ({
  ...noneLocks(),
  subjectCount: '1',
  framingId: option('framingId', '中景鏡頭 (Medium Shot)').id,
  angleId: option('angleId', '平視高度鏡頭').id,
  orbitId: option('orbitId', '正面 0 度').id,
  locationId: option('locationId', '室內：深邃黑幕').id,
});
const generate = locks => generatePrompts(1, locks, [], { random: createSeededRandom('subject-light-additions-v1') })[0];
const extraText = (result, id) => {
  const extra = result.extraPrompts.find(entry => entry.id === id);
  assert.ok(extra, `Missing extra prompt ${id}`);
  return extra.text;
};
const sourcePresent = (text, source) => text.toLowerCase().includes(source.toLowerCase());
const poseSection = result => result.grokPrompt.match(/(?:^|\n\n)Pose and Composition:\n([\s\S]*?)(?=\n\n[A-Z][A-Za-z ]+:\n|$)/)?.[1] || '';

test('six subject lights append stable ids without changing the previous 26 choices', () => {
  const lights = options('lightDirectionId');
  assert.equal(lights.length, 32);
  assert.deepEqual(lights.slice(0, 26).map(entry => entry.zh), ['全無', ...SUBJECT_LIGHT_SOURCE_CASES.map(([label]) => label)]);
  assert.equal(lights[0].id, 'camera:光線表現-light-style:全無:0');
  assert.equal(lights[0].en, 'none');
  for (const [index, [label, source]] of SUBJECT_LIGHT_SOURCE_CASES.entries()) {
    assert.equal(lights[index + 1].id, `camera:光線表現-light-style:${label}:${index + 1}`);
    assert.equal(lights[index + 1].en, source, `${label}: existing English is unchanged`);
  }
  for (const [index, [label, source]] of NEW_SUBJECT_LIGHT_CASES.entries()) {
    const entry = lights[index + 26];
    assert.equal(entry.zh, label);
    assert.equal(entry.id, `camera:光線表現-light-style:${label}:${index + 26}`);
    assert.equal(entry.en, source);
  }
});

test('six additions describe only subject light and keep their distinctive geometry first', () => {
  const disallowedFacts = /\b(?:sky|sunset|weather|rain|street|room|studio|wall|floor|lamp|light stand|softbox|reflector|chair|standing|seated|kneeling|dress|shirt|jacket|bikini|lens|focal length|film|overexposed)\b/i;
  for (const [label, source] of NEW_SUBJECT_LIGHT_CASES) {
    assert.equal(option('lightDirectionId', label).en, source);
    assert.ok(source.split(/\s+/).length <= 24, `${label}: compact English source`);
    assert.doesNotMatch(source, disallowedFacts, `${label}: no scene, pose, garment or imaging override`);
    assert.match(source.split(', ')[0], /subject|camera axis/);
  }
  assert.match(NEW_SUBJECT_LIGHT_CASES[0][1].split(', ')[0], /from in front of the subject/);
  assert.match(NEW_SUBJECT_LIGHT_CASES[1][1].split(', ')[0], /near the camera axis/);
});

for (const [label, source] of NEW_SUBJECT_LIGHT_CASES) {
  test(`${label} retains the same selected light in main and chest outputs without changing the character reference`, () => {
    const selected = option('lightDirectionId', label);
    const result = generate({ ...baseLocks(), lightDirectionId: selected.id });
    assert.equal(result.selection.lightDirectionId, selected.id);
    assert.ok(sourcePresent(result.grokPrompt, source), 'GPT retains complete source');
    assert.ok(sourcePresent(result.zImagePrompt, source.split(', ').slice(0, 2).join(', ')), 'Z retains first two source clauses');
    assert.ok(sourcePresent(result.midjourneyPrompt, source.split(', ')[0]), 'MJ retains distinctive first clause');
    assert.ok(sourcePresent(extraText(result, 'chest-up-portrait'), source), 'Chest GPT retains the same complete light');
    const reference = extraText(result, 'full-body-character');
    assert.match(reference, /Clean even lighting/i);
    assert.ok(!reference.includes(source.split(', ')[0]), 'Character reference does not inherit selected light');
    assert.match(result.summary, new RegExp(label));
  });

  test(`${label} survives full-source text refill and saved-selection restore`, () => {
    const selected = option('lightDirectionId', label);
    assert.equal(parseLocksFromStandardPrompt(`Lighting:\n${source}.`, controls).locks.lightDirectionId, selected.id);
    const result = generate({ ...baseLocks(), lightDirectionId: selected.id });
    const restored = deserializeFavoritePrompt(serializeFavoritePrompt(result));
    assert.equal(restored.selection.lightDirectionId, selected.id);
    assert.equal(normalizeLocks(restored.selection).lightDirectionId, selected.id);
    assert.equal(restored.grokPrompt, result.grokPrompt);
  });
}

test('subject-light none remains silent without replacing the character-reference lighting policy', () => {
  const result = generate({ ...baseLocks(), lightDirectionId: option('lightDirectionId', '全無').id });
  assert.equal(result.selection.lightDirectionId, option('lightDirectionId', '全無').id);
  for (const text of [result.grokPrompt, result.zImagePrompt, result.midjourneyPrompt,
    extraText(result, 'chest-up-portrait')]) {
    assert.doesNotMatch(text, /Lighting:|subject light|key light|direct flash|subject lighting|\bnone\b|unspecified/i);
  }
  assert.match(extraText(result, 'full-body-character'), /Clean even lighting/i);
});

test('frontal key and camera-axis flash do not turn back or side views toward the camera', () => {
  for (const orbit of ['背面 180 度', '左側 90 度']) {
    const locks = { ...baseLocks(), orbitId: option('orbitId', orbit).id,
      poseBaseId: 'standing', poseArrangementId: 'standing-natural', poseHeadId: 'chin-slightly-raised' };
    const withoutLight = generate({ ...locks, lightDirectionId: option('lightDirectionId', '全無').id });
    assert.ok(poseSection(withoutLight), 'Selected standing pose is visible');
    for (const [label, source] of NEW_SUBJECT_LIGHT_CASES.slice(0, 2)) {
      const result = generate({ ...locks, lightDirectionId: option('lightDirectionId', label).id });
      for (const key of ['orbitId', 'angleId', 'poseBaseId', 'poseArrangementId', 'poseHandId', 'poseHeadId', 'poseAnchorId']) {
        assert.equal(result.selection[key], withoutLight.selection[key], `${label}/${orbit}: unchanged ${key}`);
      }
      assert.equal(poseSection(result), poseSection(withoutLight), `${label}/${orbit}: no forced person rotation`);
      assert.ok(sourcePresent(result.grokPrompt, source));
      if (orbit === '背面 180 度') assert.match(result.grokPrompt, /back view|rear-facing/i);
      else assert.match(result.grokPrompt, /left-side view|left-side profile|left profile/i);
    }
  }
});

test('fixed Japanese carriage smoke retains each newly selected shared light source', () => {
  for (const [label, source] of NEW_SUBJECT_LIGHT_CASES) {
    const result = generate({ ...baseLocks(), fixedCompositionSetId: option('fixedCompositionSetId', '電車車廂正面長椅視角').id,
      fixedSetPositionId: 'carriage-bench-upright', lightDirectionId: option('lightDirectionId', label).id });
    assert.equal(result.selection.lightDirectionId, option('lightDirectionId', label).id);
    assert.equal(result.selection.fixedSetPositionId, 'carriage-bench-upright');
    assert.ok(sourcePresent(result.grokPrompt, source), `${label}: full GPT shared source`);
    for (const [field, text] of [['Z', result.zImagePrompt], ['MJ', result.midjourneyPrompt],
      ['chest GPT', extraText(result, 'chest-up-portrait')]]) {
      assert.ok(sourcePresent(text, source.split(', ')[0]), `${label}: ${field} retains shared light core`);
    }
  }
});

test('duo smoke uses the same subject-light source without inventing a second lighting setup', () => {
  for (const [label, source] of NEW_SUBJECT_LIGHT_CASES) {
    const result = generate({ ...baseLocks(), subjectCount: '2', lightDirectionId: option('lightDirectionId', label).id });
    assert.equal(result.selection.lightDirectionId, option('lightDirectionId', label).id);
    assert.ok(sourcePresent(result.grokPrompt, source), `${label}: duo GPT retains full source`);
    assert.ok(sourcePresent(result.zImagePrompt, source.split(', ')[0]), `${label}: duo Z retains shared source`);
    assert.ok(sourcePresent(result.midjourneyPrompt, source.split(', ')[0]), `${label}: duo MJ retains shared source`);
    assert.equal(result.extraPrompts.length, 0, 'Single-subject derived outputs stay absent in duo');
  }
});

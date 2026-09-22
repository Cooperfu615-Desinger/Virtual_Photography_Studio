import assert from 'node:assert/strict';
import test from 'node:test';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import { FIXED_FRAMING_DERIVED_PROMPT_FIXTURES } from './fixedFramingDerivedPromptFixtures.js';
import { attachMidjourneySettingsToPrompt, createPromptGenerationLocks } from '../../features/page1/midjourneyParameterState.js';
import { serializeFavoritePrompt, deserializeFavoritePrompt } from '../../features/saved-cards/cardCodec.js';
import { POSE_COMPOSER_ANCHOR_OPTIONS } from './poseComposerOptions.js';

const controls = getLockControls();
const option = (key, zh) => {
  const found = controls.find(control => control.key === key)?.options.find(entry => entry.zh === zh);
  assert.ok(found, `${key}: ${zh}`);
  return found.id;
};
const extra = (prompt, id) => prompt.extraPrompts.find(entry => entry.id === id)?.text || '';
const section = (text, label) => text.split(`${label}:\n`)[1]?.split('\n\n')[0] || '';
const chestTexts = prompt => ['chest-up-portrait', 'chest-up-mj-portrait'].map(id => extra(prompt, id));

function fixture(overrides = {}) {
  const locks = createEmptyLocks();
  for (const control of controls) {
    const none = control.options.find(entry => entry.zh === '全無' || entry.zh === '無額外表情');
    if (none) locks[control.key] = none.id;
  }
  for (const [key, value] of Object.entries(FIXED_FRAMING_DERIVED_PROMPT_FIXTURES[0].locks)) {
    locks[key] = value?.byZh ? option(key, value.byZh) : value;
  }
  return { ...locks, aspectRatio: '4:5', ...overrides };
}

function generate(overrides = {}) {
  return generatePrompts(1, fixture(overrides), [], { random: createSeededRandom('chest-up-same-state-v1') })[0];
}

test('both chest crops own 4:5 without changing the source ratio or selection', () => {
  for (const aspectRatio of ['16:9', '9:16', '1:1', '4:5']) {
    const prompt = generate({ aspectRatio });
    const [gpt, mj] = chestTexts(prompt);
    assert.match(section(gpt, 'Composition'), /Vertical portrait composition at a 4:5 aspect ratio/);
    assert.match(mj, /--ar 4:5\b/);
    assert.equal(prompt.selection.aspectRatio, aspectRatio);
    assert.ok(prompt.grokPrompt.includes(`a ${aspectRatio} aspect ratio`));
  }
});

test('chest GPT uses the main lighting, camera and scene policy with full source identity', () => {
  const prompt = generate({ angleId: option('angleId', '高位俯視鏡頭') });
  const chest = extra(prompt, 'chest-up-portrait');
  assert.equal(section(chest, 'Lighting'), section(prompt.grokPrompt, 'Lighting'));
  assert.equal(section(chest, 'Scene'), section(prompt.grokPrompt, 'Scene'));
  assert.equal(section(chest, 'Camera Look'), section(prompt.grokPrompt, 'Camera Look'));
  assert.match(section(chest, 'Composition'), /camera|photographed/i);
  assert.doesNotMatch(section(chest, 'Composition'), /entire figure|head to feet/);
});

test('chest MJ uses main MJ imaging semantics including aperture and shutter', () => {
  const prompt = generate({
    filmId: option('filmId', '高階黑白灰階'),
    apertureId: option('apertureId', 'f/1.4 極淺景深散景'),
    shutterId: option('shutterId', '1/30s 主體動態殘影'),
  });
  const chest = extra(prompt, 'chest-up-mj-portrait');
  for (const text of [prompt.midjourneyPrompt, chest]) {
    assert.match(text, /f\/1\.4-style ultra shallow depth of field/);
    assert.match(text, /1\/30s slow-shutter portrait blur/);
    assert.match(text, /narrow field of view/);
    assert.doesNotMatch(text, /Orie Ichihashi|premium monochrome|black-and-white tonal response/);
    assert.ok(text.indexOf('The setting is') < text.indexOf('Japanese woman'));
    assert.ok(text.indexOf('She has') < text.indexOf('Wearing'));
  }
});

test('fixed chest identity and scene are independent of the parent crop', () => {
  const orbitId = option('orbitId', '左側 90 度');
  const full = generate({ orbitId });
  const close = generate({ orbitId, framingId: option('framingId', '半臉傾斜特寫') });
  assert.equal(full.selection.bodyTypeId, close.selection.bodyTypeId);
  assert.deepEqual(chestTexts(full), chestTexts(close));
  assert.doesNotMatch(extra(full, 'chest-up-mj-portrait'), /defined waist|rounded hips/);
});

test('chest crops retain the selected posture and manual seat without demanding hidden legs', () => {
  const seated = generate({ poseBaseId: 'sitting', poseArrangementId: 'sitting-natural', poseAnchorId: 'sitting-ornate-velvet-armchair' });
  for (const text of chestTexts(seated)) {
    assert.match(text, /sitting|seated/);
    assert.match(text, /in an ornate single velvet armchair/);
    assert.match(text, /one hand touching the chin/);
    assert.doesNotMatch(text, /straight-leg jeans/);
  }
  const squat = generate({ poseBaseId: 'squatting', poseArrangementId: 'squatting-natural', poseAnchorId: 'none' });
  for (const text of chestTexts(squat)) {
    assert.match(text, /squatting/);
    assert.doesNotMatch(text, /both feet planted|heels grounded|knees deeply bent/);
  }
});

test('all nine manual sitting objects survive both chest crops as posture context', () => {
  const seats = POSE_COMPOSER_ANCHOR_OPTIONS.filter(entry => entry.base === 'sitting' && entry.meta?.preserveInSceneIntegratedZ);
  assert.equal(seats.length, 9);
  for (const seat of seats) {
    const prompt = generate({ poseBaseId: 'sitting', poseArrangementId: 'sitting-natural', poseAnchorId: seat.id });
    for (const text of chestTexts(prompt)) {
      assert.ok(text.includes(seat.en), seat.id);
      assert.match(text, /sitting|seated/);
    }
  }
});

test('chest crops retain visible rock hands and the selected upper torso inclination', () => {
  const prompt = generate({ poseBaseId: 'standing', poseArrangementId: 'standing-pelvis-back-curve', poseHandId: 'both-hands-rock-horns', poseAnchorId: 'none' });
  for (const text of chestTexts(prompt)) {
    assert.match(text, /both hands raised beside the shoulders/);
    assert.match(text, /rock-horns gesture/);
    assert.match(text, /upper torso only slightly inclined forward/);
    assert.doesNotMatch(text, /pelvis pushed|weight settled onto one leg|lower back forming/);
  }
});

test('chest crops preserve kneeling, lying orientation and rear orbit', () => {
  for (const pose of [
    { poseBaseId: 'kneeling', poseArrangementId: 'none', pattern: /kneeling pose/ },
    { poseBaseId: 'lying', poseOrientationId: 'lying-side', poseArrangementId: 'lying-body-natural-stretch', pattern: /lying pose.*upper torso turned onto one side/ },
    { poseBaseId: 'lying', poseOrientationId: 'lying-prone', poseArrangementId: 'lying-body-natural-stretch', pattern: /lying pose.*prone position/ },
    { poseBaseId: 'lying', poseOrientationId: 'lying-supine', poseArrangementId: 'lying-body-natural-stretch', pattern: /She lies/ },
  ]) {
    const { pattern, ...locks } = pose;
    const prompt = generate({ ...locks, poseAnchorId: 'none', orbitId: option('orbitId', '背面 180 度') });
    for (const text of chestTexts(prompt)) {
      assert.match(text, pattern);
      assert.match(text, /back view/);
      assert.doesNotMatch(text, /both shoulders.*clearly visible|legs resting naturally/);
    }
  }
});

test('preview F settings update both MJ tails and survive save/restore without rerolling', () => {
  const locks = fixture({ mjVersionId: 'v8-1', mjAspectRatio: '16:9', mjRawMode: 'standard', mjStylize: 500, mjChaos: 30, mjWeirdness: 42, mjResolution: 'hd' });
  const source = generatePrompts(1, createPromptGenerationLocks(locks), [], { random: createSeededRandom('chest-up-preview-v1') })[0];
  const before = structuredClone(source);
  const updated = attachMidjourneySettingsToPrompt(source, locks);
  assert.deepEqual(source, before);
  assert.equal(updated.id, source.id);
  assert.match(updated.midjourneyPrompt, /--v 8\.1 --ar 16:9 --s 500 --c 30 --w 42 --hd$/);
  assert.match(extra(updated, 'chest-up-mj-portrait'), /--v 8\.1 --ar 4:5 --s 500 --c 30 --w 42 --hd$/);
  for (const id of ['chest-up-portrait', 'full-body-character']) assert.equal(extra(updated, id), extra(source, id));
  for (const field of ['grokPrompt', 'zImagePrompt']) assert.equal(updated[field], source[field]);
  const restored = deserializeFavoritePrompt(serializeFavoritePrompt({ ...updated, source: 'page1' }));
  assert.deepEqual(restored.extraPrompts, updated.extraPrompts);
});

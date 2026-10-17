import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import { parseLocksFromStandardPrompt } from '../../features/saved-cards/cardCodec.js';
import { getReferencePersonPreview } from '../referencePersonPreview.js';
import { applyDefaultEthnicity, resolveDefaultEthnicity } from './defaultEthnicity.js';
import { expectedDefaultEthnicity, restorePreDefaultEthnicityText } from './defaultEthnicityTestSupport.js';

// Approved 2026-10-17 (Docs/decisions/2026-10-17-expression-pose-direction.md):
// an ordinary subject whose Facial Features are none renders Japanese. Duo is
// per person: both none -> shared "adult Japanese women"; one none -> that woman
// gets "Japanese facial features". Selections and stored data never change.
const controls = getLockControls();
const option = (key, zh) => {
  const found = controls.find(c => c.key === key)?.options.find(o => o.zh === zh);
  assert.ok(found, `${key}/${zh}`);
  return found.id;
};
const none = key => option(key, '全無');
const generate = (locks, seed = 'default-ethnicity') => generatePrompts(1, {
  ...createEmptyLocks(), characterProfileId: 'none', specialSubjectId: 'none',
  framingId: option('framingId', '全身鏡頭 (Full Body Shot)'), ...locks,
}, [], { random: createSeededRandom(seed) })[0];
const extra = (prompt, id) => prompt.extraPrompts.find(entry => entry.id === id)?.text || '';
const sixOutputs = prompt => ({
  gpt: prompt.grokPrompt, z: prompt.zImagePrompt, mj: prompt.midjourneyPrompt, nano: prompt.nanoBananaPrompt,
  chest: extra(prompt, 'chest-up-portrait'), fullBody: extra(prompt, 'full-body-character'),
});
const duoOutputs = prompt => ({
  gpt: prompt.grokPrompt, z: prompt.zImagePrompt, mj: prompt.midjourneyPrompt, nano: prompt.nanoBananaPrompt,
});
const JAPANESE_SUBJECT = /\badult Japanese wom[ae]n\b/;
const ROLE_FACE = /Japanese facial features/;
const count = (text, value) => text.split(value).length - 1;

test('resolver: only an ordinary subject with an unset face gets a default', () => {
  const isNone = item => item.zh === '全無';
  const unset = { zh: '全無' };
  const face = { zh: '韓系偶像臉' };
  assert.deepEqual(resolveDefaultEthnicity({ ordinary: true, count: 1, facial: unset, isNone }), { single: true, duoAll: false, a: false, b: false });
  assert.deepEqual(resolveDefaultEthnicity({ ordinary: true, count: 1, facial: undefined, isNone }), { single: true, duoAll: false, a: false, b: false });
  assert.deepEqual(resolveDefaultEthnicity({ ordinary: true, count: 1, facial: face, isNone }), { single: false, duoAll: false, a: false, b: false });
  assert.deepEqual(resolveDefaultEthnicity({ ordinary: false, count: 1, facial: unset, isNone }), { single: false, duoAll: false, a: false, b: false });
  assert.deepEqual(resolveDefaultEthnicity({ ordinary: true, count: 2, facialA: unset, facialB: unset, isNone }), { single: false, duoAll: true, a: false, b: false });
  assert.deepEqual(resolveDefaultEthnicity({ ordinary: true, count: 2, facialA: face, facialB: unset, isNone }), { single: false, duoAll: false, a: false, b: true });
  assert.deepEqual(resolveDefaultEthnicity({ ordinary: true, count: 2, facialA: unset, facialB: face, isNone }), { single: false, duoAll: false, a: true, b: false });
  assert.equal(applyDefaultEthnicity('A 20-year-old seductive stunning adult woman.', { single: true }), 'A 20-year-old seductive stunning adult Japanese woman.');
  assert.equal(applyDefaultEthnicity('Two 20-year-old adult women.', { duoAll: true }), 'Two 20-year-old adult Japanese women.');
  assert.equal(applyDefaultEthnicity('Two 20-year-old adult women.', { a: true }), 'Two 20-year-old adult women.', 'role default leaves the shared sentence');
  assert.equal(applyDefaultEthnicity('one adult person from the attached reference image', { single: true }), 'one adult person from the attached reference image');
});

test('single none: all six outputs name the Japanese subject exactly once and no invented face', () => {
  const prompt = generate({ subjectCount: '1', facialFeaturesId: none('facialFeaturesId') });
  assert.match(prompt.grokPrompt, /The subject is one 20-year-old adult Japanese woman\./);
  assert.match(prompt.zImagePrompt, /A 20-year-old seductive stunning adult Japanese woman/);
  assert.match(prompt.midjourneyPrompt, /A 20-year-old adult Japanese woman\./);
  for (const [name, text] of Object.entries(sixOutputs(prompt))) {
    assert.ok(text, `${name} exists`);
    assert.equal(count(text, 'adult Japanese woman'), 1, `${name}: one Japanese subject`);
    assert.doesNotMatch(text, ROLE_FACE, name);
    assert.doesNotMatch(text, /\bKorean\b/, name);
  }
});

test('single selected faces, mixed face, character card, special subject and custom identity keep their own identity', () => {
  const cases = [
    ['日系清透臉', generate({ subjectCount: '1', facialFeaturesId: option('facialFeaturesId', '日系清透臉') })],
    ['韓系偶像臉', generate({ subjectCount: '1', facialFeaturesId: option('facialFeaturesId', '韓系偶像臉') })],
    ['混血立體臉', generate({ subjectCount: '1', facialFeaturesId: option('facialFeaturesId', '混血立體臉') })],
    ['card', generate({ subjectCount: '1', characterProfileId: 'character-rika', facialFeaturesId: none('facialFeaturesId') })],
    ['special', generate({ subjectCount: '1', specialSubjectId: 'european-knight', facialFeaturesId: none('facialFeaturesId') })],
    ['custom', generatePrompts(1, { ...createEmptyLocks(), subjectCount: '1', characterProfileId: 'none', specialSubjectId: 'none',
      facialFeaturesId: none('facialFeaturesId') }, [], {
      random: createSeededRandom('default-ethnicity-custom'), characterProfilePrompt: 'An adult woman with an oval face',
    })[0]],
  ];
  for (const [label, prompt] of cases) {
    for (const [name, text] of Object.entries(sixOutputs(prompt))) {
      assert.doesNotMatch(text, JAPANESE_SUBJECT, `${label}: ${name}`);
      assert.doesNotMatch(text, ROLE_FACE, `${label}: ${name}`);
    }
  }
});

test('duo both none: the shared sentence says adult Japanese women; no role default', () => {
  const prompt = generate({ subjectCount: '2', facialFeaturesAId: none('facialFeaturesAId'), facialFeaturesBId: none('facialFeaturesBId') });
  assert.match(prompt.grokPrompt, /Two 20-year-old adult Japanese women\./);
  assert.match(prompt.zImagePrompt, /Two stunning seductive 20-year-old adult Japanese women/);
  for (const [name, text] of Object.entries(duoOutputs(prompt))) {
    assert.equal(count(text, 'adult Japanese women'), 1, name);
    assert.doesNotMatch(text, ROLE_FACE, name);
  }
});

test('duo with one none face: only that woman gets Japanese facial features; the shared sentence stays plain', () => {
  for (const [faceA, faceB, role] of [
    [option('facialFeaturesAId', '韓系偶像臉'), none('facialFeaturesBId'), 2],
    [none('facialFeaturesAId'), option('facialFeaturesBId', '成熟性感臉'), 1],
  ]) {
    const prompt = generate({ subjectCount: '2', facialFeaturesAId: faceA, facialFeaturesBId: faceB }, `default-ethnicity-role-${role}`);
    const other = role === 1 ? 2 : 1;
    const ordinal = role === 1 ? 'first' : 'second';
    assert.match(prompt.grokPrompt, new RegExp(`Woman ${role}:\\nHas Japanese facial features`));
    assert.doesNotMatch(prompt.grokPrompt, new RegExp(`Woman ${other}:\\nHas Japanese facial features`));
    assert.match(prompt.zImagePrompt, new RegExp(`Woman ${role} has [^.]*Japanese facial features`));
    assert.match(prompt.midjourneyPrompt, new RegExp(`The ${ordinal} woman has Japanese facial features`));
    assert.match(prompt.nanoBananaPrompt, new RegExp(`The ${ordinal} woman has Japanese facial features`));
    for (const [name, text] of Object.entries(duoOutputs(prompt))) {
      assert.equal(count(text, 'Japanese facial features'), 1, `${role}: ${name}`);
      assert.doesNotMatch(text, JAPANESE_SUBJECT, `${role}: ${name}`);
      assert.match(text, /Korean/, `${role}: ${name} keeps the selected face`);
    }
  }
});

test('stored selections and structured data keep the unset face; render-only default', () => {
  const single = generate({ subjectCount: '1', facialFeaturesId: none('facialFeaturesId') });
  assert.equal(single.selection.facialFeaturesId, none('facialFeaturesId'));
  const base = single.structured.Character.find(item => item.id === 'base-character-1');
  assert.equal(base.en, 'one 20-year-old adult woman');
  const duo = generate({ subjectCount: '2', facialFeaturesAId: option('facialFeaturesAId', '韓系偶像臉'), facialFeaturesBId: none('facialFeaturesBId') });
  assert.equal(duo.selection.facialFeaturesBId, none('facialFeaturesBId'));
  const roleFace = duo.structured.Character.find(item => item.id.includes('五官特徵') && item.meta?.characterRole === 'b');
  assert.equal(roleFace.zh, '全無');
  assert.equal(JSON.stringify(duo.structured).includes('Japanese facial features'), false);
  assert.deepEqual(expectedDefaultEthnicity(duo), { single: false, duoAll: false, a: false, b: true });
});

test('standard prompt import keeps subject count and does not turn the default into a selected face', () => {
  const single = generate({ subjectCount: '1', facialFeaturesId: none('facialFeaturesId') });
  const singleLocks = parseLocksFromStandardPrompt(single.grokPrompt, controls).locks;
  assert.equal(singleLocks.subjectCount, '1');
  assert.notEqual(singleLocks.facialFeaturesId, option('facialFeaturesId', '日系清透臉'));
  assert.notEqual(singleLocks.facialFeaturesId, option('facialFeaturesId', '甜美可愛臉'));
  const duoAll = generate({ subjectCount: '2', facialFeaturesAId: none('facialFeaturesAId'), facialFeaturesBId: none('facialFeaturesBId') });
  assert.equal(parseLocksFromStandardPrompt(duoAll.grokPrompt, controls).locks.subjectCount, '2');
  const mixed = generate({ subjectCount: '2', facialFeaturesAId: option('facialFeaturesAId', '韓系偶像臉'), facialFeaturesBId: none('facialFeaturesBId') });
  const mixedLocks = parseLocksFromStandardPrompt(mixed.grokPrompt, controls).locks;
  assert.equal(mixedLocks.subjectCount, '2');
  assert.notEqual(mixedLocks.facialFeaturesBId, option('facialFeaturesBId', '日系清透臉'));
  assert.notEqual(mixedLocks.facialFeaturesBId, option('facialFeaturesBId', '甜美可愛臉'));
});

test('reference-person preview never receives the Japanese default', () => {
  const prompt = generate({ subjectCount: '1', facialFeaturesId: none('facialFeaturesId') });
  const preview = getReferencePersonPreview(prompt);
  const texts = [preview.grokPrompt, preview.zImagePrompt, preview.midjourneyPrompt, preview.nanoBananaPrompt,
    ...preview.extraPrompts.map(entry => entry.text)];
  for (const text of texts) {
    assert.doesNotMatch(text, /\bJapanese\b/);
  }
});

test('test inverse removes exactly the default and nothing else', () => {
  const single = generate({ subjectCount: '1', facialFeaturesId: none('facialFeaturesId') });
  for (const text of Object.values(sixOutputs(single))) {
    const restored = restorePreDefaultEthnicityText(text);
    assert.doesNotMatch(restored, /\bJapanese\b/);
    assert.equal(text.length - restored.length, 'Japanese '.length);
  }
  const mixed = generate({ subjectCount: '2', facialFeaturesAId: option('facialFeaturesAId', '韓系偶像臉'), facialFeaturesBId: none('facialFeaturesBId') });
  for (const text of Object.values(duoOutputs(mixed))) {
    assert.doesNotMatch(restorePreDefaultEthnicityText(text), ROLE_FACE);
  }
  const selected = generate({ subjectCount: '1', facialFeaturesId: option('facialFeaturesId', '日系清透臉') });
  for (const text of Object.values(sixOutputs(selected))) assert.equal(restorePreDefaultEthnicityText(text), text);
});

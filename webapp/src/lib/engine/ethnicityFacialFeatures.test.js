import assert from 'node:assert/strict';
import test from 'node:test';

import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import { parseLocksFromStandardPrompt } from '../../features/saved-cards/cardCodec.js';

// Approved 2026-10-14: the subject sentence names no ethnicity ("20-year-old adult
// woman"); the Facial Features selection carries it. Approved 2026-10-17: none
// renders the Japanese default ("adult Japanese woman"); see defaultEthnicity.test.js.
const controls = getLockControls();
const option = (key, zh) => {
  const found = controls.find(c => c.key === key)?.options.find(o => o.zh === zh);
  assert.ok(found, `${key}/${zh}`);
  return found.id;
};
const noneOf = key => controls.find(c => c.key === key)?.options.find(o => o.zh === '全無')?.id;
const generate = (locks, seed = 'ethnicity-facial-features') => generatePrompts(1, {
  ...createEmptyLocks(), subjectCount: '1', characterProfileId: 'none', specialSubjectId: 'none',
  framingId: option('framingId', '全身鏡頭 (Full Body Shot)'), ...locks,
}, [], { random: createSeededRandom(seed) })[0];
const extra = (prompt, id) => prompt.extraPrompts.find(entry => entry.id === id)?.text || '';
const outputs = prompt => ({
  gpt: prompt.grokPrompt, z: prompt.zImagePrompt, mj: prompt.midjourneyPrompt, nano: prompt.nanoBananaPrompt,
  chest: extra(prompt, 'chest-up-portrait'), fullBody: extra(prompt, 'full-body-character'),
});
// Person ethnicity only: imaging styles such as "Japanese portrait color grade"
// are not identity and may appear through random film or style selections.
const faceEthnicity = name => new RegExp(`\\b${name}\\b(?:[\\s-]+[a-z]+){0,3}[\\s-]+face\\b`, 'i');
const ETHNICITY = /\b(?:Japanese|Korean|East Asian)\b(?:[\s-]+[a-z]+){0,3}[\s-]+(?:face|woman|women)\b/i;

const EXPECTED = [
  ['韓系偶像臉', 'Korean'], ['日系清透臉', 'Japanese'], ['甜美可愛臉', 'Japanese'],
  ['冷感高級臉', 'Korean'], ['成熟性感臉', 'Korean'],
];

test('Facial Features none gives the ordinary single subject the Japanese default and no face', () => {
  const prompt = generate({ facialFeaturesId: noneOf('facialFeaturesId') });
  // Random accessories may follow the subject sentence (v2 P2 shifted this seed's draws).
  assert.match(prompt.grokPrompt, /The subject is one 20-year-old adult Japanese woman\b/);
  assert.match(prompt.midjourneyPrompt, /A 20-year-old adult Japanese woman\b/);
  for (const [name, text] of Object.entries(outputs(prompt))) {
    assert.match(text, /\badult Japanese woman\b/, `${name}: Japanese default subject`);
    assert.doesNotMatch(text, faceEthnicity('Japanese'), `${name}: no invented Japanese face`);
    assert.doesNotMatch(text, faceEthnicity('Korean'), `${name}: no Korean face`);
    assert.doesNotMatch(text, /Japanese or Korean|portrait subject\b/, name);
  }
});

test('each non-mixed facial feature carries its approved ethnicity in every output', () => {
  for (const [face, ethnicity] of EXPECTED) {
    const prompt = generate({ facialFeaturesId: option('facialFeaturesId', face) }, `ethnicity-${face}`);
    for (const [name, text] of Object.entries(outputs(prompt))) {
      assert.match(text, faceEthnicity(ethnicity), `${face}: ${name}`);
      const other = ethnicity === 'Korean' ? 'Japanese' : 'Korean';
      assert.doesNotMatch(text, faceEthnicity(other), `${face}: ${name} must not name ${other}`);
    }
  }
});

test('the mixed facial feature names neither Japanese nor Korean', () => {
  const prompt = generate({ facialFeaturesId: option('facialFeaturesId', '混血立體臉') });
  for (const [name, text] of Object.entries(outputs(prompt))) {
    assert.doesNotMatch(text, ETHNICITY, `${name}: mixed face keeps the subject unspecified`);
    assert.doesNotMatch(text, faceEthnicity('Japanese'), name);
    assert.doesNotMatch(text, faceEthnicity('Korean'), name);
  }
});

test('duo outputs describe two 20-year-old adult women; both faces none adds the Japanese default', () => {
  const duo = (faceA, faceB) => generatePrompts(1, {
    ...createEmptyLocks(), subjectCount: '2', facialFeaturesAId: faceA, facialFeaturesBId: faceB,
  }, [], { random: createSeededRandom('ethnicity-duo') })[0];
  const selected = duo(option('facialFeaturesAId', '韓系偶像臉'), option('facialFeaturesBId', '日系清透臉'));
  const none = duo(noneOf('facialFeaturesAId'), noneOf('facialFeaturesBId'));
  for (const text of [selected.grokPrompt, selected.zImagePrompt, selected.midjourneyPrompt, selected.nanoBananaPrompt]) {
    assert.match(text, /20-year-old adult women/);
    assert.doesNotMatch(text, /Japanese or Korean/);
  }
  for (const text of [none.grokPrompt, none.zImagePrompt, none.midjourneyPrompt, none.nanoBananaPrompt]) {
    assert.match(text, /20-year-old adult Japanese women/);
    assert.doesNotMatch(text, /Japanese facial features/);
  }
});

test('historical subject sentences and facial feature text still import', () => {
  const single = parseLocksFromStandardPrompt('Subject:\nThe subject is one 20-year-old Japanese or Korean female portrait subject.', controls).locks;
  assert.equal(single.subjectCount, '1');
  const duo = parseLocksFromStandardPrompt('Subject:\nThe subjects are two 20-year-old Japanese or Korean female portrait subjects.', controls).locks;
  assert.equal(duo.subjectCount, '2');
  const sweet = parseLocksFromStandardPrompt(
    'Subject:\nyoung sweet pretty face, soft rounded charm, bright friendly eyes, gentle cute beauty, approachable youthful portrait look.',
    controls,
  ).locks;
  assert.equal(sweet.facialFeaturesId, option('facialFeaturesId', '甜美可愛臉'));
});

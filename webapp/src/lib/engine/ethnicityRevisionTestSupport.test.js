import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import {
  ETHNICITY_REVISION_ADDED_ALIASES,
  restorePreEthnicityOutputs,
  restorePreEthnicityText,
  restorePreEthnicityValue,
} from './ethnicityRevisionTestSupport.js';
import { applyDefaultEthnicity } from './defaultEthnicity.js';
import { DEFAULT_ETHNICITY_ADDED_ALIASES, restorePreDefaultEthnicityText } from './defaultEthnicityTestSupport.js';

const controls = getLockControls();
const options = key => controls.find(control => control.key === key)?.options ?? [];

test('main MJ restores its own single lead once and its duo lead everywhere', () => {
  assert.equal(
    restorePreEthnicityText('Photo. A 20-year-old adult woman. Text A 20-year-old adult woman.', 'midjourneyPrompt'),
    'Photo. A Japanese woman in her twenties. Text A 20-year-old adult woman.',
  );
  assert.equal(
    restorePreEthnicityText('Photo. Two 20-year-old adult women. Both have.', 'midjourneyPrompt'),
    'Photo. Two 20-year-old Japanese or Korean women. Both have.',
  );
  // The fixed seductive lead is a common rule, not the MJ natural lead.
  assert.equal(
    restorePreEthnicityText('A 20-year-old seductive stunning adult woman.', 'midjourneyPrompt'),
    'A 20s seductive stunning Japanese or Korean woman.',
  );
});

test('other fields restore capitalized subject sentences and never use the MJ lead', () => {
  for (const field of ['grokPrompt', 'zImagePrompt', 'chestUpPortraitPrompt', 'fullBodyCharacterPrompt', 'nanoBananaPrompt', undefined]) {
    assert.equal(restorePreEthnicityText('One 20-year-old adult woman.', field), 'One 20-year-old Japanese or Korean female portrait subject.');
    assert.equal(restorePreEthnicityText('Two 20-year-old adult women.', field), 'Two 20-year-old Japanese or Korean female portrait subjects.');
    assert.equal(restorePreEthnicityText('A 20-year-old adult woman.', field), 'A 20-year-old adult woman.', `${field}: MJ lead untouched`);
  }
});

test('common replacements cover every approved rollout phrase in order', () => {
  const pairs = [
    ['Two stunning seductive 20-year-old adult women.', 'Two stunning seductive 20-year-old Japanese or Korean women.'],
    ['Two seductive stunning 20-year-old adult women', 'Two seductive stunning 20-year-old Japanese or Korean women'],
    ['A seductive stunning 20-year-old adult woman', 'A seductive stunning 20-year-old Japanese or Korean woman'],
    ['A 20-year-old seductive stunning adult woman, full bust', 'A 20s seductive stunning Japanese or Korean woman, full bust'],
    ['The subjects are two 20-year-old adult women.', 'The subjects are two 20-year-old Japanese or Korean female portrait subjects.'],
    ['The subject is one 20-year-old adult woman.', 'The subject is one 20-year-old Japanese or Korean female portrait subject.'],
    ['young sweet pretty Japanese face', 'young sweet pretty face'],
    ['young cool editorial Korean beauty face', 'young cool editorial beauty face'],
    ['young seductive alluring Korean beauty face', 'young seductive alluring beauty face'],
    ['small refined oval Korean face', 'small refined oval face'],
    ['soft natural oval Japanese face', 'soft natural oval face'],
  ];
  for (const [current, historical] of pairs) {
    assert.equal(restorePreEthnicityText(current, 'grokPrompt'), historical, current);
    assert.equal(restorePreEthnicityText(historical, 'grokPrompt'), historical, `${historical}: idempotent on old text`);
  }
  // Unrelated identity text, including Character Card and mixed faces, is untouched.
  for (const text of ['a 20-year-old adult East Asian woman', 'dimensional elongated oval face', 'young beautiful Korean idol face',
    'polished Korean-style face-framing flow', 'Japanese portrait color grade']) {
    assert.equal(restorePreEthnicityText(text, 'grokPrompt'), text);
  }
  assert.equal(restorePreEthnicityText(undefined, 'grokPrompt'), undefined);
  assert.equal(restorePreEthnicityText(null, 'grokPrompt'), null);
});

test('reverse mapping reproduces the legacy aliases recorded in the current catalog data', () => {
  for (const option of options('subjectCount')) {
    // 2026-10-17 added the Japanese-default subject after the 2026-10-14 alias.
    assert.deepEqual(option.meta?.legacyPromptAliases, [
      restorePreEthnicityText(option.en, 'grokPrompt'),
      applyDefaultEthnicity(option.en, { single: true }),
    ], option.id);
  }
  const faces = options('facialFeaturesId').filter(option => option.meta?.legacyPromptAliases?.length);
  assert.deepEqual(faces.map(face => face.zh).sort(), ['冷感高級臉', '成熟性感臉', '甜美可愛臉'].sort());
  for (const face of faces) {
    assert.ok(face.meta.legacyPromptAliases.includes(restorePreEthnicityText(face.en, 'grokPrompt')), face.zh);
  }
  const recorded = [...options('subjectCount'), ...faces].flatMap(option => option.meta.legacyPromptAliases);
  assert.deepEqual([...recorded].sort(), [...ETHNICITY_REVISION_ADDED_ALIASES, ...DEFAULT_ETHNICITY_ADDED_ALIASES].sort());
});

test('deep restore uses key-based fields, removes only added aliases and the added archetype', () => {
  const value = {
    midjourneyPrompt: 'Photo. A 20-year-old adult woman.',
    grokPrompt: 'The subject is one 20-year-old adult woman.',
    extraPrompts: [{ id: 'chest-up-portrait', text: 'One 20-year-old adult woman.' }],
    structured: { Character: [
      { zh: '一位', en: 'one 20-year-old adult woman', id: 'base-character-1', meta: { tags: ['female'] } },
      { id: 'subject-1', en: 'one 20-year-old adult woman', meta: { legacyPromptAliases: [ETHNICITY_REVISION_ADDED_ALIASES[0]] } },
      { id: 'character:五官特徵-facial-features:冷感高級臉:4', zh: '冷感高級臉', en: 'young cool editorial Korean beauty face',
        mj: { face: 'refined elongated oval Korean face' },
        meta: { archetype: 'korean', legacyPromptAliases: [ETHNICITY_REVISION_ADDED_ALIASES[3]] } },
      { id: 'character:五官特徵-facial-features:韓系偶像臉:1', zh: '韓系偶像臉', meta: { archetype: 'korean' } },
      { id: 'body', meta: { archetype: null, legacyPromptAliases: ['kept alias', ETHNICITY_REVISION_ADDED_ALIASES[2]] } },
    ] },
  };
  assert.deepEqual(restorePreEthnicityValue(value), {
    midjourneyPrompt: 'Photo. A Japanese woman in her twenties.',
    grokPrompt: 'The subject is one 20-year-old Japanese or Korean female portrait subject.',
    extraPrompts: [{ id: 'chest-up-portrait', text: 'One 20-year-old Japanese or Korean female portrait subject.' }],
    structured: { Character: [
      { zh: '一位', en: 'one 20-year-old Japanese or Korean female portrait subject', id: 'base-character-1', meta: { tags: ['female'] } },
      { id: 'subject-1', en: 'one 20-year-old Japanese or Korean female portrait subject' },
      { id: 'character:五官特徵-facial-features:冷感高級臉:4', zh: '冷感高級臉', en: 'young cool editorial beauty face',
        mj: { face: 'refined elongated oval face' }, meta: { archetype: null } },
      { id: 'character:五官特徵-facial-features:韓系偶像臉:1', zh: '韓系偶像臉', meta: { archetype: 'korean' } },
      { id: 'body', meta: { archetype: null, legacyPromptAliases: ['kept alias'] } },
    ] },
  });
  // Key order is preserved for JSON-hash comparisons.
  assert.deepEqual(Object.keys(restorePreEthnicityValue(value).structured.Character[2]), ['id', 'zh', 'en', 'mj', 'meta']);
  assert.equal(restorePreEthnicityValue('A 20-year-old adult woman', 'midjourneyPrompt'), 'A Japanese woman in her twenties');
  assert.equal(restorePreEthnicityValue(7), 7);
});

test('generated outputs no longer name the old subject after the revision, and restore only reintroduces it', () => {
  const [single] = generatePrompts(1, { ...createEmptyLocks(), subjectCount: '1', characterProfileId: 'none', specialSubjectId: 'none' }, [], { random: createSeededRandom('ethnicity-reverse-single') });
  const [duo] = generatePrompts(1, { ...createEmptyLocks(), subjectCount: '2' }, [], { random: createSeededRandom('ethnicity-reverse-duo') });
  for (const prompt of [single, duo]) {
    const outputs = { grokPrompt: prompt.grokPrompt, zImagePrompt: prompt.zImagePrompt, midjourneyPrompt: prompt.midjourneyPrompt };
    const restored = restorePreEthnicityOutputs(outputs);
    for (const [field, text] of Object.entries(outputs)) {
      assert.doesNotMatch(text, /Japanese or Korean|in her twenties/, field);
      assert.match(restored[field], /Japanese or Korean|in her twenties/, `${field}: restored subject`);
      // Compare with the pre-2026-10-17 text: the Japanese default is reversed first.
      assert.equal(restored[field].length - restorePreDefaultEthnicityText(text).length > 0, true, field);
    }
  }
});

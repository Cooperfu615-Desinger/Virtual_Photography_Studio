import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createEmptyLocks,
  createSeededRandom,
  generatePrompts,
} from './engine.js';
import {
  buildPage1DllPromptSources,
  buildPage1GenerationPromptCards,
} from './page1PromptOutputs.js';

function generatePrompt(subjectCount) {
  return generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount,
  }, [], {
    random: createSeededRandom(`page1-fixed-framing-consumers-${subjectCount}`),
  })[0];
}

function legacyPrompt(subjectCount) {
  const { nanoBananaPrompt: _nanoBananaPrompt, ...prompt } = generatePrompt(subjectCount);
  return prompt;
}

test('PAGE1 single output consumers expose three primary and two fixed-framing prompts in one order', () => {
  const prompt = legacyPrompt('1');
  const cards = buildPage1GenerationPromptCards(prompt);
  const dllSources = buildPage1DllPromptSources(prompt);

  assert.deepEqual(cards.map((entry) => entry.id), [
    'gpt',
    'grok',
    'ai',
    'chest-up-portrait',
    'full-body-character',
  ]);
  assert.deepEqual(dllSources.map((entry) => entry.id), cards.map((entry) => entry.id));
  assert.deepEqual(cards.map((entry) => entry.title), [
    'Gpt',
    'Z-Image',
    'MIDJOURNEY',
    '胸上特寫照',
    '全身角色照',
  ]);
  assert.ok(cards.every((entry) => !('description' in entry)));

  const extraPrompts = new Map(prompt.extraPrompts.map((entry) => [entry.id, entry.text]));
  for (const entry of cards.slice(3)) {
    assert.equal(entry.value, extraPrompts.get(entry.id), entry.id);
  }

  assert.deepEqual(
    dllSources.slice(3).map(({ id, aspectRatio, lockAspectRatio }) => ({ id, aspectRatio, lockAspectRatio })),
    [
      { id: 'chest-up-portrait', aspectRatio: '4:5', lockAspectRatio: true },
      { id: 'full-body-character', aspectRatio: '9:16', lockAspectRatio: true },
    ],
  );
});

test('PAGE1 duo output consumers omit every single-subject fixed-framing prompt', () => {
  const prompt = legacyPrompt('2');

  assert.deepEqual(prompt.extraPrompts, []);
  assert.deepEqual(
    buildPage1GenerationPromptCards(prompt).map((entry) => entry.id),
    ['gpt', 'grok', 'ai'],
  );
  assert.ok(buildPage1GenerationPromptCards(prompt).every((entry) => !('description' in entry)));
  assert.deepEqual(
    buildPage1DllPromptSources(prompt).map((entry) => entry.id),
    ['gpt', 'grok', 'ai'],
  );
});

test('Nano Banana output adds one exact main source before fixed-framing extras without changing legacy sources', () => {
  const original = legacyPrompt('1');
  const nanoBananaPrompt = '  Create a natural photograph.\n\nKeep the resolved pose and outfit.  ';
  const prompt = { ...original, nanoBananaPrompt };
  const cards = buildPage1GenerationPromptCards(prompt);
  const sources = buildPage1DllPromptSources(prompt);
  const withoutBanana = (entries) => entries.filter(({ id }) => id !== 'nano-banana-2.1');

  assert.deepEqual(cards.map(({ id }) => id), [
    'gpt', 'grok', 'ai', 'nano-banana-2.1',
    'chest-up-portrait', 'full-body-character',
  ]);
  assert.deepEqual(sources.map(({ id }) => id), cards.map(({ id }) => id));
  assert.deepEqual(withoutBanana(cards), buildPage1GenerationPromptCards(original));
  assert.deepEqual(withoutBanana(sources), buildPage1DllPromptSources(original));
  assert.equal(cards[3].title, 'Nano Banana 2.1');
  assert.equal(cards[3].value, nanoBananaPrompt);
  assert.equal(sources[3].label, 'Nano Banana 2.1');
  assert.equal(sources[3].value, nanoBananaPrompt);
  assert.equal('aspectRatio' in sources[3], false);
  assert.equal('lockAspectRatio' in sources[3], false);
  assert.deepEqual(prompt.extraPrompts, original.extraPrompts);
});

test('Nano Banana output is optional for legacy, blank and duo records', () => {
  const single = legacyPrompt('1');
  for (const nanoBananaPrompt of [undefined, '', '  \n ']) {
    const prompt = { ...single, nanoBananaPrompt };
    assert.deepEqual(buildPage1GenerationPromptCards(prompt), buildPage1GenerationPromptCards(single));
    assert.deepEqual(buildPage1DllPromptSources(prompt), buildPage1DllPromptSources(single));
  }

  const duo = { ...legacyPrompt('2'), nanoBananaPrompt: 'Two adults in one shared scene.' };
  assert.deepEqual(buildPage1GenerationPromptCards(duo).map(({ id }) => id), ['gpt', 'grok', 'ai', 'nano-banana-2.1']);
  assert.deepEqual(buildPage1DllPromptSources(duo).map(({ id }) => id), ['gpt', 'grok', 'ai', 'nano-banana-2.1']);
  assert.deepEqual(duo.extraPrompts, []);
});

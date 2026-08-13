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

test('PAGE1 single output consumers expose three primary and three fixed-framing prompts in one order', () => {
  const prompt = generatePrompt('1');
  const cards = buildPage1GenerationPromptCards(prompt);
  const dllSources = buildPage1DllPromptSources(prompt);

  assert.deepEqual(cards.map((entry) => entry.id), [
    'gpt',
    'grok',
    'ai',
    'chest-up-portrait',
    'chest-up-mj-portrait',
    'full-body-character',
  ]);
  assert.deepEqual(dllSources.map((entry) => entry.id), cards.map((entry) => entry.id));
  assert.deepEqual(cards.map((entry) => entry.title), [
    'Gpt',
    'Z-Image',
    'MIDJOURNEY',
    '胸上特寫照',
    'MJ 胸上特寫照',
    '全身角色照',
  ]);

  const extraPrompts = new Map(prompt.extraPrompts.map((entry) => [entry.id, entry.text]));
  for (const entry of cards.slice(3)) {
    assert.equal(entry.value, extraPrompts.get(entry.id), entry.id);
  }

  assert.deepEqual(
    dllSources.slice(3).map(({ id, aspectRatio, lockAspectRatio }) => ({ id, aspectRatio, lockAspectRatio })),
    [
      { id: 'chest-up-portrait', aspectRatio: '4:5', lockAspectRatio: true },
      { id: 'chest-up-mj-portrait', aspectRatio: '4:5', lockAspectRatio: true },
      { id: 'full-body-character', aspectRatio: '9:16', lockAspectRatio: true },
    ],
  );
});

test('PAGE1 duo output consumers omit every single-subject fixed-framing prompt', () => {
  const prompt = generatePrompt('2');

  assert.deepEqual(prompt.extraPrompts, []);
  assert.deepEqual(
    buildPage1GenerationPromptCards(prompt).map((entry) => entry.id),
    ['gpt', 'grok', 'ai'],
  );
  assert.deepEqual(
    buildPage1DllPromptSources(prompt).map((entry) => entry.id),
    ['gpt', 'grok', 'ai'],
  );
});

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
  getPage1LocalDetailPrompt,
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

test('PAGE1 local-detail consumer exposes one selected target without changing the existing six cards', () => {
  const preview = {
    grokPrompt: 'gpt',
    zImagePrompt: 'z',
    midjourneyPrompt: 'ai',
    extraPrompts: [
      { id: 'chest-up-portrait', label: '胸上特寫照', text: 'chest-up' },
      { id: 'chest-up-mj-portrait', label: 'MJ 胸上特寫照', text: 'mj-chest-up' },
      { id: 'full-body-character', label: '全身角色照', text: 'full-body' },
    ],
    localDetailPrompts: {
      eyes: { status: 'ready', text: 'eyes local text' },
      'collarbone-chest': { status: 'ready', text: 'chest local text' },
      'abdomen-navel': { status: 'needs-source-review', text: 'must stay internal' },
    },
  };

  const baseCards = buildPage1GenerationPromptCards(preview);
  const localCards = buildPage1GenerationPromptCards(preview, {
    includeLocalDetail: true,
    localDetailTarget: 'collarbone-chest',
  });
  const localSources = buildPage1DllPromptSources(preview, {
    includeLocalDetail: true,
    localDetailTarget: 'collarbone-chest',
  });

  assert.equal(baseCards.length, 6);
  assert.equal(localCards.length, 7);
  assert.deepEqual(localCards.slice(0, 6), baseCards);
  assert.equal(localCards.at(-1).id, 'local-detail');
  assert.equal(localCards.at(-1).target, 'collarbone-chest');
  assert.equal(localCards.at(-1).value, 'chest local text');
  assert.equal(localSources.at(-1).id, 'local-detail');
  assert.equal(localSources.at(-1).label, '局部超特寫（鎖骨／胸口）');
  assert.equal(localSources.at(-1).value, localCards.at(-1).value);
  assert.equal(getPage1LocalDetailPrompt(preview, 'abdomen-navel').value, '');
  assert.equal(buildPage1DllPromptSources(preview, {
    includeLocalDetail: true,
    localDetailTarget: 'abdomen-navel',
  }).at(-1).value, '');
  assert.match(getPage1LocalDetailPrompt(preview, 'abdomen-navel').placeholder, /沒有可用的局部資料/);
});

test('PAGE1 local-detail consumer stays absent for a duo or an internal bundle without targets', () => {
  const duo = { grokPrompt: 'g', zImagePrompt: 'z', midjourneyPrompt: 'a', localDetailPrompts: {} };
  const legacy = { grokPrompt: 'g', zImagePrompt: 'z', midjourneyPrompt: 'a' };

  assert.equal(buildPage1GenerationPromptCards(duo, { includeLocalDetail: true }).length, 3);
  assert.equal(buildPage1DllPromptSources(duo, { includeLocalDetail: true }).length, 3);
  assert.equal(getPage1LocalDetailPrompt(legacy), null);
});

import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildObservationCapturePrompt,
  createEmptyObservationCaptureProfile,
  normalizeObservationCaptureProfile,
} from './observationCaptureLab.js';

const CARDS = [
  {
    id: 'character-test',
    label: 'Test Character',
    identityAndBody: 'a young adult woman with a lean natural silhouette and bright attentive eyes',
    distinctiveFeatures: 'a small beauty mark below the left eye',
    baseHair: 'long dark wavy hair',
    defaultWardrobeLayers: {
      top: { label: '上身', prompt: 'a relaxed white cotton shirt' },
      shoes: { label: '鞋子', prompt: 'clean black low-top sneakers' },
    },
  },
];

test('observation capture profile defaults to the first existing character card', () => {
  const profile = createEmptyObservationCaptureProfile(CARDS);

  assert.deepEqual(profile, {
    characterProfileId: 'character-test',
    generationSeed: 1,
  });
  assert.deepEqual(normalizeObservationCaptureProfile({ generationSeed: 0 }, CARDS), profile);
});

test('observation capture prompt is deterministic for the same card and seed', () => {
  const first = buildObservationCapturePrompt(CARDS, {
    characterProfileId: 'character-test',
    generationSeed: 17,
  });
  const second = buildObservationCapturePrompt(CARDS, {
    characterProfileId: 'character-test',
    generationSeed: 17,
  });

  assert.equal(first.prompt, second.prompt);
  assert.equal(first.summary, second.summary);
  assert.match(first.prompt, /adult fictional woman/);
  assert.match(first.prompt, /beauty mark below the left eye/);
  assert.match(first.prompt, /relaxed white cotton shirt/);
  assert.ok(first.selections.scene);
  assert.ok(first.selections.action);
});

test('observation capture reroll changes the staged camera combination without using private scenes', () => {
  const first = buildObservationCapturePrompt(CARDS, { generationSeed: 1 });
  const second = buildObservationCapturePrompt(CARDS, { generationSeed: 2 });
  const privateSceneWords = /bedroom|bathroom|changing room|toilet|private/i;

  assert.notEqual(first.prompt, second.prompt);
  assert.doesNotMatch(first.prompt, privateSceneWords);
  assert.doesNotMatch(second.prompt, privateSceneWords);
  assert.match(first.prompt, /public|ordinary customers|commuters|visitors|passing/i);
  assert.match(second.prompt, /public|ordinary customers|commuters|visitors|passing/i);
});

test('missing cards produce an empty output instead of inventing a character', () => {
  const result = buildObservationCapturePrompt([], { generationSeed: 3 });

  assert.equal(result.prompt, '');
  assert.equal(result.summary, '');
  assert.equal(result.card, null);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createEmptyLocks,
  createSeededRandom,
  generatePrompts,
} from './engine.js';

function withoutRuntimeMetadata(prompt) {
  const { id: _id, date: _date, ...stablePrompt } = prompt;
  return stablePrompt;
}

test('seeded random generators reproduce the same numeric sequence', () => {
  const first = createSeededRandom('portrait-seed');
  const second = createSeededRandom('portrait-seed');
  const firstValues = Array.from({ length: 8 }, () => first());
  const secondValues = Array.from({ length: 8 }, () => second());

  assert.deepEqual(firstValues, secondValues);
  assert.equal(new Set(firstValues).size, firstValues.length);
  assert.equal(firstValues.every((value) => value >= 0 && value < 1), true);
});

test('generatePrompts reproduces prompt content and selections with the same seed', () => {
  const generateWithSeed = (seed) => generatePrompts(4, createEmptyLocks(), [], {
    random: createSeededRandom(seed),
  }).map(withoutRuntimeMetadata);

  assert.deepEqual(generateWithSeed('stable-seed'), generateWithSeed('stable-seed'));
  assert.notDeepEqual(generateWithSeed('stable-seed'), generateWithSeed('different-seed'));
});

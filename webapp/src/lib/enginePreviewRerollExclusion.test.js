import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts } from './engine.js';

function withFixedRandom(value, callback) {
  const originalRandom = Math.random;
  Math.random = () => value;
  try {
    return callback();
  } finally {
    Math.random = originalRandom;
  }
}

test('preview reroll excludes the previous pose composer base for explicit random controls', () => {
  withFixedRandom(0, () => {
    const locks = {
      ...createEmptyLocks(),
      subjectCount: '1',
      framingId: 'camera:framing:full-body-shot',
      poseBaseId: 'random',
    };
    const [firstPrompt] = generatePrompts(1, locks);
    const [secondPrompt] = generatePrompts(1, locks, [], {
      excludePreviousSelection: firstPrompt.selection,
    });

    assert.equal(firstPrompt.selection.poseBaseId, 'standing');
    assert.equal(secondPrompt.selection.poseBaseId, 'sitting');
  });
});

test('preview reroll excludes the previous outfit preset for explicit random controls', () => {
  withFixedRandom(0, () => {
    const locks = {
      ...createEmptyLocks(),
      subjectCount: '1',
      framingId: 'camera:framing:full-body-shot',
      outfitPresetId: 'random',
    };
    const [firstPrompt] = generatePrompts(1, locks);
    const [secondPrompt] = generatePrompts(1, locks, [], {
      excludePreviousSelection: firstPrompt.selection,
    });

    assert.ok(firstPrompt.selection.outfitPresetId);
    assert.ok(secondPrompt.selection.outfitPresetId);
    assert.notEqual(secondPrompt.selection.outfitPresetId, firstPrompt.selection.outfitPresetId);
  });
});

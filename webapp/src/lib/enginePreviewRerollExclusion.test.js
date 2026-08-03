import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts } from './engine.js';

function withFixedRandom(value, callback) {
  return callback({ random: () => value });
}

test('preview reroll excludes the previous pose composer base for explicit random controls', () => {
  withFixedRandom(0, ({ random }) => {
    const locks = {
      ...createEmptyLocks(),
      subjectCount: '1',
      framingId: 'camera:framing:full-body-shot',
      poseBaseId: 'random',
    };
    const [firstPrompt] = generatePrompts(1, locks, [], { random });
    const [secondPrompt] = generatePrompts(1, locks, [], {
      random,
      excludePreviousSelection: firstPrompt.selection,
    });

    assert.equal(firstPrompt.selection.poseBaseId, 'standing');
    assert.equal(secondPrompt.selection.poseBaseId, 'sitting');
  });
});

test('preview reroll excludes the previous outfit preset for explicit random controls', () => {
  withFixedRandom(0, ({ random }) => {
    const locks = {
      ...createEmptyLocks(),
      subjectCount: '1',
      framingId: 'camera:framing:full-body-shot',
      outfitPresetId: 'random',
    };
    const [firstPrompt] = generatePrompts(1, locks, [], { random });
    const [secondPrompt] = generatePrompts(1, locks, [], {
      random,
      excludePreviousSelection: firstPrompt.selection,
    });

    assert.ok(firstPrompt.selection.outfitPresetId);
    assert.ok(secondPrompt.selection.outfitPresetId);
    assert.notEqual(secondPrompt.selection.outfitPresetId, firstPrompt.selection.outfitPresetId);
  });
});

test('preview reroll excludes previous unlocked scene camera and character choices', () => {
  withFixedRandom(0, ({ random }) => {
    const locks = {
      ...createEmptyLocks(),
      subjectCount: '1',
      framingId: 'camera:framing:full-body-shot',
    };
    const [firstPrompt] = generatePrompts(1, locks, [], { random });
    const [secondPrompt] = generatePrompts(1, locks, [], {
      random,
      excludePreviousSelection: firstPrompt.selection,
    });

    assert.notEqual(secondPrompt.selection.locationId, firstPrompt.selection.locationId);
    assert.notEqual(secondPrompt.selection.styleId, firstPrompt.selection.styleId);
    assert.notEqual(secondPrompt.selection.angleId, firstPrompt.selection.angleId);
    assert.notEqual(secondPrompt.selection.bodyTypeId, firstPrompt.selection.bodyTypeId);
    assert.notEqual(secondPrompt.selection.hairstyleId, firstPrompt.selection.hairstyleId);
  });
});

test('preview reroll preserves explicit locks while changing unlocked choices', () => {
  withFixedRandom(0, ({ random }) => {
    const locks = {
      ...createEmptyLocks(),
      subjectCount: '1',
      framingId: 'camera:framing:full-body-shot',
    };
    const [firstPrompt] = generatePrompts(1, locks, [], { random });
    const [secondPrompt] = generatePrompts(1, {
      ...locks,
      locationId: firstPrompt.selection.locationId,
    }, [], {
      random,
      excludePreviousSelection: firstPrompt.selection,
    });

    assert.equal(secondPrompt.selection.locationId, firstPrompt.selection.locationId);
    assert.notEqual(secondPrompt.selection.styleId, firstPrompt.selection.styleId);
  });
});

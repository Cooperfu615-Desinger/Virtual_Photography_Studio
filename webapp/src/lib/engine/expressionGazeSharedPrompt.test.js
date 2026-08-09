import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls, normalizeLocks } from '../engine.js';

const expressionControl = getLockControls().find((control) => control.key === 'expressionId');
assert.ok(expressionControl, 'Missing expression control');

const expressionByLabel = (label) => {
  const option = expressionControl.options.find((entry) => entry.zh === label);
  assert.ok(option, `Missing expression option: ${label}`);
  return option;
};

const promptOutputs = (prompt) => [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt];

function generateWithExpression(label) {
  return generatePrompts(1, {
    ...createEmptyLocks(),
    expressionId: expressionByLabel(label).id,
  })[0];
}

test('shared soft smile and direct gaze remain complete across the three main renderers', () => {
  const prompt = generateWithExpression('直視鏡頭｜柔和微笑');
  const expected = 'direct eye contact with the camera, relaxed cheeks, gently lifted mouth corners, soft natural smile';

  for (const output of promptOutputs(prompt)) {
    assert.match(output, new RegExp(expected.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'), 'i'));
  }
});

test('gaze options no longer inject head or body action language', () => {
  const sideGazePrompt = generateWithExpression('側向視線｜輕柔注意');
  const downwardGazePrompt = generateWithExpression('向下視線｜內斂');
  const forbiddenActionLanguage = /glancing back over the shoulder|turning back|lowered head|head turned back/i;

  for (const output of promptOutputs(sideGazePrompt)) {
    assert.match(output, /soft sideward gaze/i);
    assert.doesNotMatch(output, forbiddenActionLanguage);
  }

  for (const output of promptOutputs(downwardGazePrompt)) {
    assert.match(output, /downward gaze/i);
    assert.doesNotMatch(output, forbiddenActionLanguage);
  }
});

test('playful mock annoyance is a shared low-intensity expression', () => {
  const prompt = generateWithExpression('直視鏡頭｜撒嬌生氣');
  const expected = 'playful pout, lightly furrowed brows, teasing mock annoyance, affectionate expression';

  for (const output of promptOutputs(prompt)) {
    assert.match(output, new RegExp(expected.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'), 'i'));
    assert.doesNotMatch(output, /aggressive anger|furious|violent/i);
  }
});

test('renamed gaze labels preserve current and earlier saved expression locks', () => {
  const currentDownward = normalizeLocks({
    ...createEmptyLocks(),
    expressionId: 'character:神情與眼神-expression-gaze:低頭垂眼-內斂:6',
  });
  const currentSide = normalizeLocks({
    ...createEmptyLocks(),
    expressionId: 'character:神情與眼神-expression-gaze:回眸側看-輕柔注意:7',
  });

  assert.equal(currentDownward.expressionId, expressionByLabel('向下視線｜內斂').id);
  assert.equal(currentSide.expressionId, expressionByLabel('側向視線｜輕柔注意').id);
});

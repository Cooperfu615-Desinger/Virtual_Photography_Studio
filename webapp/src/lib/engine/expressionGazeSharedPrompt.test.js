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

test('shared soft smile remains complete across the three main renderers', () => {
  const prompt = generateWithExpression('柔和微笑');
  const expected = 'soft natural smile, relaxed cheeks, gently lifted mouth corners';

  for (const output of promptOutputs(prompt)) {
    assert.match(output, new RegExp(expected.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'), 'i'));
    assert.doesNotMatch(output, /direct eye contact|sideward gaze|downward gaze|distant gaze beyond the camera|looking directly at the camera/i);
  }
});

test('expression options do not inject gaze or head/body action language', () => {
  const gentleExpressionPrompt = generateWithExpression('溫柔含蓄');
  const restrainedExpressionPrompt = generateWithExpression('內斂克制');
  const forbiddenGazeOrActionLanguage = /direct eye contact|sideward gaze|downward gaze|distant gaze beyond the camera|glancing back over the shoulder|turning back|lowered head|head turned back/i;

  for (const output of [...promptOutputs(gentleExpressionPrompt), ...promptOutputs(restrainedExpressionPrompt)]) {
    assert.doesNotMatch(output, forbiddenGazeOrActionLanguage);
  }
});

test('playful mock annoyance is a shared low-intensity expression', () => {
  const prompt = generateWithExpression('撒嬌生氣');
  const expected = 'playful mock-angry expression, small pout, lightly furrowed brows, subtly puffed cheeks, affectionate tone';

  for (const output of promptOutputs(prompt)) {
    assert.match(output, new RegExp(expected.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'), 'i'));
    assert.doesNotMatch(output, /aggressive anger|furious|violent/i);
  }
});

test('renamed expression labels preserve current and earlier saved expression locks', () => {
  const currentDownward = normalizeLocks({
    ...createEmptyLocks(),
    expressionId: 'character:神情與眼神-expression-gaze:低頭垂眼-內斂:6',
  });
  const currentSide = normalizeLocks({
    ...createEmptyLocks(),
    expressionId: 'character:神情與眼神-expression-gaze:回眸側看-輕柔注意:7',
  });

  assert.equal(currentDownward.expressionId, expressionByLabel('內斂克制').id);
  assert.equal(currentSide.expressionId, expressionByLabel('溫柔含蓄').id);
});

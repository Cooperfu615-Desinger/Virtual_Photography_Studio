import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DEFAULT_ACTION_POSE_CARD_ID } from './actionPoseLab.js';
import { createEmptyLocks, generatePrompts, getLockControls } from './engine.js';

const controls = getLockControls();

const optionId = (key, zh) => {
  const control = controls.find((item) => item.key === key);
  const option = control?.options?.find((item) => item.zh === zh);
  assert.ok(option, `Missing ${zh} for ${key}`);
  return option.id;
};

test('single action pose card overrides PAGE1 expression and pose composer output', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '1',
    actionPoseCardId: DEFAULT_ACTION_POSE_CARD_ID,
    expressionId: optionId('expressionId', '柔和微笑'),
    poseBaseId: 'standing',
    poseHandId: 'one-hand-waist-one-down',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
  });
  const allPromptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt].join('\n');

  assert.equal(prompt.selection.actionPoseCardId, DEFAULT_ACTION_POSE_CARD_ID);
  assert.equal(prompt.selection.expressionId, '');
  assert.equal(prompt.selection.poseBaseId, 'none');
  assert.match(prompt.grokPrompt, /kicks one foot into a nearby object/);
  assert.match(prompt.zImagePrompt, /kicks one foot into a nearby object/);
  assert.doesNotMatch(prompt.midjourneyPrompt, /nearby object|not violent|not a yoga pose/i);
  assert.doesNotMatch(allPromptText, /not a yoga pose/);
  assert.doesNotMatch(allPromptText, /soft natural smile|one hand on the waist|standing with/);
});

test('action pose card preserves non-pose PAGE1 selections in the generated snapshot', () => {
  const locks = {
    ...createEmptyLocks(),
    subjectCount: '1',
    actionPoseCardId: DEFAULT_ACTION_POSE_CARD_ID,
    topId: optionId('topId', '短版針織背心'),
    pantsId: optionId('pantsId', '低腰牛仔褲'),
    locationId: optionId('locationId', '戶外：澀谷站前大型看板下穿越口'),
    lightingId: optionId('lightingId', '城市夜間混合光'),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    angleId: optionId('angleId', '平視高度鏡頭'),
    lensId: optionId('lensId', '35mm 廣角 (人文視角)'),
  };
  const [prompt] = generatePrompts(1, locks);

  assert.equal(prompt.selection.actionPoseCardId, DEFAULT_ACTION_POSE_CARD_ID);
  assert.equal(prompt.selection.topId, locks.topId);
  assert.equal(prompt.selection.pantsId, locks.pantsId);
  assert.equal(prompt.selection.locationId, locks.locationId);
  assert.equal(prompt.selection.lightingId, locks.lightingId);
  assert.equal(prompt.selection.framingId, locks.framingId);
  assert.equal(prompt.selection.lensId, locks.lensId);
});

test('single action pose card is ignored by duo mode', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '2',
    actionPoseCardId: DEFAULT_ACTION_POSE_CARD_ID,
    duoPoseId: optionId('duoPoseId', '購物逛街'),
    duoPoseBaseId: optionId('duoPoseBaseId', '行走中'),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
  });
  const allPromptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt].join('\n');

  assert.equal(prompt.selection.actionPoseCardId, '');
  assert.equal(prompt.selection.duoPoseId, optionId('duoPoseId', '購物逛街'));
  assert.match(allPromptText, /walking together|two women walking|shopping/);
  assert.doesNotMatch(allPromptText, /nearby object|fed up|not a yoga pose/);
});

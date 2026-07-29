import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls } from '../engine.js';
import { stripMidjourneyParameterTail } from './midjourneyParameterTail.js';

const controls = getLockControls();

function optionId(controlKey, zh) {
  const control = controls.find((entry) => entry.key === controlKey);
  const option = control?.options?.find((entry) => entry.zh === zh);
  assert.ok(option, `Expected option ${zh} in ${controlKey}`);
  return option.id;
}

function createAllNoneLocks() {
  const locks = { ...createEmptyLocks() };
  for (const control of controls) {
    const noneOption = control.options?.find((entry) => entry.zh === '全無');
    if (noneOption) locks[control.key] = noneOption.id;
  }
  return locks;
}

function gptPose(prompt) {
  return prompt.grokPrompt.match(
    /Pose and Composition:\n([\s\S]*?)(?=\n\n(?:Scene|Lighting|Camera Look):\n|\n\nmulti-cut sequence n=2|$)/
  )?.[1] || '';
}

test('phase 4 uses direct Midjourney scene, lighting, and imaging phrases', () => {
  const locks = {
    ...createAllNoneLocks(),
    framingId: optionId('framingId', '中景鏡頭 (Medium Shot)'),
    locationId: optionId('locationId', '室內：英倫復古窗邊房間'),
    lightingId: optionId('lightingId', '室內低照度暖色夜景'),
    lightDirectionId: optionId('lightDirectionId', '冷調窗邊輪廓光'),
    styleId: optionId('styleId', '川內倫子｜輕盈日常微光'),
    lensId: optionId('lensId', '移軸鏡頭 Tilt-Shift'),
    opticalEffectId: optionId('opticalEffectId', '光學朦朧薄霧'),
    filmId: optionId('filmId', 'VHS 錄影帶低畫質'),
  };
  const [prompt] = generatePrompts(1, locks);
  const description = stripMidjourneyParameterTail(prompt.midjourneyPrompt);

  assert.match(
    description,
    /British vintage window-side room interior, white lace curtain and sash window, dresser mirror side table framed paintings wall clock porcelain trinkets\./i
  );
  assert.match(
    description,
    /Indoor low-light warm night ambience, dim amber room brightness, cool window-side rim light on the subject/i
  );
  assert.match(description, /Rinko Kawauchi-inspired airy high-key image language/i);
  assert.match(description, /tilt-shift lens, shifted perspective control/i);
  assert.match(description, /lens-only mist-filter haze/i);
  assert.match(description, /VHS camcorder image degradation, analog tape noise/i);
  assert.doesNotMatch(description, /\bIn British vintage|\blit by\b|\bInspired by\b|\bshot on\b/i);

  assert.match(prompt.zImagePrompt, /Inspired by Rinko Kawauchi/i);
  assert.match(prompt.zImagePrompt, /shot on tilt-shift lens/i);
  assert.match(prompt.grokPrompt, /Inspired by Rinko Kawauchi/i);
});

test('phase 4 preserves canonical Pose Composer text verbatim in all primary outputs', () => {
  const locks = {
    ...createAllNoneLocks(),
    poseBaseId: optionId('poseBaseId', '站姿'),
    poseArrangementId: optionId('poseArrangementId', '身體微後仰'),
    poseHandId: optionId('poseHandId', '雙臂交疊'),
    poseHeadId: optionId('poseHeadId', '下巴微抬'),
  };
  const [prompt] = generatePrompts(1, locks);
  const canonicalPose = gptPose(prompt);

  assert.equal(
    canonicalPose,
    'She has her chin slightly raised, arms crossed loosely in front of the body, and presents a slight backward-leaning standing pose.'
  );
  assert.equal(prompt.zImagePrompt.includes(canonicalPose), true);
  assert.equal(prompt.midjourneyPrompt.includes(canonicalPose), true);
  assert.equal(prompt.midjourneyPrompt.split(canonicalPose).length - 1, 1);
});

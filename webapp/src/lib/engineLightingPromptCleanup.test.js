import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls, normalizeLocks } from './engine.js';

function controlOptions(key) {
  const control = getLockControls().find((entry) => entry.key === key);
  assert.ok(control, `Missing control ${key}`);
  return control.options;
}

function optionByLabel(key, label) {
  const option = controlOptions(key).find((entry) => entry.zh === label);
  assert.ok(option, `Missing option ${label} in ${key}`);
  return option;
}

const wordCount = (text) => text.split(/\s+/).filter(Boolean).length;

const legacyCameraId = (label, index) => `camera:環境光條件-ambient-light-conditions:${label}:${index}`;

test('ambient light prompts stay compact and environment-scoped', () => {
  const ambientOptions = controlOptions('lightingId');
  const sourceObjectTerms = /\b(streetlights?|street-light|sodium-vapor|practical(?:s| lights?| lamp)?|lamps?|decorative lights?|candle(?:lit|s)?|firelight|flame|fluorescent|LED|neon|overhead room light|visible .*source|light source|electronic indicators?)\b/i;

  assert.equal(ambientOptions.length, 37);
  for (const option of ambientOptions.filter((entry) => entry.zh !== '全無')) {
    assert.ok(wordCount(option.en) <= 24, `${option.zh} should stay compact`);
    assert.doesNotMatch(
      option.en,
      sourceObjectTerms,
      `${option.zh} should not name physical light-source objects`
    );
    assert.doesNotMatch(
      option.en,
      /on the subject|subject lighting|key light|rim light|skin and clothing|facial illumination/i,
      `${option.zh} should not describe subject-specific lighting`
    );
  }

  assert.match(optionByLabel('lightingId', '正午烈日').en, /overhead summer sun position/);
  assert.doesNotMatch(optionByLabel('lightingId', '正午烈日').en, /short hard shadows/i);
  assert.match(optionByLabel('lightingId', '雨前灰黑天空').en, /preserved cloud detail before rainfall/);
  assert.match(optionByLabel('lightingId', '陰雨將至').en, /charged damp air/);
  assert.match(optionByLabel('lightingId', '室內社交暖色夜景').en, /warm low-light social interior ambience/);
  assert.match(optionByLabel('lightingId', '室內極暖低照度').en, /very warm low-light interior ambience/);
  assert.match(optionByLabel('lightingId', '室內冷白高亮日常').en, /cool-white everyday interior ambience/);
});

test('renamed ambient light options keep legacy lighting ids working', () => {
  const ambientLabels = controlOptions('lightingId').map((option) => option.zh);
  const renamedLabels = [
    '城市夜間混合光',
    '城市高彩度夜色',
    '室內暖色夜景',
    '室內低照度暖色夜景',
    '室內社交暖色夜景',
    '室內極暖低照度',
    '室內冷白環境光',
    '室內冷白高亮日常',
    '室內高彩度色光夜景',
  ];
  const removedLabels = [
    '夜晚街燈',
    '霓虹夜色',
    '室內暖光夜景',
    '室內夜晚低照度暖光',
    '室內派對暖光夜景',
    '室內燭光',
    '室內冷色人造光',
    '室內冷白螢光日常',
    '室內霓虹夜色',
  ];

  for (const label of renamedLabels) {
    assert.ok(ambientLabels.includes(label), `Expected renamed ambient label ${label}`);
  }
  for (const label of removedLabels) {
    assert.ok(!ambientLabels.includes(label), `Expected old ambient label ${label} to be removed`);
  }

  const normalized = normalizeLocks({
    ...createEmptyLocks(),
    lightingId: legacyCameraId('室內燭光', 28),
  });
  const option = optionByLabel('lightingId', '室內極暖低照度');

  assert.equal(normalized.lightingId, option.id);
});

test('subject light prompts stay compact and subject-scoped', () => {
  const lightStyleOptions = controlOptions('lightDirectionId');

  assert.equal(lightStyleOptions.length, 26);
  for (const option of lightStyleOptions.filter((entry) => entry.zh !== '全無')) {
    assert.ok(wordCount(option.en) <= 24, `${option.zh} should stay compact`);
    assert.match(option.en, /subject|face|facial|skin|clothing|hair|shoulder|body|shadow/i);
    assert.doesNotMatch(
      option.en,
      /environment,|streetlit|blue hour|storm-brewing|rainy overcast|sky gradient/i,
      `${option.zh} should not become an ambient-light prompt`
    );
  }

  assert.match(optionByLabel('lightDirectionId', '側逆光').en, /partial facial fill/);
  assert.match(optionByLabel('lightDirectionId', '逆光輪廓光').en, /strong back rim light/);
  assert.match(optionByLabel('lightDirectionId', '深夜邊緣微光').en, /mostly dark subject mass/);
});

test('generated prompts keep ambient conditions separate from subject light style', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    locationId: optionByLabel('locationId', '戶外：廣闊草原平原與天空').id,
    lightingId: optionByLabel('lightingId', '夏日深藍積雲').id,
    lightDirectionId: optionByLabel('lightDirectionId', '暖金黃昏色溫').id,
  });

  assert.match(prompt.grokPrompt, /Lighting:\n[\s\S]*deep azure summer sky/);
  assert.match(prompt.grokPrompt, /Lighting:\n[\s\S]*warm golden-amber subject light color/);
  assert.match(prompt.zImagePrompt, /deep azure summer sky/);
  assert.match(prompt.zImagePrompt, /(?:honey-amber subject light|honey-orange cast) on skin and clothing/);
  assert.match(prompt.summary, /光影：夏日深藍積雲 \/ 暖金黃昏色溫/);
});

test('generated house-party prompt keeps flexible scene and party ambient light', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    locationId: optionByLabel('locationId', '室內：夜間家庭派對').id,
    lightingId: optionByLabel('lightingId', '室內社交暖色夜景').id,
    lightDirectionId: optionByLabel('lightDirectionId', '局部暖光').id,
  });

  assert.match(prompt.grokPrompt, /Scene:\n[\s\S]*nighttime American house-party home interior/);
  assert.match(prompt.grokPrompt, /Lighting:\n[\s\S]*warm low-light social interior ambience/);
  assert.match(prompt.grokPrompt, /Lighting:\n[\s\S]*local warm practical-light pool on the subject/);
  assert.match(prompt.zImagePrompt, /background guests (?:chatting drinking and playing games|if visible)/);
  assert.match(prompt.zImagePrompt, /warm low-light social interior ambience/);
  assert.doesNotMatch(prompt.zImagePrompt, /practical lamps|decorative lights/i);
  assert.match(prompt.summary, /場景：室內：夜間家庭派對/);
  assert.match(prompt.summary, /光影：室內社交暖色夜景 \/ 局部暖光/);
});

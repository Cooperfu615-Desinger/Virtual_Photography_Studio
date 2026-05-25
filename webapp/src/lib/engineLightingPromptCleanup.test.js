import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls } from './engine.js';

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

test('ambient light prompts stay compact and environment-scoped', () => {
  const ambientOptions = controlOptions('lightingId');

  assert.equal(ambientOptions.length, 36);
  for (const option of ambientOptions.filter((entry) => entry.zh !== '全無')) {
    assert.ok(wordCount(option.en) <= 24, `${option.zh} should stay compact`);
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
  assert.match(prompt.zImagePrompt, /warm golden-amber subject light color/);
  assert.match(prompt.summary, /光影：夏日深藍積雲 \/ 暖金黃昏色溫/);
});

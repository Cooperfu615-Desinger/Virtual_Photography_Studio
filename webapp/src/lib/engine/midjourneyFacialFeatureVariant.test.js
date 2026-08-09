import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls } from '../engine.js';

const FACIAL_FEATURE_VARIANTS = [
  {
    zh: '韓系偶像臉',
    face: 'small refined oval face, clear almond eyes with straight brows, slender nose bridge and softly shaped lips',
    source: 'young beautiful Korean idol face, refined small face, clear bright eyes, polished youthful beauty, photogenic K-pop portrait balance',
  },
  {
    zh: '日系清透臉',
    face: 'soft natural oval face, gentle almond eyes with natural brows, small nose and softly defined lips',
    source: 'young beautiful Japanese transparent face, soft natural features, clean gentle eyes, airy fresh beauty, subtle innocent portrait presence',
  },
  {
    zh: '甜美可愛臉',
    face: 'soft natural oval face, bright round eyes with curved brows, small rounded nose and softly shaped lips',
    source: 'young sweet pretty face, soft rounded charm, bright friendly eyes, gentle cute beauty, approachable youthful portrait look',
  },
  {
    zh: '冷感高級臉',
    face: 'refined elongated oval face, upturned eyes with straight brows, defined nose bridge and sculpted lips',
    source: 'young cool editorial beauty face, refined sharp facial balance, calm distant gaze-ready features, high-fashion understated presence',
  },
  {
    zh: '成熟性感臉',
    face: 'softly defined oval face, upturned eyes with arched brows, clear nose bridge and full shaped lips',
    source: 'young seductive alluring beauty face, magnetic feminine facial balance, defined eyes and lips, sensual captivating portrait presence',
  },
  {
    zh: '混血立體臉',
    face: 'dimensional elongated oval face, deep-set round eyes with defined brows, high nose bridge and sculpted lips',
    source: 'young mixed editorial face, dimensional facial structure, defined nose bridge and deep-set eyes, international high-fashion beauty',
  },
];

function optionId(controlKey, zh) {
  const control = getLockControls().find((entry) => entry.key === controlKey);
  const option = control?.options?.find((entry) => entry.zh === zh);
  assert.ok(option, `Expected option ${zh} in ${controlKey}`);
  return option.id;
}

function createAllNoneLocks() {
  const locks = { ...createEmptyLocks(), subjectCount: '1' };
  getLockControls().forEach((control) => {
    const noneOption = control.options?.find((entry) => entry.zh === '全無');
    if (noneOption) locks[control.key] = noneOption.id;
  });
  return locks;
}

function extraPromptById(prompt, id) {
  return prompt.extraPrompts?.find((entry) => entry.id === id)?.text || '';
}

test('MJ facial-feature metadata preserves structural face wording without changing shared sources', () => {
  const baseLocks = {
    ...createAllNoneLocks(),
    framingId: optionId('framingId', '中景鏡頭 (Medium Shot)'),
  };

  for (const variant of FACIAL_FEATURE_VARIANTS) {
    const [prompt] = generatePrompts(1, {
      ...baseLocks,
      facialFeaturesId: optionId('facialFeaturesId', variant.zh),
    });

    assert.match(prompt.midjourneyPrompt, new RegExp(variant.face.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
    assert.match(extraPromptById(prompt, 'chest-up-mj-portrait'), new RegExp(variant.face.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
    assert.match(prompt.grokPrompt, new RegExp(variant.source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
    assert.match(prompt.zImagePrompt, new RegExp(variant.source.split(', ')[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
    assert.doesNotMatch(prompt.grokPrompt, new RegExp(variant.face.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
    assert.doesNotMatch(prompt.zImagePrompt, new RegExp(variant.face.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }
});

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls } from './engine.js';

const locationOptions = () => getLockControls().find((control) => control.key === 'locationId').options;

function optionByLabel(label) {
  const option = locationOptions().find((item) => item.zh === label);
  assert.ok(option, `Missing location option: ${label}`);
  return option;
}

function optionId(label) {
  return optionByLabel(label).id;
}

const wordCount = (text) => text.split(/\s+/).filter(Boolean).length;

test('scene base keeps indoor outdoor and other location options intact', () => {
  const labels = locationOptions().map((option) => option.zh);

  assert.equal(labels.length, 143);
  assert.ok(labels.includes('室內：純潔白幕'));
  assert.ok(labels.includes('戶外：目黑川旁的櫻花隧道'));
  assert.ok(labels.includes('其他：白色床鋪'));
});

test('solid-color studio bases stay concise while blocking visible studio equipment', () => {
  const solidStudioLabels = [
    '室內：純潔白幕',
    '室內：深邃黑幕',
    '室內：莫蘭迪灰背景',
    '室內：純藍背景',
    '室內：純橘背景',
    '室內：純紅背景',
    '室內：純黃背景',
    '室內：純紫背景',
    '室內：純綠背景',
    '室內：鮮豔撞色背景',
    '室內：漸層打光背景',
  ];

  for (const label of solidStudioLabels) {
    const option = optionByLabel(label);
    assert.ok(wordCount(option.en) <= 55, `${label} should stay compact`);
    assert.match(option.en, /horizonless seamless/i);
    assert.match(option.en, /contact shadow/i);
    assert.match(option.en, /no paper roll/i);
    assert.match(option.en, /no backdrop stand/i);
    assert.match(option.en, /no light stands/i);
    assert.match(option.en, /no studio equipment/i);
  }
});

test('outdoor scene bases avoid symmetric avenue and centered corridor wording', () => {
  const riskyOutdoorPattern = /symmetrical|both sides|central road|avenue|tree-lined|lined with|perfect flat wall|rows broken/i;
  const outdoorOptions = locationOptions().filter((option) => option.zh.startsWith('戶外：'));

  for (const option of outdoorOptions) {
    assert.doesNotMatch(option.en, riskyOutdoorPattern, `${option.zh} should avoid symmetry-prone wording`);
  }

  const meguro = optionByLabel('戶外：目黑川旁的櫻花隧道');
  assert.match(meguro.en, /asymmetric riverside composition/);
  assert.doesNotMatch(meguro.en, /avoid symmetrical|central road/i);
});

test('other dedicated scenes read as close scene bases instead of full environments', () => {
  const otherOptions = locationOptions().filter((option) => option.zh.startsWith('其他：'));

  assert.equal(otherOptions.length, 5);
  for (const option of otherOptions) {
    assert.ok(wordCount(option.en) <= 30, `${option.zh} should stay compact`);
    assert.match(option.en, /ground plane|surface|scene base/i);
  }
});

test('generated prompts use stabilized scene base wording', () => {
  const [studioPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    locationId: optionId('室內：純藍背景'),
  });
  const [meguroPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    locationId: optionId('戶外：目黑川旁的櫻花隧道'),
  });

  assert.match(studioPrompt.grokPrompt, /continuous vivid blue ground-and-background plane/);
  assert.match(studioPrompt.zImagePrompt, /no backdrop stand/);
  assert.match(meguroPrompt.grokPrompt, /asymmetric riverside composition/);
  assert.doesNotMatch(meguroPrompt.zImagePrompt, /avoid symmetrical|central road/i);
});

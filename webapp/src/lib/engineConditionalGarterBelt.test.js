import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls } from './engine.js';
import { buildPage1GenerationSummary, buildWorkspaceSummary } from './page1WorkspaceSummary.js';

const controls = getLockControls();

function optionId(key, zh) {
  const option = controls.find((control) => control.key === key)?.options?.find((entry) => entry.zh === zh);
  assert.ok(option, `Missing ${zh} for ${key}`);
  return option.id;
}

function generate(overrides) {
  return generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    ...overrides,
  }, [], { random: () => 0.417 })[0];
}

const garterBeltSummary = '蕾絲吊襪帶腰封（自動搭配）';
const extraPromptIds = {
  chestUpPortraitPrompt: 'chest-up-portrait',
  chestUpMjPortraitPrompt: 'chest-up-mj-portrait',
  fullBodyCharacterPrompt: 'full-body-character',
};

function getPromptText(prompt, field) {
  if (typeof prompt[field] === 'string') return prompt[field];
  const extraPromptId = extraPromptIds[field];
  return extraPromptId
    ? prompt.extraPrompts?.find((entry) => entry.id === extraPromptId)?.text || ''
    : '';
}

test('all approved independent lower garments add the derived garter-belt layer without changing stored selections', () => {
  for (const bottom of ['蕾絲內褲', '蕾絲丁字褲', '比基尼下身']) {
    const pantsId = optionId('pantsId', bottom);
    const legwearId = optionId('legwearId', '膝上蕾絲吊帶襪');
    const prompt = generate({ pantsId, legwearId });

    for (const field of ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt', 'fullBodyCharacterPrompt']) {
      const output = getPromptText(prompt, field);
      assert.match(output, /a separate lace garter belt worn over the bottoms at the hips/i, `${bottom}: ${field}`);
      assert.match(output, /slim straps connecting to the stocking tops/i, `${bottom}: ${field}`);
    }
    assert.doesNotMatch(getPromptText(prompt, 'chestUpPortraitPrompt'), /lace garter belt worn over the bottoms/i);
    assert.doesNotMatch(getPromptText(prompt, 'chestUpMjPortraitPrompt'), /lace garter belt worn over the bottoms/i);
    assert.equal(prompt.selection.pantsId, pantsId);
    assert.equal(prompt.selection.legwearId, legwearId);
    assert.match(prompt.summaryFields.wardrobe, new RegExp(garterBeltSummary));
    assert.doesNotMatch(String(prompt.selection.waistAccessoryId || ''), /吊襪帶/);
  }
});

test('non-approved independent bottoms do not receive the garter-belt layer', () => {
  const prompt = generate({
    pantsId: optionId('pantsId', '工裝短褲'),
    legwearId: optionId('legwearId', '膝上蕾絲吊帶襪'),
  });

  assert.doesNotMatch(prompt.grokPrompt, /lace garter belt worn over the bottoms/i);
  assert.doesNotMatch(prompt.zImagePrompt, /lace garter belt worn over the bottoms/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /lace garter belt worn over the bottoms/i);
  assert.doesNotMatch(prompt.summaryFields.wardrobe, /自動搭配蕾絲吊襪帶腰封/);
});

test('duo A/B selections only add the layer for the same person with both eligible selections', () => {
  const prompt = generate({
    subjectCount: '2',
    pantsAId: optionId('pantsAId', '蕾絲丁字褲'),
    legwearAId: optionId('legwearAId', '膝上蕾絲吊帶襪'),
    pantsBId: optionId('pantsBId', '工裝短褲'),
    legwearBId: optionId('legwearBId', '全無'),
  });

  assert.match(prompt.grokPrompt, /Woman 1:[\s\S]*?lace garter belt worn over the bottoms at the hips/i);
  assert.doesNotMatch(prompt.grokPrompt, /Woman 2:[\s\S]*?lace garter belt worn over the bottoms at the hips/i);
  assert.match(prompt.summaryFields.wardrobe, new RegExp(garterBeltSummary));
  assert.equal(prompt.selection.pantsAId, optionId('pantsAId', '蕾絲丁字褲'));
  assert.equal(prompt.selection.legwearAId, optionId('legwearAId', '膝上蕾絲吊帶襪'));
});

test('duo selections do not cross-match a bottom from one person with stockings on the other', () => {
  const prompt = generate({
    subjectCount: '2',
    pantsAId: optionId('pantsAId', '蕾絲丁字褲'),
    legwearAId: optionId('legwearAId', '全無'),
    pantsBId: optionId('pantsBId', '工裝短褲'),
    legwearBId: optionId('legwearBId', '膝上蕾絲吊帶襪'),
  });

  assert.doesNotMatch(prompt.grokPrompt, /lace garter belt worn over the bottoms/i);
  assert.doesNotMatch(prompt.summaryFields.wardrobe, /自動搭配蕾絲吊襪帶腰封/);
});

test('complete swimwear preset does not add the derived layer or summary label', () => {
  const prompt = generate({
    outfitPresetId: optionId('outfitPresetId', '套裝：泳裝度假'),
    legwearId: optionId('legwearId', '膝上蕾絲吊帶襪'),
  });

  assert.doesNotMatch(prompt.grokPrompt, /lace garter belt worn over the bottoms/i);
  assert.doesNotMatch(prompt.zImagePrompt, /lace garter belt worn over the bottoms/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /lace garter belt worn over the bottoms/i);
  assert.doesNotMatch(prompt.summaryFields.wardrobe, /自動搭配蕾絲吊襪帶腰封/);
});

test('workspace and generation summaries trace a derived belt only for selected standalone bottoms and stockings', () => {
  const locks = {
    ...createEmptyLocks(),
    pantsId: optionId('pantsId', '比基尼下身'),
    legwearId: optionId('legwearId', '膝上蕾絲吊帶襪'),
  };
  const prompt = generate(locks);
  const summary = buildWorkspaceSummary(locks, controls).wardrobe.summary;
  const generationSummary = buildPage1GenerationSummary(locks, prompt, controls);

  assert.match(summary, new RegExp(garterBeltSummary));
  assert.match(generationSummary, new RegExp(garterBeltSummary));

  const presetLocks = {
    ...locks,
    outfitPresetId: optionId('outfitPresetId', '套裝：泳裝度假'),
  };
  assert.doesNotMatch(buildWorkspaceSummary(presetLocks, controls).wardrobe.summary, /自動搭配蕾絲吊襪帶腰封/);
});

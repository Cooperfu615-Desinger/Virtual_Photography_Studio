import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';

const BODY_LABEL = '豐胸纖腰沙漏身形';
const BODY_SOURCE = 'I-cup bust, slender arms, narrow waist, wider hips, fuller upper thighs, slim calves, defined hourglass silhouette';
const controls = getLockControls();

function optionId(key, zh) {
  const option = controls.find((entry) => entry.key === key)?.options.find((entry) => entry.zh === zh);
  assert.ok(option, `Missing ${key}: ${zh}`);
  return option.id;
}

function locksWithNone() {
  const locks = createEmptyLocks();
  for (const control of controls) {
    if (/^(bodyType|hairStylingState)[AB]?Id$|^outerwear[AB]?OpeningId$|^eyewear[AB]?PlacementId$|^sceneAttributeId$/.test(control.key)) continue;
    const none = control.options?.find((entry) => entry.zh === '全無' || entry.zh === '無額外表情');
    if (none) locks[control.key] = none.id;
  }
  return locks;
}

function generate(locks, seed = 'hourglass-bikini-v1') {
  return generatePrompts(1, { ...locksWithNone(), ...locks }, [], {
    random: createSeededRandom(seed),
  })[0];
}

test('new body option keeps its full source and a number-free AI silhouette', () => {
  const prompt = generate({
    subjectCount: '1',
    bodyTypeId: optionId('bodyTypeId', BODY_LABEL),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    topId: optionId('topId', '全無'),
    pantsId: optionId('pantsId', '全無'),
    skirtId: optionId('skirtId', '全無'),
  });

  assert.match(prompt.grokPrompt, new RegExp(BODY_SOURCE, 'i'));
  assert.match(prompt.zImagePrompt, /I-cup bust.*slim calves/i);
  assert.match(prompt.midjourneyPrompt, /Pronounced hourglass silhouette, very full bust, slender arms and waist, wider hips, fuller upper thighs, slim calves/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /I-cup/i);
  assert.match(prompt.extraPrompts.find((entry) => entry.id === 'full-body-character')?.text || '', /I-cup bust.*slim calves/i);
});

test('the selected bikini layers receive only their own same-body fit details', () => {
  const bodyTypeId = optionId('bodyTypeId', BODY_LABEL);
  const bikiniTopId = optionId('topId', '比基尼上身');
  const bikiniBottomId = optionId('pantsId', '比基尼下身');
  const baseLocks = { subjectCount: '1', bodyTypeId, framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)') };
  const both = generate({ ...baseLocks, topId: bikiniTopId, pantsId: bikiniBottomId });

  for (const field of ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt']) {
    assert.match(both[field], /reduced-fabric (?:triangle )?cups/i, field);
    assert.match(both[field], /localized soft fullness/i, field);
    assert.match(both[field], /shallow impressions/i, field);
    assert.doesNotMatch(both[field], /top length meets or slightly overlaps the low-rise waistband/i, field);
  }
  assert.equal(both.selection.bodyTypeId, bodyTypeId);
  assert.equal(both.selection.topId, bikiniTopId);
  assert.equal(both.selection.pantsId, bikiniBottomId);

  const topOnly = generate({ ...baseLocks, topId: bikiniTopId, pantsId: optionId('pantsId', '直筒牛仔褲') });
  assert.match(topOnly.grokPrompt, /reduced-fabric (?:triangle )?cups/i);
  assert.doesNotMatch(topOnly.grokPrompt, /shallow impressions/i);

  const bottomOnly = generate({ ...baseLocks, topId: optionId('topId', '絲質細肩帶上衣'), pantsId: bikiniBottomId });
  assert.doesNotMatch(bottomOnly.grokPrompt, /reduced-fabric (?:triangle )?cups/i);
  assert.match(bottomOnly.grokPrompt, /shallow impressions/i);

  const ordinary = generate({ ...baseLocks, topId: optionId('topId', '絲質細肩帶上衣'), pantsId: optionId('pantsId', '直筒牛仔褲') });
  for (const field of ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt']) {
    assert.doesNotMatch(ordinary[field], /reduced-fabric (?:triangle )?cups|localized soft fullness|shallow impressions/i, field);
  }
  const oldBody = generate({ ...baseLocks, bodyTypeId: optionId('bodyTypeId', '性感曲線身形'), topId: bikiniTopId, pantsId: bikiniBottomId });
  assert.doesNotMatch(oldBody.grokPrompt, /reduced-fabric (?:triangle )?cups|localized soft fullness|shallow impressions/i);
});

test('body source follows the visible crop without leaking hidden regions', () => {
  const bodyTypeId = optionId('bodyTypeId', BODY_LABEL);
  const cases = [
    ['胸上特寫', /full bust, slender arms/i, /narrow waist|wider hips|fuller upper thighs|slim calves|I-cup/i],
    ['中景鏡頭 (Medium Shot)', /full bust, slender arms, narrow waist/i, /wider hips|fuller upper thighs|slim calves|I-cup/i],
    ['牛仔中景 (Cowboy Shot)', /full bust, slender arms, narrow waist, wider hips, fuller upper thighs/i, /slim calves|I-cup/i],
    ['全臉傾斜特寫', null, /I-cup|full bust|narrow waist|wider hips|fuller upper thighs|slim calves/i],
  ];
  for (const [framing, include, exclude] of cases) {
    const prompt = generate({ subjectCount: '1', bodyTypeId, framingId: optionId('framingId', framing), topId: optionId('topId', '全無'), pantsId: optionId('pantsId', '全無') }, framing);
    if (include) assert.match(prompt.grokPrompt, include, framing);
    assert.doesNotMatch(prompt.grokPrompt, exclude, framing);
    if (framing === '牛仔中景 (Cowboy Shot)') {
      assert.match(prompt.midjourneyPrompt, /very full bust, slender arms, narrow waist, wider hips, fuller upper thighs/i);
      assert.doesNotMatch(prompt.midjourneyPrompt, /slim calves|I-cup/i);
    }
  }
});

test('overlapping hem removes waist detail without leaking cup size into AI', () => {
  const prompt = generate({
    subjectCount: '1',
    bodyTypeId: optionId('bodyTypeId', BODY_LABEL),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    topId: optionId('topId', '長版寬鬆麻花針織毛衣'),
    topStylingId: optionId('topStylingId', '衣襬遮住部分下身'),
    pantsId: optionId('pantsId', '牛仔短褲'),
  });
  assert.match(prompt.grokPrompt, /I-cup bust, slender arms, wider hips/i);
  assert.doesNotMatch(prompt.grokPrompt, /I-cup bust, slender arms, narrow waist/i);
  assert.match(prompt.midjourneyPrompt, /Pronounced hourglass silhouette, very full bust, slender arms, wider hips/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /I-cup|narrow waist/i);
});

test('duo bikini fit belongs only to the role with the new body type', () => {
  const prompt = generate({
    subjectCount: '2',
    bodyTypeAId: optionId('bodyTypeAId', BODY_LABEL),
    bodyTypeBId: optionId('bodyTypeBId', '一般基本體型'),
    topAId: optionId('topAId', '比基尼上身'),
    pantsAId: optionId('pantsAId', '比基尼下身'),
    topBId: optionId('topBId', '比基尼上身'),
    pantsBId: optionId('pantsBId', '比基尼下身'),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
  });
  assert.match(prompt.grokPrompt, /Woman 1:[\s\S]*reduced-fabric (?:triangle )?cups/i);
  assert.match(prompt.grokPrompt, /Woman 1:[\s\S]*shallow impressions/i);
  const woman2 = prompt.grokPrompt.split('Woman 2:')[1] || '';
  assert.doesNotMatch(woman2, /reduced-fabric (?:triangle )?cups|localized soft fullness|shallow impressions/i);
});

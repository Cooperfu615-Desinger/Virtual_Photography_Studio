import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';

const BODY_LABEL = '豐胸纖腰沙漏身形';
import { BODY_TYPE_CATALOG_V2 } from './bodyTypeCatalogFixtures.js';
const BODY_SOURCE = BODY_TYPE_CATALOG_V2.find(item => item.zh === BODY_LABEL).en;
const MAIN_FIELDS = ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt'];
const REMOVED_FIT = /reduced-fabric triangle cups cover the bust center|side ties make shallow impressions against the rounded outer hips/i;
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

function generate(locks, seed = 'hourglass-source-v2') {
  return generatePrompts(1, { ...locksWithNone(), ...locks }, [], {
    random: createSeededRandom(seed),
  })[0];
}

test('selected I-cup Body Type stays verbatim in all three main prompts at every crop', () => {
  const bodyTypeId = optionId('bodyTypeId', BODY_LABEL);
  for (const framing of [
    '全無', '全身鏡頭 (Full Body Shot)', '牛仔中景 (Cowboy Shot)',
    '中景鏡頭 (Medium Shot)', '胸上特寫', '全臉傾斜特寫', '臉部特寫',
  ]) {
    const prompt = generate({
      subjectCount: '1', bodyTypeId, framingId: optionId('framingId', framing),
      topId: optionId('topId', '全無'), pantsId: optionId('pantsId', '全無'),
    }, framing);
    assert.equal(prompt.selection.bodyTypeId, bodyTypeId);
    for (const field of MAIN_FIELDS) {
      assert.ok(prompt[field].includes(BODY_SOURCE), `${framing}/${field}: exact Body Type source`);
    }
    assert.ok(prompt.extraPrompts.find((entry) => entry.id === 'full-body-character')?.text.includes(BODY_SOURCE));
  }
});

test('overlapping top hem keeps the same I-cup sentence in all main prompts', () => {
  const prompt = generate({
    subjectCount: '1',
    bodyTypeId: optionId('bodyTypeId', BODY_LABEL),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    topId: optionId('topId', '長版寬鬆麻花針織毛衣'),
    topStylingId: optionId('topStylingId', '衣襬遮住部分下身'),
    pantsId: optionId('pantsId', '牛仔短褲'),
  });
  for (const field of MAIN_FIELDS) assert.ok(prompt[field].includes(BODY_SOURCE), field);
});

test('bikini pieces keep only their catalog wording with the I-cup Body Type', () => {
  const bodyTypeId = optionId('bodyTypeId', BODY_LABEL);
  const topId = optionId('topId', '比基尼上身');
  const pantsId = optionId('pantsId', '比基尼下身');
  const prompt = generate({ subjectCount: '1', bodyTypeId, topId, pantsId });
  assert.equal(prompt.selection.topId, topId);
  assert.equal(prompt.selection.pantsId, pantsId);
  for (const field of MAIN_FIELDS) {
    assert.ok(prompt[field].includes(BODY_SOURCE), field);
    assert.doesNotMatch(prompt[field], REMOVED_FIT, field);
    assert.match(prompt[field], /triangle bikini top/i, field);
    assert.match(prompt[field], /side-tie bikini bottoms/i, field);
  }
  for (const entry of prompt.extraPrompts) assert.doesNotMatch(entry.text, REMOVED_FIT, entry.id);
});

test('the same source belongs only to the selected person in duo prompts', () => {
  const bodyTypeAId = optionId('bodyTypeAId', BODY_LABEL);
  const prompt = generate({
    subjectCount: '2', bodyTypeAId,
    bodyTypeBId: optionId('bodyTypeBId', '柔和沙漏身形'),
    framingId: optionId('framingId', '胸上特寫'),
    topAId: optionId('topAId', '比基尼上身'),
    pantsAId: optionId('pantsAId', '比基尼下身'),
    topBId: optionId('topBId', '比基尼上身'),
    pantsBId: optionId('pantsBId', '比基尼下身'),
  });
  assert.equal(prompt.selection.bodyTypeAId, bodyTypeAId);
  for (const field of MAIN_FIELDS) {
    assert.ok(prompt[field].includes(BODY_SOURCE), field);
    assert.equal(prompt[field].split(BODY_SOURCE).length - 1, 1, field);
    assert.doesNotMatch(prompt[field], REMOVED_FIT, field);
  }
});

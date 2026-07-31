import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls, normalizeLocks } from './engine.js';

const controlOptions = (key) => getLockControls().find((control) => control.key === key).options;
const optionLabels = (key) => controlOptions(key).map((option) => option.zh);
const optionByLabel = (key, label) => {
  const option = controlOptions(key).find((item) => item.zh === label);
  assert.ok(option, `Missing option ${label} for ${key}`);
  return option;
};

test('headphones use black Marshall Major V for both wearing placements', () => {
  const headOptions = controlOptions('headAccessoryId');
  const onHead = headOptions.find((item) => item.zh === '耳罩式耳機（戴在頭上）');
  const aroundNeck = headOptions.find((item) => item.zh === '耳罩式耳機（掛在脖子上）');

  assert.ok(onHead);
  assert.ok(aroundNeck);
  assert.match(onHead.en, /black Marshall Major V/);
  assert.match(aroundNeck.en, /black Marshall Major V/);
  const retiredHeadphonePattern = new RegExp(`${'AirPods'} ${'Max'}|silver`, 'i');
  assert.doesNotMatch([onHead.en, aroundNeck.en, onHead.desc, aroundNeck.desc].join(' '), retiredHeadphonePattern);
});

test('eyewear controls split frame, color, and placement dimensions', () => {
  assert.deepEqual(optionLabels('eyewearId'), [
    '全無',
    '粗框眼鏡',
    '細框眼鏡',
    '復古圓框眼鏡',
    '窄版橢圓眼鏡',
    '太陽眼鏡',
    '矩形眼鏡',
    '飛行員眼鏡',
    '貓眼眼鏡',
    '無框眼鏡',
  ]);

  assert.deepEqual(optionLabels('eyewearColorId'), [
    '全無',
    '黑色',
    '白色',
    '玳瑁色',
    '金屬銀',
    '金屬金',
    '透明框',
    '棕色',
    '琥珀色',
    '藍色',
    '紅色',
    '紫色',
    '粉色',
  ]);

  assert.deepEqual(optionLabels('eyewearPlacementId'), ['正常戴在臉上', '戴在頭頂']);

  ['黑框眼鏡', '白色鏡框眼鏡', '玳瑁色鏡框眼鏡', '眼鏡戴在頭頂'].forEach((label) => {
    assert.ok(!optionLabels('eyewearId').includes(label), `Merged eyewear option should not remain: ${label}`);
  });
});

test('legacy eyewear locks migrate into frame color and placement controls', () => {
  const legacyWhiteFrame = 'wardrobe:眼鏡-eyewear:白色鏡框眼鏡:2';
  const legacyHeadTop = 'wardrobe:眼鏡-eyewear:眼鏡戴在頭頂:7';

  const normalizedWhite = normalizeLocks({ ...createEmptyLocks(), eyewearId: legacyWhiteFrame });
  assert.equal(normalizedWhite.eyewearId, optionByLabel('eyewearId', '粗框眼鏡').id);
  assert.equal(normalizedWhite.eyewearColorId, optionByLabel('eyewearColorId', '白色').id);
  assert.equal(normalizedWhite.eyewearPlacementId, optionByLabel('eyewearPlacementId', '正常戴在臉上').id);

  const normalizedHeadTop = normalizeLocks({ ...createEmptyLocks(), eyewearId: legacyHeadTop });
  assert.equal(normalizedHeadTop.eyewearId, optionByLabel('eyewearId', '細框眼鏡').id);
  assert.equal(normalizedHeadTop.eyewearPlacementId, optionByLabel('eyewearPlacementId', '戴在頭頂').id);
});

test('eyewear prompt composes frame color and placement', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    eyewearId: optionByLabel('eyewearId', '粗框眼鏡').id,
    eyewearColorId: optionByLabel('eyewearColorId', '玳瑁色').id,
    eyewearPlacementId: optionByLabel('eyewearPlacementId', '戴在頭頂').id,
  });

  const text = [prompt.grokPrompt, prompt.zImagePrompt].join('\n');
  assert.match(text, /tortoiseshell (?:frame, )?bold thick-frame glasses, resting on top of the head/);
  assert.match(text, /eyes unobstructed/);
});

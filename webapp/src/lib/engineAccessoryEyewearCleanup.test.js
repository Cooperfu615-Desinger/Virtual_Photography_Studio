import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls, normalizeLocks } from './engine.js';
import { randomizeLockKeys } from './page1SectionRandom.js';

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

test('face-covering head accessories keep their defining construction in all single-subject outputs', () => {
  const blackMask = optionByLabel('headAccessoryId', '黑色口罩');
  const respirator = optionByLabel('headAccessoryId', '防毒面具（3M 6200）');

  assert.match(blackMask.en, /black disposable pleated face mask/i);
  assert.match(blackMask.en, /covering the nose and mouth/i);
  assert.match(respirator.en, /grey 3M 6200 reusable half-face respirator/i);
  assert.match(respirator.en, /twin side filter cartridges/i);

  for (const [label, expectedPattern] of [
    ['黑色口罩', /black disposable pleated face mask/i],
    ['防毒面具（3M 6200）', /grey 3M 6200 reusable half-face respirator/i],
  ]) {
    const [prompt] = generatePrompts(1, {
      ...createEmptyLocks(),
      subjectCount: '1',
      framingId: optionByLabel('framingId', '全身鏡頭 (Full Body Shot)').id,
      headAccessoryId: optionByLabel('headAccessoryId', label).id,
    });
    const fixedOutputs = ['chest-up-portrait', 'chest-up-mj-portrait', 'full-body-character']
      .map((id) => prompt.extraPrompts.find((entry) => entry.id === id)?.text || '');

    for (const text of [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt, ...fixedOutputs]) {
      assert.match(text, expectedPattern, `${label} should remain visible in every single-subject output`);
    }
  }
});

test('head accessory colors reuse the garment palette and replace authored colors consistently', () => {
  assert.deepEqual(optionLabels('headAccessoryColorId'), optionLabels('topColorId'));
  assert.deepEqual(optionLabels('headAccessoryAColorId'), optionLabels('topAColorId'));
  assert.deepEqual(optionLabels('headAccessoryBColorId'), optionLabels('topBColorId'));

  const selectedCases = [
    {
      accessory: '黑色口罩',
      color: '紅色',
      expected: /red disposable pleated face mask/i,
      retired: /black disposable pleated face mask/i,
    },
    {
      accessory: '防毒面具（3M 6200）',
      color: '亮紅色',
      expected: /bright red 3M 6200 reusable half-face respirator/i,
      retired: /grey 3M 6200 reusable half-face respirator/i,
    },
  ];

  for (const { accessory, color, expected, retired } of selectedCases) {
    const [prompt] = generatePrompts(1, {
      ...createEmptyLocks(),
      subjectCount: '1',
      framingId: optionByLabel('framingId', '全身鏡頭 (Full Body Shot)').id,
      headAccessoryId: optionByLabel('headAccessoryId', accessory).id,
      headAccessoryColorId: optionByLabel('headAccessoryColorId', color).id,
    });
    const outputs = [
      prompt.grokPrompt,
      prompt.zImagePrompt,
      prompt.midjourneyPrompt,
      ...prompt.extraPrompts.map((entry) => entry.text),
    ];

    for (const text of outputs) {
      assert.match(text, expected, `${accessory} should carry the selected ${color} color`);
      assert.doesNotMatch(text, retired, `${accessory} should not retain its authored color after override`);
    }
  }
});

test('random head accessory color resolves a concrete palette color and keeps the selected accessory', () => {
  const controls = getLockControls();
  const mask = optionByLabel('headAccessoryId', '黑色口罩');
  const randomized = randomizeLockKeys(
    { ...createEmptyLocks(), headAccessoryId: mask.id },
    ['headAccessoryColorId'],
    createEmptyLocks(),
    controls,
  );

  assert.equal(randomized.headAccessoryColorId, '');

  const [prompt] = generatePrompts(1, randomized, [], { random: () => 0 });
  assert.equal(prompt.selection.headAccessoryId, mask.id);
  assert.equal(prompt.selection.headAccessoryColorId, 'black');
  assert.match(prompt.midjourneyPrompt, /black disposable pleated face mask/i);
});

test('duo AI output retains independently selected face coverings for both women', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '2',
    headAccessoryAId: optionByLabel('headAccessoryAId', '黑色口罩').id,
    headAccessoryBId: optionByLabel('headAccessoryBId', '防毒面具（3M 6200）').id,
  });

  for (const text of [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt]) {
    assert.match(text, /black disposable pleated face mask/i);
    assert.match(text, /grey 3M 6200 reusable half-face respirator/i);
  }
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

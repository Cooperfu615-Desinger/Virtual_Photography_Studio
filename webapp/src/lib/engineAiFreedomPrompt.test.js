import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls } from './engine.js';

function optionId(controlKey, zh) {
  const control = getLockControls().find((entry) => entry.key === controlKey);
  const option = control.options.find((entry) => entry.zh === zh);
  assert.ok(option, `Expected option ${zh} in ${controlKey}`);
  return option.id;
}

function createAllNoneLocks() {
  const locks = { ...createEmptyLocks() };
  getLockControls().forEach((control) => {
    const noneOption = control.options?.find((entry) => entry.zh === '全無' || entry.zh === '無額外表情');
    if (noneOption) locks[control.key] = noneOption.id;
  });
  return locks;
}

test('AI normal single prompt keeps only the agreed freedom-oriented sections', () => {
  const [prompt] = generatePrompts(1, {
    ...createAllNoneLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    bodyTypeId: optionId('bodyTypeId', '一般基本體型'),
    hairstyleId: optionId('hairstyleId', '柔波：深側分'),
    hairColorId: optionId('hairColorId', '栗子棕'),
    eyewearId: optionId('eyewearId', '粗框眼鏡'),
    eyewearColorId: optionId('eyewearColorId', '黑色'),
    headAccessoryId: optionId('headAccessoryId', '耳罩式耳機（掛在脖子上）'),
    topId: optionId('topId', '領帶襯衫'),
    topColorId: optionId('topColorId', '白色'),
    skirtId: optionId('skirtId', 'A 字短裙'),
    bottomColorId: optionId('bottomColorId', '黑色'),
    outerwearId: optionId('outerwearId', '全無'),
    locationId: optionId('locationId', '戶外：首爾聖水洞街區'),
    styleId: optionId('styleId', '上田義彥｜靜默自然暗調'),
    lensId: optionId('lensId', '50mm 標準鏡頭 (Standard)'),
    filmId: optionId('filmId', '富士 Provia 清透明亮'),
  });

  const text = prompt.midjourneyPrompt;
  assert.match(text, /^Photorealistic editorial portrait\./i);
  assert.match(text, /natural balanced silhouette, gentle waist curve, natural bust and hips/i);
  assert.doesNotMatch(text, /about 160-165 cm visual height|83-62-88 body proportion anchor|torso-to-leg/i);
  assert.match(text, /deep side-parted long soft waves|chestnut-brown hair/i);
  assert.match(text, /black bold-frame glasses|black frame, bold thick-frame glasses/i);
  assert.match(text, /Marshall Major V/i);
  assert.match(text, /white collared shirt with a short soft necktie/i);
  assert.match(text, /black a-line mini skirt/i);
  assert.match(text, /Seoul Seongsu-dong urban corner/i);
  assert.match(text, /Inspired by Yoshihiko Ueda|50mm standard lens|Fujifilm Provia/i);
  assert.doesNotMatch(text, /\n/);
  assert.doesNotMatch(prompt.midjourneyPrompt, /standing|sitting|kneeling|captured as|captured in|\bnot\b/i);
});

test('AI character-card prompt keeps structured identity while simplifying wardrobe', () => {
  const [prompt] = generatePrompts(1, {
    ...createAllNoneLocks(),
    characterProfileId: 'character-yuri',
    locationId: optionId('locationId', '室內：英倫復古窗邊房間'),
    styleId: optionId('styleId', '上田義彥｜靜默自然暗調'),
    lensId: optionId('lensId', '50mm 標準鏡頭 (Standard)'),
    filmId: optionId('filmId', '富士 Provia 清透明亮'),
  });

  const text = prompt.midjourneyPrompt;

  assert.match(text, /^Photorealistic editorial portrait\./i);
  assert.match(text, /broad soft oval face with a rounded jaw/i);
  assert.match(text, /large level dark-brown round-almond eyes/i);
  assert.match(text, /slim petite casual-fashion proportions/i);
  assert.match(text, /glossy natural black long straight hair/i);
  assert.match(text, /round translucent brown acetate eyeglasses/i);
  assert.match(text, /white ribbed off-shoulder cropped long-sleeve top/i);
  assert.match(text, /low-rise medium-wash blue flared jeans/i);
  assert.match(text, /brown low-top canvas sneakers/i);
  assert.doesNotMatch(text, /\n/);
  assert.doesNotMatch(prompt.midjourneyPrompt, /A moody film still|captured as|\bnot\b/i);
});

test('AI special-outfit prompt moves built-in hair and tattoo details into the subject line', () => {
  const [prompt] = generatePrompts(1, {
    ...createAllNoneLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    specialOutfitId: optionId('specialOutfitId', '米色細肩背心蕾絲胸衣工裝寬褲造型'),
    locationId: optionId('locationId', '室內：英倫復古窗邊房間'),
  });

  const text = prompt.midjourneyPrompt;
  const wardrobeStart = text.indexOf('Wearing ');
  const sceneStart = text.indexOf(' In ', wardrobeStart);
  const subjectLine = wardrobeStart >= 0 ? text.slice(0, wardrobeStart) : '';
  const wardrobeLine = wardrobeStart >= 0
    ? text.slice(wardrobeStart, sceneStart >= 0 ? sceneStart : undefined)
    : '';

  assert.match(subjectLine, /long voluminous side-part black waves/i);
  assert.match(subjectLine, /small cherry tattoo on the right chest/i);
  assert.doesNotMatch(wardrobeLine, /long voluminous side-part black waves|small cherry tattoo/i);
  assert.match(wardrobeLine, /fitted camisole and oversized cargo contrast/i);
  assert.match(wardrobeLine, /low-rise light-wash oversized cargo jeans/i);
  assert.match(wardrobeLine, /white chunky platform slide sandals/i);
  assert.doesNotMatch(text, /\n/);
  assert.doesNotMatch(prompt.midjourneyPrompt, /captured as|\bnot\b/i);
});

test('AI fixed-composition prompt keeps the selected set as its scene sentence without pose instructions', () => {
  const [prompt] = generatePrompts(1, {
    ...createAllNoneLocks(),
    subjectCount: '1',
    fixedCompositionSetId: optionId('fixedCompositionSetId', '清水模牆面沙發棚'),
    fixedSetBackgroundStateId: optionId('fixedSetBackgroundStateId', '全無'),
  });

  assert.match(prompt.midjourneyPrompt, /raw concrete wall|brown vintage Chesterfield leather sofa/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /The subject can interact|close-lens self-shot|standing|sitting/i);
});

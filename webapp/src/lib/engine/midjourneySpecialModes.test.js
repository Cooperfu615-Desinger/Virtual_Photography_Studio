import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls } from '../engine.js';
import { countAiPromptWords } from './aiPromptLengthContract.js';

const controls = getLockControls();

function optionId(controlKey, zh) {
  const control = controls.find((entry) => entry.key === controlKey);
  const option = control?.options?.find((entry) => entry.zh === zh);
  assert.ok(option, `Expected option ${zh} in ${controlKey}`);
  return option.id;
}

function createAllNoneLocks() {
  const locks = { ...createEmptyLocks() };
  for (const control of controls) {
    const noneOption = control.options?.find((entry) => entry.zh === '全無');
    if (noneOption) locks[control.key] = noneOption.id;
  }
  return locks;
}

test('phase 5 keeps Character Card identity anchors without control-language hair instructions', () => {
  const [prompt] = generatePrompts(1, {
    ...createAllNoneLocks(),
    characterProfileId: 'character-jiwoo',
    characterCardHairVariantId: 'highlight-streaks',
  });

  assert.match(prompt.midjourneyPrompt, /20-year-old East Asian woman/i);
  assert.match(prompt.midjourneyPrompt, /small heart-oval face with a fine pointed chin/i);
  assert.match(prompt.midjourneyPrompt, /wide-set gray-hazel almond eyes with lifted corners/i);
  assert.match(prompt.midjourneyPrompt, /narrow-bridge rounded-tip nose/i);
  assert.match(prompt.midjourneyPrompt, /full coral-brick cupid-bow lips/i);
  assert.match(prompt.midjourneyPrompt, /extremely long natural black hair/i);
  assert.match(prompt.midjourneyPrompt, /subtle localized highlight streaks/i);
  assert.match(prompt.midjourneyPrompt, /black off-shoulder gothic dress/i);
  assert.doesNotMatch(
    prompt.midjourneyPrompt,
    /\bA 20-year-old adult\b|keep the original hair identity|add subtle|without changing|must not|do not|avoid/i
  );
});

test('phase 5 removes redundant complete-look category words without losing garments', () => {
  const [prompt] = generatePrompts(1, {
    ...createAllNoneLocks(),
    outfitPresetId: optionId('outfitPresetId', '套裝：空服員制服'),
  });

  assert.match(prompt.midjourneyPrompt, /Wearing flight attendant uniform, fitted skirt or trousers, tailored jacket/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /flight attendant uniform outfit/i);
  assert.match(prompt.zImagePrompt, /flight attendant uniform outfit/i);
  assert.match(prompt.grokPrompt, /flight attendant uniform outfit/i);
});

test('phase 5 renders duo AI as direct role sentences without section labels', () => {
  const [prompt] = generatePrompts(1, {
    ...createAllNoneLocks(),
    subjectCount: '2',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    bodyTypeAId: optionId('bodyTypeAId', '運動緊實身形'),
    bodyTypeBId: optionId('bodyTypeBId', '柔和沙漏身形'),
    specialOutfitAId: optionId('specialOutfitAId', '藍灰長外套蕾絲胸衣寬褲造型'),
    specialOutfitBId: optionId('specialOutfitBId', '米色潑染破壞工裝套裝造型'),
    duoPoseId: optionId('duoPoseId', '充滿情慾的時尚寫真'),
    duoPoseBaseId: optionId('duoPoseBaseId', '站姿'),
    locationId: optionId('locationId', '室內：現代高樓公寓客廳'),
  });

  assert.match(
    prompt.midjourneyPrompt,
    /^Photorealistic editorial portrait\. Full-body portrait\. Two 20-year-old Japanese or Korean women\./
  );
  assert.match(prompt.midjourneyPrompt, /First woman, fit toned athletic female body/i);
  assert.match(prompt.midjourneyPrompt, /wearing avant-garde blue-gray tailored street look/i);
  assert.match(prompt.midjourneyPrompt, /Second woman, soft natural hourglass body/i);
  assert.match(prompt.midjourneyPrompt, /wearing distressed painter-workwear street look/i);
  assert.match(prompt.midjourneyPrompt, /Modern high-rise apartment living room/i);
  assert.doesNotMatch(
    prompt.midjourneyPrompt,
    /(?:Woman 1|Woman 2|Pose|Scene|Lighting|Camera Look):|\bHas\b|\bWears\b|\n/
  );
  assert.ok(countAiPromptWords(prompt.midjourneyPrompt) <= 180);

  assert.match(prompt.zImagePrompt, /Woman 1:/);
  assert.match(prompt.zImagePrompt, /Woman 2:/);
  assert.match(prompt.grokPrompt, /Woman 1:/);
  assert.match(prompt.grokPrompt, /Woman 2:/);
});

test('phase 5 keeps fixed-composition special outfits before the direct set sentence', () => {
  const [prompt] = generatePrompts(1, {
    ...createAllNoneLocks(),
    fixedCompositionSetId: optionId('fixedCompositionSetId', '暖灰泥黑絲絨工業沙發棚'),
    fixedSetPositionId: optionId('fixedSetPositionId', '自由場景互動'),
    specialOutfitId: optionId('specialOutfitId', '白色短袖背心格紋迷你裙白蕾絲襪造型'),
  });
  const wardrobeIndex = prompt.midjourneyPrompt.indexOf('Wearing ');
  const setIndex = prompt.midjourneyPrompt.indexOf('The central scene is');

  assert.ok(wardrobeIndex >= 0);
  assert.ok(setIndex > wardrobeIndex);
  assert.match(prompt.midjourneyPrompt, /cropped white short-sleeve button shirt/i);
  assert.match(prompt.midjourneyPrompt, /matte black velvet sofa/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /\bIn The central scene\b|fixed-set rule|preserve anchors:/i);
});

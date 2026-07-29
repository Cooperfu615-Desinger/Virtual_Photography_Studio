import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls } from '../engine.js';

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

test('phase 3 gives normal AI subjects a direct Midjourney identity lead', () => {
  const locks = {
    ...createAllNoneLocks(),
    bodyTypeId: optionId('bodyTypeId', '性感曲線身形'),
    hairstyleId: optionId('hairstyleId', '韓系蓬鬆鎖骨柔波髮'),
    hairColorId: optionId('hairColorId', '栗子棕'),
    framingId: optionId('framingId', '中景鏡頭 (Medium Shot)'),
  };
  const [prompt] = generatePrompts(1, locks);

  assert.match(
    prompt.midjourneyPrompt,
    /^Photorealistic editorial portrait\. Waist-up portrait\. 20s Japanese or Korean woman, seductive editorial presence,/i
  );
  assert.match(prompt.midjourneyPrompt, /full bust, narrow defined waist, flat abdomen/i);
  assert.match(prompt.midjourneyPrompt, /voluminous Korean collarbone-length soft waves/i);
  assert.match(prompt.midjourneyPrompt, /chestnut-brown hair/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /\bA 20s seductive stunning\b/i);

  assert.match(prompt.zImagePrompt, /A 20s seductive stunning Japanese or Korean woman/i);
  assert.doesNotMatch(prompt.grokPrompt, /seductive editorial presence/i);
});

test('phase 3 emits the lower-crop wardrobe visibility boundary only once', () => {
  const locks = {
    ...createAllNoneLocks(),
    outfitPresetId: optionId('outfitPresetId', '套裝：開扣長袖襯衫包臀裙'),
    framingId: optionId('framingId', '中景鏡頭 (Medium Shot)'),
  };
  const [prompt] = generatePrompts(1, locks);
  const wardrobeSentence = prompt.midjourneyPrompt.match(/\bWearing [^.]+\./)?.[0] || '';

  assert.equal(
    wardrobeSentence,
    'Wearing tight long-sleeve button-up shirt outfit, tight bodycon mini skirt, smooth hip-hugging skirt silhouette at the lower crop edge.'
  );
  assert.equal(
    wardrobeSentence.match(/\bat the lower crop edge\b/gi)?.length || 0,
    1
  );
  assert.match(prompt.zImagePrompt, /tight bodycon mini skirt/i);
  assert.match(prompt.grokPrompt, /tight bodycon mini skirt/i);
});

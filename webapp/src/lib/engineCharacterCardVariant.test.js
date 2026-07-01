import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls, normalizeLocks } from './engine.js';

function optionId(controlKey, zh) {
  const control = getLockControls().find((entry) => entry.key === controlKey);
  assert.ok(control, `Expected control ${controlKey}`);
  const option = control.options.find((entry) => entry.zh === zh);
  assert.ok(option, `Expected option ${zh} in ${controlKey}`);
  return option.id;
}

test('normalizeLocks preserves character card variant fields', () => {
  const locks = normalizeLocks({
    characterProfileId: 'character-rika',
    characterCardHairVariantId: 'low-ponytail',
    characterCardWardrobeMode: 'selected-layers',
    characterCardWardrobeLayerIds: ['top', 'bottom'],
    characterCardPromptOverride: 'temporary override text',
  });

  assert.equal(locks.characterProfileId, 'character-rika');
  assert.equal(locks.characterCardHairVariantId, 'low-ponytail');
  assert.equal(locks.characterCardWardrobeMode, 'selected-layers');
  assert.deepEqual(locks.characterCardWardrobeLayerIds, ['top', 'bottom']);
  assert.equal(locks.characterCardPromptOverride, 'temporary override text');
});

test('plain PAGE1 character card keeps full default wardrobe for old behavior', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    characterProfileId: 'character-rika',
  });
  const text = [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt].join('\n');

  assert.match(text, /cropped white short-sleeve baby tee/i);
  assert.match(text, /low-rise light-wash blue jeans/i);
  assert.match(text, /white low-top sneakers/i);
  assert.match(text, /beaded choker/i);
});

test('character card variant can include selected card layers and PAGE1 missing layers', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    characterProfileId: 'character-rika',
    characterCardHairVariantId: 'low-ponytail',
    characterCardWardrobeMode: 'selected-layers',
    characterCardWardrobeLayerIds: ['top'],
    skirtId: optionId('skirtId', '牛仔短裙'),
    shoesId: optionId('shoesId', '高跟鞋'),
    neckAccessoryId: optionId('neckAccessoryId', '鎖骨細金屬鏈'),
  });
  const text = [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt].join('\n');

  assert.equal(prompt.selection.characterProfileId, 'character-rika');
  assert.equal(prompt.selection.characterCardHairVariantId, 'low-ponytail');
  assert.deepEqual(prompt.selection.characterCardWardrobeLayerIds, ['top']);
  assert.match(text, /low ponytail/i);
  assert.match(text, /cropped white short-sleeve baby tee/i);
  assert.match(text, /denim short skirt|牛仔/i);
  assert.match(text, /high heels|高跟鞋/i);
  assert.match(text, /collarbone|鎖骨/i);
  assert.doesNotMatch(text, /low-rise light-wash blue jeans/i);
  assert.doesNotMatch(text, /white low-top sneakers/i);
  assert.ok(prompt.structured.Wardrobe.length > 0);
});

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls } from './engine.js';
import {
  dedupeRepeatedCommaFragments,
  materializeOutfitColorControls,
} from './engine/promptTextDeduplication.js';

function optionId(controlKey, zh) {
  const control = getLockControls().find((entry) => entry.key === controlKey);
  const option = control?.options.find((entry) => entry.zh === zh);
  assert.ok(option, `Expected option ${zh} in ${controlKey}`);
  return option.id;
}

function occurrenceCount(value, pattern) {
  return value.match(pattern)?.length || 0;
}

test('dedupeRepeatedCommaFragments removes only exact repeated accessory fragments', () => {
  assert.deepEqual(
    dedupeRepeatedCommaFragments([
      'small pearl stud earring detail, soft understated pearl accent',
      'layered pearl necklace detail, soft understated pearl accent',
    ]),
    [
      'small pearl stud earring detail, soft understated pearl accent',
      'layered pearl necklace detail',
    ]
  );
});

test('materializeOutfitColorControls replaces redundant target lists with explicit selected colors', () => {
  assert.deepEqual(
    materializeOutfitColorControls(
      'lace outfit, all fabric garments and boots controlled by outfit primary color, metal trim',
      { primaryColorText: 'red' }
    ),
    {
      text: 'lace outfit, all fabric garments and boots set to red, metal trim',
      consumedPrimary: true,
      consumedContrast: false,
    }
  );
});

test('generated prompts state a controlled outfit color without repeating its garment target phrases', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    outfitPresetId: optionId('outfitPresetId', '套裝：網狀蕾絲馬甲短裙長靴'),
    outfitPresetPrimaryColorId: optionId('outfitPresetPrimaryColorId', '紅色'),
    outerwearId: optionId('outerwearId', '全無'),
    legwearId: optionId('legwearId', '全無'),
    shoesId: optionId('shoesId', '全無'),
  });

  for (const output of [prompt.grokPrompt, prompt.zImagePrompt]) {
    assert.match(output, /all fabric garments and boots set to red/i);
    assert.equal(occurrenceCount(output, /asymmetrical deconstructed lace mini skirt/gi), 1);
    assert.equal(occurrenceCount(output, /lace ribbon choker/gi), 1);
    assert.equal(occurrenceCount(output, /punk gothic waist belt/gi), 1);
  }
});

test('generated subject accessories remove an exact repeated visual accent once', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    earringsId: optionId('earringsId', '珍珠耳釘'),
    neckAccessoryId: optionId('neckAccessoryId', '多條層疊的珍珠項鍊'),
  });

  for (const output of [prompt.grokPrompt, prompt.zImagePrompt]) {
    assert.match(output, /small pearl stud earring detail/i);
    assert.match(output, /layered pearl necklace detail/i);
    assert.equal(occurrenceCount(output, /soft understated pearl accent/gi), 1);
  }
});

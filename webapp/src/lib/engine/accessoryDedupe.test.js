import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';

// Random accessory dedupe (Cooper 2026-10-23): a randomly drawn accessory never repeats an object the
// outfit already names, e.g. a preset's lace ribbon choker or punk gothic waist belt.
const controls = getLockControls();
const option = (key, zh) => controls.find(c => c.key === key).options.find(o => o.zh === zh).id;
const count = (text, pattern) => (text.match(pattern) || []).length;

test('a preset that already names a choker and a belt never gets a second copy from the random draw', () => {
  const locks = {
    ...createEmptyLocks(), subjectCount: '1', framingId: option('framingId', '全身鏡頭 (Full Body Shot)'),
    outfitPresetId: option('outfitPresetId', '套裝：網狀蕾絲馬甲短裙長靴'), outfitPresetPrimaryColorId: option('outfitPresetPrimaryColorId', '紅色'),
    outerwearId: option('outerwearId', '全無'), legwearId: option('legwearId', '全無'), shoesId: option('shoesId', '全無'),
  };
  for (let index = 0; index < 600; index += 1) {
    const prompt = generatePrompts(1, locks, [], { random: createSeededRandom(`dedupe-${index}`) })[0];
    for (const text of [prompt.grokPrompt, prompt.zImagePrompt]) {
      assert.ok(count(text, /lace ribbon choker/gi) <= 1, `${index}: choker repeated`);
      assert.ok(count(text, /punk gothic waist belt/gi) <= 1, `${index}: belt repeated`);
    }
  }
});

test('a locked accessory is honored even when the outfit names the same object', () => {
  const prompt = generatePrompts(1, {
    ...createEmptyLocks(), subjectCount: '1', framingId: option('framingId', '全身鏡頭 (Full Body Shot)'),
    outfitPresetId: option('outfitPresetId', '套裝：網狀蕾絲馬甲短裙長靴'), outfitPresetPrimaryColorId: option('outfitPresetPrimaryColorId', '紅色'),
    neckAccessoryId: option('neckAccessoryId', '蕾絲緞帶頸圈'),
  }, [], { random: createSeededRandom('locked') })[0];
  assert.match(prompt.grokPrompt, /lace ribbon choker/i);
  assert.equal(prompt.selection.neckAccessoryId, option('neckAccessoryId', '蕾絲緞帶頸圈'));
});

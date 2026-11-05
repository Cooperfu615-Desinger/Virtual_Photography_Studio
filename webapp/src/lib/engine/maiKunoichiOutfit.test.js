import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import { deserializeFavoritePrompt, serializeFavoritePrompt, parseLocksFromStandardPrompt } from '../../features/saved-cards/cardCodec.js';
import { getGrokImagineResult } from '../grokImagineResult.js';

const controls = getLockControls();
const option = (key, zh) => {
  const item = controls.find(c => c.key === key)?.options.find(o => o.zh === zh);
  assert.ok(item, `${key}: ${zh}`);
  return item;
};
function generate(color = '紅色') {
  const locks = { ...createEmptyLocks(), subjectCount: '1' };
  for (const control of controls) {
    const none = control.options.find(item => ['全無', '無額外表情'].includes(item.zh));
    if (none) locks[control.key] = none.id;
  }
  locks.outfitPresetId = option('outfitPresetId', '套裝：不知火舞風女忍者套裝').id;
  locks.outfitPresetPrimaryColorId = option('outfitPresetPrimaryColorId', color).id;
  locks.framingId = option('framingId', '全身鏡頭 (Full Body Shot)').id;
  return generatePrompts(1, locks, [], { random: createSeededRandom('mai-kunoichi-v1') })[0];
}

test('the selected outfit retains its identity, source, color and saved selection', () => {
  const item = option('outfitPresetId', '套裝：不知火舞風女忍者套裝');
  assert.equal(item.meta.referenceImageOptional, true);
  assert.equal(item.meta.referenceImage, undefined);
  assert.equal(item.id, 'wardrobe:套裝-outfit-presets:mai-shiranui-kunoichi');
  assert.ok(item.legacyIds.includes('wardrobe:套裝-outfit-presets:套裝-不知火舞風女忍者套裝:59'));
  const result = generate();
  for (const output of [result.grokPrompt, result.zImagePrompt, result.nanoBananaPrompt,
    ...result.extraPrompts.map(entry => entry.text)]) {
    assert.match(output, /kunoichi/i);
    assert.match(output, /red/i);
    assert.match(output, /white trim/i);
  }
  assert.match(result.midjourneyPrompt, /ninja dress/i);
  assert.match(getGrokImagineResult(result), /(?:ninja|kunoichi)/i);
  assert.equal(deserializeFavoritePrompt(serializeFavoritePrompt(result)).selection.outfitPresetId, item.id);
  assert.equal(parseLocksFromStandardPrompt(result.grokPrompt, controls).locks.outfitPresetId, item.id);
});

test('other primary colors follow the same control without a fixed red garment source', () => {
  const result = generate('寶藍色');
  for (const output of [result.grokPrompt, result.zImagePrompt, result.nanoBananaPrompt]) {
    assert.match(output, /royal blue/i);
    assert.doesNotMatch(output, /crimson.red|red ninja dress/i);
  }
});

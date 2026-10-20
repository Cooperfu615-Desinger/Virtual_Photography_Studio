import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { generatePrompts, createSeededRandom, getLockControls } from '../engine.js';
import { naturalFixtureLocks } from './midjourneyNaturalFixtures.js';
import baseline from './shirtBlackBottomProtected.json' with { type: 'json' };
import legacy from './shirtBlackBottomLegacy.json' with { type: 'json' };
import { buildRestoreLocks, parseLocksFromStandardPrompt, serializeFavoritePrompt, deserializeFavoritePrompt } from '../../features/saved-cards/cardCodec.js';

import { FULLY_CLOSED_OPENING_ID } from './outerwearClosure.js';

const controls = getLockControls();
const names = ['套裝：開扣短袖襯衫熱褲', '套裝：開扣長袖襯衫包臀裙'];
const option = (key, zh) => controls.find(c => c.key === key).options.find(o => o.zh === zh);
const generate = (selections, seed = 'shirt-black-nontarget') => generatePrompts(1,
  naturalFixtureLocks({ subjectCount: '1', framingId: { byZh: '全身鏡頭 (Full Body Shot)' }, ...selections }), [],
  { random: createSeededRandom(seed) })[0];
const fields = p => ({ grokPrompt: p.grokPrompt, zImagePrompt: p.zImagePrompt, midjourneyPrompt: p.midjourneyPrompt,
  nanoBananaPrompt: p.nanoBananaPrompt, extraPrompts: p.extraPrompts, selection: p.selection,
  structured: p.structured, summary: p.summary, summaryFields: p.summaryFields });
const texts = p => [p.grokPrompt, p.zImagePrompt, p.midjourneyPrompt, p.nanoBananaPrompt, ...p.extraPrompts.map(e => e.text)];

test('all other presets preserve every output, selection and structured source byte for byte', () => {
  for (const row of baseline) assert.equal(createHash('sha256').update(JSON.stringify(fields(generate(row.selections)))).digest('hex'), row.hash,
    JSON.stringify(row.selections));
});

test('the two shirt presets keep black bottoms and direct primary colors only to the shirt', () => {
  for (const [index, name] of names.entries()) for (const color of ['全無', '紅色', '白色', '黑色', '鏡面鉻銀']) {
    const p = generate({ outfitPresetId: { byZh: name }, outfitPresetPrimaryColorId: { byZh: color } });
    const bottom = index ? /black bodycon mini skirt/i : /black hot pants/i;
    for (const text of [p.grokPrompt, p.zImagePrompt, p.midjourneyPrompt, p.nanoBananaPrompt,
      p.extraPrompts.find(e => e.id === 'full-body-character').text]) {
      assert.match(text, bottom, `${name}/${color}`);
      assert.doesNotMatch(text, /controlled by|primary garment color|secondary garment color|red (?:hot pants|bodycon mini skirt)/i);
    }
    if (color === '紅色') assert.match(p.midjourneyPrompt, /red (?:short|long)-sleeve button-up shirt/);
    if (color === '全無') assert.doesNotMatch(p.midjourneyPrompt, /(?:red|white|black) (?:short|long)-sleeve/);
    assert.equal(option('outfitPresetId', name).meta.colorMode, 'primary');
    assert.deepEqual(option('outfitPresetId', name).meta.colorTargets.primary, ['shirt_fabric']);
  }
});

test('contrasting, locked and complete-look palettes cannot recolor fixed black bottoms', () => {
  for (const name of names) {
    const p = generate({ outfitPresetId: { byZh: name }, outfitPresetPrimaryColorId: { byZh: '紅色' },
      outfitPresetContrastColorId: { byZh: '白色' },
      outfitPresetLockedPaletteId: controls.find(c => c.key === 'outfitPresetLockedPaletteId').options.find(o => !['none', 'random'].includes(o.id)).id, completeLookPaletteId: { byZh: '奶油米白' } });
    for (const text of texts(p)) assert.doesNotMatch(text, /shift the complete outfit palette|secondary garment color|white (?:hot pants|bodycon mini skirt)/i);
    assert.match(p.grokPrompt, /shirt palette/i);
    assert.match(p.midjourneyPrompt, /black (?:hot pants|bodycon mini skirt)/i);
  }
});

test('duo primary colors stay with their own shirt and both bottoms remain black', () => {
  const p = generate({ subjectCount: '2', outfitPresetAId: { byZh: names[0] }, outfitPresetBId: { byZh: names[1] },
    outfitPresetAPrimaryColorId: { byZh: '紅色' }, outfitPresetBPrimaryColorId: { byZh: '白色' } });
  assert.match(p.midjourneyPrompt, /The first woman wears a red short-sleeve button-up shirt and black hot pants/);
  assert.match(p.midjourneyPrompt, /The second woman wears a white long-sleeve button-up shirt and a black bodycon mini skirt/);
  for (const text of [p.grokPrompt, p.zImagePrompt, p.nanoBananaPrompt]) {
    assert.match(text, /black hot pants/i); assert.match(text, /black bodycon mini skirt/i);
  }
});

test('crop and closed outerwear projection do not restore invisible garments or their color', () => {
  for (const name of names) {
    const chest = generate({ outfitPresetId: { byZh: name }, outfitPresetPrimaryColorId: { byZh: '紅色' }, framingId: { byZh: '胸上特寫' } });
    for (const text of [chest.grokPrompt, chest.zImagePrompt, chest.midjourneyPrompt, chest.nanoBananaPrompt,
      chest.extraPrompts.find(e => e.id === 'chest-up-portrait').text]) assert.doesNotMatch(text, /hot pants|mini skirt/i);
    assert.match(chest.midjourneyPrompt, /red (?:short|long)-sleeve button-up shirt/);
    assert.match(chest.extraPrompts.find(e => e.id === 'full-body-character').text, /black (?:hot pants|bodycon mini skirt)/);
    const closed = generate({ outfitPresetId: { byZh: name }, outfitPresetPrimaryColorId: { byZh: '紅色' },
      outerwearId: { byZh: '西裝外套' }, outerwearOpeningId: FULLY_CLOSED_OPENING_ID,
      completeLookPaletteId: { byZh: '奶油米白' } });
    for (const text of texts(closed)) assert.doesNotMatch(text, /button-up shirt|shirt fabric|shirt palette|\bred /i);
    assert.match(closed.midjourneyPrompt, /black (?:hot pants|bodycon mini skirt)/);
    assert.equal(closed.selection.outfitPresetPrimaryColorId, option('outfitPresetPrimaryColorId', '紅色').id);
  }
});

test('old English imports and Saved Cards retain the same preset IDs and color selections', () => {
  for (const [index, name] of names.entries()) {
    assert.equal(parseLocksFromStandardPrompt(`Wardrobe:\nShe wears ${legacy[index].en}.`, controls).locks.outfitPresetId,
      option('outfitPresetId', name).id);
    const p = generate({ outfitPresetId: { byZh: name }, outfitPresetPrimaryColorId: { byZh: '紅色' } });
    const restored = deserializeFavoritePrompt(serializeFavoritePrompt(p));
    const locks = buildRestoreLocks(restored.selection, controls);
    assert.equal(locks.outfitPresetId, p.selection.outfitPresetId);
    assert.equal(locks.outfitPresetPrimaryColorId, p.selection.outfitPresetPrimaryColorId);
    assert.equal(generate(locks).midjourneyPrompt, p.midjourneyPrompt);
  }
});

test('all color swatches and seeded random colors preserve the fixed lower garment', () => {
  const colors = controls.find(c => c.key === 'outfitPresetPrimaryColorId').options.filter(o => o.id !== 'random');
  for (const name of names) for (const color of colors) {
    const prompt = generate({ outfitPresetId: { byZh: name }, outfitPresetPrimaryColorId: color.id });
    for (const text of [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt, prompt.nanoBananaPrompt]) {
      assert.match(text, /black (?:hot pants|bodycon mini skirt)/i, `${name}/${color.zh}`);
      assert.doesNotMatch(text, /main outfit color|controlled by/i);
    }
  }
  for (const name of names) for (let i = 0; i < 12; i++) {
    const prompt = generate({ outfitPresetId: { byZh: name }, outfitPresetPrimaryColorId: '' }, `shirt-random-${i}`);
    assert.match(prompt.midjourneyPrompt, /black (?:hot pants|bodycon mini skirt)/i);
  }
});

test('fixed composition retains the shirt exception with its original geometry and MJ tail', () => {
  for (const name of names) {
    const values = { outfitPresetId: { byZh: name }, outfitPresetPrimaryColorId: { byZh: '紅色' },
      fixedCompositionSetId: { byZh: '清水模牆面沙發棚' } };
    const prompt = generate(values);
    assert.match(prompt.midjourneyPrompt, /red (?:short|long)-sleeve button-up shirt/);
    assert.match(prompt.midjourneyPrompt, /black (?:hot pants|bodycon mini skirt)/);
    const white = generate({ ...values, outfitPresetPrimaryColorId: { byZh: '白色' } });
    assert.equal(prompt.midjourneyPrompt.replace('red ', 'white '), white.midjourneyPrompt);
  }
});

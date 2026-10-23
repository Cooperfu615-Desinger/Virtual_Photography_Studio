import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';

// Wardrobe order v1 (Cooper 2026-10-23, Docs/specs/wardrobe-modifier-order-v1.md): a garment's name
// leads and its fit, rise and styling follow; "layered over" names the garment, not its fit.
const controls = getLockControls();
const option = (key, zh) => controls.find(c => c.key === key).options.find(o => o.zh === zh).id;
const FULL = option('framingId', '全身鏡頭 (Full Body Shot)');
const generate = (locks, seed = 'wardrobe-order') => generatePrompts(1, {
  ...createEmptyLocks(), subjectCount: '1', framingId: FULL, ...locks,
}, [], { random: createSeededRandom(seed) })[0];
const wardrobe = prompt => prompt.grokPrompt.match(/Wardrobe:\n([\s\S]*?)(?:\n\n|$)/)[1];

test('outerwear over a fitted top: "layered over" names the top, then its fit follows', () => {
  const prompt = generate({
    topId: option('topId', '襯衫'), topFitId: option('topFitId', '緊身'),
    outerwearId: option('outerwearId', '丹寧外套'),
  });
  // The chest crop writes the shirt as its own sentence instead of a "layered over" clause.
  for (const text of [wardrobe(prompt), prompt.zImagePrompt]) assert.match(text, /layered over [^,]*shirt/, 'the layered-over clause names the shirt');
  for (const text of [wardrobe(prompt), prompt.zImagePrompt, prompt.extraPrompts.find(e => e.id === 'chest-up-portrait').text]) {
    assert.doesNotMatch(text, /layered over tight body-skimming upper-body fit/, 'never layered over a fit');
    assert.ok(text.search(/shirt/i) < text.indexOf('tight body-skimming upper-body fit'));
  }
});

test('the unbuttoned waistband wording no longer says pants, so it fits shorts and skirts', () => {
  const rise = controls.find(c => c.key === 'bottomRiseId').options.find(o => o.id === 'unbuttoned-slightly-unzipped');
  assert.ok(rise);
  assert.doesNotMatch(rise.en, /pants/i);
  assert.match(rise.en, /^waist button undone and front zipper slightly lowered/);
});

test('double-shoulder outerwear states where the jacket sits, without "uncovered" shoulders', () => {
  const prompt = generate({ outerwearId: option('outerwearId', '丹寧外套'), outerwearStylingId: option('outerwearStylingId', '雙肩露出') });
  for (const text of [wardrobe(prompt), prompt.zImagePrompt]) {
    assert.match(text, /slid down off both shoulders and hanging around both upper arms, both arms still in the sleeves/);
    assert.doesNotMatch(text, /fully uncovered|halfway taken off/);
  }
});

test('selections and the set of descriptive clauses do not change with the order', () => {
  const base = { topId: option('topId', '襯衫'), topFitId: option('topFitId', '緊身'), topStylingId: option('topStylingId', '下擺打結'),
    pantsId: option('pantsId', '直筒牛仔褲'), bottomRiseId: option('bottomRiseId', '低腰'), bottomFitId: option('bottomFitId', '寬版') };
  const text = wardrobe(generate(base));
  for (const clause of ['tight body-skimming upper-body fit', 'front hem tied into a compact knot below the waist',
    'low-rise waistband sitting on the hips', 'wide-leg volume with a broad lower-body opening']) {
    assert.ok(text.includes(clause), clause);
  }
});

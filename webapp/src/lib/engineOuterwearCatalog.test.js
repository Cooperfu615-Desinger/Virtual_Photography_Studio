import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls, normalizeLocks } from './engine.js';
import { deserializeFavoritePrompt, parseLocksFromStandardPrompt, serializeFavoritePrompt } from '../features/saved-cards/cardCodec.js';

const controls = getLockControls();
const option = (key, zh) => {
  const item = controls.find(c => c.key === key)?.options.find(o => o.zh === zh);
  assert.ok(item, `${key}/${zh}`);
  return item;
};
function locksFor(values = {}) {
  const locks = { ...createEmptyLocks(), subjectCount: '1' };
  for (const control of controls) {
    const none = control.options?.find(o => ['全無', '無額外表情'].includes(o.zh));
    if (none) locks[control.key] = none.id;
  }
  for (const [key, zh] of Object.entries({ topId: '短袖上衣', pantsId: '直筒牛仔褲', framingId: '全身鏡頭 (Full Body Shot)', ...values })) locks[key] = option(key, zh).id;
  return locks;
}
const generate = locks => generatePrompts(1, locks, [], { random: createSeededRandom('outerwear-catalog-v1') })[0];
const outputs = r => [r.grokPrompt, r.zImagePrompt, r.midjourneyPrompt, ...r.extraPrompts.map(e => e.text)];
const doubleShoulder = 'halfway taken off, hanging around both upper arms with both shoulders fully uncovered and both arms still in the sleeves';

test('18 active coats and four restore-only coats retain historical IDs', () => {
  const items = controls.find(c => c.key === 'outerwearId').options.filter(o => o.zh !== '全無');
  assert.equal(items.filter(o => !o.meta?.outerwear?.retired).length, 18);
  assert.equal(items.filter(o => o.meta?.outerwear?.retired).length, 4);
  for (const [name, id] of [
    ['龐克風皮衣', 'wardrobe:外套-outerwear:龐克皮衣:3'],
    ['騎士風皮衣', 'wardrobe:外套-outerwear:短版皮外套:7'],
    ['毛呢大衣', 'wardrobe:外套-outerwear:長版外套:15'],
  ]) assert.equal(option('outerwearId', name).id, id);
});

test('all six outputs retain D wear, opening and surface without redundant structure', () => {
  for (const framing of ['全身鏡頭 (Full Body Shot)', '中景鏡頭 (Medium Shot)', '半臉傾斜特寫']) {
    const r = generate(locksFor({ framingId: framing, outerwearId: '西裝外套', outerwearFitId: 'Oversize', outerwearColorId: '白色', outerwearPatternId: '胸前卡通塗鴉印花', outerwearOpeningId: '敞開穿', outerwearStylingId: '雙肩露出' }));
    for (const text of outputs(r)) {
      assert.ok(text.includes(doubleShoulder), text);
      assert.match(text, /worn open at the front/);
      assert.match(text, /blazer in suiting fabric/);
      assert.doesNotMatch(text, /oversized oversized|clean shoulder line|defined lapels|neckline resting below/);
    }
    // A chest graphic is not required in a face crop; both chest derivatives see it.
    for (const e of r.extraPrompts) assert.match(e.text, /large cartoon doodle graphic on the front/);
    if (framing !== '半臉傾斜特寫') assert.match(r.midjourneyPrompt, /large cartoon doodle graphic on the front/);
  }
});

test('opening and pattern survive MJ without a shoulder-wear selection', () => {
  const r = generate(locksFor({ outerwearId: '西裝外套', outerwearPatternId: '粗橫條紋', outerwearOpeningId: '敞開穿' }));
  for (const text of outputs(r)) {
    assert.match(text, /worn open at the front/);
    assert.match(text, /bold horizontal stripes/);
  }
});

test('explicit fit replaces only corresponding defaults and preserves legacy cropped meaning', () => {
  for (const [coat, fit, includes, excludes] of [
    ['寬鬆西裝外套', 'Oversize', 'oversized blazer', /oversized oversized/],
    ['短版合身西裝外套', '長版 Oversize', 'hip-length oversized blazer', /cropped fitted|waist-defining|short tailored/],
    ['毛呢大衣', '合身', 'fitted long wool coat', /hip-length/],
    ['毛呢大衣', '長版合身', 'hip-length fitted wool coat', /long wool coat|below-knee/],
    ['短版合身西裝外套', '全無', 'cropped fitted blazer', /underbust/],
  ]) {
    const r = generate(locksFor({ outerwearId: coat, outerwearFitId: fit }));
    for (const text of [r.grokPrompt, r.zImagePrompt, r.midjourneyPrompt, r.extraPrompts.find(e => e.id === 'full-body-character').text]) {
      assert.ok(text.includes(includes), text);
      assert.doesNotMatch(text, excludes);
    }
  }
});

test('retired pieces restore through snapshots and old prose but are never randomly sampled', () => {
  for (const name of ['寬鬆西裝外套', '合身西裝外套', '短版合身西裝外套', '短版粗花呢外套']) {
    const locks = locksFor({ outerwearId: name });
    const result = generate(locks);
    const restored = deserializeFavoritePrompt(serializeFavoritePrompt(result));
    assert.equal(normalizeLocks(restored.selection).outerwearId, locks.outerwearId);
    assert.equal(restored.grokPrompt, result.grokPrompt);
    const item = option('outerwearId', name);
    assert.equal(parseLocksFromStandardPrompt(item.en, controls).locks.outerwearId, item.id);
  }
  const retired = new Set(controls.find(c => c.key === 'outerwearId').options.filter(o => o.meta?.outerwear?.retired).map(o => o.id));
  for (let i = 0; i < 80; i++) {
    const result = generatePrompts(1, { ...locksFor(), outerwearId: '' }, [], { random: createSeededRandom(`outerwear-random-${i}`) })[0];
    assert.ok(!retired.has(result.selection.outerwearId));
  }
});

test('duo keeps fit and wear bound to the selected person', () => {
  const locks = { ...locksFor({ outerwearAId: '毛呢大衣', outerwearAFitId: '長版合身', outerwearAStylingId: '雙肩露出', outerwearBId: '寬鬆西裝外套', outerwearBFitId: '短版緊身' }), subjectCount: '2' };
  const r = generate(locks);
  for (const text of [r.grokPrompt, r.zImagePrompt, r.midjourneyPrompt]) {
    assert.match(text, /hip-length fitted wool coat/);
    assert.match(text, /underbust-cropped tight body-skimming blazer/);
    assert.equal(text.split(doubleShoulder).length - 1, 1);
  }
});

test('resolved fit prose restores its garment without borrowing the inner garment fit', () => {
  for (const [coat, fit] of [['毛呢大衣', '短版緊身'], ['長版襯衫', 'Oversize'], ['西裝外套', '長版合身']]) {
    const locks = locksFor({ outerwearId: coat, outerwearFitId: fit });
    const result = generate(locks);
    const restored = parseLocksFromStandardPrompt(result.grokPrompt, controls).locks;
    assert.equal(restored.outerwearId, locks.outerwearId);
    assert.equal(restored.outerwearFitId, locks.outerwearFitId);
  }
  const result = generate(locksFor({ outerwearId: '西裝外套', topFitId: '緊身' }));
  const restored = parseLocksFromStandardPrompt(result.grokPrompt, controls).locks;
  assert.equal(restored.outerwearId, option('outerwearId', '西裝外套').id);
  assert.ok(!restored.outerwearFitId || restored.outerwearFitId === option('outerwearFitId', '全無').id);
});

test('varsity color belongs to body panels and renamed sources keep old prompt aliases', () => {
  const result = generate(locksFor({ outerwearId: '棒球外套', outerwearColorId: '白色' }));
  for (const text of outputs(result)) {
    assert.match(text, /varsity jacket with contrasting sleeves and snap buttons, body panels in white/);
  }
  for (const name of ['龐克風皮衣', '騎士風皮衣', '毛呢大衣']) {
    const item = option('outerwearId', name);
    for (const source of item.meta.legacyPromptAliases) {
      assert.equal(parseLocksFromStandardPrompt(source, controls).locks.outerwearId, item.id);
    }
  }
});

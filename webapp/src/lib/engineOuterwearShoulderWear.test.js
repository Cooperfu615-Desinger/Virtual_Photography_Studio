import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls, normalizeLocks } from './engine.js';
import { parseLocksFromStandardPrompt, serializeFavoritePrompt, deserializeFavoritePrompt } from '../features/saved-cards/cardCodec.js';

const controls = getLockControls();
const option = (key, zh) => {
  const value = controls.find((entry) => entry.key === key)?.options?.find((entry) => entry.zh === zh);
  assert.ok(value, `${key}: ${zh}`);
  return value;
};
const noneLocks = () => {
  const locks = createEmptyLocks();
  for (const control of controls) {
    const none = control.options?.find((entry) => ['全無', '無額外表情'].includes(entry.zh));
    if (none) locks[control.key] = none.id;
  }
  return locks;
};
const styles = [
  ['單肩露出', 'slipped down over one upper arm, with the neckline lowered on that side and the opposite shoulder still covered'],
  ['雙肩露出', 'slipped down around both upper arms, with the neckline resting below both shoulders and both arms still in the sleeves'],
];

test('button-up longline shirt can randomly resolve a half-buttoned opening, never a zipper', () => {
  const seen = new Set();
  const locks = { ...noneLocks(), subjectCount: '1',
    outerwearId: option('outerwearId', '長版襯衫').id,
    outerwearOpeningId: null,
  };
  for (let index = 0; index < 200; index += 1) {
    const result = generatePrompts(1, locks, [], { random: createSeededRandom(`shirt-open-${index}`) })[0];
    seen.add(result.selection.outerwearOpeningId);
    if (result.selection.outerwearOpeningId === option('outerwearOpeningId', '扣子扣一半').id) {
      for (const output of [result.grokPrompt, result.zImagePrompt]) {
        assert.match(output, /button-front outerwear partially buttoned/);
      }
    }
  }
  assert.ok(seen.has(option('outerwearOpeningId', '扣子扣一半').id));
  assert.ok(!seen.has(option('outerwearOpeningId', '拉鏈拉一半').id));
});

test('outerwear shirt keeps its identity without changing the top shirt or option IDs', () => {
  assert.equal(option('outerwearId', '長版襯衫').en, 'longline button-up shirt in cotton poplin, pointed collar, long sleeves with buttoned cuffs, curved shirttail hem');
  assert.match(option('topId', '長版襯衫').en, /tailored longline men's dress shirt, crisp woven poplin/);
  for (const [zh, text] of styles) {
    const item = option('outerwearStylingId', zh);
    assert.equal(item.en, text);
    assert.equal(normalizeLocks({ ...noneLocks(), outerwearStylingId: item.id }).outerwearStylingId, item.id);
    assert.doesNotMatch(item.en, /jacket|outerwear|rear|three-quarter/);
  }
});

test('all six outputs retain shoulder wear independently of shirt hem, crop and main wardrobe family', () => {
  for (const [zh, text] of styles) {
    for (const framing of ['全身鏡頭 (Full Body Shot)', '中景鏡頭 (Medium Shot)', '半臉傾斜特寫']) {
      for (const family of [{ topId: option('topId', '棉質細肩背心').id }, { outfitPresetId: option('outfitPresetId', '套裝：鏈條緞面內衣').id }]) {
        const locks = { ...noneLocks(), subjectCount: '1', ...family,
          framingId: option('framingId', framing).id,
          outerwearId: option('outerwearId', '長版襯衫').id,
          outerwearFitId: option('outerwearFitId', '合身').id,
          outerwearColorId: option('outerwearColorId', '白色').id,
          outerwearOpeningId: option('outerwearOpeningId', '敞開穿').id,
          outerwearStylingId: option('outerwearStylingId', zh).id,
        };
        const result = generatePrompts(1, locks, [], { random: createSeededRandom('shoulder-wear-regression') })[0];
        const outputs = [result.grokPrompt, result.zImagePrompt, result.midjourneyPrompt, ...result.extraPrompts.map((entry) => entry.text)];
        assert.equal(outputs.length, 6);
        for (const output of outputs) {
          assert.ok(output.includes(text), `${framing}/${zh}: ${output}`);
          assert.match(output, /white longline button-up shirt/);
          assert.match(output, /worn open at the front/);
          assert.doesNotMatch(output, /tailored longline men's dress shirt|jacket draped|standard outer-layer position/);
        }
        assert.equal(result.selection.outerwearStylingId, locks.outerwearStylingId);
        assert.equal(result.selection.outerwearOpeningId, locks.outerwearOpeningId);
      }
    }
  }
});

test('shoulder wear does not force the independent opening control to open', () => {
  for (const [zh, text] of styles) {
    const locks = { ...noneLocks(), subjectCount: '1',
      outerwearId: option('outerwearId', '長版襯衫').id,
      outerwearOpeningId: option('outerwearOpeningId', '扣子扣一半').id,
      outerwearStylingId: option('outerwearStylingId', zh).id,
    };
    const result = generatePrompts(1, locks, [], { random: createSeededRandom('shoulder-opening-independent') })[0];
    assert.equal(result.selection.outerwearOpeningId, locks.outerwearOpeningId);
    for (const output of [result.grokPrompt, result.zImagePrompt, result.midjourneyPrompt]) {
      assert.ok(output.includes(text));
      assert.doesNotMatch(output, /worn open at the front/);
    }
  }
});

test('duo retains each role shoulder wear without assigning the other role styling', () => {
  const locks = { ...noneLocks(), subjectCount: '2' };
  for (const [index, role] of ['A', 'B'].entries()) {
    locks[`outerwear${role}Id`] = option(`outerwear${role}Id`, '長版襯衫').id;
    locks[`outerwear${role}StylingId`] = option(`outerwear${role}StylingId`, styles[index][0]).id;
  }
  const result = generatePrompts(1, locks, [], { random: createSeededRandom('duo-shoulder-wear') })[0];
  for (const output of [result.grokPrompt, result.zImagePrompt, result.midjourneyPrompt]) {
    assert.ok(output.includes(styles[0][1]));
    assert.ok(output.includes(styles[1][1]));
    assert.ok(output.indexOf(styles[0][1]) < output.indexOf(styles[1][1]));
    assert.equal(output.split(styles[0][1]).length - 1, 1);
    assert.equal(output.split(styles[1][1]).length - 1, 1);
  }
});

test('current and legacy wear phrases backfill and Saved Cards preserve the resolved selection', () => {
  for (const [key, zh] of [
    ['outerwearId', '長版襯衫'], ['outerwearOpeningId', '敞開穿'],
    ['outerwearStylingId', '單肩露出'], ['outerwearStylingId', '雙肩露出'],
  ]) {
    const item = option(key, zh);
    assert.ok(item.meta?.legacyPromptAliases?.length);
    for (const text of [item.en, ...item.meta.legacyPromptAliases]) {
      assert.equal(parseLocksFromStandardPrompt(text, controls).locks[key], item.id);
    }
  }
  const result = generatePrompts(1, { ...noneLocks(), subjectCount: '1',
    outerwearId: option('outerwearId', '長版襯衫').id,
    outerwearStylingId: option('outerwearStylingId', '雙肩露出').id,
  }, [], { random: createSeededRandom('shoulder-card-roundtrip') })[0];
  const restored = deserializeFavoritePrompt(serializeFavoritePrompt(result));
  assert.equal(restored.selection.outerwearStylingId, result.selection.outerwearStylingId);
  assert.equal(restored.zImagePrompt, result.zImagePrompt);
});

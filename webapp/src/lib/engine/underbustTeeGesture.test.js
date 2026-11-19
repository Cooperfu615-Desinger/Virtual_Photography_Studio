import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls, normalizeLocks } from '../engine.js';
import { buildMarkdownExport, buildRestoreLocks, parseExportedMarkdownPrompt } from '../../features/saved-cards/cardCodec.js';
import { withGrokImagineForSave } from '../grokImagineResult.js';
import { buildPage1GenerationPromptCards } from '../page1PromptOutputs.js';
import { getReferencePersonPreview } from '../referencePersonPreview.js';
import { seatFixture } from './indoorSeatFixtures.js';

const controls = getLockControls();
const option = (key, label) => controls.find(control => control.key === key).options.find(item => item.zh === label).id;
const gestureId = 'gesture-legacy-lift-top-underbust';
const topId = option('topId', '一字領上衣');
const medium = '中景鏡頭 (Medium Shot)';
const sentence = 'She lifts the front hem of her short-sleeved T-shirt with both hands, revealing the lower edge of her bust.';
const run = (overrides = {}, frame = medium) => seatFixture('室內：日本學校教室', '單腳重心', option('framingId', frame), {
  topId, topColorId: 'black', topFitId: 'tight', topStylingId: 'hem-overlap',
  pantsId: option('pantsId', '真理褲'), bottomRiseId: 'ultra-low-rise', gestureId, ...overrides,
});
const main = cards => cards.filter(card => !['chest-up-portrait', 'full-body-character'].includes(card.id));

test('the fixed shirt and hand action are one sentence, independent of a selected C-section top', () => {
  for (const currentTop of [topId, option('topId', '全無')]) {
    const { prompt, cards } = run({ topId: currentTop });
    for (const { id, value } of main(cards)) {
      assert.ok(value.includes(sentence), id);
      assert.equal((value.match(/short-sleeved T-shirt/gi) || []).length, 1, id);
      assert.doesNotMatch(value, /off-shoulder top|top length meets|hem overlaps the low-rise waistband|black short-sleeved/i, id);
    }
    assert.equal(prompt.selection.topId, currentTop);
  }
});

test('the close crop has a simple T-shirt with no hidden hand action; the full reference keeps the chosen top', () => {
  const { cards } = run({}, '頭部主導近景');
  for (const { id, value } of cards) {
    if (id === 'grok-imagine') {
      assert.ok(value.includes(sentence), id);
    } else if (id === 'full-body-character') {
      assert.match(value, /off-shoulder top/i, id);
    } else {
      assert.match(value, /short-sleeved T-shirt/i, id);
      assert.doesNotMatch(value, /revealing the lower edge|off-shoulder top|black short-sleeved/i, id);
    }
  }
});

test('switching off the gesture after Markdown restore returns the original selection and output', () => {
  const { prompt } = run();
  const saved = withGrokImagineForSave({ ...prompt, source: 'page1' });
  const restored = normalizeLocks(buildRestoreLocks(parseExportedMarkdownPrompt(buildMarkdownExport(saved), controls).selection, controls), controls);
  for (const key of ['topId', 'topColorId', 'topFitId', 'topStylingId', 'gestureId']) assert.equal(restored[key], prompt.selection[key], key);
  const ordinary = run({ gestureId: 'none' });
  assert.deepEqual(run({ ...restored, gestureId: 'none' }).cards, ordinary.cards);
  assert.match(ordinary.prompt.grokPrompt, /off-shoulder top/i);
});

test('reference-image prompts use the attached clothing and phone selfies pause the gesture', () => {
  const { prompt } = run();
  for (const { id, value } of main(buildPage1GenerationPromptCards(getReferencePersonPreview(prompt)))) {
    assert.doesNotMatch(value, /short-sleeved T-shirt/i, id);
    assert.match(value, /lifting the front hem of her top/i, id);
  }
  const selfie = run({ propId: 'selfie-natural-right-arm' });
  const phoneOnly = run({ propId: 'selfie-natural-right-arm', gestureId: 'none' });
  assert.deepEqual(selfie.cards, phoneOnly.cards);
});

test('only an explicitly selected complete outfit can take precedence; unlocked wardrobe uses separates', () => {
  const locks = { ...createEmptyLocks(), subjectCount: '1', specifiedActionId: 'specified-standing-one-leg-weight',
    framingId: option('framingId', medium), gestureId };
  for (let i = 0; i < 10; i++) {
    const [prompt] = generatePrompts(1, locks, [], { random: createSeededRandom('nov19-tee-empty-locks-' + i) });
    assert.match(prompt.grokPrompt, /front hem of her short-sleeved T-shirt/, String(i));
    assert.ok(!prompt.structured.Wardrobe.some(item => /套裝-outfit-presets|連身-dresses|特殊穿搭-special-outfits/.test(item.id)), String(i));
    assert.doesNotMatch(prompt.grokPrompt, /fully (?:zipped|buttoned|fastened) (?:up|closed)/i, String(i));
  }
  const dressId = controls.find(c => c.key === 'dressId').options.find(item => item.en && item.zh !== '全無' && item.id !== 'random').id;
  assert.deepEqual(run({ dressId }).cards, run({ dressId, gestureId: 'none' }).cards);
});

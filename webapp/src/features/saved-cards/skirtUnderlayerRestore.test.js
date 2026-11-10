import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSeededRandom, generatePrompts, getLockControls, normalizeLocks } from '../../lib/engine.js';
import { seatFixture, seatFramings } from '../../lib/engine/indoorSeatFixtures.js';
import { withGrokImagineForSave } from '../../lib/grokImagineResult.js';
import { buildPage1DisplayOutputs } from '../../lib/page1PromptOutputs.js';
import {
  buildMarkdownExport,
  buildRestoreLocks,
  deserializeFavoritePrompt,
  parseExportedMarkdownPrompt,
  serializeFavoritePrompt,
} from './cardCodec.js';
import { createSavedCardsArchive, parseSavedCardsArchive } from './savedCardArchive.js';

const controls = getLockControls();
const full = seatFramings.find(id => id.includes('full-body-shot'));
const skirts = controls.find(control => control.key === 'skirtId').options.filter(option => option.zh !== '全無');
const option = (key, name) => controls.find(control => control.key === key).options.find(item => item.zh === name).id;
const innerNames = ['比基尼下身', '蕾絲丁字褲', '棉質低腰三角褲', '窄前片細繩蕾絲丁字褲', '窄前片細繩比基尼下身'];
const innerIds = ['none', ...innerNames.map(name => option('pantsId', name))];
const liftGesture = 'gesture-lift-skirt-both';
const settings = {
  low: { bottomRiseId:'ultra-low-rise', gestureId:'none' },
  lift: { bottomRiseId:'high-rise', gestureId:liftGesture },
  both: { bottomRiseId:'ultra-low-rise', gestureId:liftGesture },
};

function run(skirt, values = {}) {
  return seatFixture('室內：精品飯店房間', '自然坐姿', full, {
    topId:option('topId', '落肩 T 恤'),
    skirtId:skirt.id,
    ...values,
  });
}

function display(card) {
  const result = buildPage1DisplayOutputs(card);
  assert.equal(result.cards.length, 7);
  assert.deepEqual(result.dllSources.map(output => output.value), result.cards.map(output => output.value));
  return result.cards.map(output => output.value);
}

function save(prompt, id) {
  return withGrokImagineForSave({ ...prompt, id, source:'page1', date:'2026-11-10T00:00:00.000Z' });
}

function assertSelection(selection, expected, label) {
  for (const key of ['skirtId', 'gestureId', 'bottomRiseId', 'bottomUnderlayerId', 'bottomUnderlayerColorId']) {
    const value = key === 'gestureId' ? selection[key] || 'none' : selection[key];
    const expectedValue = key === 'gestureId' ? expected[key] || 'none' : expected[key];
    assert.equal(value, expectedValue, label + '/' + key);
  }
}

test('31 low-rise and 30 lifted skirts preserve all five inner garments, none and colors through favorites, Markdown, ZIP and regeneration', async () => {
  assert.equal(skirts.length, 31);
  const cases = [];
  for (const [index, skirt] of skirts.entries()) {
    const modes = skirt.zh === '打摺褲裙' ? ['low'] : ['low', 'lift', 'both'];
    for (const mode of modes) {
      for (const [innerIndex, bottomUnderlayerId] of innerIds.entries()) {
        const color = innerIndex % 2 ? 'white' : 'black';
        const { prompt } = run(skirt, { ...settings[mode], bottomUnderlayerId, bottomUnderlayerColorId:color });
        const id = [index, mode, innerIndex].join('/');
        assert.equal(prompt.selection.skirtId, skirt.id, id);
        assert.equal(prompt.selection.gestureId || 'none', settings[mode].gestureId, id);
        assert.equal(prompt.selection.bottomRiseId, settings[mode].bottomRiseId, id);
        assert.equal(prompt.selection.bottomUnderlayerId, bottomUnderlayerId === 'none' ? undefined : bottomUnderlayerId, id);
        assert.equal(prompt.selection.bottomUnderlayerColorId, bottomUnderlayerId === 'none' ? undefined : color, id);
        cases.push(save(prompt, id));
      }
    }
  }
  assert.equal(cases.length, 546);
  const archive = await parseSavedCardsArchive(await createSavedCardsArchive(cases, 0, 'uint8array'), controls);
  const archived = new Map(archive.map(card => [card.id, card]));
  assert.equal(archived.size, cases.length);
  for (const card of cases) {
    const expected = display(card);
    const restoredCards = [
      deserializeFavoritePrompt(serializeFavoritePrompt(card)),
      parseExportedMarkdownPrompt(buildMarkdownExport(card), controls, card.id),
      archived.get(card.id),
    ];
    for (const restored of restoredCards) {
      assert.ok(restored, card.id);
      assert.deepEqual(display(restored), expected, card.id);
      assertSelection(restored.selection, card.selection, card.id + '/saved');
      const locks = normalizeLocks(buildRestoreLocks(restored.selection, controls), controls);
      assertSelection(locks, card.selection, card.id + '/locks');
      const [regenerated] = generatePrompts(1, locks, [], { random:createSeededRandom('skirt-underlayer-restore') });
      assert.ok(regenerated, card.id);
      assertSelection(regenerated.selection, card.selection, card.id + '/regenerated');
    }
  }
});

test('temporarily hidden skirt inner choices stay in editor state while saved results contain only effective values', () => {
  const skirt = skirts.find(item => item.zh === '百褶短裙');
  const inner = { bottomUnderlayerId:innerIds[1], bottomUnderlayerColorId:'black' };
  const active = run(skirt, { ...settings.low, ...inner });
  const inactive = normalizeLocks({ ...active.locks, bottomRiseId:'high-rise', gestureId:'none' }, controls);
  assert.equal(inactive.bottomUnderlayerId, inner.bottomUnderlayerId);
  assert.equal(inactive.bottomUnderlayerColorId, inner.bottomUnderlayerColorId);
  const hidden = run(skirt, inactive);
  const empty = run(skirt, { ...inactive, bottomUnderlayerId:'none', bottomUnderlayerColorId:'none' });
  assert.deepEqual(hidden.cards, empty.cards);
  assert.equal(hidden.prompt.selection.bottomUnderlayerId, undefined);
  assert.equal(hidden.prompt.selection.bottomUnderlayerColorId, undefined);
  const saved = save(hidden.prompt, 'hidden-skirt-layer');
  const restored = parseExportedMarkdownPrompt(buildMarkdownExport(saved), controls, saved.id);
  assert.equal(restored.selection.bottomUnderlayerId, undefined);
  assert.equal(restored.selection.bottomUnderlayerColorId, undefined);
  assert.deepEqual(display(restored), display(saved));
  const resumed = run(skirt, { ...inactive, ...settings.lift });
  assert.equal(resumed.prompt.selection.bottomUnderlayerId, inner.bottomUnderlayerId);
  assert.equal(resumed.prompt.selection.bottomUnderlayerColorId, inner.bottomUnderlayerColorId);
});

test('cards without manual skirt inner values and malformed optional IDs retain their original public outputs', () => {
  const skirt = skirts.find(item => item.zh === '牛仔短裙');
  const original = save(run(skirt, settings.low).prompt, 'older-skirt-card');
  const restored = parseExportedMarkdownPrompt(buildMarkdownExport(original), controls, original.id);
  assert.equal(restored.selection.bottomUnderlayerId, undefined);
  assert.equal(restored.selection.bottomUnderlayerColorId, undefined);
  assert.deepEqual(display(restored), display(original));
  const locks = buildRestoreLocks(restored.selection, controls);
  for (const bottomUnderlayerId of ['unknown-inner-id', 42]) {
    const normalized = normalizeLocks({ ...locks, bottomUnderlayerId, bottomUnderlayerColorId:'black' }, controls);
    assert.equal(normalized.bottomUnderlayerId, undefined);
    assert.equal(normalized.bottomUnderlayerColorId, undefined);
  }
});

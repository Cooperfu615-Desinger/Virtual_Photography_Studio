import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { getLockControls, normalizeLocks } from '../engine.js';
import { seatFixture, seatFramings } from './indoorSeatFixtures.js';
import { underlayerField } from './manualUnderlayers.js';
import { GESTURE_OPTIONS } from './gazeGesture.js';

const controls = getLockControls();
const catalog = JSON.parse(readFileSync(new URL('../../../../knowledge_base/catalog/Wardrobe/裙裝-skirts.json', import.meta.url), 'utf8'));
const skirts = catalog.entries.filter(item => item.zh !== '全無');
const liftedSkirts = skirts.filter(item => item.zh !== '打摺褲裙');
const liftGesture = 'gesture-lift-skirt-both';
const options = key => controls.find(control => control.key === key).options;
const option = (key, name) => {
  const found = options(key).find(item => item.zh === name);
  assert.ok(found, key + '/' + name);
  return found.id;
};
const lowerNames = ['比基尼下身', '蕾絲丁字褲', '棉質低腰三角褲', '窄前片細繩蕾絲丁字褲', '窄前片細繩比基尼下身'];
const layers = lowerNames.map(name => options('pantsId').find(item => item.zh === name));
const frame = seatFramings.find(id => id.includes('full-body-shot'));
const base = { topId: option('topId', '落肩 T 恤'), bottomColorId: 'white' };
const run = (values, framing = frame) => seatFixture('室內：日本學校教室', '自然坐姿', framing, { ...base, ...values });
const grokImagine = result => result.cards.find(card => card.id === 'grok-imagine').value;
const occurrences = (text, fragment) => text.split(fragment).length - 1;

// The catalog is the independent inventory. Ordinary legacy skirt selections are
// protected elsewhere, while these cases exercise newly effective manual layers.
test('all 31 catalog skirts offer ultra-low-rise and all 30 skirt hems offer the manual lift gesture', () => {
  assert.equal(skirts.length, 31);
  assert.equal(liftedSkirts.length, 30);
  assert.equal(seatFramings.length, 10);
  assert.equal(layers.length, 5);
  const gesture = GESTURE_OPTIONS.find(item => item.id === liftGesture);
  assert.ok(gesture, 'manual skirt gesture is present');
  assert.equal(gesture.zh, '雙手提起裙擺');
  assert.equal(gesture.meta.randomEligible, false);
  for (const skirt of skirts) {
    assert.ok(options('skirtId').some(item => item.id === skirt.id), skirt.zh);
    const { locks } = run({ skirtId: skirt.id, bottomRiseId: 'ultra-low-rise' });
    const waist = underlayerField(locks, controls, 'bottomRiseId');
    assert.equal(waist?.host?.id, skirt.id, skirt.zh + '/waist host');
    assert.equal(waist?.itemKey, 'bottomUnderlayerId');
    assert.deepEqual(waist.items.map(item => item.id), layers.map(item => item.id));
    const lifted = underlayerField({ ...locks, bottomRiseId: 'high-rise', gestureId: liftGesture }, controls, 'gestureId');
    if (skirt.zh === '打摺褲裙') assert.equal(lifted, null);
    else {
      assert.equal(lifted?.host?.id, skirt.id, skirt.zh + '/lift host');
      assert.equal(lifted?.itemKey, 'bottomUnderlayerId');
      assert.deepEqual(lifted.items.map(item => item.id), layers.map(item => item.id));
    }
  }
});

for (const [mode, items, values, expectedCases] of [
  ['ultra-low-rise', skirts, { bottomRiseId: 'ultra-low-rise', gestureId: 'none' }, 1860],
  ['lifted hem', liftedSkirts, { bottomRiseId: 'high-rise', gestureId: liftGesture }, 1800],
]) {
  test(mode + ': all skirts, five inner bottoms, none and ten framings keep the same resolved sources', () => {
    let cases = 0;
    for (const skirt of items) {
      for (const framing of seatFramings) {
        const settings = { ...values, skirtId: skirt.id };
        const empty = run(settings, framing);
        assert.equal(empty.prompt.selection.bottomUnderlayerId, undefined);
        assert.equal(empty.cards.length, 7);
        assert.equal(empty.prompt.selection.skirtId, skirt.id);
        if (mode === 'lifted hem') {
          assert.equal(empty.prompt.selection.gestureId, liftGesture, skirt.zh + '/' + framing);
          assert.match(grokImagine(empty), /both hands/i);
        }
        cases++;
        for (const inner of layers) {
          const result = run({ ...settings, bottomUnderlayerId: inner.id, bottomUnderlayerColorId: 'black' }, framing);
          const label = skirt.zh + '/' + inner.zh + '/' + framing;
          assert.equal(result.draws, empty.draws, label + '/RNG');
          assert.deepEqual(result.prompt.selection, {
            ...empty.prompt.selection, bottomUnderlayerId: inner.id, bottomUnderlayerColorId: 'black',
          }, label + '/resolved selections');
          assert.equal(result.cards.length, 7);
          assert.deepEqual(result.cards.map(card => card.id), empty.cards.map(card => card.id));
          const host = result.prompt.structured.Wardrobe.find(item => item.id === skirt.id);
          assert.equal(host?.en, skirt.en, label + '/original skirt source');
          assert.equal(host?.meta?.underlayer?.item?.id, inner.id, label + '/inner belongs to skirt');
          assert.equal(host.meta.underlayer.color?.id, 'black', label + '/independent inner color');
          assert.equal(result.prompt.structured.Wardrobe.filter(item => item.meta?.underlayer?.item?.id === inner.id).length, 1);
          assert.equal(result.prompt.structured.Wardrobe.some(item => item.id === inner.id), false);
          for (const key of ['Style', 'Location', 'Framing', 'Lighting', 'Lens & Imaging']) {
            assert.deepEqual(result.prompt.structured[key], empty.prompt.structured[key], label + '/' + key);
          }
          const text = grokImagine(result);
          assert.ok(text.includes(skirt.en.split(',')[0]), label + '/uncropped skirt');
          assert.ok(text.includes(inner.en.split(',')[0]), label + '/uncropped inner');
          assert.equal(occurrences(text, inner.en), 1, label + '/single inner description');
          if (mode === 'ultra-low-rise') assert.match(text, /visible above.*waistband/i, label);
          else assert.match(text, /fully visible/i, label);
          cases++;
        }
      }
    }
    assert.equal(cases, expectedCases);
  });
}

test('both triggers share one inner bottom; low waist text does not override the lifted hem relation', () => {
  for (const skirt of liftedSkirts) {
    const inner = layers[skirts.indexOf(skirt) % layers.length];
    const result = run({ skirtId: skirt.id, bottomRiseId: 'ultra-low-rise', gestureId: liftGesture,
      bottomUnderlayerId: inner.id, bottomUnderlayerColorId: 'black' });
    const text = grokImagine(result);
    assert.equal(result.prompt.selection.bottomUnderlayerId, inner.id, skirt.zh);
    assert.equal(occurrences(text, inner.en), 1, skirt.zh);
    assert.match(text, /fully visible/i);
    assert.doesNotMatch(text, /visible above the outer waistband/i);
  }
});

test('Lolita lifting moves the existing petticoat with the outer skirt; tight and long hems keep their original materials', () => {
  for (const name of ['蘿莉塔鐘形澎裙', '鉛筆裙', '皮革迷你裙', '水手服長裙', '波西米亞風長裙']) {
    const skirt = skirts.find(item => item.zh === name);
    const result = run({ skirtId: skirt.id, gestureId: liftGesture, bottomRiseId: 'mid-rise',
      bottomUnderlayerId: layers[2].id, bottomUnderlayerColorId: 'black' });
    const text = grokImagine(result);
    assert.ok(text.includes(skirt.en.split(',')[0]), name);
    assert.match(text, /both hands/i);
    if (name === '蘿莉塔鐘形澎裙') {
      assert.match(text, /petticoat underneath/i);
      assert.match(text, /(?:petticoat[\s\S]{0,120}(?:lift|rais|gather|together)|(?:lift|rais|gather)[\s\S]{0,120}petticoat)/i);
    }
  }
});

test('normal waist and ineffective skirt gestures retain dormant inner choices without adding public inner content', () => {
  const skirt = skirts[0];
  for (const bottomRiseId of ['high-rise', 'mid-rise', 'low-rise', 'random', 'unbuttoned-slightly-unzipped', 'lowered-to-thighs']) {
    const settings = { skirtId: skirt.id, bottomRiseId, gestureId: 'none' };
    const before = run(settings);
    const after = run({ ...settings, bottomUnderlayerId: layers[0].id, bottomUnderlayerColorId: 'black' });
    assert.deepEqual(after.cards, before.cards, bottomRiseId);
    assert.equal(after.prompt.selection.bottomUnderlayerId, undefined, bottomRiseId);
    assert.equal(underlayerField(after.locks, controls, 'bottomRiseId'), null);
    const locks = normalizeLocks({ ...after.locks, bottomUnderlayerId: layers[0].id, bottomUnderlayerColorId: 'black' }, controls);
    assert.equal(locks.bottomUnderlayerId, layers[0].id);
    assert.equal(locks.bottomUnderlayerColorId, 'black');
  }
  const culotte = skirts.find(item => item.zh === '打摺褲裙');
  for (const patch of [
    { skirtId: culotte.id },
    { skirtId: option('skirtId', '全無'), pantsId: option('pantsId', '工裝長褲') },
    { skirtId: 'random' },
    { specifiedActionId: 'specified-kneeling-all-fours-palms' },
  ]) {
    const settings = { skirtId: skirt.id, bottomRiseId: 'high-rise', gestureId: liftGesture, ...patch };
    const before = run(settings);
    const after = run({ ...settings, bottomUnderlayerId: layers[0].id, bottomUnderlayerColorId: 'black' });
    assert.deepEqual(after.cards, before.cards, JSON.stringify(patch));
    assert.equal(after.prompt.selection.bottomUnderlayerId, undefined);
    assert.equal(underlayerField(after.locks, controls, 'gestureId'), null, JSON.stringify(patch));
    assert.doesNotMatch(grokImagine(after), /both hands[^.]*skirt/i, JSON.stringify(patch));
  }
});

test('ordinary-single owner exclusions hide the skirt layer field', () => {
  const settings = run({ skirtId: skirts[0].id, bottomRiseId: 'high-rise', gestureId: liftGesture }).locks;
  const activeOwner = key => options(key).find(item => item.en && item.zh !== '全無' && item.id !== 'random')?.id;
  for (const patch of [
    { subjectCount: '2' }, { captureMode: 'observation' },
    { characterProfileId: activeOwner('characterProfileId') },
    { specialSubjectId: activeOwner('specialSubjectId') },
    { fixedCompositionSetId: 'japan-carriage-bench-front' },
    { dressId: activeOwner('dressId') }, { outfitPresetId: activeOwner('outfitPresetId') },
    { specialOutfitId: activeOwner('specialOutfitId') },
  ]) {
    assert.equal(underlayerField({ ...settings, ...patch }, controls, 'gestureId'), null, JSON.stringify(patch));
  }
});


test('phone hand takeover pauses lifting while ultra-low-rise can still expose the selected inner edge', () => {
  for (const propId of ['selfie-natural-right-arm', 'selfie-mirror-phone-visible']) {
    const settings = { skirtId: skirts[0].id, gestureId: liftGesture, propId };
    const before = run({ ...settings, bottomRiseId: 'high-rise' });
    const paused = run({ ...settings, bottomRiseId: 'high-rise', bottomUnderlayerId: layers[0].id,
      bottomUnderlayerColorId: 'black' });
    assert.deepEqual(paused.cards, before.cards, propId);
    assert.equal(paused.prompt.selection.bottomUnderlayerId, undefined);
    assert.doesNotMatch(grokImagine(paused), /both hands[^.]*skirt/i);
    const low = run({ ...settings, bottomRiseId: 'ultra-low-rise', bottomUnderlayerId: layers[0].id,
      bottomUnderlayerColorId: 'black' });
    assert.equal(low.prompt.selection.bottomUnderlayerId, layers[0].id, propId);
    assert.match(grokImagine(low), /visible above.*waistband/i);
    assert.doesNotMatch(grokImagine(low), /fully visible/i);
  }
});

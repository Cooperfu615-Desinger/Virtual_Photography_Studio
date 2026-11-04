import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls, normalizeLocks } from '../engine.js';
import { FIXED_FRAMING_MAIN_OPTION_POLICY } from './fixedFramingDerivedPromptContract.js';
import { buildRestoreLocks, deserializeFavoritePrompt, serializeFavoritePrompt } from '../../features/saved-cards/cardCodec.js';

const controls = getLockControls();
const option = (key, zh) => {
  const result = controls.find(c => c.key === key)?.options.find(o => o.zh === zh);
  assert.ok(result, `${key}: ${zh}`);
  return result.id;
};
function noSelections() {
  const locks = createEmptyLocks();
  for (const control of controls) {
    const none = control.options.find(item => item.zh === '全無' || item.id === 'none');
    if (none) locks[control.key] = none.id;
  }
  locks.subjectCount = '1';
  return locks;
}
const framings = FIXED_FRAMING_MAIN_OPTION_POLICY.visible.filter(item => item.randomCandidate);
const outputs = p => [p.grokPrompt, p.zImagePrompt, p.midjourneyPrompt, p.nanoBananaPrompt,
  ...p.extraPrompts.filter(p => ['chest-up-portrait', 'full-body-character'].includes(p.id)).map(p => p.text)];

test('six framings retain explicitly selected garments in all six outputs', () => {
  const locks = { ...noSelections(), topId: option('topId', '棉質細肩背心'),
    pantsId: option('pantsId', '直筒牛仔褲'), legwearId: option('legwearId', '羅紋短襪'),
    shoesId: option('shoesId', '尖頭細跟高跟鞋') };
  for (const framing of framings) {
    const [prompt] = generatePrompts(1, { ...locks, framingId: framing.id }, [], { random: createSeededRandom('framing-retain-v1') });
    assert.equal(outputs(prompt).length, 6);
    for (const output of outputs(prompt)) {
      for (const term of [/camisole/i, /jeans/i, /socks/i, /(?:stiletto|heels)/i]) assert.match(output, term, framing.zh);
    }
    for (const key of ['topId', 'pantsId', 'legwearId', 'shoesId']) assert.equal(prompt.selection[key], locks[key]);
  }
});

test('close framing retains random top and explicit head accessories', () => {
  for (const framing of framings.slice(0, 2)) {
    for (const [key, zh] of [['headAccessoryId', '棒球帽'], ['headphonesId', '耳罩式耳機（戴在頭上）'], ['faceCoveringId', '黑色口罩']]) {
      const locks = { ...noSelections(), topId: '', framingId: framing.id, [key]: option(key, zh) };
      const [prompt] = generatePrompts(1, locks, [], { random: createSeededRandom('framing-random-top-v1') });
      assert.ok(prompt.selection.topId, `${framing.zh}: random top`);
      assert.equal(prompt.selection[key], locks[key], `${framing.zh}: ${zh}`);
      assert.match(prompt.grokPrompt, /Wardrobe:/);
      assert.match(prompt.extraPrompts.find(p => p.id === 'full-body-character').text, /Wardrobe:/);
    }
  }
});

test('complete outfits and character card layers keep their lower garments at every crop', () => {
  const cases = [
    { key: 'outfitPresetId', zh: '套裝：網狀蕾絲馬甲短裙長靴', terms: [/skirt/i, /boots/i] },
    { key: 'specialOutfitId', zh: '黑色波點頭巾透紗套裝', terms: [/skirt/i, /boots/i, /bag/i] },
    { key: 'characterProfileId', zh: '06_Hinata', terms: [/jeans/i, /boots/i] },
  ];
  for (const entry of cases) for (const framing of framings) {
    const [prompt] = generatePrompts(1, { ...noSelections(), [entry.key]: option(entry.key, entry.zh), framingId: framing.id }, [],
      { random: createSeededRandom('framing-complete-look-v1') });
    for (const output of outputs(prompt)) for (const term of entry.terms) assert.match(output, term, `${entry.zh}: ${framing.zh}`);
  }
});

test('explicit none does not create a replacement upper garment', () => {
  for (const framing of framings) {
    const [prompt] = generatePrompts(1, { ...noSelections(), framingId: framing.id }, [],
      { random: createSeededRandom('framing-none-v1') });
    assert.doesNotMatch(prompt.grokPrompt, /Wardrobe:/);
    assert.doesNotMatch(prompt.extraPrompts.find(p => p.id === 'full-body-character').text, /Wardrobe:/);
  }
});

test('saved cards restore complete chosen clothes with the selected close framing', () => {
  const locks = { ...noSelections(), framingId: option('framingId', '全臉傾斜特寫'),
    topId: option('topId', '棉質細肩背心'), pantsId: option('pantsId', '直筒牛仔褲'),
    shoesId: option('shoesId', '尖頭細跟高跟鞋') };
  const [prompt] = generatePrompts(1, locks, [], { random: createSeededRandom('framing-saved-v1') });
  const restored = normalizeLocks(buildRestoreLocks(deserializeFavoritePrompt(serializeFavoritePrompt(prompt)).selection, controls));
  for (const key of ['framingId', 'topId', 'pantsId', 'shoesId']) assert.equal(restored[key], locks[key]);
  const [again] = generatePrompts(1, restored, [], { random: createSeededRandom('framing-saved-v1') });
  for (const text of outputs(again)) for (const term of [/camisole/i, /jeans/i, /(?:stiletto|heels)/i]) assert.match(text, term);
});

test('duo close framing retains the selected lower garments for both roles', () => {
  const locks = { ...noSelections(), subjectCount: '2', framingId: option('framingId', '全臉傾斜特寫'),
    topAId: option('topAId', '棉質細肩背心'), pantsAId: option('pantsAId', '直筒牛仔褲'),
    topBId: option('topBId', '短袖上衣'), pantsBId: option('pantsBId', '牛仔短褲') };
  const [prompt] = generatePrompts(1, locks, [], { random: createSeededRandom('framing-duo-v1') });
  for (const text of [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt, prompt.nanoBananaPrompt]) {
    assert.match(text, /jeans/i);
    assert.match(text, /shorts/i);
  }
  for (const key of ['topAId', 'pantsAId', 'topBId', 'pantsBId']) assert.equal(prompt.selection[key], locks[key]);
});

test('retaining cropped wardrobe does not add full-body waist coordination', () => {
  const locks = { ...noSelections(), framingId: option('framingId', '中景鏡頭 (Medium Shot)'),
    topId: option('topId', '蕾絲胸罩'), pantsId: option('pantsId', '蕾絲丁字褲') };
  const [prompt] = generatePrompts(1, locks, [], { random: createSeededRandom('minimal-wardrobe-legacy-2') });
  for (const text of [prompt.grokPrompt, prompt.extraPrompts.find(p => p.id === 'chest-up-portrait').text]) {
    assert.match(text, /lace bra top/i);
    assert.match(text, /seamless lace thong bottoms/i);
    assert.doesNotMatch(text, /top length meets or slightly overlaps the low-rise waistband/i);
  }
});

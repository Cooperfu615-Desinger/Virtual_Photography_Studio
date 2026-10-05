import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import { deserializeFavoritePrompt, serializeFavoritePrompt, parseLocksFromStandardPrompt } from '../../features/saved-cards/cardCodec.js';
import { FULLY_CLOSED_OPENING_ID, prepareOuterwearClosureControl } from './outerwearClosure.js';
import { buildWorkspaceSummary } from '../page1WorkspaceSummary.js';

const controls = getLockControls();
const option = (key, zh) => {
  const item = controls.find(c => c.key === key)?.options.find(o => o.zh === zh);
  assert.ok(item, `${key}/${zh}`);
  return item;
};
function locksFor(values = {}) {
  const locks = { ...createEmptyLocks(), subjectCount: '1' };
  for (const c of controls) {
    const none = c.options?.find(o => ['全無', '無額外表情'].includes(o.zh));
    if (none) locks[c.key] = none.id;
  }
  for (const [key, zh] of Object.entries({ framingId: '全身鏡頭 (Full Body Shot)', topId: '絲質細肩帶上衣', pantsId: '直筒牛仔褲', outerwearId: '西裝外套', outerwearStylingId: '雙肩露出', ...values })) locks[key] = option(key, zh).id;
  locks.outerwearOpeningId = FULLY_CLOSED_OPENING_ID;
  return locks;
}
const generate = locks => generatePrompts(1, locks, [], { random: createSeededRandom('outerwear-closure-v1') })[0];
const texts = result => [result.grokPrompt, result.zImagePrompt, result.midjourneyPrompt, ...result.extraPrompts.map(p => p.text)];

test('every active coat closes using authored hardware, without inventing hardware', () => {
  const coats = controls.find(c => c.key === 'outerwearId').options.filter(o => o.zh !== '全無' && !o.meta?.outerwear?.retired);
  assert.equal(coats.length, 17);
  for (const coat of coats) {
    const result = generate(locksFor({ outerwearId: coat.zh }));
    const hardware = coat.meta.outerwear.fasteners;
    for (const text of texts(result)) {
      assert.match(text, hardware.includes('zip') ? /front zipper fully zipped closed/ : hardware.includes('button') ? /all front (?:buttons|snap buttons) fastened/ : /front fully fastened closed/);
      assert.doesNotMatch(text, /halfway taken off|both shoulders fully uncovered|worn open at the front/);
      if (coat.meta.outerwear.closedInnerLayerVisibility === 'through-fabric') {
        assert.match(text, /silk camisole/);
        assert.match(text, /visible through the closed/);
      } else assert.doesNotMatch(text, /silk camisole|delicate straps|fluid sheen/);
    }
    assert.equal(result.selection.topId, option('topId', '絲質細肩帶上衣').id);
    assert.equal(result.selection.outerwearStylingId, option('outerwearStylingId', '雙肩露出').id);
    assert.equal(parseLocksFromStandardPrompt(result.grokPrompt, controls).locks.outerwearOpeningId, FULLY_CLOSED_OPENING_ID);
  }
});

test('Saved Card preserves hidden choices and reopening restores original inner top and shoulder wear', () => {
  const locks = locksFor({ topFitId: '緊身', topColorId: '紅色', topPatternId: '粗橫條紋' });
  const closed = generate(locks);
  const restored = deserializeFavoritePrompt(serializeFavoritePrompt(closed));
  assert.equal(restored.selection.topId, locks.topId);
  assert.equal(restored.selection.topColorId, locks.topColorId);
  assert.equal(restored.selection.outerwearOpeningId, FULLY_CLOSED_OPENING_ID);
  const reopened = generate({ ...restored.selection, outerwearOpeningId: option('outerwearOpeningId', '敞開穿').id });
  assert.match(reopened.grokPrompt, /silk camisole/);
  assert.match(reopened.grokPrompt, /both shoulders fully uncovered/);
  assert.doesNotMatch(closed.grokPrompt, /silk camisole|stripes across the top/);
  assert.match(closed.grokPrompt, /straight-leg jeans/);
});

test('closed legacy styling displays none while compatible new choices stay enabled and stored choice survives', () => {
  const locks = locksFor();
  const control = controls.find(c => c.key === 'outerwearStylingId');
  const prepared = prepareOuterwearClosureControl(control, locks);
  assert.ok(!prepared.closureDisabled);
  assert.equal(prepared.options.find(o => o.zh === '雙肩露出').disabled, true);
  assert.ok(!prepared.options.find(o => o.zh === '衣襬遮住部分下身').disabled);
  assert.equal(prepared.closureDisplayValue, option('outerwearStylingId', '全無').id);
  assert.equal(locks.outerwearStylingId, option('outerwearStylingId', '雙肩露出').id);
  assert.ok(!JSON.stringify(buildWorkspaceSummary(locks, controls)).includes('雙肩露出'));
  assert.doesNotMatch(generate(locks).summary, /雙肩露出/);
  const hands = prepareOuterwearClosureControl(controls.find(c => c.key === 'poseHandId'), locks);
  assert.equal(hands.options.find(o => o.id === 'hands-pull-open-off-shoulder-outerwear').disabled, true);
});

test('incompatible imported pull-open hand resolves to none when the front is closed', () => {
  const result = generate({ ...locksFor(), poseBaseId: 'standing', poseHandId: 'hands-pull-open-off-shoulder-outerwear' });
  assert.equal(result.selection.poseHandId, 'none');
  for (const text of texts(result)) assert.doesNotMatch(text, /pulling.*open|spreading.*open|gripping.*front edges/);
});

test('new closure never enters random opening pool', () => {
  for (let i = 0; i < 100; i++) {
    const result = generatePrompts(1, { ...locksFor(), outerwearOpeningId: '' }, [], { random: createSeededRandom(`closure-random-${i}`) })[0];
    assert.notEqual(result.selection.outerwearOpeningId, FULLY_CLOSED_OPENING_ID);
  }
});

test('cropped length and lower garments/accessories survive closure and all crops reproject the same sources', () => {
  for (const framingId of ['全身鏡頭 (Full Body Shot)', '中景鏡頭 (Medium Shot)', '半臉傾斜特寫']) {
    const result = generate(locksFor({ framingId, outerwearFitId: '短版緊身', outerwearColorId: '白色', outerwearPatternId: '粗橫條紋' }));
    for (const text of texts(result)) {
      assert.match(text, /underbust-cropped tight body-skimming blazer/);
      assert.match(text, /all front buttons fastened/);
      assert.doesNotMatch(text, /silk camisole/);
    }
    assert.match(result.extraPrompts.find(p => p.id === 'full-body-character').text, /straight-leg jeans/);
  }
});

test('a closed jacket projects only upper details out of bundled looks and dresses', () => {
  const preset = generate(locksFor({ outfitPresetId: '套裝：春日巴黎亞麻長褲' }));
  for (const text of texts(preset)) {
    assert.doesNotMatch(text, /silk camisole|linen shirt worn open/);
    assert.match(text, /all front buttons fastened/);
  }
  assert.match(preset.grokPrompt, /high-waisted wide-leg trousers/);
  const dress = generate(locksFor({ dressId: '連身：短版｜細肩帶迷你洋裝' }));
  for (const text of texts(dress)) {
    assert.doesNotMatch(text, /spaghetti-strap|slim straps|fitted bodice/);
    assert.match(text, /all front buttons fastened/);
  }
  assert.match(dress.grokPrompt, /mini dress|short hem/);
  assert.doesNotMatch(dress.grokPrompt, /visible below the outerwear hem|layered over lower portion/);
  const special = generate(locksFor({ specialOutfitId: '黑色波點頭巾透紗套裝' }));
  // Complete special looks already take over all wardrobe slots. An inactive
  // outerwear lock must not introduce a jacket or trim the special look.
  for (const text of texts(special)) {
    assert.match(text, /sleeveless sheer cropped top/);
    assert.doesNotMatch(text, /all front buttons fastened/);
  }
  assert.match(special.grokPrompt, /asymmetrical sheer skirt/);
  assert.match(special.grokPrompt, /knee-high boots/);
  const colored = generate(locksFor({ outfitPresetId: '套裝：春日巴黎亞麻長褲', outfitPresetPrimaryColorId: '紅色' }));
  for (const text of texts(colored)) assert.doesNotMatch(text, /silk camisole|linen shirt worn open/);
});

test('duo visibility and styling are resolved independently per woman', () => {
  const locks = { ...locksFor(), subjectCount: '2', outerwearId: option('outerwearId', '全無').id,
    topAId: option('topAId', '絲質細肩帶上衣').id, topBId: option('topBId', '短袖上衣').id,
    outerwearAId: option('outerwearAId', '連帽外套').id, outerwearAOpeningId: FULLY_CLOSED_OPENING_ID,
    outerwearAStylingId: option('outerwearAStylingId', '雙肩露出').id,
    outerwearBId: option('outerwearBId', '蕾絲罩衫').id, outerwearBOpeningId: FULLY_CLOSED_OPENING_ID };
  const result = generate(locks);
  for (const text of texts(result)) {
    assert.doesNotMatch(text, /silk camisole|both shoulders fully uncovered/);
    assert.match(text, /short-sleeve top/);
    assert.match(text, /visible through the closed/);
  }
});

test('Character Card identity and lower wardrobe survive while a closed opaque layer hides its top', () => {
  for (const mode of ['full-default', 'selected-layers']) {
    const result = generate({ ...locksFor(), characterProfileId: 'character-rika', characterCardWardrobeMode: mode,
      characterCardWardrobeLayerIds: ['top', 'bottom', 'shoes', 'neckAccessory'] });
    for (const text of texts(result)) {
      if (mode === 'full-default') {
        assert.match(text, /baby tee/);
        assert.doesNotMatch(text, /all front buttons fastened/);
      } else {
        assert.doesNotMatch(text, /cropped white short-sleeve baby tee/);
        assert.match(text, /all front buttons fastened/);
      }
    }
    assert.match(result.grokPrompt, /low-rise light-wash blue jeans/);
    assert.equal(result.selection.characterProfileId, 'character-rika');
  }
});

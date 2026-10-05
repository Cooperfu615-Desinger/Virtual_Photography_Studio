import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import { prepareBottomRiseControl } from './bottomRiseCompatibility.js';
import { buildWorkspaceSummary } from '../page1WorkspaceSummary.js';
import { deserializeFavoritePrompt, serializeFavoritePrompt, parseLocksFromStandardPrompt } from '../../features/saved-cards/cardCodec.js';

const controls = getLockControls();
const jacket = '愛迪達立領三線外套';
const pants = '愛迪達三線運動長褲';
const option = (key, zh) => {
  const item = controls.find(c => c.key === key)?.options.find(o => o.zh === zh);
  assert.ok(item, `${key}/${zh}`);
  return item;
};
function locksFor(values = {}) {
  const locks = { ...createEmptyLocks(), subjectCount: '1' };
  for (const c of controls) {
    const none = c.options.find(o => ['全無', '無額外表情'].includes(o.zh));
    if (none) locks[c.key] = none.id;
  }
  for (const [key, zh] of Object.entries({ framingId: '全身鏡頭 (Full Body Shot)', outerwearId: jacket, pantsId: pants, ...values })) locks[key] = option(key, zh).id;
  return locks;
}
const generate = locks => generatePrompts(1, locks, [], { random: createSeededRandom('adidas-trackwear-v1') })[0];
const outputs = r => [r.grokPrompt, r.zImagePrompt, r.midjourneyPrompt, ...r.extraPrompts.map(e => e.text)];

test('new trackwear appends stable identities and keeps its authored detail across six outputs', () => {
  assert.equal(option('outerwearId', jacket).id, `wardrobe:外套-outerwear:${jacket}:22`);
  assert.equal(option('pantsId', pants).id, `wardrobe:褲裝-pants:${pants}:33`);
  const r = generate(locksFor({ outerwearColorId: '黑色', bottomColorId: '黑色' }));
  for (const text of outputs(r)) {
    assert.ok(text.includes(option('outerwearId', jacket).en));
    assert.ok(text.includes('black adidas'));
  }
  for (const text of [r.grokPrompt, r.zImagePrompt, r.midjourneyPrompt, r.extraPrompts.find(e => e.id === 'full-body-character').text]) assert.ok(text.includes(option('pantsId', pants).en));
  for (const e of r.extraPrompts.filter(e => e.id.startsWith('chest-up'))) assert.ok(!e.text.includes('track pants'));
});

test('new jacket uses existing fit, zip closure, sleeve styling and hidden inner-layer contracts', () => {
  for (const fit of ['合身', '短版緊身', '長版 Oversize']) {
    const r = generate(locksFor({ outerwearFitId: fit, outerwearOpeningId: '拉鏈拉一半' }));
    for (const text of outputs(r)) {
      assert.match(text, /three parallel contrast stripes/);
      assert.match(text, /zipped halfway up/);
      assert.ok(text.includes(option('outerwearFitId', fit).en.split(',')[0]) || /(?:fitted|tight|oversized)/i.test(text));
    }
  }
  const closed = generate(locksFor({ topId: '短袖上衣', outerwearOpeningId: '全扣上／全拉上' }));
  for (const text of outputs(closed)) {
    assert.match(text, /front zipper fully zipped closed/);
    assert.ok(!text.includes(option('topId', '短袖上衣').en));
  }
  const rolled = generate(locksFor({ outerwearStylingId: '袖口捲至前臂' }));
  assert.ok(rolled.grokPrompt.includes(option('outerwearStylingId', '袖口捲至前臂').en));
});

test('elastic waist suppresses only incompatible fly styling while keeping stored choice and restoration', () => {
  const locks = locksFor({ bottomRiseId: '扣子解開拉鏈微開' });
  const r = generate(locks);
  for (const text of outputs(r)) assert.doesNotMatch(text, /waist button undone|front zipper slightly lowered/);
  assert.equal(r.selection.bottomRiseId, locks.bottomRiseId);
  assert.ok(!JSON.stringify(r.summaryFields).includes('扣子解開'));
  assert.ok(!JSON.stringify(buildWorkspaceSummary(locks, controls)).includes('扣子解開'));
  const prepared = prepareBottomRiseControl(controls.find(c => c.key === 'bottomRiseId'), locks, controls);
  assert.equal(prepared.options.find(o => o.id === locks.bottomRiseId).disabled, true);
  assert.equal(prepared.closureDisplayValue, 'none');
  const saved = deserializeFavoritePrompt(serializeFavoritePrompt(r));
  assert.equal(saved.selection.bottomRiseId, locks.bottomRiseId);
  const restored = generate({ ...saved.selection, pantsId: option('pantsId', '直筒牛仔褲').id });
  assert.match(restored.grokPrompt, /waist button undone/);
  for (const rise of ['高腰', '正常腰線', '低腰', '超低腰']) assert.ok(generate(locksFor({ bottomRiseId: rise })).grokPrompt.includes(option('bottomRiseId', rise).en));
});

test('duo waist compatibility is scoped to the selected wearer', () => {
  const locks = { ...locksFor({ outerwearId: '全無', pantsId: '全無', pantsAId: pants, pantsBId: '直筒牛仔褲', bottomRiseAId: '扣子解開拉鏈微開', bottomRiseBId: '扣子解開拉鏈微開' }), subjectCount: '2' };
  const r = generate(locks);
  for (const text of [r.grokPrompt, r.zImagePrompt, r.midjourneyPrompt]) assert.equal((text.match(/waist button undone/g) || []).length, 1);
  assert.equal(prepareBottomRiseControl(controls.find(c => c.key === 'bottomRiseAId'), locks, controls).closureDisplayValue, 'none');
  assert.equal(prepareBottomRiseControl(controls.find(c => c.key === 'bottomRiseBId'), locks, controls).closureDisplayValue, undefined);
});

test('standard prompt import and saved cards retain both separate garment selections', () => {
  const r = generate(locksFor({ outerwearFitId: '短版合身', outerwearOpeningId: '敞開穿' }));
  const parsed = parseLocksFromStandardPrompt(r.grokPrompt, controls).locks;
  for (const key of ['outerwearId', 'pantsId', 'outerwearFitId', 'outerwearOpeningId']) assert.equal(parsed[key], r.selection[key]);
  const saved = deserializeFavoritePrompt(serializeFavoritePrompt(r));
  assert.equal(saved.selection.outerwearId, r.selection.outerwearId);
  assert.equal(saved.selection.pantsId, r.selection.pantsId);
});

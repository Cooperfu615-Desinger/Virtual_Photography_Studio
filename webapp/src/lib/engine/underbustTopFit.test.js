import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import { deserializeFavoritePrompt, serializeFavoritePrompt, parseLocksFromStandardPrompt } from '../../features/saved-cards/cardCodec.js';
import { prepareUnderbustTopControl } from './underbustTopFit.js';
import { buildWorkspaceSummary } from '../page1WorkspaceSummary.js';

const controls = getLockControls();
const option = (key, zh) => {
  const value = controls.find(c => c.key === key)?.options.find(o => o.zh === zh);
  assert.ok(value, `${key}/${zh}`);
  return value;
};
const names = ['短版緊身', '短版合身'];
const excluded = ['比基尼上身', '蕾絲胸罩', '運動型內衣', 'X形胸貼', '小三角細繩比基尼上身', '創可貼造型胸貼'];
function locksFor(values = {}) {
  const locks = { ...createEmptyLocks(), subjectCount: '1' };
  for (const c of controls) {
    const none = c.options.find(o => ['全無', '無額外表情'].includes(o.zh));
    if (none) locks[c.key] = none.id;
  }
  for (const [key, zh] of Object.entries({ framingId: '全身鏡頭 (Full Body Shot)', topId: '長版襯衫', pantsId: '直筒牛仔褲', topFitId: names[0], ...values })) locks[key] = option(key, zh).id;
  return locks;
}
const generate = locks => generatePrompts(1, locks, [], { random: createSeededRandom('underbust-top-v1') })[0];
const all = r => [r.grokPrompt, r.zImagePrompt, r.midjourneyPrompt, ...r.extraPrompts.map(e => e.text)];
const full = r => r.extraPrompts.find(e => e.id === 'full-body-character').text;

test('two manual short fits append without changing the five old options', () => {
  const fits = controls.find(c => c.key === 'topFitId').options;
  assert.deepEqual(fits.slice(0, 5).map(o => [o.id, o.zh]), [['none', '全無'], ['standard', '正常'], ['fitted', '合身'], ['tight', '緊身'], ['oversized', 'oversize']]);
  assert.deepEqual(fits.slice(5).map(o => o.zh), names);
  for (const name of names) {
    const fit = option('topFitId', name);
    assert.equal(fit.meta.randomEligible, false);
    assert.equal(fit.en.split(/\s+/).length, 9);
  }
});

test('every eligible top including existing cropped garments resolves one underbust length across six outputs', () => {
  const tops = controls.find(c => c.key === 'topId').options.filter(o => o.zh !== '全無' && !excluded.includes(o.zh));
  assert.equal(tops.length, 39);
  for (const top of tops) for (const name of names) {
    assert.ok(top.meta.topUnderbust?.baseEn, top.zh);
    const fit = option('topFitId', name);
    const result = generate(locksFor({ topId: top.zh, topFitId: name }));
    for (const text of all(result)) {
      assert.equal(text.split(fit.en).length - 1, 1, `${top.zh}/${name}: ${text}`);
      assert.doesNotMatch(text, /longline upper-thigh hem|extended shirttail hem|hip-grazing hem|cinched waist hem|regular-length pullover|relaxed straight-cut body draping over the waist/);
      assert.doesNotMatch(text, /top length meets|long untucked length|不適用|VPSTUDIO_/);
    }
    assert.equal(result.selection.topId, top.id);
    assert.equal(result.selection.topFitId, fit.id);
    const parsed = parseLocksFromStandardPrompt(result.grokPrompt, controls).locks;
    assert.equal(parsed.topId, top.id, `${top.zh}: shortened garment restores original identity`);
    assert.equal(parsed.topFitId, fit.id);
  }
});

test('shortened garments preserve authored fabric, collars, sleeves and construction', () => {
  for (const [top, phrases] of [
    ['長版襯衫', ['crisp woven poplin', 'pointed collar', 'full button-front placket', 'structured cuffs']],
    ['長版寬鬆麻花針織毛衣', ['cable-knit sweater', 'chunky knit texture', 'dropped shoulders', 'extra-long relaxed sleeves']],
    ['短版蕾絲背心', ['sheer floral lace', 'slim adjustable straps', 'triangle cup bust panel', 'scalloped lace hem']],
    ['高領連身上衣', ['high-neck', 'sleeveless construction', 'smooth stretch or ribbed fabric']],
    ['馬甲上衣', ['corset', 'shaped cup seams', 'visible boning channels']],
    ['長袖水手服', ['navy sailor collar', 'white parallel trim', 'navy scarf tie', 'navy cuffs with white trim']],
  ]) {
    const result = generate(locksFor({ topId: top }));
    for (const text of [result.grokPrompt, full(result)]) for (const phrase of phrases) assert.ok(text.includes(phrase), `${top}/${phrase}`);
    assert.doesNotMatch(result.grokPrompt, /continuous torso line|fitted waist|slouchy boyfriend fit/);
  }
});

test('color and surface variants keep the new fit, selected garment and natural-hem prose import', () => {
  for (const color of ['黑色', '彩色橫條紋', '鏡面鉻銀']) {
    const locks = locksFor({ topColorId: color, topStylingId: '自然放出', topPatternId: '細橫條紋' });
    const result = generate(locks);
    for (const text of all(result)) assert.ok(text.includes(option('topFitId', names[0]).en));
    const parsed = parseLocksFromStandardPrompt(result.grokPrompt, controls).locks;
    assert.equal(parsed.topId, locks.topId);
    assert.equal(parsed.topFitId, locks.topFitId);
    assert.equal(parsed.topStylingId, 'untucked');
  }
});

test('short fits preserve every selected catalog body source across visible and derived outputs', () => {
  for (const body of controls.find(c => c.key === 'bodyTypeId').options.filter(o => o.zh !== '全無')) {
    const result = generate(locksFor({ bodyTypeId: body.zh, topStylingId: '自然放出' }));
    for (const text of all(result)) assert.ok(text.includes(body.en), body.zh);
    assert.equal(result.selection.bodyTypeId, body.id);
  }
});

test('bras, swimwear and pasties keep their source while short fit remains latent', () => {
  for (const top of excluded) {
    const locks = locksFor({ topId: top });
    const result = generate(locks);
    for (const text of all(result)) assert.ok(!text.includes(option('topFitId', names[0]).en));
    assert.ok(result.grokPrompt.includes(option('topId', top).en));
    assert.equal(result.selection.topFitId, locks.topFitId);
    assert.ok(!JSON.stringify(buildWorkspaceSummary(locks, controls)).includes(names[0]));
    const saved = deserializeFavoritePrompt(serializeFavoritePrompt(result));
    assert.equal(saved.selection.topFitId, locks.topFitId);
    assert.ok(generate({ ...saved.selection, topId: option('topId', '襯衫').id }).grokPrompt.includes(option('topFitId', names[0]).en));
  }
});

test('waist-bound styles are suppressed without changing their stored choice; natural hem uses underbust source', () => {
  for (const name of ['紮入下身', '半紮', '下擺打結', '衣襬遮住部分下身']) {
    const locks = locksFor({ topStylingId: name });
    const result = generate(locks);
    for (const text of all(result)) assert.ok(!text.includes(option('topStylingId', name).en));
    assert.equal(result.selection.topStylingId, locks.topStylingId);
    assert.ok(!JSON.stringify(buildWorkspaceSummary(locks, controls)).includes(name));
    const restored = generate({ ...result.selection, topFitId: 'fitted' });
    assert.ok(restored.grokPrompt.includes(option('topStylingId', name).en));
  }
  for (const text of all(generate(locksFor({ topStylingId: '自然放出' })))) {
    assert.match(text, /top hem hanging naturally just below the bust/);
    assert.doesNotMatch(text, /loose over the waistband|top length meets|long untucked length/);
  }
});

test('UI disables incompatible short fits and styles individually, preserves values and copies effective source', () => {
  const fitControl = controls.find(c => c.key === 'topFitId');
  const styleControl = controls.find(c => c.key === 'topStylingId');
  const locks = locksFor({ topId: '蕾絲胸罩', topStylingId: '紮入下身' });
  const fit = prepareUnderbustTopControl(fitControl, locks, controls);
  assert.equal(fit.options.find(o => o.zh === names[0]).disabled, true);
  assert.equal(fit.closureDisplayValue, 'none');
  assert.equal(locks.topFitId, option('topFitId', names[0]).id);
  const validLocks = { ...locks, topId: option('topId', '襯衫').id };
  const style = prepareUnderbustTopControl(styleControl, validLocks, controls);
  assert.equal(style.closureDisplayValue, 'none');
  for (const name of ['紮入下身', '半紮', '下擺打結', '衣襬遮住部分下身']) assert.equal(style.options.find(o => o.zh === name).disabled, true);
  assert.equal(style.options.find(o => o.zh === '自然放出').en, 'top hem hanging naturally just below the bust');
  assert.ok(!prepareUnderbustTopControl(styleControl, { ...validLocks, topFitId: 'fitted' }, controls).options.find(o => o.zh === '紮入下身').disabled);
});

test('framing omits off-screen short fit and full-body output restores it from the same source', () => {
  for (const framing of ['臉部特寫', '特寫鏡頭 (Close-Up)']) {
    const result = generate(locksFor({ framingId: framing }));
    for (const text of [result.grokPrompt, result.zImagePrompt, result.midjourneyPrompt]) assert.ok(!text.includes(option('topFitId', names[0]).en));
    assert.ok(full(result).includes(option('topFitId', names[0]).en));
    assert.equal(result.selection.topFitId, option('topFitId', names[0]).id);
  }
});

test('outerwear keeps its own length and hem relationship while the inner top is cropped', () => {
  const locks = locksFor({ outerwearId: '長版襯衫', outerwearOpeningId: '敞開穿', outerwearStylingId: '衣襬遮住部分下身', topStylingId: '衣襬遮住部分下身' });
  const result = generate(locks);
  assert.match(result.grokPrompt, /longline cotton-poplin button-up shirt/);
  assert.ok(result.grokPrompt.includes(option('outerwearStylingId', '衣襬遮住部分下身').en));
  assert.ok(!result.grokPrompt.includes(option('topStylingId', '衣襬遮住部分下身').en));
  const closed = generate({ ...locks, outerwearOpeningId: option('outerwearOpeningId', '全扣上／全拉上').id });
  assert.ok(!closed.grokPrompt.includes(option('topFitId', names[0]).en));
  assert.equal(closed.selection.topFitId, locks.topFitId);
});

test('complete presets own the outfit and do not acquire an independent short top', () => {
  const result = generate(locksFor({ outfitPresetId: '套裝：泳裝度假' }));
  for (const text of all(result)) assert.ok(!text.includes(option('topFitId', names[0]).en));
});

test('duo short fits remain attached to each wearer and do not override the other top', () => {
  const locks = { ...locksFor(), subjectCount: '2', topAId: option('topAId', '長版襯衫').id, topFitAId: option('topFitAId', names[1]).id,
    topBId: option('topBId', '短版帽T').id, topFitBId: 'standard', pantsAId: option('pantsAId', '直筒牛仔褲').id, pantsBId: option('pantsBId', '直筒牛仔褲').id };
  const result = generate(locks);
  const a = result.grokPrompt.split('Woman 1:')[1].split('Woman 2:')[0];
  const b = result.grokPrompt.split('Woman 2:')[1].split('Shared Expression:')[0];
  assert.ok(a.includes(option('topFitAId', names[1]).en));
  assert.ok(!b.includes(option('topFitAId', names[1]).en));
  assert.match(b, /cropped hoodie|cinched waist hem/);
  const saved = deserializeFavoritePrompt(serializeFavoritePrompt(result));
  assert.equal(saved.selection.topFitAId, locks.topFitAId);
  assert.equal(saved.selection.topFitBId, 'standard');
  const parsed = parseLocksFromStandardPrompt(result.grokPrompt, controls).locks;
  assert.equal(parsed.topAId, locks.topAId);
  assert.equal(parsed.topBId, locks.topBId);
  assert.equal(parsed.topFitAId, locks.topFitAId);
  assert.equal(parsed.topFitBId, 'standard');
  const both = generate({ ...locks, topFitBId: option('topFitBId', names[0]).id });
  for (const text of [both.grokPrompt, both.zImagePrompt, both.midjourneyPrompt]) for (const name of names) assert.ok(text.includes(option('topFitId', name).en));
  const restoredBoth = parseLocksFromStandardPrompt(both.grokPrompt, controls).locks;
  assert.equal(restoredBoth.topAId, locks.topAId);
  assert.equal(restoredBoth.topBId, locks.topBId);
  assert.equal(restoredBoth.topFitAId, locks.topFitAId);
  assert.equal(restoredBoth.topFitBId, option('topFitBId', names[0]).id);
});

test('manual short fits never enter the old random fit pool and absent tops preserve the selected short fit', () => {
  for (let i = 0; i < 15; i++) {
    const result = generatePrompts(1, { ...locksFor(), topFitId: '' }, [], { random: createSeededRandom(`underbust-random-${i}`) })[0];
    assert.ok(!names.some(name => result.selection.topFitId === option('topFitId', name).id));
  }
  const locks = locksFor({ topId: '全無' });
  assert.equal(generate(locks).selection.topFitId, locks.topFitId);
});

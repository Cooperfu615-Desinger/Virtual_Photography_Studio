import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import { deserializeFavoritePrompt, serializeFavoritePrompt, parseLocksFromStandardPrompt } from '../../features/saved-cards/cardCodec.js';
import { prepareOuterwearClosureControl } from './outerwearClosure.js';
import { buildWorkspaceSummary } from '../page1WorkspaceSummary.js';

const controls = getLockControls();
const option = (key, zh) => {
  const item = controls.find(c => c.key === key)?.options.find(o => o.zh === zh);
  assert.ok(item, `${key}/${zh}`);
  return item;
};
const names = ['衣襬遮住部分下身', '披在雙肩（不穿袖）', '披在單肩（不穿袖）', '袖口捲至前臂'];
function locksFor(values = {}) {
  const locks = { ...createEmptyLocks(), subjectCount: '1' };
  for (const c of controls) {
    const none = c.options.find(o => ['全無', '無額外表情'].includes(o.zh));
    if (none) locks[c.key] = none.id;
  }
  for (const [key, zh] of Object.entries({ framingId: '全身鏡頭 (Full Body Shot)', topId: '短袖上衣', pantsId: '直筒牛仔褲', outerwearId: '長版襯衫', outerwearOpeningId: '敞開穿', ...values })) locks[key] = option(key, zh).id;
  return locks;
}
const generate = locks => generatePrompts(1, locks, [], { random: createSeededRandom('outerwear-styling-v2') })[0];
const all = r => [r.grokPrompt, r.zImagePrompt, r.midjourneyPrompt, ...r.extraPrompts.map(e => e.text)];
const visible = r => [r.grokPrompt, r.zImagePrompt, r.midjourneyPrompt, r.extraPrompts.find(e => e.id === 'full-body-character').text];

test('four manual styles append after legacy choices and retain exact source once after the coat', () => {
  const styles = controls.find(c => c.key === 'outerwearStylingId').options;
  assert.deepEqual(styles.slice(0, 4).map(o => o.zh), ['全無', '正常穿著', '單肩露出', '雙肩露出']);
  assert.deepEqual(styles.slice(4).map(o => o.zh), names);
  for (const name of names) {
    const style = option('outerwearStylingId', name);
    assert.equal(style.meta.randomEligible, false);
    const result = generate(locksFor({ outerwearStylingId: name }));
    for (const text of name === names[0] || name === names[3] ? visible(result) : all(result)) {
      assert.equal(text.split(style.en).length - 1, 1, `${name}: ${text}`);
      assert.doesNotMatch(text, /VPSTUDIO_LAYER_SOURCE|不適用|原選項保留/);
      assert.ok(text.indexOf('cotton-poplin button-up shirt') < text.indexOf(style.en));
    }
    assert.equal(result.selection.outerwearStylingId, style.id);
    const saved = deserializeFavoritePrompt(serializeFavoritePrompt(result));
    assert.equal(saved.selection.outerwearStylingId, style.id);
    assert.equal(parseLocksFromStandardPrompt(result.grokPrompt, controls).locks.outerwearStylingId, style.id);
  }
});

test('hem source resolves transparency once and accepts a minimal inner top without changing body', () => {
  const style = option('outerwearStylingId', names[0]);
  const body = option('bodyTypeId', '豐胸纖腰沙漏身形');
  for (const coat of ['薄紗輕薄披衣外套', '蕾絲罩衫']) {
    const result = generate(locksFor({ outerwearId: coat, outerwearStylingId: names[0], topId: '小三角細繩比基尼上身', bodyTypeId: body.zh }));
    for (const text of visible(result)) {
      assert.ok(text.includes(style.meta.outerwearStyling.throughFabricEn));
      assert.ok(text.includes(body.en));
      assert.ok(!text.includes(style.en));
    }
    assert.equal(parseLocksFromStandardPrompt(result.grokPrompt, controls).locks.outerwearStylingId, style.id);
  }
});

test('closed coats retain hem and rolled sleeves but suppress drapes without mutating locks', () => {
  for (const name of names) {
    const locks = locksFor({ outerwearOpeningId: '全扣上／全拉上', outerwearStylingId: name });
    const result = generate(locks);
    const source = option('outerwearStylingId', name).en;
    for (const text of visible(result)) {
      assert.equal(text.includes(source), name === names[0] || name === names[3]);
      assert.match(text, /all front buttons fastened/);
      assert.doesNotMatch(text, /short-sleeve top/);
    }
    assert.equal(result.selection.outerwearStylingId, locks.outerwearStylingId);
    assert.equal(JSON.stringify(buildWorkspaceSummary(locks, controls)).includes(name), name === names[0] || name === names[3]);
  }
});

test('invalid hem and sleeve combinations stay latent and are restored with compatible garments', () => {
  const hem = option('outerwearStylingId', names[0]);
  for (const values of [{ outerwearFitId: '短版合身' }, { pantsId: '全無' }, { outerwearId: '全無' }]) {
    const locks = locksFor({ outerwearStylingId: names[0], ...values });
    const result = generate(locks);
    for (const text of all(result)) assert.ok(!text.includes(hem.en));
    assert.equal(result.selection.outerwearStylingId, hem.id);
  }
  const cuff = option('outerwearStylingId', names[3]);
  for (const coat of ['薄紗輕薄披衣外套', '騎士風皮衣']) for (const text of all(generate(locksFor({ outerwearId: coat, outerwearStylingId: names[3] })))) assert.ok(!text.includes(cuff.en));
  assert.ok(generate(locksFor({ outerwearStylingId: names[3] })).grokPrompt.includes(cuff.en));
});

test('waist and sleeve crop exclusions do not rewrite visible sources or full-body derivative', () => {
  for (const name of [names[0], names[3]]) {
    const result = generate(locksFor({ framingId: '胸上特寫', outerwearStylingId: name }));
    const source = option('outerwearStylingId', name).en;
    for (const text of [result.grokPrompt, result.zImagePrompt, result.midjourneyPrompt, ...result.extraPrompts.filter(e => e.id.includes('chest')).map(e => e.text)]) assert.ok(!text.includes(source));
    assert.ok(result.extraPrompts.find(e => e.id === 'full-body-character').text.includes(source));
  }
});

test('drapes reject partial closures and preserve a conflicting explicit sleeve-bound hand pose', () => {
  for (const name of [names[1], names[2]]) {
    const source = option('outerwearStylingId', name).en;
    for (const opening of ['扣子扣一半', '拉鏈拉一半']) for (const text of all(generate(locksFor({ outerwearStylingId: name, outerwearOpeningId: opening })))) assert.ok(!text.includes(source));
    const locks = { ...locksFor({ outerwearStylingId: name }), poseBaseId: 'standing', poseHandId: 'hands-pull-open-off-shoulder-outerwear' };
    const result = generate(locks);
    assert.equal(result.selection.poseHandId, locks.poseHandId);
    assert.ok(result.grokPrompt.includes('both arms still loosely inside the sleeves'));
    for (const text of all(result)) assert.ok(!text.includes(source));
  }
});

test('UI disables incompatible choices individually and keeps compatible closed choices enabled', () => {
  const locks = locksFor({ outerwearOpeningId: '全扣上／全拉上', outerwearStylingId: names[0] });
  const control = controls.find(c => c.key === 'outerwearStylingId');
  const prepared = prepareOuterwearClosureControl(control, locks, controls);
  assert.ok(!prepared.closureDisabled);
  for (const name of names) assert.equal(Boolean(prepared.options.find(o => o.zh === name).disabled), name === names[1] || name === names[2]);
  const cropped = prepareOuterwearClosureControl(control, { ...locks, outerwearFitId: option('outerwearFitId', '短版合身').id }, controls);
  assert.equal(cropped.options.find(o => o.zh === names[0]).disabled, true);
  assert.equal(locks.outerwearStylingId, option('outerwearStylingId', names[0]).id);
  const translucent = prepareOuterwearClosureControl(control, { ...locks, outerwearId: option('outerwearId', '蕾絲罩衫').id }, controls);
  assert.equal(translucent.options.find(o => o.zh === names[0]).en, option('outerwearStylingId', names[0]).meta.outerwearStyling.throughFabricEn);
});

test('top and coat hem instructions stay separate, and opaque closure hides only the inner instruction', () => {
  const topSource = option('topStylingId', names[0]).en;
  const coatSource = option('outerwearStylingId', names[0]).en;
  const locks = locksFor({ topId: '落肩 T 恤', topStylingId: names[0], outerwearStylingId: names[0] });
  const result = generate(locks);
  for (const text of visible(result)) {
    assert.ok(text.includes(topSource));
    assert.ok(text.includes(coatSource));
    assert.ok(text.indexOf(coatSource) < text.indexOf(topSource));
  }
  const closed = generate({ ...locks, outerwearOpeningId: option('outerwearOpeningId', '全扣上／全拉上').id });
  for (const text of visible(closed)) { assert.ok(text.includes(coatSource)); assert.ok(!text.includes(topSource)); }
  assert.equal(closed.selection.topStylingId, locks.topStylingId);
});

test('prose import does not mistake the longer inner-top hem source for an outerwear style', () => {
  const top = option('topStylingId', names[0]);
  const coat = option('outerwearStylingId', names[0]);
  const normal = option('outerwearStylingId', '正常穿著');
  for (const source of [top.en, `${normal.en}, layered over ${top.en}`]) {
    const parsed = parseLocksFromStandardPrompt(source, controls).locks;
    assert.equal(parsed.topStylingId, top.id);
    assert.notEqual(parsed.outerwearStylingId, coat.id);
  }
  const parsed = parseLocksFromStandardPrompt(`${coat.en}, layered over ${top.en}`, controls).locks;
  assert.equal(parsed.topStylingId, top.id);
  assert.equal(parsed.outerwearStylingId, coat.id);
});

test('manual draping limits random opening to compatible choices and restores after conflicting closure', () => {
  for (const name of [names[1], names[2]]) {
    const locks = { ...locksFor({ outerwearStylingId: name }), outerwearOpeningId: '' };
    for (let i = 0; i < 15; i++) {
      const result = generatePrompts(1, locks, [], { random: createSeededRandom(`drape-opening-${i}`) })[0];
      for (const text of all(result)) assert.ok(text.includes(option('outerwearStylingId', name).en));
      const opening = controls.find(c => c.key === 'outerwearOpeningId').options.find(o => o.id === result.selection.outerwearOpeningId);
      assert.ok(!opening?.meta?.outerwearFastenerRequirement);
    }
    const handControl = prepareOuterwearClosureControl(controls.find(c => c.key === 'poseHandId'), locks, controls);
    assert.equal(handControl.options.find(o => o.id === 'hands-pull-open-off-shoulder-outerwear').disabled, true);
    const closed = generate({ ...locks, outerwearOpeningId: option('outerwearOpeningId', '全扣上／全拉上').id });
    const restored = deserializeFavoritePrompt(serializeFavoritePrompt(closed));
    assert.equal(restored.selection.outerwearStylingId, locks.outerwearStylingId);
    assert.ok(generate({ ...restored.selection, outerwearOpeningId: option('outerwearOpeningId', '敞開穿').id }).grokPrompt.includes(option('outerwearStylingId', name).en));
  }
});

test('duo styles remain attached to their own coat and random styles retain the legacy pool', () => {
  const locks = { ...locksFor(), subjectCount: '2', outerwearId: option('outerwearId', '全無').id,
    topAId: option('topAId', '短袖上衣').id, pantsAId: option('pantsAId', '直筒牛仔褲').id,
    topBId: option('topBId', '短袖上衣').id, pantsBId: option('pantsBId', '直筒牛仔褲').id,
    outerwearAId: option('outerwearAId', '長版襯衫').id, outerwearAStylingId: option('outerwearAStylingId', names[0]).id,
    outerwearBId: option('outerwearBId', '西裝外套').id, outerwearBStylingId: option('outerwearBStylingId', names[1]).id };
  const result = generate(locks);
  for (const text of [result.grokPrompt, result.zImagePrompt, result.midjourneyPrompt]) for (const name of [names[0], names[1]]) assert.equal(text.split(option('outerwearStylingId', name).en).length - 1, 1);
  assert.equal(result.selection.outerwearAStylingId, locks.outerwearAStylingId);
  assert.equal(result.selection.outerwearBStylingId, locks.outerwearBStylingId);
  const ids = new Set(names.map(name => option('outerwearStylingId', name).id));
  for (let i = 0; i < 25; i++) assert.ok(!ids.has(generatePrompts(1, { ...locksFor(), outerwearStylingId: '' }, [], { random: createSeededRandom(`outerwear-random-${i}`) })[0].selection.outerwearStylingId));
});

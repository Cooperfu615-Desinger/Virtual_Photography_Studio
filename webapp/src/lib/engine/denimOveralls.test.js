import { preTestEfficiencySource } from '../../../../scripts/lib/testEfficiencyHistoricalReplay.mjs';
import { preGestureExpressionGazeSource } from '../../../../scripts/lib/gestureExpressionGazeHistoricalReplay.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import history from '../../../../scripts/lib/denimOverallsHistory.json' with { type: 'json' };
import { preDenimOverallsSource } from '../../../../scripts/lib/denimOverallsHistoricalReplay.mjs';
import strapHistory from '../../../../scripts/lib/denimStrapHistory.json' with { type: 'json' };
import { preDenimStrapSource } from '../../../../scripts/lib/denimStrapHistoricalReplay.mjs';
import { createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import { naturalFixtureLocks } from './midjourneyNaturalFixtures.js';
import { buildPage1GenerationPromptCards } from '../page1PromptOutputs.js';
import { prepareBottomRiseControl } from './bottomRiseCompatibility.js';
import { buildWorkspaceSummary } from '../page1WorkspaceSummary.js';
import { deserializeFavoritePrompt, serializeFavoritePrompt, parseLocksFromStandardPrompt } from '../../features/saved-cards/cardCodec.js';

const controls = getLockControls();
const cases = [
  ['丹寧吊帶長褲', 'denim overalls', 'denim overalls, full-length wide-legged silhouette, casual utility straps, relaxed vintage styling'],
  ['丹寧吊帶短褲', 'denim short overalls', 'denim short overalls, casual bib-front silhouette, youthful utility styling, relaxed summer mood'],
];
const option = (key, zh) => controls.find(c => c.key === key).options.find(o => o.zh === zh);
const locksFor = values => naturalFixtureLocks({ subjectCount: '1', framingId: { byZh: '全身鏡頭 (Full Body Shot)' }, ...values });
const generate = locks => generatePrompts(1, locks, [], { random: createSeededRandom('denim-overalls-v1') })[0];
const cards = r => buildPage1GenerationPromptCards(r);

test('exact inverse preserves historical seals and rejects unknown sources', () => {
  assert.equal(history.base, '5e896979331421fe567807067ce490bb16f6b3de');
  for (const file of history.files) {
    const current = preDenimStrapSource(file.path, preTestEfficiencySource(file.path, preGestureExpressionGazeSource(file.path, readFileSync(new URL('../../../../' + file.path, import.meta.url)))));
    const original = execFileSync('git', ['show', `${history.base}:${file.path}`], { maxBuffer: 16 * 1024 * 1024 });
    const hash = value => createHash('sha256').update(value).digest('hex');
    assert.equal(hash(current), file.afterHash, file.path);
    assert.equal(hash(original), file.beforeHash, file.path);
    assert.deepEqual(preDenimOverallsSource(file.path, current), original);
    assert.equal(preDenimOverallsSource(file.path, current.toString()), original.toString());
    assert.equal(preDenimOverallsSource(file.path, original), original);
    const unknown = Buffer.concat([current, Buffer.from('\n// unreviewed\n')]);
    assert.equal(preDenimOverallsSource(file.path, unknown), unknown);
  }
});

for (const [zh, noun, old] of cases) {
  test(`${zh}: all seven outputs retain the approved source, with and without dark blue`, () => {
    for (const color of ['全無', '深藍色']) {
      const r = generate(locksFor({ pantsId: { byZh: zh }, bottomColorId: { byZh: color } }));
      const source = `${color === '深藍色' ? 'dark blue ' : ''}${noun} worn low on the hips, one shoulder strap fastened and the other unfastened and hanging down naturally`;
      assert.equal(cards(r).length, 7);
      for (const card of cards(r)) assert.ok(card.value.toLowerCase().includes(source), card.title);
      assert.ok(r.midjourneyPrompt.includes(`She wears ${source}.`));
      assert.doesNotMatch(r.midjourneyPrompt, /a (?:dark blue )?denim|a one strap/);
      assert.equal(parseLocksFromStandardPrompt(r.grokPrompt, controls).locks.pantsId, r.selection.pantsId);
      const oldPrompt = r.grokPrompt.replace(source, old);
      assert.equal(parseLocksFromStandardPrompt(oldPrompt, controls).locks.pantsId, r.selection.pantsId);
      const previousPrompt = r.grokPrompt.replace(source, `${noun} worn low on the hips, one strap unfastened`);
      assert.equal(parseLocksFromStandardPrompt(previousPrompt, controls).locks.pantsId, r.selection.pantsId);
    }
  });

  test(`${zh}: conflicting rise is suppressed but saved choice restores on another garment`, () => {
    for (const rise of ['高腰', '正常腰線']) {
      const locks = locksFor({ pantsId: { byZh: zh }, bottomRiseId: { byZh: rise } });
      const r = generate(locks);
      for (const card of cards(r)) assert.doesNotMatch(card.value, /high-rise waistband|mid-rise waistband/);
      assert.equal(r.selection.bottomRiseId, locks.bottomRiseId);
      assert.ok(!JSON.stringify(r.summaryFields).includes(rise));
      assert.ok(!JSON.stringify(buildWorkspaceSummary(locks, controls)).includes(rise));
      const control = prepareBottomRiseControl(controls.find(c => c.key === 'bottomRiseId'), locks, controls);
      assert.equal(control.options.find(o => o.id === locks.bottomRiseId).disabled, true);
      assert.equal(control.closureDisplayValue, 'none');
      const saved = deserializeFavoritePrompt(serializeFavoritePrompt(r));
      assert.equal(saved.selection.bottomRiseId, locks.bottomRiseId);
      const restored = generate({ ...saved.selection, pantsId: option('pantsId', '直筒牛仔褲').id });
      assert.ok(restored.grokPrompt.toLowerCase().includes(option('bottomRiseId', rise).en));
    }
    for (const rise of ['低腰', '超低腰', '扣子解開拉鏈微開']) {
      const r = generate(locksFor({ pantsId: { byZh: zh }, bottomRiseId: { byZh: rise } }));
      assert.ok(r.grokPrompt.toLowerCase().includes(option('bottomRiseId', rise).en));
    }
  });
}

test('duo colors and rise suppression follow the correct wearer', () => {
  const locks = locksFor({ subjectCount: '2', pantsAId: { byZh: cases[0][0] }, pantsBId: { byZh: cases[1][0] },
    bottomAColorId: { byZh: '深藍色' }, bottomBColorId: { byZh: '紅色' },
    bottomRiseAId: { byZh: '高腰' }, bottomRiseBId: { byZh: '正常腰線' } });
  const r = generate(locks);
  assert.match(r.midjourneyPrompt, /The first woman wears dark blue denim overalls worn low on the hips, one shoulder strap fastened and the other unfastened and hanging down naturally/);
  assert.match(r.midjourneyPrompt, /The second woman wears red denim short overalls worn low on the hips, one shoulder strap fastened and the other unfastened and hanging down naturally/);
  for (const card of cards(r)) assert.doesNotMatch(card.value, /high-rise waistband|mid-rise waistband/);
});

test('loose-strap inverse preserves the first overalls revision and rejects unknown bytes', () => {
  assert.equal(strapHistory.base, '7baeb65735ec846c898044306b363fd597e93717');
  for (const file of strapHistory.files) {
    const current = preTestEfficiencySource(file.path, preGestureExpressionGazeSource(file.path, readFileSync(new URL('../../../../' + file.path, import.meta.url))));
    const original = execFileSync('git', ['show', `${strapHistory.base}:${file.path}`], { maxBuffer: 16 * 1024 * 1024 });
    assert.equal(createHash('sha256').update(current).digest('hex'), file.afterHash, file.path);
    assert.deepEqual(preDenimStrapSource(file.path, current), original);
    assert.equal(preDenimStrapSource(file.path, current.toString()), original.toString());
    assert.equal(preDenimStrapSource(file.path, original), original);
    const unknown = Buffer.concat([current, Buffer.from('\n// unreviewed\n')]);
    assert.equal(preDenimStrapSource(file.path, unknown), unknown);
  }
});

test('MJ retains ordinary top and footwear grammar beside the atomic overalls phrase', () => {
  const r = generate(locksFor({ pantsId: { byZh: cases[0][0] }, topId: { byZh: '短袖上衣' },
    shoesId: { byZh: 'Dr. Martens 1460 Round Toe Lace-Up Boots' } }));
  assert.match(r.midjourneyPrompt, /She wears a short-sleeve top, denim overalls worn low on the hips, one shoulder strap fastened and the other unfastened and hanging down naturally and/);
  assert.doesNotMatch(r.midjourneyPrompt, /a one strap|a denim/);
});

test('every bottom color remains attached to each overalls item in single and duo MJ', () => {
  for (const [zh] of cases) for (const color of controls.find(c => c.key === 'bottomColorId').options) {
    const r = generate(locksFor({ pantsId: { byZh: zh }, bottomColorId: color.id }));
    assert.match(r.midjourneyPrompt, /She wears .*denim (?:short )?overalls.* worn low on the hips, one shoulder strap fastened and the other unfastened and hanging down naturally\./);
    assert.doesNotMatch(r.midjourneyPrompt, /\ba denim|\ba one strap|\ba finished in|\ba patterned with|\ba wide stripe|\ban and clearly/);
  }
  const duo = generate(locksFor({ subjectCount: '2', pantsAId: { byZh: cases[0][0] }, pantsBId: { byZh: cases[1][0] },
    bottomAColorId: 'mirror-chrome-silver', bottomBColorId: 'multicolor-horizontal-stripes' }));
  assert.match(duo.midjourneyPrompt, /The first woman wears denim overalls finished in mirror-chrome silver with a highly polished scene-reflective surface and crisp environment reflections worn low on the hips, one shoulder strap fastened and the other unfastened and hanging down naturally\./);
  assert.match(duo.midjourneyPrompt, /The second woman wears denim short overalls patterned with bold multicolored horizontal stripes wide stripe bands and clearly separated random colors worn low on the hips, one shoulder strap fastened and the other unfastened and hanging down naturally\./);
  assert.doesNotMatch(duo.midjourneyPrompt, /Both wear/);
});

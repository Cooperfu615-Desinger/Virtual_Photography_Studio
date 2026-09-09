import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getLockControls, createEmptyLocks, generatePrompts, createSeededRandom } from '../engine.js';
import { buildResolvedLocalDetailBundle as build } from './localDetailResolvedAdapter.js';
const controls = getLockControls();
const get = (key, zh) => {
  const item = controls.find(c => c.key === key)?.options.find(o => o.zh === zh);
  assert.ok(item, `${key}/${zh}`); return item;
};
const run = (wardrobe, character = {}) => build({ subjectCount: 1, imageType: 'photorealistic-photo', wardrobe, character });
const tops = ['高領針織上衣', '高領連身上衣', '襯衫', '絲綢緞面襯衫', '短袖上衣', '落肩 T 恤',
  '棉質細肩背心', '絲質細肩帶上衣', '短版吊帶背心', '長版寬鬆麻花針織毛衣', '長版襯衫', '一字領上衣', '透膚刺繡襯衫'];
test('A: reviewed full tuck/outside preserve all thirteen chest sources, not abdominal exposure', () => {
  for (const zh of tops) for (const style of ['正常穿著', '紮入下身', '自然放出']) {
    const w = { top: get('topId', zh), topStyling: get('topStylingId', style) };
    const before = run({ top: w.top })['collarbone-chest'];
    assert.equal(run(w)['collarbone-chest'].text, before.text, `${zh}/${style}`);
  }
  assert.equal(run({ top: get('topId', '長版襯衫'), topStyling: get('topStylingId', '下擺打結') })['abdomen-navel'].status, 'needs-source-review');
});
test('A: shirt and hoodies retain local material with reviewed fit, without releasing inner coverage', () => {
  for (const zh of ['長版襯衫', '連帽外套', '連帽外套_戴']) for (const fit of ['合身', '緊身', 'Oversize']) {
    const w = { top: get('topId', '高領連身上衣'), outerwear: get('outerwearId', zh),
      outerwearFit: get('outerwearFitId', fit), outerwearOpening: get('outerwearOpeningId', '敞開穿') };
    const b = run(w);
    assert.equal(b['collarbone-chest'].status, 'ready', `${zh}/${fit}`);
    assert.notEqual(b['abdomen-navel'].coverage.navelPosition, 'exposed');
    const stale = run({ ...w, outerwearFit: { ...w.outerwearFit, en: `${w.outerwearFit.en}, lifted hem` } });
    assert.equal(stale['collarbone-chest'].status, 'needs-source-review');
    assert.equal(run({ ...w, outerwearFit: get('outerwearFitId', '短版 Oversize') })['collarbone-chest'].status, 'needs-source-review');
  }
});
test('A: chest hair has an independent local layer; unknown drape never asserts bare collarbones', () => {
  const w = { top: get('topId', '一字領上衣') };
  const unknown = run(w, { hairstyle: get('hairstyleId', '柔波：深側分') })['collarbone-chest'];
  assert.notEqual(unknown.coverage.collarbone, 'exposed');
  assert.doesNotMatch(unknown.text, /open collarbone|deep side-parted/);
  const known = run(w, { hairstyle: get('hairstyleId', '自然層次鎖骨髮') })['collarbone-chest'];
  assert.equal(known.status, 'ready');
  assert.match(known.text, /collarbone-length layered hair/);
  assert.doesNotMatch(known.text, /open collarbone/);
  const short = run(w, { hairstyle: get('hairstyleId', '帥氣濕亮油頭') })['collarbone-chest'];
  assert.equal(short.coverage.collarbone, 'exposed');
  const wind = run(w, { hairstyle: get('hairstyleId', '自然層次鎖骨髮'), hairStylingState: get('hairStylingStateId', '強烈風感') })['collarbone-chest'];
  assert.equal(wind.status, 'needs-source-review');
});

test('A: the twelve waist pairs keep ownership across four rises and two outer openings', () => {
  for (const top of ['高領連身上衣', '長版寬鬆麻花針織毛衣', '長版襯衫'])
    for (const [slot, key, zh] of [['pants', 'pantsId', '直筒牛仔褲'], ['pants', 'pantsId', '運動棉褲'],
      ['skirt', 'skirtId', '皮革迷你裙'], ['skirt', 'skirtId', '絲質長裙']])
      for (const rise of ['正常腰線', '高腰', '低腰', '超低腰']) for (const outer of ['長版襯衫', '蕾絲罩衫']) {
        const w = { top: get('topId', top), [slot]: get(key, zh), bottomRise: get('bottomRiseId', rise),
          outerwear: get('outerwearId', outer), outerwearOpening: get('outerwearOpeningId', '敞開穿'),
          outerwearStyling: get('outerwearStylingId', '正常穿著') };
        const r = run(w)['abdomen-navel'];
        // Normal waist has no confirmed navel alignment; the outer side panels
        // also hide the otherwise-known waistband surface. Do not force ready.
        assert.equal(r.status, top === '高領連身上衣' && rise === '正常腰線' ? 'needs-source-review' : 'ready', `${top}/${zh}/${rise}/${outer}`);
        assert.notEqual(r.coverage.navelPosition, 'exposed');
      }
});

test('A: live face crop retains locked accessory evidence without changing saved selection', () => {
  const base = createEmptyLocks();
  for (const c of controls) { const none = c.options?.find(o => o.zh === '全無'); if (none) base[c.key] = none.id; }
  Object.assign(base, { dressId: get('dressId', '連身：短版｜亮面乳膠拉鏈洋裝').id,
    waistAccessoryId: get('waistAccessoryId', '肚臍環').id });
  const result = framing => generatePrompts(1, { ...base, framingId: get('framingId', framing).id }, [],
    { random: createSeededRandom('local-A-crop') })[0];
  const full = result('全身鏡頭 (Full Body Shot)');
  const close = result('局部五官特寫');
  assert.match(close.localDetailPrompts['abdomen-navel'].text, /navel piercing/);
  assert.equal(close.localDetailPrompts['abdomen-navel'].text, full.localDetailPrompts['abdomen-navel'].text);
});

test('A: legacy reviewed source and modifier role cannot be spoofed by retaining an old excerpt', () => {
  const top = get('topId', '一字領上衣');
  assert.equal(run({ top: { ...top, en: `${top.en}, now covered by a high collar` } })['collarbone-chest'].status, 'needs-source-review');
  assert.equal(run({ top, topPattern: { en: 'top hem tucked neatly into the bottoms' } })['collarbone-chest'].status, 'needs-source-review');
  const dress = get('dressId', '連身：短版｜亮面乳膠拉鏈洋裝');
  assert.notEqual(run({ dress: { ...dress, en: `${dress.en}, zipper now closed` } })['abdomen-navel'].coverage.navelPosition, 'exposed');
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getLockControls } from '../engine.js';
import { buildResolvedLocalDetailBundle } from './localDetailResolvedAdapter.js';

const controls = getLockControls();
const option = (key, zh) => {
  const item = controls.find((c) => c.key === key)?.options.find((o) => o.zh === zh);
  assert.ok(item, `${key}/${zh}`);
  return item;
};
const input = (wardrobe) => ({ subjectCount: 1, imageType: 'photorealistic-photo', wardrobe });
const chest = (wardrobe) => buildResolvedLocalDetailBundle(input(wardrobe))['collarbone-chest'];
const abdomen = (wardrobe) => buildResolvedLocalDetailBundle(input(wardrobe))['abdomen-navel'];

test('reviewed high neck covers all chest regions without forcing visible skin', () => {
  for (const zh of ['高領針織上衣', '高領連身上衣']) {
    const result = chest({ top: option('topId', zh) });
    assert.equal(result.status, 'ready');
    assert.deepEqual(Object.values(result.coverage), ['covered', 'covered', 'covered']);
    assert.doesNotMatch(result.text, /bare skin|sleeveless|bodysuit/);
  }
});

test('reviewed blouse fabric is retained without importing complete clothing', () => {
  for (const [zh, fragment] of [['襯衫', 'crisp cotton poplin'], ['絲綢緞面襯衫', 'luminous satin sheen'],
    ['短袖上衣', 'smooth stretch fabric'], ['落肩 T 恤', 'washed cotton jersey']]) {
    const result = chest({ top: option('topId', zh) });
    assert.equal(result.status, 'ready', zh);
    assert.ok(result.text.includes(fragment));
    assert.doesNotMatch(result.text, /sleeve|cuff|dropped-shoulder|bare skin/);
  }
});

test('short or sheer does not establish an exposed navel', () => {
  for (const zh of ['短版 T 恤', '短版蕾絲背心', '短版帽T', '網紗透視上衣']) {
    const result = abdomen({ top: option('topId', zh), waistAccessory: option('waistAccessoryId', '肚臍環') });
    assert.notEqual(result.coverage.navelPosition, 'exposed');
    assert.doesNotMatch(result.text, /piercing|bare skin/);
  }
});

test('longline sweater covers the abdomen; longline shirt retains fabric without assuming closure', () => {
  for (const [zh, state, fragment] of [['長版寬鬆麻花針織毛衣', 'covered', 'chunky knit texture'],
    ['長版襯衫', 'unknown', 'crisp woven poplin']]) {
    const result = abdomen({ top: option('topId', zh), waistAccessory: option('waistAccessoryId', '肚臍環') });
    assert.equal(result.status, 'ready');
    assert.equal(result.coverage.navelPosition, state);
    assert.ok(result.text.includes(fragment));
    assert.doesNotMatch(result.text, /piercing|upper-thigh|sleeves|menswear|bare skin/);
  }
});

test('new longline coverage rejects changed source and effective hem styling', () => {
  const top = option('topId', '長版寬鬆麻花針織毛衣');
  for (const wardrobe of [{ top: { ...top, en: `${top.en}, rolled above the navel` } },
    { top, topStyling: option('topStylingId', '下擺打結') }]) {
    assert.equal(abdomen(wardrobe).status, 'needs-source-review');
  }
});

test('camisole shoulder straps remain local, without assuming full chest exposure', () => {
  for (const zh of ['棉質細肩背心', '絲質細肩帶上衣', '短版吊帶背心']) {
    const result = chest({ top: option('topId', zh) });
    assert.equal(result.status, 'ready', zh);
    assert.match(result.text, /straps/);
    assert.notEqual(result.coverage.upperChest, 'exposed');
    assert.doesNotMatch(result.text, /camisole|torso block|bare skin/);
  }
});

test('local straps retain their garment color rather than an unrelated outer color', () => {
  const result = buildResolvedLocalDetailBundle({ ...input({ top: option('topId', '棉質細肩背心') }),
    colors: { topColor: { en: 'white' }, outerwearColor: { en: 'red' } } })['collarbone-chest'];
  assert.match(result.text, /slim shoulder straps in white/);
  assert.doesNotMatch(result.text, /\bred\b/);
});

test('reviewed outer fabric survives unknown closure while hiding the inner layer', () => {
  const result = chest({ outerwear: option('outerwearId', '長版襯衫'), top: option('topId', '高領連身上衣') });
  assert.equal(result.status, 'ready');
  assert.match(result.text, /cotton poplin/);
  assert.doesNotMatch(result.text, /smooth stretch|bare skin|shirttail|sleeves/);
  assert.equal(result.coverage.upperChest, 'unknown');
});

test('double shoulder slip only releases the collarbone, which still reads the inner garment', () => {
  const base = { outerwear: option('outerwearId', '長版襯衫'), outerwearStyling: option('outerwearStylingId', '雙肩露出') };
  const covered = chest({ ...base, top: option('topId', '高領連身上衣') });
  assert.equal(covered.coverage.collarbone, 'covered');
  assert.match(covered.text, /smooth stretch or ribbed fabric/);
  assert.doesNotMatch(covered.text, /open collarbone|bare skin|arms/);
  const open = chest({ ...base, top: option('topId', '一字領上衣') });
  assert.equal(open.coverage.collarbone, 'exposed');
  assert.match(open.text, /open collarbone line/);
  assert.equal(open.coverage.upperChest, 'unknown');
});

test('single shoulder and half closures do not release both collarbones or the navel', () => {
  for (const zh of ['單肩露出', '雙肩露出']) {
    const wardrobe = { outerwear: option('outerwearId', '長版襯衫'), outerwearStyling: option('outerwearStylingId', zh),
      top: option('topId', '一字領上衣') };
    if (zh === '單肩露出') assert.equal(chest(wardrobe).coverage.collarbone, 'unknown');
    assert.notEqual(abdomen(wardrobe).coverage.navelPosition, 'exposed');
  }
});

test('changed sources, unknown fits and patterns do not reuse reviewed geometry', () => {
  const top = option('topId', '高領針織上衣');
  for (const wardrobe of [{ top: { ...top, en: `${top.en}, cut-out chest` } },
    { top, topFit: { en: 'unreviewed fit' } }, { top, topPattern: { en: 'unreviewed pattern' } }]) {
    assert.equal(chest(wardrobe).status, 'needs-source-review');
  }
});

test('outer source and styling must both match; no garment is not bare skin', () => {
  const outerwear = option('outerwearId', '長版襯衫');
  const outerwearOpening = option('outerwearOpeningId', '敞開穿');
  const top = option('topId', '高領連身上衣');
  const stale = abdomen({ outerwear, outerwearOpening, top,
    outerwearStyling: { zh: '正常穿著', en: 'changed coverage' } });
  assert.equal(stale.status, 'needs-source-review');
  assert.notEqual(abdomen({ outerwear, outerwearOpening }).coverage.navelPosition, 'exposed');
  assert.notEqual(abdomen({ top, pants: { zh: 'unknown', en: 'unknown trousers' } }).coverage.navelPosition, 'exposed');
});

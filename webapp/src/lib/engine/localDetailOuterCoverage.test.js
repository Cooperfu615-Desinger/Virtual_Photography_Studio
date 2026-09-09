import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getLockControls } from '../engine.js';
import { buildResolvedLocalDetailBundle } from './localDetailResolvedAdapter.js';
const controls = getLockControls();
const get = (key, zh) => {
  const item = controls.find(c => c.key === key)?.options.find(o => o.zh === zh);
  assert.ok(item, `${key}/${zh}`);
  return item;
};
const run = wardrobe => buildResolvedLocalDetailBundle({ subjectCount: 1, imageType: 'photorealistic-photo', wardrobe });
const cases = [['西裝外套', 'polished suiting fabric'], ['丹寧外套', 'washed denim texture'],
  ['連帽外套', 'casual performance knit structure'], ['連帽外套_戴', 'relaxed knit body'],
  ['柔軟毛絨泰迪熊外套', 'plush pile texture'], ['薄紗輕薄披衣外套', 'translucent gauze mesh fabric'],
  ['短版粗花呢外套', 'textured woven surface'], ['蕾絲罩衫', 'lightweight lace texture']];
for (const [zh, text] of cases) test(`outer local source: ${zh}`, () => {
  const outerwear = get('outerwearId', zh);
  const result = run({ outerwear, top: get('topId', '高領連身上衣') })['collarbone-chest'];
  assert.equal(result.status, 'ready');
  assert.ok(result.text.includes(text));
  assert.doesNotMatch(result.text, /sleeves|cuffs|hood worn|bare skin/);
  const stale = run({ outerwear: { ...outerwear, en: `${outerwear.en}, altered coverage` } })['collarbone-chest'];
  assert.equal(stale.status, 'needs-source-review');
});
test('sheer fabric retains transparency without exposing underlying skin or inventing inner fabric visibility', () => {
  const result = run({ outerwear: get('outerwearId', '薄紗輕薄披衣外套'), top: get('topId', '一字領上衣') })['collarbone-chest'];
  assert.match(result.text, /translucent gauze mesh fabric/);
  assert.doesNotMatch(result.text, /open collarbone|bare skin/);
});
test('long open lace central opening still respects opaque inner clothing and missing base', () => {
  const outerwear = get('outerwearId', '蕾絲罩衫');
  const result = run({ outerwear, top: get('topId', '高領連身上衣'), waistAccessory: get('waistAccessoryId', '肚臍環') })['abdomen-navel'];
  assert.equal(result.coverage.navelPosition, 'covered');
  assert.match(result.text, /smooth stretch or ribbed fabric/);
  assert.doesNotMatch(result.text, /piercing|bare skin/);
  assert.notEqual(run({ outerwear })['abdomen-navel'].coverage.navelPosition, 'exposed');
});
test('new outer double shoulder release does not remove high neck inner coverage', () => {
  const result = run({ outerwear: get('outerwearId', '丹寧外套'), outerwearStyling: get('outerwearStylingId', '雙肩露出'),
    top: get('topId', '高領連身上衣') })['collarbone-chest'];
  assert.equal(result.coverage.collarbone, 'covered');
  assert.match(result.text, /smooth stretch or ribbed fabric/);
});
test('short hem does not promise an exposed navel; incompatible closures and patterns remain barriers', () => {
  const outerwear = get('outerwearId', '短版粗花呢外套');
  assert.notEqual(run({ outerwear })['abdomen-navel'].coverage.navelPosition, 'exposed');
  for (const extra of [{ outerwearOpening: get('outerwearOpeningId', '拉鏈拉一半') },
    { outerwearPattern: { en: 'unreviewed pattern' } }, { outerwearFit: { en: 'unreviewed fit' } }]) {
    assert.equal(run({ outerwear, ...extra })['collarbone-chest'].status, 'needs-source-review');
  }
});

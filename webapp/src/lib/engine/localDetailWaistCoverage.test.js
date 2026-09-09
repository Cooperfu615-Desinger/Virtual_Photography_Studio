import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getLockControls } from '../engine.js';
import { buildResolvedLocalDetailBundle } from './localDetailResolvedAdapter.js';
const controls = getLockControls();
const get = (key, zh) => {
  const item = controls.find(c => c.key === key)?.options.find(o => o.zh === zh);
  assert.ok(item, `${key}/${zh}`); return item;
};
const base = () => ({ top: get('topId', '高領連身上衣'), pants: get('pantsId', '直筒牛仔褲'),
  waistAccessory: get('waistAccessoryId', '肚臍環') });
const run = (wardrobe, colors = {}) => buildResolvedLocalDetailBundle({ subjectCount: 1,
  imageType: 'photorealistic-photo', wardrobe, colors })['abdomen-navel'];
test('low waistband reads inner bodysuit instead of exposing the navel', () => {
  const result = run({ ...base(), bottomRise: get('bottomRiseId', '低腰') });
  assert.equal(result.coverage.navelPosition, 'covered');
  assert.match(result.text, /smooth stretch or ribbed fabric/);
  assert.match(result.text, /low-rise waistband sitting on the hips/);
  assert.doesNotMatch(result.text, /piercing|bare skin/);
});
test('high waistband owns the navel surface and its own color', () => {
  const result = run({ ...base(), bottomRise: get('bottomRiseId', '高腰') }, { topColor: { en: 'white' }, bottomColor: { en: 'black' } });
  assert.equal(result.coverage.navelPosition, 'covered');
  assert.match(result.text, /clean denim texture in black/);
  assert.doesNotMatch(result.text, /smooth stretch|piercing|in white/);
});
test('long sweater outside waistband hides waist fabric and piercing', () => {
  const result = run({ ...base(), top: get('topId', '長版寬鬆麻花針織毛衣'),
    topStyling: get('topStylingId', '自然放出'), bottomRise: get('bottomRiseId', '高腰') });
  assert.equal(result.coverage.navelPosition, 'covered');
  assert.match(result.text, /chunky knit texture/);
  assert.doesNotMatch(result.text, /denim|waistband|piercing/);
});
test('tucked long sweater puts reviewed waist outside the upper garment', () => {
  const result = run({ ...base(), top: get('topId', '長版寬鬆麻花針織毛衣'),
    topStyling: get('topStylingId', '紮入下身'), bottomRise: get('bottomRiseId', '高腰') });
  assert.match(result.text, /clean denim texture/);
  assert.doesNotMatch(result.text, /chunky knit|piercing/);
});
test('half tuck, knot, custom modifiers, bibs and dual bottoms do not borrow a reviewed order', () => {
  for (const extra of [{ topStyling: get('topStylingId', '半紮') }, { topStyling: get('topStylingId', '下擺打結') },
    { bottomRise: { en: 'custom waist position' } }, { bottomPattern: { en: 'custom print' } },
    { pants: get('pantsId', '丹寧吊帶短褲') }, { skirt: get('skirtId', '迷你裙') }]) {
    const result = run({ ...base(), ...extra });
    assert.equal(result.status, 'needs-source-review');
    assert.doesNotMatch(result.text, /piercing/);
  }
});
test('normal waist does not assert navel exposure; reviewed skirt keeps local fabric', () => {
  for (const [zh, fabric] of [['皮革迷你裙', 'glossy surface'], ['絲質長裙', 'soft reflective sheen']]) {
    const result = run({ top: get('topId', '高領連身上衣'), skirt: get('skirtId', zh), bottomRise: get('bottomRiseId', '正常腰線') });
    assert.equal(result.coverage.navelPosition, 'unknown');
    assert.ok(result.text.includes(fabric));
    assert.doesNotMatch(result.text, /maxi|mini skirt|bare skin/);
  }
});
test('outerwear remains outside reviewed waist; stale sources and complex colors are rejected', () => {
  const b = base();
  assert.equal(run({ ...b, outerwear: { zh: 'unknown', en: 'unknown covering' } }).status, 'needs-source-review');
  assert.equal(run({ ...b, pants: { ...b.pants, en: `${b.pants.en}, modified` } }).status, 'needs-source-review');
  assert.equal(run(b, { bottomColor: { en: 'red top, green bottom' } }).status, 'needs-source-review');
});

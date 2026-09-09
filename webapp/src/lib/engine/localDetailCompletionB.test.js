import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getLockControls } from '../engine.js';
import { buildResolvedLocalDetailBundle as build } from './localDetailResolvedAdapter.js';
const controls = getLockControls();
const get = (key, zh) => { const i = controls.find(c => c.key === key)?.options.find(o => o.zh === zh); assert.ok(i, `${key}/${zh}`); return i; };
const run = w => build({ subjectCount: 1, imageType: 'photorealistic-photo', wardrobe: w });
test('B: collarbone chain is local only where the underlying neckline is open', () => {
  for (const name of ['街頭風格金項鏈', '鎖骨細金屬鏈']) {
    const neckAccessory = get('neckAccessoryId', name);
    const open = run({ top: get('topId', '一字領上衣'), neckAccessory })['collarbone-chest'];
    assert.equal(open.status, 'ready');
    assert.match(open.text, /chain|necklace/);
    assert.doesNotMatch(open.text, /bare skin|open collarbone line/);
    const covered = run({ top: get('topId', '高領連身上衣'), neckAccessory })['collarbone-chest'];
    assert.equal(covered.status, 'ready');
    assert.match(covered.text, /smooth stretch/);
    assert.doesNotMatch(covered.text, /chain|necklace/);
  }
});
test('B: pendant/choker unknown placement does not erase known outer textile or force a pendant into view', () => {
  for (const name of ['皮革 O 環頸圈', '水滴寶石吊墜項鍊', 'Y字垂墜項鍊']) {
    const r = run({ top: get('topId', '高領連身上衣'), neckAccessory: get('neckAccessoryId', name) })['collarbone-chest'];
    assert.equal(r.status, 'ready');
    assert.doesNotMatch(r.text, /pendant|choker|lariat/);
  }
});
test('B: three hip belts are outside the navel crop and cannot pull it down to hips', () => {
  for (const name of ['細版皮革腰帶', '寬版皮革腰帶', '鉚釘皮革腰帶']) {
    const r = run({ top: get('topId', '高領連身上衣'), waistAccessory: get('waistAccessoryId', name) })['abdomen-navel'];
    assert.equal(r.status, 'ready');
    assert.match(r.text, /smooth stretch/);
    assert.doesNotMatch(r.text, /leather|buckle|stud/);
    assert.ok(r.diagnostics.includes('outside-local-crop:wardrobe.waistAccessory'));
  }
});
test('B: five waist chains preserve covered cloth and do not invent position through a narrow opening', () => {
  for (const name of ['雙層銀鏈水晶腰鍊', '金色細鏈鑽石腰鍊', '雙層銀鏈愛心腰鍊', '愛心垂墜銀腰鍊', '銀色水鑽蝴蝶腰鏈']) {
    const waistAccessory = get('waistAccessoryId', name);
    const covered = run({ top: get('topId', '高領連身上衣'), waistAccessory })['abdomen-navel'];
    assert.equal(covered.status, 'ready');
    assert.doesNotMatch(covered.text, /chain|heart|butterfly/);
    const opened = run({ dress: get('dressId', '連身：短版｜亮面乳膠拉鏈洋裝'), waistAccessory })['abdomen-navel'];
    assert.notEqual(opened.coverage.navelPosition, 'exposed');
    assert.doesNotMatch(opened.text, /bare skin|pendant|butterfly/);
  }
});
test('B: waist cincher is a clothing-overlaid surface, still behind outerwear', () => {
  const w = { top: get('topId', '高領連身上衣'), waistAccessory: get('waistAccessoryId', '馬甲束腰') };
  const r = run(w)['abdomen-navel'];
  assert.equal(r.status, 'ready');
  assert.match(r.text, /black leather waist cincher/);
  assert.doesNotMatch(r.text, /bare skin|piercing|smooth stretch/);
  assert.equal(run({ ...w, outerwear: { zh: 'unknown', en: 'unknown outer covering' } })['abdomen-navel'].status, 'needs-source-review');
});
test('B: stale accessories never borrow reviewed location or expose skin', () => {
  const waistAccessory = get('waistAccessoryId', '鉚釘皮革腰帶');
  const r = run({ dress: get('dressId', '連身：短版｜高領挖腰連身泳裝'),
    waistAccessory: { ...waistAccessory, en: `${waistAccessory.en}, raised over the navel` } })['abdomen-navel'];
  assert.notEqual(r.coverage.navelPosition, 'exposed');
  assert.doesNotMatch(r.text, /bare skin|exposing/);
});

import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import { adaptLocalDetailLayer } from './localDetailSourceAdapter.js';
import { buildLocalDetailBundle } from './localDetailProjection.js';

const database = JSON.parse(fs.readFileSync(new URL('../../data/database.json', import.meta.url), 'utf8'));
const cases = [
  ['套裝 (Outfit Presets)', '亮面乳膠束帶套裝', 'abdomen-navel', 'navelPosition', 'covered', 'opaque mirror-polished latex'],
  ['連身 (Dresses)', '短版｜高領挖腰連身泳裝', 'abdomen-navel', 'navelPosition', 'exposed', 'gap exposing most of the abdomen and navel'],
  ['連身 (Dresses)', '短版｜亮面乳膠拉鏈洋裝', 'abdomen-navel', 'navelPosition', 'exposed', 'a vertical strip of bare skin'],
  ['上身 (Tops)', '一字領上衣', 'collarbone-chest', 'collarbone', 'exposed', 'open collarbone line'],
  ['上身 (Tops)', '透膚刺繡襯衫', 'collarbone-chest', 'upperChest', 'unknown', 'lightweight voile fabric'],
  ['上身 (Tops)', '高領連身上衣', 'abdomen-navel', 'navelPosition', 'covered', 'smooth stretch or ribbed fabric'],
];

for (const [category, zh, target, region, state, text] of cases) {
  test(`real catalog → reviewed layer → English local output: ${zh}`, () => {
    const item = database.Wardrobe[category].find((i) => i.zh === zh);
    assert.ok(item);
    const layer = adaptLocalDetailLayer({ key: 'garment', category, item, target });
    const result = buildLocalDetailBundle({ subjectCount: 1, imageType: 'photorealistic-photo',
      sources: { garment: item }, targets: { [target]: { layers: [layer] } } })[target];
    assert.equal(result.status, 'ready');
    assert.equal(result.coverage[region], state);
    assert.ok(result.text.includes(text));
    assert.doesNotMatch(result.text, /full-body catsuit|one-piece bodycon silhouette|high-neck chest panel|neckline resting below both shoulders/);
    for (const ref of result.sourceRefs) assert.ok(item.en.includes(ref.excerpt));
    // Explicit effective modifiers require their own reviewed regional rule.
    assert.deepEqual(adaptLocalDetailLayer({ key: 'garment', category, item, target, modifiers: [{ en: 'modified' }] }).regions, {});
    assert.deepEqual(adaptLocalDetailLayer({ key: 'garment', category, item: { ...item, en: '' }, target }).regions, {});
  });
}

test('unsupported special outfit and shoulder-wear source are barriers, not exposure', () => {
  for (const item of [{ zh: 'unknown', en: 'navel exposed' }, { zh: '雙肩露出', en: 'neckline resting below both shoulders' }]) {
    const layer = adaptLocalDetailLayer({ key: 'item', category: '外套穿法 (Outerwear Styling)', item, target: 'abdomen-navel' });
    assert.deepEqual(layer, { id: 'item', regions: {}, details: [] });
  }
});

test('an exposed garment opening cannot expose skin through a covered inner layer', () => {
  const category = '連身 (Dresses)';
  const outer = database.Wardrobe[category].find((i) => i.zh === '短版｜亮面乳膠拉鏈洋裝');
  const inner = database.Wardrobe['上身 (Tops)'].find((i) => i.zh === '高領連身上衣');
  const target = 'abdomen-navel';
  const result = buildLocalDetailBundle({ subjectCount: 1, imageType: 'photorealistic-photo', sources: { outer, inner },
    targets: { [target]: { layers: [
      adaptLocalDetailLayer({ key: 'outer', category, item: outer, target }),
      adaptLocalDetailLayer({ key: 'inner', category: '上身 (Tops)', item: inner, target }),
    ] } } })[target];
  assert.equal(result.coverage.navelPosition, 'covered');
  assert.doesNotMatch(result.text, /bare skin/);
});

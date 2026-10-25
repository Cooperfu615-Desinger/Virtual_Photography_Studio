import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, getKnowledgeBaseSnapshot, getLockControls, getSceneDependentOptions } from './engine.js';
import { SUBJECT_LIGHT_ADDITION_SOURCE_CASES } from './engine/subjectLightFixtures.js';

const category = '光線表現 (Light Style)';
const labels = SUBJECT_LIGHT_ADDITION_SOURCE_CASES.map(([label]) => label);
const controls = getLockControls();
const optionId = (key, label) => {
  const option = controls.find((control) => control.key === key)?.options.find((entry) => entry.zh === label);
  assert.ok(option, `Missing ${key}: ${label}`);
  return option.id;
};
const locksFor = (attribute, location, ambient) => ({
  ...createEmptyLocks(),
  subjectCount: '1',
  sceneAttributeId: attribute,
  framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
  locationId: optionId('locationId', location),
  lightingId: optionId('lightingId', ambient),
});
const scenarios = [
  ['indoor', '室內：女高生房間', '室內陰影日光'],
  ['indoor', '室內：女高生房間', '室內深夜冷暗微光'],
  ['indoor', '室內：純紫背景', '高調純白攝影棚'],
  ['indoor', '室內：純紫背景', '舞台演出燈光'],
  ['outdoor', '戶外：新宿歌舞伎町招牌下', '晴朗白日'],
  ['outdoor', '戶外：新宿歌舞伎町招牌下', '城市夜間混合光'],
  ['outdoor', '戶外：新宿歌舞伎町招牌下', '雨天陰濕'],
];
const available = (library, locks) => getSceneDependentOptions(library, locks).lightDirectionOptions.map((entry) => entry.zh);
const copyCatalog = () => getKnowledgeBaseSnapshot();
const sourceRow = (catalog, label) => {
  const row = catalog.CameraLighting[category].find((entry) => entry.zh === label);
  assert.ok(row, `Missing subject light source: ${label}`);
  return row;
};

for (const [label, source] of SUBJECT_LIGHT_ADDITION_SOURCE_CASES) {
  test(`${label} stays selectable as a full-body subject key in indoor, outdoor, day, night and studio settings`, () => {
    const row = sourceRow(copyCatalog(), label);
    assert.equal(row.subjectLight?.independentKey, true);
    assert.equal(row.subjectLight?.sourceEn, source);
    assert.equal(row.en, source);
    assert.ok(row.subjectLight.tags.includes('artificial_light'));
    assert.ok(!row.subjectLight.tags.includes('portrait_light'));
    for (const scenario of scenarios) {
      assert.ok(available([], locksFor(...scenario)).includes(label), `${label}: ${scenario.join(' / ')}`);
    }
  });
}

test('independent subject-key compatibility fails closed when the authored source changes without repinning', () => {
  const catalog = copyCatalog();
  for (const label of labels) sourceRow(catalog, label).en += ', unreviewed wording';
  const options = available(catalog, locksFor('outdoor', '戶外：新宿歌舞伎町招牌下', '晴朗白日'));
  for (const label of labels) assert.ok(!options.includes(label), label);
});

test('source marker does not grant arbitrary or existing lights the independent-key exemption', () => {
  const catalog = copyCatalog();
  const approved = sourceRow(catalog, '機頂直閃');
  const unknown = structuredClone(approved);
  delete unknown.stableId;
  delete unknown.legacyIds;
  delete unknown.meta.semantic; // This fixture represents an unreviewed legacy/custom source.
  unknown.zh = '未核准人物主光';
  catalog.CameraLighting[category].push(unknown);
  const oldSun = sourceRow(catalog, '硬質晴光');
  oldSun.subjectLight = { ...structuredClone(approved.subjectLight), sourceEn: oldSun.en };
  assert.ok(!available(catalog, locksFor('outdoor', '戶外：新宿歌舞伎町招牌下', '晴朗白日')).includes(unknown.zh));
  assert.ok(!available(catalog, locksFor('outdoor', '戶外：新宿歌舞伎町招牌下', '雨天陰濕')).includes(oldSun.zh));
});

test('independent-key exemptions retain authored indoor/outdoor scope boundaries', () => {
  const catalog = copyCatalog();
  for (const label of labels) sourceRow(catalog, label).subjectLight.tags = ['artificial_light', 'supports_indoor'];
  const outdoors = locksFor('outdoor', '戶外：新宿歌舞伎町招牌下', '城市夜間混合光');
  for (const label of labels) {
    assert.ok(!available(catalog, outdoors).includes(label), `${label}: explicit outdoor attribute`);
    assert.ok(!available(catalog, { ...outdoors, sceneAttributeId: 'none' }).includes(label), `${label}: outdoor location`);
    assert.ok(available(catalog, locksFor('indoor', '室內：女高生房間', '室內深夜冷暗微光')).includes(label), `${label}: indoor scope`);
  }
});

test('new subject keys do not widen old portrait, sun, projection or high-key compatibility rules', () => {
  const day = available([], locksFor('outdoor', '戶外：新宿歌舞伎町招牌下', '晴朗白日'));
  assert.ok(day.includes('硬質晴光'));
  assert.ok(!day.includes('側向硬光'));
  const rain = available([], locksFor('outdoor', '戶外：新宿歌舞伎町招牌下', '雨天陰濕'));
  assert.ok(!rain.includes('硬質晴光'));
  const night = available([], locksFor('outdoor', '戶外：新宿歌舞伎町招牌下', '城市夜間混合光'));
  assert.ok(!night.includes('高調亮光'));
  assert.ok(!night.includes('窗格投影光'));
  const studio = available([], locksFor('indoor', '室內：純紫背景', '高調純白攝影棚'));
  assert.ok(!studio.includes('斑駁樹影光'));
  assert.ok(!studio.includes('潮濕反射光'));
  assert.ok(!studio.includes('柔和順光'));
});

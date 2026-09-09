import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getLockControls, createEmptyLocks, generatePrompts, createSeededRandom } from '../engine.js';
import { buildResolvedLocalDetailBundle as build } from './localDetailResolvedAdapter.js';
const controls = getLockControls();
const get = (key, zh) => { const item = controls.find(c => c.key === key)?.options.find(o => o.zh === zh); assert.ok(item, `${key}/${zh}`); return item; };
const base = { subjectCount: 1, imageType: 'photorealistic-photo', wardrobe: { top: get('topId', '高領連身上衣') } };
test('C: all twenty-five subject lights have source-traceable local fragments, not whole-face geometry', () => {
  const options = controls.find(c => c.key === 'lightDirectionId').options.filter(o => o.zh !== '全無');
  assert.equal(options.length, 25);
  for (const lightDirection of options) {
    const r = build({ ...base, lightDirection })['abdomen-navel'];
    assert.equal(r.status, 'ready');
    assert.ok(r.sourceRefs.some(ref => ref.key === 'lightDirection'), lightDirection.zh);
    assert.doesNotMatch(r.text, /window|ground|walls|cheek|nose|full-face|sky|lamp|hands|shoulder/i);
    const stale = build({ ...base, lightDirection: { ...lightDirection, en: `${lightDirection.en}, altered direction` } })['abdomen-navel'];
    assert.ok(stale.diagnostics.includes('unreviewed-effect:lightDirection'));
    assert.ok(!stale.sourceRefs.some(ref => ref.key === 'lightDirection'));
  }
});
test('C: three skin textures follow exposed torso regions and never turn covered cloth into skin', () => {
  for (const zh of ['玻璃水光肌', '柔霧細緻肌', '微曬陽光感膚質']) {
    const character = { skinDetails: get('skinDetailsId', zh) };
    const open = build({ ...base, character, wardrobe: { dress: get('dressId', '連身：短版｜亮面乳膠拉鏈洋裝') } })['abdomen-navel'];
    assert.ok(open.sourceRefs.some(r => r.key === 'character.skinDetails'), zh);
    const chest = build({ ...base, character, wardrobe: { top: get('topId', '一字領上衣') } })['collarbone-chest'];
    assert.ok(chest.sourceRefs.some(r => r.key === 'character.skinDetails'));
    const covered = build({ ...base, character })['abdomen-navel'];
    assert.ok(!covered.sourceRefs.some(r => r.key === 'character.skinDetails'));
  }
});
test('C: finite film, optical and environment sources never import background or camera settings', () => {
  for (const [slot, key, names] of [
    ['film', 'filmId', ['富士 Provia 清透明亮', '日系亮膚高彩濾鏡', '日系雜誌高彩銳利', '高階黑白灰階']],
    ['opticalEffect', 'opticalEffectId', ['霧化高光 Bloom', '柔焦濾鏡 Soft Focus', '色差 Chromatic Aberration']],
    ['lighting', 'lightingId', ['室內冷白環境光', '高調純白攝影棚', '柔霧美妝攝影棚']],
  ]) for (const name of names) {
    const selected = get(key, name);
    const r = build({ ...base, [slot]: selected })['abdomen-navel'];
    assert.ok(r.sourceRefs.some(ref => ref.key === slot), name);
    assert.doesNotMatch(r.text, /background|room|studio|portrait|full-body|85mm|bokeh/i);
    const stale = build({ ...base, [slot]: { ...selected, en: `${selected.en}, custom` } })['abdomen-navel'];
    assert.ok(stale.diagnostics.includes(`unreviewed-effect:${slot}`));
  }
});
test('C: omitted effects have diagnostics, no text fallback and no false ready target', () => {
  const film = get('filmId', 'VHS 錄影帶低畫質');
  const r = build({ ...base, film })['abdomen-navel'];
  assert.equal(r.status, 'ready');
  assert.ok(r.diagnostics.includes('unreviewed-effect:film'));
  assert.doesNotMatch(r.text, /VHS|scanlines/);
  const empty = build({ ...base, wardrobe: {}, lightDirection: get('lightDirectionId', '高調亮光'), film });
  assert.ok(Object.values(empty).every(r => r.text === '' && r.status === 'needs-source-review'));
});
test('C: live generation passes the actual selected effect sources into local text', () => {
  const locks = createEmptyLocks();
  for (const c of controls) { const n = c.options?.find(o => o.zh === '全無'); if (n) locks[c.key] = n.id; }
  for (const [key, zh] of Object.entries({ topId: '高領連身上衣', filmId: '日系雜誌高彩銳利', opticalEffectId: '霧化高光 Bloom',
    lightingId: '室內冷白環境光', lightDirectionId: '側向硬光', framingId: '局部五官特寫' })) locks[key] = get(key, zh).id;
  const p = generatePrompts(1, locks, [], { random: createSeededRandom('local-C-effects') })[0];
  const r = p.localDetailPrompts['abdomen-navel'];
  assert.match(r.text, /vivid editorial saturation/);
  assert.match(r.text, /highlight bloom/);
  assert.match(r.text, /cool-white ambient cast/);
  assert.match(r.text, /hard side key light/);
  for (const key of ['filmId', 'opticalEffectId', 'lightingId', 'lightDirectionId']) assert.equal(p.selection[key], locks[key]);
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { projectZImageDirectionalSource, GROUND_SOURCE_REDUCTIONS, SKY_SOURCE_REDUCTIONS } from './zImageSceneDirection.js';
import { runSceneFixture } from './sceneIntegratedAssemblyTestSupport.js';
import { SCENE_INTEGRATED_ASSEMBLY_FIXTURES } from './sceneIntegratedAssemblyFixtures.js';

const project = (text, zh, options = {}) => projectZImageDirectionalSource(text, { zh }, options);
const low = ['腰部高度鏡頭', '膝蓋高度鏡頭', '地面高度鏡頭', '蟲眼視角鏡頭'];
const high = ['高位俯視鏡頭', '鳥瞰視角', '正上方俯視鏡頭'];
const source = 'traditional Japanese ryokan engawa veranda, raised wooden deck edge, sliding door frames';

test('every authored reduction is traceable to the unchanged catalog and handles its exact source', () => {
  const db = JSON.parse(readFileSync(new URL('../../data/database.json', import.meta.url), 'utf8'));
  const sources = [...Object.values(db.Locations).flat(), ...Object.values(db.CameraLighting).flat()]
    .map((row) => row.en.toLowerCase()).join('\n');
  for (const [rules, angle] of [[GROUND_SOURCE_REDUCTIONS, low[0]], [SKY_SOURCE_REDUCTIONS, high[0]]]) {
    for (const [text, replacement] of Object.entries(rules)) {
      assert.ok(sources.includes(text), `catalog drift needs review: ${text}`);
      assert.equal(project(text, angle), replacement);
      assert.equal(project(text, '平視高度鏡頭'), text);
    }
  }
});

test('camera height, not framing or word occurrence, owns the ground omission', () => {
  for (const angle of low) assert.equal(project(source, angle, { preserveIdentity: true }),
    'traditional Japanese ryokan engawa veranda, sliding door frames');
  for (const angle of [...high, '肩部高度鏡頭', '平視高度鏡頭', '全無', '', 'unknown']) {
    assert.equal(project(source, angle, { preserveIdentity: true }), source);
  }
  assert.equal(project('floor-level camera, grounded posture, large floor-to-ceiling window', low[0]),
    'floor-level camera, grounded posture, large floor-to-ceiling window');
});

test('mixed fragments retain walls and ceilings; place identity and unknown source survive', () => {
  assert.equal(project('balcony floor edge and wall corner, mirrored floor and mirrored ceiling', low[0]),
    'wall corner, mirrored ceiling');
  assert.equal(project('stone floor, sliding door frames', low[0], { preserveIdentity: true }),
    'stone floor, sliding door frames');
  assert.equal(project('unreviewed custom floor detail', low[0]), 'unreviewed custom floor detail');
  assert.equal(project('tiled floor', low[0]), '');
});

test('downward cameras omit visible sky but preserve ambient state and light effects', () => {
  for (const angle of high) {
    assert.equal(project('blue hour environment, deep blue dusk sky, cool ambient light', angle),
      'blue hour environment, cool ambient light');
    assert.equal(project('sky and treetop fragments outside', angle), 'treetop fragments outside');
    assert.equal(project('charcoal-gray pre-rain sky, layered dark storm clouds', angle),
      'charcoal-gray pre-rain atmosphere');
  }
  for (const angle of [...low, '肩部高度鏡頭', '平視高度鏡頭', '全無']) {
    assert.equal(project('blue hour environment, deep blue dusk sky', angle), 'blue hour environment, deep blue dusk sky');
  }
  assert.equal(project('wet-surface reflected fill light on the subject, cool ambient brightness from snow', low[0]),
    'wet-surface reflected fill light on the subject, cool ambient brightness from snow');
});

const base = SCENE_INTEGRATED_ASSEMBLY_FIXTURES.find((f) => f.id === 'R04-standing');
const fixture = (angle, location = '戶外：日式旅館緣側木廊', lighting = '藍調傍晚') => ({
  ...base, seed: 'scene-direction-v1',
  locks: { ...base.locks, locationId: { byZh: location }, angleId: { byZh: angle }, lightingId: { byZh: lighting } },
});

test('runtime merges filtered scene before subject and never backfills hidden source clauses', () => {
  for (const angle of low) {
    const { outputs, selection } = runSceneFixture(fixture(angle));
    const text = outputs.zImagePrompt;
    assert.match(text.split('\n\n')[1], /The setting is traditional Japanese ryokan engawa veranda, sliding door frames\./);
    assert.doesNotMatch(text, /raised wooden deck edge|polished timber posts|stone step/i);
    assert.equal(text.match(/sliding door frames/gi)?.length, 1);
    assert.match(text, /deep blue dusk sky/i);
    assert.match(outputs.grokPrompt, /raised wooden deck edge/);
    assert.match(outputs.midjourneyPrompt, /raised wooden deck edge/);
    assert.ok(selection.locationId);
  }
  for (const angle of high) {
    const input = fixture(angle);
    input.locks.framingId = { byZh: '全身鏡頭 (Full Body Shot)' };
    const { outputs } = runSceneFixture(input);
    assert.match(outputs.zImagePrompt.split('\n\n')[1], /raised wooden deck edge/);
    assert.match(outputs.zImagePrompt, /blue hour environment/i);
    assert.doesNotMatch(outputs.zImagePrompt, /deep blue dusk sky/i);
    assert.match(outputs.grokPrompt, /deep blue dusk sky/i);
    assert.match(outputs.midjourneyPrompt, /deep blue dusk sky/i);
  }
});

test('indoor and street ground details are omitted, while unknown angle retains them', () => {
  for (const [location, detail] of [
    ['室內：日式和室', /tatami flooring/i],
    ['戶外：新宿歌舞伎町濕地反光角落', /reflective pavement patches/i],
  ]) {
    assert.doesNotMatch(runSceneFixture(fixture(low[0], location)).outputs.zImagePrompt, detail);
    assert.match(runSceneFixture(fixture('全無', location)).outputs.zImagePrompt, detail);
  }
});

test('all ambient options keep valid source-only output and light direction remains untouched', () => {
  const db = JSON.parse(readFileSync(new URL('../../data/database.json', import.meta.url), 'utf8'));
  const rows = Object.entries(db.CameraLighting).find(([key]) => key.includes('Ambient Light'))[1];
  for (const row of rows.filter((r) => r.en !== 'none')) {
    const { outputs } = runSceneFixture(fixture('高位俯視鏡頭', '全無', row.zh));
    const text = outputs.zImagePrompt;
    assert.doesNotMatch(text, /\bnone\b|undefined|The setting is|The scene is/i);
    assert.match(text, /neon color spill across the subject/i);
    assert.doesNotMatch(text, /deep blue dusk sky|dark night sky|cloud-covered sky|summer sky|pre-rain sky/i);
  }
});

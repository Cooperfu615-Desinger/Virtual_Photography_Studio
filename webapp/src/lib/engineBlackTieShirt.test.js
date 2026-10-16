import catalogProtected from './engine/midjourneyNaturalCatalogProtected.json' with { type: 'json' };
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { restorePreEthnicityOutputs } from './engine/ethnicityRevisionTestSupport.js';
import { test } from 'node:test';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls, normalizeLocks } from './engine.js';
import { deserializeFavoritePrompt, parseLocksFromStandardPrompt, serializeFavoritePrompt } from '../features/saved-cards/cardCodec.js';
import { BLACK_TIE_SHIRT_CONTRACT, PROMPT_OUTPUT_CONTRACT_VERSION } from './engine/promptOutputContracts.js';

const controls = getLockControls();
const NAME = '領帶襯衫';
const ID = 'wardrobe:上身-tops:領帶襯衫:3';
const LEGACY_SOURCE = 'collared shirt with a short soft necktie fastened at the collar, neat collar line, clean front placket, uniform-inspired shirt structure';
const SOURCE = 'collared shirt with a short soft black necktie fastened at the collar, neat collar line, clean front placket, uniform-inspired shirt structure';
const TIE = 'short soft black necktie';
const SEED = 'black-tie-shirt-preservation-v1';
const CROPS = ['局部五官特寫', '胸上特寫', '中景鏡頭 (Medium Shot)', '牛仔中景 (Cowboy Shot)', '全身鏡頭 (Full Body Shot)'];
const COLORS = ['白色', '紅色', '鏡面鉻銀', '彩色橫條紋'];
const option = (key, zh) => {
  const row = controls.find(c => c.key === key)?.options.find(o => o.zh === zh);
  assert.ok(row, `${key}/${zh}`);
  return row;
};
function noneLocks() {
  const locks = { ...createEmptyLocks(), subjectCount: '1' };
  for (const c of controls) {
    const none = c.options.find(o => o.zh === '全無');
    if (none) locks[c.key] = none.id;
  }
  return locks;
}
function generate(overrides = {}, seed = SEED) {
  return generatePrompts(1, { ...noneLocks(), topId: ID,
    framingId: option('framingId', '全身鏡頭 (Full Body Shot)').id, ...overrides }, [], { random: createSeededRandom(seed) })[0];
}
const outputs = p => Object.fromEntries([['grokPrompt', p.grokPrompt], ['zImagePrompt', p.zImagePrompt],
  ...p.extraPrompts.map(row => [row.id, row.text])]);
const main = p => [p.grokPrompt, p.zImagePrompt];
const all = p => Object.values(outputs(p));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const count = (text, phrase = TIE) => text.toLowerCase().split(phrase.toLowerCase()).length - 1;

// Captured before this source/target change. Includes every other existing top,
// all five crops and explicit ordinary/special swatches. Do not regenerate this
// hash to accommodate an unreviewed renderer change.
test('405 explicitly selected non-target top cases preserve selection and all six output bytes', () => {
  const topIds = controls.find(c => c.key === 'topId').options.filter(o => o.zh !== NAME).map(o => o.id);
  assert.equal(topIds.length, 45);
  const cases = [];
  for (const topId of topIds) for (const crop of CROPS) cases.push({ id: `${topId}/${crop}/none`,
    locks: { topId, framingId: option('framingId', crop).id } });
  for (const topId of topIds) for (const color of COLORS) cases.push({ id: `${topId}/cowboy/${color}`,
    locks: { topId, framingId: option('framingId', '牛仔中景 (Cowboy Shot)').id, topColorId: option('topColorId', color).id } });
  const captured = cases.map(row => {
    const p = generate(row.locks);
    // The frozen hash predates the 2026-10-14 ethnicity revision; reverse only that rollout.
    return { ...row, selectionHash: hash(p.selection), outputHash: hash(restorePreEthnicityOutputs(outputs(p))) };
  });
  assert.equal(captured.length, 405);
  assert.equal(hash(captured), catalogProtected.tie);
});

test('the existing tie-shirt identity fixes only the necktie black and declares its fabric color target', () => {
  assert.equal(Object.isFrozen(BLACK_TIE_SHIRT_CONTRACT), true);
  assert.equal(PROMPT_OUTPUT_CONTRACT_VERSION, '1.57.0');
  assert.match(BLACK_TIE_SHIRT_CONTRACT.source, /short soft black necktie/);
  assert.match(BLACK_TIE_SHIRT_CONTRACT.color, /shirt fabric only/);
  assert.match(BLACK_TIE_SHIRT_CONTRACT.projection, /existing crop, closed-outerwear and complete-look/);
  for (const key of ['topId', 'topAId', 'topBId']) {
    const top = option(key, NAME);
    assert.equal(top.id, ID);
    assert.equal(top.en, SOURCE);
    assert.equal(top.meta.wearableColorTarget, 'shirt fabric');
    assert.equal(top.meta.topUnderbust.baseEn, SOURCE);
    assert.ok(top.meta.legacyPromptAliases.includes(LEGACY_SOURCE));
  }
});

test('no chosen color keeps an unspecified shirt fabric and exactly one black necktie per visible output', () => {
  const p = generate();
  assert.equal(p.selection.topId, ID);
  assert.equal(p.selection.topColorId, option('topColorId', '全無').id);
  for (const text of all(p)) {
    assert.equal(count(text), 1);
    assert.doesNotMatch(text, /shirt fabric in|shirt fabric with/);
  }
  assert.ok(p.grokPrompt.includes(SOURCE));
  const imported = normalizeLocks(parseLocksFromStandardPrompt(p.grokPrompt, controls).locks);
  assert.equal(imported.topId, ID);
  assert.equal(imported.topColorId, option('topColorId', '全無').id);
});

test('ordinary swatches color only shirt fabric, never the fixed black tie', () => {
  for (const [zh, en] of [['白色', 'white'], ['紅色', 'red'], ['黑色', 'black']]) {
    const p = generate({ topColorId: option('topColorId', zh).id });
    for (const text of all(p)) {
      assert.equal(count(text), 1, zh);
      assert.equal(count(text, `shirt fabric in ${en}`), 1, zh);
      assert.doesNotMatch(text, new RegExp(`${en} collared shirt|short soft (?:red|white) necktie`, 'i'));
    }
    assert.equal(p.selection.topColorId, option('topColorId', zh).id);
  }
});

test('special swatch finish and stripe detail remain confined to the authored shirt-fabric target', () => {
  for (const color of COLORS.slice(2)) {
    const p = generate({ topColorId: option('topColorId', color).id });
    for (const text of all(p)) {
      assert.equal(count(text), 1);
      assert.match(text, /shirt fabric/i);
      if (color === '鏡面鉻銀') {
        assert.match(text, /shirt fabric in mirror-chrome silver with/i);
        assert.match(text, /highly polished scene-reflective surface|crisp environment reflections/i);
      } else {
        assert.match(text, /shirt fabric with/i);
        assert.match(text, /horizontal stripes/i);
      }
      assert.doesNotMatch(text, /silver necktie|striped necktie|mirror-chrome collared shirt/i);
    }
  }
});

test('short fits retain the same black tie and fabric-only color across all six outputs', () => {
  for (const topFitId of ['underbust-tight', 'underbust-fitted']) {
    const p = generate({ topFitId, topColorId: option('topColorId', '紅色').id });
    for (const text of all(p)) {
      assert.equal(count(text), 1);
      assert.equal(count(text, 'shirt fabric in red'), 1);
      assert.match(text, /underbust-cropped/);
    }
    assert.equal(p.selection.topId, ID);
    assert.equal(p.selection.topFitId, topFitId);
  }
});

test('visible crops retain the black tie while face-only crops do not reintroduce hidden wardrobe', () => {
  for (const crop of [...CROPS, '臉部特寫', '特寫鏡頭 (Close-Up)']) {
    const p = generate({ framingId: option('framingId', crop).id, topColorId: option('topColorId', '白色').id });
    // Legacy Close-Up is head-and-shoulders, not face-only: its existing
    // neckline visibility intentionally retains the collared shirt and tie.
    const hidden = ['局部五官特寫', '臉部特寫'].includes(crop);
    for (const text of main(p)) {
      assert.equal(count(text), hidden ? 0 : 1, crop);
      assert.equal(count(text, 'shirt fabric in white'), hidden ? 0 : 1, crop);
    }
    for (const row of p.extraPrompts) {
      assert.equal(count(row.text), 1, `${crop}/${row.id}`);
      assert.equal(count(row.text, 'shirt fabric in white'), 1, `${crop}/${row.id}`);
    }
    assert.equal(p.selection.topId, ID);
  }
});

test('duo colors and short fits stay attached to their own shirt without recoloring either tie', () => {
  const p = generate({ subjectCount: '2', topAId: ID, topBId: ID,
    topAColorId: option('topAColorId', '白色').id, topBColorId: option('topBColorId', '紅色').id,
    topFitAId: 'underbust-fitted', topFitBId: 'standard' });
  for (const text of main(p)) {
    assert.equal(count(text), 2);
    assert.equal(count(text, 'shirt fabric in white'), 1);
    assert.equal(count(text, 'shirt fabric in red'), 1);
  }
  const a = p.grokPrompt.split('Woman 1:')[1].split('Woman 2:')[0];
  const b = p.grokPrompt.split('Woman 2:')[1].split('Shared Expression:')[0];
  assert.match(a, /shirt fabric in white/);
  assert.doesNotMatch(a, /shirt fabric in red/);
  assert.match(b, /shirt fabric in red/);
  assert.doesNotMatch(b, /shirt fabric in white|underbust-cropped/);
  assert.equal(p.selection.topFitAId, 'underbust-fitted');
  assert.equal(p.selection.topFitBId, 'standard');
});

test('closed opaque outerwear hides the entire inner shirt and tie without deleting its raw selection', () => {
  const p = generate({ topColorId: option('topColorId', '紅色').id,
    outerwearId: option('outerwearId', '長版襯衫').id,
    outerwearOpeningId: option('outerwearOpeningId', '全扣上／全拉上').id });
  for (const text of all(p)) {
    assert.equal(count(text), 0);
    assert.doesNotMatch(text, /shirt fabric in red/);
  }
  assert.equal(p.selection.topId, ID);
  assert.equal(p.selection.topColorId, option('topColorId', '紅色').id);
});

test('complete-look precedence does not acquire a hidden independent black tie', () => {
  const p = generate({ outfitPresetId: option('outfitPresetId', '套裝：泳裝度假').id });
  for (const text of all(p)) assert.equal(count(text), 0);
  assert.equal(p.selection.topId, '');
});

test('the whole legacy English description still imports the original top and regenerates the new black tie', () => {
  const compactAlias = 'collared shirt with a short soft necktie, neat collar line, clean front placket, uniform-inspired shirt structure';
  for (const source of [LEGACY_SOURCE, compactAlias]) {
    const imported = normalizeLocks(parseLocksFromStandardPrompt(`Wardrobe:\nShe wears ${source}.`, controls).locks);
    assert.equal(imported.topId, ID, source);
    for (const text of all(generate({ topId: imported.topId }))) assert.equal(count(text), 1);
  }
});

test('current shirt color and short fit prose imports without confusing black tie with top color', () => {
  for (const color of ['白色', '紅色', '鏡面鉻銀', '彩色橫條紋']) {
    const p = generate({ topColorId: option('topColorId', color).id, topFitId: 'underbust-tight' });
    const imported = normalizeLocks(parseLocksFromStandardPrompt(p.grokPrompt, controls).locks);
    assert.equal(imported.topId, ID, color);
    assert.equal(imported.topColorId, p.selection.topColorId, color);
    assert.equal(imported.topFitId, p.selection.topFitId, color);
  }
});

test('duo prose import restores each shirt color without treating either fixed tie as its fabric color', () => {
  const p = generate({ subjectCount: '2', topAId: ID, topBId: ID,
    topAColorId: option('topAColorId', '白色').id, topBColorId: option('topBColorId', '紅色').id,
    topFitAId: 'underbust-fitted', topFitBId: 'standard' });
  const imported = normalizeLocks(parseLocksFromStandardPrompt(p.grokPrompt, controls).locks);
  for (const role of ['A', 'B']) {
    assert.equal(imported[`top${role}Id`], ID);
    assert.equal(imported[`top${role}ColorId`], p.selection[`top${role}ColorId`]);
    assert.equal(imported[`topFit${role}Id`], p.selection[`topFit${role}Id`]);
  }
});

test('Saved Cards keep stored historical text and stable IDs while regeneration uses the revised source', () => {
  const p = generate();
  const historical = { ...p, grokPrompt: p.grokPrompt.replace(SOURCE, LEGACY_SOURCE) };
  const restored = deserializeFavoritePrompt(serializeFavoritePrompt(historical));
  assert.equal(restored.grokPrompt, historical.grokPrompt);
  assert.equal(restored.selection.topId, ID);
  for (const text of all(generate(normalizeLocks(restored.selection)))) assert.equal(count(text), 1);
  const current = generate({ topColorId: option('topColorId', '紅色').id, topFitId: 'underbust-fitted' });
  const currentRestored = deserializeFavoritePrompt(serializeFavoritePrompt(current));
  assert.deepEqual(outputs(currentRestored), outputs(current));
  assert.equal(currentRestored.selection.topColorId, current.selection.topColorId);
  assert.equal(currentRestored.selection.topFitId, current.selection.topFitId);
});

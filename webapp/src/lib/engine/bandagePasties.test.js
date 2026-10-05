import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import baseline from './bandagePastiesBaseline.json' with { type: 'json' };
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls, normalizeLocks } from '../engine.js';
import { deserializeFavoritePrompt, serializeFavoritePrompt, parseLocksFromStandardPrompt } from '../../features/saved-cards/cardCodec.js';
import { prepareUnderbustTopControl } from './underbustTopFit.js';
import { isMinimalCoverageGarmentSource, isMinimalCoverageTop } from './minimalCoverageWardrobe.js';

const controls = getLockControls();
const name = '創可貼造型胸貼';
const id = 'wardrobe:上身-tops:創可貼造型胸貼:45';
const source = 'two separate bandage-shaped adhesive pasties, one short horizontal rounded-rectangle strip of smooth opaque fabric centered on each breast, with a central pad detail, finely perforated ends, and slightly varied casual placement angles';
const option = (key, zh) => {
  const value = controls.find(c => c.key === key)?.options.find(o => o.zh === zh);
  assert.ok(value, `${key}/${zh}`);
  return value;
};
function noneLocks() {
  const locks = { ...createEmptyLocks(), subjectCount: '1' };
  for (const control of controls) {
    const none = control.options.find(o => o.zh === '全無');
    if (none) locks[control.key] = none.id;
  }
  return locks;
}
function generate(overrides = {}, seed = 'bandage-pasties-v1') {
  return generatePrompts(1, { ...noneLocks(), topId: id,
    framingId: option('framingId', '全身鏡頭 (Full Body Shot)').id, ...overrides }, [], { random: createSeededRandom(seed) })[0];
}
const main = p => [p.grokPrompt, p.zImagePrompt, p.midjourneyPrompt];
const derivatives = p => p.extraPrompts.map(e => e.text);
const all = p => [...main(p), ...derivatives(p)];
const occurrences = text => text.split(source).length - 1;
const snapshot = p => ({ selection: p.selection, grokPrompt: p.grokPrompt, zImagePrompt: p.zImagePrompt,
  midjourneyPrompt: p.midjourneyPrompt, extraPrompts: p.extraPrompts });

test('bandage pasties append one independent option to single and duo catalogs without moving old IDs', () => {
  for (const key of ['topId', 'topAId', 'topBId']) {
    const options = controls.find(c => c.key === key).options;
    assert.deepEqual(options.slice(0, -1).map(o => o.id), baseline.oldTopIds);
    assert.equal(options.at(-1).id, id);
    assert.equal(options.at(-1).zh, name);
    assert.equal(options.at(-1).en, source);
    assert.equal(normalizeLocks({ ...noneLocks(), [key]: id })[key], id);
    assert.equal(option(key, 'X形胸貼').id, 'wardrobe:上身-tops:小罩杯細帶蕾絲胸罩:43');
  }
  assert.equal(isMinimalCoverageTop(option('topId', name)), true);
  assert.equal(isMinimalCoverageGarmentSource(source), true);
  assert.equal(isMinimalCoverageGarmentSource('adhesive fashion top with bandage-inspired print'), false);
});

test('all 225 existing top/crop selections and six outputs retain their pre-change bytes', () => {
  const hash = createHash('sha256');
  let count = 0;
  for (const topId of baseline.oldTopIds) for (const crop of baseline.crops) {
    const p = generate({ topId, framingId: option('framingId', crop).id }, baseline.seed);
    hash.update(JSON.stringify(snapshot(p)));
    count++;
  }
  assert.equal(count, baseline.cases);
  assert.equal(hash.digest('hex'), baseline.sha256);
});

test('each visible output retains one full pair source including casual horizontal placement', () => {
  for (const crop of baseline.crops) {
    const p = generate({ framingId: option('framingId', crop).id, topFitId: 'tight', bottomRiseId: 'ultra-low-rise' });
    assert.equal(p.selection.topId, id);
    assert.match(p.summary, /創可貼造型胸貼/);
    for (const text of main(p)) assert.equal(occurrences(text), crop === '局部五官特寫' ? 0 : 1);
    for (const text of derivatives(p)) assert.equal(occurrences(text), 1);
    for (const text of all(p)) assert.doesNotMatch(text, /two short crossed strips|top length meets|top hem overlaps|partially concealing|small-cup lace bra/i);
  }
});

test('shared color and pattern remain attached to the independent bandage source', () => {
  const p = generate({ topColorId: option('topColorId', '白色').id,
    topPatternId: option('topPatternId', '粗橫條紋').id, topStylingId: 'hem-overlap',
    pantsId: option('pantsId', '直筒牛仔褲').id });
  for (const text of all(p)) {
    assert.equal(occurrences(text), 1);
    assert.match(text, /white/i);
    assert.match(text, /horizontal stripe/i);
    assert.doesNotMatch(text, /partially concealing|top length meets/i);
  }
  assert.equal(p.selection.topStylingId, 'hem-overlap');
});

test('short top fits remain disabled and latent instead of inventing a pasties hem', () => {
  const fitControl = controls.find(c => c.key === 'topFitId');
  for (const topFitId of ['underbust-tight', 'underbust-fitted']) {
    const locks = { ...noneLocks(), topId: id, topFitId };
    const prepared = prepareUnderbustTopControl(fitControl, locks, controls);
    assert.equal(prepared.options.find(o => o.id === topFitId).disabled, true);
    const p = generate(locks);
    assert.equal(p.selection.topFitId, topFitId);
    for (const text of all(p)) {
      assert.equal(occurrences(text), 1);
      assert.doesNotMatch(text, /underbust-cropped|hem ending just below/i);
    }
  }
});

test('duo source follows the selected wearer without replacing the other X-shaped pair', () => {
  const x = option('topId', 'X形胸貼');
  for (const wearer of ['A', 'B']) {
    const p = generate({ subjectCount: '2', topAId: x.id, topBId: x.id, [`top${wearer}Id`]: id });
    for (const text of main(p)) {
      assert.equal(occurrences(text), 1);
      assert.equal(text.split(x.en).length - 1, 1);
    }
    assert.equal(p.selection[`top${wearer}Id`], id);
    const restored = deserializeFavoritePrompt(serializeFavoritePrompt(p));
    assert.equal(restored.selection[`top${wearer}Id`], id);
  }
});

test('Saved Cards and standard prose restore the new top without colliding with X-shaped pasties', () => {
  const p = generate({ topColorId: option('topColorId', '黑色').id });
  const restored = deserializeFavoritePrompt(serializeFavoritePrompt(p));
  assert.equal(restored.selection.topId, id);
  assert.equal(restored.selection.topColorId, p.selection.topColorId);
  assert.deepEqual(all(restored), all(p));
  for (const text of all(generate(normalizeLocks(restored.selection)))) {
    assert.equal(occurrences(text), 1);
    assert.match(text, /black/i);
  }
  for (const text of [p.grokPrompt, `Wardrobe: ${source}.`]) {
    const imported = parseLocksFromStandardPrompt(text, controls).locks;
    assert.equal(imported.topId, id);
    for (const prompt of all(generate(imported))) assert.equal(occurrences(prompt), 1);
  }
  const x = option('topId', 'X形胸貼');
  assert.equal(parseLocksFromStandardPrompt(`Wardrobe: ${x.en}.`, controls).locks.topId, x.id);
});

test('closed opaque outerwear and complete presets retain existing top precedence', () => {
  const p = generate({ outerwearId: option('outerwearId', '長版襯衫').id,
    outerwearOpeningId: option('outerwearOpeningId', '全扣上／全拉上').id });
  for (const text of all(p)) assert.equal(occurrences(text), 0);
  assert.equal(p.selection.topId, id);
  const preset = generate({ outfitPresetId: option('outfitPresetId', '套裝：泳裝度假').id });
  for (const text of all(preset)) assert.equal(occurrences(text), 0);
});

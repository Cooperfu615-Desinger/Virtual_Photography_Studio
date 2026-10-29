import {preC4JewelryHistoricalTest} from '../../../../scripts/lib/c4JewelryHistoricalTest.mjs';
const c4JewelryHistoricalTest=preC4JewelryHistoricalTest(import.meta.url);
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls, normalizeLocks } from '../engine.js';
import { parseLocksFromStandardPrompt } from '../../features/saved-cards/cardCodec.js';
import review from '../../../../scripts/lib/a2OutfitControlReview.json' with { type: 'json' };

const controls = getLockControls();
const options = key => controls.find(c => c.key === key).options;
const empty = () => {
  const locks = createEmptyLocks();
  for (const c of controls) {
    const none = c.options.find(o => o.zh === '全無' || o.id === 'none');
    if (none) locks[c.key] = none.id;
  }
  return { ...locks, subjectCount: '1' };
};
const leak = /controlled by (?:the )?(?:outfit (?:primary color|contrast color|color selection)|contrast palette)/i;
const outputs = p => [p.grokPrompt, p.zImagePrompt, p.midjourneyPrompt, p.nanoBananaPrompt, ...p.extraPrompts.map(x => x.text)];

c4JewelryHistoricalTest('A2 outfits remove only reviewed clauses; preserve IDs, ordered aliases, semantic and color roles', () => {
  const source = JSON.parse(readFileSync(new URL('../../../../' + review.sourceFile, import.meta.url)));
  assert.equal(review.rows.length, 40);
  assert.equal(source.entries.length, 59);
  let structured = 0;
  for (const row of review.rows) {
    const clauses = row.before.en.split(', ');
    assert.deepEqual(row.removedClauses, clauses.filter(x => leak.test(x)));
    const expected = { ...row.before, en: clauses.filter(x => !leak.test(x)).join(', '), legacyPromptAliases: [...(row.before.legacyPromptAliases || []), row.before.en] };
    if (row.before.meta.colorMode) {
      structured++;
      assert.deepEqual(row.reviewedBindings.map(x => x.target), row.removedClauses.map(x => x.split(' controlled by ')[0]));
      expected.meta = { ...row.before.meta, colorTextBindings: row.reviewedBindings };
    }
    assert.deepEqual(row.after, expected, row.id);
    assert.deepEqual(source.entries.find(x => x.id === row.id), expected, row.id);
    assert.doesNotMatch(expected.en, leak);
  }
  assert.equal(structured, 19);
});

test('A2 all 40 outfits are free of source controls across every crop and five color states in six outputs', () => {
  let cases = 0;
  for (const row of review.rows) for (const framing of options('framingId')) for (const [primary, contrast] of [
    ['none', 'none'], ['light-blue', 'none'], ['none', 'white'], ['light-blue', 'white'], ['mirror-chrome-silver', 'white'],
  ]) {
    const locks = { ...empty(), outfitPresetId: row.id, framingId: framing.id, outfitPresetPrimaryColorId: primary, outfitPresetContrastColorId: contrast };
    const [p] = generatePrompts(1, locks, [], { random: createSeededRandom('a2-outfit:' + row.id) });
    assert.ok(p);
    assert.equal(p.selection.outfitPresetId, row.id);
    assert.equal(p.selection.outfitPresetPrimaryColorId, primary);
    for (const text of outputs(p)) assert.doesNotMatch(text, leak, row.id + ':' + framing.zh);
    cases++;
  }
  assert.equal(cases, 40 * options('framingId').length * 5);
});

test('A2 every prior outfit text and legacy ID resolves to the same issued option', () => {
  for (const row of review.rows) {
    for (const text of [row.before.en, ...(row.before.legacyPromptAliases || [])]) {
      const locks = parseLocksFromStandardPrompt('Wardrobe:\n' + text, controls).locks;
      assert.equal(locks.outfitPresetId, row.id, row.id + ': old text');
    }
    for (const id of [row.id, ...(row.before.legacyIds || [])]) assert.equal(normalizeLocks({ ...empty(), outfitPresetId: id }, controls).outfitPresetId, row.id);
    const option = options('outfitPresetId').find(x => x.id === row.id);
    for (const alias of [row.before.en, ...(row.before.legacyPromptAliases || [])]) assert.ok(option.meta.legacyPromptAliases.includes(alias));
  }
});

import { materializeOutfitColorBindings } from './outfitColorBindings.js';
import { materializeOutfitColorControls } from './promptTextDeduplication.js';
import { getKnowledgeBaseSnapshot } from '../engine.js';
import { preA2OutfitDatabase, preA2OutfitProgramSources } from '../../../../scripts/lib/a2OutfitControlHistoricalReplay.mjs';
import patches from '../../../../scripts/lib/a2OutfitControlPatches.json' with { type: 'json' };

test('A2 structured bindings preserve the old parser target text, order and consumed channels', () => {
  for (const row of review.rows.filter(x => x.path === 'structured')) for (const [primaryColorText, contrastColorText] of [
    ['', ''], ['light blue', ''], ['', 'white'], ['light blue', 'white'], ['glossy black latex', 'white'],
  ]) for (const primaryMaterial of [false, true]) {
    // The old material behavior strips this exact old pattern before color parsing.
    const strip = /(?:dominant|main|primary)?\s*(?:satin|swim|metallic|textile|uniform|coat|leather|jersey|towel|fabric)?\s*color\s+controlled\s+by\s+the\s+outfit\s+color\s+selection|tonal\s+palette\s+controlled\s+by\s+the\s+outfit\s+color\s+selection/i;
    const eligible = row.before.en.split(', ').filter(c => !(primaryMaterial && strip.test(c)));
    const old = materializeOutfitColorControls(eligible.join(', '), { primaryColorText, contrastColorText });
    old.text = old.text.split(', ').filter(c => !row.removedClauses.includes(c)).join(', ');
    const actual = materializeOutfitColorBindings(row.after.en, row.after.meta.colorTextBindings, { primaryColorText, contrastColorText, primaryMaterial });
    assert.deepEqual(actual, old, row.id);
  }
  for (const bindings of [undefined, null, [], {}, [{ channel: 'locked', target: 'trim', omitForPrimaryMaterial: false }]])
    assert.equal(materializeOutfitColorBindings('visual outfit', bindings), null, 'legacy/custom path remains available');
});

test('A2 preserves existing fixed-color overlap, inactive locked targets and generic sporty trim behavior', () => {
  const row = term => review.rows.find(r => r.before.zh.includes(term));
  const pink = row('粉紅哥德');
  assert.ok(pink.after.meta.colorTextBindings.some(x => x.channel === 'contrast' && x.target === 'cross decorations'));
  assert.deepEqual(pink.after.meta.colorTargets.locked, pink.before.meta.colorTargets.locked);
  const mesh = row('網狀蕾絲');
  assert.equal(mesh.after.meta.colorMode, 'primary');
  assert.ok(mesh.after.meta.colorTargets.locked.length > 0);
  const sporty = row('短版運動T');
  assert.equal(sporty.after.meta.colorTextBindings, undefined);
  assert.match(sporty.after.en, /contrast collar and sleeve binding/);
  assert.match(sporty.after.en, /contrast piping/);
  for (const r of review.rows) {
    assert.deepEqual(r.after.meta.colorTargets, r.before.meta.colorTargets);
    assert.equal(r.after.meta.colorMode, r.before.meta.colorMode);
    assert.equal(r.after.meta.lockedOptional, r.before.meta.lockedOptional);
  }
});

c4JewelryHistoricalTest('A2 outfit data inverse rejects text, metadata, alias order, missing IDs, duplicates and mixed states', () => {
  const source = getKnowledgeBaseSnapshot();
  const old = preA2OutfitDatabase(source);
  assert.deepEqual(preA2OutfitDatabase(old), old);
  assert.deepEqual(source, getKnowledgeBaseSnapshot());
  const entries = x => x.Wardrobe[review.category];
  const target = x => entries(x).find(r => r.stableId === review.rows.find(r => r.path === 'structured').id);
  for (const mutate of [
    x => { target(x).en += ' unreviewed'; },
    x => { target(x).meta.colorTextBindings[0].target += ' unreviewed'; },
    x => { target(x).legacyPromptAliases.push('unreviewed'); },
    x => { entries(x).splice(1, 1); },
    x => { entries(x).push(structuredClone(entries(x)[1])); },
    x => { entries(x).reverse(); },
    x => { entries(x)[1] = structuredClone(review.rows[0].generatedBefore); },
  ]) {
    const changed = structuredClone(source); mutate(changed);
    assert.throws(() => preA2OutfitDatabase(changed), /A2 outfit inverse/);
  }
});

test('A2 outfit program inverse rejects extra code, schema drift, missing helpers and mixed versions', () => {
  const paths = [...Object.keys(patches.hashes), ...Object.keys(patches.newFiles)];
  const source = Object.fromEntries(paths.map(path => [path, readFileSync(new URL('../../../../' + path, import.meta.url), 'utf8')]));
  const old = preA2OutfitProgramSources(source, 'after');
  assert.deepEqual(preA2OutfitProgramSources(old, 'before'), old);
  for (const path of paths) {
    assert.throws(() => preA2OutfitProgramSources({ ...source, [path]: source[path] + '\n// extra' }, 'after'), /A2 outfit inverse/);
    const missing = { ...source }; delete missing[path];
    assert.throws(() => preA2OutfitProgramSources(missing, 'after'), /A2 outfit inverse/);
  }
  assert.throws(() => preA2OutfitProgramSources({ ...source, 'webapp/src/lib/engine.js': old['webapp/src/lib/engine.js'] }, 'after'), /A2 outfit inverse/);
});

import {preC4JewelryHistoricalTest} from '../../../../scripts/lib/c4JewelryHistoricalTest.mjs';
const c4JewelryHistoricalTest=preC4JewelryHistoricalTest(import.meta.url);
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls, normalizeLocks, getKnowledgeBaseSnapshot } from '../engine.js';
import { parseLocksFromStandardPrompt } from '../../features/saved-cards/cardCodec.js';
import review from '../../../../scripts/lib/a2DressControlReview.json' with { type: 'json' };

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
const leak = /controlled by dress color selection|contrast trim controlled by contrast palette/i;
const outputs = p => [p.grokPrompt, p.zImagePrompt, p.midjourneyPrompt, p.nanoBananaPrompt, ...p.extraPrompts.map(x => x.text)];

test('A2 dresses change only reviewed control clauses and append exact old text aliases', () => {
  const source = JSON.parse(readFileSync(new URL('../../../../' + review.sourceFile, import.meta.url)));
  assert.equal(review.rows.length, 24);
  assert.equal(source.entries.length, 25);
  for (const row of review.rows) {
    const cleaned = row.before.en
      .replace(/, main (?:fabric|latex|glossy fabric|satin|knit|silk|tulle|swim fabric) color controlled by dress color selection/g, '')
      .replace(', contrast trim controlled by contrast palette', '');
    assert.notEqual(cleaned, row.before.en);
    assert.equal(row.after.en, cleaned);
    const expected = { ...row.before, en: cleaned, legacyPromptAliases: [...(row.before.legacyPromptAliases || []), row.before.en] };
    assert.deepEqual(row.after, expected);
    assert.deepEqual(source.entries.find(x => x.id === row.id), expected, row.id);
  }
  assert.equal(source.entries[0].zh, '全無');
});

test('A2 all 24 dresses are free of selection controls across every crop and three colors in six outputs', () => {
  let cases = 0;
  for (const row of review.rows) for (const framing of options('framingId')) for (const color of ['none', 'light-blue', 'mirror-chrome-silver']) {
    const locks = { ...empty(), outfitPresetId: row.id, framingId: framing.id, dressColorId: color, outfitPresetPrimaryColorId: color };
    const [p] = generatePrompts(1, locks, [], { random: createSeededRandom('a2-dress:' + row.id) });
    assert.ok(p);
    assert.equal(p.selection.dressId, row.id);
    assert.equal(p.selection.dressColorId, color, 'reviewed color must resolve without fallback');
    for (const text of outputs(p)) assert.doesNotMatch(text, leak, row.id + ':' + framing.zh);
    cases++;
  }
  assert.equal(cases, 24 * options('framingId').length * 3);
});

test('A2 every prior dress text and legacy ID resolves to the same issued option', () => {
  for (const row of review.rows) {
    for (const text of [row.before.en, ...(row.before.legacyPromptAliases || [])]) {
      const locks = parseLocksFromStandardPrompt('Wardrobe:\n' + text, controls).locks;
      assert.ok([locks.dressId, locks.outfitPresetId].includes(row.id), row.id + ': old text');
    }
    for (const id of [row.id, ...(row.before.legacyIds || [])]) assert.equal(normalizeLocks({ ...empty(), dressId: id }, controls).dressId, row.id);
    const option = options('dressId').find(x => x.id === row.id);
    for (const alias of [row.before.en, ...(row.before.legacyPromptAliases || [])]) assert.ok(option.meta.legacyPromptAliases.includes(alias));
  }
});

import { preA2Database } from '../../../../scripts/lib/a2DressControlHistoricalReplay.mjs';
c4JewelryHistoricalTest('A2 inverse rejects changed entries, missing or duplicate IDs and mixed migration states', () => {
  const source = getKnowledgeBaseSnapshot();
  const old = preA2Database(source);
  assert.deepEqual(preA2Database(old), old);
  assert.deepEqual(source, getKnowledgeBaseSnapshot(), 'default runtime data remains unchanged');
  const entries = x => x.Wardrobe['連身 (Dresses)'];
  for (const mutate of [
    x => { entries(x)[1].en += ' unreviewed'; },
    x => { entries(x)[1].meta.semantic.tags.push('unreviewed'); },
    x => { entries(x)[1].legacyPromptAliases.reverse(); entries(x)[1].legacyPromptAliases.push('unreviewed'); },
    x => { entries(x).splice(1, 1); },
    x => { entries(x).push(structuredClone(entries(x)[1])); },
    x => { entries(x)[1] = structuredClone(review.rows[0].generatedBefore); },
  ]) {
    const changed = structuredClone(source); mutate(changed);
    assert.throws(() => preA2Database(changed), /A2 inverse/);
  }
});


import { A2_VIDEO_PATHS, preVideoSources } from '../../../../scripts/lib/a2DressControlHistoricalReplay.mjs';
test('A2 video history accepts only the exact reviewed before or after tree and rejects missing, changed or mixed sources', () => {
  const before = Object.fromEntries(A2_VIDEO_PATHS.map(path => [path, 'before:' + path]));
  const after = Object.fromEntries(A2_VIDEO_PATHS.map(path => [path, 'after:' + path]));
  assert.deepEqual(preVideoSources(before, before, after), before);
  assert.deepEqual(preVideoSources(after, before, after), before);
  for (const mutate of [
    x => { delete x[A2_VIDEO_PATHS[0]]; },
    x => { x[A2_VIDEO_PATHS[0]] += ' unreviewed'; },
    x => { x[A2_VIDEO_PATHS[0]] = before[A2_VIDEO_PATHS[0]]; },
  ]) {
    const current = { ...after }; mutate(current);
    assert.throws(() => preVideoSources(current, before, after), /A2 video inverse/);
  }
  assert.equal(after[A2_VIDEO_PATHS[0]], 'after:' + A2_VIDEO_PATHS[0]);
});

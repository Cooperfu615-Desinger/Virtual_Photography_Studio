import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls, getKnowledgeBaseSnapshot, normalizeLocks } from '../engine.js';
import { parseLocksFromStandardPrompt } from '../../features/saved-cards/cardCodec.js';
import { TAPE_ROOT, TAPE_REVIEW as r, preA2SpecialTapeDatabase, restorePreA2SpecialTapeFiles } from '../../../../scripts/lib/a2SpecialTapeReplay.mjs';
const controls = getLockControls(), options = key => controls.find(c => c.key === key).options;
const empty = () => { const locks = createEmptyLocks(); for (const c of controls) { const n = c.options.find(o => o.zh === '全無' || o.id === 'none'); if (n) locks[c.key] = n.id; } return { ...locks, subjectCount: '1', specialOutfitId: r.id }; };
const leak = /palette-controlled|tape color follows complete-look palette selection/i;
const texts = p => [p.grokPrompt, p.zImagePrompt, p.midjourneyPrompt, p.nanoBananaPrompt, ...p.extraPrompts.map(x => x.text)];
const git = path => execFileSync('git', ['-C', TAPE_ROOT, 'show', r.baseCommit + ':' + path], { maxBuffer: 32 * 1024 * 1024 });

test('A2 special tape source changes exactly two controls, no fixed red, and appends old English', () => {
  const base = JSON.parse(git(r.sourceFile)), source = JSON.parse(readFileSync(join(TAPE_ROOT, r.sourceFile)));
  assert.deepEqual(base.entries.find(x => x.id === r.id), r.before);
  const en = r.before.en.replace('palette-controlled ', '').replace(', tape color follows complete-look palette selection', '');
  const expected = { ...r.before, en, legacyPromptAliases: [...(r.before.legacyPromptAliases || []), r.before.en] };
  assert.deepEqual(r.after, expected); assert.doesNotMatch(en, /\bred\b|palette-controlled|palette selection/i);
  base.entries[base.entries.findIndex(x => x.id === r.id)] = expected;
  assert.deepEqual(source, base, 'all other 90 source rows and ordered fields stay unchanged');
  const db = JSON.parse(git('webapp/src/data/database.json'));
  db.Wardrobe[r.category][db.Wardrobe[r.category].findIndex(x => x.stableId === r.id)] = r.generatedAfter;
  assert.deepEqual(getKnowledgeBaseSnapshot(), db);
});

test('A2 special tape every crop and all nine palettes retain existing scope without source controls', () => {
  for (const crop of options('framingId')) for (const palette of options('completeLookPaletteId')) {
    const p = generatePrompts(1, { ...empty(), framingId: crop.id, completeLookPaletteId: palette.id }, [], { random: createSeededRandom('tape-crops') })[0];
    for (const t of texts(p)) assert.doesNotMatch(t, leak);
    assert.equal(p.selection.specialOutfitId, r.id);
    assert.equal(p.selection.completeLookPaletteId, palette.id === 'none' ? '' : palette.id);
    const full = p.extraPrompts.find(x => x.id === 'full-body-character').text;
    for (const phrase of ['latex-like tape strips stuck directly onto the skin', 'matching high-cut tape bottom', 'hip and thigh tape bands']) assert.ok(full.includes(phrase));
    if (palette.id === 'none') assert.doesNotMatch(full, /\bred\b|complete outfit palette direction/i);
    else assert.ok(full.includes('outfit palette: ' + palette.en), 'current runtime keeps the selected family');
  }
});

test('A2 special tape old full English and issued IDs retain ownership', () => {
  const parsed = parseLocksFromStandardPrompt('Wardrobe:\n' + r.before.en, controls).locks;
  assert.equal(parsed.specialOutfitId, r.id);
  for (const id of [r.id, ...r.before.legacyIds]) assert.equal(normalizeLocks({ ...empty(), specialOutfitId: id }, controls).specialOutfitId, r.id);
  for (const key of ['specialOutfitId', 'specialOutfitAId', 'specialOutfitBId']) {
    const item = options(key).find(x => x.zh === r.before.zh); assert.ok(item.meta.legacyPromptAliases.includes(r.before.en));
  }
});

test('A2 special tape database inverse rejects unknown text, metadata, aliases, ID order and duplicates', () => {
  const db = getKnowledgeBaseSnapshot(), old = preA2SpecialTapeDatabase(db);
  assert.deepEqual(old, JSON.parse(git('webapp/src/data/database.json')));
  assert.deepEqual(preA2SpecialTapeDatabase(old), old); assert.deepEqual(db, getKnowledgeBaseSnapshot());
  for (const mutate of [x => x.at(-1).en += ' extra', x => x.at(-1).meta.semantic.tags.push('extra'), x => x.at(-1).legacyPromptAliases.push('extra'), x => x.pop(), x => x.push(x.at(-1)), x => x.reverse()]) {
    const bad = structuredClone(db); mutate(bad.Wardrobe[r.category]); assert.throws(() => preA2SpecialTapeDatabase(bad), /Tape inverse/);
  }
});

test('A2 special tape file inverse validates all five surfaces before writes and forbids live tree', () => {
  assert.throws(() => restorePreA2SpecialTapeFiles(TAPE_ROOT), /isolated/);
  const paths = [r.sourceFile, 'webapp/src/data/database.json', 'knowledge_base/wardrobe_and_styling.md', ...r.management.map(x => x.path), ...r.replayFiles.map(x => x.path)];
  const dir = mkdtempSync(join(tmpdir(), 'tape-inverse-test-'));
  const seed = () => { for (const path of paths) { const dest = join(dir, path); mkdirSync(join(dest, '..'), { recursive: true }); writeFileSync(dest, readFileSync(join(TAPE_ROOT, path))); } };
  try {
    seed(); restorePreA2SpecialTapeFiles(dir); restorePreA2SpecialTapeFiles(dir);
    for (const path of paths) assert.deepEqual(readFileSync(join(dir, path)), git(path));
    for (const path of paths) {
      seed(); writeFileSync(join(dir, path), git(path));
      const before = paths.map(p => readFileSync(join(dir, p)));
      assert.throws(() => restorePreA2SpecialTapeFiles(dir), /Tape inverse/);
      assert.deepEqual(paths.map(p => readFileSync(join(dir, p))), before, 'no partial writes');
    }
    seed(); rmSync(join(dir, paths[2])); const first = readFileSync(join(dir, paths[0]));
    assert.throws(() => restorePreA2SpecialTapeFiles(dir)); assert.deepEqual(readFileSync(join(dir, paths[0])), first);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

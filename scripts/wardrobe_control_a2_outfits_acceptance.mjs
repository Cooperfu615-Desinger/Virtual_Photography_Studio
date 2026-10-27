// A2 outfit oracle: fixed Git engine, old parser and reviewed whole-clause cleanup.
// It does not use the production colorTextBindings helper to compute expected output.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import * as current from '../webapp/src/lib/engine.js';
import * as codec from '../webapp/src/features/saved-cards/cardCodec.js';
import * as capture from '../webapp/src/lib/observationCaptureMode.js';
import * as captureImport from '../webapp/src/lib/observationCaptureImport.js';
import { A2_OUTFIT_ROOT as root, A2_OUTFIT_REVIEW as review, preA2OutfitProgramSources } from './lib/a2OutfitControlHistoricalReplay.mjs';
import { stablePrompt, sha256, pack, outputStates } from './lib/catalogBaseline.mjs';

const out = resolve(process.argv[2] || '/tmp/a2-outfits-acceptance');
mkdirSync(out, { recursive: true });
const git = (...args) => execFileSync('git', ['-C', root, ...args], { maxBuffer: 128 * 1024 * 1024 });
const beforeRoot = mkdtempSync(join(tmpdir(), 'vps-a2-before-'));
const expectedRoot = mkdtempSync(join(tmpdir(), 'vps-a2-oracle-'));
try {
  const archive = git('archive', review.baseCommit, 'webapp/src', 'webapp/package.json');
  for (const dir of [beforeRoot, expectedRoot]) {
    execFileSync('tar', ['-x', '-C', dir], { input: archive });
    symlinkSync(join(root, 'webapp/node_modules'), join(dir, 'webapp/node_modules'), 'dir');
  }
  const expected = JSON.parse(git('show', review.baseCommit + ':webapp/src/data/database.json'));
  const sourceBefore = JSON.parse(git('show', review.baseCommit + ':' + review.sourceFile));
  const sourceNow = JSON.parse(readFileSync(join(root, review.sourceFile)));
  assert.equal(review.rows.length, 40);
  const changedIds = new Set(review.rows.map(x => x.id));
  const wantedSource = structuredClone(sourceBefore);
  for (const row of review.rows) {
    assert.deepEqual(row.before, sourceBefore.entries.find(x => x.id === row.id));
    const clauses = row.before.en.split(', ');
    const removed = clauses.filter(x => x.includes(' controlled by '));
    assert.deepEqual(row.removedClauses, removed);
    const newEn = clauses.filter(x => !removed.includes(x)).join(', ');
    const wanted = { ...row.before, en: newEn, legacyPromptAliases: [...(row.before.legacyPromptAliases || []), row.before.en] };
    if (row.before.meta.colorMode) wanted.meta = { ...row.before.meta, colorTextBindings: row.reviewedBindings };
    assert.deepEqual(row.after, wanted);
    wantedSource.entries[wantedSource.entries.findIndex(x => x.id === row.id)] = wanted;
    const item = expected.Wardrobe[review.category].find(x => x.stableId === row.id);
    assert.deepEqual(row.generatedBefore, item);
    item.en = newEn; item.legacyPromptAliases = wanted.legacyPromptAliases;
    if (row.before.meta.colorMode) item.meta.colorTextBindings = wanted.meta.colorTextBindings;
    assert.deepEqual(row.generatedAfter, item);
  }
  assert.deepEqual(sourceNow, wantedSource, 'whole category, order and non-reviewed entries');
  assert.deepEqual(JSON.parse(readFileSync(join(root, 'webapp/src/data/database.json'))), expected);
  writeFileSync(join(expectedRoot, 'webapp/src/data/database.json'), JSON.stringify(expected));
  const manifest = JSON.parse(readFileSync(join(root, 'scripts/lib/a2OutfitControlPatches.json')));
  const programs = Object.fromEntries([...Object.keys(manifest.hashes), ...Object.keys(manifest.newFiles)].map(p => [p, readFileSync(join(root, p), 'utf8')]));
  const originalPrograms = preA2OutfitProgramSources(programs, 'after');
  for (const [p, source] of Object.entries(originalPrograms)) assert.equal(source, git('show', review.baseCommit + ':' + p).toString());
  const allowed = new Set([review.sourceFile, 'knowledge_base/wardrobe_and_styling.md', 'webapp/src/data/database.json', ...Object.keys(manifest.hashes)]);
  const protectedFiles = git('ls-tree', '-r', '--name-only', review.baseCommit).toString().trim().split('\n').filter(p => /^(webapp\/src\/|knowledge_base\/)/.test(p) && !p.endsWith('.test.js') && !allowed.has(p));
  for (const p of protectedFiles) assert.equal(sha256(readFileSync(join(root, p))), sha256(git('show', review.baseCommit + ':' + p)), p);
  // Independent oracle uses the fixed Git parser, never the new binding helper.
  // Restore original clauses only for the 19 metadata presets, then remove reviewed
  // unselected controls. Material-mode whole-clause removal also removes old regex fragments.
  let oracleSource = readFileSync(join(expectedRoot, 'webapp/src/lib/engine.js'), 'utf8');
  const reviewed = Object.fromEntries(review.rows.filter(r => r.before.meta.colorMode).map(r => [r.id, { before: r.before.en, after: r.after.en, controls: r.removedClauses }]));
  const start = oracleSource.indexOf('function buildUnprojectedOutfitPresetPrompt('), end = oracleSource.indexOf('function buildSpecialOutfitPrompt(', start);
  let builder = oracleSource.slice(start, end).replace('  const base = stripMarkdown(item.en)', '  let base = stripMarkdown(item.en)');
  builder = builder.replace('  const primaryBehavior = materializeOutfitPresetPrimaryColorBehavior(base, meta, primaryColor);', `
  const candidate = ${JSON.stringify(reviewed)}[item.id.replace(/:[ab]$/, '')];
  if (candidate && item.en !== candidate.after && item.en !== candidate.before) throw new Error('Unexpected oracle outfit source: ' + item.id + ': ' + item.en);
  const reviewed = candidate && item.en === candidate.after ? candidate : null;
  if (reviewed) {
    base = reviewed.before.split(', ').filter(clause => !(primaryColor?.meta?.primaryMaterial === true
      && reviewed.controls.includes(clause) && stripOutfitColorSelectionControls(clause) !== clause)).join(', ');
  }
  const primaryBehavior = materializeOutfitPresetPrimaryColorBehavior(base, meta, primaryColor);`);
  builder = builder.replace('  const details = [];', `
  if (reviewed) materializedBase.text = materializedBase.text.split(', ').filter(clause => !reviewed.controls.includes(clause)).join(', ');
  const details = [];`);
  oracleSource = oracleSource.slice(0, start) + builder + oracleSource.slice(end);
  assert.ok(!oracleSource.includes("from './engine/outfitColorBindings.js'"));
  writeFileSync(join(expectedRoot, 'webapp/src/lib/engine.js'), oracleSource);
  const load = (dir, file) => import(pathToFileURL(join(dir, file)).href);
  const old = await load(beforeRoot, 'webapp/src/lib/engine.js');
  const oracle = await load(expectedRoot, 'webapp/src/lib/engine.js');
  const expectedCodec = await load(expectedRoot, 'webapp/src/features/saved-cards/cardCodec.js');
  const oldCodec = await load(beforeRoot, 'webapp/src/features/saved-cards/cardCodec.js');
  const oldImport = await load(beforeRoot, 'webapp/src/lib/observationCaptureImport.js');
  const controls = current.getLockControls(), options = k => controls.find(c => c.key === k).options;
  const empty = () => {
    const locks = current.createEmptyLocks();
    for (const c of controls) {
      const none = c.options.find(x => x.zh === '全無' || x.id === 'none');
      if (none) locks[c.key] = none.id;
    }
    return { ...locks, subjectCount: '1', framingId: options('framingId').find(x => x.zh.startsWith('全身鏡頭')).id };
  };
  function run(e, locks, seed) {
    let calls = 0; const rng = e.createSeededRandom(seed);
    const p = e.generatePrompts(1, structuredClone(locks), [], { random: () => { calls++; return rng(); } })[0];
    assert.ok(p, seed);
    return { p, stable: stablePrompt(p), calls };
  }
  for (const id of ['none', 'light-blue', 'mirror-chrome-silver']) assert.ok(options('outfitPresetPrimaryColorId').some(x => x.id === id), 'reviewed color: ' + id);
  const cases = [], changedOutputs = {}, saved = [], baseline = [];
  const markdownReview = JSON.parse(readFileSync(join(root, 'scripts/lib/a2OutfitMarkdownRecoveryReview.json')));
  const markdownRecoveryDifferences = [];
  const leak = /controlled by (?:the )?(?:outfit (?:primary color|contrast color|color selection)|contrast palette)/i;
  function compare(id, locks, { unchanged = false, clean = true } = {}) {
    const before = run(old, locks, id), want = run(oracle, locks, id), after = run(current, locks, id);
    assert.deepEqual(after.stable, want.stable, id + ': fixed Git oracle');
    assert.equal(after.calls, want.calls, id + ': oracle RNG');
    assert.deepEqual(after.p.selection, before.p.selection, id + ': selection');
    assert.equal(after.calls, before.calls, id + ': RNG');
    if (unchanged) assert.deepEqual(after.stable, before.stable, id + ': protected path');
    for (const [field, v] of Object.entries(outputStates(after.p))) {
      if (clean && v.status === 'effective') assert.doesNotMatch(v.text, leak, id + ':' + field);
      if (v.text !== outputStates(before.p)[field].text) changedOutputs[field] = (changedOutputs[field] || 0) + 1;
    }
    cases.push({ id, before: sha256(JSON.stringify(before.stable)), after: sha256(JSON.stringify(after.stable)), rngCalls: after.calls, unchanged });
    return { before, after };
  }
  for (const row of review.rows) {
    const locks = { ...empty(), outfitPresetId: row.id, dressColorId: 'none', outfitPresetPrimaryColorId: 'none', outfitPresetContrastColorId: 'none' };
    const pair = compare('baseline:' + row.id, locks);
    baseline.push({ id: row.id, locks, before: pair.before.stable, after: pair.after.stable });
    for (const f of options('framingId')) for (const [primary, contrast] of [
      ['none', 'none'], ['light-blue', 'none'], ['none', 'white'], ['light-blue', 'white'], ['mirror-chrome-silver', 'white'],
    ]) compare('crop:' + row.id + ':' + f.id + ':' + primary + ':' + contrast,
      { ...locks, framingId: f.id, outfitPresetPrimaryColorId: primary, outfitPresetContrastColorId: contrast });
    for (const key of ['outfitPresetPrimaryColorId', 'outfitPresetContrastColorId']) for (const color of options(key)) {
      if (color.id !== 'random') compare(key + ':' + row.id + ':' + color.id, { ...locks, [key]: color.id });
    }
    if (row.fixedColorPolicy) for (const color of options('outfitPresetLockedPaletteId').filter(x => x.id !== 'random'))
      compare('locked:' + row.id + ':' + color.id, { ...locks, outfitPresetPrimaryColorId: 'light-blue', outfitPresetContrastColorId: 'white', outfitPresetLockedPaletteId: color.id });
    for (const key of ['topBottomPaletteId', 'completeLookPaletteId']) for (const c of options(key).filter(x => x.id !== 'random')) {
      compare(key + ':' + row.id + ':' + c.id, { ...locks, dressColorId: 'light-blue', outfitPresetPrimaryColorId: 'light-blue', [key]: c.id });
    }
    compare('duo:' + row.id, { ...empty(), subjectCount: '2', outfitPresetAId: row.id, outfitPresetBId: row.id,
      outfitPresetAPrimaryColorId: 'light-blue', outfitPresetBPrimaryColorId: 'white', outfitPresetAContrastColorId: 'white', outfitPresetBContrastColorId: 'light-blue' });
    for (const f of options('fixedCompositionSetId').filter(x => /車廂/.test(x.zh))) compare('fixed:' + row.id + ':' + f.id, { ...locks, fixedCompositionSetId: f.id });
    const jacket = options('outerwearId').find(x => x.zh === '丹寧外套');
    assert.ok(jacket, 'reviewed denim outerwear must exist');
    assert.equal(options('outerwearOpeningId').filter(x => x.zh === '敞開穿' || x.zh === '全扣上／全拉上').length, 2);
    for (const opening of options('outerwearOpeningId').filter(x => x.zh === '敞開穿' || x.zh === '全扣上／全拉上')) {
      compare('outerwear:' + row.id + ':' + opening.id, { ...locks, outerwearId: jacket.id, outerwearOpeningId: opening.id, outfitPresetPrimaryColorId: 'light-blue', outfitPresetContrastColorId: 'white' });
    }
    const raw = oldCodec.serializeFavoritePrompt({ ...pair.before.p, id: 'a2-old-' + row.id, date: '2026-10-27T00:00:00.000Z' });
    const rawBytes = JSON.stringify(raw), markdown = oldCodec.buildMarkdownExport(pair.before.p);
    const decoded = codec.deserializeFavoritePrompt(raw), oldDecoded = oldCodec.deserializeFavoritePrompt(raw);
    assert.deepEqual(decoded, expectedCodec.deserializeFavoritePrompt(raw), 'saved source rehydration follows approved catalog');
    assert.deepEqual(outputStates(decoded), outputStates(oldDecoded), 'stored output texts remain exact');
    assert.deepEqual(decoded.selection, oldDecoded.selection);
    const parsed = codec.parseExportedMarkdownPrompt(markdown, controls, 'a2-old');
    const oldParsed = oldCodec.parseExportedMarkdownPrompt(markdown, old.getLockControls(), 'a2-old');
    assert.deepEqual(stablePrompt(parsed), stablePrompt(expectedCodec.parseExportedMarkdownPrompt(markdown, oracle.getLockControls(), 'a2-old')));
    assert.deepEqual(outputStates(parsed), outputStates(oldParsed), 'Markdown output texts remain exact');
    const changes = Object.keys(oldParsed.selection).filter(key => JSON.stringify(parsed.selection[key]) !== JSON.stringify(oldParsed.selection[key]))
      .map(key => ({ key, before: oldParsed.selection[key], after: parsed.selection[key], original: pair.before.p.selection[key] }));
    assert.deepEqual(changes, markdownReview.find(x => x.id === row.id)?.changes || [], 'only explicitly reviewed old Markdown heuristic differences: ' + row.id);
    if (changes.length) markdownRecoveryDifferences.push({ id: row.id, changes });
    compare('saved-restore:' + row.id, codec.buildRestoreLocks(codec.deserializeFavoritePrompt(raw).selection, controls));
    assert.equal(JSON.stringify(raw), rawBytes);
    const imported = oldImport.getFullBodyImportSource(pair.before.p); assert.ok(imported);
    const profile = capture.resolveCapture({ seed: 41 }).profile;
    const oldCaptureLocks = { ...locks, captureMode: 'observation', observationCapture: { ...profile, personSource: 'full-body', importedPerson: imported } };
    compare('old-capture:' + row.id, oldCaptureLocks, { unchanged: true, clean: false });
    const fresh = captureImport.getFullBodyImportSource(pair.after.p);
    const newCaptureLocks = { ...locks, captureMode: 'observation', observationCapture: { ...profile, personSource: 'full-body', importedPerson: fresh } };
    const result = compare('new-capture:' + row.id, newCaptureLocks);
    assert.equal(result.after.p.extraPrompts.find(x => x.id === 'full-body-character').text, fresh.fullBodyPrompt);
    for (const seed of [42, 43]) compare('capture-reroll:' + row.id + ':' + seed, { ...newCaptureLocks, observationCapture: { ...capture.resolveCapture({ seed }).profile, personSource: 'full-body', importedPerson: fresh } });
    saved.push({ id: row.id, raw, markdown, oldCaptureLocks, newCaptureLocks });
  }
  for (const key of ['outfitPresetId', 'specialOutfitId', 'characterProfileId']) for (const item of options(key).filter(x => x.id !== 'random' && !changedIds.has(x.id))) {
    compare('protected:' + key + ':' + item.id, { ...empty(), [key]: item.id }, { unchanged: true, clean: false });
  }
  const report = { baseCommit: review.baseCommit, cases: cases.length, protectedFiles: protectedFiles.length, sourceRecords: 40, structuredBindings: 19, genericPresets: 21, priorSavedRecords: saved.length, changedOutputs, oracleMismatches: 0, markdownRecoveryDifferences, casesDetail: cases };
  writeFileSync(join(out, 'acceptance.json.gz'), pack(report));
  writeFileSync(join(out, 'baseline-and-saved.json.gz'), pack({ baseCommit: review.baseCommit, baseline, saved }));
  console.log(JSON.stringify({ ...report, casesDetail: undefined }));
} finally {
  rmSync(beforeRoot, { recursive: true, force: true }); rmSync(expectedRoot, { recursive: true, force: true });
}

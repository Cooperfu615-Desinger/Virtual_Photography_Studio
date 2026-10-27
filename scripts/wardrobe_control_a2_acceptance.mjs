// Fixed Git oracle: same historical engine with only the explicitly approved data edits.
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
import { A2_ROOT as root, A2_REVIEW as review, A2_INTEGRATION_COMMIT } from './lib/a2DressControlHistoricalReplay.mjs';
import { stablePrompt, sha256, pack, outputStates } from './lib/catalogBaseline.mjs';

const out = resolve(process.argv[2] || '/tmp/a2-dresses-acceptance');
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
  assert.equal(review.rows.length, 24);
  assert.deepEqual(sourceNow.entries.map(x => x.id), sourceBefore.entries.map(x => x.id));
  for (const row of review.rows) {
    assert.deepEqual(row.before, sourceBefore.entries.find(x => x.id === row.id));
    const newEn = row.before.en.split(', ').filter(x => !/^main (?:fabric|latex|glossy fabric|satin|knit|silk|tulle|swim fabric) color controlled by dress color selection$/.test(x) && x !== 'contrast trim controlled by contrast palette').join(', ');
    assert.notEqual(newEn, row.before.en);
    const wanted = { ...row.before, en: newEn, legacyPromptAliases: [...(row.before.legacyPromptAliases || []), row.before.en] };
    assert.deepEqual(sourceNow.entries.find(x => x.id === row.id), wanted);
    assert.deepEqual(row.after, wanted);
    const item = expected.Wardrobe['連身 (Dresses)'].find(x => x.stableId === row.id);
    assert.deepEqual(row.generatedBefore, item);
    item.en = newEn;
    item.legacyPromptAliases = wanted.legacyPromptAliases;
    assert.deepEqual(row.generatedAfter, item);
  }
  assert.deepEqual(sourceNow.entries[0], sourceBefore.entries[0]);
  assert.deepEqual(JSON.parse(readFileSync(join(root, 'webapp/src/data/database.json'))), expected);
  writeFileSync(join(expectedRoot, 'webapp/src/data/database.json'), JSON.stringify(expected));
  const allowed = new Set([review.sourceFile, 'knowledge_base/wardrobe_and_styling.md', 'webapp/src/data/database.json']);
  const protectedFiles = git('ls-tree', '-r', '--name-only', A2_INTEGRATION_COMMIT).toString().trim().split('\n').filter(p => /^(webapp\/src\/|knowledge_base\/)/.test(p) && !p.endsWith('.test.js') && !allowed.has(p));
  for (const p of protectedFiles) assert.equal(sha256(readFileSync(join(root, p))), sha256(git('show', A2_INTEGRATION_COMMIT + ':' + p)), p);
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
  for (const id of ['none', 'light-blue', 'mirror-chrome-silver']) assert.ok(options('dressColorId').some(x => x.id === id), 'reviewed color: ' + id);
  const cases = [], changedOutputs = {}, saved = [], baseline = [];
  const leak = /controlled by dress color selection|contrast trim controlled by contrast palette/i;
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
    for (const f of options('framingId')) for (const color of ['none', 'light-blue', 'mirror-chrome-silver']) {
      compare('crop:' + row.id + ':' + f.id + ':' + color, { ...locks, framingId: f.id, dressColorId: color, outfitPresetPrimaryColorId: color });
    }
    for (const c of options('dressColorId')) compare('color:' + row.id + ':' + c.id, { ...locks, dressColorId: c.id, outfitPresetPrimaryColorId: c.id });
    for (const key of ['topBottomPaletteId', 'completeLookPaletteId']) for (const c of options(key).filter(x => x.id !== 'random')) {
      compare(key + ':' + row.id + ':' + c.id, { ...locks, dressColorId: 'light-blue', outfitPresetPrimaryColorId: 'light-blue', [key]: c.id });
    }
    compare('direct:' + row.id, { ...empty(), dressId: row.id, dressColorId: 'light-blue' });
    compare('duo:' + row.id, { ...empty(), subjectCount: '2', outfitPresetAId: row.id, outfitPresetBId: row.id,
      dressAColorId: 'light-blue', dressBColorId: 'white', outfitPresetAPrimaryColorId: 'light-blue', outfitPresetBPrimaryColorId: 'white' });
    for (const f of options('fixedCompositionSetId').filter(x => /車廂/.test(x.zh))) compare('fixed:' + row.id + ':' + f.id, { ...locks, fixedCompositionSetId: f.id });
    const jacket = options('outerwearId').find(x => x.zh === '丹寧外套');
    assert.ok(jacket, 'reviewed denim outerwear must exist');
    assert.equal(options('outerwearOpeningId').filter(x => x.zh === '敞開穿' || x.zh === '全扣上／全拉上').length, 2);
    for (const opening of options('outerwearOpeningId').filter(x => x.zh === '敞開穿' || x.zh === '全扣上／全拉上')) {
      compare('outerwear:' + row.id + ':' + opening.id, { ...locks, outerwearId: jacket.id, outerwearOpeningId: opening.id });
    }
    const raw = oldCodec.serializeFavoritePrompt({ ...pair.before.p, id: 'a2-old-' + row.id, date: '2026-10-26T00:00:00.000Z' });
    const rawBytes = JSON.stringify(raw), markdown = oldCodec.buildMarkdownExport(pair.before.p);
    const decoded = codec.deserializeFavoritePrompt(raw), oldDecoded = oldCodec.deserializeFavoritePrompt(raw);
    assert.deepEqual(decoded, expectedCodec.deserializeFavoritePrompt(raw), 'saved source rehydration follows approved catalog');
    assert.deepEqual(outputStates(decoded), outputStates(oldDecoded), 'stored output texts remain exact');
    assert.deepEqual(decoded.selection, oldDecoded.selection);
    const parsed = codec.parseExportedMarkdownPrompt(markdown, controls, 'a2-old');
    const oldParsed = oldCodec.parseExportedMarkdownPrompt(markdown, old.getLockControls(), 'a2-old');
    assert.deepEqual(stablePrompt(parsed), stablePrompt(expectedCodec.parseExportedMarkdownPrompt(markdown, oracle.getLockControls(), 'a2-old')));
    assert.deepEqual(outputStates(parsed), outputStates(oldParsed), 'Markdown output texts remain exact');
    assert.deepEqual(parsed.selection, oldParsed.selection);
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
  for (const key of ['outfitPresetId', 'specialOutfitId', 'characterProfileId']) for (const item of options(key).filter(x => x.id !== 'random' && !review.rows.some(r => r.id === x.id))) {
    compare('protected:' + key + ':' + item.id, { ...empty(), [key]: item.id }, { unchanged: true, clean: false });
  }
  const report = { baseCommit: review.baseCommit, integrationCommit: A2_INTEGRATION_COMMIT, cases: cases.length, protectedFiles: protectedFiles.length, sourceRecords: 24, priorSavedRecords: saved.length, changedOutputs, oracleMismatches: 0, casesDetail: cases };
  writeFileSync(join(out, 'acceptance.json.gz'), pack(report));
  writeFileSync(join(out, 'baseline-and-saved.json.gz'), pack({ baseCommit: review.baseCommit, baseline, saved }));
  console.log(JSON.stringify({ ...report, casesDetail: undefined }));
} finally {
  rmSync(beforeRoot, { recursive: true, force: true }); rmSync(expectedRoot, { recursive: true, force: true });
}

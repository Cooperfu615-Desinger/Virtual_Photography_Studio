// Fixed pre-change Git engine plus the one independently derived data delta.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import * as engine from '../webapp/src/lib/engine.js';
import * as codec from '../webapp/src/features/saved-cards/cardCodec.js';
import { transitionPage1Locks } from '../webapp/src/features/page1/lockTransitions.js';
import { resolveCapture } from '../webapp/src/lib/observationCaptureMode.js';
import { getFullBodyImportSource } from '../webapp/src/lib/observationCaptureImport.js';
import { TAPE_ROOT as root, TAPE_REVIEW as r } from './lib/a2SpecialTapeReplay.mjs';
import { stablePrompt, outputStates, pack, sha256 } from './lib/catalogBaseline.mjs';
const out = resolve(process.argv[2] || '/tmp/a2-special-tape-acceptance');
assert.ok(!out.includes('/catalog-architecture-') && !out.includes('/wardrobe-control-a2-dresses-') && !out.includes('/page1-markdown-snapshot-a2-'), 'Do not overwrite historical evidence');
const ownReport = resolve(root, 'Docs/reports/wardrobe-control-a2-special-tape-2026-10-27');
assert.ok(!out.startsWith(resolve(root) + '/') || out === ownReport || out.startsWith(ownReport + '/'), 'Only this batch report may be written inside the repository');
mkdirSync(out, { recursive: true });
const dirs = [mkdtempSync(join(tmpdir(), 'tape-base-')), mkdtempSync(join(tmpdir(), 'tape-oracle-'))];
const git = (...args) => execFileSync('git', ['-C', root, ...args], { maxBuffer: 64 * 1024 * 1024 });
try {
  const archive = git('archive', r.baseCommit, 'webapp/src', 'webapp/package.json');
  for (const dir of dirs) { execFileSync('tar', ['-x', '-C', dir], { input: archive }); symlinkSync(join(root, 'webapp/node_modules'), join(dir, 'webapp/node_modules'), 'dir'); }
  const source = JSON.parse(git('show', r.baseCommit + ':' + r.sourceFile)), db = JSON.parse(git('show', r.baseCommit + ':webapp/src/data/database.json'));
  const before = source.entries.find(x => x.id === r.id); assert.deepEqual(r.before, before);
  const en = before.en.replace('palette-controlled ', '').replace(', tape color follows complete-look palette selection', '');
  assert.notEqual(en, before.en); assert.doesNotMatch(en, /\bred\b/i);
  const after = { ...before, en, legacyPromptAliases: [...(before.legacyPromptAliases || []), before.en] };
  assert.deepEqual(r.after, after);
  source.entries[source.entries.findIndex(x => x.id === r.id)] = after;
  assert.deepEqual(JSON.parse(readFileSync(join(root, r.sourceFile))), source);
  const item = db.Wardrobe[r.category].find(x => x.stableId === r.id); assert.deepEqual(item, r.generatedBefore);
  item.en = en; item.legacyPromptAliases = after.legacyPromptAliases;
  assert.deepEqual(item, r.generatedAfter); assert.deepEqual(engine.getKnowledgeBaseSnapshot(), db);
  writeFileSync(join(dirs[1], 'webapp/src/data/database.json'), JSON.stringify(db));
  const allowed = new Set([r.sourceFile, 'webapp/src/data/database.json', 'knowledge_base/wardrobe_and_styling.md', ...r.management.map(x => x.path)]);
  const protectedFiles = git('ls-tree', '-r', '--name-only', r.baseCommit).toString().trim().split('\n').filter(p => /^(webapp\/src\/|knowledge_base\/)/.test(p) && !p.endsWith('.test.js') && !allowed.has(p) && p !== 'knowledge_base/catalog/README.md');
  for (const path of protectedFiles) assert.equal(sha256(readFileSync(join(root, path))), sha256(git('show', r.baseCommit + ':' + path)), path);
  const load = (dir, file) => import(pathToFileURL(join(dir, file)).href);
  const old = await load(dirs[0], 'webapp/src/lib/engine.js'), oracle = await load(dirs[1], 'webapp/src/lib/engine.js');
  const oldCodec = await load(dirs[0], 'webapp/src/features/saved-cards/cardCodec.js'), expectedCodec = await load(dirs[1], 'webapp/src/features/saved-cards/cardCodec.js');
  const oldTransition = await load(dirs[0], 'webapp/src/features/page1/lockTransitions.js');
  const knownLimitations = [];
  const oldImport = await load(dirs[0], 'webapp/src/lib/observationCaptureImport.js');
  const controls = engine.getLockControls(), options = k => controls.find(c => c.key === k).options;
  const option = (k, label) => { const o = options(k).find(x => x.zh.includes(label)); assert.ok(o, k + label); return o; };
  const empty = () => { const l = engine.createEmptyLocks(); for (const c of controls) { const n = c.options.find(o => o.zh === '全無' || o.id === 'none'); if (n) l[c.key] = n.id; } return { ...l, subjectCount: '1', framingId: option('framingId', '全身鏡頭').id }; };
  const run = (e, locks, seed) => { let calls = 0; const rng = e.createSeededRandom(seed); const p = e.generatePrompts(1, structuredClone(locks), [], { random: () => { calls++; return rng(); } })[0]; return { p, calls }; };
  const cases = [], baseline = [], saved = [], imports = [], changedOutputs = {};
  const leak = /palette-controlled|tape color follows complete-look palette selection/i;
  function compare(name, locks, { unchanged = false, clean = true } = {}) {
    const a = run(old, locks, name), b = run(oracle, locks, name), c = run(engine, locks, name);
    assert.deepEqual(stablePrompt(c.p), stablePrompt(b.p), name + ': fixed Git oracle');
    assert.equal(c.calls, b.calls); assert.equal(c.calls, a.calls); assert.deepEqual(c.p.selection, a.p.selection);
    if (unchanged) assert.deepEqual(stablePrompt(c.p), stablePrompt(a.p), name + ': protected path');
    for (const [k, v] of Object.entries(outputStates(c.p))) {
      if (clean) assert.doesNotMatch(v.text, leak, name + k);
      if (v.text !== outputStates(a.p)[k].text) changedOutputs[k] = (changedOutputs[k] || 0) + 1;
    }
    cases.push({ name, locks, before: sha256(JSON.stringify(stablePrompt(a.p))), after: sha256(JSON.stringify(stablePrompt(c.p))), rngCalls: c.calls, unchanged });
    return { before: a.p, after: c.p };
  }
  for (const palette of options('completeLookPaletteId')) {
    const locks = { ...empty(), specialOutfitId: r.id, completeLookPaletteId: palette.id };
    const pair = compare('baseline:' + palette.id, locks); baseline.push({ id: r.id, palette: palette.id, locks, before: stablePrompt(pair.before), after: stablePrompt(pair.after) });
    for (const crop of options('framingId')) compare('crop:' + palette.id + ':' + crop.id, { ...locks, framingId: crop.id });
    for (const role of ['A', 'B']) for (const crop of options('framingId')) compare('duo:' + role + ':' + palette.id + ':' + crop.id, { ...empty(), subjectCount: '2', ['specialOutfit' + role + 'Id']: option('specialOutfit' + role + 'Id', r.before.zh).id, ['completeLookPalette' + role + 'Id']: palette.id, framingId: crop.id });
    const raw = oldCodec.serializeFavoritePrompt({ ...pair.before, id: 'tape-old-' + palette.id, date: '2026-10-27T00:00:00.000Z' });
    const bytes = JSON.stringify(raw), restored = codec.deserializeFavoritePrompt(raw);
    assert.deepEqual(stablePrompt(restored), stablePrompt(expectedCodec.deserializeFavoritePrompt(raw)));
    assert.deepEqual(outputStates(restored), outputStates(oldCodec.deserializeFavoritePrompt(raw)));
    assert.deepEqual(restored.selection, oldCodec.deserializeFavoritePrompt(raw).selection); assert.equal(JSON.stringify(raw), bytes);
    const markdown = oldCodec.buildMarkdownExport(pair.before);
    for (const [kind, md] of [['snapshot', markdown], ['legacy-prose', markdown.slice(markdown.indexOf('\n') + 1)], ['new-snapshot', codec.buildMarkdownExport(pair.after)]]) {
      const x = codec.parseExportedMarkdownPrompt(md, controls, 'tape-import');
      assert.deepEqual(stablePrompt(x), stablePrompt(expectedCodec.parseExportedMarkdownPrompt(md, oracle.getLockControls(), 'tape-import')));
      assert.deepEqual(outputStates(x), outputStates(oldCodec.parseExportedMarkdownPrompt(md, old.getLockControls(), 'tape-import')));
      if (kind === 'legacy-prose') assert.deepEqual(x.selection, oldCodec.parseExportedMarkdownPrompt(md, old.getLockControls(), 'tape-import').selection, 'legacy prose retains existing inference');
      else assert.equal(x.selection.specialOutfitId, r.id); imports.push({ palette: palette.id, kind, selection: x.selection, outputs: outputStates(x) });
    }
    const parsed = codec.parseLocksFromStandardPrompt(pair.before.grokPrompt, controls);
    assert.deepEqual(parsed.locks, oldCodec.parseLocksFromStandardPrompt(pair.before.grokPrompt, old.getLockControls()).locks);
    compare('restored:' + palette.id, codec.buildRestoreLocks(restored.selection, controls));
    const restoredUi = transitionPage1Locks({ previousLocks: locks, candidateLocks: engine.normalizeLocks(codec.buildRestoreLocks(restored.selection, controls)), lockControls: controls, restoringSelection: true });
    const oldUi = oldTransition.transitionPage1Locks({ previousLocks: locks, candidateLocks: old.normalizeLocks(oldCodec.buildRestoreLocks(oldCodec.deserializeFavoritePrompt(raw).selection, old.getLockControls())), lockControls: old.getLockControls(), restoringSelection: true });
    assert.deepEqual(restoredUi, oldUi, 'special-outfit UI restore behavior matches fixed main');
    assert.equal(restoredUi.completeLookPaletteId, 'none');
    compare('ui-restored:' + palette.id, restoredUi);
    if (palette.id !== 'none') knownLimitations.push({ kind: 'pre-existing-special-outfit-ui-clears-palette', savedPalette: palette.id, appliedPalette: restoredUi.completeLookPaletteId, identicalAtBase: true });

    const historicalPerson = oldImport.getFullBodyImportSource(pair.before), fresh = getFullBodyImportSource(pair.after);
    assert.ok(historicalPerson && fresh);
    const makeCapture = (seed, person) => ({ ...locks, captureMode: 'observation', observationCapture: { ...resolveCapture({ seed }).profile, personSource: 'full-body', importedPerson: person } });
    for (const seed of [41, 42, 43]) {
      compare('old-capture:' + palette.id + ':' + seed, makeCapture(seed, historicalPerson), { unchanged: true, clean: false });
      compare('new-capture:' + palette.id + ':' + seed, makeCapture(seed, fresh));
    }
    saved.push({ id: r.id, palette: palette.id, raw, markdown, oldCaptureLocks: makeCapture(41, historicalPerson), newCaptureLocks: makeCapture(41, fresh) });
  }
  const targetLocks = { ...empty(), specialOutfitId: r.id };
  for (const fixed of options('fixedCompositionSetId').filter(x => !['none', 'random'].includes(x.id))) compare('fixed:' + fixed.id, { ...targetLocks, fixedCompositionSetId: fixed.id });
  for (const coat of options('outerwearId').filter(x => x.zh !== '全無' && x.id !== 'random')) for (const opening of options('outerwearOpeningId').filter(x => ['敞開穿', '全扣上／全拉上'].includes(x.zh))) for (const crop of ['全身鏡頭', '特寫鏡頭']) {
    const framing = options('framingId').find(x => x.zh.includes(crop)); assert.ok(framing, 'Required outerwear framing: ' + crop);
    compare('outerwear:' + coat.id + ':' + opening.id + ':' + crop, { ...targetLocks, outerwearId: coat.id, outerwearOpeningId: opening.id, framingId: framing.id });
  }
  for (const key of ['specialOutfitId', 'outfitPresetId', 'dressId', 'characterProfileId']) for (const item of options(key).filter(x => x.id !== 'random' && x.id !== r.id)) for (const palette of ['none', 'black-red-street', 'silver-metallic'])
    compare('protected:' + key + ':' + item.id + ':' + palette, { ...empty(), [key]: item.id, completeLookPaletteId: palette }, { unchanged: true });
  for (let i = 0; i < 100; i++) compare('random:' + i, engine.createEmptyLocks());
  const report = { baseCommit: r.baseCommit, sourceRecords: 1, cases: cases.length, protectedCases: cases.filter(x => x.unchanged).length, protectedFiles: protectedFiles.length, savedRecords: saved.length, markdownImports: imports.length, changedOutputs, oracleMismatches: 0, knownLimitations };
  writeFileSync(join(out, 'acceptance.json'), JSON.stringify(report, null, 2) + '\n');
  writeFileSync(join(out, 'baseline-and-saved.json.gz'), pack({ baseCommit: r.baseCommit, baseline, saved, imports, cases }));
  console.log(JSON.stringify(report));
} finally { for (const dir of dirs) rmSync(dir, { recursive: true, force: true }); }

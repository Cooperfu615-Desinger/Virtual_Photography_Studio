// Independent second-batch product acceptance against a pinned, reviewed Git revision.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as current from '../webapp/src/lib/engine.js';
import * as codec from '../webapp/src/features/saved-cards/cardCodec.js';
import { transitionPage1Locks } from '../webapp/src/features/page1/lockTransitions.js';
import { midjourneyNaturalFixtures } from '../webapp/src/lib/engine/midjourneyNaturalFixtures.js';
import { stablePrompt, outputStates, differences, sha256, readJson, pack } from './lib/catalogBaseline.mjs';
import { captureImportFlows } from './lib/catalogImportCorpus.mjs';
import { A5_COMMERCIAL_REVIEW as review } from './lib/a5CommercialHistoricalReplay.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const git = (...args) => execFileSync('git', ['-C', root, ...args], { maxBuffer: 256 * 1024 * 1024 });
const temp = mkdtempSync(join(tmpdir(), 'vps-commercial-reference-'));
const revised = review.entries.filter(x => x.decision === 'remove'), ids = new Set(revised.map(x => x.id));
const approved = value => {
  const copy = structuredClone(value);
  const walk = item => {
    if (!item || typeof item !== 'object') return;
    const revision = revised.find(x => x.id === (item.id || item.stableId));
    if (revision) for (const meta of [item.meta, item.meta?.semantic]) if (meta?.tags) {
      assert.deepEqual(meta.tags, revision.beforeTags, 'unexpected source tags in reference prompt');
      meta.tags = [...revision.afterTags];
    }
    for (const child of Object.values(item)) walk(child);
  };
  walk(copy); return copy;
};
try {
  git('archive', '--output', join(temp, 'source.tar'), review.baseCommit, 'webapp/src', 'webapp/package.json', 'webapp/package-lock.json', 'scripts', 'knowledge_base');
  execFileSync('tar', ['-xf', join(temp, 'source.tar'), '-C', temp]);
  symlinkSync(join(root, 'webapp/node_modules'), join(temp, 'webapp/node_modules'), 'dir');
  const load = path => import(pathToFileURL(join(temp, path)));
  const old = await load('webapp/src/lib/engine.js');
  const oldCodec = await load('webapp/src/features/saved-cards/cardCodec.js');
  const oldTransition = (await load('webapp/src/features/page1/lockTransitions.js')).transitionPage1Locks;
  const { prepareImmutableRuntimeLibrary } = await load('webapp/src/lib/engine/runtimeCache.js');
  const original = old.getKnowledgeBaseSnapshot(), oracle = structuredClone(original);
  for (const row of Object.values(oracle.Locations).flat()) if (ids.has(row.stableId)) {
    const revision = revised.find(x => x.id === row.stableId);
    assert.deepEqual(row.meta.semantic.tags, revision.beforeTags); row.meta.semantic.tags = [...revision.afterTags];
  }
  assert.deepEqual(current.getKnowledgeBaseSnapshot(), oracle, 'entire database must equal eleven exact removals');
  prepareImmutableRuntimeLibrary(oracle);
  const sourceFiles = [...new Set(revised.map(x => x.sourceFile))];
  for (const file of sourceFiles) {
    const expected = JSON.parse(git('show', review.baseCommit + ':' + file));
    for (const row of expected.entries) if (ids.has(row.id)) row.meta.semantic.tags = [...revised.find(x => x.id === row.id).afterTags];
    assert.deepEqual(JSON.parse(readFileSync(join(root, file))), expected, file);
  }
  const allowed = new Set([...sourceFiles, 'webapp/src/data/database.json']);
  const protectedPaths = git('ls-tree', '-r', '--name-only', '-z', review.baseCommit).toString().split('\0').filter(path =>
    path && !path.endsWith('.test.js') && (/^(knowledge_base\/|webapp\/src\/data\/|webapp\/src\/lib\/|webapp\/src\/features\/)/.test(path)) && !path.endsWith('/README.md'));
  for (const path of protectedPaths) if (!allowed.has(path)) assert.equal(sha256(readFileSync(join(root, path))), sha256(git('show', review.baseCommit + ':' + path)), 'protected production/baseline changed: ' + path);
  const controls = current.getLockControls(), oldControls = old.getLockControls();
  const options = key => controls.find(x => x.key === key).options;
  const byZh = (key, zh) => options(key).find(x => x.zh === zh).id;
  const full = byZh('framingId', '全身鏡頭 (Full Body Shot)');
  const locksFor = row => ({ ...current.createEmptyLocks(), subjectCount: '1', sceneAttributeId: row.afterTags.includes('indoor') ? 'indoor' : 'outdoor', locationId: row.id, framingId: full });
  const run = (engine, library, locks, seed) => {
    let draws = 0; const random = engine.createSeededRandom(seed);
    const p = engine.generatePrompts(1, structuredClone(locks), library, { random: () => { draws++; return random(); } })[0];
    return { prompt: stablePrompt(p), draws };
  };
  const comparisons = [], pools = [], savedCards = [], transitions = [];
  function compare(id, locks, seed) {
    const before = run(old, [], locks, seed), expected = run(old, oracle, locks, seed), after = run(current, [], locks, seed);
    assert.deepEqual(after, expected, id + ': production differs from independent oracle');
    assert.deepEqual(after, approved(before), id + ': unapproved change beyond exact metadata');
    assert.deepEqual(outputStates(after.prompt), outputStates(before.prompt), id + ': output changed');
    assert.deepEqual(after.prompt.selection, before.prompt.selection, id + ': selections changed');
    assert.equal(after.draws, before.draws, id + ': RNG changed');
    comparisons.push({ id, seed, beforeSha256: sha256(JSON.stringify(before)), afterSha256: sha256(JSON.stringify(after)), rngBefore: before.draws, rngAfter: after.draws, changedPaths: differences(before, after).map(x => x.path) });
    return before.prompt;
  }
  const lightStates = ['', ...options('lightingId').map(x => x.id)];
  const generationLights = ['', ...['全無', '晴朗白日', '城市夜間混合光', '城市高彩度夜色'].map(x => byZh('lightingId', x))];
  for (const row of review.entries) {
    for (const frame of options('framingId')) for (const attr of ['none', locksFor(row).sceneAttributeId]) {
      for (const lightingId of lightStates) {
        const locks = { ...locksFor(row), sceneAttributeId: attr, framingId: frame.id, lightingId };
        const a = old.getSceneDependentOptions([], locks), b = current.getSceneDependentOptions([], locks);
        const selected = pool => Object.fromEntries(Object.entries(pool).map(([k, v]) => [k, v.map(x => x.id)]));
        assert.deepEqual(selected(a), selected(b), row.id + '/ordered pools');
        pools.push({ locationId: row.id, framingId: frame.id, sceneAttributeId: attr, lightingId, idsSha256: sha256(JSON.stringify(selected(a))), counts: Object.fromEntries(Object.entries(a).map(([k,v]) => [k,v.length])) });
      }
      for (const lightingId of generationLights) compare('scene:' + row.id + '/' + frame.id + '/' + attr + '/' + lightingId, { ...locksFor(row), sceneAttributeId: attr, framingId: frame.id, lightingId }, 'commercial-same-seed-v1');
    }
    for (const frame of options('framingId')) compare('duo:' + row.id + '/' + frame.id, { ...locksFor(row), subjectCount: '2', framingId: frame.id }, 'commercial-duo');
    for (let seed = 0; seed < 20; seed++) compare('random:' + row.id + '/' + seed, locksFor(row), 'commercial-random-' + seed);
    for (const lightingId of generationLights) for (const restoringSelection of [false, true]) {
      const args = { previousLocks: { ...current.createEmptyLocks(), subjectCount: '1' }, candidateLocks: { ...locksFor(row), lightingId }, restoringSelection };
      const a = oldTransition({ ...structuredClone(args), lockControls: oldControls }), b = transitionPage1Locks({ ...structuredClone(args), lockControls: controls });
      assert.deepEqual(a, b, row.id + '/UI transition'); transitions.push({ locationId: row.id, lightingId, restoringSelection, resultSha256: sha256(JSON.stringify(b)) });
    }
    for (const lightingId of [byZh('lightingId', '全無'), byZh('lightingId', '晴朗白日'), byZh('lightingId', '城市夜間混合光')]) {
      const saved = { ...run(old, [], { ...locksFor(row), lightingId }, 'commercial-old-card').prompt, id: 'commercial-old-' + row.id + lightingId, date: '2026-10-26T00:00:00.000Z' };
      const raw = oldCodec.serializeFavoritePrompt(saved), bytes = JSON.stringify(raw);
      const a = oldCodec.deserializeFavoritePrompt(structuredClone(raw)), b = codec.deserializeFavoritePrompt(structuredClone(raw));
      assert.deepEqual(b, approved(a)); assert.deepEqual(outputStates(b), outputStates(saved)); assert.equal(JSON.stringify(raw), bytes);
      const locks = codec.buildRestoreLocks(b.selection, controls);
      assert.deepEqual(locks, oldCodec.buildRestoreLocks(a.selection, oldControls));
      compare('restore:' + saved.id, locks, 'commercial-restored');
      const markdown = oldCodec.buildMarkdownExport(saved);
      const parsed = codec.parseExportedMarkdownPrompt(markdown, controls, saved.id), oldParsed = oldCodec.parseExportedMarkdownPrompt(markdown, oldControls, saved.id);
      assert.deepEqual(stablePrompt(parsed), approved(stablePrompt(oldParsed)));
      savedCards.push({ locationId: row.id, lightingId, raw, markdown, markdownLocationId: parsed.selection.locationId });
    }
  }
  const unaffected = options('locationId').filter(x => !ids.has(x.id));
  for (const row of unaffected) for (const framingId of [full, byZh('framingId', '胸上特寫')]) compare('unaffected:' + row.id + framingId, { ...current.createEmptyLocks(), subjectCount: '1', sceneAttributeId: 'none', locationId: row.id, framingId }, 'commercial-unaffected');
  for (const fixture of midjourneyNaturalFixtures()) compare('mode:' + fixture.id, fixture.locks, fixture.seed);
  const alignment = readJson(join(root, 'webapp/src/lib/engine/catalogBaseline/revisions/2f56438/corpus.json.gz'));
  for (const row of alignment.cases) compare('alignment:' + row.id, row.locks, row.seed);
  const flowsBefore = await captureImportFlows(temp, alignment.sources), flowsAfter = await captureImportFlows(root, alignment.sources);
  assert.deepEqual(flowsAfter, approved(flowsBefore), 'real import/reimport/reroll API flows');
  const report = { version: 1, baseCommit: review.baseCommit, sourceFiles, removed: revised.length, retained: review.entries.length - revised.length, protectedFiles: protectedPaths.length, sourceDelta: differences(original, oracle), poolCases: pools.length, pools, cases: comparisons.length, changedMetadataCases: comparisons.filter(x => x.changedPaths.length).length, outputDifferences: 0, selectionDifferences: 0, rngDifferences: 0, oracleMismatches: 0, comparisons, savedCards, transitions, unaffectedLocations: unaffected.length, importFlowSources: Object.keys(flowsAfter.sources).length, importFlowsSha256: sha256(JSON.stringify(flowsAfter)) };
  if (process.argv[2]) writeFileSync(resolve(process.argv[2]), process.argv[2].endsWith('.gz') ? pack(report) : JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ ...report, pools: undefined, comparisons: undefined, savedCards: savedCards.length, transitions: transitions.length, sourceDelta: report.sourceDelta.map(x => x.path) }, null, 2));
} finally { rmSync(temp, { recursive: true, force: true }); }

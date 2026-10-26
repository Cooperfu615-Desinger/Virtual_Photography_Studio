// Independent product-change acceptance against the reviewed pre-A5 Git revision.
// Never records/replaces historical A-E fixtures or modifies the reference checkout.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as current from '../webapp/src/lib/engine.js';
import * as currentCodec from '../webapp/src/features/saved-cards/cardCodec.js';
import { midjourneyNaturalFixtures } from '../webapp/src/lib/engine/midjourneyNaturalFixtures.js';
import { stablePrompt, differences, sha256, outputStates } from './lib/catalogBaseline.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const base = 'a9dd3616bc6596cdb199420f3189a420c6f1ed17';
const git = (...args) => execFileSync('git', ['-C', root, ...args], { maxBuffer: 256 * 1024 * 1024 });
const temporary = mkdtempSync(join(tmpdir(), 'vps-a5-reference-'));
const output = process.argv[2];
const revisions = [
  ['locations:城市與社群感-urban-social-snapshots:戶外-倫敦排屋街道:41', 'subterranean', 5, 19],
  ['locations:自然與戶外-nature-outdoors:戶外-清澈海灣岩岸:1', 'commercial', 19, 17],
  ['locations:自然與戶外-nature-outdoors:戶外-草地與樹木:3', 'commercial', 19, 17],
];
try {
  git('archive', '--output', join(temporary, 'source.tar'), base, 'webapp/src', 'webapp/package.json', 'webapp/package-lock.json');
  execFileSync('tar', ['-xf', join(temporary, 'source.tar'), '-C', temporary]);
  symlinkSync(join(root, 'webapp/node_modules'), join(temporary, 'webapp/node_modules'), 'dir');
  const load = path => import(pathToFileURL(join(temporary, path)));
  const old = await load('webapp/src/lib/engine.js');
  const oldCodec = await load('webapp/src/features/saved-cards/cardCodec.js');
  const { prepareImmutableRuntimeLibrary } = await load('webapp/src/lib/engine/runtimeCache.js');
  const original = old.getKnowledgeBaseSnapshot();
  const oracle = structuredClone(original);
  for (const [id, tag] of revisions) {
    const row = Object.values(oracle.Locations).flat().find(x => x.stableId === id);
    assert.equal(row.meta.semantic.tags.filter(x => x === tag).length, 1);
    row.meta.semantic.tags = row.meta.semantic.tags.filter(x => x !== tag);
  }
  assert.deepEqual(current.getKnowledgeBaseSnapshot(), oracle, 'entire database differs only by the three reviewed removals');
  prepareImmutableRuntimeLibrary(oracle);
  const protectedFiles = git('ls-tree', '-r', '--name-only', '-z', base).toString().split('\0').filter(Boolean).filter(path =>
    /^(knowledge_base\/catalog\/|webapp\/src\/data\/)/.test(path)
    || /^(webapp\/src\/lib\/engine(?:\.js|\/.*\.js)|webapp\/src\/features\/saved-cards\/.*\.js)$/.test(path)
    || /(?:catalogBaseline\/|catalogSnapshot\.|legacyMappings\.baseline|catalog-architecture-[a-e]-.*\/.*\.(?:json|gz)$)/.test(path)
    || /^scripts\/(?:catalog_(?:baseline|coverage_baseline|alignment_baseline)\.mjs|lib\/catalog(?:Baseline|Corpus|ImportCorpus)\.mjs)$/.test(path));
  const changedFiles = [];
  for (const path of protectedFiles) {
    if (path.endsWith('.test.js') || path.endsWith('/README.md')) continue;
    const before = existsSync(join(temporary, path)) ? readFileSync(join(temporary, path)) : git('show', `${base}:${path}`);
    const after = readFileSync(join(root, path));
    if (!before.equals(after)) changedFiles.push(path);
  }
  assert.deepEqual(changedFiles.sort(), [
    'knowledge_base/catalog/Locations/城市與社群感-urban-social-snapshots.json',
    'knowledge_base/catalog/Locations/自然與戶外-nature-outdoors.json',
    'webapp/src/data/database.json',
  ].sort(), 'no other catalog, production engine, codec or sealed artifact changes');
  for (const path of changedFiles.filter(x => x.startsWith('knowledge_base'))) {
    const a = JSON.parse(git('show', `${base}:${path}`));
    const b = JSON.parse(readFileSync(join(root, path)));
    const expected = structuredClone(a);
    const walk = value => {
      if (!value || typeof value !== 'object') return;
      const match = revisions.find(([id]) => id === value.id);
      if (match) value.meta.semantic.tags = value.meta.semantic.tags.filter(x => x !== match[1]);
      else for (const child of Object.values(value)) walk(child);
    };
    walk(expected); assert.deepEqual(b, expected, path);
  }
  const approvedTagsInValue = value => {
    const copy = structuredClone(value);
    const walk = item => {
      if (!item || typeof item !== 'object') return;
      const revision = revisions.find(([id]) => id === (item.id || item.stableId));
      if (revision) for (const meta of [item.meta, item.meta?.semantic]) {
        if (meta?.tags) meta.tags = meta.tags.filter(tag => tag !== revision[1]);
      }
      for (const child of Object.values(item)) walk(child);
    };
    walk(copy); return copy;
  };
  const controls = current.getLockControls();
  const options = key => controls.find(x => x.key === key).options;
  const option = (key, zh) => options(key).find(x => x.zh === zh).id;
  const baseLocks = { ...current.createEmptyLocks(), subjectCount: '1', sceneAttributeId: 'outdoor' };
  const cases = [], pools = [], restores = [];
  const run = (engine, library, locks, seed) => {
    let draws = 0;
    const random = engine.createSeededRandom(seed);
    const prompt = engine.generatePrompts(1, locks, library, { random: () => { draws++; return random(); } })[0];
    return { prompt: stablePrompt(prompt), draws };
  };
  function compare(id, locks, seed, unchanged = false) {
    const before = run(old, [], locks, seed);
    const expected = run(old, oracle, locks, seed);
    const actual = run(current, [], locks, seed);
    assert.deepEqual(actual, expected, `${id}: production must equal the old engine plus ONLY the approved tags`);
    if (unchanged) assert.deepEqual(actual, before, `${id}: unrelated location changed`);
    const delta = differences(before, actual);
    cases.push({ id, seed, beforeSha256: sha256(JSON.stringify(before)), afterSha256: sha256(JSON.stringify(actual)), rngBefore: before.draws, rngAfter: actual.draws,
      changedPaths: delta.map(x => x.path), outputsChanged: Object.keys(outputStates(before.prompt)).filter(key => JSON.stringify(outputStates(before.prompt)[key]) !== JSON.stringify(outputStates(actual.prompt)[key])) });
    return before.prompt;
  }
  for (const [locationId, , beforeCount, afterCount] of revisions) {
    for (const framing of options('framingId')) for (const sceneAttributeId of ['none', 'outdoor']) {
      const locks = { ...baseLocks, locationId, framingId: framing.id, sceneAttributeId };
      const before = old.getSceneDependentOptions([], locks);
      const after = current.getSceneDependentOptions([], locks);
      assert.deepEqual(after, old.getSceneDependentOptions(oracle, locks));
      assert.equal(before.lightingOptions.length, beforeCount);
      assert.equal(after.lightingOptions.length, afterCount);
      assert.deepEqual(after.lightDirectionOptions, before.lightDirectionOptions);
      pools.push({ locationId, framingId: framing.id, sceneAttributeId, before: before.lightingOptions.map(x => x.id), after: after.lightingOptions.map(x => x.id), subjectLightCount: after.lightDirectionOptions.length });
      for (const lightingId of ['', option('lightingId', '全無'), option('lightingId', '晴朗白日'), option('lightingId', '城市夜間混合光'), option('lightingId', '城市高彩度夜色')]) {
        compare(`scene:${locationId}/${framing.id}/${sceneAttributeId}/${lightingId || 'random'}`, { ...locks, lightingId }, 'a5-same-seed-v1');
      }
    }
    const locks = { ...baseLocks, locationId, framingId: option('framingId', '全身鏡頭 (Full Body Shot)') };
    for (let seed = 0; seed < 40; seed++) {
      compare(`random:${locationId}/${seed}`, locks, `a5-random-${seed}`);
      const p = run(current, [], locks, `a5-random-${seed}`).prompt;
      assert.ok(current.getSceneDependentOptions([], locks).lightingOptions.some(x => x.id === p.selection.lightingId));
    }
    for (const lightingId of [option('lightingId', '晴朗白日'), option('lightingId', '城市夜間混合光')]) {
      const saved = { ...run(old, [], { ...locks, lightingId }, 'a5-old-card').prompt, id: `a5-old-card-${locationId}-${lightingId}`, date: '2026-10-25T00:00:00.000Z' };
      const raw = oldCodec.serializeFavoritePrompt(saved);
      const restored = currentCodec.deserializeFavoritePrompt(structuredClone(raw));
      assert.deepEqual(restored, approvedTagsInValue(oldCodec.deserializeFavoritePrompt(structuredClone(raw))), 'only resolved scene metadata changes; stored text and IDs stay intact');
      assert.deepEqual(outputStates(restored), outputStates(saved));
      const recovered = currentCodec.buildRestoreLocks(restored.selection, controls);
      assert.equal(recovered.locationId, locationId); assert.equal(recovered.lightingId, lightingId);
      const regenerated = run(current, [], recovered, 'a5-old-card').prompt;
      assert.equal(regenerated.selection.locationId, locationId); assert.equal(regenerated.selection.lightingId, lightingId);
      const markdown = oldCodec.buildMarkdownExport(saved);
      const parsed = currentCodec.parseExportedMarkdownPrompt(markdown, controls, 'a5-old-card');
      assert.deepEqual(stablePrompt(parsed), approvedTagsInValue(stablePrompt(oldCodec.parseExportedMarkdownPrompt(markdown, old.getLockControls(), 'a5-old-card'))));
      restores.push({ locationId, lightingId, saved, markdown, markdownLocationId: parsed.selection.locationId });
    }
  }
  const changedIds = new Set(revisions.map(x => x[0]));
  let unaffectedLocations = 0;
  for (const location of options('locationId').filter(x => !changedIds.has(x.id))) {
    unaffectedLocations++;
    for (const framingId of [option('framingId', '全身鏡頭 (Full Body Shot)'), option('framingId', '胸上特寫')]) {
      const locks = { ...baseLocks, sceneAttributeId: 'none', locationId: location.id, framingId };
      assert.deepEqual(current.getSceneDependentOptions([], locks), old.getSceneDependentOptions(oracle, locks));
      const before = old.getSceneDependentOptions([], locks), after = current.getSceneDependentOptions([], locks);
      assert.deepEqual(after.lightingOptions, before.lightingOptions);
      assert.deepEqual(after.lightDirectionOptions, before.lightDirectionOptions);
      compare(`unaffected:${location.id}/${framingId}`, locks, 'a5-unaffected', true);
    }
  }
  for (const fixture of midjourneyNaturalFixtures()) compare(`mode:${fixture.id}`, fixture.locks, fixture.seed);
  const report = { version: 1, baseCommit: base, protectedFilesChecked: protectedFiles.filter(path => !path.endsWith('.test.js') && !path.endsWith('/README.md')).length, sourceDelta: differences(original, oracle), pools, unaffectedLocations,
    cases: cases.length, changedCases: cases.filter(x => x.changedPaths.length).length, rngChangedCases: cases.filter(x => x.rngBefore !== x.rngAfter).length,
    oracleMismatches: 0, comparisons: cases, savedCards: restores };
  if (output) writeFileSync(resolve(output), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ ...report, pools: pools.length, sourceDelta: report.sourceDelta.map(x => x.path), comparisons: undefined, savedCards: restores.length }, null, 2));
} finally { rmSync(temporary, { recursive: true, force: true }); }

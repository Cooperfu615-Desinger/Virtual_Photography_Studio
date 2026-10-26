import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEmptyLocks, createSeededRandom, generatePrompts, getCompiledCatalogForTesting, getKnowledgeBaseSnapshot, getLockControls, getSceneDependentOptions } from '../engine.js';
import { buildMarkdownExport, buildRestoreLocks, deserializeFavoritePrompt, parseExportedMarkdownPrompt, serializeFavoritePrompt } from '../../features/saved-cards/cardCodec.js';
import { transitionPage1Locks } from '../../features/page1/lockTransitions.js';
import { outputStates } from '../../../../scripts/lib/catalogBaseline.mjs';
import { preA5Database, A5_TAG_REVISIONS } from '../../../../scripts/lib/a5HistoricalReplay.mjs';

const controls = getLockControls();
const option = (key, name) => controls.find(c => c.key === key).options.find(o => o.zh === name);
const cases = [
  { name: '戶外：倫敦排屋街道', tag: 'subterranean', tags: ['urban', 'outdoor', 'heritage'], count: 19 },
  { name: '戶外：清澈海灣岩岸', tag: 'commercial', tags: ['outdoor', 'natural', 'waterfront'], count: 17 },
  { name: '戶外：草地與樹木', tag: 'commercial', tags: ['outdoor', 'natural', 'green_space'], count: 17 },
];
const full = controls.find(c => c.key === 'framingId').options.find(o => /全身/.test(o.zh)).id;
const locksFor = row => ({ ...createEmptyLocks(), subjectCount: '1', sceneAttributeId: 'outdoor', locationId: option('locationId', row.name).id, framingId: full });
const cityLights = ['城市夜間混合光', '城市高彩度夜色'].map(name => option('lightingId', name).id);

test('A5 only the three approved formal scene semantics override historical text inference', () => {
  const source = getKnowledgeBaseSnapshot();
  const legacy = structuredClone(source);
  for (const row of cases) {
    const current = option('locationId', row.name);
    assert.deepEqual(current.meta.tags, row.tags);
    const raw = Object.values(source.Locations).flat().find(x => x.stableId === current.id);
    assert.deepEqual(raw.meta.semantic.tags, row.tags);
    assert.ok(raw.legacyIds.includes(current.id));
    const old = Object.values(legacy.Locations).flat().find(x => x.stableId === current.id);
    delete old.meta.semantic;
  }
  const inferred = Object.values(getCompiledCatalogForTesting(legacy).entries.locations).flat();
  for (const row of cases) assert.ok(inferred.find(x => x.zh === row.name).meta.tags.includes(row.tag), `${row.name}: historical/custom fallback is unchanged`);
  assert.deepEqual(getLockControls(), controls, 'custom compilation must not mutate the formal runtime');
});

test('A5 ordered ambient pools work for every crop', () => {
  const framings = controls.find(c => c.key === 'framingId').options;
  for (const row of cases) for (const framing of framings) for (const sceneAttributeId of ['none', 'outdoor']) {
    const dependent = getSceneDependentOptions([], { ...locksFor(row), framingId: framing.id, sceneAttributeId });
    assert.equal(dependent.lightingOptions.length, row.count, `${row.name}/${framing.zh}/${sceneAttributeId}`);
    const pool = dependent.lightingOptions.map(x => x.id);
    for (const id of cityLights) assert.equal(pool.includes(id), row.tag === 'subterranean');
    assert.ok(pool.includes(option('lightingId', '晴朗白日').id));
    assert.ok(pool.includes(option('lightingId', '全無').id));
  }
});

test('A5 valid explicit light and scene IDs survive all six outputs and JSON/Markdown restores', () => {
  for (const row of cases) {
    const locks = { ...locksFor(row), lightingId: option('lightingId', '晴朗白日').id };
    const prompt = generatePrompts(1, locks, [], { random: createSeededRandom(`a5-restore-${row.name}`) })[0];
    assert.equal(prompt.selection.locationId, locks.locationId);
    assert.equal(prompt.selection.lightingId, locks.lightingId);
    assert.equal(prompt.extraPrompts.length, 2);
    for (const field of ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt', 'nanoBananaPrompt']) assert.ok(prompt[field].length);
    const restored = deserializeFavoritePrompt(JSON.parse(JSON.stringify(serializeFavoritePrompt(prompt))));
    const restoreLocks = buildRestoreLocks(restored.selection, controls);
    assert.equal(restoreLocks.locationId, locks.locationId);
    assert.equal(restoreLocks.lightingId, locks.lightingId);
    assert.deepEqual(outputStates(restored), outputStates(prompt), 'saved text is preserved');
    const markdown = buildMarkdownExport(prompt);
    const parsed = parseExportedMarkdownPrompt(markdown, controls, 'a5-markdown');
    const historicalControls = getLockControls(preA5Database());
    const historicalParsed = parseExportedMarkdownPrompt(markdown, historicalControls, 'a5-markdown');
    assert.deepEqual(parsed.selection, historicalParsed.selection, 'text-only parser keeps its existing projection limitations');
    const regenerated = generatePrompts(1, restoreLocks, [], { random: createSeededRandom('a5-restored') })[0];
    assert.equal(regenerated.selection.locationId, locks.locationId);
    assert.equal(regenerated.selection.lightingId, locks.lightingId);
  }
});

test('A5 preserves explicit historical city-light locks while excluding them from natural candidate pools', () => {
  for (const row of cases.slice(1)) for (const lightingId of cityLights) {
    const locks = { ...locksFor(row), lightingId };
    const restored = buildRestoreLocks(locks, controls);
    assert.equal(restored.locationId, locks.locationId);
    assert.equal(restored.lightingId, lightingId, 'saved intent is retained');
    const prompt = generatePrompts(1, restored, [], { random: createSeededRandom(`a5-old-light-${lightingId}`) })[0];
    assert.equal(prompt.selection.locationId, locks.locationId);
    assert.equal(prompt.selection.lightingId, lightingId, 'existing explicit-lock priority is unchanged');
    assert.ok(!getSceneDependentOptions([], locks).lightingOptions.some(x => x.id === lightingId));
  }
});


test('A5 historical inverse is exact, isolated, and rejects unreviewed tag changes', () => {
  const source = getKnowledgeBaseSnapshot();
  const bytes = JSON.stringify(source);
  const historical = preA5Database(source);
  assert.equal(JSON.stringify(source), bytes);
  for (const revision of A5_TAG_REVISIONS) {
    const row = Object.values(historical.Locations).flat().find(x => x.stableId === revision.id);
    assert.deepEqual(row.meta.semantic.tags, revision.before);
  }
  const unexpected = structuredClone(source);
  Object.values(unexpected.Locations).flat().find(x => x.stableId === A5_TAG_REVISIONS[0].id).meta.semantic.tags.push('natural');
  assert.throws(() => preA5Database(unexpected), /unreviewed change/);
});

test('A5 random generation uses only the new candidate pools and explicit none remains none', () => {
  for (const row of cases) {
    const locks = locksFor(row);
    const allowed = new Set(getSceneDependentOptions([], locks).lightingOptions.map(x => x.id));
    for (let seed = 0; seed < 20; seed++) {
      const prompt = generatePrompts(1, locks, [], { random: createSeededRandom(`a5-random-${seed}`) })[0];
      assert.ok(allowed.has(prompt.selection.lightingId), `${row.name}/${seed}`);
    }
    const none = option('lightingId', '全無').id;
    assert.equal(generatePrompts(1, { ...locks, lightingId: none }, [], { random: createSeededRandom('a5-none') })[0].selection.lightingId, none);
  }
});

test('A5 existing UI transitions clear unavailable city lights without rewriting saved payloads', () => {
  for (const row of cases.slice(1)) for (const restoringSelection of [false, true]) {
    const previousLocks = { ...locksFor(cases[0]), lightingId: cityLights[0] };
    const candidateLocks = { ...previousLocks, locationId: option('locationId', row.name).id };
    const original = structuredClone(candidateLocks);
    const next = transitionPage1Locks({ previousLocks, candidateLocks, lockControls: controls, restoringSelection });
    assert.equal(next.locationId, candidateLocks.locationId);
    assert.equal(next.lightingId, '');
    assert.deepEqual(candidateLocks, original);
  }
});

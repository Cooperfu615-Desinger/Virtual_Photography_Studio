import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import { createEmptyLocks, createSeededRandom, generatePrompts, getCompiledCatalogForTesting, getKnowledgeBaseSnapshot, getLockControls, getSceneDependentOptions } from '../engine.js';
import { prepareImmutableRuntimeLibrary } from './runtimeCache.js';
import { buildMarkdownExport, buildRestoreLocks, deserializeFavoritePrompt, parseExportedMarkdownPrompt, serializeFavoritePrompt } from '../../features/saved-cards/cardCodec.js';
import { transitionPage1Locks } from '../../features/page1/lockTransitions.js';
import { outputStates } from '../../../../scripts/lib/catalogBaseline.mjs';
import { A5_COMMERCIAL_REVIEW as review, preCommercialDatabase, preAllA5Database } from '../../../../scripts/lib/a5CommercialHistoricalReplay.mjs';
const controls = getLockControls(), source = getKnowledgeBaseSnapshot();
const options = key => controls.find(x => x.key === key).options;
const full = options('framingId').find(x => x.zh.includes('全身')).id;
const light = name => options('lightingId').find(x => x.zh === name).id;
const locksFor = row => ({ ...createEmptyLocks(), subjectCount: '1', locationId: row.id, sceneAttributeId: row.afterTags.includes('indoor') ? 'indoor' : 'outdoor', framingId: full });
const ids = options => options.map(x => x.id);
const run = (library, locks, seed) => {
  let draws = 0; const random = createSeededRandom(seed);
  const p = generatePrompts(1, locks, library, { random: () => { draws++; return random(); } })[0];
  return { p, draws };
};
test('commercial review pins eleven removals and four retained entries without touching CRT', () => {
  assert.equal(review.entries.filter(x => x.decision === 'remove').length, 11);
  assert.equal(review.entries.filter(x => x.decision === 'retain').length, 4);
  for (const row of review.entries) {
    const option = options('locationId').find(x => x.id === row.id);
    assert.deepEqual(option.meta.tags, row.afterTags, row.zh);
    assert.equal(option.en, row.sourceEn); assert.equal(option.desc, row.sourceDesc);
  }
  assert.deepEqual(options('locationId').find(x => x.zh.includes('CRT')).meta.tags, ['indoor', 'set', 'controlled', 'studio', 'outdoor', 'studio_lighting_scene']);
});
test('historical/custom fallback still infers commercial; formal semantics override it', () => {
  const legacy = structuredClone(source);
  for (const row of Object.values(legacy.Locations).flat()) if (review.entries.some(x => x.id === row.stableId)) delete row.meta.semantic;
  const entries = Object.values(getCompiledCatalogForTesting(legacy).entries.locations).flat();
  for (const row of review.entries) assert.ok(entries.find(x => x.id === row.id).meta.tags.includes('commercial'), row.zh);
  assert.deepEqual(getKnowledgeBaseSnapshot(), source);
});
test('inverse restores exact previous database and rejects extra tags, missing IDs, duplicates and retained-item changes', () => {
  const bytes = JSON.stringify(source);
  const expected = JSON.parse(execFileSync('git', ['show', review.baseCommit + ':webapp/src/data/database.json'], { maxBuffer: 20 * 1024 * 1024 }));
  assert.deepEqual(preCommercialDatabase(source), expected);
  assert.equal(JSON.stringify(source), bytes);
  assert.notDeepEqual(preAllA5Database(source), expected, 'the earlier three revisions are a separate inverse');
  for (const kind of ['tag', 'missing', 'duplicate', 'retain']) {
    const bad = structuredClone(source);
    const id = review.entries.find(x => x.decision === (kind === 'retain' ? 'retain' : 'remove')).id;
    const category = Object.values(bad.Locations).find(rows => rows.some(x => x.stableId === id));
    const row = category.find(x => x.stableId === id);
    if (kind === 'tag' || kind === 'retain') row.meta.semantic.tags.push('natural');
    if (kind === 'missing') category.splice(category.indexOf(row), 1);
    if (kind === 'duplicate') category.push(structuredClone(row));
    assert.throws(() => preCommercialDatabase(bad), /unreviewed change|exactly one/);
  }
});
test('all fifteen scenes preserve ordered candidate pools for every crop, effective attribute and ambient state', () => {
  const before = prepareImmutableRuntimeLibrary(preCommercialDatabase());
  for (const row of review.entries) for (const framing of options('framingId')) for (const sceneAttributeId of ['none', locksFor(row).sceneAttributeId]) for (const lightingId of ['', ...ids(options('lightingId'))]) {
    const locks = { ...locksFor(row), framingId: framing.id, sceneAttributeId, lightingId };
    const a = getSceneDependentOptions(before, locks), b = getSceneDependentOptions([], locks);
    for (const key of ['locationOptions', 'lightingOptions', 'lightDirectionOptions', 'poseAnchorOptions']) assert.deepEqual(ids(a[key]), ids(b[key]), row.zh + '/' + key);
  }
});
test('single, duo and all crops preserve selections, six output states and RNG', () => {
  const before = prepareImmutableRuntimeLibrary(preCommercialDatabase());
  for (const row of review.entries) for (const framing of options('framingId')) for (const subjectCount of ['1', '2']) {
    const locks = { ...locksFor(row), framingId: framing.id, subjectCount };
    const a = run(before, locks, 'a5-commercial-regression'), b = run([], locks, 'a5-commercial-regression');
    assert.deepEqual(a.p.selection, b.p.selection); assert.deepEqual(outputStates(a.p), outputStates(b.p)); assert.equal(a.draws, b.draws);
  }
});
test('old JSON and Markdown preserve public text and IDs; restored generation remains equivalent', () => {
  const before = prepareImmutableRuntimeLibrary(preCommercialDatabase()), oldControls = getLockControls(before);
  for (const row of review.entries) for (const lightingId of [light('全無'), light('晴朗白日'), light('城市夜間混合光')]) {
    const locks = { ...locksFor(row), lightingId }, saved = run(before, locks, 'a5-commercial-restore').p;
    const raw = serializeFavoritePrompt(saved), bytes = JSON.stringify(raw);
    const restored = deserializeFavoritePrompt(structuredClone(raw));
    assert.deepEqual(outputStates(restored), outputStates(saved));
    assert.equal(restored.selection.locationId, saved.selection.locationId); assert.equal(restored.selection.lightingId, saved.selection.lightingId); assert.equal(JSON.stringify(raw), bytes);
    const restoredLocks = buildRestoreLocks(restored.selection, controls);
    const a = run(before, restoredLocks, 'a5-commercial-restore'), b = run([], restoredLocks, 'a5-commercial-restore');
    assert.deepEqual(a.p.selection, b.p.selection); assert.deepEqual(outputStates(a.p), outputStates(b.p));
    const markdown = buildMarkdownExport(saved);
    assert.deepEqual(parseExportedMarkdownPrompt(markdown, controls, 'commercial-card').selection, parseExportedMarkdownPrompt(markdown, oldControls, 'commercial-card').selection);
  }
});
test('UI scene switches and Saved Cards apply retain the prior availability policy', () => {
  const before = prepareImmutableRuntimeLibrary(preCommercialDatabase()), oldControls = getLockControls(before);
  for (const row of review.entries) for (const restoringSelection of [false, true]) for (const lightingId of ['', light('全無'), light('晴朗白日'), light('城市夜間混合光')]) {
    const previousLocks = { ...createEmptyLocks(), subjectCount: '1' }, candidateLocks = { ...locksFor(row), lightingId }, bytes = JSON.stringify(candidateLocks);
    const args = { previousLocks, candidateLocks, restoringSelection };
    assert.deepEqual(transitionPage1Locks({ ...args, lockControls: controls }), transitionPage1Locks({ ...args, lockControls: oldControls }));
    assert.equal(JSON.stringify(candidateLocks), bytes);
  }
});

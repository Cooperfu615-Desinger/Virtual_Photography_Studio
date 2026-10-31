import {preC7ColorHistoricalTest} from '../../../../scripts/lib/c7ColorHistoricalTest.mjs';
const c7ColorHistoricalTest = preC7ColorHistoricalTest(import.meta.url);
import { preA2HistoricalTest } from '../../../../scripts/lib/a2DressControlHistoricalTest.mjs';
const a2HistoricalTest = preA2HistoricalTest(import.meta.url);
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { createEmptyLocks, createSeededRandom, generatePrompts, getCompiledCatalogForTesting, getKnowledgeBaseSnapshot, getLockControls, getSceneDependentOptions } from '../engine.js';
import { prepareImmutableRuntimeLibrary } from './runtimeCache.js';
import { CRT_MIDJOURNEY_SELECTIONS, naturalFixtureLocks } from './midjourneyNaturalFixtures.js';
import { transitionPage1Locks } from '../../features/page1/lockTransitions.js';
import { outputStates } from '../../../../scripts/lib/catalogBaseline.mjs';
import { A5_XIMENDING_REVIEW as r, XIMENDING_ROOT as root, historicalGit, preXimendingDatabase, preAllA5Database } from '../../../../scripts/lib/a5XimendingHistoricalReplay.mjs';
const source = getKnowledgeBaseSnapshot(), controls = getLockControls();
const options = k => controls.find(x => x.key === k).options;
const option = (k, zh) => options(k).find(x => x.zh === zh).id;
const find = db => Object.values(db.Locations).flat().find(x => x.stableId === r.id);
const full = option('framingId', '全身鏡頭 (Full Body Shot)');
const locks = { ...createEmptyLocks(), subjectCount: '1', sceneAttributeId: 'outdoor', locationId: r.id, framingId: full };
const ids = list => list.map(x => x.id);
const beforeLibrary = () => prepareImmutableRuntimeLibrary(preXimendingDatabase());
const run = (input, library, seed = 'ximending-0') => { let draws = 0; const rand = createSeededRandom(seed); const p = generatePrompts(1, input, library, { random: () => { draws++; return rand(); } })[0]; return { p, draws }; };
a2HistoricalTest('Ximending removes exactly green_space; complete database and formal source match pinned Git plus one change', () => {
  assert.deepEqual(find(source).meta.semantic.tags, r.afterTags);
  const expected = JSON.parse(historicalGit('show', r.baseCommit + ':webapp/src/data/database.json'));
  assert.deepEqual(find(expected), r.generatedBefore);
  find(expected).meta.semantic.tags = [...r.afterTags]; assert.deepEqual(source, expected);
  const document = JSON.parse(historicalGit('show', r.baseCommit + ':' + r.sourceFile));
  assert.deepEqual(document.entries.find(x => x.id === r.id), r.source);
  document.entries.find(x => x.id === r.id).meta.semantic.tags = [...r.afterTags];
  assert.deepEqual(JSON.parse(readFileSync(join(root, r.sourceFile))), document);
});
test('parking explains legacy park match; explicit semantics and default cache remain isolated', () => {
  const bytes = JSON.stringify(source), legacy = structuredClone(source); delete find(legacy).meta.semantic;
  const tags = db => Object.values(getCompiledCatalogForTesting(db).entries.locations).flat().find(x => x.id === r.id).meta.tags;
  assert.deepEqual(tags(legacy), r.beforeTags); find(legacy).en = find(legacy).en.replace('scooter parking fragment', 'scooter standing area');
  assert.deepEqual(tags(legacy), r.afterTags); assert.deepEqual(tags(source), r.afterTags); assert.equal(JSON.stringify(getKnowledgeBaseSnapshot()), bytes);
});
a2HistoricalTest('exact inverse rejects extra/reordered tags, text, aliases, missing and duplicate IDs; all four layers restore pre-A5', () => {
  const bytes = JSON.stringify(source);
  assert.deepEqual(preXimendingDatabase(), JSON.parse(historicalGit('show', r.baseCommit + ':webapp/src/data/database.json')));
  assert.deepEqual(preAllA5Database(), JSON.parse(historicalGit('show', 'a9dd3616bc6596cdb199420f3189a420c6f1ed17:webapp/src/data/database.json')));
  assert.equal(JSON.stringify(source), bytes);
  for (const kind of ['extra', 'order', 'text', 'alias', 'missing', 'duplicate']) {
    const bad = structuredClone(source), rows = Object.values(bad.Locations).find(x => x.some(y => y.stableId === r.id)), row = find(bad);
    if (kind === 'extra') row.meta.semantic.tags.push('natural');
    if (kind === 'order') row.meta.semantic.tags.reverse();
    if (kind === 'text') row.en += ' changed';
    if (kind === 'alias') row.legacyIds.push('unreviewed');
    if (kind === 'missing') rows.splice(rows.indexOf(row), 1);
    if (kind === 'duplicate') rows.push(structuredClone(row));
    assert.throws(() => preXimendingDatabase(bad), /XIMENDING inverse/);
  }
});
a2HistoricalTest('all 11 pending dual-tag rows retain entire formal records and current classification', () => {
  const rows = Object.values(source.Locations).flat().filter(x => x.meta.semantic.tags.includes('indoor') && x.meta.semantic.tags.includes('outdoor'));
  assert.equal(rows.length, 11); assert.deepEqual(rows.map(x => x.stableId).sort(), r.pendingDoubleTags.map(x => x.source.id).sort());
  for (const pending of r.pendingDoubleTags) {
    const actual = JSON.parse(readFileSync(join(root, pending.sourceFile))).entries.find(x => x.id === pending.source.id);
    const trusted = JSON.parse(historicalGit('show', r.baseCommit + ':' + pending.sourceFile)).entries.find(x => x.id === pending.source.id);
    assert.deepEqual(actual, pending.source); assert.deepEqual(actual, trusted);
  }
});
test('836 crop/ambient/scene-attribute combinations preserve all ordered candidate IDs', () => {
  const before = beforeLibrary(); let n = 0;
  for (const frame of options('framingId')) for (const sceneAttributeId of ['none', 'outdoor']) for (const lightingId of ['', ...ids(options('lightingId'))]) {
    const input = { ...locks, framingId: frame.id, sceneAttributeId, lightingId }, a = getSceneDependentOptions(before, input), b = getSceneDependentOptions([], input);
    assert.deepEqual(Object.keys(a), Object.keys(b));
    for (const key of Object.keys(a)) assert.deepEqual(ids(a[key]), ids(b[key]), key); n++;
  }
  assert.equal(n, 836);
});
c7ColorHistoricalTest('manual and randomized Ximending selections, six outputs and RNG remain equal', () => {
  const before = beforeLibrary();
  const manual = naturalFixtureLocks({ ...CRT_MIDJOURNEY_SELECTIONS, locationId: r.id, sceneAttributeId: 'outdoor', framingId: full });
  const inputs = options('framingId').flatMap(frame => ['1', '2'].map(subjectCount => ({ ...manual, framingId: frame.id, subjectCount })));
  inputs.push({ ...locks }, { ...manual, topId: '', pantsId: '', outerwearId: '', outerwearFitId: '', outerwearPatternId: '', outerwearOpeningId: '', outerwearStylingId: '' });
  for (const [i, input] of inputs.entries()) for (let n = 0; n < (i < 22 ? 1 : 100); n++) {
    const a = run(input, before, 'ximending-' + n), b = run(input, [], 'ximending-' + n);
    assert.deepEqual(a.p.selection, b.p.selection); assert.deepEqual(outputStates(a.p), outputStates(b.p)); assert.equal(a.draws, b.draws);
  }
});
test('supine/legacy anchors and UI restore retain existing behavior', () => {
  const before = beforeLibrary();
  for (const poseOrientationId of ['lying-supine', 'lying-prone', 'lying-side']) {
    const input = { ...locks, poseBaseId: 'lying', poseOrientationId };
    const a = getSceneDependentOptions(before, input), b = getSceneDependentOptions([], input);
    for (const key of Object.keys(a)) assert.deepEqual(ids(a[key]), ids(b[key]));
  }
  for (const restoringSelection of [false, true]) for (const light of options('lightDirectionId')) {
    const args = { previousLocks: createEmptyLocks(), candidateLocks: { ...locks, lightDirectionId: light.id }, lockControls: controls, restoringSelection };
    assert.deepEqual(transitionPage1Locks({ ...args, activeLibrary: before }), transitionPage1Locks(args));
  }
});

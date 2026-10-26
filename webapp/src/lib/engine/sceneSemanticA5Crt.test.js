import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEmptyLocks, createSeededRandom, generatePrompts, getCompiledCatalogForTesting, getKnowledgeBaseSnapshot, getLockControls, getSceneDependentOptions } from '../engine.js';
import { prepareImmutableRuntimeLibrary } from './runtimeCache.js';
import { CRT_MIDJOURNEY_SELECTIONS, naturalFixtureLocks } from './midjourneyNaturalFixtures.js';
import { transitionPage1Locks } from '../../features/page1/lockTransitions.js';
import { outputStates } from '../../../../scripts/lib/catalogBaseline.mjs';
import { A5_CRT_REVIEW as r, historicalGit, preCrtDatabase } from '../../../../scripts/lib/a5CrtHistoricalReplay.mjs';
import { A5_COMMERCIAL_REVIEW } from '../../../../scripts/lib/a5CommercialHistoricalReplay.mjs';
const source = getKnowledgeBaseSnapshot(), controls = getLockControls();
const options = k => controls.find(x => x.key === k).options;
const option = (k, zh) => options(k).find(x => x.zh === zh).id;
const find = db => Object.values(db.Locations).flat().find(x => x.stableId === r.id);
const full = option('framingId', '全身鏡頭 (Full Body Shot)');
const locks = { ...createEmptyLocks(), subjectCount: '1', sceneAttributeId: 'indoor', locationId: r.id, framingId: full };
const ids = list => list.map(x => x.id);
const beforeLibrary = () => prepareImmutableRuntimeLibrary(preCrtDatabase());
const run = (input, library, seed = 'crt-valid-random-0') => { let draws = 0; const rand = createSeededRandom(seed); const p = generatePrompts(1, input, library, { random: () => { draws++; return rand(); } })[0]; return { p, draws }; };
test('CRT source changes exactly one outdoor tag with issued ID and all text intact', () => {
  assert.deepEqual(find(source).meta.semantic.tags, r.afterTags);
  const expected = JSON.parse(historicalGit('show', r.baseCommit + ':webapp/src/data/database.json'));
  find(expected).meta.semantic.tags = [...r.afterTags]; assert.deepEqual(source, expected);
});
test('VCR decks cause legacy inference; explicit semantics win without changing default cache', () => {
  const bytes = JSON.stringify(source), legacy = structuredClone(source); delete find(legacy).meta.semantic;
  const tags = db => Object.values(getCompiledCatalogForTesting(db).entries.locations).flat().find(x => x.id === r.id).meta.tags;
  assert.deepEqual(tags(legacy), r.beforeTags); find(legacy).en = find(legacy).en.replace('VCR decks', 'VCR units');
  assert.deepEqual(tags(legacy), r.afterTags); assert.deepEqual(tags(source), r.afterTags); assert.equal(JSON.stringify(getKnowledgeBaseSnapshot()), bytes);
});
test('CRT inverse matches exact base and rejects source changes, reordered tags, missing and duplicate IDs', () => {
  const bytes = JSON.stringify(source), expected = JSON.parse(historicalGit('show', r.baseCommit + ':webapp/src/data/database.json'));
  assert.deepEqual(preCrtDatabase(), expected); assert.equal(JSON.stringify(source), bytes);
  for (const kind of ['extra', 'order', 'text', 'alias', 'missing', 'duplicate']) {
    const bad = structuredClone(source), rows = Object.values(bad.Locations).find(x => x.some(y => y.stableId === r.id)), row = find(bad);
    if (kind === 'extra') row.meta.semantic.tags.push('natural');
    if (kind === 'order') row.meta.semantic.tags.reverse();
    if (kind === 'text') row.en += ' changed';
    if (kind === 'alias') row.legacyIds.push('unreviewed');
    if (kind === 'missing') rows.splice(rows.indexOf(row), 1);
    if (kind === 'duplicate') rows.push(structuredClone(row));
    assert.throws(() => preCrtDatabase(bad), /CRT inverse/);
  }
});
test('the previous fifteen commercial decisions and entire non-CRT database remain current', () => {
  for (const row of A5_COMMERCIAL_REVIEW.entries) {
    const actual = options('locationId').find(x => x.id === row.id);
    assert.deepEqual(actual.meta.tags, row.afterTags); assert.equal(actual.en, row.sourceEn); assert.equal(actual.desc, row.sourceDesc);
  }
  const restored = preCrtDatabase(); find(restored).meta.semantic.tags = [...r.afterTags]; assert.deepEqual(restored, source);
});
test('all crops and ambient states allow only reviewed window-light and legacy anchor deltas', () => {
  const before = beforeLibrary(); let n = 0, windowChanges = 0;
  for (const frame of options('framingId')) for (const sceneAttributeId of ['none', 'indoor']) for (const lightingId of ['', ...ids(options('lightingId'))]) {
    const input = { ...locks, framingId: frame.id, sceneAttributeId, lightingId }, a = getSceneDependentOptions(before, input), b = getSceneDependentOptions([], input);
    for (const key of ['locationOptions', 'lightingOptions']) assert.deepEqual(ids(a[key]), ids(b[key]));
    assert.deepEqual(ids(a.lightDirectionOptions).filter(x => !ids(b.lightDirectionOptions).includes(x)), []);
    const added = b.lightDirectionOptions.filter(x => !ids(a.lightDirectionOptions).includes(x.id));
    assert.ok(added.every(x => ['窗格投影光', '百葉窗條紋投影光'].includes(x.zh))); windowChanges += added.length;
    assert.deepEqual(ids(a.poseAnchorOptions).filter(x => !ids(b.poseAnchorOptions).includes(x)), ['lying-grass-ground','lying-concrete-ground','lying-sand-ground','lying-clear-sea-surface']);
    assert.deepEqual(ids(b.poseAnchorOptions).filter(x => !ids(a.poseAnchorOptions).includes(x)), []); n++;
  }
  assert.equal(n, 836); assert.ok(windowChanges > 0);
  const current = getSceneDependentOptions([], locks); assert.equal(current.lightingOptions.length, 19); assert.equal(current.lightDirectionOptions.length, 23);
});
test('locked CRT swimsuit and all crops retain selections, six outputs and RNG', () => {
  const before = beforeLibrary();
  for (const frame of options('framingId')) for (const subjectCount of ['1','2']) {
    const input = naturalFixtureLocks({ ...CRT_MIDJOURNEY_SELECTIONS, framingId: frame.id, subjectCount });
    const a = run(input, before), b = run(input, []); assert.deepEqual(a.p.selection, b.p.selection); assert.deepEqual(outputStates(a.p), outputStates(b.p)); assert.equal(a.draws, b.draws);
  }
});
test('existing random garment and automatic outerwear rules can change full-body reference; subject light alone cannot', () => {
  const before = beforeLibrary(), base = naturalFixtureLocks({ ...CRT_MIDJOURNEY_SELECTIONS, framingId: full, lightingId: { byZh: '全無' } });
  for (const [kind, input] of [['top', { ...base, topId: '' }], ['light', { ...base, lightDirectionId: '' }], ['outerwear', { ...base, outerwearId:'', outerwearFitId:'', outerwearPatternId:'', outerwearOpeningId:'', outerwearStylingId:'' }]]) {
    let changes = 0;
    for (let n = 0; n < 30; n++) {
      const a = run(input, before, 'crt-valid-random-' + n), b = run(input, [], 'crt-valid-random-' + n), ao = outputStates(a.p), bo = outputStates(b.p);
      if (kind === 'light') { assert.deepEqual(ao['full-body-character'], bo['full-body-character']); if (a.p.selection.lightDirectionId !== b.p.selection.lightDirectionId) changes++; }
      else if (ao['full-body-character'].text !== bo['full-body-character'].text) changes++;
    }
    assert.ok(changes > 0, kind);
  }
});
test('supine surface-owned scene pools stay unchanged and formal styles have no affected bias tags', () => {
  const input = { ...locks, poseBaseId:'lying', poseOrientationId:'lying-supine' };
  assert.deepEqual(getSceneDependentOptions(beforeLibrary(), input), getSceneDependentOptions([], input));
  assert.equal(options('styleId').filter(x => x.meta?.tags?.some(t => ['studio_bias','set_bias','natural_bias','outdoor_bias'].includes(t))).length, 0);
});
test('UI restores newly available window light while explicit engine locks retain existing behavior', () => {
  const before = beforeLibrary(), input = naturalFixtureLocks({ ...CRT_MIDJOURNEY_SELECTIONS, framingId:full, lightingId:{byZh:'全無'}, lightDirectionId:{byZh:'窗格投影光'} });
  const args = { previousLocks:createEmptyLocks(), candidateLocks:input, lockControls:controls, restoringSelection:true };
  const a = transitionPage1Locks({ ...args, activeLibrary:before }), b = transitionPage1Locks(args);
  assert.equal(a.lightDirectionId, ''); assert.equal(b.lightDirectionId, input.lightDirectionId);
  assert.deepEqual(outputStates(run(input, before).p), outputStates(run(input, []).p));
});

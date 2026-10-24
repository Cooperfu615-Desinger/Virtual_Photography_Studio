import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { stablePrompt, outputStates } from './catalogBaseline.mjs';
const load = (repo, file) => import(pathToFileURL(`${repo}/${file}`).href);

// Resolve labels only while authoring; frozen inputs are replayed as raw IDs.
export async function createImportCorpus(repo, auditCases) {
  const E = await load(repo, 'webapp/src/lib/engine.js');
  const codec = await load(repo, 'webapp/src/features/saved-cards/cardCodec.js');
  const M = await load(repo, 'webapp/src/lib/observationCaptureMode.js');
  const controls = E.getLockControls();
  const byZh = (key, label) => {
    const found = controls.find(c => c.key === key)?.options.find(o => o.zh.includes(label));
    assert.ok(found, `${key}: ${label}`); return found.id;
  };
  const base = { ...E.createEmptyLocks(), subjectCount: '1', characterProfileId: 'none', specialSubjectId: 'none', fixedCompositionSetId: 'none', framingId: byZh('framingId', '全身鏡頭') };
  const silent = { ...base };
  for (const c of controls) {
    const none = c.options.find(o => o.zh === '全無');
    if (none && !c.required && c.key !== 'framingId') silent[c.key] = none.id;
  }
  const dressed = { ...silent, topId: byZh('topId', '領帶襯衫'), topColorId: byZh('topColorId', '紅色'), pantsId: byZh('pantsId', '牛仔'), shoesId: byZh('shoesId', 'ADIZERO'), bodyTypeId: byZh('bodyTypeId', '豐胸纖腰沙漏') };
  for (const key of ['facialFeaturesId', 'skinDetailsId', 'hairstyleId', 'hairColorId']) dressed[key] = controls.find(c => c.key === key).options.find(o => o.en && o.zh !== '全無' && o.id !== 'random').id;
  const sources = [
    { id: 'random', locks: base }, { id: 'dressed', locks: dressed }, { id: 'none', locks: silent },
    { id: 'close-crop', locks: { ...dressed, framingId: byZh('framingId', '全臉傾斜特寫') } },
    { id: 'dormant-duo', locks: { ...base, hairColorAId: byZh('hairColorAId', '自然黑'), topAId: byZh('topAId', '領帶襯衫'), poseBaseId: 'sitting' } },
  ].map(row => ({ ...row, seed: `catalog-import-source:${row.id}` }));
  const frameIds = ['全身鏡頭', '中景鏡頭', '牛仔中景'].map(zh => byZh('framingId', zh));
  const cardId = controls.find(c => c.key === 'characterProfileId').options.find(o => o.specialSubject === 'character-profile').id;
  const plan = { sources, frameIds, cardId, scenes: M.CAPTURE_GROUPS[0].options.map(o => o.id) };
  const flows = await captureImportFlows(repo, plan);
  const cases = structuredClone(auditCases), savedPayloads = {};
  const add = (id, locks, seed = id) => cases.push({ id, locks: structuredClone(locks), seed, stream: id, mode: 'single' });
  for (const source of sources) {
    const locks = { ...source.locks, framingId: frameIds[0], captureMode: 'observation' };
    const initial = flows.sources[source.id].profiles.initial;
    for (const scene of plan.scenes) for (const [index, framingId] of frameIds.entries()) {
      add(`import-matrix:${source.id}:${scene}:${index}`, { ...locks, framingId, observationCapture: { ...initial, selected: { scene }, fixed: { scene: true } } });
    }
    for (const [step, profile] of Object.entries(flows.sources[source.id].profiles)) {
      add(`import-flow:${source.id}:${step}`, { ...locks, observationCapture: profile });
    }
    add(`import-dormant-card:${source.id}`, { ...locks, characterProfileId: cardId, observationCapture: initial });
    // Preserve raw general-mode random/none choices on returning from capture.
    add(`import-return-standard:${source.id}`, { ...source.locks, captureMode: 'standard', observationCapture: initial }, source.seed);
    const prompt = E.generatePrompts(1, { ...locks, observationCapture: initial }, [], { random: E.createSeededRandom(`saved:${source.id}`) })[0];
    assert.ok(prompt); const stable = { ...stablePrompt(prompt), id: `saved-import-${source.id}`, date: '2026-10-24T00:00:00.000Z' };
    savedPayloads[`${source.id}-json`] = codec.serializeFavoritePrompt(stable);
    savedPayloads[`${source.id}-markdown`] = codec.buildMarkdownExport(stable);
  }
  return { format: 'catalog-corpus-v1', cases, sources: plan, savedPayloads, audit: { count: auditCases.length, seed: 'prompt-quality-baseline' } };
}

// Re-execute import/reimport/reroll APIs, not only already imported saved locks.
export async function captureImportFlows(repo, plan) {
  const E = await load(repo, 'webapp/src/lib/engine.js');
  const I = await load(repo, 'webapp/src/lib/observationCaptureImport.js');
  const M = await load(repo, 'webapp/src/lib/observationCaptureMode.js');
  const result = { sources: {} };
  const gen = (locks, seed) => {
    let rngCalls = 0; const random = E.createSeededRandom(seed);
    const prompt = E.generatePrompts(1, structuredClone(locks), [], { random: () => { rngCalls++; return random(); } })[0];
    assert.ok(prompt, seed); return { prompt, rngCalls };
  };
  for (const source of plan.sources) {
    const generated = gen(source.locks, source.seed);
    const snapshot = I.getFullBodyImportSource(generated.prompt);
    assert.ok(snapshot, source.id);
    const initial = I.importCapturePerson(I.prepareCaptureEntry(M.resolveCapture({ seed: 41 }).profile, generated.prompt));
    const profiles = { initial }; let profile = initial;
    for (let i = 1; i <= 3; i++) { profile = M.rerollCapture(profile).profile; profiles[`reroll-${i}`] = profile; assert.deepEqual(profile.importedPerson, snapshot); }
    const replacement = gen(source.locks, `${source.seed}:replacement`);
    profiles['new-candidate-keeps-person'] = I.prepareCaptureEntry(profile, replacement.prompt);
    assert.deepEqual(profiles['new-candidate-keeps-person'].importedPerson, snapshot);
    profiles['explicit-reimport'] = I.importCapturePerson(profiles['new-candidate-keeps-person']);
    assert.deepEqual(profiles['explicit-reimport'].importedPerson, I.getFullBodyImportSource(replacement.prompt));
    const card = M.normalizeCaptureProfile({ ...initial, personSource: 'card' });
    profiles['card-and-back'] = I.importCapturePerson(card);
    assert.deepEqual(profiles['card-and-back'].importedPerson, snapshot);
    const locks = { ...source.locks, framingId: plan.frameIds[0], captureMode: 'observation', observationCapture: initial };
    const reload = E.normalizeLocks(JSON.parse(JSON.stringify(locks)));
    profiles.reload = reload.observationCapture;
    assert.deepEqual(outputStates(gen(reload, 'reload').prompt), outputStates(gen(locks, 'reload').prompt));
    const invalids = [null, {}, { ...snapshot, version: 99 }, { ...snapshot, wardrobe: ['bad'] }];
    const rejected = invalids.map(importedPerson => E.generatePrompts(1, { ...locks, observationCapture: { ...initial, importedPerson } }, [], { random: E.createSeededRandom('invalid') }).length);
    assert.deepEqual(rejected, [0, 0, 0, 0]);
    assert.equal(I.getFullBodyImportSource(gen({ ...source.locks, subjectCount: '2' }, 'duo').prompt), null);
    assert.equal(I.getFullBodyImportSource(gen(locks, 'capture').prompt), null);
    result.sources[source.id] = { source: stablePrompt(generated.prompt), sourceRng: generated.rngCalls, snapshot, replacement: stablePrompt(replacement.prompt), replacementRng: replacement.rngCalls, profiles, rejected };
  }
  return result;
}

export function assertImportedCases(corpus, actual) {
  for (const row of actual.cases.filter(x => x.id.startsWith('import-') && !x.id.startsWith('import-return-standard:'))) {
    const input = corpus.cases.find(x => x.id === row.id), person = input.locks.observationCapture.importedPerson;
    assert.equal(row.outputs['full-body-character'].text, person.fullBodyPrompt, row.id);
    assert.deepEqual(row.prompt.structured.Wardrobe, person.wardrobe, row.id);
    assert.deepEqual(row.prompt.selection.observationCapture.importedPerson, person, row.id);
    for (const value of Object.values(row.outputs)) assert.equal(value.status, 'effective', row.id);
  }
  for (const [key, saved] of Object.entries(actual.saved)) {
    const person = saved.decoded.selection.observationCapture.importedPerson;
    assert.deepEqual(saved.reloaded.selection.observationCapture.importedPerson, person, key);
    assert.deepEqual(saved.regenerated.selection.observationCapture.importedPerson, person, key);
    assert.equal(saved.regenerated.extraPrompts.find(x => x.id === 'full-body-character').text, person.fullBodyPrompt, key);
  }
}

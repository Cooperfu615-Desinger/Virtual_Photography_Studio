// Executes only in isolated Git snapshots. Produces evidence, never product files.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const [root, reviewPath, output, phase, oldOutput] = process.argv.slice(2);
const load = path => import(pathToFileURL(resolve(root, path)));
const { generatePrompts, createSeededRandom, getLockControls } = await load('webapp/src/lib/engine.js');
const { naturalFixtureLocks } = await load('webapp/src/lib/engine/midjourneyNaturalFixtures.js');
const { REPRESENTATIVE_PROMPT_FIXTURES } = await load('webapp/src/lib/engine/representativePromptFixtures.js');
const { buildPage1GenerationPromptCards, buildPage1DllPromptSources } = await load('webapp/src/lib/page1PromptOutputs.js');
const { parseLocksFromStandardPrompt, buildRestoreLocks, serializeFavoritePrompt, deserializeFavoritePrompt } = await load('webapp/src/features/saved-cards/cardCodec.js');
const reviews = JSON.parse(readFileSync(reviewPath));
const controls = getLockControls();
const options = key => controls.find(c => c.key === key).options;
const item = reviews[0].profile.item;
const cases = [];
const add = (id, locks) => cases.push({ id, locks: naturalFixtureLocks({ subjectCount: '1', pantsId: item, ...locks }), seed: `ci-copy:${id}` });
const full = options('framingId').find(o => o.zh === '全身鏡頭 (Full Body Shot)').id;
const chest = options('framingId').find(o => o.zh === '胸上特寫').id;
for (const framing of options('framingId')) for (const color of ['none', 'dark-blue', 'mirror-chrome-silver']) {
  add(`crop:${framing.id}:${color}`, { framingId: framing.id, bottomColorId: color });
}
for (const rise of options('bottomRiseId')) for (const role of ['single', 'A', 'B']) {
  add(`rise:${rise.id}:${role}`, role === 'single'
    ? { framingId: full, bottomRiseId: rise.id, bottomColorId: 'dark-blue' }
    : { subjectCount: '2', framingId: full, [`pants${role}Id`]: item,
      [`bottomRise${role}Id`]: rise.id, [`bottomColor${role}Id`]: 'dark-blue' });
}
for (const key of ['characterProfileId', 'specialSubjectId', 'specialOutfitId', 'outfitPresetId', 'fixedCompositionSetId']) {
  for (const option of options(key).filter(o => !['none', 'random'].includes(o.id) && o.zh !== '全無')) {
    for (const framing of [full, chest]) add(`mode:${key}:${option.id}:${framing}`, { [key]: option.id, framingId: framing });
  }
}
// A sibling never gets a text-difference allowance; representatives keep their original seeds.
for (const framing of options('framingId')) add(`sibling:${framing.id}`, {
  pantsId: { byZh: '工裝長褲' }, framingId: framing.id,
});
for (const fixture of REPRESENTATIVE_PROMPT_FIXTURES) cases.push({
  id: `representative:${fixture.id}`, locks: naturalFixtureLocks(fixture.locks), seed: fixture.seed,
});

const sources = [...new Set((phase === 'after' ? reviews : [reviews[0]])
  .flatMap(r => [r.before.en, ...(r.before.legacyPromptAliases || []), ...(phase === 'after' ? [r.after.en] : [])]))];
const sourceRestoreLocks = parseLocksFromStandardPrompt(`She wears ${reviews[0].before.en}.`, controls).locks;
for (const source of sources) {
  const restored = parseLocksFromStandardPrompt(`She wears ${source}.`, controls);
  assert.equal(restored.locks.pantsId, item, `old/new English restore: ${source}`);
  assert.deepEqual(restored.locks, sourceRestoreLocks, 'English changes cannot select other controls');
}
for (const id of reviews[0].before.legacyIds) {
  const locks = buildRestoreLocks(naturalFixtureLocks({ subjectCount: '1', pantsId: id }), controls);
  const restored = generatePrompts(1, locks, [], { random: createSeededRandom('ci-copy-legacy-id') })[0];
  assert.equal(restored.selection.pantsId, item, 'issued ID restore');
}

const results = [];
const oldCases = oldOutput ? JSON.parse(readFileSync(oldOutput)) : null;
for (const [index, fixture] of cases.entries()) {
  const rng = createSeededRandom(fixture.seed);
  let calls = 0;
  const prompt = generatePrompts(1, fixture.locks, [], { random: () => { calls += 1; return rng(); } })[0];
  // Only runtime IDs/timestamps are excluded. All other fields are compared.
  prompt.id = 'ci-copy-fixed-id'; prompt.date = '2000-01-01';
  const cards = buildPage1GenerationPromptCards(prompt);
  const dll = buildPage1DllPromptSources(prompt);
  assert.deepEqual(cards.map(c => [c.id, c.value]), dll.map(c => [c.id, c.value]), 'preview/copy/DLL sources');
  if (fixture.id.startsWith('crop:')) assert.equal(cards.length, 7, 'all current public outputs');
  const saved = serializeFavoritePrompt(prompt);
  const restored = deserializeFavoritePrompt(saved);
  assert.equal(restored.grokPrompt, prompt.grokPrompt, 'Saved Card retains original text');
  assert.equal(restored.zImagePrompt, prompt.zImagePrompt);
  const restoreLocks = buildRestoreLocks(restored.selection, controls);
  const roundTrip = generatePrompts(1, restoreLocks, [], { random: createSeededRandom(fixture.seed) })[0];
  roundTrip.id = 'ci-copy-fixed-id'; roundTrip.date = '2000-01-01';
  if (oldCases) {
    const historical = deserializeFavoritePrompt(oldCases[index].saved);
    const { structured: historicalSources, ...historicalStored } = historical;
    const { structured: oldSources, ...oldStored } = oldCases[index].restored;
    assert.ok(oldSources, 'old Saved Card has resolved sources');
    assert.deepEqual(historicalStored, oldStored, 'old Saved Card stored text and metadata remain verbatim');
    // The codec intentionally rehydrates structured sources from the current catalog.
    assert.deepEqual(historicalSources, restored.structured, 'old card rehydrates only the current resolved sources');
    assert.deepEqual(buildRestoreLocks(historical.selection, controls), restoreLocks, 'old Saved Card resolves the same selections');
  }
  results.push({ id: fixture.id, calls, nextRandom: rng(), prompt, cards, dll, saved, restored,
    restoreLocks, roundTrip, roundTripCards: buildPage1GenerationPromptCards(roundTrip),
    ...(index === 0 ? { sourceRestoreLocks } : {}) });
  if (index % 50 === 0) console.error(`[copy ${phase}] ${index + 1}/${cases.length}`);
}
writeFileSync(output, JSON.stringify(results));
console.error(`[copy ${phase}] ${cases.length}/${cases.length} complete`);

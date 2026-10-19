// Re-freeze selected Midjourney natural fixtures after an approved behavior change.
//
// Usage (from webapp/): node ../scripts/rebaseline_mj_natural_fixtures.mjs <ids.json>
//   ids.json: JSON array of fixture ids (as in midjourneyNaturalFixtures()).
//
// Only the listed entries are recomputed; every other hash stays byte for byte.
// The hash chain mirrors midjourneyNaturalPrompt.test.js exactly: keep both in
// sync. Record why the entries changed (Docs/decisions) before running this.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const webapp = process.cwd();
const engineDir = path.join(webapp, 'src/lib/engine');
const load = file => import(path.join(engineDir, file));
const { createSeededRandom, generatePrompts } = await import(path.join(webapp, 'src/lib/engine.js'));
const { midjourneyNaturalFixtures, protectedNaturalOutputs } = await load('midjourneyNaturalFixtures.js');
const { restorePreOpenPalmV2 } = await load('openPalmTestSupport.js');
const { restorePreSquattingV2 } = await load('squattingCatalogTestSupport.js');
const { restoreUnquotedShibuyaSignage } = await load('shibuyaSceneTestSupport.js');
const { stripFramingDerivedMidjourneyRatio } = await load('midjourneyFramingAspectTestSupport.js');
const { stripFullBodyCharacterBodySource } = await load('fullBodyCharacterBodyTestSupport.js');
const { restorePreEthnicityText, restorePreEthnicityValue } = await load('ethnicityRevisionTestSupport.js');

const hash = value => createHash('sha256').update(JSON.stringify(value) ?? 'undefined').digest('hex');
const bodyCases = [
  'A tall, slender figure with long legs and elegant, balanced proportions.',
  'A soft, balanced hourglass figure with a gently defined waist and naturally rounded curves.',
  'A well-defined curvy figure with a slender waist, long legs and graceful lines.',
  'A lean, toned figure with a firm waist and naturally athletic limbs.',
  'A petite, slender figure with balanced proportions and soft, delicate lines.',
  'A full, well-proportioned figure with a slender waist and naturally graceful curves.',
];
const roleBody = (sentence, role) => `The ${role} woman has ${sentence[0].toLowerCase()}${sentence.slice(1)}`;
const sharedBody = sentence => `Both women have ${sentence[0].toLowerCase()}${sentence.slice(1)}`;
const removeBody = text => bodyCases.reduce((result, sentence) =>
  [sentence, roleBody(sentence, 'first'), roleBody(sentence, 'second'), sharedBody(sentence)]
    .reduce((value, clause) => value.replace(` ${clause}`, ''), result), text);

const ids = new Set(JSON.parse(readFileSync(process.argv[2], 'utf8')));
const fixtures = midjourneyNaturalFixtures();
const protectedPath = path.join(engineDir, 'midjourneyNaturalProtectedBaseline.json');
const bodyPath = path.join(engineDir, 'midjourneyBodyPreservationBaseline.json');
const baseline = JSON.parse(readFileSync(protectedPath, 'utf8'));
const bodyBaseline = JSON.parse(readFileSync(bodyPath, 'utf8'));
let updated = 0;
fixtures.forEach((fixture, index) => {
  if (!ids.has(fixture.id)) return;
  if (baseline[index].id !== fixture.id || bodyBaseline[index].id !== fixture.id) throw new Error(`order mismatch at ${fixture.id}`);
  const prompt = generatePrompts(1, fixture.locks, [], { random: createSeededRandom(fixture.seed) })[0];
  const historicalMain = restorePreSquattingV2(restorePreEthnicityText(restorePreOpenPalmV2(prompt.midjourneyPrompt), 'midjourneyPrompt'));
  // The test hashes the main MJ string directly (no JSON encoding).
  bodyBaseline[index].main = createHash('sha256').update(removeBody(restoreUnquotedShibuyaSignage(stripFramingDerivedMidjourneyRatio(historicalMain, prompt.selection)))).digest('hex');
  baseline[index].fields = Object.fromEntries(Object.entries(protectedNaturalOutputs(stripFullBodyCharacterBodySource(prompt)))
    .map(([field, value]) => [field, hash(restoreUnquotedShibuyaSignage(restorePreSquattingV2(restorePreEthnicityValue(restorePreOpenPalmV2(value), field))))]));
  updated += 1;
});
if (updated !== ids.size) throw new Error(`updated ${updated} of ${ids.size} requested fixtures`);
const keepFormat = (file, value) => {
  const original = readFileSync(file, 'utf8');
  const indent = original.match(/^\[\n( +)/)?.[1]?.length ?? 0;
  writeFileSync(file, JSON.stringify(value, null, indent || undefined) + (original.endsWith('\n') ? '\n' : ''));
};
keepFormat(protectedPath, baseline);
keepFormat(bodyPath, bodyBaseline);
console.log(`re-froze ${updated} fixtures`);

// Node-only regression tooling, never a production import.
//
// Approved 2026-10-14: the subject sentence no longer names an ethnicity
// ("20-year-old adult woman"); non-mixed Facial Features carry Korean or
// Japanese instead. Frozen historical baselines, hashes and published test
// packs predate that revision. Reverse only these exact rollout replacements
// before comparing; every other byte must still match the old baseline.
// The independent 2026-10-18 crew-neck tee wording (crewNeckTeeTestSupport.js)
// is reversed here too, so frozen baselines keep one entry point.
import { isCrewNeckTeeAddedAlias, restorePreCrewNeckTeeText } from './crewNeckTeeTestSupport.js';

// Main MJ (midjourneyPrompt) owns its own opening sentence.
const MAIN_MIDJOURNEY_FIELD = 'midjourneyPrompt';
const MAIN_MIDJOURNEY_SINGLE = ['A 20-year-old adult woman', 'A Japanese woman in her twenties'];
const MAIN_MIDJOURNEY_DUO = ['Two 20-year-old adult women.', 'Two 20-year-old Japanese or Korean women.'];

// Every field except main MJ: capitalized subject sentences.
const OTHER_FIELD_REPLACEMENTS = Object.freeze([
  ['Two 20-year-old adult women', 'Two 20-year-old Japanese or Korean female portrait subjects'],
  ['One 20-year-old adult woman', 'One 20-year-old Japanese or Korean female portrait subject'],
]);

// Every field, in this order (longer duo/fixed wording before the generic forms).
export const ETHNICITY_REVISION_COMMON_REPLACEMENTS = Object.freeze([
  ['stunning seductive 20-year-old adult women', 'stunning seductive 20-year-old Japanese or Korean women'],
  ['seductive stunning 20-year-old adult women', 'seductive stunning 20-year-old Japanese or Korean women'],
  ['seductive stunning 20-year-old adult woman', 'seductive stunning 20-year-old Japanese or Korean woman'],
  ['A 20-year-old seductive stunning adult woman', 'A 20s seductive stunning Japanese or Korean woman'],
  ['two 20-year-old adult women', 'two 20-year-old Japanese or Korean female portrait subjects'],
  ['one 20-year-old adult woman', 'one 20-year-old Japanese or Korean female portrait subject'],
  ['pretty Japanese face', 'pretty face'],
  ['editorial Korean beauty face', 'editorial beauty face'],
  ['alluring Korean beauty face', 'alluring beauty face'],
  ['oval Korean face', 'oval face'],
  ['oval Japanese face', 'oval face'],
]);

// Compatibility aliases this revision added to catalog/option data. Historical
// hashes of option or item objects predate them; remove only these entries.
export const ETHNICITY_REVISION_ADDED_ALIASES = Object.freeze([
  'one 20-year-old Japanese or Korean female portrait subject',
  'two 20-year-old Japanese or Korean female portrait subjects',
  'young sweet pretty face, soft rounded charm, bright friendly eyes, gentle cute beauty, approachable youthful portrait look',
  'young cool editorial beauty face, refined sharp facial balance, calm distant gaze-ready features, high-fashion understated presence',
  'young seductive alluring beauty face, magnetic feminine facial balance, defined eyes and lips, sensual captivating portrait presence',
]);

// Catalog meta infers archetype "korean" from the English text, so the two faces
// whose English newly names Korean gained it (it was null). Only the facial
// pick reads archetype, before any later archetype-filtered pick, so selections
// are unaffected; historical hashes of these items still need the old null.
const FACES_WITH_ADDED_KOREAN_ARCHETYPE = Object.freeze(['冷感高級臉', '成熟性感臉']);
const isFaceWithAddedArchetype = object => typeof object.id === 'string' && object.id.includes('五官特徵')
  && FACES_WITH_ADDED_KOREAN_ARCHETYPE.includes(object.zh);

const replaceAll = (text, from, to) => text.split(from).join(to);

/**
 * Reverse the 2026-10-14 ethnicity revision on one public text.
 * @param {string} text current renderer text
 * @param {string} [field] output field; 'midjourneyPrompt' selects the main MJ rules
 */
export function restorePreEthnicityText(text, field) {
  if (typeof text !== 'string') return text;
  let restored = text;
  if (field === MAIN_MIDJOURNEY_FIELD) {
    restored = restored.replace(MAIN_MIDJOURNEY_SINGLE[0], MAIN_MIDJOURNEY_SINGLE[1]);
    restored = replaceAll(restored, MAIN_MIDJOURNEY_DUO[0], MAIN_MIDJOURNEY_DUO[1]);
  } else {
    for (const [from, to] of OTHER_FIELD_REPLACEMENTS) restored = replaceAll(restored, from, to);
  }
  for (const [from, to] of ETHNICITY_REVISION_COMMON_REPLACEMENTS) restored = replaceAll(restored, from, to);
  return restorePreCrewNeckTeeText(restored, field);
}

const isPlainObject = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

function withoutAddedAliases(object) {
  if (!Array.isArray(object.legacyPromptAliases)) return object;
  const kept = object.legacyPromptAliases.filter(alias => !ETHNICITY_REVISION_ADDED_ALIASES.includes(alias)
    && !isCrewNeckTeeAddedAlias(alias));
  if (kept.length === object.legacyPromptAliases.length) return object;
  const { legacyPromptAliases: _removed, ...rest } = object;
  return kept.length ? { ...rest, legacyPromptAliases: kept } : rest;
}

/**
 * Recursive variant for hashed selections, structured models, option or item
 * objects. Strings take their nearest object key as the field (so a
 * `midjourneyPrompt` property uses the main MJ rules); `field` seeds the root.
 * Removes only the alias entries this revision added (and an emptied `meta`
 * that existed only to hold them), and restores the inferred null archetype
 * of the two faces whose English newly names Korean.
 */
export function restorePreEthnicityValue(value, field) {
  if (typeof value === 'string') return restorePreEthnicityText(value, field);
  if (Array.isArray(value)) return value.map(item => restorePreEthnicityValue(item, field));
  if (!isPlainObject(value)) return value;
  const object = withoutAddedAliases(value);
  const restored = {};
  for (const [key, child] of Object.entries(object)) {
    if (key === 'meta' && isPlainObject(child) && isPlainObject(value.meta)) {
      let meta = restorePreEthnicityValue(child, key);
      if (isFaceWithAddedArchetype(value) && meta.archetype === 'korean') meta = { ...meta, archetype: null };
      const hadAddedAliasOnly = Array.isArray(child.legacyPromptAliases) && !Object.keys(meta).length;
      if (hadAddedAliasOnly) continue;
      restored[key] = meta;
      continue;
    }
    restored[key] = restorePreEthnicityValue(child, key);
  }
  return restored;
}

/** Restore every field of an `{ field: text }` output map. */
export function restorePreEthnicityOutputs(outputs) {
  return Object.fromEntries(Object.entries(outputs).map(([field, text]) => [field, restorePreEthnicityText(text, field)]));
}

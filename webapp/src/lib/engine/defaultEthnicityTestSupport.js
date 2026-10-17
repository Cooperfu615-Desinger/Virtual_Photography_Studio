// Node-only regression tooling, never a production import.
//
// Approved 2026-10-17: an ordinary subject whose Facial Features are none
// renders the Japanese default ("adult Japanese woman"; duo with one unset face
// gives that woman "Japanese facial features"). Frozen baselines predate it.
// Reverse only these exact insertions; every other byte must still match.
import { DEFAULT_ETHNICITY, DEFAULT_ROLE_FACE_TEXT, applyDefaultEthnicity } from './defaultEthnicity.js';

export const DEFAULT_ETHNICITY_ADDED_ALIASES = Object.freeze([
  'one 20-year-old adult Japanese woman',
  'two 20-year-old adult Japanese women',
]);

const SHARED_PATTERN = new RegExp(`\\badult ${DEFAULT_ETHNICITY} (wom[ae]n)\\b`, 'g');
const ROLE_LEAD_PATTERN = new RegExp(`\\b(Has|has) ${DEFAULT_ROLE_FACE_TEXT}, `, 'g');
// Z role text may list the face after the role's body source.
const ROLE_TRAILING_PATTERN = new RegExp(`, ${DEFAULT_ROLE_FACE_TEXT}(?=[.,])`, 'g');
// [pattern, replacement] for a role whose only identity text is the default face.
const ROLE_ONLY_PATTERNS = Object.freeze([
  [new RegExp(`(Woman [12]:\\n)Has ${DEFAULT_ROLE_FACE_TEXT}\\. `, 'g'), '$1'],
  [new RegExp(`\\n\\nWoman [12]:\\nHas ${DEFAULT_ROLE_FACE_TEXT}\\.(?=\\n|$)`, 'g'), ''],
  // Z paragraph-leading role sentence: drop it with its following space.
  [new RegExp(`(^|\\n)[Ww]oman [12] has ${DEFAULT_ROLE_FACE_TEXT}\\. `, 'g'), '$1'],
  [new RegExp(`,? ?\\b[Ww]oman [12] has ${DEFAULT_ROLE_FACE_TEXT}\\.?`, 'g'), ''],
  // Nano gives each role its own paragraph.
  [new RegExp(`\\n\\nThe (?:first|second) woman has ${DEFAULT_ROLE_FACE_TEXT}\\.(?=\\n|$)`, 'g'), ''],
  [new RegExp(` ?The (?:first|second) woman has ${DEFAULT_ROLE_FACE_TEXT}\\.`, 'g'), ''],
]);

/** Reverse the 2026-10-17 Japanese default on one public text. */
export function restorePreDefaultEthnicityText(text) {
  if (typeof text !== 'string') return text;
  let restored = text.replace(SHARED_PATTERN, 'adult $1').replace(ROLE_LEAD_PATTERN, '$1 ')
    .replace(ROLE_TRAILING_PATTERN, '');
  for (const [pattern, replacement] of ROLE_ONLY_PATTERNS) restored = restored.replace(pattern, replacement);
  return restored;
}

/** Drop only the subject-count aliases this revision added. */
export function withoutDefaultEthnicityAliases(aliases) {
  return aliases.filter(alias => !DEFAULT_ETHNICITY_ADDED_ALIASES.includes(alias));
}

const unsetFace = id => !id || String(id).includes(':全無:');

/**
 * The rendered default state for a generated prompt, derived only from its
 * stored selection (independent of the engine's own resolution).
 */
export function expectedDefaultEthnicity(prompt) {
  const selection = prompt?.selection || {};
  const ordinary = [undefined, '', 'none'].includes(selection.specialSubjectId)
    && [undefined, '', 'none'].includes(selection.characterProfileId);
  if (!ordinary) return { single: false, duoAll: false, a: false, b: false };
  if (String(selection.subjectCount) === '2') {
    const a = unsetFace(selection.facialFeaturesAId);
    const b = unsetFace(selection.facialFeaturesBId);
    return a && b ? { single: false, duoAll: true, a: false, b: false } : { single: false, duoAll: false, a, b };
  }
  return { single: unsetFace(selection.facialFeaturesId), duoAll: false, a: false, b: false };
}

/** The ordinary subject text a prompt should render for a stored base `en`. */
export function expectedSubjectText(prompt, text) {
  return applyDefaultEthnicity(text, expectedDefaultEthnicity(prompt));
}

// Approved 2026-10-14 / 2026-10-17: Facial Features carry the ethnicity; when an
// ordinary subject has no facial feature (none or not drawn), the prompt defaults
// to Japanese. Mixed faces, character cards, dedicated subjects and custom
// identities keep their own identity. Duo applies the default per person: both
// unset → the shared sentence says "adult Japanese women"; only one unset → that
// person receives "Japanese facial features". Stored selections never change.
export const DEFAULT_ETHNICITY = 'Japanese';
export const DEFAULT_ROLE_FACE_TEXT = 'Japanese facial features';

const NO_DEFAULT = Object.freeze({ single: false, duoAll: false, a: false, b: false });

export function resolveDefaultEthnicity({ ordinary, count, facial, facialA, facialB, isNone }) {
  if (!ordinary) return NO_DEFAULT;
  const unset = item => !item || isNone(item);
  if (count === 1) return { ...NO_DEFAULT, single: unset(facial) };
  if (count === 2) {
    const a = unset(facialA);
    const b = unset(facialB);
    return a && b ? { ...NO_DEFAULT, duoAll: true } : { ...NO_DEFAULT, a, b };
  }
  return NO_DEFAULT;
}

// Insert the default ethnicity into a shared subject sentence ("adult woman(en)").
export function applyDefaultEthnicity(text, state) {
  if (typeof text !== 'string' || !state || !(state.single || state.duoAll)) return text;
  return text.replace(/\badult (wom[ae]n)\b/, `adult ${DEFAULT_ETHNICITY} $1`);
}

// Render-only character list: the stored Character list keeps its selections.
// Shared default → the base subject item; per-person default → that role's face.
export function applyDefaultEthnicityToCharacter(character, state, { facialToken, isNone }) {
  if (!Array.isArray(character) || !state) return character;
  if (state.single || state.duoAll) {
    return character.map(item => (String(item?.id || '').startsWith('base-character-')
      ? { ...item, en: applyDefaultEthnicity(item.en, state) }
      : item));
  }
  const roles = ['a', 'b'].filter(role => state[role]);
  if (!roles.length) return character;
  const defaultFace = role => ({
    zh: '預設日系五官',
    en: DEFAULT_ROLE_FACE_TEXT,
    id: `${facialToken}default-japanese:${role}`,
    meta: { characterRole: role, defaultEthnicity: true },
  });
  const next = character.map(item => {
    const role = item?.meta?.characterRole;
    return roles.includes(role) && String(item.id || '').includes(facialToken) && isNone(item)
      ? { ...defaultFace(role), id: item.id }
      : item;
  });
  roles.forEach(role => {
    if (!next.some(item => item?.meta?.characterRole === role && String(item.id || '').includes(facialToken))) {
      next.push(defaultFace(role));
    }
  });
  return next;
}

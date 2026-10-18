// Node-only regression tooling, never a production import.
//
// Approved 2026-10-18: 落肩 T 恤 English no longer names a dropped shoulder,
// because Z-Image drew `dropped-shoulder … low shoulder seam` as off-shoulder.
// The item now describes only a crew-neck cotton tee; width stays with the
// separate Top Fit control. Frozen baselines predate it. Reverse only these
// exact replacements; every other byte must still match.

export const CREW_NECK_TEE_ADDED_ALIASES = Object.freeze([
  'dropped-shoulder t-shirt, washed cotton jersey, low shoulder seam, relaxed upper-body proportion',
  'dropped-shoulder t-shirt, washed cotton jersey, low shoulder seam',
]);

// Longest first: catalog source (and its underbust base), then the MJ item name.
// Case-sensitive, so another item's "crew-neck T-shirt" is never touched.
const REPLACEMENTS = Object.freeze([
  ['crew-neck t-shirt, washed cotton jersey', 'dropped-shoulder t-shirt, washed cotton jersey, low shoulder seam'],
  ['Crew-neck t-shirt, washed cotton jersey', 'Dropped-shoulder t-shirt, washed cotton jersey, low shoulder seam'],
  ['crew-neck t-shirt', 'dropped-shoulder t-shirt'],
  ['Crew-neck t-shirt', 'Dropped-shoulder t-shirt'],
]);
const PATTERNS = REPLACEMENTS.map(([from, to]) => [new RegExp(`(?<![A-Za-z-])${from}`, 'g'), to]);

// Main MJ reuses its reviewed item names as extraction vocabulary, so the new
// name also keeps the source's "crew-neck T-shirt" in the 菱格背心黑寬短褲長襪造型
// special outfit (previously reduced to "T-shirt"). Main MJ only.
const MAIN_MIDJOURNEY_PATTERN = /(?<![A-Za-z-])crew-neck T-shirt/g;

/**
 * Reverse the 2026-10-18 crew-neck tee wording on one public text.
 * @param {string} text current renderer text
 * @param {string} [field] output field; 'midjourneyPrompt' also restores the vocabulary side effect
 */
export function restorePreCrewNeckTeeText(text, field) {
  if (typeof text !== 'string') return text;
  const restored = PATTERNS.reduce((value, [pattern, to]) => value.replace(pattern, to), text);
  return field === 'midjourneyPrompt' ? restored.replace(MAIN_MIDJOURNEY_PATTERN, 'T-shirt') : restored;
}

/** Drop only the aliases this revision added. */
export const isCrewNeckTeeAddedAlias = alias => CREW_NECK_TEE_ADDED_ALIASES.includes(alias);

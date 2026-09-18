// Independent approved copy; exact camera-sentence reversal only, never whole
// output normalization. Keep historical snapshot files immutable.
import { normalizeSubjectLightForLegacy } from './subjectLightFixtures.js';
import { normalizeBathroomVanityMirrorForLegacy } from './bathroomVanityMirrorReflectionTestSupport.js';
import {
  SCENE_DETAIL_PRIORITY_REMAINING_CASES,
} from './zImageSceneDetailPriorityFixtures.js';
export const CLOSE_WORM_EXPECTED = {
  medium: 'An extreme close-range worm’s-eye view, with the lens almost against her lower torso, looking steeply upward along her body. Her waist and lower torso dominate the immediate foreground, while her chest, shoulders, and head recede sharply above them. Pronounced foreshortening and perspective stretching near the frame edges emphasize the intimate camera distance. Nearby body contours may extend beyond the side edges of the frame.',
  cowboy: 'An extreme close-range worm’s-eye view, with the lens almost against her thighs just above knee level, looking steeply upward along her body. Her thighs and hips dominate the immediate foreground, while her waist, upper torso, and head recede sharply above them. Pronounced foreshortening and perspective stretching near the frame edges emphasize the intimate camera distance. Nearby body contours may extend beyond the side edges of the frame.',
  neutral: 'An extreme close-range worm’s-eye view, with the lens almost against the nearest visible part of her body, looking steeply upward along her body. The nearest body contours dominate the immediate foreground, while more distant body areas recede sharply. Pronounced foreshortening and perspective stretching near the frame edges emphasize the intimate camera distance. Nearby body contours may extend beyond the side edges of the frame.',
};
export const OLD_WORM = 'The camera is positioned extremely low near the ground and tilted steeply upward toward the woman, creating strong near-far scale through the closest visible body planes.';

// The historical Z snapshots predate the reviewed low-camera scene-detail
// priority pass. Reverse only an exact approved scene-opening prefix; never
// rewrite arbitrary imported/custom prose or a non-Z output.
const SCENE_DETAIL_LEGACY_CASES = Object.freeze([
  ...SCENE_DETAIL_PRIORITY_REMAINING_CASES,
].filter(([, before, after]) => before !== after));

function normalizeZImageSceneDetailForLegacy(text) {
  // The frozen baselines contain both low-camera and eye-level rows. The
  // reviewed scene-detail pass only runs for low camera heights; do not
  // rewrite an eye-level setting merely because its catalog prefix matches.
  if (!/(?:waist-level view|knee-level view|near floor level|worm[’']s-eye|steeply upward)/i.test(text)) {
    return text;
  }
  const match = text.match(/(The setting is )([^.\n]+)(\.)/);
  if (!match) return text;
  const currentParts = match[2].split(/\s*,\s*/).map((part) => part.trim());
  for (const [, before, after] of SCENE_DETAIL_LEGACY_CASES) {
    const previousParts = before.split(/\s*,\s*/).map((part) => part.trim());
    const preferredParts = after.split(/\s*,\s*/).map((part) => part.trim());
    if (preferredParts.length > currentParts.length
      || preferredParts.some((part, index) => currentParts[index] !== part)) continue;
    const previousSet = new Set(previousParts);
    const tail = currentParts.slice(preferredParts.length)
      .filter((part) => !previousSet.has(part));
    const restored = [...previousParts, ...tail].join(', ');
    return text.replace(match[0], `${match[1]}${restored}${match[3]}`);
  }
  return text;
}

export function normalizeCloseWormForLegacy(text, field = 'zImagePrompt') {
  text = normalizeBathroomVanityMirrorForLegacy(text, field);
  text = normalizeSubjectLightForLegacy(text);
  const replace = block => Object.values(CLOSE_WORM_EXPECTED).reduce((s, phrase) => s.replace(phrase, OLD_WORM), block);
  if (field === 'grokPrompt') return text.replace(/(^|\n\n)Composition:\n([^]*?)(?=\n\n[A-Z][^\n]*:\n|$)/,
    (_, prefix, block) => `${prefix}Composition:\n${replace(block)}`);
  if (field !== 'zImagePrompt') return text;
  text = normalizeZImageSceneDetailForLegacy(text);
  const blocks = text.split('\n\n');
  if (blocks[1]) blocks[1] = replace(blocks[1]);
  return blocks.join('\n\n');
}

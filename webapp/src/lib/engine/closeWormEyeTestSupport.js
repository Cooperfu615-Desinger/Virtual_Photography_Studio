// Independent approved copy; exact camera-sentence reversal only, never whole
// output normalization. Keep historical snapshot files immutable.
export const CLOSE_WORM_EXPECTED = {
  medium: 'An extreme close-range worm’s-eye view, with the lens almost against her lower torso, looking steeply upward along her body. Her waist and lower torso dominate the immediate foreground, while her chest, shoulders, and head recede sharply above them. Pronounced foreshortening and perspective stretching near the frame edges emphasize the intimate camera distance. Nearby body contours may extend beyond the side edges of the frame.',
  cowboy: 'An extreme close-range worm’s-eye view, with the lens almost against her thighs just above knee level, looking steeply upward along her body. Her thighs and hips dominate the immediate foreground, while her waist, upper torso, and head recede sharply above them. Pronounced foreshortening and perspective stretching near the frame edges emphasize the intimate camera distance. Nearby body contours may extend beyond the side edges of the frame.',
  neutral: 'An extreme close-range worm’s-eye view, with the lens almost against the nearest visible part of her body, looking steeply upward along her body. The nearest body contours dominate the immediate foreground, while more distant body areas recede sharply. Pronounced foreshortening and perspective stretching near the frame edges emphasize the intimate camera distance. Nearby body contours may extend beyond the side edges of the frame.',
};
export const OLD_WORM = 'The camera is positioned extremely low near the ground and tilted steeply upward toward the woman, creating strong near-far scale through the closest visible body planes.';
export function normalizeCloseWormForLegacy(text, field = 'zImagePrompt') {
  const replace = block => Object.values(CLOSE_WORM_EXPECTED).reduce((s, phrase) => s.replace(phrase, OLD_WORM), block);
  if (field === 'grokPrompt') return text.replace(/(^|\n\n)Composition:\n([^]*?)(?=\n\n[A-Z][^\n]*:\n|$)/,
    (_, prefix, block) => `${prefix}Composition:\n${replace(block)}`);
  if (field !== 'zImagePrompt') return text;
  const blocks = text.split('\n\n');
  if (blocks[1]) blocks[1] = replace(blocks[1]);
  return blocks.join('\n\n');
}

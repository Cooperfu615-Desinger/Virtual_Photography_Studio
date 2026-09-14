// Independent, exact approved replacements for historical snapshot comparison.
// Never normalize whole composition blocks or use production builders here.
import { normalizeCloseWormForLegacy } from './closeWormEyeTestSupport.js';
export const FULL_CAMERA_TEXT_PAIRS = [
  ['Her entire figure is framed with natural-looking proportions.', ''],
  ['Her entire figure is framed with natural-looking proportions, with the frame deliberately tilted diagonally.', ''],
  ['The camera is positioned near floor level, set back from her and tilted upward to include her entire figure from head to feet. The upward perspective is clear, with a gradual change in scale along her body.',
    'The camera is positioned near floor level and tilted upward toward the woman, emphasizing the upward perspective through her legs, torso, and shoulders.'],
  ['An extreme worm\'s-eye view with the camera almost touching the ground, very close to her feet and looking steeply upward along her body. Her feet and lower legs loom large in the near foreground, while her torso and head recede sharply above them. Her entire figure remains in the frame, with pronounced foreshortening and perspective stretching near the frame edges.',
    'The camera is positioned extremely low near the ground and tilted steeply upward toward the woman, creating strong near-far scale through the closest visible body planes.'],
  ['An extreme worm\'s-eye view with the camera almost touching the ground, very close to her and looking steeply upward. The closest parts of her body loom large in the foreground, while the more distant parts recede sharply. Her entire figure remains in the frame, with pronounced foreshortening and perspective stretching near the frame edges.',
    'The camera is positioned extremely low near the ground and tilted steeply upward toward the woman, creating strong near-far scale through the closest visible body planes.'],
  ['The camera is above her and angled downward, framing her entire figure from head to feet. The top of her head and shoulders are nearer the lens, with the rest of her body receding below them.',
    'The camera is positioned clearly above the woman and tilted downward toward her, revealing the top planes of her shoulders and the downward view along the full figure.'],
  ['A bird\'s-eye view from high above, looking diagonally down at her entire figure within the surrounding space.',
    'The camera is elevated far above the woman and tilted downward, showing the woman within the surrounding ground plane.'],
  ['The camera is directly above her and points vertically downward, framing her entire figure in a top-down composition.',
    'The camera is positioned directly above the woman and points vertically downward, creating a flattened top-down composition.'],
];
export function normalizeFullCameraForLegacy(text) {
  text = normalizeCloseWormForLegacy(text);
  const blocks = text.split('\n\n');
  if (blocks.length < 2) return text;
  for (const [current, previous] of FULL_CAMERA_TEXT_PAIRS) {
    blocks[1] = previous ? blocks[1].replace(current, previous) : blocks[1].replace(` ${current}`, '');
  }
  return blocks.join('\n\n');
}

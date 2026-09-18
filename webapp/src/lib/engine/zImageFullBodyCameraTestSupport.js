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
  ['At a relatively close portrait distance, roughly 1.5–2 meters from her, the camera is positioned above her and angled downward, framing her entire figure from head to feet. The subject remains dominant in the frame, with the upper-facing body planes nearest the lens slightly more prominent and the rest of her figure receding below them.',
    'The camera is positioned clearly above the woman and tilted downward toward her, revealing the top planes of her shoulders and the downward view along the full figure.'],
  ['From several meters away, roughly 3–5 meters above and set back from her, the camera looks diagonally downward at her entire figure. Her figure occupies less of the frame, while the surrounding spatial layout remains clearly visible.',
    'The camera is elevated far above the woman and tilted downward, showing the woman within the surrounding ground plane.'],
  ['From directly overhead at roughly 1–2 meters above her, the camera points straight down at a 90-degree angle, framing her entire figure. The view is flattened and graphic, with no diagonal viewing direction.',
    'The camera is positioned directly above the woman and points vertically downward, creating a flattened top-down composition.'],
];

function normalizeDistanceAwareTurboCameraForLegacy(text) {
  return text
    .replace(/At a relatively close portrait distance, roughly 1\.5–2 meters from her, the camera is positioned above her and angled downward, revealing the top planes of her ([^.]+)\./g,
      'The camera is positioned clearly above the woman and tilted downward toward her, revealing the top planes of her $1.')
    .replace(/From several meters away, roughly 3–5 meters above and set back from her, the camera looks diagonally downward, showing her within the surrounding spatial layout\./g,
      'The camera is elevated far above the woman and tilted downward, showing the woman within the surrounding ground plane.')
    .replace(/From directly overhead at roughly 1–2 meters above her, the camera points straight down at a 90-degree angle, creating a flattened top-down composition with no diagonal viewing direction\./g,
      'The camera is positioned directly above the woman and points vertically downward, creating a flattened top-down composition.');
}

// Several frozen baselines were captured after the six-group full-body camera
// policy was approved. Reverse only the later high-angle distance refinement
// for those baselines; the broader full-camera bridge below would incorrectly
// erase their already-approved natural and low-angle camera wording.
const HIGH_ANGLE_DISTANCE_FULL_PAIRS = [
  [FULL_CAMERA_TEXT_PAIRS[5][0], 'The camera is above her and angled downward, framing her entire figure from head to feet. The top of her head and shoulders are nearer the lens, with the rest of her body receding below them.'],
  [FULL_CAMERA_TEXT_PAIRS[6][0], "A bird's-eye view from high above, looking diagonally down at her entire figure within the surrounding space."],
  [FULL_CAMERA_TEXT_PAIRS[7][0], 'The camera is directly above her and points vertically downward, framing her entire figure in a top-down composition.'],
];

export function normalizeHighAngleDistanceForLegacy(text) {
  const blocks = text.split('\n\n');
  if (blocks.length < 2) return text;
  blocks[1] = normalizeDistanceAwareTurboCameraForLegacy(blocks[1]);
  for (const [current, previous] of HIGH_ANGLE_DISTANCE_FULL_PAIRS) {
    blocks[1] = blocks[1].replace(current, previous);
  }
  return blocks.join('\n\n');
}

export function normalizeFullCameraForLegacy(text) {
  text = normalizeCloseWormForLegacy(text);
  text = normalizeDistanceAwareTurboCameraForLegacy(text);
  const blocks = text.split('\n\n');
  if (blocks.length < 2) return text;
  for (const [current, previous] of FULL_CAMERA_TEXT_PAIRS) {
    blocks[1] = previous ? blocks[1].replace(current, previous) : blocks[1].replace(` ${current}`, '');
  }
  return blocks.join('\n\n');
}

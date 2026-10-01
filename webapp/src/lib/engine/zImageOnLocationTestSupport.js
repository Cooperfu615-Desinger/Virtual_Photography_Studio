// Test-only inverse of the reviewed source relocation. Historical snapshots
// stay immutable; do not mask arbitrary wording, camera or source changes.
import { POSE_COMPOSER_HAND_OPTIONS } from './poseComposerOptions.js';
import { normalizeFullCameraForLegacy } from './zImageFullBodyCameraTestSupport.js';

const terminal = (text) => /[.!?]$/.test(text) ? text : `${text}.`;
const captureHands = POSE_COMPOSER_HAND_OPTIONS.filter((o) => o.meta?.tags?.includes('selfie_hand_pose'))
  .map((o) => terminal(o.en[0].toUpperCase() + o.en.slice(1)));
const connection = "She is photographed within the scene's ambient light.";

export function normalizeZImageOnLocationForLegacy(text) {
  const blocks = String(text || '').split('\n\n');
  const lines = blocks[1]?.split('\n') || [];
  const carriage = /^A (?:densely crowded )?Japanese (?:passenger train|commuter train)/.test(lines[0] || '');
  if (lines.length < 2 || (!carriage && !lines[0].startsWith('The setting is '))) return text;
  const [scene, pose, ...tail] = lines;
  if (!/^She\b/.test(pose)) return text;
  const hand = captureHands.find((source) => tail.includes(source)) || '';
  const remaining = tail.filter((line) => line !== hand && line !== connection);
  const cameraPattern = /^(?:Square|Vertical|Landscape|Wide|Full-body|Waist-up|Knee-up|Chest-up|Head-and-shoulders|Tight|Close-up|Extreme|Half-face|Face-detail|Portrait|Photographed|The camera|An? |Worm|Eye-level|High-angle|Overhead|Bird|Front view|Back view)/i;
  const composition = cameraPattern.test(remaining.at(-1) || '') ? remaining.pop() : '';
  // At most one lighting source line, and no unknown new source lines.
  if (remaining.length > 1) return text;
  const lighting = remaining[0] || '';
  const rest = blocks.slice(3);
  const wardrobe = /^She wears\b/.test(rest[0] || '') ? rest.shift() : '';
  if (carriage) return [blocks[0], composition, blocks[2], wardrobe, pose, scene, lighting, ...rest]
    .filter(Boolean).join('\n\n');
  const visible = /^A (?:background|visible|nearby)|^The exact /.test(rest[0] || '') ? rest.shift() : '';
  return [blocks[0], [scene, composition, hand].filter(Boolean).join(' '), blocks[2],
    pose, wardrobe, visible, lighting, ...rest].filter(Boolean).join('\n\n');
}

export function normalizeOnLocationAndFullCameraForLegacy(text) {
  return normalizeFullCameraForLegacy(normalizeZImageOnLocationForLegacy(text));
}

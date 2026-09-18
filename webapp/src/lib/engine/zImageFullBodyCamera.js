// Authored full-body angle projection, not a new camera selection or lens rule.
// Caller owns main ordinary single/fullBody eligibility. See the v1 spec.
import { buildCameraAngleDistanceClause } from './cameraAngleDistance.js';

export const FULL_BODY_CAMERA_GROUPS = Object.freeze({
  '平視高度鏡頭': 'natural',
  '肩部高度鏡頭': 'natural',
  '腰部高度鏡頭': 'natural',
  '膝蓋高度鏡頭': 'natural',
  '荷蘭角/傾斜 (Dutch Angle)': 'natural',
  '地面高度鏡頭': 'low',
  '蟲眼視角鏡頭': 'wormEye',
  '高位俯視鏡頭': 'high',
  '鳥瞰視角': 'birdEye',
  '正上方俯視鏡頭': 'topDown',
});

export function buildZImageFullBodyCamera(angle, poseBaseId = '') {
  const label = angle?.zh;
  switch (FULL_BODY_CAMERA_GROUPS[label]) {
    case 'natural':
      return label === '荷蘭角/傾斜 (Dutch Angle)'
        ? 'Her entire figure is framed with natural-looking proportions, with the frame deliberately tilted diagonally.'
        : 'Her entire figure is framed with natural-looking proportions.';
    case 'low':
      return 'The camera is positioned near floor level, set back from her and tilted upward to include her entire figure from head to feet. The upward perspective is clear, with a gradual change in scale along her body.';
    case 'wormEye':
      // Feet lead only for standing. Never make a seated/kneeling/lying pose
      // stand up or invent a new support point to satisfy the camera template.
      return poseBaseId === 'standing'
        ? "An extreme worm's-eye view with the camera almost touching the ground, very close to her feet and looking steeply upward along her body. Her feet and lower legs loom large in the near foreground, while her torso and head recede sharply above them. Her entire figure remains in the frame, with pronounced foreshortening and perspective stretching near the frame edges."
        : "An extreme worm's-eye view with the camera almost touching the ground, very close to her and looking steeply upward. The closest parts of her body loom large in the foreground, while the more distant parts recede sharply. Her entire figure remains in the frame, with pronounced foreshortening and perspective stretching near the frame edges.";
    case 'high':
      return `${buildCameraAngleDistanceClause('high')}, framing her entire figure from head to feet. The subject remains dominant in the frame, with the upper-facing body planes nearest the lens slightly more prominent and the rest of her figure receding below them.`;
    case 'birdEye':
      return `${buildCameraAngleDistanceClause('birdEye')} at her entire figure. Her figure occupies less of the frame, while the surrounding spatial layout remains clearly visible.`;
    case 'topDown':
      return `${buildCameraAngleDistanceClause('topDown')}, framing her entire figure. The view is flattened and graphic, with no diagonal viewing direction.`;
    default:
      return '';
  }
}

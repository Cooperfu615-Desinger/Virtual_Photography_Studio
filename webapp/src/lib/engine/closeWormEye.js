import { COMPOSITION_VISIBILITY_BUCKETS as B } from './compositionVisibilityContract.js';

export const CLOSE_WORM_EYE_VERSION = '1.0.0';
const ending = 'Pronounced foreshortening and perspective stretching near the frame edges emphasize the intimate camera distance. Nearby body contours may extend beyond the side edges of the frame.';

// Callers own ordinary-main eligibility. Do not change shared camera geometry,
// orbit, lens, scene visibility or canonical pose to satisfy this close crop.
export function buildCloseWormEyeText(angle, bucket, poseBaseId = '') {
  if (angle?.zh !== '蟲眼視角鏡頭' || ![B.MEDIUM_WAIST, B.COWBOY_KNEE].includes(bucket)) return '';
  if (poseBaseId !== 'standing') {
    return `An extreme close-range worm’s-eye view, with the lens almost against the nearest visible part of her body, looking steeply upward along her body. The nearest body contours dominate the immediate foreground, while more distant body areas recede sharply. ${ending}`;
  }
  return bucket === B.MEDIUM_WAIST
    ? `An extreme close-range worm’s-eye view, with the lens almost against her lower torso, looking steeply upward along her body. Her waist and lower torso dominate the immediate foreground, while her chest, shoulders, and head recede sharply above them. ${ending}`
    : `An extreme close-range worm’s-eye view, with the lens almost against her thighs just above knee level, looking steeply upward along her body. Her thighs and hips dominate the immediate foreground, while her waist, upper torso, and head recede sharply above them. ${ending}`;
}

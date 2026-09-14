import { COMPOSITION_VISIBILITY_BUCKETS as B } from './compositionVisibilityContract.js';
import { buildZImageTurboCameraGeometry } from './zImageTurboCameraGeometry.js';
import { buildZImageFullBodyCamera, FULL_BODY_CAMERA_GROUPS } from './zImageFullBodyCamera.js';

export const GPT_CAMERA_SPATIAL_VERSION = '1.0.0';
// Exact known labels only. The caller supplies the existing compact descriptor;
// unknown/custom angles and unconstrained framing retain their original text.
export function buildGptCameraSpatialText(angle, bucket, poseBaseId = '') {
  if (!FULL_BODY_CAMERA_GROUPS[angle?.zh] || !Object.values(B).includes(bucket)
    || [B.UNCONSTRAINED, B.FIXED_COMPOSITION].includes(bucket)) return '';
  if (bucket === B.FULL_BODY) {
    if (angle.zh === '高位俯視鏡頭' && poseBaseId !== 'standing') {
      return 'The camera is above her and angled downward, framing her entire figure from head to feet, with the nearest body areas appearing larger than those farther away.';
    }
    return buildZImageFullBodyCamera(angle, poseBaseId);
  }
  if (angle.zh === '鳥瞰視角') {
    return 'The camera is high above her and looks diagonally downward, keeping the selected crop on her rather than widening to a full-body view.';
  }
  // Angle geometry only: do not import Z orbit/body-facing rules or a new
  // non-full-body worm-eye exaggeration. Existing crop-specific evidence stays.
  return buildZImageTurboCameraGeometry({ angle, bucket });
}

export function composeGptCameraSpatial(base, angleDescriptor, angle, bucket, poseBaseId = '') {
  const text = buildGptCameraSpatialText(angle, bucket, poseBaseId);
  if (!text) return base;
  const natural = FULL_BODY_CAMERA_GROUPS[angle.zh] === 'natural';
  const opening = (natural ? base : base.replace(`, ${angleDescriptor}`, '')).replace(/[.]+$/, '');
  return [opening ? `${opening}.` : '', text].filter(Boolean).join(' ');
}

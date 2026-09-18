import { COMPOSITION_VISIBILITY_BUCKETS as B } from './compositionVisibilityContract.js';
import { buildZImageTurboCameraGeometry } from './zImageTurboCameraGeometry.js';
import { buildZImageFullBodyCamera, FULL_BODY_CAMERA_GROUPS } from './zImageFullBodyCamera.js';
import { buildCloseWormEyeText } from './closeWormEye.js';
import { buildCameraAngleDistanceClause } from './cameraAngleDistance.js';

export const GPT_CAMERA_SPATIAL_VERSION = '1.2.0';
// Exact known labels only. The caller supplies the existing compact descriptor;
// unknown/custom angles and unconstrained framing retain their original text.
export function buildGptCameraSpatialText(angle, bucket, poseBaseId = '') {
  if (!FULL_BODY_CAMERA_GROUPS[angle?.zh] || !Object.values(B).includes(bucket)
    || [B.UNCONSTRAINED, B.FIXED_COMPOSITION].includes(bucket)) return '';
  if (bucket === B.FULL_BODY) {
    return buildZImageFullBodyCamera(angle, poseBaseId);
  }
  if (angle.zh === '鳥瞰視角') {
    return `${buildCameraAngleDistanceClause('birdEye')}, keeping the selected crop on her rather than widening to a full-body view.`;
  }
  const closeWorm = buildCloseWormEyeText(angle, bucket, poseBaseId);
  if (closeWorm) return closeWorm;
  // Remaining angle geometry only; do not import Z orbit/body-facing rules.
  return buildZImageTurboCameraGeometry({ angle, bucket, useDistanceProfiles: true });
}

export function composeGptCameraSpatial(base, angleDescriptor, angle, bucket, poseBaseId = '') {
  const text = buildGptCameraSpatialText(angle, bucket, poseBaseId);
  if (!text) return base;
  const natural = FULL_BODY_CAMERA_GROUPS[angle.zh] === 'natural';
  const opening = (natural ? base : base.replace(`, ${angleDescriptor}`, '')).replace(/[.]+$/, '');
  return [opening ? `${opening}.` : '', text].filter(Boolean).join(' ');
}

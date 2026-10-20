import { captureStyleFromLegacyLocks } from '../../lib/engine/gazeGesture.js';

// expression-pose-v2 P4 (Cooper 2026-10-20): the free composer layers left the B
// panel. Workspace state drops them (older cards and storage skip retired
// choices, Cooper 2026-10-18) so nothing invisible reaches the prompt; a selfie
// hand or prop becomes the matching 拍攝方式. The engine still reads these keys
// for older inputs until the P5 cleanup.
export const RETIRED_POSE_COMPOSER_KEYS = Object.freeze([
  'poseBaseId', 'poseOrientationId', 'poseArrangementId', 'poseHandId', 'posePropId', 'poseHeadId', 'poseAnchorId',
]);

export function retirePage1PoseComposerLocks(locks) {
  if (!locks) return locks;
  const captureStyleId = locks.captureStyleId && locks.captureStyleId !== 'standard'
    ? locks.captureStyleId : captureStyleFromLegacyLocks(locks);
  const retired = RETIRED_POSE_COMPOSER_KEYS.filter(key => locks[key] && locks[key] !== 'none');
  if (!retired.length && (locks.captureStyleId || 'standard') === captureStyleId) return locks;
  return { ...locks, captureStyleId, ...Object.fromEntries(retired.map(key => [key, 'none'])) };
}

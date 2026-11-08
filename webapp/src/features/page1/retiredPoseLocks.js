import { captureStyleFromLegacyLocks } from '../../lib/engine/gazeGesture.js';
import { migratePhoneCaptureLocks } from '../../lib/engine/phoneCapture.js';

// expression-pose-v2 P4 (Cooper 2026-10-20): the free composer layers left the B
// panel. Workspace state drops them (older cards and storage skip retired
// choices, Cooper 2026-10-18). Resolve old selfie selections to the current phone
// prop or companion orbit before dropping their retired slots. The migration
// helper preserves conflicting legacy choices for explicit user replacement.
export const RETIRED_POSE_COMPOSER_KEYS = Object.freeze([
  'poseBaseId', 'poseOrientationId', 'poseArrangementId', 'poseHandId', 'posePropId', 'poseHeadId', 'poseAnchorId',
]);

export function retirePage1PoseComposerLocks(locks) {
  if (!locks) return locks;
  const captureStyleId = locks.captureStyleId && locks.captureStyleId !== 'standard'
    ? locks.captureStyleId : captureStyleFromLegacyLocks(locks);
  // Resolve all three historical selfie slots before clearing retired layers.
  const source = (locks.captureStyleId || 'standard') === captureStyleId ? locks : { ...locks, captureStyleId };
  const migrated = migratePhoneCaptureLocks(source);
  const retired = RETIRED_POSE_COMPOSER_KEYS.filter(key => migrated[key] && migrated[key] !== 'none');
  if (!retired.length) return migrated;
  return { ...migrated, ...Object.fromEntries(retired.map(key => [key, 'none'])) };
}

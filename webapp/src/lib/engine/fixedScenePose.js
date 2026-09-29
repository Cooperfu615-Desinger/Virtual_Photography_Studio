import { getCarriagePosition, CARRIAGE_MANAGED_POSE_KEYS } from './carriageFixedComposition.js';
import { STATION_POSITION_OPTIONS } from './stationFixedComposition.js';

export const FIXED_SCENE_MANAGED_POSE_KEYS = CARRIAGE_MANAGED_POSE_KEYS;
export function getFixedScenePosition(locks = {}) {
  if (locks.subjectCount === '2') return null;
  return getCarriagePosition(locks) || STATION_POSITION_OPTIONS.find(position =>
    position.id === locks.fixedSetPositionId && position.setId === locks.fixedCompositionSetId) || null;
}
export function fixedScenePoseLocks(locks = {}) {
  const position = getFixedScenePosition(locks);
  if (!position) return locks;
  return { ...locks, ...Object.fromEntries(FIXED_SCENE_MANAGED_POSE_KEYS.map(key =>
    [key, key === 'actionPoseCardId' ? '' : 'none'])), poseBaseId: position.baseId };
}

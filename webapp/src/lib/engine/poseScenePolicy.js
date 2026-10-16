import { getSpecifiedAction } from './specifiedActions.js';

export const SUPINE_SCENE_OVERRIDE_KEYS = Object.freeze([
  'sceneAttributeId',
  'locationId',
  'importedWorldSceneMode',
  'importedWorldSceneLabel',
  'importedWorldSceneArchitectureText',
  'zImageVisibleTextEnabled',
  'zImageVisibleTextContent',
  'zImageVisibleTextLanguage',
  'zImageVisibleTextPlacement',
  'fixedCompositionSetId',
  'fixedSetPositionId',
  'fixedSetBackgroundStateId',
  'fixedSetCaptureModeId',
  'fixedSetPerformanceStateId',
]);

export const SUPINE_SCENE_RESTORE_KEYS = Object.freeze([
  ...SUPINE_SCENE_OVERRIDE_KEYS,
]);

export const SUPINE_SCENE_NONE_LOCKS = Object.freeze({
  sceneAttributeId: 'none',
  locationId: 'none',
  importedWorldSceneMode: 'none',
  importedWorldSceneLabel: '',
  importedWorldSceneArchitectureText: '',
  zImageVisibleTextEnabled: false,
  zImageVisibleTextContent: '',
  zImageVisibleTextLanguage: 'traditional-chinese',
  zImageVisibleTextPlacement: 'background-storefront-sign',
  fixedCompositionSetId: 'none',
  fixedSetPositionId: 'none',
  fixedSetBackgroundStateId: 'none',
  fixedSetCaptureModeId: 'none',
  fixedSetPerformanceStateId: 'none',
});

export function isSupinePoseSelection(locks = {}) {
  if (locks?.subjectCount !== '1') return false;
  const storedAction = getSpecifiedAction(locks, { ignoreOwners: true });
  if (storedAction) return Boolean(getSpecifiedAction(locks)?.meta?.supineGroundOnly);
  return locks?.subjectCount === '1'
    && locks?.poseBaseId === 'lying'
    && locks?.poseOrientationId === 'lying-supine';
}

/** Snapshots are scene-only persisted data, never a second arbitrary lock bag. */
export function normalizeSpecifiedActionSceneRestore(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return null;
  const validEntries = SUPINE_SCENE_RESTORE_KEYS
    .filter(key => Object.hasOwn(value, key)
      && typeof value[key] === (typeof SUPINE_SCENE_NONE_LOCKS[key] === 'boolean' ? 'boolean' : 'string'))
    .map(key => [key, value[key]]);
  if (validEntries.length === 0) return null;
  return { ...SUPINE_SCENE_NONE_LOCKS, ...Object.fromEntries(validEntries) };
}

/** Keep the scene snapshot with the action so cancel also works after a reload
 * or structured Saved Card restore. Incoming explicitly changed scene values
 * win when a higher-priority scene owner pauses the action. */
export function reconcileSpecifiedActionSceneRestore(previousLocks = {}, candidateLocks = {}, {
  restoringSelection = false,
} = {}) {
  const next = { ...candidateLocks };
  const previousSupine = Boolean(getSpecifiedAction(previousLocks)?.meta?.supineGroundOnly);
  const nextSupine = Boolean(getSpecifiedAction(next)?.meta?.supineGroundOnly);
  const previousSnapshot = normalizeSpecifiedActionSceneRestore(previousLocks.specifiedActionSceneRestore);
  next.specifiedActionSceneRestore = normalizeSpecifiedActionSceneRestore(next.specifiedActionSceneRestore);

  if (nextSupine) {
    if (next.specifiedActionSceneRestore && (restoringSelection || !previousSupine)) return next;
    if (previousSupine && previousSnapshot) {
      next.specifiedActionSceneRestore = previousSnapshot;
      return next;
    }
    const source = restoringSelection ? next : {
      ...previousLocks,
      ...Object.fromEntries(SUPINE_SCENE_RESTORE_KEYS
        .filter(key => next[key] !== previousLocks[key])
        .map(key => [key, next[key]])),
    };
    next.specifiedActionSceneRestore = normalizeSpecifiedActionSceneRestore(Object.fromEntries(
      SUPINE_SCENE_RESTORE_KEYS.map(key => [key, source[key]]),
    ));
    return next;
  }

  const snapshotExplicitlyCleared = candidateLocks.specifiedActionSceneRestore === null && previousSnapshot != null;
  if (previousSupine && previousSnapshot && !restoringSelection && !snapshotExplicitlyCleared) {
    SUPINE_SCENE_RESTORE_KEYS.forEach(key => {
      if (next[key] === previousLocks[key]) next[key] = previousSnapshot[key];
    });
  }
  next.specifiedActionSceneRestore = null;
  return next;
}
export function applySupineSceneOverride(locks = {}) {
  if (!isSupinePoseSelection(locks)) return locks;
  return {
    ...locks,
    ...SUPINE_SCENE_NONE_LOCKS,
  };
}

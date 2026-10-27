import { CAPTURE_OWNED_KEYS } from '../../lib/observationCaptureMode.js';
import {
  getSceneDependentOptions,
  sanitizeLocksForCloseupMode,
} from '../../lib/engine.js';
import { DUO_ROLE_WARDROBE_KEYS } from './page1Schema.js';
import { applicableGestureOptions } from '../../lib/engine/gazeGesture.js';
import { postureConflictsWithGaze } from '../../lib/engine/headPosture.js';
import { SPECIFIED_ACTION_RANDOM_ID, getSpecifiedAction } from '../../lib/engine/specifiedActions.js';
import { isNoneSelected } from './page1Selectors.js';
import { reconcilePage1SingleWardrobeLocks } from './page1WardrobeExclusivity.js';
import {
  applySupineSceneOverride,
  reconcileSpecifiedActionSceneRestore,
} from '../../lib/engine/poseScenePolicy.js';

const OUTFIT_PRESET_COLOR_ALIAS_PAIRS = Object.freeze([
  ['outfitPresetColorId', 'outfitPresetPrimaryColorId'],
  ['outfitPresetAColorId', 'outfitPresetAPrimaryColorId'],
  ['outfitPresetBColorId', 'outfitPresetBPrimaryColorId'],
]);

function synchronizeChangedOutfitPresetColorAliases(previousLocks, candidateLocks) {
  const next = { ...candidateLocks };

  OUTFIT_PRESET_COLOR_ALIAS_PAIRS.forEach(([legacyKey, primaryKey]) => {
    const legacyChanged = next[legacyKey] !== previousLocks[legacyKey];
    const primaryChanged = next[primaryKey] !== previousLocks[primaryKey];

    if (primaryChanged && !legacyChanged) next[legacyKey] = next[primaryKey];
    if (legacyChanged && !primaryChanged) next[primaryKey] = next[legacyKey];
  });

  return next;
}

function clearUnavailableSelection(locks, key, options, fallback = '') {
  if (!locks[key]) return;
  const allowedIds = new Set((options || []).map((option) => option.id));
  if (!allowedIds.has(locks[key])) locks[key] = fallback;
}

export function transitionPage1Locks({
  previousLocks,
  candidateLocks,
  lockControls,
  activeLibrary = [],
  restoringSelection = false,
}) {
  // expression-pose-v2 P5a (2026-10-20): the free-composer and legacy pose/special
  // action keys are retired in workspace state (retiredPoseLocks.js), so the rules
  // that coordinated them with specified actions are gone.
  let reconciledCandidate = synchronizeChangedOutfitPresetColorAliases(previousLocks, candidateLocks);
  if (!restoringSelection && reconciledCandidate.specifiedActionId !== previousLocks.specifiedActionId) reconciledCandidate.actionPoseCardId = '';
  if (reconciledCandidate.subjectCount !== '1') {
    reconciledCandidate.specifiedActionId = 'none';
    reconciledCandidate.actionPoseCardId = '';
  }
  reconciledCandidate = reconcileSpecifiedActionSceneRestore(previousLocks, reconciledCandidate, { restoringSelection });
  let next = sanitizeLocksForCloseupMode(reconciledCandidate, lockControls);
  const sceneOptions = getSceneDependentOptions(activeLibrary, next);

  clearUnavailableSelection(next, 'locationId', sceneOptions.locationOptions);
  clearUnavailableSelection(next, 'lightingId', sceneOptions.lightingOptions);
  clearUnavailableSelection(next, 'lightDirectionId', sceneOptions.lightDirectionOptions);

  const specialSubjectIsActive = Boolean(next.specialSubjectId)
    && !isNoneSelected('specialSubjectId', next.specialSubjectId, lockControls);
  const characterProfileIsActive = Boolean(next.characterProfileId)
    && !isNoneSelected('characterProfileId', next.characterProfileId, lockControls);

  if (specialSubjectIsActive && characterProfileIsActive) {
    if (next.specialSubjectId !== previousLocks.specialSubjectId) next.characterProfileId = 'none';
    else next.specialSubjectId = 'none';
  }
  if (specialSubjectIsActive || characterProfileIsActive) next.subjectCount = '1';
  if (specialSubjectIsActive) next.actionPoseCardId = '';

  [
    ['topBottomPaletteId', 'topColorId', 'bottomColorId'],
    ['topBottomPaletteAId', 'topAColorId', 'bottomAColorId'],
    ['topBottomPaletteBId', 'topBColorId', 'bottomBColorId'],
  ].forEach(([paletteKey, topColorKey, bottomColorKey]) => {
    if (next[paletteKey] && !isNoneSelected(paletteKey, next[paletteKey], lockControls)) {
      next[topColorKey] = 'none';
      next[bottomColorKey] = 'none';
    }
  });

  next = reconcilePage1SingleWardrobeLocks({
    previousLocks,
    candidateLocks: next,
    lockControls,
  });

  const activeDuoSpecialOutfitRoles = next.subjectCount === '2'
    ? ['A', 'B'].filter((role) => {
      const key = `specialOutfit${role}Id`;
      return Boolean(next[key]) && !isNoneSelected(key, next[key], lockControls);
    })
    : [];
  const specialOutfitIsActive = next.subjectCount === '2'
    ? activeDuoSpecialOutfitRoles.length > 0
    : Boolean(next.specialOutfitId)
      && !isNoneSelected('specialOutfitId', next.specialOutfitId, lockControls);
  if (next.subjectCount === '2') {
    activeDuoSpecialOutfitRoles.forEach((role) => {
      const roleNoneValues = DUO_ROLE_WARDROBE_KEYS[role];
      roleNoneValues.forEach((key) => {
        const control = lockControls.find((item) => item.key === key);
        const noneOption = control?.options?.find((option) => option.zh === '全無');
        next[key] = noneOption ? noneOption.id : '';
      });
    });
  } else if (specialOutfitIsActive) {
    lockControls.forEach((control) => {
      if (control.section !== 'wardrobe') return;
      // The single complete-look palette belongs to the active special outfit.
      if (['specialOutfitId', 'specialOutfitAId', 'specialOutfitBId', 'completeLookPaletteId'].includes(control.key)) return;
      const noneOption = control.options?.find((option) => option.zh === '全無');
      next[control.key] = noneOption ? noneOption.id : '';
    });
  }

  // Pose UI v2 (Cooper 2026-10-21): a gesture the chosen pose cannot use returns to 全無
  // instead of staying hidden; 隨機 keeps only 全無／隨機.
  if (next.gestureId && next.gestureId !== 'none') {
    const action = getSpecifiedAction(next, { ignoreOwners: true });
    const fits = next.specifiedActionId === SPECIFIED_ACTION_RANDOM_ID ? next.gestureId === 'random'
      : action && applicableGestureOptions(action).some(option => option.id === next.gestureId || next.gestureId === 'random');
    if (!fits) next.gestureId = 'none';
  }

  // A lowered gaze and a head posture that lifts the chin contradict each other.
  if (postureConflictsWithGaze(next.headPostureId, next.gazeId)) next.headPostureId = 'none';

  if (next.subjectCount !== '1') {
    next.actionPoseCardId = '';
    next.specialActionId = '';
    next.specifiedActionId = 'none';
  }

  if (candidateLocks.captureMode === 'observation' || previousLocks.captureMode === 'observation' && candidateLocks.subjectCount === '1') {
    for (const key of [...CAPTURE_OWNED_KEYS, 'specifiedActionSceneRestore']) next[key] = candidateLocks[key];
    return next;
  }
  return applySupineSceneOverride(next);
}

import {
  getSceneDependentOptions,
  sanitizeLocksForCloseupMode,
} from '../../lib/engine.js';
import {
  DUO_ROLE_WARDROBE_KEYS,
  POSE_COMPOSER_CONTROL_KEYS,
} from './page1Schema.js';
import { isNoneSelected } from './page1Selectors.js';
import { reconcilePage1SingleWardrobeLocks } from './page1WardrobeExclusivity.js';
import { applySupineSceneOverride } from '../../lib/engine/poseScenePolicy.js';

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
}) {
  let next = sanitizeLocksForCloseupMode(
    synchronizeChangedOutfitPresetColorAliases(previousLocks, candidateLocks),
    lockControls,
  );
  const sceneOptions = getSceneDependentOptions(activeLibrary, next);

  clearUnavailableSelection(next, 'locationId', sceneOptions.locationOptions);
  clearUnavailableSelection(next, 'lightingId', sceneOptions.lightingOptions);
  clearUnavailableSelection(next, 'lightDirectionId', sceneOptions.lightDirectionOptions);
  clearUnavailableSelection(next, 'poseAnchorId', sceneOptions.poseAnchorOptions, 'none');

  const poseIsActive = Boolean(next.poseId) && !isNoneSelected('poseId', next.poseId, lockControls);
  const specialActionIsActive = Boolean(next.specialActionId)
    && !isNoneSelected('specialActionId', next.specialActionId, lockControls);
  const poseComposerIsActive = POSE_COMPOSER_CONTROL_KEYS.some((key) => (
    Boolean(next[key]) && !isNoneSelected(key, next[key], lockControls)
  ));
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
  if (poseIsActive && specialActionIsActive) next.specialActionId = '';
  if (poseComposerIsActive) {
    next.poseId = '';
    next.specialActionId = '';
  }

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
      if (['specialOutfitId', 'specialOutfitAId', 'specialOutfitBId'].includes(control.key)) return;
      const noneOption = control.options?.find((option) => option.zh === '全無');
      next[control.key] = noneOption ? noneOption.id : '';
    });
  }

  if (next.subjectCount !== '1') {
    next.actionPoseCardId = '';
    next.specialActionId = '';
    POSE_COMPOSER_CONTROL_KEYS.forEach((key) => { next[key] = 'none'; });
  }

  return applySupineSceneOverride(next);
}

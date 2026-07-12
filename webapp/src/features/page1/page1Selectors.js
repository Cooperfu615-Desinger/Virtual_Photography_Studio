import { createEmptyLocks } from '../../lib/engine.js';
import { SCENE_CAMERA_CONTROL_ORDER } from '../../lib/page1ControlOrders.js';
import {
  CHARACTER_CONTROL_ORDER,
  DUO_ACCESSORY_KEYS,
  DUO_GARMENT_KEYS,
  DUO_LAYER_KEYS,
  OUTFIT_PRESET_COLOR_KEYS,
  POSE_COMPOSER_KEYS,
  SHARED_ACCESSORY_KEYS,
  SHARED_GARMENT_KEYS,
  SHARED_LAYER_KEYS,
  STYLE_WARDROBE_CONTROL_ORDER,
} from './page1Schema.js';

export function sortControls(controls, order) {
  const orderMap = new Map(order.map((key, index) => [key, index]));
  return [...controls].sort((a, b) => (orderMap.get(a.key) ?? 999) - (orderMap.get(b.key) ?? 999));
}

export function isNoneSelected(controlKey, value, controls) {
  if (!value) return false;
  const control = controls.find((item) => item.key === controlKey);
  if (!control) return true;
  const selected = control.options?.find((option) => option.id === value);
  return !selected || selected.zh === '全無';
}

export function buildAllNoneLocks(controls, currentLocks) {
  const nextLocks = createEmptyLocks();
  nextLocks.subjectCount = currentLocks.subjectCount || nextLocks.subjectCount;

  controls.forEach((control) => {
    if (control.key === 'subjectCount') return;
    const noneOption = control.options?.find((option) => option.zh === '全無');
    nextLocks[control.key] = noneOption
      ? noneOption.id
      : (control.defaultValue !== undefined
        ? control.defaultValue
        : (Array.isArray(nextLocks[control.key]) ? [] : ''));
  });
  return nextLocks;
}

function getSelectedOption(controls, key, selectedId) {
  return controls
    .find((control) => control.key === key)
    ?.options?.find((option) => option.id === selectedId) || null;
}

function isActiveOption(option) {
  return Boolean(option && option.zh !== '全無' && option.en !== 'none');
}

function hasLockedTargets(option) {
  return Array.isArray(option?.meta?.colorTargets?.locked) && option.meta.colorTargets.locked.length > 0;
}

export function createPresetColorVisibility(controls, locks) {
  const selectedSingle = getSelectedOption(controls, 'outfitPresetId', locks.outfitPresetId);
  const selectedA = getSelectedOption(controls, 'outfitPresetAId', locks.outfitPresetAId);
  const selectedB = getSelectedOption(controls, 'outfitPresetBId', locks.outfitPresetBId);

  return (controlKey) => {
    const singleMode = selectedSingle?.meta?.colorMode || '';
    const modeA = selectedA?.meta?.colorMode || '';
    const modeB = selectedB?.meta?.colorMode || '';
    if (controlKey === 'outfitPresetPrimaryColorId') return isActiveOption(selectedSingle);
    if (controlKey === 'outfitPresetContrastColorId') return ['primary_contrast', 'primary_contrast_locked'].includes(singleMode);
    if (controlKey === 'outfitPresetLockedPaletteId') return singleMode === 'primary_contrast_locked' && hasLockedTargets(selectedSingle);
    if (controlKey === 'outfitPresetAPrimaryColorId') return isActiveOption(selectedA);
    if (controlKey === 'outfitPresetAContrastColorId') return ['primary_contrast', 'primary_contrast_locked'].includes(modeA);
    if (controlKey === 'outfitPresetALockedPaletteId') return modeA === 'primary_contrast_locked' && hasLockedTargets(selectedA);
    if (controlKey === 'outfitPresetBPrimaryColorId') return isActiveOption(selectedB);
    if (controlKey === 'outfitPresetBContrastColorId') return ['primary_contrast', 'primary_contrast_locked'].includes(modeB);
    if (controlKey === 'outfitPresetBLockedPaletteId') return modeB === 'primary_contrast_locked' && hasLockedTargets(selectedB);
    return true;
  };
}

function buildCoreControls(lockControls, sceneDependentOptions) {
  const sceneAware = lockControls.map((control) => {
    if (control.key === 'locationId') return { ...control, options: sceneDependentOptions.locationOptions };
    if (control.key === 'lightingId') return { ...control, options: sceneDependentOptions.lightingOptions };
    if (control.key === 'lightDirectionId') return { ...control, options: sceneDependentOptions.lightDirectionOptions };
    return control;
  });
  return sortControls(
    sceneAware.filter((control) => SCENE_CAMERA_CONTROL_ORDER.includes(control.key)),
    SCENE_CAMERA_CONTROL_ORDER,
  );
}

function buildCharacterControls(lockControls, locks, sceneDependentOptions) {
  const sceneAware = lockControls.map((control) => control.key === 'poseAnchorId'
    ? { ...control, options: sceneDependentOptions.poseAnchorOptions || control.options }
    : control);
  const specialSubject = getSelectedOption(sceneAware, 'specialSubjectId', locks.specialSubjectId);
  const characterProfile = getSelectedOption(sceneAware, 'characterProfileId', locks.characterProfileId);
  const isSpecialSubject = Boolean(specialSubject?.specialSubject);
  const isCharacterProfile = Boolean(characterProfile?.specialSubject);
  const isDedicatedSubject = isSpecialSubject || isCharacterProfile;
  const isAndroidSubject = specialSubject?.specialSubject === 'android';

  return sortControls(sceneAware.filter((control) => {
    if (isDedicatedSubject) {
      return [
        'specialSubjectId', 'characterProfileId', 'expressionId', ...POSE_COMPOSER_KEYS,
        ...(isAndroidSubject ? ['hairstyleId', 'hairColorId'] : []),
      ].includes(control.key);
    }
    if (!(control.section === 'character' || control.key === 'subjectCount')) return false;
    if (['specialSubjectId', 'characterProfileId'].includes(control.key)) return true;
    if (['duoPoseId', 'duoPoseBaseId', 'duoExpressionId'].includes(control.key) && locks.subjectCount !== '2') return false;
    if (['poseId', 'specialActionId'].includes(control.key)) return false;
    if (POSE_COMPOSER_KEYS.includes(control.key) && locks.subjectCount !== '1') return false;
    if (['bodyTypeId', 'facialFeaturesId', 'skinDetailsId', 'hairstyleId', 'hairColorId', 'expressionId'].includes(control.key) && locks.subjectCount === '2') return false;
    if ([
      'bodyTypeAId', 'bodyTypeBId', 'facialFeaturesAId', 'facialFeaturesBId',
      'skinDetailsAId', 'skinDetailsBId', 'hairstyleAId', 'hairstyleBId',
      'hairColorAId', 'hairColorBId', 'duoPoseId', 'duoPoseBaseId', 'duoExpressionId',
    ].includes(control.key) && locks.subjectCount !== '2') return false;
    return true;
  }), CHARACTER_CONTROL_ORDER);
}

function buildWardrobeControls(lockControls, locks) {
  const selectedSpecialSubject = getSelectedOption(lockControls, 'specialSubjectId', locks.specialSubjectId);
  if (selectedSpecialSubject?.specialSubject) return [];

  const showPresetColorControl = createPresetColorVisibility(lockControls, locks);
  const specialOutfitActive = locks.subjectCount === '2'
    ? ['specialOutfitAId', 'specialOutfitBId'].some((key) => (
      Boolean(locks[key]) && !isNoneSelected(key, locks[key], lockControls)
    ))
    : Boolean(locks.specialOutfitId) && !isNoneSelected('specialOutfitId', locks.specialOutfitId, lockControls);
  const hasCompleteLookSingle = ['specialOutfitId', 'outfitPresetId', 'dressId']
    .some((key) => Boolean(locks[key]) && !isNoneSelected(key, locks[key], lockControls));
  const hasCompleteLookA = ['specialOutfitAId', 'outfitPresetAId', 'dressAId']
    .some((key) => Boolean(locks[key]) && !isNoneSelected(key, locks[key], lockControls));
  const hasCompleteLookB = ['specialOutfitBId', 'outfitPresetBId', 'dressBId']
    .some((key) => Boolean(locks[key]) && !isNoneSelected(key, locks[key], lockControls));

  return sortControls(lockControls.filter((control) => {
    if (control.section !== 'wardrobe') return false;
    if (['specialOutfitId', 'completeLookPaletteId'].includes(control.key) && locks.subjectCount === '2') return false;
    if (['specialOutfitAId', 'specialOutfitBId', 'completeLookPaletteAId', 'completeLookPaletteBId'].includes(control.key) && locks.subjectCount !== '2') return false;
    if (specialOutfitActive && ![
      'specialOutfitId', 'specialOutfitAId', 'specialOutfitBId',
      'completeLookPaletteId', 'completeLookPaletteAId', 'completeLookPaletteBId',
    ].includes(control.key)) return false;
    if (control.key === 'completeLookPaletteId' && !hasCompleteLookSingle) return false;
    if (control.key === 'completeLookPaletteAId' && !hasCompleteLookA) return false;
    if (control.key === 'completeLookPaletteBId' && !hasCompleteLookB) return false;
    if (['outfitPresetId', 'completeLookPaletteId', ...OUTFIT_PRESET_COLOR_KEYS.slice(0, 3)].includes(control.key) && locks.subjectCount === '2') return false;
    if ([
      'outfitPresetAId', 'completeLookPaletteAId', ...OUTFIT_PRESET_COLOR_KEYS.slice(3, 6),
      'outfitPresetBId', 'completeLookPaletteBId', ...OUTFIT_PRESET_COLOR_KEYS.slice(6, 9),
    ].includes(control.key) && locks.subjectCount !== '2') return false;
    if (SHARED_GARMENT_KEYS.includes(control.key) && locks.subjectCount === '2') return false;
    if (DUO_GARMENT_KEYS.includes(control.key) && locks.subjectCount !== '2') return false;
    if (SHARED_LAYER_KEYS.includes(control.key) && locks.subjectCount === '2') return false;
    if (DUO_LAYER_KEYS.includes(control.key) && locks.subjectCount !== '2') return false;
    if (SHARED_ACCESSORY_KEYS.includes(control.key) && locks.subjectCount === '2') return false;
    if (DUO_ACCESSORY_KEYS.includes(control.key) && locks.subjectCount !== '2') return false;
    if (OUTFIT_PRESET_COLOR_KEYS.includes(control.key) && !showPresetColorControl(control.key)) return false;
    return true;
  }), STYLE_WARDROBE_CONTROL_ORDER);
}

export function buildPage1ControlGroups({ lockControls, locks, sceneDependentOptions }) {
  const coreLockControls = buildCoreControls(lockControls, sceneDependentOptions);
  const characterLockControls = buildCharacterControls(lockControls, locks, sceneDependentOptions);
  const wardrobeLockControls = buildWardrobeControls(lockControls, locks);
  const isOutfitPresetActive = locks.subjectCount === '2'
    ? ['outfitPresetAId', 'outfitPresetBId'].some((key) => (
      Boolean(locks[key]) && !isNoneSelected(key, locks[key], wardrobeLockControls)
    ))
    : Boolean(locks.outfitPresetId)
      && !isNoneSelected('outfitPresetId', locks.outfitPresetId, wardrobeLockControls);

  return { coreLockControls, characterLockControls, wardrobeLockControls, isOutfitPresetActive };
}

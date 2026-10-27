export const PAGE1_SINGLE_SEPARATE_WARDROBE_KEYS = Object.freeze([
  'topId',
  'topFitId',
  'topStylingId',
  'topBottomPaletteId',
  'topColorId',
  'topPatternId',
  'pantsId',
  'skirtId',
  'bottomFitId',
  'bottomRiseId',
  'bottomColorId',
  'bottomPatternId',
]);

export const PAGE1_SINGLE_OUTFIT_PRESET_STATE_KEYS = Object.freeze([
  'outfitPresetId',
  'outfitPresetColorId',
  'outfitPresetPrimaryColorId',
  'outfitPresetContrastColorId',
  'outfitPresetLockedPaletteId',
]);

export const PAGE1_SINGLE_DRESS_STATE_KEYS = Object.freeze([
  'dressId',
  'dressColorId',
]);

export const PAGE1_SINGLE_COMPLETE_LOOK_STATE_KEYS = Object.freeze([
  'specialOutfitId',
  'completeLookPaletteId',
  ...PAGE1_SINGLE_OUTFIT_PRESET_STATE_KEYS,
  ...PAGE1_SINGLE_DRESS_STATE_KEYS,
]);

function getControlByKey(lockControls, key) {
  return lockControls.find((control) => control.key === key) || null;
}

function isActiveSelection(locks, key, lockControls) {
  const value = locks[key];
  if (!value) return false;
  const option = getControlByKey(lockControls, key)?.options?.find((item) => item.id === value);
  return Boolean(option && option.zh !== '全無' && option.en !== 'none');
}

function getNoneOrDefaultValue(lockControls, key, currentValue) {
  const control = getControlByKey(lockControls, key);
  const noneOption = control?.options?.find((option) => option.zh === '全無');
  if (noneOption) return noneOption.id;
  if (control?.defaultValue !== undefined) return control.defaultValue;
  return Array.isArray(currentValue) ? [] : '';
}

export function clearPage1WardrobeKeys(locks, keys, lockControls) {
  const next = { ...locks };
  keys.forEach((key) => {
    next[key] = getNoneOrDefaultValue(lockControls, key, next[key]);
  });
  return next;
}

function changedToActive(previousLocks, nextLocks, keys, lockControls) {
  return keys.some((key) => (
    previousLocks[key] !== nextLocks[key]
    && isActiveSelection(nextLocks, key, lockControls)
  ));
}

// A known legacy combination, not permission to create a new manual mixture.
export function getLegacyDressPalette(locks, lockControls) {
  if (locks.subjectCount !== '1'
    || !isActiveSelection(locks, 'dressId', lockControls)
    || isActiveSelection(locks, 'outfitPresetId', lockControls)
    || isActiveSelection(locks, 'specialOutfitId', lockControls)) return null;
  const dress = getControlByKey(lockControls, 'dressId')?.options?.find(item => item.id === locks.dressId);
  const palette = getControlByKey(lockControls, 'topBottomPaletteId')?.options?.find(item => item.id === locks.topBottomPaletteId);
  return dress && !['', 'none', 'random'].includes(dress.id)
    && palette && !['', 'none', 'random'].includes(palette.id) && palette.topColor && palette.bottomColor
    ? palette : null;
}

export function reconcilePage1SingleWardrobeLocks({
  previousLocks = {},
  candidateLocks,
  lockControls,
  restoringSelection = false,
}) {
  if (candidateLocks.subjectCount !== '1') return { ...candidateLocks };

  const separateKeys = PAGE1_SINGLE_SEPARATE_WARDROBE_KEYS.filter(key => key !== 'topBottomPaletteId');
  // Single fields can remain dormant while editing A/B; they never borrow role fields.
  const previousPalette = getLegacyDressPalette({ ...previousLocks, subjectCount: '1' }, lockControls);
  const changingDress = ['dressId', 'dressColorId'].some(key => previousLocks[key] !== candidateLocks[key]);
  const activatingSeparate = changedToActive(previousLocks, candidateLocks, separateKeys, lockControls);
  if (!restoringSelection && previousPalette
    && candidateLocks.topBottomPaletteId === previousPalette.id && (changingDress || activatingSeparate)) {
    candidateLocks = clearPage1WardrobeKeys(candidateLocks, ['topBottomPaletteId'], lockControls);
  }
  const palette = getLegacyDressPalette(candidateLocks, lockControls);
  const continuingLegacy = previousPalette && !changingDress && !activatingSeparate
    && previousPalette.id === palette?.id;
  if (palette && (restoringSelection || continuingLegacy)) {
    return clearPage1WardrobeKeys(candidateLocks,
      [...PAGE1_SINGLE_OUTFIT_PRESET_STATE_KEYS, ...separateKeys], lockControls);
  }

  // Special outfits retain their existing full-wardrobe takeover contract.
  if (isActiveSelection(candidateLocks, 'specialOutfitId', lockControls)) {
    return { ...candidateLocks };
  }

  const outfitPresetActivated = changedToActive(
    previousLocks,
    candidateLocks,
    ['outfitPresetId'],
    lockControls,
  );
  const dressActivated = changedToActive(
    previousLocks,
    candidateLocks,
    ['dressId'],
    lockControls,
  );
  const separatesActivated = changedToActive(
    previousLocks,
    candidateLocks,
    PAGE1_SINGLE_SEPARATE_WARDROBE_KEYS,
    lockControls,
  );

  // When a bulk payload contains both families, preserve the historical
  // complete-look priority: outfit preset, then dress, then separates.
  if (outfitPresetActivated) {
    return clearPage1WardrobeKeys(
      candidateLocks,
      [...PAGE1_SINGLE_DRESS_STATE_KEYS, ...PAGE1_SINGLE_SEPARATE_WARDROBE_KEYS],
      lockControls,
    );
  }
  if (dressActivated) {
    return clearPage1WardrobeKeys(
      candidateLocks,
      [...PAGE1_SINGLE_OUTFIT_PRESET_STATE_KEYS, ...PAGE1_SINGLE_SEPARATE_WARDROBE_KEYS],
      lockControls,
    );
  }
  if (separatesActivated) {
    return clearPage1WardrobeKeys(
      candidateLocks,
      PAGE1_SINGLE_COMPLETE_LOOK_STATE_KEYS,
      lockControls,
    );
  }

  if (isActiveSelection(candidateLocks, 'outfitPresetId', lockControls)) {
    return clearPage1WardrobeKeys(
      candidateLocks,
      [...PAGE1_SINGLE_DRESS_STATE_KEYS, ...PAGE1_SINGLE_SEPARATE_WARDROBE_KEYS],
      lockControls,
    );
  }
  if (isActiveSelection(candidateLocks, 'dressId', lockControls)) {
    return clearPage1WardrobeKeys(
      candidateLocks,
      [...PAGE1_SINGLE_OUTFIT_PRESET_STATE_KEYS, ...PAGE1_SINGLE_SEPARATE_WARDROBE_KEYS],
      lockControls,
    );
  }

  const separatesAreActive = PAGE1_SINGLE_SEPARATE_WARDROBE_KEYS.some((key) => (
    isActiveSelection(candidateLocks, key, lockControls)
  ));
  if (separatesAreActive) {
    return clearPage1WardrobeKeys(
      candidateLocks,
      PAGE1_SINGLE_COMPLETE_LOOK_STATE_KEYS,
      lockControls,
    );
  }

  const completeLookWasExplicitlyCleared = ['outfitPresetId', 'dressId'].some((key) => (
    isActiveSelection(previousLocks, key, lockControls)
    && previousLocks[key] !== candidateLocks[key]
    && Boolean(candidateLocks[key])
    && !isActiveSelection(candidateLocks, key, lockControls)
  ));
  if (completeLookWasExplicitlyCleared) {
    return clearPage1WardrobeKeys(
      candidateLocks,
      PAGE1_SINGLE_COMPLETE_LOOK_STATE_KEYS,
      lockControls,
    );
  }

  // Empty values are the engine's random mode. Keep them intact for section
  // and global random actions so the resolver can choose the active family.
  return { ...candidateLocks };
}

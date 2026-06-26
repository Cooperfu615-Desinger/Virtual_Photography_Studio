export const OUTFIT_PRESET_COVERED_KEYS = new Set([
  'topId',
  'topFitId',
  'topStylingId',
  'topColorId',
  'topPatternId',
  'dressId',
  'dressColorId',
  'pantsId',
  'skirtId',
  'bottomFitId',
  'bottomRiseId',
  'bottomColorId',
  'bottomPatternId',
]);

export const OUTFIT_PRESET_A_COVERED_KEYS = new Set([
  'topAId',
  'topFitAId',
  'topStylingAId',
  'topAColorId',
  'topAPatternId',
  'dressAId',
  'dressAColorId',
  'pantsAId',
  'skirtAId',
  'bottomFitAId',
  'bottomRiseAId',
  'bottomAColorId',
  'bottomAPatternId',
]);

export const OUTFIT_PRESET_B_COVERED_KEYS = new Set([
  'topBId',
  'topFitBId',
  'topStylingBId',
  'topBColorId',
  'topBPatternId',
  'dressBId',
  'dressBColorId',
  'pantsBId',
  'skirtBId',
  'bottomFitBId',
  'bottomRiseBId',
  'bottomBColorId',
  'bottomBPatternId',
]);

export function getControlOptionLabel(controls, key, value) {
  if (!value) return '';
  const control = controls.find((item) => item.key === key);
  const option = control?.options?.find((item) => item.id === value);
  if (!option || option.zh === '全無' || option.zh === '隨機') return '';
  return option.zh || '';
}

function buildSummaryText(parts) {
  const filtered = parts.filter(Boolean);
  return filtered.length > 0 ? filtered.join(' / ') : '尚未形成明確選項';
}

function isFixedCompositionSetActive(locks, controls) {
  return Boolean(getControlOptionLabel(controls, 'fixedCompositionSetId', locks.fixedCompositionSetId));
}

function isOutfitPresetActive(locks, controls, key) {
  return Boolean(getControlOptionLabel(controls, key, locks[key]));
}

function isCoveredByOutfitPreset(key, activePresets) {
  return (
    (activePresets.single && OUTFIT_PRESET_COVERED_KEYS.has(key))
    || (activePresets.a && OUTFIT_PRESET_A_COVERED_KEYS.has(key))
    || (activePresets.b && OUTFIT_PRESET_B_COVERED_KEYS.has(key))
  );
}

function getEffectiveWardrobeOptionLabel(controls, locks, key, activePresets) {
  if (isCoveredByOutfitPreset(key, activePresets)) return '';
  return getControlOptionLabel(controls, key, locks[key]);
}

function getActiveOutfitPresets(locks, controls) {
  return {
    single: isOutfitPresetActive(locks, controls, 'outfitPresetId'),
    a: isOutfitPresetActive(locks, controls, 'outfitPresetAId'),
    b: isOutfitPresetActive(locks, controls, 'outfitPresetBId'),
  };
}

export function buildWorkspaceSummary(locks, controls) {
  const subjectTypeLabel = getControlOptionLabel(controls, 'subjectCount', locks.subjectCount);
  const specialSubjectControl = controls.find((control) => control.key === 'specialSubjectId');
  const specialSubjectOption = specialSubjectControl?.options?.find((option) => option.id === locks.specialSubjectId);
  const characterProfileControl = controls.find((control) => control.key === 'characterProfileId');
  const characterProfileOption = characterProfileControl?.options?.find((option) => option.id === locks.characterProfileId);
  const isSpecialSubjectMode = Boolean(specialSubjectOption?.specialSubject);
  const isCharacterProfileMode = Boolean(characterProfileOption?.specialSubject);
  const isDedicatedSubjectMode = isSpecialSubjectMode || isCharacterProfileMode;
  const activeOutfitPresets = getActiveOutfitPresets(locks, controls);
  const wardrobeLabel = (key) => getEffectiveWardrobeOptionLabel(controls, locks, key, activeOutfitPresets);

  const characterSummary = isSpecialSubjectMode
    ? specialSubjectOption?.zh || '特殊角色'
    : isCharacterProfileMode
      ? characterProfileOption?.zh || '角色卡'
      : buildSummaryText([
        subjectTypeLabel === '上傳人物' ? subjectTypeLabel : '',
        getControlOptionLabel(controls, 'bodyTypeId', locks.bodyTypeId),
        getControlOptionLabel(controls, 'bodyTypeAId', locks.bodyTypeAId),
        getControlOptionLabel(controls, 'bodyTypeBId', locks.bodyTypeBId),
        getControlOptionLabel(controls, 'facialFeaturesId', locks.facialFeaturesId),
        getControlOptionLabel(controls, 'facialFeaturesAId', locks.facialFeaturesAId),
        getControlOptionLabel(controls, 'facialFeaturesBId', locks.facialFeaturesBId),
        getControlOptionLabel(controls, 'skinDetailsId', locks.skinDetailsId),
        getControlOptionLabel(controls, 'skinDetailsAId', locks.skinDetailsAId),
        getControlOptionLabel(controls, 'skinDetailsBId', locks.skinDetailsBId),
        getControlOptionLabel(controls, 'hairstyleId', locks.hairstyleId),
        getControlOptionLabel(controls, 'hairstyleAId', locks.hairstyleAId),
        getControlOptionLabel(controls, 'hairstyleBId', locks.hairstyleBId),
        getControlOptionLabel(controls, 'hairColorId', locks.hairColorId),
        getControlOptionLabel(controls, 'hairColorAId', locks.hairColorAId),
        getControlOptionLabel(controls, 'hairColorBId', locks.hairColorBId),
  ]);
  const poseSummary = buildSummaryText([
    getControlOptionLabel(controls, 'expressionId', locks.expressionId),
    getControlOptionLabel(controls, 'duoExpressionId', locks.duoExpressionId),
    getControlOptionLabel(controls, 'duoPoseId', locks.duoPoseId),
    getControlOptionLabel(controls, 'duoPoseBaseId', locks.duoPoseBaseId),
    getControlOptionLabel(controls, 'poseId', locks.poseId),
    getControlOptionLabel(controls, 'specialActionId', locks.specialActionId),
    getControlOptionLabel(controls, 'poseBaseId', locks.poseBaseId),
    getControlOptionLabel(controls, 'poseArrangementId', locks.poseArrangementId),
    getControlOptionLabel(controls, 'poseHandId', locks.poseHandId),
    getControlOptionLabel(controls, 'poseHeadId', locks.poseHeadId),
    getControlOptionLabel(controls, 'poseAnchorId', locks.poseAnchorId),
  ]);
  const wardrobeSummary = isDedicatedSubjectMode ? '' : buildSummaryText([
    wardrobeLabel('specialOutfitId'),
    wardrobeLabel('specialOutfitAId'),
    wardrobeLabel('specialOutfitBId'),
    wardrobeLabel('outfitPresetId'),
    wardrobeLabel('outfitPresetAId'),
    wardrobeLabel('outfitPresetBId'),
    wardrobeLabel('completeLookPaletteId'),
    wardrobeLabel('completeLookPaletteAId'),
    wardrobeLabel('completeLookPaletteBId'),
    wardrobeLabel('dressId'),
    wardrobeLabel('dressAId'),
    wardrobeLabel('dressBId'),
    wardrobeLabel('topId'),
    wardrobeLabel('topAId'),
    wardrobeLabel('topBId'),
    wardrobeLabel('topFitId'),
    wardrobeLabel('topStylingId'),
    wardrobeLabel('pantsId'),
    wardrobeLabel('pantsAId'),
    wardrobeLabel('pantsBId'),
    wardrobeLabel('skirtId'),
    wardrobeLabel('skirtAId'),
    wardrobeLabel('skirtBId'),
    wardrobeLabel('bottomFitId'),
    wardrobeLabel('bottomRiseId'),
    wardrobeLabel('legwearId'),
    wardrobeLabel('shoesId'),
    wardrobeLabel('legwearAId'),
    wardrobeLabel('shoesAId'),
    wardrobeLabel('headAccessoryAId'),
    wardrobeLabel('eyewearAId'),
    wardrobeLabel('eyewearAColorId'),
    wardrobeLabel('eyewearAPlacementId'),
    wardrobeLabel('earringsAId'),
    wardrobeLabel('neckAccessoryAId'),
    wardrobeLabel('legwearBId'),
    wardrobeLabel('shoesBId'),
    wardrobeLabel('headAccessoryBId'),
    wardrobeLabel('eyewearBId'),
    wardrobeLabel('eyewearBColorId'),
    wardrobeLabel('eyewearBPlacementId'),
    wardrobeLabel('earringsBId'),
    wardrobeLabel('neckAccessoryBId'),
  ]);
  const importedWorldSceneLabel = locks.importedWorldSceneMode === 'architecture' && locks.importedWorldSceneLabel
    ? `PAGE3：${locks.importedWorldSceneLabel}`
    : '';
  const fixedCompositionSetActive = isFixedCompositionSetActive(locks, controls);
  const sceneSummary = buildSummaryText([
    getControlOptionLabel(controls, 'sceneAttributeId', locks.sceneAttributeId),
    importedWorldSceneLabel,
    getControlOptionLabel(controls, 'fixedCompositionSetId', locks.fixedCompositionSetId),
    fixedCompositionSetActive ? getControlOptionLabel(controls, 'fixedSetPositionId', locks.fixedSetPositionId) : '',
    fixedCompositionSetActive ? getControlOptionLabel(controls, 'fixedSetBackgroundStateId', locks.fixedSetBackgroundStateId) : '',
    fixedCompositionSetActive ? getControlOptionLabel(controls, 'fixedSetCaptureModeId', locks.fixedSetCaptureModeId) : '',
    fixedCompositionSetActive ? getControlOptionLabel(controls, 'fixedSetPerformanceStateId', locks.fixedSetPerformanceStateId) : '',
    getControlOptionLabel(controls, 'locationId', locks.locationId),
    getControlOptionLabel(controls, 'lightingId', locks.lightingId),
    getControlOptionLabel(controls, 'lightDirectionId', locks.lightDirectionId),
  ]);
  const photographySummary = buildSummaryText([
    getControlOptionLabel(controls, 'framingId', locks.framingId),
    getControlOptionLabel(controls, 'angleId', locks.angleId),
    getControlOptionLabel(controls, 'orbitId', locks.orbitId),
    getControlOptionLabel(controls, 'styleId', locks.styleId),
    getControlOptionLabel(controls, 'lensId', locks.lensId),
    getControlOptionLabel(controls, 'apertureId', locks.apertureId),
    getControlOptionLabel(controls, 'shutterId', locks.shutterId),
    getControlOptionLabel(controls, 'opticalEffectId', locks.opticalEffectId),
    getControlOptionLabel(controls, 'filmId', locks.filmId),
  ]);

  return {
    character: {
      summary: characterSummary,
      meta: '',
    },
    pose: {
      summary: poseSummary,
      meta: '',
    },
    wardrobe: {
      summary: wardrobeSummary,
      meta: '',
    },
    scene: {
      summary: sceneSummary,
      meta: '',
    },
    photography: {
      summary: photographySummary,
      meta: '',
    },
  };
}

export function buildWardrobeLayerInsights(locks, controls, isSpecialOutfitActive, isAnyOutfitPresetActive) {
  const activeOutfitPresets = getActiveOutfitPresets(locks, controls);
  const selected = (key) => getEffectiveWardrobeOptionLabel(controls, locks, key, activeOutfitPresets);
  const hasAny = (keys) => keys.some((key) => selected(key));
  const mainOutfitLabels = [
    selected('specialOutfitId'),
    selected('specialOutfitAId'),
    selected('specialOutfitBId'),
    selected('outfitPresetId'),
    selected('outfitPresetAId'),
    selected('outfitPresetBId'),
    selected('dressId'),
    selected('dressAId'),
    selected('dressBId'),
    selected('topId'),
    selected('topAId'),
    selected('topBId'),
    selected('pantsId'),
    selected('pantsAId'),
    selected('pantsBId'),
    selected('skirtId'),
    selected('skirtAId'),
    selected('skirtBId'),
  ].filter(Boolean);
  const paletteLabels = [
    selected('completeLookPaletteId'),
    selected('completeLookPaletteAId'),
    selected('completeLookPaletteBId'),
    selected('outfitPresetPrimaryColorId'),
    selected('outfitPresetContrastColorId'),
    selected('outfitPresetLockedPaletteId'),
    selected('outfitPresetAPrimaryColorId'),
    selected('outfitPresetAContrastColorId'),
    selected('outfitPresetALockedPaletteId'),
    selected('outfitPresetBPrimaryColorId'),
    selected('outfitPresetBContrastColorId'),
    selected('outfitPresetBLockedPaletteId'),
    selected('topBottomPaletteId'),
    selected('topBottomPaletteAId'),
    selected('topBottomPaletteBId'),
  ].filter(Boolean);
  const layerLabels = [
    selected('outerwearId'),
    selected('outerwearAId'),
    selected('outerwearBId'),
    selected('legwearId'),
    selected('legwearAId'),
    selected('legwearBId'),
    selected('shoesId'),
    selected('shoesAId'),
    selected('shoesBId'),
  ].filter(Boolean);
  const accessoryLabels = [
    selected('headAccessoryId'),
    selected('headAccessoryAId'),
    selected('headAccessoryBId'),
    selected('eyewearId'),
    selected('eyewearColorId'),
    selected('eyewearPlacementId'),
    selected('eyewearAId'),
    selected('eyewearAColorId'),
    selected('eyewearAPlacementId'),
    selected('eyewearBId'),
    selected('eyewearBColorId'),
    selected('eyewearBPlacementId'),
    selected('earringsId'),
    selected('earringsAId'),
    selected('earringsBId'),
    selected('neckAccessoryId'),
    selected('neckAccessoryAId'),
    selected('neckAccessoryBId'),
    selected('wristAccessoryId'),
    selected('ringId'),
    selected('waistAccessoryId'),
  ].filter(Boolean);

  const notes = [];
  if (isSpecialOutfitActive) {
    notes.push('特殊穿搭維持完整造型描述，不再額外改寫服裝結構。');
  }
  if (isAnyOutfitPresetActive && hasAny(['outerwearId', 'outerwearAId', 'outerwearBId'])) {
    notes.push('套裝/連身會被視為主體輪廓，外套固定作為完整最外層，避免西裝或罩衫被模型拆成奇怪形狀。');
  }
  if (isAnyOutfitPresetActive && hasAny(['legwearId', 'legwearAId', 'legwearBId'])) {
    notes.push('襪類只作為露出的腿部或邊緣細節，不要求模型為了看見襪子而破壞長褲、長裙或連身洋裝。');
  }
  if (isAnyOutfitPresetActive && paletteLabels.length > 0) {
    notes.push('套裝/連身配色會套用在主體服裝上，不會強迫拆成獨立上身與下身版型。');
  }
  if (paletteLabels.some((label) => /黑白灰冷調|黑紅街頭|深藍丹寧|奶油米白|粉色甜酷|棕色復古|銀灰金屬|綠灰工裝|黃橘亮色/.test(label))) {
    notes.push('完整造型色系只調整特殊穿搭、套裝/連身或連身裙的整體色彩方向，保留材質差異與配件分層。');
  }
  if (mainOutfitLabels.length === 0) {
    notes.push('先選整體穿搭或上下身單件後，這裡會顯示更明確的疊穿順序。');
  }

  return {
    main: mainOutfitLabels.slice(0, 3),
    palette: paletteLabels.slice(0, 3),
    layers: layerLabels.slice(0, 4),
    accessories: accessoryLabels.slice(0, 4),
    notes,
  };
}

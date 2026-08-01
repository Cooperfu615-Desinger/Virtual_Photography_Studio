import { createCompositionVisibilityProjection } from './compositionVisibilityContract.js';

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

/**
 * Runtime presets for fixed-framing prompts derived from one resolved PAGE1
 * result. Every preset changes projection and presentation only; selection
 * resolution remains owned by the parent PAGE1 generation.
 */
export const FIXED_FRAMING_DERIVED_PROMPT_PRESETS = deepFreeze({
  facialCloseupPortrait: {
    id: 'facial-closeup-portrait',
    uiLabel: '五官特寫照',
    active: false,
    compatibilityOnly: true,
    aspectRatio: '1:1',
    lockAspectRatio: true,
    supportedModes: ['single'],
    projectResolvedSources: true,
    fixedCompositionHandling: 'projectScene',
    compositionOpening: 'Face-dominant close-up, full facial features visible, shoulders and upper garment neckline visible',
    wardrobeFallbackText: 'a simple opaque crew-neck top',
    framing: {
      id: 'facial-closeup-portrait-reference',
      zh: '臉部特寫',
      en: 'face-dominant close-up, full facial features visible, shoulders and upper garment neckline visible',
      meta: { visibility: 'close' },
    },
    projectionOverrides: {
      wardrobe: {
        roles: ['top', 'dress', 'outerwear', 'headAccessory', 'eyewear', 'earrings', 'neckAccessory'],
        conditionalRoles: [],
        detailZones: ['head', 'face', 'shoulder', 'neckline'],
      },
    },
    viewpoint: {
      rearFacingOrbitPrefixes: ['左後', '背面', '右後'],
      fallbackOrbit: {
        id: 'facial-closeup-derived-front-view',
        zh: '正面 0 度',
        en: '0-degree front view, face oriented toward the camera',
        meta: { tags: ['derived_viewpoint'] },
      },
    },
  },
  chestUpPortrait: {
    id: 'chest-up-portrait',
    uiLabel: '胸上特寫照',
    aspectRatio: '4:5',
    lockAspectRatio: true,
    supportedModes: ['single'],
    projectResolvedSources: true,
    fixedCompositionHandling: 'projectScene',
    compositionOpening: 'Chest-up portrait',
    wardrobeFallbackText: '',
    framing: {
      id: 'chest-up-portrait-reference',
      zh: '胸上特寫',
      en: 'chest-up portrait, upper torso and face clearly visible',
      meta: { visibility: 'portrait' },
    },
  },
  chestUpMjPortrait: {
    id: 'chest-up-mj-portrait',
    uiLabel: 'MJ 胸上特寫照',
    aspectRatio: '4:5',
    lockAspectRatio: true,
    supportedModes: ['single'],
    projectResolvedSources: true,
    fixedCompositionHandling: 'projectScene',
    compositionOpening: 'Chest-up editorial portrait with the head, both shoulders, upper chest, and neckline clearly visible',
    wardrobeFallbackText: '',
    framing: {
      id: 'chest-up-mj-portrait-reference',
      zh: '胸上特寫',
      en: 'chest-up editorial portrait, head, both shoulders, upper chest, and neckline clearly visible',
      meta: { visibility: 'portrait' },
    },
  },
  fullBodyCharacter: {
    id: 'full-body-character',
    uiLabel: '全身角色照',
    aspectRatio: '9:16',
    lockAspectRatio: true,
    supportedModes: ['single'],
    projectResolvedSources: false,
    fixedCompositionHandling: 'omit',
    framing: {
      id: 'full-body-character-reference',
      zh: '全身鏡頭 (Full Body Shot)',
      en: 'full body shot, full figure visible from head to toe',
      meta: { visibility: 'full' },
    },
  },
});

function applyProjectionOverrides(projection, overrides = null) {
  if (!overrides) return projection;
  const nextProjection = { ...projection };

  for (const [key, value] of Object.entries(overrides)) {
    nextProjection[key] = Object.freeze({
      ...(projection[key] || {}),
      ...value,
    });
  }

  return Object.freeze(nextProjection);
}

function resolveDerivedOrbit(baseOrbit, preset) {
  const viewpoint = preset.viewpoint;
  if (!viewpoint?.fallbackOrbit || !baseOrbit?.zh) return baseOrbit;
  return viewpoint.rearFacingOrbitPrefixes.some((prefix) => baseOrbit.zh.startsWith(prefix))
    ? viewpoint.fallbackOrbit
    : baseOrbit;
}

/**
 * Replace only framing-dependent projection state. Every other resolved
 * selection is inherited by reference from the parent generation context, so
 * constructing a derived prompt cannot reroll or mutate its source result.
 */
export function createFixedFramingDerivedContext(baseContext, preset) {
  if (!baseContext || typeof baseContext !== 'object') {
    throw new TypeError('baseContext must be an object');
  }
  if (!preset?.framing) {
    throw new TypeError('preset.framing is required');
  }

  const baseProjection = createCompositionVisibilityProjection(preset.framing);

  return {
    ...baseContext,
    framing: preset.framing,
    orbit: resolveDerivedOrbit(baseContext.orbit, preset),
    fixedCompositionSet: preset.fixedCompositionHandling === 'preserve'
      ? baseContext.fixedCompositionSet
      : null,
    fixedFramingCompositionOpening: preset.compositionOpening || '',
    compositionVisibility: applyProjectionOverrides(baseProjection, preset.projectionOverrides),
  };
}

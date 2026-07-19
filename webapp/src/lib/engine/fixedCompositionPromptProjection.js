/**
 * Canonical resolved content for PAGE1 fixed-composition prompts.
 *
 * This object is renderer-neutral. Gpt, Grok/Z-Image, and AI must receive the
 * same resolved wardrobe, canonical pose, and fixed-set scene selections from
 * this projection before applying their own wording or paragraph layout.
 */

export const FIXED_COMPOSITION_PROMPT_PROJECTION_VERSION = 1;

function freezeList(value) {
  return Object.freeze(Array.isArray(value) ? [...value] : []);
}

function freezeRecord(value) {
  return Object.freeze(value && typeof value === 'object' ? { ...value } : {});
}

function isActiveFixedCompositionSet(value) {
  return Boolean(value && value.id && value.id !== 'none');
}

export function createFixedCompositionPromptProjection({
  compositionVisibility = null,
  wardrobe = [],
  wardrobeColors = {},
  projectedCanonicalPoseText = '',
  fixedCompositionSet = null,
  fixedSetPosition = null,
  fixedSetBackgroundState = null,
  fixedSetCaptureMode = null,
  fixedSetPerformanceState = null,
  angle = null,
  orbit = null,
} = {}) {
  if (!isActiveFixedCompositionSet(fixedCompositionSet)) return null;

  const composition = compositionVisibility?.composition || {};
  return Object.freeze({
    version: FIXED_COMPOSITION_PROMPT_PROJECTION_VERSION,
    active: true,
    composition: Object.freeze({
      visibilityBucket: compositionVisibility?.bucket || '',
      source: composition.source || '',
      manualFraming: composition.manualFraming === true,
      cameraDistanceMode: composition.cameraDistanceMode || '',
    }),
    wardrobe: Object.freeze({
      items: freezeList(wardrobe),
      colors: freezeRecord(wardrobeColors),
    }),
    pose: Object.freeze({
      canonicalText: typeof projectedCanonicalPoseText === 'string'
        ? projectedCanonicalPoseText
        : '',
    }),
    scene: Object.freeze({
      fixedCompositionSet,
      fixedSetPosition,
      fixedSetBackgroundState,
      fixedSetCaptureMode,
      fixedSetPerformanceState,
      angle,
      orbit,
    }),
  });
}

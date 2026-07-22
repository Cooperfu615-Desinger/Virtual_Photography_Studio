import { createCompositionVisibilityProjection } from './compositionVisibilityContract.js';

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

/**
 * Runtime presets for fixed-framing prompts derived from one resolved PAGE1
 * result. Phase 2 connects only the existing full-body character output; the
 * future facial and chest-up outputs remain contract-only until their runtime
 * phase.
 */
export const FIXED_FRAMING_DERIVED_PROMPT_PRESETS = deepFreeze({
  fullBodyCharacter: {
    id: 'full-body-character',
    uiLabel: '全身角色照',
    aspectRatio: '9:16',
    lockAspectRatio: true,
    supportedModes: ['single'],
    fixedCompositionHandling: 'omit',
    framing: {
      id: 'full-body-character-reference',
      zh: '全身鏡頭 (Full Body Shot)',
      en: 'full body shot, full figure visible from head to toe',
      meta: { visibility: 'full' },
    },
  },
});

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

  return {
    ...baseContext,
    framing: preset.framing,
    fixedCompositionSet: preset.fixedCompositionHandling === 'omit'
      ? null
      : baseContext.fixedCompositionSet,
    compositionVisibility: createCompositionVisibilityProjection(preset.framing),
  };
}

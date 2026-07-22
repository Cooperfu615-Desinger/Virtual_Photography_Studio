import {
  FIXED_FRAMING_MAIN_OPTION_POLICY,
  HALF_FACE_COMPOSITION_TARGET,
} from './fixedFramingDerivedPromptContract.js';

const VISIBLE_OPTION_IDS = new Set(
  FIXED_FRAMING_MAIN_OPTION_POLICY.visible.map((option) => option.id),
);
const LEGACY_OPTION_IDS = new Set(
  FIXED_FRAMING_MAIN_OPTION_POLICY.legacyHidden.map((option) => option.id),
);
const RANDOM_CANDIDATE_IDS = new Set(
  FIXED_FRAMING_MAIN_OPTION_POLICY.visible
    .filter((option) => option.randomCandidate)
    .map((option) => option.id),
);

export function buildPage1MainFramingControl(control, selectedId = '') {
  if (!control || control.key !== 'framingId') return control;

  return {
    ...control,
    options: control.options
      .filter((option) => VISIBLE_OPTION_IDS.has(option.id) || option.id === selectedId)
      .map((option) => (
        LEGACY_OPTION_IDS.has(option.id)
          ? { ...option, disabled: true }
          : option
      )),
  };
}

export function getRandomMainFramingOptions(options = []) {
  return options.filter((option) => RANDOM_CANDIDATE_IDS.has(option.id));
}

export function resolveHalfFaceCompositionOpening(framing, random = Math.random) {
  if (!framing || (
    framing.id !== HALF_FACE_COMPOSITION_TARGET.framingId
    && framing.zh !== HALF_FACE_COMPOSITION_TARGET.framingZh
  )) return '';

  const variants = HALF_FACE_COMPOSITION_TARGET.placementVariants;
  const roll = Math.max(0, Math.min(0.999999999, Number(random()) || 0));
  return variants[Math.floor(roll * variants.length)]?.opening || '';
}

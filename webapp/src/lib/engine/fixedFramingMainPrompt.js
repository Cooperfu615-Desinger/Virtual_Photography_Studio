import {
  FIXED_FRAMING_MAIN_OPTION_POLICY,
  FULL_FACE_COMPOSITION_TARGET,
  HALF_FACE_COMPOSITION_TARGET,
} from './fixedFramingDerivedPromptContract.js';

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

  const optionsById = new Map(control.options.map((option) => [option.id, option]));
  const visibleOptions = FIXED_FRAMING_MAIN_OPTION_POLICY.visible
    .map((entry) => optionsById.get(entry.id))
    .filter(Boolean);
  const selectedLegacyOption = LEGACY_OPTION_IDS.has(selectedId)
    ? optionsById.get(selectedId)
    : null;

  return {
    ...control,
    options: selectedLegacyOption
      ? [...visibleOptions, { ...selectedLegacyOption, disabled: true }]
      : visibleOptions,
  };
}

export function getRandomMainFramingOptions(options = []) {
  return options.filter((option) => RANDOM_CANDIDATE_IDS.has(option.id));
}

export function resolveEdgePortraitCompositionOpening(framing, random = Math.random) {
  if (!framing) return '';
  const target = [HALF_FACE_COMPOSITION_TARGET, FULL_FACE_COMPOSITION_TARGET]
    .find((entry) => framing.id === entry.framingId || framing.zh === entry.framingZh);
  if (!target) return '';

  const variants = target.placementVariants;
  const roll = Math.max(0, Math.min(0.999999999, Number(random()) || 0));
  return variants[Math.floor(roll * variants.length)]?.opening || '';
}

export const resolveHalfFaceCompositionOpening = resolveEdgePortraitCompositionOpening;

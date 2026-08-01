import {
  MIDJOURNEY_PARAMETER_CONTRACT,
  getDefaultMidjourneyParameterSettings,
  normalizeMidjourneyParameterSettings,
} from '../../lib/engine/midjourneyParameterContract.js';

const CONTROL_BY_SELECTION_KEY = new Map(
  Object.entries(MIDJOURNEY_PARAMETER_CONTRACT.controls)
    .map(([id, control]) => [control.selectionKey, { id, ...control }])
);

function getOptionLabel(controlId, value) {
  const control = MIDJOURNEY_PARAMETER_CONTRACT.controls[controlId];
  return control.options.find((option) => option.id === value)?.label || '';
}

export function getMidjourneyAspectRatioOptionIndex(value) {
  const options = MIDJOURNEY_PARAMETER_CONTRACT.controls.aspectRatio.options;
  const index = options.findIndex((option) => option.id === value);
  return index >= 0 ? index : 0;
}

export function getMidjourneyAspectRatioIdByIndex(value) {
  const options = MIDJOURNEY_PARAMETER_CONTRACT.controls.aspectRatio.options;
  const numericValue = Number(value);
  const index = Number.isFinite(numericValue) ? Math.round(numericValue) : 0;
  const boundedIndex = Math.min(options.length - 1, Math.max(0, index));
  return options[boundedIndex].id;
}

export function createMidjourneyParameterDraft() {
  return getDefaultMidjourneyParameterSettings();
}

export function normalizeMidjourneyParameterDraft(settings = {}) {
  return normalizeMidjourneyParameterSettings(settings);
}

export function updateMidjourneyParameterDraft(settings, selectionKey, value) {
  const control = CONTROL_BY_SELECTION_KEY.get(selectionKey);
  if (!control) return normalizeMidjourneyParameterDraft(settings);
  return normalizeMidjourneyParameterDraft({
    ...settings,
    [selectionKey]: value,
  });
}
export function applyMidjourneyParameterPreset(settings, presetId) {
  const preset = MIDJOURNEY_PARAMETER_CONTRACT.presets[presetId];
  if (!preset) return normalizeMidjourneyParameterDraft(settings);
  return normalizeMidjourneyParameterDraft({
    ...settings,
    ...preset.values,
  });
}

export function buildMidjourneyParameterSummary(settings) {
  const normalized = normalizeMidjourneyParameterDraft(settings);
  const modeLabel = normalized.mjRawMode === 'raw' ? 'Raw' : 'Standard';
  const aspectRatioLabel = getOptionLabel('aspectRatio', normalized.mjAspectRatio);
  return {
    summary: [
      getOptionLabel('version', normalized.mjVersionId),
      `AR ${aspectRatioLabel}`,
      modeLabel,
      `S${normalized.mjStylize}`,
      `C${normalized.mjChaos}`,
      `W${normalized.mjWeirdness}`,
      getOptionLabel('resolution', normalized.mjResolution),
    ].join(' / '),
    meta: '僅影響 AI Prompt 與 MJ 胸上特寫照；不參與隨機',
  };
}

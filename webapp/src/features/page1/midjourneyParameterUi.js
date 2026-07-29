import {
  MIDJOURNEY_PARAMETER_CONTRACT,
  getDefaultMidjourneyParameterSettings,
} from '../../lib/engine/midjourneyParameterContract.js';

const CONTROL_ENTRIES = Object.entries(MIDJOURNEY_PARAMETER_CONTRACT.controls);
const CONTROL_BY_SELECTION_KEY = new Map(
  CONTROL_ENTRIES.map(([id, control]) => [control.selectionKey, { id, ...control }])
);

function clampInteger(value, control) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return control.defaultValue;
  return Math.min(control.max, Math.max(control.min, Math.round(numeric)));
}

function normalizeControlValue(control, value) {
  if (control.type === 'enum') {
    return control.options.some((option) => option.id === value)
      ? value
      : control.defaultValue;
  }
  return clampInteger(value, control);
}

function getOptionLabel(controlId, value) {
  const control = MIDJOURNEY_PARAMETER_CONTRACT.controls[controlId];
  return control.options.find((option) => option.id === value)?.label || '';
}

export function createMidjourneyParameterDraft() {
  return getDefaultMidjourneyParameterSettings();
}

export function normalizeMidjourneyParameterDraft(settings = {}) {
  return Object.fromEntries(
    CONTROL_ENTRIES.map(([, control]) => [
      control.selectionKey,
      normalizeControlValue(control, settings[control.selectionKey]),
    ])
  );
}

export function updateMidjourneyParameterDraft(settings, selectionKey, value) {
  const control = CONTROL_BY_SELECTION_KEY.get(selectionKey);
  if (!control) return normalizeMidjourneyParameterDraft(settings);
  return {
    ...normalizeMidjourneyParameterDraft(settings),
    [selectionKey]: normalizeControlValue(control, value),
  };
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
  return {
    summary: [
      getOptionLabel('version', normalized.mjVersionId),
      modeLabel,
      `S${normalized.mjStylize}`,
      `C${normalized.mjChaos}`,
      `W${normalized.mjWeirdness}`,
      getOptionLabel('resolution', normalized.mjResolution),
    ].join(' / '),
    meta: '僅影響 AI Prompt；不參與隨機',
  };
}

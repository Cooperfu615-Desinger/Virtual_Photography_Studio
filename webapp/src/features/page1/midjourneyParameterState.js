import {
  MIDJOURNEY_PARAMETER_SELECTION_KEYS,
  normalizeMidjourneyParameterSettings,
} from '../../lib/engine/midjourneyParameterContract.js';

const MIDJOURNEY_PARAMETER_KEY_SET = new Set(MIDJOURNEY_PARAMETER_SELECTION_KEYS);

export function createPromptGenerationLocks(locks = {}) {
  return Object.fromEntries(
    Object.entries(locks).filter(([key]) => !MIDJOURNEY_PARAMETER_KEY_SET.has(key))
  );
}

export function attachMidjourneySettingsToPrompt(prompt, settings = {}) {
  if (!prompt) return null;
  return {
    ...prompt,
    selection: {
      ...(prompt.selection || {}),
      ...normalizeMidjourneyParameterSettings(settings),
    },
  };
}

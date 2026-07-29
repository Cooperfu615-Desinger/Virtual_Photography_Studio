import {
  MIDJOURNEY_PARAMETER_SELECTION_KEYS,
  normalizeMidjourneyParameterSettings,
} from '../../lib/engine/midjourneyParameterContract.js';
import {
  appendMidjourneyParameterTail,
  stripMidjourneyParameterTail,
} from '../../lib/engine/midjourneyParameterTail.js';

const MIDJOURNEY_PARAMETER_KEY_SET = new Set(MIDJOURNEY_PARAMETER_SELECTION_KEYS);

export function createPromptGenerationLocks(locks = {}) {
  return Object.fromEntries(
    Object.entries(locks).filter(([key]) => !MIDJOURNEY_PARAMETER_KEY_SET.has(key))
  );
}

export function attachMidjourneySettingsToPrompt(prompt, settings = {}) {
  if (!prompt) return null;
  const selection = {
    ...(prompt.selection || {}),
    ...normalizeMidjourneyParameterSettings(settings),
  };
  return {
    ...prompt,
    midjourneyPrompt: appendMidjourneyParameterTail(
      stripMidjourneyParameterTail(prompt.midjourneyPrompt),
      selection,
    ),
    selection,
  };
}

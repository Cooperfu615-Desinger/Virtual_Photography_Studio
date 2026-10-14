import {
  MIDJOURNEY_PARAMETER_SELECTION_KEYS,
  normalizeMidjourneyParameterSettings,
} from '../../lib/engine/midjourneyParameterContract.js';
import {
  appendMidjourneyParameterTail,
  framingAspectRatioForSelection,
  stripMidjourneyParameterTail,
} from '../../lib/engine/midjourneyParameterTail.js';
import { getLockControls } from '../../lib/engine.js';

const MIDJOURNEY_PARAMETER_KEY_SET = new Set(MIDJOURNEY_PARAMETER_SELECTION_KEYS);

export function createPromptGenerationLocks(locks = {}) {
  return Object.fromEntries(
    Object.entries(locks).filter(([key]) => !MIDJOURNEY_PARAMETER_KEY_SET.has(key))
  );
}

export function attachMidjourneySettingsToPrompt(prompt, settings = {}) {
  if (!prompt) return null;
  const baseSelection = prompt.selection || {};
  const framingOptions = getLockControls().find(control => control.key === 'framingId')?.options || [];
  const selection = {
    ...baseSelection,
    ...normalizeMidjourneyParameterSettings(settings),
  };
  // Keep the approved framing ratio when F follows PAGE1 after a live F change.
  const tailSelection = {
    ...selection,
    framingAspectRatio: framingAspectRatioForSelection(baseSelection, framingOptions),
  };
  return {
    ...prompt,
    midjourneyPrompt: appendMidjourneyParameterTail(
      stripMidjourneyParameterTail(prompt.midjourneyPrompt),
      tailSelection,
    ),
    selection,
  };
}

import {
  MIDJOURNEY_PARAMETER_CONTRACT,
  normalizeMidjourneyParameterSettings,
} from './midjourneyParameterContract.js';
import { resolveCompositionVisibilityBucket } from './compositionVisibilityContract.js';

const CAPTURED_TAIL_PATTERN = /(?:^|\s)(--v (8\.2|8\.1)(?: --ar (\d+:\d+))?( --raw)? --s (\d+) --c (\d+) --w (\d+) --(sd|hd))\s*$/;

function getEnumOption(controlId, optionId) {
  return MIDJOURNEY_PARAMETER_CONTRACT.controls[controlId].options
    .find((option) => option.id === optionId);
}

function normalizeAspectRatio(value) {
  const normalized = String(value || '').trim();
  if (
    MIDJOURNEY_PARAMETER_CONTRACT.derivedParameters.aspectRatio.omitValues
      .includes(normalized)
  ) {
    return '';
  }
  return /^\d+:\d+$/.test(normalized) ? normalized : '';
}

// Approved 2026-10-14: when F follows PAGE1 and PAGE1 has no ratio, main MJ
// takes a portrait ratio from the framing bucket instead of falling back to
// Midjourney's 1:1 default. Fixed composition sets keep their own ratio rule.
export const MIDJOURNEY_FRAMING_ASPECT_RATIO = Object.freeze({
  faceDetail: '4:5',
  headShoulders: '4:5',
  chestUp: '4:5',
  mediumWaist: '3:4',
  cowboyKnee: '2:3',
  fullBody: '2:3',
  unconstrained: '2:3',
});

export function midjourneyFramingAspectRatio(bucket) {
  return MIDJOURNEY_FRAMING_ASPECT_RATIO[bucket] || '';
}

// Resolve the same framing ratio from a stored selection (Saved Card restore and
// live F-setting updates), given the framingId and fixedCompositionSetId control
// options. Mirrors generation: a fixed set only overrides framing when it does
// not allow framing variation (the Japanese carriage sets do).
export function framingAspectRatioForSelection(selection = {}, framingOptions = [], fixedSetOptions = []) {
  const framing = framingOptions.find(option => option.id === selection.framingId);
  const fixedSetId = selection.fixedCompositionSetId;
  const fixedSet = fixedSetId && !['none', 'random'].includes(fixedSetId)
    ? fixedSetOptions.find(option => option.id === fixedSetId) || { id: fixedSetId }
    : null;
  const fixedCompositionActive = Boolean(fixedSet) && !fixedSet.allowsFramingVariation;
  return midjourneyFramingAspectRatio(resolveCompositionVisibilityBucket(framing, { fixedCompositionActive }));
}

function resolveAspectRatio(selection, settings) {
  if (settings.mjAspectRatio !== 'page1') {
    return normalizeAspectRatio(settings.mjAspectRatio);
  }
  return normalizeAspectRatio(selection.aspectRatio)
    || normalizeAspectRatio(selection.framingAspectRatio);
}

export function buildMidjourneyParameterTail(selection = {}) {
  const settings = normalizeMidjourneyParameterSettings(selection);
  const version = getEnumOption('version', settings.mjVersionId);
  const resolution = getEnumOption('resolution', settings.mjResolution);
  const aspectRatio = resolveAspectRatio(selection, settings);
  const parts = [
    MIDJOURNEY_PARAMETER_CONTRACT.controls.version.parameter,
    version.value,
  ];

  if (aspectRatio) {
    parts.push(
      MIDJOURNEY_PARAMETER_CONTRACT.derivedParameters.aspectRatio.parameter,
      aspectRatio
    );
  }
  if (settings.mjRawMode === 'raw') {
    parts.push(MIDJOURNEY_PARAMETER_CONTRACT.controls.rawMode.parameter);
  }
  parts.push(
    MIDJOURNEY_PARAMETER_CONTRACT.controls.stylize.parameter,
    String(settings.mjStylize),
    MIDJOURNEY_PARAMETER_CONTRACT.controls.chaos.parameter,
    String(settings.mjChaos),
    MIDJOURNEY_PARAMETER_CONTRACT.controls.weirdness.parameter,
    String(settings.mjWeirdness),
    resolution.parameter,
  );

  return parts.join(' ');
}

export function parseMidjourneyParameterTail(value) {
  const text = String(value || '');
  const match = CAPTURED_TAIL_PATTERN.exec(text);
  if (!match) {
    return {
      matched: false,
      content: text,
      aspectRatio: '',
      settings: null,
      tail: '',
    };
  }

  const settings = normalizeMidjourneyParameterSettings({
    mjVersionId: match[2] === '8.1' ? 'v8-1' : 'v8-2',
    mjAspectRatio: match[3] || 'page1',
    mjRawMode: match[4] ? 'raw' : 'standard',
    mjStylize: match[5],
    mjChaos: match[6],
    mjWeirdness: match[7],
    mjResolution: match[8],
  });
  return {
    matched: true,
    content: text.slice(0, match.index).trimEnd(),
    aspectRatio: match[3] || '',
    settings,
    tail: match[1],
  };
}

export function stripMidjourneyParameterTail(value) {
  return parseMidjourneyParameterTail(value).content;
}

export function appendMidjourneyParameterTail(content, selection = {}) {
  const descriptiveText = stripMidjourneyParameterTail(content).trimEnd();
  const tail = buildMidjourneyParameterTail(selection);
  return descriptiveText ? `${descriptiveText} ${tail}` : tail;
}

import {
  MIDJOURNEY_PARAMETER_CONTRACT,
  normalizeMidjourneyParameterSettings,
} from './midjourneyParameterContract.js';

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

function resolveAspectRatio(selection, settings) {
  if (settings.mjAspectRatio !== 'page1') {
    return normalizeAspectRatio(settings.mjAspectRatio);
  }
  return normalizeAspectRatio(selection.aspectRatio);
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

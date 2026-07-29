function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

export const MIDJOURNEY_PARAMETER_CONTRACT_VERSION = '1.2.0';

export const MIDJOURNEY_PARAMETER_TAIL_PATTERN_SOURCE =
  '--v (?:8\\.2|8\\.1)(?: --ar \\d+:\\d+)?(?: --raw)? --s \\d+ --c \\d+ --w \\d+ --(?:sd|hd)';

/**
 * Machine-readable contract for the PAGE1 "F | MJ parameters" controls.
 *
 * Phase 4 appends the contract-owned parameter tail after the already-budgeted
 * AI descriptive content. Renderers and importers must use this data instead
 * of mixing Midjourney syntax into the AI text budget.
 */
export const MIDJOURNEY_PARAMETER_CONTRACT = deepFreeze({
  publicField: 'midjourneyPrompt',
  uiLabel: 'AI',
  targetModel: 'Midjourney V8',
  applicability: {
    supportedModes: ['single', 'duo'],
    affectsOnly: ['midjourneyPrompt'],
    unaffectedOutputs: [
      'grokPrompt',
      'zImagePrompt',
      'facialCloseupPortraitPrompt',
      'chestUpPortraitPrompt',
      'fullBodyCharacterPrompt',
    ],
  },
  section: {
    id: 'midjourney-parameters',
    label: 'F｜MJ 參數設定',
    randomization: 'excluded',
    positionAfter: 'E｜攝影成像',
  },
  controls: {
    version: {
      selectionKey: 'mjVersionId',
      parameter: '--v',
      type: 'enum',
      defaultValue: 'v8-2',
      options: [
        { id: 'v8-2', label: 'V8.2', value: '8.2' },
        { id: 'v8-1', label: 'V8.1', value: '8.1' },
      ],
      emission: 'always',
    },
    rawMode: {
      selectionKey: 'mjRawMode',
      parameter: '--raw',
      type: 'enum',
      defaultValue: 'standard',
      options: [
        { id: 'standard', label: '標準模式', value: false },
        { id: 'raw', label: 'Raw 模式', value: true },
      ],
      emission: 'when-raw',
    },
    stylize: {
      selectionKey: 'mjStylize',
      parameter: '--s',
      type: 'integer',
      defaultValue: 100,
      min: 0,
      max: 1000,
      emission: 'always',
    },
    chaos: {
      selectionKey: 'mjChaos',
      parameter: '--c',
      type: 'integer',
      defaultValue: 0,
      min: 0,
      max: 100,
      emission: 'always',
    },
    weirdness: {
      selectionKey: 'mjWeirdness',
      parameter: '--w',
      type: 'integer',
      defaultValue: 0,
      min: 0,
      max: 3000,
      emission: 'always',
    },
    resolution: {
      selectionKey: 'mjResolution',
      type: 'enum',
      defaultValue: 'sd',
      options: [
        { id: 'sd', label: 'SD', parameter: '--sd' },
        { id: 'hd', label: 'HD', parameter: '--hd' },
      ],
      emission: 'always',
    },
  },
  derivedParameters: {
    aspectRatio: {
      parameter: '--ar',
      source: 'resolved selection.aspectRatio',
      controlOwner: 'existing PAGE1 aspectRatio',
      omitValues: ['', 'none'],
    },
  },
  presets: {
    preciseRealistic: {
      label: '精準寫實',
      values: {
        mjRawMode: 'raw',
        mjStylize: 25,
        mjChaos: 0,
        mjWeirdness: 0,
      },
    },
    balanced: {
      label: '平衡',
      values: {
        mjRawMode: 'standard',
        mjStylize: 100,
        mjChaos: 0,
        mjWeirdness: 0,
      },
    },
    creative: {
      label: '創意',
      values: {
        mjRawMode: 'standard',
        mjStylize: 250,
        mjChaos: 10,
        mjWeirdness: 0,
      },
    },
  },
  assembly: {
    contentBudgetExcludesParameters: true,
    descriptionStructure: {
      blockCount: 1,
      sectionSeparator: 'single-space',
      preserveAuthoredTokens: true,
      preserveSectionOrder: true,
    },
    tailPatternSource: MIDJOURNEY_PARAMETER_TAIL_PATTERN_SOURCE,
    parameterOrder: [
      'version',
      'aspectRatio',
      'rawMode',
      'stylize',
      'chaos',
      'weirdness',
      'resolution',
    ],
    placement: 'single tail after all descriptive text',
    textAfterParameters: 'forbidden',
    punctuationInsideParameters: 'forbidden',
  },
  compatibility: {
    preservePublicFieldMapping: {
      AI: 'midjourneyPrompt',
    },
    preserveCanonicalPoseVerbatim: true,
    preserveCurrentBodyTypeDescriptions: true,
    bodyTypeReauthoring: 'deferred until user testing',
    unsupportedParameters: [
      '--q',
      '--quality',
      '--draft',
      '--oref',
      '--ow',
      '--turbo',
    ],
  },
  rollout: {
    phase1: {
      behaviorNeutral: true,
      purpose: 'contract, deterministic fixtures, and byte-stable baselines',
    },
    phase2: {
      behaviorNeutral: true,
      purpose: 'F-section controls and responsive UI',
    },
    phase3: {
      behaviorNeutral: true,
      purpose: 'lock, selection, storage, Saved Cards, and restore compatibility',
    },
    phase4: {
      behaviorNeutral: false,
      purpose: 'parameter-tail assembler and automatic aspect-ratio projection',
    },
    phase5: {
      behaviorNeutral: false,
      purpose: 'one Midjourney-native description block without authored-token or Body Type reauthoring',
    },
    phase6: {
      behaviorNeutral: true,
      purpose: 'downstream consumer integration, full validation, and documentation',
    },
  },
});

export function getDefaultMidjourneyParameterSettings() {
  return Object.fromEntries(
    Object.values(MIDJOURNEY_PARAMETER_CONTRACT.controls)
      .map((control) => [control.selectionKey, control.defaultValue])
  );
}

export const MIDJOURNEY_PARAMETER_SELECTION_KEYS = Object.freeze(
  Object.values(MIDJOURNEY_PARAMETER_CONTRACT.controls)
    .map((control) => control.selectionKey)
);

function normalizeMidjourneyParameterValue(control, value) {
  if (control.type === 'enum') {
    return control.options.some((option) => option.id === value)
      ? value
      : control.defaultValue;
  }

  if (value === undefined || value === null || value === '') return control.defaultValue;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return control.defaultValue;
  return Math.min(control.max, Math.max(control.min, Math.round(numeric)));
}

export function normalizeMidjourneyParameterSettings(settings = {}) {
  return Object.fromEntries(
    Object.values(MIDJOURNEY_PARAMETER_CONTRACT.controls)
      .map((control) => [
        control.selectionKey,
        normalizeMidjourneyParameterValue(control, settings[control.selectionKey]),
      ])
  );
}

export function validateMidjourneyParameterSettings(settings = {}) {
  const issues = [];

  for (const [controlId, control] of Object.entries(MIDJOURNEY_PARAMETER_CONTRACT.controls)) {
    const value = settings[control.selectionKey];
    if (value === undefined) {
      issues.push({ controlId, code: 'missing-value', selectionKey: control.selectionKey });
      continue;
    }

    if (control.type === 'enum') {
      const validIds = control.options.map((option) => option.id);
      if (!validIds.includes(value)) {
        issues.push({ controlId, code: 'invalid-enum', value, validIds });
      }
      continue;
    }

    if (!Number.isInteger(value)) {
      issues.push({ controlId, code: 'invalid-integer', value });
      continue;
    }

    if (value < control.min || value > control.max) {
      issues.push({
        controlId,
        code: 'out-of-range',
        value,
        min: control.min,
        max: control.max,
      });
    }
  }

  return issues;
}

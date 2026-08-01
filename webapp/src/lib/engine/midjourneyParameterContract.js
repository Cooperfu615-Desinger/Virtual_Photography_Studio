function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

export const MIDJOURNEY_PARAMETER_CONTRACT_VERSION = '1.5.0';

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
    aspectRatio: {
      selectionKey: 'mjAspectRatio',
      parameter: '--ar',
      type: 'enum',
      defaultValue: 'page1',
      options: [
        { id: 'page1', label: '跟隨 PAGE1', value: '' },
        { id: '1:1', label: '1:1', value: '1:1' },
        { id: '4:3', label: '4:3', value: '4:3' },
        { id: '3:2', label: '3:2', value: '3:2' },
        { id: '16:9', label: '16:9', value: '16:9' },
        { id: '21:9', label: '21:9', value: '21:9' },
        { id: '2:3', label: '2:3', value: '2:3' },
        { id: '3:4', label: '3:4', value: '3:4' },
        { id: '9:16', label: '9:16', value: '9:16' },
        { id: '1:2', label: '1:2', value: '1:2' },
        { id: '4:5', label: '4:5', value: '4:5' },
        { id: '5:4', label: '5:4', value: '5:4' },
      ],
      emission: 'when-explicit-or-page1',
    },
    rawMode: {
      selectionKey: 'mjRawMode',
      parameter: '--raw',
      type: 'enum',
      defaultValue: 'raw',
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
      defaultValue: 25,
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
      source: 'selection.mjAspectRatio, falling back to resolved selection.aspectRatio',
      controlOwner: 'F｜MJ 參數設定',
      legacySource: 'existing PAGE1 aspectRatio',
      omitValues: ['', 'none'],
    },
  },
  parameterHelp: [
    {
      parameter: '--v',
      label: '模型版本',
      description: 'V8.2／V8.1 是不同模型版本，不是數值越大越強。',
    },
    {
      parameter: '--ar',
      label: '畫面比例',
      description: '第一個數字越大越寬，第二個數字越大越高；跟隨 PAGE1 會沿用 PAGE1 比例。',
    },
    {
      parameter: '--raw',
      label: '解讀模式',
      description: 'Raw 減少預設風格介入；Standard 保留較多自動美化。',
    },
    {
      parameter: '--s',
      label: 'Stylize／風格化強度',
      description: '數值越小越貼近 Prompt；越大越有藝術化與自由發揮。',
    },
    {
      parameter: '--c',
      label: 'Chaos／變化幅度',
      description: '數值越小各結果越接近；越大差異越大，也較可能偏離 Prompt。',
    },
    {
      parameter: '--w',
      label: 'Weirdness／非常規程度',
      description: '數值越小越常規；越大越實驗性、奇特。',
    },
    {
      parameter: '--sd',
      label: '標準解析度',
      description: '使用標準解析度與像素量，生成速度與資源需求較低。',
    },
    {
      parameter: '--hd',
      label: '高解析度',
      description: '使用較高解析度與像素量，細節更多但資源需求較高。',
    },
  ],
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
  completionGate: {
    behaviorNeutral: true,
    fixtureSource: 'MIDJOURNEY_PARAMETER_FIXTURES',
    requiredConsumers: [
      'engine',
      'page1GenerationPromptCards',
      'page1DllPromptSources',
      'standardPromptImport',
      'savedCardsFavoriteCodec',
      'savedCardsMarkdownImport',
    ],
    requiredPublicOutputs: [
      'grokPrompt',
      'zImagePrompt',
      'midjourneyPrompt',
      'facialCloseupPortraitPrompt',
      'chestUpPortraitPrompt',
      'fullBodyCharacterPrompt',
    ],
    preservesHistoricalMappings: {
      Gpt: 'grokPrompt',
      'Grok/Z-Image': 'zImagePrompt',
      AI: 'midjourneyPrompt',
    },
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
    phase7: {
      behaviorNeutral: false,
      purpose: 'independent AI-only --ar control with PAGE1 fallback compatibility',
    },
    phase8: {
      behaviorNeutral: false,
      purpose: 'low-freedom default profile for Raw, Stylize, Chaos, and Weirdness',
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

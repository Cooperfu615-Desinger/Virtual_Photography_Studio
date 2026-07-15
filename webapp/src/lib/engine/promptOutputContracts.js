const CJK_UNIFIED_IDEOGRAPHS = 'CJK_UNIFIED_IDEOGRAPHS';

const COMMON_CONTROL_LEAKAGE = [
  'Subject Count:',
  'Constraints:',
  'Fixed Composition Set:',
  'Fixed Set Position:',
  'Fixed Set Capture Mode:',
  'Fixed Set Performance State:',
  'Fixed Set Integrity:',
  'Scene Priority:',
  'fixed-set rule:',
  'preserve anchors:',
  'replacementGuardEn',
  'real-scale guard:',
  'fixed-scene shared structure',
  'fixed original adult female character profile based on the supplied character reference sheets',
  'use the supplied character reference sheets as identity and outfit anchors',
  'complete special outfit:',
  'no additional clothing or accessory overrides',
  'coordinated but clearly distinct outfits',
  'avoid identical garment colors',
  'avoid matching top colors',
  'keep each woman styling visually separate',
  'distinct outfit-visible editorial',
  'complete wardrobe visible on both women',
  'visible torso and wardrobe details',
  'no headshot-only crop',
];

const GPT_SINGLE_LABELS = [
  'Image Type',
  'Subject',
  'Wardrobe',
  'Pose and Composition',
  'Scene',
  'Lighting',
  'Camera Look',
];

const GPT_DUO_LABELS = [
  'Image Type',
  'Subject',
  'Woman 1',
  'Woman 2',
  'Shared Expression',
  'Pose and Composition',
  'Scene',
  'Lighting',
  'Camera Look',
];

const DUO_Z_IMAGE_LABELS = [
  'Image Type',
  'Subject',
  'Woman 1',
  'Woman 2',
  'Shared Expression',
  'Pose and Composition',
  'Scene',
  'Lighting',
  'Camera Look',
];

const DUO_AI_LABELS = [
  'Woman 1',
  'Woman 2',
  'Pose',
  'Scene',
  'Lighting',
  'Camera Look',
];

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

export const PROMPT_OUTPUT_CONTRACT_VERSION = '1.0.0';

/**
 * Public PAGE1 prompt-output contract.
 *
 * This object intentionally contains data only, so audits and future tooling can
 * inspect or serialize it without importing renderer implementation details.
 * Required labels describe the stable skeleton. Optional labels are conditional
 * on visibility and selected content (for example Wardrobe in face close-ups).
 */
export const PROMPT_OUTPUT_CONTRACTS = deepFreeze({
  grokPrompt: {
    field: 'grokPrompt',
    uiLabel: 'Gpt',
    target: 'GPT Image / ChatGPT Image',
    source: { kind: 'field', key: 'grokPrompt' },
    applicability: {
      supportedModes: ['single', 'duo'],
      unsupportedBehavior: 'absent',
    },
    language: {
      primary: 'en',
      forbiddenUnicodeBlocks: [CJK_UNIFIED_IDEOGRAPHS],
    },
    shape: {
      paragraphSeparator: 'blank-line',
      minimumParagraphs: 3,
      modes: {
        single: {
          requiredPrefix: 'Image Type:\n',
          requiredLabels: ['Image Type', 'Subject'],
          optionalLabels: GPT_SINGLE_LABELS.filter((label) => !['Image Type', 'Subject'].includes(label)),
          forbiddenLabels: ['Woman 1', 'Woman 2', 'Shared Expression', 'Constraints'],
          orderedLabels: GPT_SINGLE_LABELS,
        },
        duo: {
          requiredPrefix: 'Image Type:\n',
          requiredLabels: ['Image Type', 'Subject', 'Woman 1', 'Woman 2', 'Pose and Composition'],
          optionalLabels: GPT_DUO_LABELS.filter((label) => ![
            'Image Type',
            'Subject',
            'Woman 1',
            'Woman 2',
            'Pose and Composition',
          ].includes(label)),
          forbiddenLabels: ['Wardrobe', 'Constraints'],
          orderedLabels: GPT_DUO_LABELS,
        },
      },
    },
    tail: {
      requiredExactLine: 'multi-cut sequence n=2',
      forbiddenSubstrings: [],
    },
    controlLeakage: {
      forbiddenCaseInsensitive: COMMON_CONTROL_LEAKAGE,
    },
  },

  zImagePrompt: {
    field: 'zImagePrompt',
    uiLabel: 'Grok/Z-Image',
    target: 'Grok Imagine / Z-Image',
    source: { kind: 'field', key: 'zImagePrompt' },
    applicability: {
      supportedModes: ['single', 'duo'],
      unsupportedBehavior: 'absent',
    },
    language: {
      primary: 'en',
      forbiddenUnicodeBlocks: [CJK_UNIFIED_IDEOGRAPHS],
    },
    shape: {
      paragraphSeparator: 'blank-line',
      minimumParagraphs: 2,
      modes: {
        single: {
          requiredPrefix: 'Create a ',
          requiredLabels: [],
          optionalLabels: ['Scene'],
          forbiddenLabels: [
            'Image Type',
            'Subject',
            'Wardrobe',
            'Woman 1',
            'Woman 2',
            'Shared Expression',
            'Pose and Composition',
            'Lighting',
            'Camera Look',
            'Constraints',
          ],
          orderedLabels: [],
        },
        duo: {
          requiredPrefix: 'Image Type:\n',
          requiredLabels: ['Image Type', 'Subject', 'Woman 1', 'Woman 2', 'Pose and Composition'],
          optionalLabels: DUO_Z_IMAGE_LABELS.filter((label) => ![
            'Image Type',
            'Subject',
            'Woman 1',
            'Woman 2',
            'Pose and Composition',
          ].includes(label)),
          forbiddenLabels: ['Wardrobe', 'Constraints'],
          orderedLabels: DUO_Z_IMAGE_LABELS,
        },
      },
    },
    tail: {
      requiredExactLine: '',
      forbiddenSubstrings: ['multi-cut sequence n=2'],
    },
    controlLeakage: {
      forbiddenCaseInsensitive: [
        ...COMMON_CONTROL_LEAKAGE,
        'controlled by the outfit color selection',
        'can retain a classic signature color scheme',
      ],
    },
  },

  midjourneyPrompt: {
    field: 'midjourneyPrompt',
    uiLabel: 'AI',
    target: 'Compact general image-model prompt',
    source: { kind: 'field', key: 'midjourneyPrompt' },
    applicability: {
      supportedModes: ['single', 'duo'],
      unsupportedBehavior: 'absent',
    },
    language: {
      primary: 'en',
      forbiddenUnicodeBlocks: [CJK_UNIFIED_IDEOGRAPHS],
    },
    shape: {
      paragraphSeparator: 'blank-line',
      minimumParagraphs: 2,
      modes: {
        single: {
          requiredPrefix: 'Create a ',
          requiredLabels: [],
          optionalLabels: [],
          forbiddenLabels: [
            'Image Type',
            'Subject',
            'Wardrobe',
            'Woman 1',
            'Woman 2',
            'Shared Expression',
            'Pose and Composition',
            'Pose',
            'Scene',
            'Lighting',
            'Camera Look',
            'Constraints',
          ],
          orderedLabels: [],
        },
        duo: {
          requiredPrefix: 'Create a ',
          requiredLabels: ['Woman 1', 'Woman 2', 'Pose'],
          optionalLabels: DUO_AI_LABELS.filter((label) => !['Woman 1', 'Woman 2', 'Pose'].includes(label)),
          forbiddenLabels: ['Image Type', 'Subject', 'Wardrobe', 'Shared Expression', 'Pose and Composition', 'Constraints'],
          orderedLabels: DUO_AI_LABELS,
        },
      },
    },
    tail: {
      requiredExactLine: '',
      forbiddenSubstrings: ['multi-cut sequence n=2'],
    },
    controlLeakage: {
      forbiddenCaseInsensitive: [
        ...COMMON_CONTROL_LEAKAGE,
        'controlled by the outfit color selection',
        'can retain a classic signature color scheme',
      ],
    },
  },

  fullBodyCharacterPrompt: {
    field: 'fullBodyCharacterPrompt',
    uiLabel: '全身角色照',
    target: 'Single-subject 9:16 full-body character reference',
    source: { kind: 'extraPrompt', id: 'full-body-character' },
    applicability: {
      supportedModes: ['single'],
      unsupportedBehavior: 'absent',
    },
    language: {
      primary: 'en',
      forbiddenUnicodeBlocks: [CJK_UNIFIED_IDEOGRAPHS],
    },
    shape: {
      paragraphSeparator: 'blank-line',
      minimumParagraphs: 4,
      modes: {
        single: {
          requiredPrefix: 'Image Type:\nCreate a photorealistic character reference portrait in a single 9:16 vertical image.',
          requiredLabels: ['Image Type', 'Subject', 'Lighting', 'Camera Look'],
          optionalLabels: ['Wardrobe'],
          forbiddenLabels: ['Woman 1', 'Woman 2', 'Shared Expression', 'Pose and Composition', 'Pose', 'Scene', 'Constraints'],
          orderedLabels: ['Image Type', 'Subject', 'Wardrobe', 'Lighting', 'Camera Look'],
        },
      },
    },
    tail: {
      requiredExactLine: '',
      forbiddenSubstrings: ['multi-cut sequence n=2'],
    },
    controlLeakage: {
      forbiddenCaseInsensitive: COMMON_CONTROL_LEAKAGE,
    },
  },
});

const UNICODE_BLOCK_PATTERNS = {
  [CJK_UNIFIED_IDEOGRAPHS]: /[\u3400-\u9fff]/u,
};

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function labelIndex(text, label) {
  const pattern = new RegExp(`(?:^|\\n)${escapeRegExp(label)}:(?:\\n|[ \\t])`);
  const match = pattern.exec(text);
  return match ? match.index : -1;
}

function issue(code, message, detail = {}) {
  return { code, message, ...detail };
}

/**
 * Validate one rendered text against a public output contract.
 *
 * The result is an array instead of throwing, allowing audits to aggregate
 * failures across seeds and modes.
 */
export function validatePromptOutputContract(field, text, { mode = 'single' } = {}) {
  const contract = PROMPT_OUTPUT_CONTRACTS[field];
  if (!contract) {
    return [issue('unknown-contract', `No prompt-output contract exists for ${field}.`, { field, mode })];
  }

  const value = typeof text === 'string' ? text : '';
  const supported = contract.applicability.supportedModes.includes(mode);
  if (!supported) {
    return value.trim()
      ? [issue('unsupported-output-present', `${field} must be absent in ${mode} mode.`, { field, mode })]
      : [];
  }

  if (!value.trim()) {
    return [issue('output-empty', `${field} must be non-empty in ${mode} mode.`, { field, mode })];
  }

  const issues = [];
  const modeShape = contract.shape.modes[mode];
  if (!modeShape) {
    issues.push(issue('missing-mode-shape', `${field} has no shape contract for ${mode} mode.`, { field, mode }));
    return issues;
  }

  if (modeShape.requiredPrefix && !value.startsWith(modeShape.requiredPrefix)) {
    issues.push(issue('prefix-mismatch', `${field} must start with its ${mode} prefix.`, {
      field,
      mode,
      expected: modeShape.requiredPrefix,
    }));
  }

  if (contract.shape.paragraphSeparator === 'blank-line') {
    const paragraphCount = value.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean).length;
    if (paragraphCount < contract.shape.minimumParagraphs) {
      issues.push(issue('paragraph-count', `${field} must contain at least ${contract.shape.minimumParagraphs} paragraphs.`, {
        field,
        mode,
        actual: paragraphCount,
      }));
    }
  }

  for (const label of modeShape.requiredLabels) {
    if (labelIndex(value, label) < 0) {
      issues.push(issue('missing-label', `${field} is missing required label ${label}.`, { field, mode, label }));
    }
  }

  for (const label of modeShape.forbiddenLabels) {
    if (labelIndex(value, label) >= 0) {
      issues.push(issue('forbidden-label', `${field} contains forbidden label ${label}.`, { field, mode, label }));
    }
  }

  const presentOrderedLabels = modeShape.orderedLabels
    .map((label) => ({ label, index: labelIndex(value, label) }))
    .filter(({ index }) => index >= 0);
  for (let index = 1; index < presentOrderedLabels.length; index += 1) {
    if (presentOrderedLabels[index - 1].index > presentOrderedLabels[index].index) {
      issues.push(issue('label-order', `${field} label ${presentOrderedLabels[index].label} is out of order.`, {
        field,
        mode,
        label: presentOrderedLabels[index].label,
      }));
      break;
    }
  }

  if (contract.tail.requiredExactLine) {
    const finalLine = value.trimEnd().split('\n').at(-1);
    if (finalLine !== contract.tail.requiredExactLine) {
      issues.push(issue('missing-tail', `${field} must end with ${contract.tail.requiredExactLine}.`, {
        field,
        mode,
        expected: contract.tail.requiredExactLine,
      }));
    }
  }

  for (const forbiddenTail of contract.tail.forbiddenSubstrings) {
    if (value.toLowerCase().includes(forbiddenTail.toLowerCase())) {
      issues.push(issue('forbidden-tail', `${field} contains forbidden tail ${forbiddenTail}.`, {
        field,
        mode,
        value: forbiddenTail,
      }));
    }
  }

  for (const block of contract.language.forbiddenUnicodeBlocks) {
    const pattern = UNICODE_BLOCK_PATTERNS[block];
    if (pattern?.test(value)) {
      issues.push(issue('language-range', `${field} contains characters from forbidden block ${block}.`, {
        field,
        mode,
        block,
      }));
    }
  }

  const lowerValue = value.toLowerCase();
  for (const forbiddenText of contract.controlLeakage.forbiddenCaseInsensitive) {
    if (lowerValue.includes(forbiddenText.toLowerCase())) {
      issues.push(issue('control-leakage', `${field} leaks internal control text: ${forbiddenText}`, {
        field,
        mode,
        value: forbiddenText,
      }));
    }
  }

  return issues;
}

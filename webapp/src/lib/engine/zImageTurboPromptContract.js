const SECTION_ORDER = Object.freeze([
  'imageType',
  'composition',
  'subject',
  'wardrobe',
  'pose',
  'scene',
  'lighting',
  'style',
  'optics',
  'rendering',
]);

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

export const Z_IMAGE_TURBO_PROMPT_CONTRACT_VERSION = '1.0.0';

export const Z_IMAGE_TURBO_PROMPT_CONTRACT = deepFreeze({
  field: 'zImagePrompt',
  uiLabel: 'Z-Image',
  profile: 'Z-Image Turbo through Magnific AI',
  compatibility: {
    historicalField: 'zImagePrompt',
    historicalUiLabel: 'Grok/Z-Image',
  },
  measurement: {
    encoderSequenceLimit: 512,
    unit: 'estimated-text-token',
    estimateIsExactTokenizerCount: false,
    targetEstimatedTokens: 400,
    softMaxEstimatedTokens: 480,
  },
  sectionOrder: SECTION_ORDER,
  primarySections: [
    'imageType',
    'composition',
    'subject',
    'wardrobe',
    'pose',
    'scene',
    'lighting',
  ],
  secondarySections: ['style', 'optics', 'rendering'],
  reductionOrder: [
    'secondary rendering details',
    'secondary optical effects',
    'secondary style explanation',
    'secondary scene details',
    'secondary wardrobe construction details',
    'general subject modifiers',
  ],
  prohibitedStrategies: [
    'hard character truncation',
    'hard word truncation',
    'partial sentence tails',
    'invented visual facts',
    'internal selection or guard language',
  ],
});

export function countZImagePromptWords(value) {
  return String(value || '').match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g)?.length || 0;
}

export function estimateZImagePromptTokens(value) {
  const text = String(value || '').trim();
  if (!text) return 0;
  const words = countZImagePromptWords(text);
  const punctuation = text.match(/[,.;:!?()[\]{}\-/]/g)?.length || 0;
  return Math.ceil(words * 1.22 + punctuation * 0.2);
}

export function createZImageTurboPromptSectionModel({ sections = [] } = {}) {
  const textById = new Map(sections.map((section) => [section.id, String(section.text || '').trim()]));
  const normalizedSections = SECTION_ORDER.map((id) => {
    const text = textById.get(id) || '';
    return {
      id,
      text,
      wordCount: countZImagePromptWords(text),
      estimatedTokens: estimateZImagePromptTokens(text),
      priority: Z_IMAGE_TURBO_PROMPT_CONTRACT.primarySections.includes(id) ? 'primary' : 'secondary',
    };
  });
  const text = normalizedSections.map((section) => section.text).filter(Boolean).join('\n\n');
  const estimatedTokens = estimateZImagePromptTokens(text);
  const { targetEstimatedTokens, softMaxEstimatedTokens } = Z_IMAGE_TURBO_PROMPT_CONTRACT.measurement;

  return deepFreeze({
    sections: normalizedSections,
    text,
    measurement: {
      words: countZImagePromptWords(text),
      estimatedTokens,
      overTargetEstimatedTokens: Math.max(0, estimatedTokens - targetEstimatedTokens),
      overSoftMaxEstimatedTokens: Math.max(0, estimatedTokens - softMaxEstimatedTokens),
      withinSoftMax: estimatedTokens <= softMaxEstimatedTokens,
    },
  });
}

export const Z_IMAGE_TURBO_SECTION_ORDER = SECTION_ORDER;

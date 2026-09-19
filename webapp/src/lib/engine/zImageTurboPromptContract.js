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

export const Z_IMAGE_TURBO_PROMPT_CONTRACT_VERSION = '1.14.0';

const SCENE_INTEGRATED_SECTION_ORDER = Object.freeze([
  'imageType', 'composition', 'subject', 'pose', 'wardrobe',
  'scene', 'lighting', 'style', 'optics', 'rendering',
]);

export const Z_IMAGE_TURBO_PROMPT_CONTRACT = deepFreeze({
  field: 'zImagePrompt',
  uiLabel: 'Z-Image',
  profile: 'Z-Image Turbo through Magnific AI',
  compatibility: {
    historicalField: 'zImagePrompt',
    historicalUiLabel: 'Grok/Z-Image',
  },
  language: {
    publicPrompt: 'en',
    uiOnlyFields: ['zh', 'desc'],
    includeUiMetadataInPrompt: false,
    automaticTranslation: false,
    bilingualDuplication: false,
    exactVisibleText: {
      supported: true,
      status: 'active-opt-in',
      defaultEnabled: false,
      instructionLanguage: 'en',
      sourceField: 'selection.zImageVisibleTextContent',
      outputs: ['zImagePrompt'],
      unspecifiedBehavior: 'do not invent copy',
    },
  },
  measurement: {
    encoderSequenceLimit: 512,
    unit: 'estimated-text-token',
    estimateIsExactTokenizerCount: false,
    targetEstimatedTokens: 400,
    softMaxEstimatedTokens: 480,
  },
  sectionOrder: SECTION_ORDER,
  singleSceneIntegrated: {
    ambientDescription: {
      version: '1.0.0',
      source: '36 exact-ID/source-pinned shared GPT/Z descriptions in ambientLightDescriptions.js',
      core: 'always retain authored ambient light; no generic first-two-clause truncation',
      detail: 'omit sky at downward cameras; reduce surface at low cameras; no visible light-source inference',
      fallback: 'unchanged legacy source pipeline for unknown, modified or excluded selections',
    },
    sectionOrder: SCENE_INTEGRATED_SECTION_ORDER,
    scope: 'ordinary PAGE1 single-subject main output only',
    exclusions: ['duo', 'fixed-composition', 'dedicated-subject', 'character-card', 'supine-surface-led', 'derived-output'],
    independentAnchor: 'omit relational anchors from Z-only projected sources; retain source-marked concrete support objects such as the ornate velvet armchair; preserve selection and shared canonical',
    selfieHand: 'relocate visible source to capture context; retain prop precedence and crop visibility',
    scene: 'merge directional-filtered projected scene sources into capture context exactly once',
    sceneDirection: {
      version: '1.0.0',
      lowCamera: 'omit reviewed ground-detail clauses',
      downwardCamera: 'omit reviewed visible-sky clauses; preserve ambient condition and light',
      unspecifiedCamera: 'no additional deletion',
      sourceBoundary: 'post-crop and post-compaction; no raw-catalog backfill or inferred scenery',
      existingDetailPriority: {
        version: '1.1.0',
        source: '45 approved catalog-ID-bound location IDs in zImageSceneDetailPriority.js (7 historical substitutions plus 38 additional; three unchanged controls remain fixtures-only)',
        scope: 'low cameras only; matching surviving prefix and verified catalog fragments required',
        exception: 'select only the approved existing fragments even if earlier projection omitted them; never restore the full source',
        fallback: 'unchanged source; no guessing on unknown, empty or changed source',
      },
      upperScene: {
        version: '1.1.0',
        source: 'eighteen approved location-ID-bound supplemental records in zImageUpperScene.js',
        scope: 'low cameras only; require surviving matching location identity',
        duplicates: 'append each authored clause at most once',
        fallback: 'none; unlisted locations and other cameras remain unchanged',
      },
      protectedSources: ['place identity', 'canonical pose', 'subject lighting', 'exact visible text'],
      unknownSource: 'preserve; no keyword-based inference',
    },
  },
  composition: {
    closeWormEye: {
      version: '1.0.0',
      scope: 'ordinary single main mediumWaist/cowboyKnee worm-eye only',
      source: 'closeWormEye.js shared with eligible main GPT; standing crop-specific, otherwise pose-neutral',
      effect: 'near-contact distance, strong foreshortening and edge stretching; nearby contours may crop laterally',
      preserves: ['other crops', 'orbit', 'pose', 'selected lens', 'scene direction', 'selection', 'MJ and derivatives'],
    },
    fullBodyCamera: {
      version: '1.0.0',
      scope: 'ordinary PAGE1 single-subject main fullBody output only',
      groups: ['natural', 'low', 'wormEye', 'high', 'birdEye', 'topDown'],
      natural: 'preserve height hints; Dutch preserves frame roll',
      wormEye: 'near-camera scale; standing feet foreground, otherwise pose-neutral nearest body parts',
      unchanged: ['other crops', 'orbit', 'pose', 'selected lens', 'scene direction', 'selection', 'other outputs'],
    },
    cameraSubjectGeometry: 'eight-direction crop-aware single-subject geometry',
    strictSideProfileGeometry: 'image-edge facing, visible-side isolation, and full near-far occlusion at 90 degrees',
    explicitCameraAngleGeometry: 'camera position, lens tilt, and crop-visible perspective evidence',
    sidePoseDepthProjection: ['hands-grip-waistband', 'hands-lift-waistband'],
    framingDescriptorPrecedence: ['cowboy', 'medium'],
    preserveSharedCanonicalPose: true,
    geometryAppliesToOutputs: ['zImagePrompt'],
  },
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

export function createZImageTurboPromptSectionModel({ sections = [], sceneIntegrated = false } = {}) {
  const textById = new Map(sections.map((section) => [section.id, String(section.text || '').trim()]));
  const order = sceneIntegrated ? SCENE_INTEGRATED_SECTION_ORDER : SECTION_ORDER;
  const normalizedSections = order.map((id) => {
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

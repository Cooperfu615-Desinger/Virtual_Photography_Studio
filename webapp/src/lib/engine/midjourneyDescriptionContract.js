function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

export const MIDJOURNEY_DESCRIPTION_CONTRACT_VERSION = '1.1.0';

/**
 * Target contract for the Midjourney-native descriptive content that appears
 * before the separately owned parameter tail.
 *
 * Phase 1 records this target without changing public Prompt text. Later
 * phases activate one behavior group at a time.
 */
export const MIDJOURNEY_DESCRIPTION_CONTRACT = deepFreeze({
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
  structure: {
    lineCount: 1,
    semanticSeparator: 'sentence boundary',
    internalClauseSeparator: 'comma',
    sectionOrder: [
      'imageType',
      'composition',
      'subject',
      'wardrobe',
      'projectedCanonicalPose',
      'sceneAndLighting',
      'imaging',
    ],
    labels: 'forbidden',
    imperativeOpening: {
      current: 'forbidden',
      phase1LegacyBaseline: 'preserved',
      phase2Target: 'forbidden',
      forbiddenPrefixes: ['Create a ', 'Create an '],
    },
    textAfterParameterTail: 'forbidden',
  },
  sourceIntegrity: {
    oneResolvedSelection: true,
    inventedVisualFacts: 'forbidden',
    exactCanonicalPoseReuse: true,
    preserveCompatibilitySelections: true,
    preserveHistoricalMappings: {
      Gpt: 'grokPrompt',
      'Grok/Z-Image': 'zImagePrompt',
      AI: 'midjourneyPrompt',
    },
  },
  imageTypeOpenings: {
    'photorealistic-photo': 'Photorealistic editorial portrait.',
    'fashion-advertising': 'Premium fashion advertising image.',
    'watercolor-illustration': 'Watercolor portrait illustration.',
    'oil-painting': 'Oil painting portrait.',
    'fashion-illustration': 'Fashion illustration.',
    'pastel-illustration': 'Pastel illustration portrait.',
  },
  compatibility: {
    parameterTailOwner: 'MIDJOURNEY_PARAMETER_CONTRACT',
    bodyTypeAnchors: 'retain source-traceable visual anchors',
    wardrobeVisibility: 'reuse composition projection',
    fixedComposition: 'reuse fixed-set source projection',
    derivedPromptParameters: 'forbidden',
  },
  rollout: {
    phase1: {
      behaviorNeutral: true,
      purpose: 'target contract, deterministic fixtures, and byte-stable baselines',
    },
    phase2: {
      behaviorNeutral: false,
      purpose: 'direct image-type opening and explicit composition-to-subject boundary',
    },
    phase3: {
      behaviorNeutral: false,
      purpose: 'subject and wardrobe semantic structure',
    },
    phase4: {
      behaviorNeutral: false,
      purpose: 'pose, scene, lighting, and imaging semantic structure',
    },
    phase5: {
      behaviorNeutral: false,
      purpose: 'special modes and length-policy recalibration',
    },
    phase6: {
      behaviorNeutral: true,
      purpose: 'downstream integration, full validation, and documentation',
    },
  },
});

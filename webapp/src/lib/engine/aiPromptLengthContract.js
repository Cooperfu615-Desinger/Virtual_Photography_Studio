function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

export const AI_PROMPT_LENGTH_CONTRACT_VERSION = '1.0.0';

/**
 * Machine-readable budget and preservation policy for the single-subject AI
 * output. Phase 1 records the target only; runtime compression is activated in
 * later phases so the baseline can be measured without changing public text.
 */
export const AI_PROMPT_LENGTH_CONTRACT = deepFreeze({
  field: 'midjourneyPrompt',
  uiLabel: 'AI',
  applicability: {
    supportedModes: ['single'],
    excludedModes: ['duo'],
  },
  measurement: {
    unit: 'english-word',
    punctuationOnlyTokens: 'ignored',
    paragraphSeparators: 'ignored',
  },
  budgets: {
    normal: {
      targetWords: 110,
      softMaxWords: 130,
    },
    completeLook: {
      targetWords: 115,
      softMaxWords: 130,
    },
    characterCard: {
      targetWords: 150,
      softMaxWords: 170,
    },
  },
  immutableSections: [
    'imageType',
    'composition',
    'projectedCanonicalPose',
  ],
  requiredAnchors: {
    shared: [
      'resolved subject identity',
      'visible wardrobe role identities',
      'scene identity',
      'selected imaging identity',
    ],
    characterCard: [
      'facialGeometry',
      'eyeSignature',
      'noseSignature',
      'mouthSignature',
      'skinSignature',
      'body',
      'hair',
      'selected eyewear or headphones',
      'all four permanent identity anchors',
    ],
  },
  reductionOrder: [
    'secondary imaging details',
    'secondary scene anchors',
    'secondary wardrobe construction details',
    'general subject modifiers',
  ],
  prohibitedStrategies: [
    'hard character truncation',
    'hard word truncation',
    'partial sentence tails',
    'invented visual shorthand',
    'renderer-specific pose rewriting',
  ],
  rollout: {
    phase1: {
      behaviorNeutral: true,
      purpose: 'contract, deterministic fixtures, and baseline measurements',
    },
    phase2: {
      behaviorNeutral: true,
      purpose: 'section-aware budget infrastructure and diagnostics',
    },
    phase3: {
      behaviorNeutral: false,
      purpose: 'normal-subject and complete-look wardrobe compression',
    },
    phase4: {
      behaviorNeutral: false,
      purpose: 'Character Card identity and wardrobe compression',
    },
    phase5: {
      behaviorNeutral: false,
      purpose: 'scene, imaging, and global budget arbitration',
    },
    phase6: {
      behaviorNeutral: true,
      purpose: 'integration regression, audit, browser verification, and documentation',
    },
  },
});

export function countAiPromptWords(value) {
  return String(value || '')
    .match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g)?.length || 0;
}


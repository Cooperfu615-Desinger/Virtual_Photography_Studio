/**
 * Current Midjourney-native structure targets.
 *
 * Phase 5 also freezes direct Character Card and duo descriptions while
 * preserving the canonical pose verbatim. The parameter tail remains outside
 * the hash.
 */
export const MIDJOURNEY_NATIVE_STRUCTURE_FIXTURES = Object.freeze([
  {
    id: 'normal-single-precise',
    expectedDescriptionHash: 'b7ad4a56858af63a43ec6e1e43ac3af77b6bd2d640d079c038b1014786ea6414',
    expectedWords: 111,
  },
  {
    id: 'complete-look-balanced',
    expectedDescriptionHash: '0c21f04e60f4ecf8eac6fa0ae3a5418e296c1138d9da75d2b37bbf62fd7567aa',
    expectedWords: 56,
  },
  {
    id: 'canonical-pose-precise',
    expectedDescriptionHash: '94d7b9c2cd35c6ce8942823fb1b13b115bfd5975d54647f08e9cd8bb4406b1e2',
    expectedWords: 95,
  },
  {
    id: 'character-card-hd',
    expectedDescriptionHash: 'e93cc457b295a65f3650074d4f775225f3597c23e778f6923860ff09c44ac5c9',
    expectedWords: 140,
  },
  {
    id: 'duo-balanced',
    expectedDescriptionHash: '2befdc41aa7f5075f14d986a80e7c7e9b1e350d1d06391b130e07d8da2a01cc8',
    expectedWords: 156,
  },
  {
    id: 'fixed-special-creative',
    expectedDescriptionHash: 'becd89ecaf4327317b3c50c0f4adccc1476b15c2e22d4a4770b5f79a157cffab',
    expectedWords: 75,
  },
  {
    id: 'fixed-dress-v81',
    expectedDescriptionHash: '910c4243d6d227ceb18ef501b580b04b2d5d7c31a1e905bd431b70bf8f417061',
    expectedWords: 48,
  },
]);

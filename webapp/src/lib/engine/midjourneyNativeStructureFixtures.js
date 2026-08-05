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
    expectedDescriptionHash: 'a41d2a95f447a01a9e3eb936b8fcf627d7320f0d17c0d1d928ebcac435b03393',
    expectedWords: 93,
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
    expectedDescriptionHash: '8e4d2c6cafeb6f964d4f8f2460038fb50a1ce941edfbaaf29fbc31d3f3e9108c',
    expectedWords: 146,
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

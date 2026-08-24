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
    expectedDescriptionHash: '5ca5f6feac4b3f567d03bf9e3ba719e8df91ad53c3e45ad4619a7cf769a5e2a8',
    expectedWords: 111,
  },
  {
    id: 'complete-look-balanced',
    expectedDescriptionHash: '956597290de038702d6a0fa762813ec023712d025a496e0b66bf08b9d3b9dc6c',
    expectedWords: 70,
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
    expectedDescriptionHash: '46cf0306f75af041990ada379f6f1ec98b8c671baf51fe641346dcea3bb3e331',
    expectedWords: 161,
  },
  {
    id: 'fixed-special-creative',
    expectedDescriptionHash: '67a7d2c05590c3e1399fda8cd657f21871d77c83465b3c220b981f789e1bf68b',
    expectedWords: 87,
  },
  {
    id: 'fixed-dress-v81',
    expectedDescriptionHash: '910c4243d6d227ceb18ef501b580b04b2d5d7c31a1e905bd431b70bf8f417061',
    expectedWords: 48,
  },
]);

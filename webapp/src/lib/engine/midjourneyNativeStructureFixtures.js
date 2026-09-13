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
    expectedDescriptionHash: 'ae27d961563fbba281c95c33a1d55d637d5118d0ac0316230f671719c382b985',
    expectedWords: 114,
  },
  {
    id: 'complete-look-balanced',
    expectedDescriptionHash: '25b7c896cc14c93551dda26329a43d6156a458b2a22de0d3e4e9432744b07323',
    expectedWords: 73,
  },
  {
    id: 'canonical-pose-precise',
    expectedDescriptionHash: 'ad3e1cfca3df9a59d35df5fa5fd42367ab2a4451b5adb4336958fa6383d3fe0a',
    expectedWords: 98,
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

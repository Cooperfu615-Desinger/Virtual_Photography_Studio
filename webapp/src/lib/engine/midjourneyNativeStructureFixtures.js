/**
 * Current Midjourney-native structure targets.
 *
 * Phase 3 adds the Midjourney-native normal-subject lead and removes repeated
 * lower-crop wardrobe boundaries. The canonical parameter tail remains outside
 * the hashed description.
 */
export const MIDJOURNEY_NATIVE_STRUCTURE_FIXTURES = Object.freeze([
  {
    id: 'normal-single-precise',
    expectedDescriptionHash: '32c26bfd9484808a9f930a1338dcbb22880eaa7e20405d1e58791b2acd372444',
    expectedWords: 101,
  },
  {
    id: 'complete-look-balanced',
    expectedDescriptionHash: 'b5583e36cddaf8fb1a93db7a80e75c5ce6ec990c641686e4fa1a6cc6e9ee623a',
    expectedWords: 57,
  },
  {
    id: 'canonical-pose-precise',
    expectedDescriptionHash: '2e7ce1eddae8384d1fdcc1d78e69531fd508d0d8aee47e6ab0589a5007037571',
    expectedWords: 98,
  },
  {
    id: 'character-card-hd',
    expectedDescriptionHash: '13713fde7e18f88b22c98c74b5089b08ebd0addfb7fa1aeaad75b8ad077c2dc8',
    expectedWords: 123,
  },
  {
    id: 'duo-balanced',
    expectedDescriptionHash: '77db41da7c8d0f8dffbab6602d8166a5d285501ee41aa382e81974a834d3f69f',
    expectedWords: 182,
  },
  {
    id: 'fixed-special-creative',
    expectedDescriptionHash: '19ca8ed3670d9506e712f73184c3c6549cd916d0a50312022ff9b1c5c00a3c55',
    expectedWords: 85,
  },
  {
    id: 'fixed-dress-v81',
    expectedDescriptionHash: 'ddfd388a7e9116948c063592967ab4ec6c034570c77a302d71480c4a9f2e0d3f',
    expectedWords: 52,
  },
]);

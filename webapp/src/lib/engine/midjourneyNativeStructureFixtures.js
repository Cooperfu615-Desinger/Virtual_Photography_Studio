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
    expectedDescriptionHash: 'bba048b2eb8588a1efe75359951ad241b481be5049f56e7d181751fabb543a9f',
    expectedWords: 95,
  },
  {
    id: 'complete-look-balanced',
    expectedDescriptionHash: '515e78b0b0e168370692db257fba77a97dc7faa539d9a431ec06cac8632dbb8a',
    expectedWords: 58,
  },
  {
    id: 'canonical-pose-precise',
    expectedDescriptionHash: '9d97788af8548f6897b3ec99ed3265ab501c742f0015865ebcf5fadc40dc91f2',
    expectedWords: 97,
  },
  {
    id: 'character-card-hd',
    expectedDescriptionHash: 'cfba3289fd3ca38df51873c4ab18c9652bcf945a41fb2edda22c1101a06865d5',
    expectedWords: 124,
  },
  {
    id: 'duo-balanced',
    expectedDescriptionHash: '8e4d2c6cafeb6f964d4f8f2460038fb50a1ce941edfbaaf29fbc31d3f3e9108c',
    expectedWords: 146,
  },
  {
    id: 'fixed-special-creative',
    expectedDescriptionHash: '2ec80b532dd1ae1c6380ac08dc40b29d104bf4d77666f966a40f949ad2fbbc7f',
    expectedWords: 77,
  },
  {
    id: 'fixed-dress-v81',
    expectedDescriptionHash: '9952df3eadabf71725e9a8d5f72da9758ef4614cec53df094cd3792f37df1032',
    expectedWords: 50,
  },
]);

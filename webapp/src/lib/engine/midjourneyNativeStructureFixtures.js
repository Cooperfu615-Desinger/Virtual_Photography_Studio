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
    expectedDescriptionHash: '1bcfd9002d1e91a50ffa2d813cb6ae1f9e25fb0827871ab3f893c94a529d0859',
    expectedWords: 92,
  },
  {
    id: 'complete-look-balanced',
    expectedDescriptionHash: '03d6ea982bb7c76d81be194f76c43b959ba0f37d049d023604f624daca88af75',
    expectedWords: 55,
  },
  {
    id: 'canonical-pose-precise',
    expectedDescriptionHash: 'ba681136efdf86db3cb441f51558420c66bd5f0ad8346e3705e15f92d99b50e3',
    expectedWords: 93,
  },
  {
    id: 'character-card-hd',
    expectedDescriptionHash: '511fedb11f40cb6c2cd0ba4a99496a6b623744e01cd5fa3278871b3374277758',
    expectedWords: 120,
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

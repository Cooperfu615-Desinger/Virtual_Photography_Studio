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
    expectedDescriptionHash: '2ff91c2810fe2ea7bfe2f0ed3df4d63153b8920b61b28561e6ccf7e2b7d03779',
    expectedWords: 98,
  },
  {
    id: 'complete-look-balanced',
    expectedDescriptionHash: '27d202c7e820d9681ee96f158f065a9891c016931333da42bec06528ff345041',
    expectedWords: 56,
  },
  {
    id: 'canonical-pose-precise',
    expectedDescriptionHash: '216c391dc7bc618a1e40cfaf2aa0beddae176d1f8cc6fe9798fde790c5149f85',
    expectedWords: 97,
  },
  {
    id: 'character-card-hd',
    expectedDescriptionHash: '511fedb11f40cb6c2cd0ba4a99496a6b623744e01cd5fa3278871b3374277758',
    expectedWords: 120,
  },
  {
    id: 'duo-balanced',
    expectedDescriptionHash: '867409b4519f05ecef9e4f87456f85303936e53f1d0d1318e43878f07ec23baf',
    expectedWords: 179,
  },
  {
    id: 'fixed-special-creative',
    expectedDescriptionHash: '76aac9542697c39fc97724b2c04416439d89e5bbfad233ad6719d10154b2b497',
    expectedWords: 84,
  },
  {
    id: 'fixed-dress-v81',
    expectedDescriptionHash: '01fadd3ecbc49b44e23dceeb21ef003ef3c6d84c33053fcb0d9dfcce348b4da7',
    expectedWords: 51,
  },
]);

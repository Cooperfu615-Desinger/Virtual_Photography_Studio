/**
 * Phase-5 Midjourney-native structure targets.
 *
 * These hashes preserve every phase-4 descriptive token and its order while
 * collapsing paragraph separators into one Midjourney text-prompt block. The
 * canonical parameter tail remains outside the hashed description.
 */
export const MIDJOURNEY_NATIVE_STRUCTURE_FIXTURES = Object.freeze([
  {
    id: 'normal-single-precise',
    expectedDescriptionHash: '44e7c98a51c86a76b47cddabc38e18f002243355044fc548cd75e760a8151ed8',
    expectedWords: 103,
  },
  {
    id: 'complete-look-balanced',
    expectedDescriptionHash: '7ee670ac1a91dbc92bee7bffc19df8ef75681d9fd1a137e97cd623d8dfbcb115',
    expectedWords: 59,
  },
  {
    id: 'canonical-pose-precise',
    expectedDescriptionHash: 'd19d7c45867a078942c3ed92bd8edf50f57b5a8dbd9623bad63184a2b8c36b31',
    expectedWords: 100,
  },
  {
    id: 'character-card-hd',
    expectedDescriptionHash: 'c417d967b9d6fda0295caabbeffb4e1f05df828fcaca61016989f69b34a8e16b',
    expectedWords: 125,
  },
  {
    id: 'duo-balanced',
    expectedDescriptionHash: 'eb903a148200e9c0caec8aed0adee70d1ae6393dc2ae69199ee08213afcd94f2',
    expectedWords: 184,
  },
  {
    id: 'fixed-special-creative',
    expectedDescriptionHash: 'c481a9d601903e9f6a81f2a41b6df4df0066effe38913324a463cc8268c2c325',
    expectedWords: 87,
  },
  {
    id: 'fixed-dress-v81',
    expectedDescriptionHash: 'cf5cadcf8a925f1f0a70bf12cfe14bcc49188c00466f3cd1984b16c5101aa8e5',
    expectedWords: 54,
  },
]);

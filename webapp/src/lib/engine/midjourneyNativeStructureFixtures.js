/**
 * Current Midjourney-native structure targets.
 *
 * Phase 2 of the description optimization replaces the imperative image-type
 * opening and adds the composition-to-subject sentence boundary. The canonical
 * parameter tail remains outside the hashed description.
 */
export const MIDJOURNEY_NATIVE_STRUCTURE_FIXTURES = Object.freeze([
  {
    id: 'normal-single-precise',
    expectedDescriptionHash: 'fe5e1bc07ac6e7ea7ba21d04c4ab7f33e002330a0e824ed98200da018a922722',
    expectedWords: 101,
  },
  {
    id: 'complete-look-balanced',
    expectedDescriptionHash: 'f1584acded9eb5aefa6eaff67faf9a83a3d724cf1a1681aaba7fc2b55b58c3e5',
    expectedWords: 57,
  },
  {
    id: 'canonical-pose-precise',
    expectedDescriptionHash: '7423b5ca695b91e88e20b2337df49a0444c2a15b44cef4f0c14c1ea082ec53bf',
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
    expectedDescriptionHash: 'ffce0700a504aef15367a8576bc1b9970632687a5bd12856013e5db3e9bc4337',
    expectedWords: 85,
  },
  {
    id: 'fixed-dress-v81',
    expectedDescriptionHash: 'f5cddb3a29259b15400aefacd260d823175a52e07d40bd30d07bc67144eb84e1',
    expectedWords: 52,
  },
]);

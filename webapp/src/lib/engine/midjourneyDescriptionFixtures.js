export const MIDJOURNEY_DESCRIPTION_FIXTURES = Object.freeze([
  {
    id: 'normal-single-precise',
    mode: 'single',
    coverage: ['normal', 'body-type', 'separates'],
    phase1DescriptionHash: '44e7c98a51c86a76b47cddabc38e18f002243355044fc548cd75e760a8151ed8',
    phase2Opening: 'Photorealistic editorial portrait.',
  },
  {
    id: 'complete-look-balanced',
    mode: 'single',
    coverage: ['complete-look', 'outfit-preset'],
    phase1DescriptionHash: '7ee670ac1a91dbc92bee7bffc19df8ef75681d9fd1a137e97cd623d8dfbcb115',
    phase2Opening: 'Photorealistic editorial portrait.',
  },
  {
    id: 'canonical-pose-precise',
    mode: 'single',
    coverage: ['pose-composer', 'canonical-pose'],
    phase1DescriptionHash: 'd19d7c45867a078942c3ed92bd8edf50f57b5a8dbd9623bad63184a2b8c36b31',
    phase2Opening: 'Photorealistic editorial portrait.',
  },
  {
    id: 'character-card-hd',
    mode: 'single',
    coverage: ['character-card', 'permanent-identity'],
    phase1DescriptionHash: 'c417d967b9d6fda0295caabbeffb4e1f05df828fcaca61016989f69b34a8e16b',
    phase2Opening: 'Photorealistic editorial portrait.',
  },
  {
    id: 'duo-balanced',
    mode: 'duo',
    coverage: ['duo', 'role-bound-wardrobe'],
    phase1DescriptionHash: 'eb903a148200e9c0caec8aed0adee70d1ae6393dc2ae69199ee08213afcd94f2',
    phase2Opening: 'Photorealistic editorial portrait.',
  },
  {
    id: 'fixed-special-creative',
    mode: 'single',
    coverage: ['fixed-composition', 'special-outfit'],
    phase1DescriptionHash: 'c481a9d601903e9f6a81f2a41b6df4df0066effe38913324a463cc8268c2c325',
    phase2Opening: 'Photorealistic editorial portrait.',
  },
  {
    id: 'fixed-dress-v81',
    mode: 'single',
    coverage: ['fixed-composition', 'dress', 'v8.1'],
    phase1DescriptionHash: 'cf5cadcf8a925f1f0a70bf12cfe14bcc49188c00466f3cd1984b16c5101aa8e5',
    phase2Opening: 'Photorealistic editorial portrait.',
  },
]);

export const MIDJOURNEY_IMAGE_TYPE_OPENING_FIXTURES = Object.freeze([
  { id: 'photorealistic-photo', expected: 'Photorealistic editorial portrait.' },
  { id: 'fashion-advertising', expected: 'Premium fashion advertising image.' },
  { id: 'watercolor-illustration', expected: 'Watercolor portrait illustration.' },
  { id: 'oil-painting', expected: 'Oil painting portrait.' },
  { id: 'fashion-illustration', expected: 'Fashion illustration.' },
  { id: 'pastel-illustration', expected: 'Pastel illustration portrait.' },
]);

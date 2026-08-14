/**
 * Descriptive baselines and parameter-tail expectations.
 * Each entry reuses a representative prompt fixture and records the approved
 * public-output hashes. Midjourney-tail changes must preserve Gpt, Z-Image,
 * and the contract-owned AI descriptive content unless that renderer has an
 * independently approved prompt-profile revision.
 */
export const MIDJOURNEY_PARAMETER_FIXTURES = Object.freeze([
  {
    id: 'normal-single-precise',
    sourceFixtureId: 'normal-single',
    coverage: ['single', 'normal-wardrobe', 'body-type'],
    aspectRatio: '4:5',
    futureSettings: {
      mjVersionId: 'v8-2',
      mjAspectRatio: '4:5',
      mjRawMode: 'raw',
      mjStylize: 25,
      mjChaos: 0,
      mjWeirdness: 0,
      mjResolution: 'sd',
    },
    expectedTail: '--v 8.2 --ar 4:5 --raw --s 25 --c 0 --w 0 --sd',
    baselineHashes: {
      grokPrompt: '866a27d645131c12a906508297d2424dd202e81dc3623d84d46183b2b2774222',
      zImagePrompt: 'b3ebdfc6282c1df65676cbfc905d48c73db7e42e09cc18b39d38cbabff6fe12b',
      midjourneyPrompt: 'b7ad4a56858af63a43ec6e1e43ac3af77b6bd2d640d079c038b1014786ea6414',
    },
  },
  {
    id: 'complete-look-balanced',
    sourceFixtureId: 'latex-mirror-catsuit-outfit-preset',
    coverage: ['single', 'outfit-preset', 'complete-look'],
    aspectRatio: '9:16',
    futureSettings: {
      mjVersionId: 'v8-2',
      mjAspectRatio: '9:16',
      mjRawMode: 'standard',
      mjStylize: 100,
      mjChaos: 0,
      mjWeirdness: 0,
      mjResolution: 'hd',
    },
    expectedTail: '--v 8.2 --ar 9:16 --s 100 --c 0 --w 0 --hd',
    baselineHashes: {
      grokPrompt: '1a3f761ba9ca8e78a8f9e70bf4b593f77b43f37f2f676b3c6bd1a6d4fa0bfad6',
      zImagePrompt: '6dfa1221a015f8a7d42dda80d5e55ed3941b1952cc398f0a7c60b90a2d0aa688',
      midjourneyPrompt: '0c21f04e60f4ecf8eac6fa0ae3a5418e296c1138d9da75d2b37bbf62fd7567aa',
    },
  },
  {
    id: 'canonical-pose-precise',
    sourceFixtureId: 'pose-composer-canonical',
    coverage: ['single', 'canonical-pose'],
    aspectRatio: '4:5',
    futureSettings: {
      mjVersionId: 'v8-2',
      mjAspectRatio: '4:5',
      mjRawMode: 'raw',
      mjStylize: 50,
      mjChaos: 0,
      mjWeirdness: 0,
      mjResolution: 'sd',
    },
    expectedTail: '--v 8.2 --ar 4:5 --raw --s 50 --c 0 --w 0 --sd',
    baselineHashes: {
      grokPrompt: 'e91a70cfbe6c6ffa387983774dfcd9c0d0822baf83f813f34f4bd91c0cb24546',
      zImagePrompt: 'adc9cc125b8d1292ec5e6c583fd28f855d9046389c0c1e3073b391a8a7cfeafe',
      midjourneyPrompt: '94d7b9c2cd35c6ce8942823fb1b13b115bfd5975d54647f08e9cd8bb4406b1e2',
    },
  },
  {
    id: 'character-card-hd',
    sourceFixtureId: 'character-card',
    coverage: ['single', 'character-card'],
    aspectRatio: '4:5',
    futureSettings: {
      mjVersionId: 'v8-2',
      mjAspectRatio: '4:5',
      mjRawMode: 'raw',
      mjStylize: 50,
      mjChaos: 0,
      mjWeirdness: 0,
      mjResolution: 'hd',
    },
    expectedTail: '--v 8.2 --ar 4:5 --raw --s 50 --c 0 --w 0 --hd',
    baselineHashes: {
      grokPrompt: 'f4ec7b29b9817b3d847e8ef82b3cf8048cbe3ba6800b92ec4305fb655a22560f',
      zImagePrompt: '813fb10fb8b13454011d624d5fff34f242dbf98c49d84e7c19170b58b5dc9192',
      midjourneyPrompt: 'e93cc457b295a65f3650074d4f775225f3597c23e778f6923860ff09c44ac5c9',
    },
  },
  {
    id: 'duo-balanced',
    sourceFixtureId: 'duo',
    coverage: ['duo', 'role-bound-wardrobe'],
    aspectRatio: '3:4',
    futureSettings: {
      mjVersionId: 'v8-2',
      mjAspectRatio: '3:4',
      mjRawMode: 'standard',
      mjStylize: 100,
      mjChaos: 0,
      mjWeirdness: 0,
      mjResolution: 'sd',
    },
    expectedTail: '--v 8.2 --ar 3:4 --s 100 --c 0 --w 0 --sd',
    baselineHashes: {
      grokPrompt: 'eb5497bec6944a8bfede182c4eb085bcd47cd10793ffede8f4264d3bf262dff0',
      zImagePrompt: '391d4a0efbd66374e57acffa90be14932e90fc51791e452aed5dbd5ca63b7736',
      midjourneyPrompt: '2befdc41aa7f5075f14d986a80e7c7e9b1e350d1d06391b130e07d8da2a01cc8',
    },
  },
  {
    id: 'fixed-special-creative',
    sourceFixtureId: 'fixed-composition-special-outfit',
    coverage: ['single', 'fixed-composition', 'special-outfit'],
    aspectRatio: '4:5',
    futureSettings: {
      mjVersionId: 'v8-2',
      mjAspectRatio: '4:5',
      mjRawMode: 'standard',
      mjStylize: 250,
      mjChaos: 10,
      mjWeirdness: 0,
      mjResolution: 'hd',
    },
    expectedTail: '--v 8.2 --ar 4:5 --s 250 --c 10 --w 0 --hd',
    baselineHashes: {
      grokPrompt: '2d32cf368fe02d53b64c8c658a2a16d6cd0ff0c8f229721fc80a541331eba636',
      zImagePrompt: '31d4d1ad85264d485744c0ab8120f55beb1b51babdfab27d108920335f57a7a2',
      midjourneyPrompt: 'becd89ecaf4327317b3c50c0f4adccc1476b15c2e22d4a4770b5f79a157cffab',
    },
  },
  {
    id: 'fixed-dress-v81',
    sourceFixtureId: 'fixed-composition-dress',
    coverage: ['single', 'fixed-composition', 'dress', 'v8.1-compatibility'],
    aspectRatio: '9:16',
    futureSettings: {
      mjVersionId: 'v8-1',
      mjAspectRatio: '9:16',
      mjRawMode: 'standard',
      mjStylize: 100,
      mjChaos: 0,
      mjWeirdness: 0,
      mjResolution: 'sd',
    },
    expectedTail: '--v 8.1 --ar 9:16 --s 100 --c 0 --w 0 --sd',
    baselineHashes: {
      grokPrompt: '3b67486c4de5fa719b5e591547f1f3693da5be215bd5a699de2c4e2fdfd3ce96',
      zImagePrompt: '86cddf60cad71c2f992336672a761e4201ef659d37636a7356973372c3241fc9',
      midjourneyPrompt: '910c4243d6d227ceb18ef501b580b04b2d5d7c31a1e905bd431b70bf8f417061',
    },
  },
]);

export const MIDJOURNEY_ASPECT_RATIO_FIXTURES = Object.freeze([
  {
    id: 'independent-ai-ratio',
    page1AspectRatio: '4:5',
    mjAspectRatio: '1:1',
    expectedTail: '--v 8.2 --ar 1:1 --raw --s 25 --c 0 --w 0 --sd',
  },
  {
    id: 'ultrawide-ai-ratio',
    page1AspectRatio: '4:5',
    mjAspectRatio: '21:9',
    expectedTail: '--v 8.2 --ar 21:9 --raw --s 25 --c 0 --w 0 --sd',
  },
  {
    id: 'tall-ai-ratio',
    page1AspectRatio: '4:5',
    mjAspectRatio: '1:2',
    expectedTail: '--v 8.2 --ar 1:2 --raw --s 25 --c 0 --w 0 --sd',
  },
]);

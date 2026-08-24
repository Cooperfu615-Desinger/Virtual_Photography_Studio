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
      grokPrompt: 'c866ef75205a86b7f1a74fab63c6172bb0a9b9a06a844f5cb133ffefedd81730',
      zImagePrompt: '52a916e847252f78f8e4fb7a3224b36ba4c19819fa37dc1102f8a24f2948c8a8',
      midjourneyPrompt: '5ca5f6feac4b3f567d03bf9e3ba719e8df91ad53c3e45ad4619a7cf769a5e2a8',
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
      midjourneyPrompt: '956597290de038702d6a0fa762813ec023712d025a496e0b66bf08b9d3b9dc6c',
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
      midjourneyPrompt: '46cf0306f75af041990ada379f6f1ec98b8c671baf51fe641346dcea3bb3e331',
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
      midjourneyPrompt: '67a7d2c05590c3e1399fda8cd657f21871d77c83465b3c220b981f789e1bf68b',
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

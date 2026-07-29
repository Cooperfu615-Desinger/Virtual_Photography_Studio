/**
 * Phase-1 descriptive baselines and phase-4 parameter-tail expectations.
 * Each entry reuses a representative prompt fixture and records the original
 * public-output hashes before the tail existed. Phase 4 must preserve those
 * content hashes after stripping the contract-owned Midjourney tail.
 */
export const MIDJOURNEY_PARAMETER_FIXTURES = Object.freeze([
  {
    id: 'normal-single-precise',
    sourceFixtureId: 'normal-single',
    coverage: ['single', 'normal-wardrobe', 'body-type'],
    aspectRatio: '4:5',
    futureSettings: {
      mjVersionId: 'v8-2',
      mjRawMode: 'raw',
      mjStylize: 25,
      mjChaos: 0,
      mjWeirdness: 0,
      mjResolution: 'sd',
    },
    expectedTail: '--v 8.2 --ar 4:5 --raw --s 25 --c 0 --w 0 --sd',
    baselineHashes: {
      grokPrompt: 'fbc1ae5e942a98f69ba1fa92ac6306902d04ed820cfbe85a5c31a8b40aaec57d',
      zImagePrompt: 'ed0c0e4fd7295c604562ef385bcbcc78a0a82f14e72829479f47bacdfdbe89be',
      midjourneyPrompt: '0822fcb1633229020d07ce8d562ce3aca68aa4cb04c383378ced73b07113e18e',
    },
  },
  {
    id: 'complete-look-balanced',
    sourceFixtureId: 'latex-mirror-catsuit-outfit-preset',
    coverage: ['single', 'outfit-preset', 'complete-look'],
    aspectRatio: '9:16',
    futureSettings: {
      mjVersionId: 'v8-2',
      mjRawMode: 'standard',
      mjStylize: 100,
      mjChaos: 0,
      mjWeirdness: 0,
      mjResolution: 'hd',
    },
    expectedTail: '--v 8.2 --ar 9:16 --s 100 --c 0 --w 0 --hd',
    baselineHashes: {
      grokPrompt: '1a3f761ba9ca8e78a8f9e70bf4b593f77b43f37f2f676b3c6bd1a6d4fa0bfad6',
      zImagePrompt: 'f7da240c395edb28f6f9570489ff2f493db58012560a2959b8a7f23e9fd11ef6',
      midjourneyPrompt: '27ab498ce73079a8f8181c5e7aa6f33315adbef43424449a104f0f590ef5d71a',
    },
  },
  {
    id: 'canonical-pose-precise',
    sourceFixtureId: 'pose-composer-canonical',
    coverage: ['single', 'canonical-pose'],
    aspectRatio: '4:5',
    futureSettings: {
      mjVersionId: 'v8-2',
      mjRawMode: 'raw',
      mjStylize: 50,
      mjChaos: 0,
      mjWeirdness: 0,
      mjResolution: 'sd',
    },
    expectedTail: '--v 8.2 --ar 4:5 --raw --s 50 --c 0 --w 0 --sd',
    baselineHashes: {
      grokPrompt: 'e91a70cfbe6c6ffa387983774dfcd9c0d0822baf83f813f34f4bd91c0cb24546',
      zImagePrompt: '8d0550e4fcfad9be2fcb2ba14ec5a689176c0b4b1a78772b1d9159616e2ab230',
      midjourneyPrompt: '806acf0da437c1d321036fccf35acc058d4f34ad2b4b9a6ec641175e5cf113ed',
    },
  },
  {
    id: 'character-card-hd',
    sourceFixtureId: 'character-card',
    coverage: ['single', 'character-card'],
    aspectRatio: '4:5',
    futureSettings: {
      mjVersionId: 'v8-2',
      mjRawMode: 'raw',
      mjStylize: 50,
      mjChaos: 0,
      mjWeirdness: 0,
      mjResolution: 'hd',
    },
    expectedTail: '--v 8.2 --ar 4:5 --raw --s 50 --c 0 --w 0 --hd',
    baselineHashes: {
      grokPrompt: 'f4ec7b29b9817b3d847e8ef82b3cf8048cbe3ba6800b92ec4305fb655a22560f',
      zImagePrompt: '7f5dcbfffb7eeb6f4b32bad542ade303ccade8acf23f29f73a1bf45f86f8b178',
      midjourneyPrompt: 'd3b4e56451f4132e47858250c3dea49a9542d62ec3f2d7087db56027ed0fe674',
    },
  },
  {
    id: 'duo-balanced',
    sourceFixtureId: 'duo',
    coverage: ['duo', 'role-bound-wardrobe'],
    aspectRatio: '3:4',
    futureSettings: {
      mjVersionId: 'v8-2',
      mjRawMode: 'standard',
      mjStylize: 100,
      mjChaos: 0,
      mjWeirdness: 0,
      mjResolution: 'sd',
    },
    expectedTail: '--v 8.2 --ar 3:4 --s 100 --c 0 --w 0 --sd',
    baselineHashes: {
      grokPrompt: '480407deb88badbaa25e11f62f2ad50aef69d01b2d12c1cd679b8c9aa1c3f23b',
      zImagePrompt: 'af6dbe7ca43e8995826a8d9cdcd0ea971856e8adc8009d1d415176b334c801c6',
      midjourneyPrompt: 'd31496f0b0bdd811992c0a355f1546901b0306a4d2f0bf5fd83ef970ce99e7ba',
    },
  },
  {
    id: 'fixed-special-creative',
    sourceFixtureId: 'fixed-composition-special-outfit',
    coverage: ['single', 'fixed-composition', 'special-outfit'],
    aspectRatio: '4:5',
    futureSettings: {
      mjVersionId: 'v8-2',
      mjRawMode: 'standard',
      mjStylize: 250,
      mjChaos: 10,
      mjWeirdness: 0,
      mjResolution: 'hd',
    },
    expectedTail: '--v 8.2 --ar 4:5 --s 250 --c 10 --w 0 --hd',
    baselineHashes: {
      grokPrompt: '2d32cf368fe02d53b64c8c658a2a16d6cd0ff0c8f229721fc80a541331eba636',
      zImagePrompt: 'd614ea5a95ea2c1bdf1ac2653f875bdf1dc6931de6c7da3797cbd6bbab14833b',
      midjourneyPrompt: 'dd7735da6b489ba50e2c86fde61030d7356ae7172892763649b170898b4fb0e4',
    },
  },
  {
    id: 'fixed-dress-v81',
    sourceFixtureId: 'fixed-composition-dress',
    coverage: ['single', 'fixed-composition', 'dress', 'v8.1-compatibility'],
    aspectRatio: '9:16',
    futureSettings: {
      mjVersionId: 'v8-1',
      mjRawMode: 'standard',
      mjStylize: 100,
      mjChaos: 0,
      mjWeirdness: 0,
      mjResolution: 'sd',
    },
    expectedTail: '--v 8.1 --ar 9:16 --s 100 --c 0 --w 0 --sd',
    baselineHashes: {
      grokPrompt: '3b67486c4de5fa719b5e591547f1f3693da5be215bd5a699de2c4e2fdfd3ce96',
      zImagePrompt: 'a35e8039443e98f6c596dd047ee7fc9b2ad1b3d8f5b0d4e10a57f172c7f01ee3',
      midjourneyPrompt: '16edaab8bed4c4427bb194458ea63feac14142d6094a870f586920dca527ce11',
    },
  },
]);

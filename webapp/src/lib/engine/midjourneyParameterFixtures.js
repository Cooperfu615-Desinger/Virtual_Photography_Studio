/**
 * Descriptive baselines and parameter-tail expectations.
 * Each entry reuses a representative prompt fixture and records the approved
 * public-output hashes. Midjourney-tail changes must preserve the Z-Image and
 * contract-owned AI descriptive baselines unless those renderers have an
 * independently approved prompt-profile revision. The Gpt baselines track the
 * current GPT output contract and may change with an approved GPT-only update.
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
      grokPrompt: 'd48061e3e0063e38e067abb40989daa71000be91d4f6fb947652f8c14773d885',
      zImagePrompt: 'f2e92a735a4cdd5fd2258afc6e0393dd7189695be372d5bea8a864572e3cfd56',
      midjourneyPrompt: 'ae27d961563fbba281c95c33a1d55d637d5118d0ac0316230f671719c382b985',
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
      grokPrompt: 'ca6cdde4f3a5ad082edebe75dbd18615a8b55b2f4774a41483786ea029958036',
      zImagePrompt: 'fe9474d859073c0f30a59d398a734048808777393dff05e27b6f4f80a089ae17',
      midjourneyPrompt: '25b7c896cc14c93551dda26329a43d6156a458b2a22de0d3e4e9432744b07323',
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
      grokPrompt: '48b701dd79082ea7705697aa3c0e1c4df7c159f35fdaa39c9232abcb104136a0',
      zImagePrompt: '1345418744b7b103e1fb15c92c2b6571267cb896d38343be5efabbe0d3346cbf',
      midjourneyPrompt: 'ad3e1cfca3df9a59d35df5fa5fd42367ab2a4451b5adb4336958fa6383d3fe0a',
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
      grokPrompt: '16bfbcaea4dd8a976f86a20c31dd841d9fa296a2c1e8602cf864247e6447a673',
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
      grokPrompt: 'ca5665b951d50e4e208c434a8d4f22150e8117770c69b859c1a44a3998ce30e4',
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
      grokPrompt: '182ba2b84d35fd31b1f0e46828c5379267805eb9a5298b4f576c60544d196323',
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
      grokPrompt: '583845715e70ccb4d824a1d43794e7195ad35cf29b0454c969ee705a22e9aed6',
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

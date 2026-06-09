import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PAGE3_WORLD_SCENE_FIELD_OPTIONS,
  SPECIAL_SCENE_LOCATIONS,
  WORLD_SCENE_LOCATIONS,
  buildPage3WorldSceneAnchor,
  buildPage3WorldScenePrompt,
  buildPage3WorldSceneSummary,
  buildPage1WorldSceneArchitecture,
} from './page3WorldScene.js';

test('world scene location pack contains ten cities with five anchors each', () => {
  assert.equal(WORLD_SCENE_LOCATIONS.length, 50);

  const counts = WORLD_SCENE_LOCATIONS.reduce((acc, location) => {
    acc[location.city] = (acc[location.city] || 0) + 1;
    return acc;
  }, {});

  assert.deepEqual(counts, {
    Taipei: 5,
    Tokyo: 5,
    Osaka: 5,
    Seoul: 5,
    'Hong Kong': 5,
    Paris: 5,
    London: 5,
    'New York': 5,
    Rome: 5,
    'Los Angeles': 5,
  });
});

test('special scene location pack exposes seven non-city photographic locations', () => {
  assert.equal(SPECIAL_SCENE_LOCATIONS.length, 7);
  assert.deepEqual(
    SPECIAL_SCENE_LOCATIONS.map((location) => location.labelZh),
    [
      '特殊地點｜廢墟：學校',
      '特殊地點｜廢墟：醫院',
      '特殊地點｜廢墟：飯店',
      '特殊地點｜廢墟：都市',
      '特殊地點｜廢墟：遊樂園',
      '特殊地點｜老舊公寓',
      '特殊地點｜日本住宅區巷弄',
    ],
  );
  assert.equal(SPECIAL_SCENE_LOCATIONS.every((location) => location.generic), true);
});

test('special ruin locations emphasize empty photographer-only ruins and heavy decay', () => {
  const ruinLocations = SPECIAL_SCENE_LOCATIONS.filter((location) => location.id.startsWith('special-ruins-'));

  assert.equal(ruinLocations.length, 5);
  for (const location of ruinLocations) {
    const text = [
      location.landmarkCues,
      location.streetPositions,
      location.cityscapePositions,
      location.aerialPositions,
      location.realismGuards,
    ].flat().join(' ');

    assert.match(text, /no visible people/i);
    assert.match(text, /only the photographer/i);
    assert.match(text, /clutter|debris|broken|damaged|collapsed/i);
    assert.match(text, /dirt|grime|stains|dust/i);
    assert.match(text, /overgrown|vegetation|weeds|vines|moss/i);
  }
});

test('Dotonbori street prompt keeps real location anchors and street-photography intent', () => {
  const profile = {
    sceneMode: 'street-only',
    worldLocation: 'osaka-dotonbori-ebisubashi-canal',
    cameraSystem: 'ricoh-gr',
    shootingMethod: 'overexposed-phone',
    focalViewpoint: '28mm-documentary',
    sceneFocus: 'free-framing',
    imagingStyle: 'color-negative-film',
    ambientLight: 'humid-night-reflections',
  };

  const prompt = buildPage3WorldScenePrompt(profile);

  assert.match(prompt, /^This is a documentary street photography work/i);
  assert.match(prompt, /photographer who is good at catching unscripted city moments/i);
  assert.match(prompt, /The photographer uses a Ricoh GR/i);
  assert.match(prompt, /slightly overexposed look/i);
  assert.match(prompt, /28mm documentary street view at pedestrian height/i);
  assert.match(prompt, /Dotonbori canal/i);
  assert.match(prompt, /Ebisubashi Bridge/i);
  assert.match(prompt, /Glico running man billboard/i);
  assert.match(prompt, /giant crab restaurant sign/i);
  assert.match(prompt, /composition may naturally choose one believable focus/i);
  assert.match(prompt, /humid night reflections/i);
  assert.match(prompt, /avoid a postcard-like establishing shot/i);
  assert.doesNotMatch(prompt, /no people, no human subject/i);
});

test('photographer style adds PAGE1-style photographic language to PAGE3 prompts', () => {
  const profile = {
    sceneMode: 'street-only',
    photographerStyle: 'regional:攝影風格:daido-moriyama-森山大道:15',
    worldLocation: 'tokyo-shinjuku-golden-gai',
    cameraSystem: 'ricoh-gr',
    shootingMethod: 'walk-by-snapshot',
    focalViewpoint: '35mm-classic',
    sceneFocus: 'alley-corner-depth',
    imagingStyle: 'documentary-street',
    ambientLight: 'neon-mixed-light',
  };

  const prompt = buildPage3WorldScenePrompt(profile);
  const summary = buildPage3WorldSceneSummary(profile);

  assert.match(prompt, /Daido Moriyama/i);
  assert.match(prompt, /gritty high-contrast monochrome image language/i);
  assert.match(prompt, /light behavior, framing rhythm, color contrast, texture, subject distance, and image atmosphere/i);
  assert.match(summary, /森山大道｜噪訊黑白暗調/);
});

test('photographer style none disables photographer-inspired language', () => {
  const profile = {
    sceneMode: 'street-only',
    photographerStyle: 'style-none',
    worldLocation: 'tokyo-shinjuku-golden-gai',
  };

  const prompt = buildPage3WorldScenePrompt(profile);
  const summary = buildPage3WorldSceneSummary(profile);

  assert.doesNotMatch(prompt, /photographer's visual language/i);
  assert.doesNotMatch(prompt, /Inspired by/i);
  assert.match(summary, /全無/);
});

test('aerial mode uses elevated spatial language and realism guards', () => {
  const profile = {
    sceneMode: 'aerial-high-view',
    worldLocation: 'hong-kong-victoria-harbour-star-ferry',
    cameraSystem: 'drone-camera',
    shootingMethod: 'drone-survey',
    focalViewpoint: 'drone-overhead',
    sceneFocus: 'landmark-fragment',
    imagingStyle: 'commercial-cityscape',
    ambientLight: 'blue-hour-city-glow',
  };

  const prompt = buildPage3WorldScenePrompt(profile);
  const anchor = buildPage3WorldSceneAnchor(profile);
  const summary = buildPage3WorldSceneSummary(profile);

  assert.match(prompt, /^This is an aerial or high-view cityscape photograph/i);
  assert.match(prompt, /photographer focused on spatial layout and city geography/i);
  assert.match(prompt, /shot from a drone in a slow survey pass/i);
  assert.match(prompt, /Victoria Harbour/i);
  assert.match(prompt, /Star Ferry/i);
  assert.match(prompt, /Hong Kong Island skyline/i);
  assert.match(prompt, /recognizable fragment of the landmark/i);
  assert.match(prompt, /avoid generic skyline replacement/i);
  assert.match(anchor, /Hong Kong/);
  assert.match(summary, /香港｜維多利亞港/);
});

test('special location prompt avoids forced world-city context', () => {
  const profile = {
    sceneMode: 'street-only',
    worldLocation: 'tokyo-shinjuku-golden-gai',
    specialLocation: 'special-ruins-hospital',
    cameraSystem: 'smartphone-doc',
    shootingMethod: 'slight-hand-shake',
    focalViewpoint: '35mm-classic',
    sceneFocus: 'free-framing',
    imagingStyle: 'documentary-street',
    ambientLight: 'overcast-daylight',
  };

  const prompt = buildPage3WorldScenePrompt(profile);
  const anchor = buildPage3WorldSceneAnchor(profile);
  const summary = buildPage3WorldSceneSummary(profile);

  assert.match(prompt, /non-specific photographic location/i);
  assert.match(prompt, /abandoned hospital ruins/i);
  assert.match(prompt, /empty hospital ward/i);
  assert.match(prompt, /tiled corridors/i);
  assert.match(prompt, /avoid gore or explicit injury/i);
  assert.match(prompt, /no visible people/i);
  assert.match(prompt, /only the photographer exists behind the camera/i);
  assert.doesNotMatch(prompt, /incidental pedestrians/i);
  assert.doesNotMatch(prompt, /Special Location/);
  assert.doesNotMatch(prompt, /Shinjuku/);
  assert.match(anchor, /Abandoned hospital/);
  assert.match(summary, /特殊地點｜廢墟：醫院/);
  assert.doesNotMatch(summary, /東京/);
});

test('field options expose scene modes and the first city pack locations', () => {
  assert.equal(PAGE3_WORLD_SCENE_FIELD_OPTIONS.sceneMode.length, 5);
  assert.equal(PAGE3_WORLD_SCENE_FIELD_OPTIONS.worldLocation.length, 52);
  assert.equal(PAGE3_WORLD_SCENE_FIELD_OPTIONS.specialLocation.length, 9);
  assert.equal(PAGE3_WORLD_SCENE_FIELD_OPTIONS.photographerStyle.length, 28);
  assert.equal(PAGE3_WORLD_SCENE_FIELD_OPTIONS.shootingMethod.length, 9);
  assert.equal(PAGE3_WORLD_SCENE_FIELD_OPTIONS.sceneFocus.length, 9);
  assert.equal(PAGE3_WORLD_SCENE_FIELD_OPTIONS.sceneMode[1].zh, '全無');
  assert.equal(PAGE3_WORLD_SCENE_FIELD_OPTIONS.sceneMode[2].zh, '街拍：單純場景');
  assert.equal(PAGE3_WORLD_SCENE_FIELD_OPTIONS.cameraSystem[1].zh, '全無');
  assert.equal(PAGE3_WORLD_SCENE_FIELD_OPTIONS.worldLocation[1].zh, '全無');
});

test('PAGE3 profile can be adapted into PAGE1 portrait world-scene architecture', () => {
  const profile = {
    sceneMode: 'street-only',
    worldLocation: 'tokyo-shibuya-scramble-crossing',
    cameraSystem: 'ricoh-gr',
    shootingMethod: 'walk-by-snapshot',
    focalViewpoint: '35mm-classic',
    sceneFocus: 'signs-storefronts',
    imagingStyle: 'documentary-street',
    ambientLight: 'blue-hour-city-glow',
  };

  const architecture = buildPage1WorldSceneArchitecture(profile);

  assert.equal(architecture.label, '東京｜澀谷 Scramble Crossing');
  assert.match(architecture.text, /world-scene architecture for the portrait/i);
  assert.match(architecture.text, /Shibuya Scramble Crossing/i);
  assert.match(architecture.text, /large video billboards/i);
  assert.match(architecture.text, /portrait subject remains the main subject/i);
  assert.match(architecture.text, /visible around and behind the subject/i);
  assert.doesNotMatch(architecture.text, /no deliberate portrait subject/i);
  assert.doesNotMatch(architecture.text, /no deliberate human subject/i);
  assert.doesNotMatch(architecture.text, /no visible people/i);
});

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PAGE3_WORLD_SCENE_FIELD_OPTIONS,
  WORLD_SCENE_LOCATIONS,
  buildPage3WorldSceneAnchor,
  buildPage3WorldScenePrompt,
  buildPage3WorldSceneSummary,
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

test('Dotonbori street prompt keeps real location anchors and street-photography intent', () => {
  const profile = {
    sceneMode: 'street-only',
    worldLocation: 'osaka-dotonbori-ebisubashi-canal',
    cameraSystem: 'ricoh-gr',
    focalViewpoint: '28mm-documentary',
    imagingStyle: 'color-negative-film',
    ambientLight: 'humid-night-reflections',
  };

  const prompt = buildPage3WorldScenePrompt(profile);

  assert.match(prompt, /documentary street photograph/i);
  assert.match(prompt, /Dotonbori canal/i);
  assert.match(prompt, /Ebisubashi Bridge/i);
  assert.match(prompt, /Glico running man billboard/i);
  assert.match(prompt, /giant crab restaurant sign/i);
  assert.match(prompt, /Ricoh GR/i);
  assert.match(prompt, /28mm documentary street view/i);
  assert.match(prompt, /humid night reflections/i);
  assert.doesNotMatch(prompt, /no people, no human subject/i);
});

test('aerial mode uses elevated spatial language and realism guards', () => {
  const profile = {
    sceneMode: 'aerial-high-view',
    worldLocation: 'hong-kong-victoria-harbour-star-ferry',
    cameraSystem: 'drone-camera',
    focalViewpoint: 'drone-overhead',
    imagingStyle: 'commercial-cityscape',
    ambientLight: 'blue-hour-city-glow',
  };

  const prompt = buildPage3WorldScenePrompt(profile);
  const anchor = buildPage3WorldSceneAnchor(profile);
  const summary = buildPage3WorldSceneSummary(profile);

  assert.match(prompt, /drone-like elevated cityscape/i);
  assert.match(prompt, /Victoria Harbour/i);
  assert.match(prompt, /Star Ferry/i);
  assert.match(prompt, /Hong Kong Island skyline/i);
  assert.match(prompt, /avoid generic skyline replacement/i);
  assert.match(anchor, /Hong Kong/);
  assert.match(summary, /香港｜維多利亞港/);
});

test('field options expose scene modes and the first city pack locations', () => {
  assert.equal(PAGE3_WORLD_SCENE_FIELD_OPTIONS.sceneMode.length, 4);
  assert.equal(PAGE3_WORLD_SCENE_FIELD_OPTIONS.worldLocation.length, 51);
  assert.equal(PAGE3_WORLD_SCENE_FIELD_OPTIONS.sceneMode[1].zh, '街拍：單純場景');
});

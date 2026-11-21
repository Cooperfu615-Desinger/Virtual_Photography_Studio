import test from 'node:test';
import assert from 'node:assert/strict';

import { buildPage3SavedCard } from '../features/page3/page3SavedCard.js';
import { deserializeFavoritePrompt, serializeFavoritePrompt } from '../features/saved-cards/cardCodec.js';
import {
  PAGE3_WORLD_SCENE_FIELD_OPTIONS,
  SPECIAL_SCENE_LOCATIONS,
  WORLD_SCENE_LOCATIONS,
  buildPage3WorldSceneAnchor,
  buildPage3WorldScenePrompt,
  buildPage3WorldSceneCinematicPrompt,
  buildPage3WorldSceneWorldPrompt,
  buildPage3WorldSceneSummary,
  buildPage1WorldSceneArchitecture,
} from './page3WorldScene.js';

const sceneBuilders = [
  buildPage3WorldScenePrompt,
  buildPage3WorldSceneCinematicPrompt,
  buildPage3WorldSceneWorldPrompt,
];

const pilotLocations = [
  {
    field: 'worldLocation', id: 'hallstatt-lakeside-village-overlook', label: /Hallstatt.*湖畔山村/,
    landmark: /Hallstatt/i, ground: [/railing/i, /lake|Hallst[aä]tter See/i, /spire|steeple/i], high: [/lake|Hallst[aä]tter See/i, /mountain/i],
  },
  {
    field: 'specialLocation', id: 'special-forest-trail', label: /森林步道/,
    landmark: /forest|woodland/i, ground: [/moss/i, /roots?/i, /leaves|leaf litter/i], high: [/trail|path/i, /trees?|canopy|woodland/i],
  },
  {
    field: 'specialLocation', id: 'special-japanese-washitsu', label: /日式和室/,
    landmark: /washitsu/i, ground: [/tatami/i, /shoji/i, /low table/i], high: [/tatami/i, /shoji/i],
  },
  {
    field: 'specialLocation', id: 'special-ruins-cement-factory', label: /水泥工廠/,
    landmark: /cement (?:factory|plant|works)/i, ground: [/conveyor/i, /dust/i], high: [/mixer|mixing|industrial|machinery|conveyor/i],
  },
];

const worldAdditions = [
  {
    id: 'tokyo-meguro-river-cherry-tunnel', label: /目黑川.*櫻花/,
    landmark: /Meguro River/i, ground: [/railing/i, /cherry/i, /river/i], high: [/canopy|branches|blossoms/i, /bank|channel/i],
  },
  {
    id: 'hong-kong-hing-kee-claypot-rice-arcade', label: /興記.*煲仔飯/,
    landmark: /Hing Kee/i, ground: [/sign/i, /threshold|entrance/i, /tile/i], high: [/arcade|awning|frontage/i],
  },
  {
    id: 'london-brick-lane-poster-corner', label: /Brick Lane.*海報/,
    landmark: /Brick Lane/i, ground: [/poster|flyer/i, /brick/i, /alley|lane/i], high: [/corner|mouth|entrance|junction/i],
  },
];

const specialAdditions = [
  {
    id: 'special-lakeside-boardwalk', label: /湖邊木棧道/,
    landmark: /lake/i, ground: [/planks?/i, /rail/i, /water|lake/i], high: [/boardwalk|deck|planks?/i, /shore|bank|water/i],
  },
  {
    id: 'special-clear-bay-rocky-shore', label: /清澈海灣岩岸/,
    landmark: /cove|bay/i, ground: [/rocks?|stones?/i, /clear|transparent|turquoise/i], high: [/shore|inlet|cove/i, /rock|cliff/i],
  },
  {
    id: 'special-wind-rippled-dunes', label: /沙丘.*風痕/,
    landmark: /dune/i, ground: [/sand/i, /ripple/i], high: [/crest|ridge/i],
  },
  {
    id: 'special-dry-salt-lake', label: /白色鹽湖.*乾裂/,
    landmark: /salt/i, ground: [/crack|fissure/i, /polygon/i], high: [/basin|playa|flat/i],
  },
  {
    id: 'special-boutique-hotel-room', label: /精品飯店房間/,
    landmark: /hotel (?:guest )?room/i, ground: [/bed/i, /sheet|linen/i, /headboard/i], high: [/bed/i, /floor|curtain|table/i],
  },
  {
    id: 'special-japanese-classroom', label: /日本學校教室/,
    landmark: /classroom/i, ground: [/blackboard|chalkboard/i, /wooden desks?/i], high: [/desks?/i],
  },
  {
    id: 'special-secondhand-bookshop', label: /古書.*二手書店/,
    landmark: /book ?shop|book ?store/i, ground: [/book/i, /shel(?:ves|f|ving)/i], high: [/aisle|table|stack/i],
  },
  {
    id: 'special-japanese-lawson-interior', label: /Lawson.*便利商店/,
    landmark: /Lawson/i, ground: [/blue[- ]and[- ]white/i, /onigiri/i, /refrigerat|chill/i], high: [/shel(?:ves|f|ving)|aisle/i],
  },
  {
    id: 'special-self-service-laundry', label: /洗衣店/,
    landmark: /laundr(?:y|omat|ette)/i, ground: [/washer|washing machine/i, /round|chrome/i], high: [/washer|machine/i],
  },
];

const newLocations = [
  ...pilotLocations,
  ...worldAdditions.map(place => ({ ...place, field: 'worldLocation' })),
  ...specialAdditions.map(place => ({ ...place, field: 'specialLocation' })),
];

for (const { field, id, label, landmark, ground, high } of newLocations) {
  test(`${id} keeps its own framing, occupancy and saved selection in all three prompts`, () => {
    const option = PAGE3_WORLD_SCENE_FIELD_OPTIONS[field].find(item => item.id === id);
    assert.ok(option, `missing ${id} from ${field}`);
    assert.match(option.zh, label);
    const profile = { [field]: id, cameraSystem: 'sony-full-frame', ambientLight: 'overcast-daylight' };
    const imported = { source: 'prompt-workbench', text: 'An adult woman in a green coat.' };
    const places = field === 'worldLocation' ? WORLD_SCENE_LOCATIONS : SPECIAL_SCENE_LOCATIONS;
    const location = places.find(place => place.id === id);
    const positions = {
      'street-only': location.streetPositions[0],
      cityscape: location.cityscapePositions[0],
      'aerial-high-view': location.aerialPositions[0],
    };
    assert.equal(new Set(Object.values(positions)).size, 3, id);
    for (const sceneMode of [...Object.keys(positions), 'none', '']) {
      const selected = { ...profile, sceneMode };
      const prompts = sceneBuilders.map(build => build(selected));
      assert.equal(new Set(prompts).size, 3);
      for (const [index, prompt] of prompts.entries()) {
        assert.match(prompt, landmark);
        assert.match(prompt, /Sony full-frame/i);
        assert.match(prompt, /overcast daylight/i);
        assert.doesNotMatch(prompt, /bridges, roads, waterways|lived-in urban layout|incidental pedestrians and traffic/i);
        if (positions[sceneMode]) assert.ok(prompt.toLowerCase().includes(positions[sceneMode].toLowerCase()), sceneMode);
        const cues = sceneMode === 'street-only' ? ground : sceneMode === 'aerial-high-view' ? high : [];
        for (const cue of cues) assert.match(prompt, cue);
        const build = sceneBuilders[index];
        assert.equal(build({ ...selected, person: { source: 'none' } }), prompt);
        if (field === 'worldLocation' && sceneMode === 'street-only') {
          assert.match(prompt, /passersby|pedestrians|walkers|visitors/i);
          assert.doesNotMatch(prompt, /no visible people/i);
        } else {
          assert.match(prompt, /no (?:visible people|people)|unoccupied/i);
        }
        const withPerson = build({ ...selected, person: imported });
        assert.ok(withPerson.includes(imported.text));
        assert.doesNotMatch(withPerson, /no (?:visible people|deliberate (?:human|portrait) subject)|unoccupied/i);
        if (field === 'specialLocation') assert.match(withPerson, /no other people/i);
      }
    }

    const selected = { ...profile, sceneMode: 'street-only' };
    const summary = buildPage3WorldSceneSummary(selected);
    const anchor = buildPage3WorldSceneAnchor(selected);
    const prompts = sceneBuilders.map(build => build(selected));
    assert.match(summary, label);
    assert.match(anchor, landmark);
    const architecture = buildPage1WorldSceneArchitecture(selected);
    assert.match(architecture.label, label);
    assert.match(architecture.text, landmark);
    assert.doesNotMatch(architecture.text, /no visible people|no deliberate portrait subject/i);
    for (const build of sceneBuilders) {
      const locationOnly = build({ [field]: id });
      assert.match(locationOnly, landmark);
      assert.match(locationOnly, /no visible people/i);
    }
    const saved = buildPage3SavedCard(selected, summary, anchor, ...prompts);
    const restored = deserializeFavoritePrompt(serializeFavoritePrompt(saved));
    assert.deepEqual(restored.profile, selected);
    assert.deepEqual([restored.midjourneyPrompt, restored.grokPrompt, restored.zImagePrompt], prompts);
  });
}

test('indoor high views stay in the selected building when drone and street options are selected', () => {
  const interiors = newLocations.filter(({ id }) => [
    'special-japanese-washitsu', 'special-ruins-cement-factory', 'special-boutique-hotel-room',
    'special-japanese-classroom', 'special-secondhand-bookshop', 'special-japanese-lawson-interior', 'special-self-service-laundry',
  ].includes(id));
  for (const { id: specialLocation, landmark } of interiors) {
    const profile = {
      specialLocation, sceneMode: 'aerial-high-view', cameraSystem: 'drone-camera',
      shootingMethod: 'drone-survey', focalViewpoint: 'drone-overhead', sceneFocus: 'signs-storefronts',
    };
    for (const build of sceneBuilders) {
      const prompt = build(profile);
      assert.match(prompt, /high|elevated|downward|looking down|overhead|from above/i);
      assert.doesNotMatch(prompt, /from a drone|drone camera|storefront|skyline|cityscape|rooftops|shop lights|awnings/i);
    }
    const architecture = buildPage1WorldSceneArchitecture(profile);
    assert.match(architecture.text, /portrait subject/i);
    assert.match(architecture.text, landmark);
    assert.doesNotMatch(architecture.text, /no visible people|only the photographer|from a drone|drone camera|storefront|skyline|rooftops/i);
  }
});

test('all seven scene focus options frame a distinct local detail at each added location', () => {
  const focuses = PAGE3_WORLD_SCENE_FIELD_OPTIONS.sceneFocus.filter(option => option.id && option.id !== 'none');
  for (const { field, id } of newLocations) {
    for (const build of sceneBuilders) {
      const prompts = focuses.map(({ id: sceneFocus }) => build({ [field]: id, sceneMode: 'street-only', sceneFocus }));
      assert.equal(new Set(prompts).size, 7, id);
      for (const [index, prompt] of prompts.entries()) {
        assert.ok(!prompt.toLowerCase().includes(focuses[index].en.toLowerCase()), id);
        if (pilotLocations.some(place => place.id === id)) {
          assert.doesNotMatch(prompt, /stacked signs|storefronts|curb edges|shop lights|street fragments|vertical urban layers/i);
        }
      }
    }
  }
});

test('reflective conditions keep the salt basin and dune surfaces dry', () => {
  for (const specialLocation of ['special-wind-rippled-dunes', 'special-dry-salt-lake']) {
    for (const ambientLight of ['rainy-reflections', 'humid-night-reflections']) {
      for (const sceneFocus of ['windows-reflections', 'ground-rain-texture']) {
        for (const build of sceneBuilders) {
          const prompt = build({ specialLocation, sceneMode: 'aerial-high-view', ambientLight, sceneFocus });
          assert.match(prompt, /dry|arid|parched/i);
          assert.doesNotMatch(prompt, /rain-wet|wet (?:sand|crust|surface|ground)|reflecting pool|mirrored (?:lake|water)|puddles?|shallow water/i);
        }
      }
    }
  }
});

test('high-view camera choices stay at the river, covered storefront or alley mouth', () => {
  const views = [
    ['tokyo-meguro-river-cherry-tunnel', /bridge|bank/i, /cherry|blossom/i],
    ['hong-kong-hing-kee-claypot-rice-arcade', /arcade|covered/i, /threshold|entrance|frontage/i],
    ['london-brick-lane-poster-corner', /alley|corner/i, /poster|flyer/i],
  ];
  for (const [worldLocation, viewpoint, anchor] of views) {
    const profile = { worldLocation, sceneMode: 'aerial-high-view', cameraSystem: 'drone-camera',
      shootingMethod: 'drone-survey', focalViewpoint: 'drone-overhead' };
    for (const build of sceneBuilders) {
      const prompt = build(profile);
      assert.match(prompt, viewpoint);
      assert.match(prompt, anchor);
      assert.doesNotMatch(prompt, /over the city|rooftops below|skyline relationships|from a drone in a slow survey/i);
    }
  }
});

test('a raised camera only includes a skyline or patch of sky when visible from the selected angle', () => {
  for (const { field, id } of newLocations.slice(pilotLocations.length)) {
    for (const sceneMode of ['street-only', 'aerial-high-view']) {
      const profile = { [field]: id, sceneMode, focalViewpoint: 'drone-overhead', sceneFocus: 'sky-building-slice' };
      for (const build of sceneBuilders) {
        const prompt = build(profile);
        const skySentences = prompt.split('.').filter(sentence => /\b(?:sky|skyline|horizon)\b/i.test(sentence));
        for (const sentence of skySentences) assert.match(sentence, /where visible|if visible|when visible|any sky visible/i, id);
        assert.doesNotMatch(prompt, /against the ceiling/i, id);
      }
    }
  }
});

test('one laundromat offers the washer, folding table, detergent shelf and waiting chair as views', () => {
  const views = PAGE3_WORLD_SCENE_FIELD_OPTIONS.sceneFocus.map(({ id: sceneFocus }) => buildPage3WorldScenePrompt({
    specialLocation: 'special-self-service-laundry', sceneMode: 'street-only', sceneFocus,
  })).join('\n');
  for (const detail of [/washer|washing machine/i, /folding table/i, /detergent/i, /chair/i]) assert.match(views, detail);
});

test('Meguro keeps the flowering bank in view when cool or hazy lighting is selected', () => {
  for (const [ambientLight, light] of [['soft-winter-daylight', /cool|soft/i], ['hazy-summer-heat', /haze|hazy/i]]) {
    for (const build of sceneBuilders) {
      const prompt = build({ worldLocation: 'tokyo-meguro-river-cherry-tunnel', sceneMode: 'cityscape', ambientLight });
      assert.match(prompt, /one (?:side|bank)|near bank/i);
      assert.match(prompt, /blossom|in bloom|flowering/i);
      assert.match(prompt, light);
      assert.doesNotMatch(prompt, /bare (?:trees|branches)|snow-covered|summer foliage/i);
    }
  }
});

test('indoor window shots preserve a visible foreground layer and the space within the building', () => {
  for (const [specialLocation, foreground] of [
    ['special-japanese-washitsu', /shoji.*(?:foreground|lattice|screen)/i],
    ['special-ruins-cement-factory', /(?:glass|pane|window)/i],
    ['special-boutique-hotel-room', /glass|pane|window/i],
    ['special-japanese-classroom', /glass|pane|window/i],
    ['special-secondhand-bookshop', /glass|pane|window/i],
    ['special-japanese-lawson-interior', /glass|pane|window/i],
    ['special-self-service-laundry', /glass|pane|window/i],
  ]) {
    for (const build of sceneBuilders) {
      for (const sceneMode of ['cityscape', 'aerial-high-view']) {
        const prompt = build({ specialLocation, sceneMode, shootingMethod: 'through-window' });
        assert.match(prompt, foreground);
        assert.doesNotMatch(prompt, /interior-exterior depth|street fragments|from outside|from the street/i);
      }
    }
  }
});

test('all three PAGE3 outputs retain the reviewed Taipei street capture and empty-scene rules', () => {
  const profile = {
    sceneMode: 'street-only',
    worldLocation: 'taipei-xinyi-taipei101-street-corner',
    cameraSystem: 'leica-m',
    focalViewpoint: '35mm-classic',
    shootingMethod: 'through-window',
    imagingStyle: 'color-negative-film',
    ambientLight: 'overcast-daylight',
  };
  const prompts = sceneBuilders.map(build => build(profile));
  assert.equal(new Set(prompts).size, 3);
  for (const prompt of prompts) {
    for (const cue of [
      /Xinyi/i, /Taipei 101/i, /commercial facades/i, /wide crosswalks/i,
      /Leica M/i, /35mm/i, /glass with reflections, glare, and layered interior-exterior depth/i,
      /color negative film grain/i, /overcast daylight/i, /editorial photography mood/i,
      /incidental pedestrians and traffic/i, /no deliberate portrait subject/i,
      /not oversized/i, /avoid Hong Kong-like harbor skyline/i,
    ]) assert.match(prompt, cue);
    assert.doesNotMatch(prompt, /the photographer uses|the shooting method is|within the Xinyi district context/i);
    assert.ok(prompt.split(/\s+/).length < 150);
  }
});

test('all three Xiangshan high-view prompts make bridges and waterways conditional', () => {
  for (const build of sceneBuilders) {
    const prompt = build({
      sceneMode: 'aerial-high-view',
      worldLocation: 'taipei-xiangshan-city-night-overlook',
      focalViewpoint: 'elevated-wide',
      cameraSystem: 'sony-full-frame',
      ambientLight: 'blue-hour-city-glow',
    });
    assert.match(prompt, /bridges and waterways where visible from the overlook/i);
    assert.match(prompt, /centered in Xinyi skyline/i);
    assert.match(prompt, /avoid drone-only impossible angle/i);
    assert.match(prompt, /Sony full-frame mirrorless camera/i);
    assert.match(prompt, /blue hour city glow/i);
  }
});

test('all ruin modes keep strict visible occupancy restrictions and location-specific guards', () => {
  for (const location of SPECIAL_SCENE_LOCATIONS.filter(item => item.id.startsWith('special-ruins-'))) {
    for (const sceneMode of ['street-only', 'cityscape', 'aerial-high-view', 'none', '']) {
      for (const build of sceneBuilders) {
        const prompt = build({ sceneMode, specialLocation: location.id });
        assert.match(prompt, /\bno visible people\b/i);
        assert.doesNotMatch(prompt, /incidental pedestrians|no deliberate (?:portrait|human) subject|only the photographer exists/i);
        for (const guard of location.realismGuards.slice(1)) assert.ok(prompt.toLowerCase().includes(guard));
        if (location.id === 'special-ruins-city') assert.match(prompt, /no visible people or traffic crowds/i);
      }
    }
  }
});

test('world locations keep the original cities and Hallstatt, and append the three new street scenes', () => {
  assert.equal(WORLD_SCENE_LOCATIONS.length, 54);
  assert.equal(WORLD_SCENE_LOCATIONS[50].id, 'hallstatt-lakeside-village-overlook');
  assert.deepEqual(WORLD_SCENE_LOCATIONS.slice(51).map(place => place.id), worldAdditions.map(place => place.id));

  const counts = WORLD_SCENE_LOCATIONS.reduce((acc, location) => {
    acc[location.city] = (acc[location.city] || 0) + 1;
    return acc;
  }, {});

  assert.deepEqual(counts, {
    Taipei: 5,
    Tokyo: 6,
    Osaka: 5,
    Seoul: 5,
    'Hong Kong': 6,
    Paris: 5,
    London: 6,
    'New York': 5,
    Rome: 5,
    'Los Angeles': 5,
    Hallstatt: 1,
  });
});

test('special scene locations preserve their original order and append the new nature and interior settings', () => {
  assert.equal(SPECIAL_SCENE_LOCATIONS.length, 19);
  assert.deepEqual(
    SPECIAL_SCENE_LOCATIONS.slice(0, 7).map((location) => location.labelZh),
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
  assert.deepEqual(SPECIAL_SCENE_LOCATIONS.slice(7).map(item => item.id), [
    'special-forest-trail', 'special-japanese-washitsu', 'special-ruins-cement-factory',
    ...specialAdditions.map(place => place.id),
  ]);
  assert.equal(SPECIAL_SCENE_LOCATIONS.every((location) => location.generic), true);
});

test('original overgrown ruins emphasize empty photographer-only scenes and heavy decay', () => {
  const ruinLocations = SPECIAL_SCENE_LOCATIONS.slice(0, 7).filter((location) => location.id.startsWith('special-ruins-'));

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

  assert.match(prompt, /^unscripted documentary street photograph/i);
  assert.match(prompt, /from pedestrian distance/i);
  assert.match(prompt, /Ricoh GR compact street camera/i);
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
  assert.match(prompt, /rough focus, heavy grain, harsh blacks/i);
  assert.doesNotMatch(prompt, /shaping the light behavior/i);
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

  assert.match(prompt, /^high-view cityscape photograph/i);
  assert.match(prompt, /spatial layout and geography are dominant/i);
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

  assert.match(prompt, /abandoned hospital ruins/i);
  assert.match(prompt, /empty hospital ward/i);
  assert.match(prompt, /tiled corridors/i);
  assert.match(prompt, /avoid gore or explicit injury/i);
  assert.match(prompt, /no visible people/i);
  assert.doesNotMatch(prompt, /only the photographer exists behind the camera/i);
  assert.doesNotMatch(prompt, /incidental pedestrians/i);
  assert.doesNotMatch(prompt, /Special Location/);
  assert.doesNotMatch(prompt, /Shinjuku/);
  assert.match(anchor, /Abandoned hospital/);
  assert.match(summary, /特殊地點｜廢墟：醫院/);
  assert.doesNotMatch(summary, /東京/);
});

test('field options expose scene modes and the first city pack locations', () => {
  assert.equal(PAGE3_WORLD_SCENE_FIELD_OPTIONS.sceneMode.length, 5);
  assert.equal(PAGE3_WORLD_SCENE_FIELD_OPTIONS.worldLocation.length, 56);
  assert.equal(PAGE3_WORLD_SCENE_FIELD_OPTIONS.specialLocation.length, 21);
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

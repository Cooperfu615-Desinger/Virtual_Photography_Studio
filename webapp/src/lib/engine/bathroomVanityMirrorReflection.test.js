import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createEmptyLocks,
  generatePrompts,
  getLockControls,
} from '../engine.js';
import {
  BATHROOM_VANITY_LOCATION_ID,
  BATHROOM_VANITY_LOCATION_ZH,
  BATHROOM_VANITY_MIRROR_TEXT,
  buildBathroomVanityMirrorReflectionText,
} from './bathroomVanityMirrorReflection.js';

const controls = getLockControls();

function optionId(key, zh) {
  const option = controls.find((control) => control.key === key)?.options?.find((entry) => entry.zh === zh);
  assert.ok(option, `${key} cannot resolve ${zh}`);
  return option.id;
}

function createAllNoneLocks() {
  const locks = { ...createEmptyLocks() };
  for (const control of controls) {
    // Keep the original fixture inputs; new silence options are covered separately.
    if (/^(bodyType|hairStylingState)[AB]?Id$|^outerwear[AB]?OpeningId$|^eyewear[AB]?PlacementId$|^sceneAttributeId$/.test(control.key)) continue;
    const none = control.options?.find((entry) => entry.zh === '全無' || entry.zh === '無額外表情');
    if (none) locks[control.key] = none.id;
  }
  locks.subjectCount = '1';
  locks.specialSubjectId = 'none';
  locks.characterProfileId = 'none';
  locks.fixedCompositionSetId = 'none';
  locks.locationId = BATHROOM_VANITY_LOCATION_ID;
  locks.framingId = optionId('framingId', '中景鏡頭 (Medium Shot)');
  locks.angleId = optionId('angleId', '平視高度鏡頭');
  return locks;
}

function generateBathroomPrompt(orbitZh = '正面 0 度', overrides = {}) {
  const locks = {
    ...createAllNoneLocks(),
    orbitId: optionId('orbitId', orbitZh),
    ...overrides,
  };
  return generatePrompts(1, locks, [], { random: () => 0.2 })[0];
}

function count(text, fragment) {
  return text.split(fragment).length - 1;
}

test('bathroom vanity source stays open-ended while retaining the mirror anchor', () => {
  const locationControl = controls.find((control) => control.key === 'locationId');
  const location = locationControl.options.find((entry) => entry.id === BATHROOM_VANITY_LOCATION_ID);
  assert.equal(location?.zh, BATHROOM_VANITY_LOCATION_ZH);
  assert.match(location?.en || '', /frequently used and lived-in bathroom vanity/i);
  assert.match(location?.en || '', /large wall-mounted mirror above the sink/i);
  assert.doesNotMatch(location?.en || '', /toiletry|tiled wall|faucet|cabinet|condensation/i);
  assert.match(location?.desc || '', /其餘日常浴室細節由模型自然補足/);
});

test('mirror prompt uses one garment-neutral reflection and post-shower description for every orbit', () => {
  const front = generateBathroomPrompt('正面 0 度');
  const rear = generateBathroomPrompt('背面 180 度');
  const side = generateBathroomPrompt('左側 90 度');

  for (const field of ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt']) {
    for (const prompt of [front, rear, side]) {
      assert.equal(count(prompt[field], BATHROOM_VANITY_MIRROR_TEXT), 1, `${field} one shared mirror block`);
      assert.match(prompt[field], /large wall-mounted mirror above the sink/i);
      assert.match(prompt[field], /reflection shows her front when her back faces the camera/i);
      assert.match(prompt[field], /her back when her front faces the camera/i);
      assert.match(prompt[field], /skin and hair are damp/i);
      assert.match(prompt[field], /clothing looks visibly soaked while retaining its original sheerness and coverage/i);
      assert.match(prompt[field], /full mirror frame whenever the selected crop allows/i);
    }
  }
});

test('mirror block is posture-neutral and works with a selected sitting pose', () => {
  const sitting = generateBathroomPrompt('背面 180 度', {
    poseBaseId: 'sitting',
    poseArrangementId: optionId('poseArrangementId', '自然坐姿'),
  });
  assert.match(sitting.zImagePrompt, /seated upper-body posture/i);
  assert.match(sitting.zImagePrompt, new RegExp(BATHROOM_VANITY_MIRROR_TEXT.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(BATHROOM_VANITY_MIRROR_TEXT, /\bstanding\b|\bstands\b/i);
});

test('side and unassigned orbits retain the same generic mirror description', () => {
  const side = generateBathroomPrompt('左側 90 度');
  const unassigned = generateBathroomPrompt('全無');
  for (const field of ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt']) {
    assert.equal(count(side[field], BATHROOM_VANITY_MIRROR_TEXT), 1, `${field} side reflection`);
    assert.equal(count(unassigned[field], BATHROOM_VANITY_MIRROR_TEXT), 1, `${field} generic reflection`);
  }
});

test('ordinary chest crops inherit mirror identity while full-body references remain independent', () => {
  const prompt = generateBathroomPrompt('正面 0 度');
  for (const entry of prompt.extraPrompts) {
    if (['chest-up-portrait', 'chest-up-mj-portrait'].includes(entry.id)) {
      assert.match(entry.text, /mirror clearly reflects the same woman/);
    } else {
      assert.doesNotMatch(entry.text, /mirror clearly reflects the same woman/);
    }
  }

  const special = generateBathroomPrompt('正面 0 度', { specialSubjectId: 'skeleton' });
  for (const field of ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt']) {
    assert.doesNotMatch(special[field], /mirror clearly reflects the same woman/);
  }
});

test('reflection helper ignores unrelated locations without changing their prompts', () => {
  const otherLocation = controls.find((control) => control.key === 'locationId')?.options?.find(
    (entry) => entry.zh === '室內：古書二手書店',
  );
  assert.ok(otherLocation);
  assert.equal(buildBathroomVanityMirrorReflectionText({ location: otherLocation, orbit: { zh: '正面 0 度' } }), '');
});

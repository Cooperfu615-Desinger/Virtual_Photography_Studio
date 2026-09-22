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

test('bathroom vanity source keeps a full mirror, readable condensation, and post-shower humidity', () => {
  const locationControl = controls.find((control) => control.key === 'locationId');
  const location = locationControl.options.find((entry) => entry.id === BATHROOM_VANITY_LOCATION_ID);
  assert.equal(location?.zh, BATHROOM_VANITY_LOCATION_ZH);
  assert.match(location?.en || '', /slightly humid post-shower bathroom vanity/);
  assert.match(location?.en || '', /full wall-mounted mirror/);
  assert.match(location?.en || '', /sparse edge condensation with a clear central reflection/);
});

test('front and rear orbit directions describe the same person on the opposite side of the mirror', () => {
  const front = generateBathroomPrompt('正面 0 度');
  const rear = generateBathroomPrompt('背面 180 度');

  for (const field of ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt']) {
    assert.equal(count(front[field], 'The full mirror behind her accurately reflects the back of the same woman.'), 1, `${field} front reflection`);
    assert.equal(count(rear[field], 'The full mirror behind her accurately reflects the front of the same woman.'), 1, `${field} rear reflection`);
    assert.doesNotMatch(front[field], /The full mirror behind her accurately reflects the front of the same woman\./, `${field} front side`);
    assert.doesNotMatch(rear[field], /The full mirror behind her accurately reflects the back of the same woman\./, `${field} rear side`);
    assert.match(front[field], /full wall-mounted mirror/i);
    assert.match(front[field], /sparse edge condensation/);
  }
});

test('side and unassigned orbits retain a coherent single-person reflection sentence', () => {
  const side = generateBathroomPrompt('左側 90 度');
  const unassigned = generateBathroomPrompt('全無');
  for (const field of ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt']) {
    assert.equal(count(side[field], 'The full mirror behind her accurately reflects the same woman in a consistent side profile.'), 1, `${field} side reflection`);
    assert.equal(count(unassigned[field], 'The full mirror behind her accurately reflects the same woman.'), 1, `${field} generic reflection`);
  }
  assert.match(side.zImagePrompt, /consistent side profile/);
});

test('ordinary chest crops inherit mirror identity while full-body references remain independent', () => {
  const prompt = generateBathroomPrompt('正面 0 度');
  for (const entry of prompt.extraPrompts) {
    if (entry.id === 'full-body-character') assert.doesNotMatch(entry.text, /The full mirror behind her accurately reflects/);
    else assert.match(entry.text, /The full mirror behind her accurately reflects/);
  }

  const special = generateBathroomPrompt('正面 0 度', { specialSubjectId: 'skeleton' });
  for (const field of ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt']) {
    assert.doesNotMatch(special[field], /The full mirror behind her accurately reflects/);
  }
});

test('reflection helper ignores unrelated locations without changing their prompts', () => {
  const otherLocation = controls.find((control) => control.key === 'locationId')?.options?.find(
    (entry) => entry.zh === '室內：古書二手書店',
  );
  assert.ok(otherLocation);
  assert.equal(buildBathroomVanityMirrorReflectionText({ location: otherLocation, orbit: { zh: '正面 0 度' } }), '');
});

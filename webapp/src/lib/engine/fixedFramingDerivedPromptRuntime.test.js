import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createEmptyLocks,
  createSeededRandom,
  generatePrompts,
  getLockControls,
} from '../engine.js';
import { FIXED_FRAMING_DERIVED_PROMPT_FIXTURES } from './fixedFramingDerivedPromptFixtures.js';

const controls = getLockControls();
const controlsByKey = new Map(controls.map((control) => [control.key, control]));

function optionId(key, selector, fixtureId) {
  if (key === 'subjectCount' || key === 'characterProfileId') return selector;
  const control = controlsByKey.get(key);
  assert.ok(control, `${fixtureId}: missing control ${key}`);
  const option = typeof selector === 'object' && selector?.byZh
    ? control.options.find((entry) => entry.zh === selector.byZh)
    : control.options.find((entry) => entry.id === selector);
  assert.ok(option, `${fixtureId}: cannot resolve ${key} ${JSON.stringify(selector)}`);
  return option.id;
}

function createAllNoneLocks() {
  const locks = { ...createEmptyLocks() };
  for (const control of controls) {
    const noneOption = control.options?.find((entry) => entry.zh === '全無');
    if (noneOption) locks[control.key] = noneOption.id;
  }
  return locks;
}

function generateFixture(id) {
  const fixture = FIXED_FRAMING_DERIVED_PROMPT_FIXTURES.find((entry) => entry.id === id);
  assert.ok(fixture, id);
  const locks = createAllNoneLocks();
  for (const [key, selector] of Object.entries(fixture.locks)) {
    locks[key] = optionId(key, selector, fixture.id);
  }
  const [prompt] = generatePrompts(1, locks, [], {
    random: createSeededRandom(fixture.seed),
  });
  return { fixture, locks, prompt };
}

function extraText(prompt, id) {
  return prompt.extraPrompts.find((entry) => entry.id === id)?.text || '';
}

function assertIncludes(text, fragment, message) {
  assert.equal(text.toLowerCase().includes(fragment.toLowerCase()), true, message || fragment);
}

function assertExcludes(text, fragment, message) {
  assert.equal(text.toLowerCase().includes(fragment.toLowerCase()), false, message || fragment);
}

test('phase-3 single runtime emits the two fixed-framing outputs from the same preserved selections', () => {
  for (const fixture of FIXED_FRAMING_DERIVED_PROMPT_FIXTURES.filter((entry) => entry.locks.subjectCount === '1')) {
    const { locks, prompt } = generateFixture(fixture.id);
    assert.deepEqual(
      prompt.extraPrompts.map((entry) => entry.id),
      ['facial-closeup-portrait', 'chest-up-portrait', 'full-body-character'],
      fixture.id,
    );
    assert.ok(extraText(prompt, 'facial-closeup-portrait'), `${fixture.id}: face output`);
    assert.ok(extraText(prompt, 'chest-up-portrait'), `${fixture.id}: chest output`);
    for (const key of fixture.expected.preserveRawLockKeys || []) {
      assert.equal(prompt.selection[key], locks[key], `${fixture.id}: preserve ${key}`);
    }
  }
});

test('phase-3 facial output keeps upper garments and face identity while omitting body, pose, and lower wardrobe', () => {
  const special = extraText(generateFixture('face-special-outfit-visible-neckline').prompt, 'facial-closeup-portrait');
  assertIncludes(special, 'Face-dominant close-up');
  assertIncludes(special, 'burgundy plaid handkerchief camisole');
  assertIncludes(special, 'large silver hoop earrings');
  assertIncludes(special, 'silver flower pendant necklace');
  assertExcludes(special, 'low-rise blue denim mini skirt');
  assertExcludes(special, 'black knee-high leather boots');
  assertExcludes(special, 'Pose and Composition:');
  assertExcludes(special, 'Body Type:');

  const dress = extraText(generateFixture('face-dress-neckline-source').prompt, 'facial-closeup-portrait');
  assertIncludes(dress, 'off-shoulder gothic dress');
  assertIncludes(dress, 'off-shoulder neckline');
  assertExcludes(dress, 'short hem');

  const fallback = extraText(generateFixture('face-no-upper-garment-positive-fallback').prompt, 'facial-closeup-portrait');
  assertIncludes(fallback, 'a simple opaque crew-neck top');
  assertExcludes(fallback, 'guard');
  assertExcludes(fallback, 'nude');
});

test('phase-3 Character Card facial output preserves permanent face anchors and an upper outfit source', () => {
  const face = extraText(generateFixture('face-character-card-identity-and-outfit').prompt, 'facial-closeup-portrait');

  for (const anchor of [
    'long angular oval face',
    'elongated deep brown almond eyes',
    'long straight nose with a high narrow bridge',
    'medium-full muted coral-beige lips',
    'Permanent identity anchors',
    'sleek natural black shoulder-length blunt bob hair',
    'black leather biker jacket',
    'fitted white graffiti-print cropped tank',
  ]) {
    assertIncludes(face, anchor);
  }
  assertExcludes(face, 'Body:');
  assertExcludes(face, 'black high-rise leather skinny pants');
  assertExcludes(face, 'black lace-up combat boots');
});

test('phase-3 chest output uses the projected canonical upper-body pose and compact source scene', () => {
  const chest = extraText(generateFixture('chest-up-normal-separates-pose-scene-imaging').prompt, 'chest-up-portrait');

  assertIncludes(chest, 'Chest-up portrait');
  assertIncludes(chest, 'full bust');
  assertIncludes(chest, 'cotton camisole top');
  assertExcludes(chest, 'straight-leg jeans');
  assertIncludes(chest, 'head slightly tilted');
  assertIncludes(chest, 'one hand touching the chin');
  assertIncludes(chest, 'one shoulder and the upper back resting against an existing vertical surface');
  assertIncludes(chest, 'British vintage window-side room interior');
  assertIncludes(chest, 'Inspired by Orie Ichihashi');
  assertIncludes(chest, 'shot on 85mm short telephoto portrait lens');
});

test('phase-3 derived outputs retain fixed-set anchors without the conflicting fixed camera distance', () => {
  const { prompt } = generateFixture('chest-up-fixed-composition-scene-source');
  for (const id of ['facial-closeup-portrait', 'chest-up-portrait']) {
    const text = extraText(prompt, id);
    assertIncludes(text, 'warm ivory limewash');
    assertIncludes(text, 'black velvet sofa');
    assertIncludes(text, 'low industrial coffee table');
    assertExcludes(text, '3 to 4 meters');
    assertExcludes(text, 'medium-wide editorial camera position');
    assertExcludes(text, 'Fixed Set Integrity');
  }
});

test('phase-3 facial output replaces only its incompatible rear orbit and duo stays unsupported', () => {
  const { prompt, locks } = generateFixture('face-rear-orbit-derived-view-fallback');
  const face = extraText(prompt, 'facial-closeup-portrait');

  assertIncludes(face, 'front view');
  assertExcludes(face, 'back view');
  assertExcludes(face, 'rear view');
  assert.equal(prompt.selection.orbitId, locks.orbitId);

  const duo = generateFixture('duo-fixed-framing-outputs-absent').prompt;
  assert.deepEqual(duo.extraPrompts, []);
});

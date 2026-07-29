import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';

import {
  createEmptyLocks,
  createSeededRandom,
  generatePrompts,
  getLockControls,
} from '../engine.js';
import {
  MIDJOURNEY_DESCRIPTION_CONTRACT,
  MIDJOURNEY_DESCRIPTION_CONTRACT_VERSION,
} from './midjourneyDescriptionContract.js';
import {
  MIDJOURNEY_DESCRIPTION_FIXTURES,
  MIDJOURNEY_IMAGE_TYPE_OPENING_FIXTURES,
} from './midjourneyDescriptionFixtures.js';
import { MIDJOURNEY_PARAMETER_FIXTURES } from './midjourneyParameterFixtures.js';
import { stripMidjourneyParameterTail } from './midjourneyParameterTail.js';
import { REPRESENTATIVE_PROMPT_FIXTURES } from './representativePromptFixtures.js';

const controls = getLockControls();

function hashPrompt(value) {
  return createHash('sha256').update(value).digest('hex');
}

function createAllNoneLocks() {
  const locks = { ...createEmptyLocks() };
  for (const control of controls) {
    const noneOption = control.options?.find((entry) => entry.zh === '全無');
    if (noneOption) locks[control.key] = noneOption.id;
  }
  return locks;
}

function resolveLock(key, selector, fixtureId) {
  if (typeof selector === 'string' || Array.isArray(selector)) return selector;
  const control = controls.find((entry) => entry.key === key);
  const option = control?.options?.find((entry) => entry.zh === selector?.byZh);
  assert.ok(option, `${fixtureId}.${key} cannot resolve ${selector?.byZh}`);
  return option.id;
}

function generateFixture(target) {
  const parameterFixture = MIDJOURNEY_PARAMETER_FIXTURES.find((fixture) => fixture.id === target.id);
  const sourceFixture = REPRESENTATIVE_PROMPT_FIXTURES.find(
    (fixture) => fixture.id === parameterFixture?.sourceFixtureId
  );
  assert.ok(parameterFixture, `${target.id}: parameter fixture`);
  assert.ok(sourceFixture, `${target.id}: representative fixture`);

  const locks = {
    ...createAllNoneLocks(),
    ...parameterFixture.futureSettings,
    aspectRatio: parameterFixture.aspectRatio,
  };
  for (const [key, selector] of Object.entries(sourceFixture.locks)) {
    locks[key] = resolveLock(key, selector, sourceFixture.id);
  }

  return generatePrompts(1, locks, [], {
    random: createSeededRandom(sourceFixture.seed),
  })[0];
}

test('Midjourney description contract freezes the approved six-phase target', () => {
  assert.equal(MIDJOURNEY_DESCRIPTION_CONTRACT_VERSION, '1.3.0');
  assert.ok(Object.isFrozen(MIDJOURNEY_DESCRIPTION_CONTRACT));
  assert.deepEqual(MIDJOURNEY_DESCRIPTION_CONTRACT.applicability.affectsOnly, ['midjourneyPrompt']);
  assert.deepEqual(MIDJOURNEY_DESCRIPTION_CONTRACT.structure.sectionOrder, [
    'imageType',
    'composition',
    'subject',
    'wardrobe',
    'projectedCanonicalPose',
    'sceneAndLighting',
    'imaging',
  ]);
  assert.equal(MIDJOURNEY_DESCRIPTION_CONTRACT.sourceIntegrity.exactCanonicalPoseReuse, true);
  assert.equal(MIDJOURNEY_DESCRIPTION_CONTRACT.structure.imperativeOpening.current, 'forbidden');
  assert.equal(MIDJOURNEY_DESCRIPTION_CONTRACT.rollout.phase1.behaviorNeutral, true);
  assert.equal(MIDJOURNEY_DESCRIPTION_CONTRACT.rollout.phase2.behaviorNeutral, false);
});

test('phase-1 targets cover every image type and representative compatibility mode', () => {
  assert.deepEqual(
    Object.keys(MIDJOURNEY_DESCRIPTION_CONTRACT.imageTypeOpenings),
    MIDJOURNEY_IMAGE_TYPE_OPENING_FIXTURES.map((fixture) => fixture.id)
  );
  for (const fixture of MIDJOURNEY_IMAGE_TYPE_OPENING_FIXTURES) {
    assert.equal(
      MIDJOURNEY_DESCRIPTION_CONTRACT.imageTypeOpenings[fixture.id],
      fixture.expected,
      fixture.id
    );
  }

  const coverage = new Set(MIDJOURNEY_DESCRIPTION_FIXTURES.flatMap((fixture) => fixture.coverage));
  for (const required of [
    'normal',
    'body-type',
    'complete-look',
    'pose-composer',
    'character-card',
    'duo',
    'fixed-composition',
    'special-outfit',
    'dress',
  ]) {
    assert.ok(coverage.has(required), required);
  }
});

test('phase 4 freezes the direct pose, scene, lighting, and imaging structure', () => {
  for (const target of MIDJOURNEY_DESCRIPTION_FIXTURES) {
    const prompt = generateFixture(target);
    const description = stripMidjourneyParameterTail(prompt.midjourneyPrompt);

    assert.match(target.phase1DescriptionHash, /^[a-f0-9]{64}$/, `${target.id}: legacy baseline`);
    assert.match(target.phase2DescriptionHash, /^[a-f0-9]{64}$/, `${target.id}: phase 2`);
    assert.match(target.phase3DescriptionHash, /^[a-f0-9]{64}$/, `${target.id}: phase 3`);
    assert.equal(hashPrompt(description), target.phase4DescriptionHash, `${target.id}: phase 4`);
    assert.ok(description.startsWith(target.phase2Opening), `${target.id}: direct opening`);
    assert.doesNotMatch(description, /^Create an? /, `${target.id}: no imperative opening`);
  }
});

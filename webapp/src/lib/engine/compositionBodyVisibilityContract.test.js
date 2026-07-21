import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getLockControls } from '../engine.js';
import { CHARACTER_PROFILE_OPTIONS } from './characterProfiles.js';
import {
  COMPOSITION_VISIBILITY_CONTRACT,
  FRAMING_VISIBILITY_BUCKET_BY_ZH,
} from './compositionVisibilityContract.js';
import {
  BODY_VISIBILITY_PHASE4_INTEGRATION_MATRIX,
  BODY_TYPE_VISIBILITY_PROFILES,
  COMPOSITION_BODY_VISIBILITY_REGRESSION_FIXTURES,
  COMPOSITION_BODY_VISIBILITY_ZONES,
  EXPECTED_BODY_VISIBILITY_POLICY_BY_BUCKET,
} from './compositionBodyVisibilityFixtures.js';

const controlsByKey = new Map(getLockControls().map((control) => [control.key, control]));
const bodyTypeControl = controlsByKey.get('bodyTypeId');

test('phase-1 body visibility policy records the approved progressive crop zones', () => {
  assert.deepEqual(COMPOSITION_BODY_VISIBILITY_ZONES, [
    'chest',
    'torso',
    'waist',
    'abdomen',
    'hips',
  ]);

  assert.deepEqual(EXPECTED_BODY_VISIBILITY_POLICY_BY_BUCKET.faceDetail, { mode: 'omit', zones: [] });
  assert.deepEqual(EXPECTED_BODY_VISIBILITY_POLICY_BY_BUCKET.headShoulders, { mode: 'omit', zones: [] });
  assert.deepEqual(EXPECTED_BODY_VISIBILITY_POLICY_BY_BUCKET.chestUp, {
    mode: 'visibleZones',
    zones: ['chest'],
  });
  assert.deepEqual(EXPECTED_BODY_VISIBILITY_POLICY_BY_BUCKET.mediumWaist, {
    mode: 'visibleZones',
    zones: ['chest', 'torso', 'waist', 'abdomen'],
  });
  assert.deepEqual(EXPECTED_BODY_VISIBILITY_POLICY_BY_BUCKET.cowboyKnee, {
    mode: 'visibleZones',
    zones: ['chest', 'torso', 'waist', 'abdomen', 'hips'],
  });

  for (const bucket of ['fullBody', 'unconstrained', 'fixedComposition']) {
    assert.deepEqual(EXPECTED_BODY_VISIBILITY_POLICY_BY_BUCKET[bucket], {
      mode: 'fullSource',
      zones: ['all'],
    });
  }

  for (const [bucket, expectedBodyPolicy] of Object.entries(EXPECTED_BODY_VISIBILITY_POLICY_BY_BUCKET)) {
    assert.deepEqual(COMPOSITION_VISIBILITY_CONTRACT[bucket]?.body, expectedBodyPolicy, `${bucket}: runtime policy`);
  }
});

test('phase-1 body profiles cover every public Body Type and retain the canonical full source', () => {
  assert.ok(bodyTypeControl);
  assert.deepEqual(
    BODY_TYPE_VISIBILITY_PROFILES.map((profile) => profile.bodyTypeZh),
    bodyTypeControl.options.map((option) => option.zh)
  );

  for (const profile of BODY_TYPE_VISIBILITY_PROFILES) {
    const sourceOption = bodyTypeControl.options.find((option) => option.zh === profile.bodyTypeZh);
    assert.ok(sourceOption, profile.bodyTypeZh);
    assert.equal(profile.fullSource, sourceOption.en, `${profile.bodyTypeZh}: full source must stay canonical`);
    assert.equal(profile.expectedTextByBucket.faceDetail, '', `${profile.bodyTypeZh}: face detail`);
    assert.equal(profile.expectedTextByBucket.headShoulders, '', `${profile.bodyTypeZh}: head shoulders`);
    assert.equal(profile.expectedTextByBucket.fullBody, profile.fullSource, `${profile.bodyTypeZh}: full body`);
    assert.equal(profile.expectedTextByBucket.unconstrained, profile.fullSource, `${profile.bodyTypeZh}: unconstrained`);
    assert.equal(profile.expectedTextByBucket.fixedComposition, profile.fullSource, `${profile.bodyTypeZh}: fixed composition`);
  }
});

test('phase-1 partial body profiles exclude regions that are outside each crop', () => {
  const chestForbidden = /\b(?:visual height|visual weight|body proportion anchor|torso-to-leg|waist|abdomen|hips?|legs?|cup-scale)\b/i;
  const mediumForbidden = /\b(?:visual height|visual weight|body proportion anchor|torso-to-leg|hips?|legs?|cup-scale)\b/i;
  const cowboyForbidden = /\b(?:visual height|visual weight|torso-to-leg|long legs?|long limbs?|cup-scale)\b/i;

  for (const profile of BODY_TYPE_VISIBILITY_PROFILES) {
    assert.notEqual(profile.expectedTextByBucket.chestUp, '', `${profile.bodyTypeZh}: chest-up source`);
    assert.notEqual(profile.expectedTextByBucket.mediumWaist, '', `${profile.bodyTypeZh}: medium source`);
    assert.notEqual(profile.expectedTextByBucket.cowboyKnee, '', `${profile.bodyTypeZh}: cowboy source`);
    assert.doesNotMatch(profile.expectedTextByBucket.chestUp, chestForbidden, `${profile.bodyTypeZh}: chest-up boundary`);
    assert.doesNotMatch(profile.expectedTextByBucket.mediumWaist, mediumForbidden, `${profile.bodyTypeZh}: medium boundary`);
    assert.doesNotMatch(profile.expectedTextByBucket.cowboyKnee, cowboyForbidden, `${profile.bodyTypeZh}: cowboy boundary`);
  }
});

test('phase-1 body fixtures resolve public controls and cover compatibility sources', () => {
  const ids = new Set();
  const coverage = new Set();
  const profileByZh = new Map(BODY_TYPE_VISIBILITY_PROFILES.map((profile) => [profile.bodyTypeZh, profile]));

  for (const fixture of COMPOSITION_BODY_VISIBILITY_REGRESSION_FIXTURES) {
    assert.equal(ids.has(fixture.id), false, `Duplicate fixture id ${fixture.id}`);
    ids.add(fixture.id);
    fixture.coverage.forEach((value) => coverage.add(value));

    const expectedPolicy = EXPECTED_BODY_VISIBILITY_POLICY_BY_BUCKET[fixture.expectedProjection.bucket];
    assert.ok(expectedPolicy, `${fixture.id}: missing target body policy`);
    assert.ok(fixture.expectedProjection.preserveRawLockKeys.length > 0, `${fixture.id}: raw selection`);
    assert.ok(fixture.expectedProjection.preserveNonBodyGroups.length > 0, `${fixture.id}: non-body groups`);

    for (const [key, selector] of Object.entries(fixture.locks)) {
      const control = controlsByKey.get(key);
      assert.ok(control, `${fixture.id}: missing control ${key}`);
      const option = typeof selector === 'object' && selector?.byZh
        ? control.options.find((entry) => entry.zh === selector.byZh)
        : control.options.find((entry) => entry.id === selector);
      assert.ok(option, `${fixture.id}: cannot resolve ${key} ${JSON.stringify(selector)}`);
    }

    if (fixture.expectedProjection.profileZh) {
      const profile = profileByZh.get(fixture.expectedProjection.profileZh);
      assert.ok(profile, `${fixture.id}: missing body profile`);
      assert.equal(
        fixture.expectedProjection.bodyText,
        profile.expectedTextByBucket[fixture.expectedProjection.bucket],
        `${fixture.id}: expected shared body source`
      );
    }

    if (fixture.expectedProjection.roleProfiles) {
      for (const [role, profileZh] of Object.entries(fixture.expectedProjection.roleProfiles)) {
        const profile = profileByZh.get(profileZh);
        assert.ok(profile, `${fixture.id}: missing duo profile ${profileZh}`);
        assert.equal(
          fixture.expectedProjection.roleBodyText?.[role],
          profile.expectedTextByBucket[fixture.expectedProjection.bucket],
          `${fixture.id}: role ${role} expected shared body source`
        );
      }
    }
  }

  for (const requiredCoverage of [
    'single',
    'duo',
    'normalBodyType',
    'characterCard',
    'specialOutfit',
    'faceDetail',
    'headShoulders',
    'chestUp',
    'mediumWaist',
    'cowboyKnee',
    'fullBody',
    'selectionPreservation',
  ]) {
    assert.equal(coverage.has(requiredCoverage), true, requiredCoverage);
  }
});

test('phase-1 fixtures preserve face identity while only body content is projected', () => {
  const faceFixtures = COMPOSITION_BODY_VISIBILITY_REGRESSION_FIXTURES.filter((fixture) => (
    fixture.expectedProjection.bucket === 'faceDetail'
    || fixture.expectedProjection.bucket === 'headShoulders'
  ));

  assert.ok(faceFixtures.length >= 3);
  for (const fixture of faceFixtures) {
    assert.equal(fixture.expectedProjection.bodyText, '', fixture.id);
    assert.equal(fixture.expectedProjection.preserveNonBodyGroups.includes('hair'), true, `${fixture.id}: hair`);
    assert.equal(
      fixture.expectedProjection.preserveNonBodyGroups.some((group) => (
        group === 'faceIdentity' || group === 'facialGeometry'
      )),
      true,
      `${fixture.id}: face identity`
    );
  }
});

test('compatibility character cards author explicit crop-specific body sources', () => {
  const characterCards = CHARACTER_PROFILE_OPTIONS.filter((option) => option.specialSubject === 'character-profile');
  const forbiddenByBucket = {
    chestUp: /\b(?:height|weight|body proportion anchor|torso-to-leg|waist|abdomen|hips?|legs?|limbs?|thighs?)\b/i,
    mediumWaist: /\b(?:height|weight|body proportion anchor|torso-to-leg|hips?|legs?|limbs?|thighs?)\b/i,
    cowboyKnee: /\b(?:height|weight|torso-to-leg|long legs?|long limbs?|thighs?)\b/i,
  };

  assert.ok(characterCards.length > 0);
  for (const card of characterCards) {
    const bodyProjection = card.profile?.bodyProjection;
    assert.ok(bodyProjection, `${card.id}: bodyProjection`);
    for (const bucket of ['chestUp', 'mediumWaist', 'cowboyKnee']) {
      assert.equal(Object.hasOwn(bodyProjection, bucket), true, `${card.id}: ${bucket}`);
      assert.doesNotMatch(bodyProjection[bucket], forbiddenByBucket[bucket], `${card.id}: ${bucket} boundary`);
    }
  }
});

test('phase-4 integration matrix covers every public framing alias and compatibility source', () => {
  const publicFramingOptions = controlsByKey.get('framingId')?.options
    .filter((option) => !option.random)
    .map((option) => option.zh);
  const matrixFramingLabels = BODY_VISIBILITY_PHASE4_INTEGRATION_MATRIX.publicFramings
    .map((entry) => entry.framingZh);

  assert.deepEqual(matrixFramingLabels, publicFramingOptions);
  for (const entry of BODY_VISIBILITY_PHASE4_INTEGRATION_MATRIX.publicFramings) {
    assert.equal(FRAMING_VISIBILITY_BUCKET_BY_ZH[entry.framingZh], entry.bucket, entry.framingZh);
    assert.ok(EXPECTED_BODY_VISIBILITY_POLICY_BY_BUCKET[entry.bucket], `${entry.framingZh}: body policy`);
  }

  assert.equal(BODY_VISIBILITY_PHASE4_INTEGRATION_MATRIX.fixedComposition.bucket, 'fixedComposition');
  assert.ok(
    controlsByKey.get('fixedCompositionSetId')?.options.some((option) => (
      option.zh === BODY_VISIBILITY_PHASE4_INTEGRATION_MATRIX.fixedComposition.fixedSetZh
    )),
    'fixed composition fixture'
  );
  assert.equal(BODY_VISIBILITY_PHASE4_INTEGRATION_MATRIX.characterCards, 'all-formal');
  assert.equal(BODY_VISIBILITY_PHASE4_INTEGRATION_MATRIX.specialOutfitPersonDetailPattern, 'tattoos?');
  for (const profileZh of Object.values(BODY_VISIBILITY_PHASE4_INTEGRATION_MATRIX.duoProfiles)) {
    assert.ok(BODY_TYPE_VISIBILITY_PROFILES.some((profile) => profile.bodyTypeZh === profileZh), profileZh);
  }
});

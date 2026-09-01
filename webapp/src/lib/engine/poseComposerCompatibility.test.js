import assert from 'node:assert/strict';
import { test } from 'node:test';

import { COMPOSITION_VISIBILITY_BUCKETS } from './compositionVisibilityContract.js';
import {
  POSE_COMPOSER_ANCHOR_OPTIONS,
  POSE_COMPOSER_ARRANGEMENT_OPTIONS,
  POSE_COMPOSER_HAND_OPTIONS,
  POSE_COMPOSER_HEAD_OPTIONS,
} from './poseComposerOptions.js';
import {
  createPoseComposerCompatibilityContext,
  poseComposerArrangementSupportsRandomContext,
  poseComposerBaseSupportsRandomContext,
  poseComposerHandSupportsRandomContext,
  poseComposerHeadSupportsRandomContext,
  poseComposerOptionRandomEligibleForBase,
  poseComposerOptionRandomEligibleForOrientation,
  poseComposerOptionVisibleForBase,
  poseComposerOptionVisibleForOrientation,
  poseComposerPropSupportsRandomContext,
} from './poseComposerCompatibility.js';

const option = (id, tags = []) => ({ id, meta: { tags } });

test('random pose base follows the visible crop boundary', () => {
  const waistUp = createPoseComposerCompatibilityContext({
    bucket: COMPOSITION_VISIBILITY_BUCKETS.MEDIUM_WAIST,
  });
  const cowboy = createPoseComposerCompatibilityContext({
    bucket: COMPOSITION_VISIBILITY_BUCKETS.COWBOY_KNEE,
  });

  assert.equal(poseComposerBaseSupportsRandomContext(option('standing'), waistUp), true);
  assert.equal(poseComposerBaseSupportsRandomContext(option('sitting'), waistUp), true);
  assert.equal(poseComposerBaseSupportsRandomContext(option('squatting'), waistUp), false);
  assert.equal(poseComposerBaseSupportsRandomContext(option('lying'), waistUp), false);
  assert.equal(poseComposerBaseSupportsRandomContext(option('squatting'), cowboy), true);
  assert.equal(poseComposerBaseSupportsRandomContext(option('lying'), cowboy), false);
});
test('random body orientation follows the selected orbit and head intent', () => {
  const frontView = createPoseComposerCompatibilityContext({
    orbit: option('front', ['front_view']),
  });
  const sideArrangement = option('squatting-side');

  assert.equal(poseComposerArrangementSupportsRandomContext(sideArrangement, frontView), false);
  assert.equal(poseComposerArrangementSupportsRandomContext(option('squatting-natural'), frontView), true);
  assert.equal(poseComposerArrangementSupportsRandomContext(sideArrangement, {
    ...frontView,
    requestedHeadId: 'head-camera-natural',
  }), false);
  assert.equal(poseComposerHeadSupportsRandomContext(option('head-camera-natural'), {
    ...frontView,
    arrangement: sideArrangement,
  }), false);
});

test('random head and facial prop choices avoid aerial and rear-view conflicts', () => {
  const aerial = createPoseComposerCompatibilityContext({
    angle: option('aerial', ['aerial']),
  });
  const rear = createPoseComposerCompatibilityContext({
    orbit: option('rear', ['back_view', 'rear_three_quarter']),
  });

  assert.equal(poseComposerHeadSupportsRandomContext(option('head-camera-natural', ['requires_face_visibility']), aerial), false);
  assert.equal(poseComposerPropSupportsRandomContext(option('hand-apply-lipstick', ['face_action']), rear), false);
  assert.equal(poseComposerPropSupportsRandomContext(option('hand-hold-iced-coffee', ['prop_action']), rear), true);
});

test('random lower-body hand placements are excluded from upper crops', () => {
  const chestUp = createPoseComposerCompatibilityContext({
    bucket: COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP,
  });
  const fullBody = createPoseComposerCompatibilityContext({
    bucket: COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY,
  });

  assert.equal(poseComposerHandSupportsRandomContext(option('one-hand-ankle'), chestUp), false);
  assert.equal(poseComposerHandSupportsRandomContext(option('one-hand-ankle'), fullBody), true);
  assert.equal(poseComposerHandSupportsRandomContext(option('one-hand-hair'), chestUp), true);
});

test('public hand metadata shares crop, wardrobe, and face-orbit constraints', () => {
  const findHand = (id) => POSE_COMPOSER_HAND_OPTIONS.find((item) => item.id === id);
  const waistUp = createPoseComposerCompatibilityContext({
    bucket: COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP,
    wardrobeSignals: { bottom: 'absent', pants: 'absent', outerwear: 'absent', eyewear: 'absent', upperGarment: 'present' },
  });
  const fullDress = createPoseComposerCompatibilityContext({
    bucket: COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY,
    wardrobeSignals: { bottom: 'absent', pants: 'absent', outerwear: 'absent', eyewear: 'absent', upperGarment: 'present' },
  });
  const rear = createPoseComposerCompatibilityContext({
    bucket: COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY,
    orbit: option('rear', ['back_view', 'rear_three_quarter']),
    wardrobeSignals: { eyewear: 'present' },
  });

  assert.equal(poseComposerHandSupportsRandomContext(findHand('hands-lift-waistband'), waistUp), false);
  assert.equal(poseComposerHandSupportsRandomContext(findHand('hands-in-pockets'), fullDress), false);
  assert.equal(poseComposerHandSupportsRandomContext(findHand('hands-in-outerwear-pockets'), fullDress), false);
  assert.equal(poseComposerHandSupportsRandomContext(findHand('one-hand-hold-glasses'), fullDress), false);
  assert.equal(poseComposerHandSupportsRandomContext(findHand('hands-relaxed-down'), waistUp), true);
  assert.equal(poseComposerHandSupportsRandomContext(findHand('one-hand-support-chin'), rear), false);
  assert.equal(poseComposerHandSupportsRandomContext(findHand('one-hand-open-palm-camera'), rear), false);
  assert.equal(poseComposerHandSupportsRandomContext(findHand('one-hand-open-palm-camera'), fullDress), true);
});

test('restored selfie hands stay manually selectable across every pose base and out of random pools', () => {
  const selfieIds = [
    'selfie-natural-right-arm',
    'selfie-mirror-phone-visible',
    'selfie-companion-camera-interaction',
  ];

  for (const id of selfieIds) {
    const hand = POSE_COMPOSER_HAND_OPTIONS.find((item) => item.id === id);
    assert.ok(hand, `Expected restored selfie hand ${id}`);
    assert.equal(hand.meta?.uiHidden, undefined, id);
    assert.equal(hand.meta?.randomEligible, false, id);
    for (const baseId of ['standing', 'sitting', 'kneeling', 'squatting', 'lying']) {
      assert.equal(poseComposerOptionVisibleForBase(hand, baseId), true, `${id} should be visible for ${baseId}`);
    }
    for (const orientationId of ['lying-supine', 'lying-side', 'lying-prone']) {
      assert.equal(poseComposerOptionVisibleForOrientation(hand, orientationId), true, `${id} should be visible for ${orientationId}`);
    }
  }
});

test('standing matrix hides incompatible support and lower-body options while preserving other bases', () => {
  const standing = createPoseComposerCompatibilityContext({ base: 'standing' });
  const sitting = createPoseComposerCompatibilityContext({ base: 'sitting' });
  const sittingWithRaisedKnees = { ...sitting, arrangement: { id: 'sitting-hug-knees' } };
  const sittingWithoutRaisedKnees = { ...sitting, arrangement: { id: 'sitting-natural' } };
  const hugKnees = POSE_COMPOSER_HAND_OPTIONS.find((item) => item.id === 'hands-hug-knees');
  const closeSupportHead = POSE_COMPOSER_HEAD_OPTIONS.find((item) => item.id === 'head-close-support-surface');
  const naturalSupportAnchor = POSE_COMPOSER_ANCHOR_OPTIONS.find((item) => item.id === 'shared-natural-support');

  assert.equal(poseComposerOptionVisibleForBase(hugKnees, 'standing'), false);
  assert.equal(poseComposerOptionVisibleForBase(hugKnees, 'sitting'), true);
  assert.equal(poseComposerHandSupportsRandomContext(hugKnees, standing), false);
  assert.equal(poseComposerHandSupportsRandomContext(hugKnees, sittingWithRaisedKnees), true);
  assert.equal(poseComposerHandSupportsRandomContext(hugKnees, sittingWithoutRaisedKnees), false);
  assert.equal(poseComposerOptionVisibleForBase(closeSupportHead, 'standing'), false);
  assert.equal(poseComposerOptionVisibleForBase(closeSupportHead, 'sitting'), false);
  assert.equal(poseComposerOptionRandomEligibleForBase(naturalSupportAnchor, 'standing'), false);
  assert.equal(poseComposerOptionVisibleForBase(naturalSupportAnchor, 'sitting'), false);
  assert.equal(poseComposerOptionRandomEligibleForBase(naturalSupportAnchor, 'sitting'), false);
});

test('kneeling matrix keeps four-point support hands and bent-knee hug hands compatible', () => {
  const kneeling = createPoseComposerCompatibilityContext({ base: 'kneeling' });
  const fourPoint = { ...kneeling, arrangement: { id: 'kneeling-all-fours' } };
  const seiza = { ...kneeling, arrangement: { id: 'kneeling-seiza' } };
  const forwardLean = { ...kneeling, arrangement: { id: 'kneeling-forward-lean' } };
  const palms = POSE_COMPOSER_HAND_OPTIONS.find((item) => item.id === 'hands-palms-planted-ground');
  const elbows = POSE_COMPOSER_HAND_OPTIONS.find((item) => item.id === 'hands-elbows-planted-ground');
  const hugKnees = POSE_COMPOSER_HAND_OPTIONS.find((item) => item.id === 'hands-hug-knees');

  assert.equal(poseComposerOptionVisibleForBase(palms, 'kneeling'), true);
  assert.equal(poseComposerOptionVisibleForBase(palms, 'standing'), false);
  assert.equal(poseComposerHandSupportsRandomContext(palms, fourPoint), true);
  assert.equal(poseComposerHandSupportsRandomContext(elbows, fourPoint), true);
  assert.equal(poseComposerHandSupportsRandomContext(palms, seiza), false);
  assert.equal(poseComposerHandSupportsRandomContext(elbows, forwardLean), false);
  assert.equal(poseComposerHandSupportsRandomContext(hugKnees, seiza), true);
  assert.equal(poseComposerHandSupportsRandomContext(hugKnees, fourPoint), false);
  assert.equal(poseComposerHandSupportsRandomContext(hugKnees, forwardLean), false);
});

test('squatting matrix exposes six dedicated hand actions for squatting', () => {
  const squat = createPoseComposerCompatibilityContext({
    base: 'squatting',
    bucket: COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY,
    orbit: option('front', ['front_view']),
  });
  const dedicatedIds = [
    'squatting-hands-forward',
    'squatting-hands-outer-legs',
    'squatting-one-hand-cheek-one-knee',
    'squatting-one-hand-mouth-one-down',
    'squatting-one-hand-v-sign',
    'squatting-both-hands-cheeks',
  ];

  for (const id of dedicatedIds) {
    const hand = POSE_COMPOSER_HAND_OPTIONS.find((item) => item.id === id);
    assert.ok(hand, `Expected dedicated squatting hand ${id}`);
    assert.equal(poseComposerOptionVisibleForBase(hand, 'squatting'), true);
    assert.equal(poseComposerOptionRandomEligibleForBase(hand, 'squatting'), true);
    assert.equal(poseComposerOptionVisibleForBase(hand, 'standing'), false);
    assert.equal(poseComposerOptionRandomEligibleForBase(hand, 'standing'), false);
    assert.equal(poseComposerHandSupportsRandomContext(hand, squat), true);
    assert.equal(poseComposerHandSupportsRandomContext(hand, { ...squat, bucket: COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP }), false);
  }

  for (const id of [
    'squatting-one-hand-cheek-one-knee',
    'squatting-one-hand-mouth-one-down',
    'squatting-one-hand-v-sign',
    'squatting-both-hands-cheeks',
  ]) {
    const hand = POSE_COMPOSER_HAND_OPTIONS.find((item) => item.id === id);
    assert.equal(poseComposerHandSupportsRandomContext(hand, {
      ...squat,
      orbitTags: ['back_view'],
    }), false);
  }
});

test('squatting hand pool excludes every shared concrete hand action', () => {
  const dedicatedIds = new Set([
    'squatting-hands-forward',
    'squatting-hands-outer-legs',
    'squatting-one-hand-cheek-one-knee',
    'squatting-one-hand-mouth-one-down',
    'squatting-one-hand-v-sign',
    'squatting-both-hands-cheeks',
  ]);
  const sharedConcreteIds = [
    'hands-relaxed-down',
    'arms-crossed',
    'one-hand-waist-one-down',
    'hands-behind-back',
    'hands-behind-head',
    'one-hand-open-palm-camera',
    'one-hand-support-chin',
    'one-hand-mouth-corner',
    'one-hand-sweep-bangs-back',
    'both-hands-gather-hair',
    'hand-adjust-off-shoulder-top',
    'hands-lift-waistband',
    'hands-hug-knees',
    'hands-in-pockets',
    'hands-in-outerwear-pockets',
    'one-hand-hold-glasses',
    'one-hand-pull-down-glasses',
    'glasses-temple-between-teeth',
  ];
  const squatContext = createPoseComposerCompatibilityContext({
    base: 'squatting',
    bucket: COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY,
  });

  for (const id of sharedConcreteIds) {
    const hand = POSE_COMPOSER_HAND_OPTIONS.find((item) => item.id === id);
    assert.ok(hand, `Expected shared hand ${id}`);
    assert.equal(dedicatedIds.has(id), false);
    assert.equal(poseComposerOptionVisibleForBase(hand, 'squatting'), false, `${id} should be hidden in squat UI`);
    assert.equal(poseComposerHandSupportsRandomContext(hand, squatContext), false, `${id} should be excluded from squat random pool`);
  }

  for (const id of ['none', 'random', 'model-natural-hand-placement']) {
    const hand = POSE_COMPOSER_HAND_OPTIONS.find((item) => item.id === id);
    assert.ok(hand, `Expected squat control ${id}`);
    assert.equal(poseComposerOptionVisibleForBase(hand, 'squatting'), true);
  }
});

test('wardrobe-dependent hand actions require a positively present role for random selection', () => {
  const roleByHandId = {
    'hand-adjust-off-shoulder-top': 'upperGarment',
    'hands-lift-waistband': 'bottom',
    'hands-in-pockets': 'pants',
    'hands-in-outerwear-pockets': 'outerwear',
    'one-hand-hold-glasses': 'eyewear',
    'one-hand-pull-down-glasses': 'eyewear',
    'glasses-temple-between-teeth': 'eyewear',
  };
  const baseContext = createPoseComposerCompatibilityContext({
    base: 'standing',
    bucket: COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY,
  });

  for (const [id, role] of Object.entries(roleByHandId)) {
    const hand = POSE_COMPOSER_HAND_OPTIONS.find((item) => item.id === id);
    assert.ok(hand, `Expected wardrobe-dependent hand ${id}`);
    assert.equal(poseComposerHandSupportsRandomContext(hand, baseContext), false, `${id} should reject unknown role state`);
    assert.equal(poseComposerHandSupportsRandomContext(hand, {
      ...baseContext,
      wardrobeSignals: { [role]: 'absent' },
    }), false, `${id} should reject absent ${role}`);
    assert.equal(poseComposerHandSupportsRandomContext(hand, {
      ...baseContext,
      wardrobeSignals: { [role]: 'present' },
    }), true, `${id} should accept present ${role}`);
  }
});

test('lying matrix scopes dedicated hands and heads to their selected orientation', () => {
  const findHand = (id) => POSE_COMPOSER_HAND_OPTIONS.find((item) => item.id === id);
  const findHead = (id) => POSE_COMPOSER_HEAD_OPTIONS.find((item) => item.id === id);
  const supine = createPoseComposerCompatibilityContext({
    base: 'lying',
    orientation: 'lying-supine',
    arrangement: 'lying-body-half-recline',
    bucket: COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY,
  });
  const side = createPoseComposerCompatibilityContext({
    base: 'lying',
    orientation: 'lying-side',
    arrangement: 'lying-body-upper-propped',
    bucket: COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY,
  });
  const prone = createPoseComposerCompatibilityContext({
    base: 'lying',
    orientation: 'lying-prone',
    arrangement: 'lying-body-upper-propped',
    bucket: COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY,
  });
  const supineHand = findHand('lying-supine-arms-overhead');
  const sideHand = findHand('lying-side-lower-arm-under-head');
  const proneHand = findHand('lying-prone-elbows-support');
  const supineHead = findHead('lying-supine-head-neutral');
  const sideHead = findHead('lying-side-head-on-support');
  const proneHead = findHead('lying-prone-head-turned-side');

  assert.equal(poseComposerOptionVisibleForBase(supineHand, 'lying'), true);
  assert.equal(poseComposerOptionVisibleForOrientation(supineHand, 'lying-supine'), true);
  assert.equal(poseComposerOptionVisibleForOrientation(supineHand, 'lying-prone'), false);
  assert.equal(poseComposerHandSupportsRandomContext(supineHand, supine), true);
  assert.equal(poseComposerHandSupportsRandomContext(supineHand, side), false);
  assert.equal(poseComposerHandSupportsRandomContext(sideHand, side), true);
  assert.equal(poseComposerHandSupportsRandomContext(proneHand, prone), true);
  assert.equal(poseComposerHandSupportsRandomContext(proneHand, side), false);
  assert.equal(poseComposerOptionRandomEligibleForOrientation(supineHead, 'lying-supine'), true);
  assert.equal(poseComposerOptionRandomEligibleForOrientation(supineHead, 'lying-side'), false);
  assert.equal(poseComposerOptionRandomEligibleForOrientation(supineHead, 'none'), false);
  assert.equal(poseComposerHeadSupportsRandomContext(sideHead, side), true);
  assert.equal(poseComposerHeadSupportsRandomContext(proneHead, prone), true);
});

test('lying body variation matrix prevents half-recline and upper-propped random conflicts', () => {
  const supine = createPoseComposerCompatibilityContext({ base: 'lying', orientation: 'lying-supine' });
  const side = createPoseComposerCompatibilityContext({ base: 'lying', orientation: 'lying-side' });
  const prone = createPoseComposerCompatibilityContext({ base: 'lying', orientation: 'lying-prone' });
  const genericPocketHands = POSE_COMPOSER_HAND_OPTIONS.find((item) => item.id === 'hands-in-pockets');
  const arrangements = [
    { id: 'lying-body-half-recline', meta: { randomEligibleForOrientations: { 'lying-supine': true, 'lying-side': false, 'lying-prone': false } } },
    { id: 'lying-body-upper-propped', meta: { randomEligibleForOrientations: { 'lying-supine': false, 'lying-side': true, 'lying-prone': true } } },
  ];
  assert.equal(poseComposerArrangementSupportsRandomContext(arrangements[0], supine), true);
  assert.equal(poseComposerArrangementSupportsRandomContext(arrangements[0], side), false);
  assert.equal(poseComposerArrangementSupportsRandomContext(arrangements[0], prone), false);
  assert.equal(poseComposerArrangementSupportsRandomContext(arrangements[1], supine), false);
  assert.equal(poseComposerArrangementSupportsRandomContext(arrangements[1], side), true);
  assert.equal(poseComposerArrangementSupportsRandomContext(arrangements[1], prone), true);
  assert.equal(poseComposerHandSupportsRandomContext(genericPocketHands, supine), false);

  for (const id of [
    'lying-body-supine-side-crossed',
    'lying-body-supine-side-separated',
    'lying-body-supine-crossed-extended',
    'lying-body-supine-bent-crossed',
  ]) {
    const arrangement = POSE_COMPOSER_ARRANGEMENT_OPTIONS.find((item) => item.id === id);
    assert.equal(poseComposerArrangementSupportsRandomContext(arrangement, supine), true);
    assert.equal(poseComposerArrangementSupportsRandomContext(arrangement, side), false);
    assert.equal(poseComposerArrangementSupportsRandomContext(arrangement, prone), false);
  }
});

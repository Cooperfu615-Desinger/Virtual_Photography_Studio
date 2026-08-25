import assert from 'node:assert/strict';
import { test } from 'node:test';

import { COMPOSITION_VISIBILITY_BUCKETS } from './compositionVisibilityContract.js';
import { POSE_COMPOSER_HAND_OPTIONS } from './poseComposerOptions.js';
import {
  createPoseComposerCompatibilityContext,
  poseComposerArrangementSupportsRandomContext,
  poseComposerBaseSupportsRandomContext,
  poseComposerHandSupportsRandomContext,
  poseComposerHeadSupportsRandomContext,
  poseComposerOptionRandomEligibleForBase,
  poseComposerOptionVisibleForBase,
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
  assert.equal(poseComposerHandSupportsRandomContext(findHand('one-hand-open-palm-camera'), rear), true);
});

test('standing matrix hides incompatible support and lower-body options while preserving other bases', () => {
  const standing = createPoseComposerCompatibilityContext({ base: 'standing' });
  const sitting = createPoseComposerCompatibilityContext({ base: 'sitting' });
  const hugKnees = POSE_COMPOSER_HAND_OPTIONS.find((item) => item.id === 'hands-hug-knees');
  const closeSupportHead = { id: 'head-close-support-surface', meta: { hiddenForBases: ['standing'], randomEligibleForBases: { standing: false } } };
  const naturalSupportAnchor = { id: 'shared-natural-support', meta: { hiddenForBases: ['standing'], randomEligibleForBases: { standing: false } } };

  assert.equal(poseComposerOptionVisibleForBase(hugKnees, 'standing'), false);
  assert.equal(poseComposerOptionVisibleForBase(hugKnees, 'sitting'), true);
  assert.equal(poseComposerHandSupportsRandomContext(hugKnees, standing), false);
  assert.equal(poseComposerHandSupportsRandomContext(hugKnees, sitting), true);
  assert.equal(poseComposerOptionVisibleForBase(closeSupportHead, 'standing'), false);
  assert.equal(poseComposerOptionRandomEligibleForBase(naturalSupportAnchor, 'standing'), false);
  assert.equal(poseComposerOptionRandomEligibleForBase(naturalSupportAnchor, 'sitting'), true);
});

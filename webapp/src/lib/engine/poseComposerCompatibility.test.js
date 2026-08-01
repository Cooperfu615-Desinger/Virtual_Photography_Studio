import assert from 'node:assert/strict';
import { test } from 'node:test';

import { COMPOSITION_VISIBILITY_BUCKETS } from './compositionVisibilityContract.js';
import {
  createPoseComposerCompatibilityContext,
  poseComposerArrangementSupportsRandomContext,
  poseComposerBaseSupportsRandomContext,
  poseComposerHandSupportsRandomContext,
  poseComposerHeadSupportsRandomContext,
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

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { COMPOSITION_VISIBILITY_BUCKETS } from './compositionVisibilityContract.js';
import {
  POSE_COMPOSER_ANCHOR_OPTIONS,
  POSE_COMPOSER_ARRANGEMENT_OPTIONS,
} from './poseComposerOptions.js';
import {
  createPoseComposerProjectionMap,
  getPoseComposerProjection,
  POSE_COMPOSER_PROJECTION_MODES,
} from './poseComposerProjection.js';

const { CHEST_UP, MEDIUM_WAIST, COWBOY_KNEE, FULL_BODY } = COMPOSITION_VISIBILITY_BUCKETS;

function findOption(options, id) {
  const option = options.find((entry) => entry.id === id);
  assert.ok(option, `Expected Pose Composer option ${id}`);
  return option;
}

test('Pose Composer projection metadata has explicit three-tier modes', () => {
  const map = createPoseComposerProjectionMap({
    visible: [FULL_BODY],
    projected: [MEDIUM_WAIST],
    omit: [CHEST_UP],
  });

  assert.deepEqual(map[FULL_BODY], { mode: POSE_COMPOSER_PROJECTION_MODES.VISIBLE });
  assert.deepEqual(map[MEDIUM_WAIST], { mode: POSE_COMPOSER_PROJECTION_MODES.PROJECTED });
  assert.deepEqual(map[CHEST_UP], { mode: POSE_COMPOSER_PROJECTION_MODES.OMIT });
  assert.equal(Object.isFrozen(map), true);
  assert.throws(() => createPoseComposerProjectionMap({ visible: ['unknownBucket'] }), /Unknown composition visibility bucket/);
});

test('all active standing arrangements carry explicit crop projection metadata', () => {
  const standing = POSE_COMPOSER_ARRANGEMENT_OPTIONS.filter((option) => option.base === 'standing');
  assert.equal(standing.length, 13);

  for (const option of standing) {
    const metadata = option.meta?.projectionByBucket;
    assert.ok(metadata, `${option.id} should define projection metadata`);
    for (const bucket of Object.values(COMPOSITION_VISIBILITY_BUCKETS)) {
      const projection = getPoseComposerProjection(option, bucket);
      assert.ok(projection, `${option.id} should define ${bucket} projection mode`);
      assert.ok(Object.values(POSE_COMPOSER_PROJECTION_MODES).includes(projection.mode));
    }
  }
});

test('standing projection metadata distinguishes lower-body-only and upper-body candidates', () => {
  const lowerBodyOnly = findOption(POSE_COMPOSER_ARRANGEMENT_OPTIONS, 'standing-raised-foot');
  const upperBodyCandidate = findOption(POSE_COMPOSER_ARRANGEMENT_OPTIONS, 'standing-one-leg-weight');

  assert.equal(getPoseComposerProjection(lowerBodyOnly, CHEST_UP).mode, POSE_COMPOSER_PROJECTION_MODES.OMIT);
  assert.equal(getPoseComposerProjection(lowerBodyOnly, MEDIUM_WAIST).mode, POSE_COMPOSER_PROJECTION_MODES.OMIT);
  assert.equal(getPoseComposerProjection(lowerBodyOnly, COWBOY_KNEE).mode, POSE_COMPOSER_PROJECTION_MODES.OMIT);
  assert.equal(getPoseComposerProjection(lowerBodyOnly, FULL_BODY).mode, POSE_COMPOSER_PROJECTION_MODES.VISIBLE);

  assert.equal(getPoseComposerProjection(upperBodyCandidate, CHEST_UP).mode, POSE_COMPOSER_PROJECTION_MODES.PROJECTED);
  assert.equal(getPoseComposerProjection(upperBodyCandidate, MEDIUM_WAIST).mode, POSE_COMPOSER_PROJECTION_MODES.PROJECTED);
  assert.equal(getPoseComposerProjection(upperBodyCandidate, COWBOY_KNEE).mode, POSE_COMPOSER_PROJECTION_MODES.VISIBLE);
  assert.equal(getPoseComposerProjection(upperBodyCandidate, FULL_BODY).mode, POSE_COMPOSER_PROJECTION_MODES.VISIBLE);
});

test('active standing support anchors carry crop projection metadata', () => {
  for (const id of [
    'shared-natural-support',
    'shared-vertical-surface-support',
    'standing-edge-hip-support',
    'water-immersed',
    'water-edge-support',
    'shared-bathtub',
  ]) {
    const option = findOption(POSE_COMPOSER_ANCHOR_OPTIONS, id);
    assert.ok(option.meta?.projectionByBucket, `${id} should define projection metadata`);
  }

  const hipEdge = findOption(POSE_COMPOSER_ANCHOR_OPTIONS, 'standing-edge-hip-support');
  assert.equal(getPoseComposerProjection(hipEdge, CHEST_UP).mode, POSE_COMPOSER_PROJECTION_MODES.OMIT);
  assert.equal(getPoseComposerProjection(hipEdge, MEDIUM_WAIST).mode, POSE_COMPOSER_PROJECTION_MODES.OMIT);
  assert.equal(getPoseComposerProjection(hipEdge, COWBOY_KNEE).mode, POSE_COMPOSER_PROJECTION_MODES.VISIBLE);
});

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { COMPOSITION_VISIBILITY_BUCKETS } from './compositionVisibilityContract.js';
import {
  POSE_COMPOSER_ANCHOR_OPTIONS,
  POSE_COMPOSER_ARRANGEMENT_OPTIONS,
  POSE_COMPOSER_ORIENTATION_OPTIONS,
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
  const standing = POSE_COMPOSER_ARRANGEMENT_OPTIONS.filter((option) => option.base === 'standing' && !option.meta?.deprecated);
  assert.equal(standing.length, 8);

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

test('all active sitting arrangements carry explicit crop projection metadata', () => {
  const sitting = POSE_COMPOSER_ARRANGEMENT_OPTIONS.filter((option) => option.base === 'sitting' && !option.meta?.deprecated);
  assert.equal(sitting.length, 10);

  for (const option of sitting) {
    const metadata = option.meta?.projectionByBucket;
    assert.ok(metadata, `${option.id} should define projection metadata`);
    for (const bucket of Object.values(COMPOSITION_VISIBILITY_BUCKETS)) {
      const projection = getPoseComposerProjection(option, bucket);
      assert.ok(projection, `${option.id} should define ${bucket} projection mode`);
      assert.ok(Object.values(POSE_COMPOSER_PROJECTION_MODES).includes(projection.mode));
    }
  }
});

test('all active squatting arrangements carry explicit crop projection metadata', () => {
  const squatting = POSE_COMPOSER_ARRANGEMENT_OPTIONS.filter((option) => option.base === 'squatting' && !option.meta?.deprecated);
  assert.equal(squatting.length, 7);

  for (const option of squatting) {
    const metadata = option.meta?.projectionByBucket;
    assert.ok(metadata, `${option.id} should define projection metadata`);
    for (const bucket of Object.values(COMPOSITION_VISIBILITY_BUCKETS)) {
      const projection = getPoseComposerProjection(option, bucket);
      assert.ok(projection, `${option.id} should define ${bucket} projection mode`);
      assert.ok(Object.values(POSE_COMPOSER_PROJECTION_MODES).includes(projection.mode));
    }
  }
});

test('lying orientation and body variation layers stay explicit and independent', () => {
  const orientations = POSE_COMPOSER_ORIENTATION_OPTIONS.filter((option) => option.base === 'lying');
  assert.deepEqual(orientations.map((option) => option.zh), ['仰躺', '側躺', '趴臥']);
  for (const option of orientations) {
    for (const bucket of Object.values(COMPOSITION_VISIBILITY_BUCKETS)) {
      const projection = getPoseComposerProjection(option, bucket);
      assert.ok(projection, `${option.id} should define ${bucket} projection mode`);
      assert.ok(Object.values(POSE_COMPOSER_PROJECTION_MODES).includes(projection.mode));
    }
  }

  const bodyVariations = POSE_COMPOSER_ARRANGEMENT_OPTIONS.filter((option) => (
    option.base === 'lying' && !option.meta?.deprecated
  ));
  assert.deepEqual(bodyVariations.map((option) => option.zh), [
    '自然伸展',
    '雙腿屈起',
    '身體微蜷',
    '上半身半躺',
    '上半身撐起',
  ]);
  assert.ok(bodyVariations.slice(0, 2).every((option) => (
    getPoseComposerProjection(option, CHEST_UP).mode === POSE_COMPOSER_PROJECTION_MODES.OMIT
    && getPoseComposerProjection(option, MEDIUM_WAIST).mode === POSE_COMPOSER_PROJECTION_MODES.OMIT
  )));
  assert.ok(bodyVariations.slice(2).every((option) => (
    getPoseComposerProjection(option, CHEST_UP).mode === POSE_COMPOSER_PROJECTION_MODES.PROJECTED
    && getPoseComposerProjection(option, MEDIUM_WAIST).mode === POSE_COMPOSER_PROJECTION_MODES.PROJECTED
  )));
  assert.equal(POSE_COMPOSER_ARRANGEMENT_OPTIONS.find((option) => option.id === 'lying-on-back')?.meta?.uiHidden, true);
});

test('squatting projection metadata separates upper and lower geometry', () => {
  const upperBodyIds = ['squatting-natural', 'squatting-forward-lean'];
  const lowerBodyIds = [
    'squatting-one-knee',
    'squatting-side',
    'squatting-low-one-leg-forward',
    'squatting-gangster-wide-knee',
  ];
  const cowboyHiddenIds = ['squatting-one-hand-ground', 'squatting-raised-heels'];

  for (const id of upperBodyIds) {
    const option = findOption(POSE_COMPOSER_ARRANGEMENT_OPTIONS, id);
    assert.equal(getPoseComposerProjection(option, CHEST_UP).mode, POSE_COMPOSER_PROJECTION_MODES.PROJECTED);
    assert.equal(getPoseComposerProjection(option, MEDIUM_WAIST).mode, POSE_COMPOSER_PROJECTION_MODES.PROJECTED);
    assert.equal(getPoseComposerProjection(option, COWBOY_KNEE).mode, POSE_COMPOSER_PROJECTION_MODES.VISIBLE);
    assert.equal(getPoseComposerProjection(option, FULL_BODY).mode, POSE_COMPOSER_PROJECTION_MODES.VISIBLE);
    assert.match(getPoseComposerProjection(option, CHEST_UP).en, /\S/);
    assert.match(getPoseComposerProjection(option, MEDIUM_WAIST).en, /\S/);
  }

  for (const id of lowerBodyIds) {
    const option = findOption(POSE_COMPOSER_ARRANGEMENT_OPTIONS, id);
    assert.equal(getPoseComposerProjection(option, CHEST_UP).mode, POSE_COMPOSER_PROJECTION_MODES.OMIT);
    assert.equal(getPoseComposerProjection(option, MEDIUM_WAIST).mode, POSE_COMPOSER_PROJECTION_MODES.OMIT);
    assert.equal(getPoseComposerProjection(option, COWBOY_KNEE).mode, POSE_COMPOSER_PROJECTION_MODES.VISIBLE);
    assert.equal(getPoseComposerProjection(option, FULL_BODY).mode, POSE_COMPOSER_PROJECTION_MODES.VISIBLE);
  }

  for (const id of cowboyHiddenIds) {
    const option = findOption(POSE_COMPOSER_ARRANGEMENT_OPTIONS, id);
    assert.equal(getPoseComposerProjection(option, CHEST_UP).mode, POSE_COMPOSER_PROJECTION_MODES.OMIT);
    assert.equal(getPoseComposerProjection(option, MEDIUM_WAIST).mode, POSE_COMPOSER_PROJECTION_MODES.OMIT);
    assert.equal(getPoseComposerProjection(option, COWBOY_KNEE).mode, POSE_COMPOSER_PROJECTION_MODES.OMIT);
    assert.equal(getPoseComposerProjection(option, FULL_BODY).mode, POSE_COMPOSER_PROJECTION_MODES.VISIBLE);
  }

  const kneesTogether = findOption(POSE_COMPOSER_ARRANGEMENT_OPTIONS, 'squatting-knees-together-low');
  assert.equal(getPoseComposerProjection(kneesTogether, CHEST_UP).mode, POSE_COMPOSER_PROJECTION_MODES.OMIT);
  assert.equal(getPoseComposerProjection(kneesTogether, MEDIUM_WAIST).mode, POSE_COMPOSER_PROJECTION_MODES.OMIT);
  assert.equal(getPoseComposerProjection(kneesTogether, COWBOY_KNEE).mode, POSE_COMPOSER_PROJECTION_MODES.PROJECTED);
  assert.match(getPoseComposerProjection(kneesTogether, COWBOY_KNEE).en, /both knees together/);
  assert.equal(getPoseComposerProjection(kneesTogether, FULL_BODY).mode, POSE_COMPOSER_PROJECTION_MODES.VISIBLE);
});

test('squatting arrangement simplification keeps seven active categories and restorable legacy IDs', () => {
  const activeIds = POSE_COMPOSER_ARRANGEMENT_OPTIONS
    .filter((option) => option.base === 'squatting' && !option.meta?.deprecated)
    .map((option) => option.id);
  const deprecatedIds = POSE_COMPOSER_ARRANGEMENT_OPTIONS
    .filter((option) => option.base === 'squatting' && option.meta?.deprecated)
    .map((option) => option.id);

  assert.deepEqual(activeIds, [
    'squatting-natural',
    'squatting-one-knee',
    'squatting-side',
    'squatting-low-one-leg-forward',
    'squatting-forward-lean',
    'squatting-knees-together-low',
    'squatting-gangster-wide-knee',
  ]);
  assert.deepEqual(deprecatedIds, [
    'squatting-hands-knees',
    'squatting-compact',
    'squatting-hug-knees',
    'squatting-one-hand-ground',
    'squatting-side-low',
    'squatting-raised-heels',
    'squatting-compact-hug-knees-variant',
  ]);

  for (const id of deprecatedIds) {
    const option = findOption(POSE_COMPOSER_ARRANGEMENT_OPTIONS, id);
    assert.equal(option.meta.uiHidden, true);
    assert.equal(option.meta.randomEligible, false);
    assert.equal(option.meta.deprecated, true);
  }
});

test('sitting arrangement simplification keeps a focused active core and restorable deprecated IDs', () => {
  const activeIds = POSE_COMPOSER_ARRANGEMENT_OPTIONS
    .filter((option) => option.base === 'sitting' && !option.meta?.deprecated)
    .map((option) => option.id);
  const deprecatedIds = POSE_COMPOSER_ARRANGEMENT_OPTIONS
    .filter((option) => option.base === 'sitting' && option.meta?.deprecated)
    .map((option) => option.id);

  assert.deepEqual(activeIds, [
    'sitting-natural',
    'sitting-forward-lean',
    'sitting-legs-extended',
    'sitting-cross-legged',
    'sitting-hug-knees',
    'sitting-slouched',
    'sitting-leg-cross',
    'sitting-one-knee-up',
    'sitting-legs-to-side',
    'sitting-open-confident',
  ]);
  assert.deepEqual(deprecatedIds, [
    'sitting-hands-behind-support',
    'sitting-one-leg-relaxed',
    'sitting-grounded-forward-lean',
  ]);

  for (const id of deprecatedIds) {
    const option = findOption(POSE_COMPOSER_ARRANGEMENT_OPTIONS, id);
    assert.equal(option.meta.uiHidden, true);
    assert.equal(option.meta.randomEligible, false);
    assert.equal(option.meta.deprecated, true);
  }
});

test('sitting projection metadata separates upper-body and lower-body arrangements', () => {
  const upperBodyIds = [
    'sitting-natural',
    'sitting-forward-lean',
    'sitting-slouched',
    'sitting-open-confident',
  ];
  const lowerBodyIds = [
    'sitting-one-leg-relaxed',
    'sitting-legs-extended',
    'sitting-cross-legged',
    'sitting-hug-knees',
    'sitting-leg-cross',
    'sitting-one-knee-up',
    'sitting-legs-to-side',
  ];

  for (const id of upperBodyIds) {
    const option = findOption(POSE_COMPOSER_ARRANGEMENT_OPTIONS, id);
    assert.equal(getPoseComposerProjection(option, CHEST_UP).mode, POSE_COMPOSER_PROJECTION_MODES.PROJECTED);
    assert.equal(getPoseComposerProjection(option, MEDIUM_WAIST).mode, POSE_COMPOSER_PROJECTION_MODES.PROJECTED);
    assert.equal(getPoseComposerProjection(option, COWBOY_KNEE).mode, POSE_COMPOSER_PROJECTION_MODES.VISIBLE);
    assert.equal(getPoseComposerProjection(option, FULL_BODY).mode, POSE_COMPOSER_PROJECTION_MODES.VISIBLE);
    assert.match(getPoseComposerProjection(option, CHEST_UP).en, /\S/);
    assert.match(getPoseComposerProjection(option, MEDIUM_WAIST).en, /\S/);
  }

  for (const id of lowerBodyIds) {
    const option = findOption(POSE_COMPOSER_ARRANGEMENT_OPTIONS, id);
    assert.equal(getPoseComposerProjection(option, CHEST_UP).mode, POSE_COMPOSER_PROJECTION_MODES.OMIT);
    assert.equal(getPoseComposerProjection(option, MEDIUM_WAIST).mode, POSE_COMPOSER_PROJECTION_MODES.OMIT);
    assert.equal(getPoseComposerProjection(option, COWBOY_KNEE).mode, POSE_COMPOSER_PROJECTION_MODES.VISIBLE);
    assert.equal(getPoseComposerProjection(option, FULL_BODY).mode, POSE_COMPOSER_PROJECTION_MODES.VISIBLE);
  }
});

test('standing arrangement simplification keeps a stable active core and deprecated legacy IDs', () => {
  const activeIds = POSE_COMPOSER_ARRANGEMENT_OPTIONS
    .filter((option) => option.base === 'standing' && !option.meta?.deprecated)
    .map((option) => option.id);
  const deprecatedIds = POSE_COMPOSER_ARRANGEMENT_OPTIONS
    .filter((option) => option.base === 'standing' && option.meta?.deprecated)
    .map((option) => option.id);

  assert.deepEqual(activeIds, [
    'standing-natural',
    'standing-one-leg-weight',
    'standing-forward-lean',
    'standing-back-lean',
    'standing-crossed-legs',
    'standing-back-facing-turn',
    'standing-narrow-side',
    'standing-forward-toe-point',
  ]);
  assert.deepEqual(deprecatedIds, [
    'standing-deep-forward-lean',
    'standing-turn-back',
    'standing-contrapposto',
    'standing-raised-foot',
    'standing-soft-bent-knees',
  ]);

  for (const id of deprecatedIds) {
    const option = findOption(POSE_COMPOSER_ARRANGEMENT_OPTIONS, id);
    assert.equal(option.meta.uiHidden, true);
    assert.equal(option.meta.randomEligible, false);
    assert.equal(option.meta.deprecated, true);
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

  for (const id of ['water-immersed', 'water-edge-support', 'shared-bathtub']) {
    const option = findOption(POSE_COMPOSER_ANCHOR_OPTIONS, id);
    assert.equal(option.meta?.requiresWaterScene, true, `${id} should require a water scene`);
  }

  const hipEdge = findOption(POSE_COMPOSER_ANCHOR_OPTIONS, 'standing-edge-hip-support');
  assert.equal(getPoseComposerProjection(hipEdge, CHEST_UP).mode, POSE_COMPOSER_PROJECTION_MODES.OMIT);
  assert.equal(getPoseComposerProjection(hipEdge, MEDIUM_WAIST).mode, POSE_COMPOSER_PROJECTION_MODES.OMIT);
  assert.equal(getPoseComposerProjection(hipEdge, COWBOY_KNEE).mode, POSE_COMPOSER_PROJECTION_MODES.VISIBLE);
});

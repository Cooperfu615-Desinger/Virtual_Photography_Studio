import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getLockControls } from '../engine.js';
import {
  COMPOSITION_POSE_PARTS,
  COMPOSITION_VISIBILITY_BUCKETS,
  COMPOSITION_VISIBILITY_CONTRACT,
  COMPOSITION_WARDROBE_ROLES,
  FRAMING_VISIBILITY_BUCKET_BY_ZH,
  getCompositionVisibilityPolicy,
  resolveCompositionVisibilityBucket,
} from './compositionVisibilityContract.js';
import { COMPOSITION_VISIBILITY_REGRESSION_FIXTURES } from './compositionVisibilityFixtures.js';

const controls = getLockControls();
const controlsByKey = new Map(controls.map((control) => [control.key, control]));

test('every public framing maps to the approved composition visibility bucket', () => {
  const framingControl = controlsByKey.get('framingId');
  assert.ok(framingControl);

  const actualLabels = framingControl.options.map((option) => option.zh);
  assert.deepEqual(actualLabels, Object.keys(FRAMING_VISIBILITY_BUCKET_BY_ZH));

  for (const framing of framingControl.options) {
    assert.equal(
      resolveCompositionVisibilityBucket(framing),
      FRAMING_VISIBILITY_BUCKET_BY_ZH[framing.zh],
      framing.zh
    );
  }
});

test('composition visibility policies preserve raw selections and never invent depth effects', () => {
  for (const [bucket, policy] of Object.entries(COMPOSITION_VISIBILITY_CONTRACT)) {
    assert.equal(policy.selection.preserveRawSelections, true, bucket);
    assert.equal(policy.scene.preserveLocationIdentity, true, bucket);
    assert.equal(policy.scene.preserveSourceAnchors, true, bucket);
    assert.equal(policy.scene.addDepthEffect, false, bucket);
    assert.equal(policy.pose.shareCanonicalTextAcrossPrimaryOutputs, true, bucket);
  }
});

test('near crops omit full-body pressure while wider crops progressively restore visible content', () => {
  const face = COMPOSITION_VISIBILITY_CONTRACT[COMPOSITION_VISIBILITY_BUCKETS.FACE_DETAIL];
  const headShoulders = COMPOSITION_VISIBILITY_CONTRACT[COMPOSITION_VISIBILITY_BUCKETS.HEAD_SHOULDERS];
  const chestUp = COMPOSITION_VISIBILITY_CONTRACT[COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP];
  const medium = COMPOSITION_VISIBILITY_CONTRACT[COMPOSITION_VISIBILITY_BUCKETS.MEDIUM_WAIST];
  const cowboy = COMPOSITION_VISIBILITY_CONTRACT[COMPOSITION_VISIBILITY_BUCKETS.COWBOY_KNEE];
  const full = COMPOSITION_VISIBILITY_CONTRACT[COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY];

  assert.equal(face.pose.mode, 'omit');
  assert.equal(headShoulders.pose.mode, 'omit');
  assert.deepEqual(headShoulders.pose.parts, []);
  assert.equal(chestUp.pose.mode, 'visibleFragments');
  assert.equal(medium.wardrobe.roles.includes('bottom'), true);
  assert.equal(cowboy.wardrobe.conditionalRoles.includes('legwear'), true);
  assert.equal(cowboy.wardrobe.roles.includes('shoes'), false);
  assert.deepEqual(full.wardrobe.roles, COMPOSITION_WARDROBE_ROLES);
  assert.deepEqual(full.pose.parts, COMPOSITION_POSE_PARTS);
  assert.equal(full.pose.mode, 'fullCanonical');
});

test('unknown framing items use visibility metadata without changing known framing distinctions', () => {
  assert.equal(
    resolveCompositionVisibilityBucket({ zh: 'Custom portrait', meta: { visibility: 'portrait' } }),
    COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP
  );
  assert.equal(
    resolveCompositionVisibilityBucket({ zh: 'Custom wide', meta: { visibility: 'wide' } }),
    COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY
  );
  assert.equal(
    getCompositionVisibilityPolicy(null),
    COMPOSITION_VISIBILITY_CONTRACT[COMPOSITION_VISIBILITY_BUCKETS.UNCONSTRAINED]
  );
});

test('phase-1 visibility fixtures resolve public controls and cover every approved behavior group', () => {
  const ids = new Set();
  const coverage = new Set();
  const buckets = new Set();

  for (const fixture of COMPOSITION_VISIBILITY_REGRESSION_FIXTURES) {
    assert.equal(ids.has(fixture.id), false, `Duplicate fixture id ${fixture.id}`);
    ids.add(fixture.id);
    fixture.coverage.forEach((value) => coverage.add(value));
    buckets.add(fixture.expectedProjection.bucket);

    assert.equal(fixture.expectedProjection.mainPrompt.addDepthEffect, false, fixture.id);
    assert.ok(fixture.expectedProjection.preserveRawLockKeys.length > 0, fixture.id);

    for (const [key, selector] of Object.entries(fixture.locks)) {
      const control = controlsByKey.get(key);
      assert.ok(control, `${fixture.id}: missing control ${key}`);
      const option = typeof selector === 'object' && selector?.byZh
        ? control.options.find((entry) => entry.zh === selector.byZh)
        : control.options.find((entry) => entry.id === selector);
      assert.ok(option, `${fixture.id}: cannot resolve ${key} ${JSON.stringify(selector)}`);
    }
  }

  for (const requiredCoverage of [
    'single',
    'duo',
    'separates',
    'dress',
    'outfitPreset',
    'specialOutfit',
    'characterCard',
    'outerwear',
    'legwear',
    'shoes',
    'pose',
    'anchor',
    'scene',
    'fullBodyReference',
    'selectionPreservation',
  ]) {
    assert.equal(coverage.has(requiredCoverage), true, requiredCoverage);
  }

  for (const requiredBucket of [
    COMPOSITION_VISIBILITY_BUCKETS.FACE_DETAIL,
    COMPOSITION_VISIBILITY_BUCKETS.HEAD_SHOULDERS,
    COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP,
    COMPOSITION_VISIBILITY_BUCKETS.MEDIUM_WAIST,
    COMPOSITION_VISIBILITY_BUCKETS.COWBOY_KNEE,
    COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY,
  ]) {
    assert.equal(buckets.has(requiredBucket), true, requiredBucket);
  }
});

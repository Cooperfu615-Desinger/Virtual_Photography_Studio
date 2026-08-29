import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getLockControls } from '../engine.js';
import {
  COMPOSITION_POSE_PARTS,
  COMPOSITION_VISIBILITY_BUCKETS,
  COMPOSITION_VISIBILITY_CONTRACT,
  COMPOSITION_VISIBILITY_CONTRACT_VERSION,
  COMPOSITION_WARDROBE_ROLES,
  FRAMING_VISIBILITY_BUCKET_BY_ZH,
  createCompositionVisibilityProjection,
  getCompositionVisibilityPolicy,
  resolveCompositionVisibilityBucket,
  shouldProjectPosePart,
  shouldProjectWardrobeRole,
} from './compositionVisibilityContract.js';
import { COMPOSITION_VISIBILITY_REGRESSION_FIXTURES } from './compositionVisibilityFixtures.js';

const controls = getLockControls();
const controlsByKey = new Map(controls.map((control) => [control.key, control]));

test('composition visibility contract version includes body, fixed-composition, and supine-surface contexts', () => {
  assert.equal(COMPOSITION_VISIBILITY_CONTRACT_VERSION, 4);
  assert.ok(COMPOSITION_VISIBILITY_CONTRACT[COMPOSITION_VISIBILITY_BUCKETS.FIXED_COMPOSITION]);
});

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
    assert.equal(typeof policy.composition.source, 'string', bucket);
    assert.equal(typeof policy.composition.manualFraming, 'boolean', bucket);
    assert.equal(typeof policy.composition.cameraDistanceMode, 'string', bucket);
    assert.equal(policy.selection.preserveRawSelections, true, bucket);
    assert.equal(typeof policy.body.mode, 'string', bucket);
    assert.equal(Array.isArray(policy.body.zones), true, bucket);
    assert.equal(policy.scene.preserveLocationIdentity, true, bucket);
    assert.equal(policy.scene.preserveSourceAnchors, true, bucket);
    assert.equal(policy.scene.addDepthEffect, false, bucket);
    assert.equal(policy.pose.shareCanonicalTextAcrossPrimaryOutputs, true, bucket);
    assert.equal(policy.pose.supineSurfaceMode, 'fullSource', bucket);
  }
});

test('fixed composition uses its own non-adjustable camera-distance context instead of unconstrained framing', () => {
  const fixed = createCompositionVisibilityProjection(
    { zh: '胸上特寫', meta: { visibility: 'portrait' } },
    { fixedCompositionActive: true }
  );

  assert.equal(fixed.bucket, COMPOSITION_VISIBILITY_BUCKETS.FIXED_COMPOSITION);
  assert.equal(fixed.composition.source, 'fixedCompositionSet');
  assert.equal(fixed.composition.manualFraming, false);
  assert.equal(fixed.composition.cameraDistanceMode, 'fixedSetDefined');
  assert.equal(fixed.body.mode, 'fullSource');
  assert.deepEqual(fixed.body.zones, ['all']);
  assert.deepEqual(fixed.wardrobe.roles, COMPOSITION_WARDROBE_ROLES);
  assert.deepEqual(fixed.pose.parts, COMPOSITION_POSE_PARTS);
  assert.equal(fixed.pose.mode, 'fullCanonical');
  assert.equal(fixed.scene.mode, 'fixedSetContract');
  assert.equal(fixed.scene.interactionGeometry, 'fixedSetContract');
  assert.equal(fixed.scene.supportObjects, 'fixedSetContract');
  assert.equal(fixed.scene.addDepthEffect, false);

  const ordinaryNone = createCompositionVisibilityProjection(null);
  assert.equal(ordinaryNone.bucket, COMPOSITION_VISIBILITY_BUCKETS.UNCONSTRAINED);
  assert.equal(ordinaryNone.composition.source, 'framingId');
  assert.equal(ordinaryNone.composition.manualFraming, true);
});

test('near crops omit full-body pressure while wider crops progressively restore visible content', () => {
  const face = COMPOSITION_VISIBILITY_CONTRACT[COMPOSITION_VISIBILITY_BUCKETS.FACE_DETAIL];
  const headShoulders = COMPOSITION_VISIBILITY_CONTRACT[COMPOSITION_VISIBILITY_BUCKETS.HEAD_SHOULDERS];
  const chestUp = COMPOSITION_VISIBILITY_CONTRACT[COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP];
  const medium = COMPOSITION_VISIBILITY_CONTRACT[COMPOSITION_VISIBILITY_BUCKETS.MEDIUM_WAIST];
  const cowboy = COMPOSITION_VISIBILITY_CONTRACT[COMPOSITION_VISIBILITY_BUCKETS.COWBOY_KNEE];
  const full = COMPOSITION_VISIBILITY_CONTRACT[COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY];

  assert.equal(face.pose.mode, 'omit');
  assert.equal(face.body.mode, 'omit');
  assert.equal(headShoulders.pose.mode, 'omit');
  assert.equal(headShoulders.body.mode, 'omit');
  assert.deepEqual(headShoulders.pose.parts, []);
  assert.equal(chestUp.pose.mode, 'visibleFragments');
  assert.deepEqual(chestUp.body.zones, ['chest']);
  assert.deepEqual(medium.body.zones, ['chest', 'torso', 'waist', 'abdomen']);
  assert.deepEqual(cowboy.body.zones, ['chest', 'torso', 'waist', 'abdomen', 'hips']);
  assert.equal(medium.wardrobe.roles.includes('bottom'), true);
  assert.equal(cowboy.wardrobe.conditionalRoles.includes('legwear'), true);
  assert.equal(cowboy.wardrobe.roles.includes('shoes'), false);
  assert.deepEqual(full.wardrobe.roles, COMPOSITION_WARDROBE_ROLES);
  assert.deepEqual(full.pose.parts, COMPOSITION_POSE_PARTS);
  assert.equal(full.pose.mode, 'fullCanonical');
  assert.equal(full.body.mode, 'fullSource');
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

test('wardrobe projection shares role decisions and keeps only cowboy-visible legwear', () => {
  const chestUp = createCompositionVisibilityProjection({ zh: '胸上特寫', meta: { visibility: 'portrait' } });
  assert.equal(shouldProjectWardrobeRole(chestUp, 'top', 'cotton camisole'), true);
  assert.equal(shouldProjectWardrobeRole(chestUp, 'bottom', 'straight-leg jeans'), false);

  const cowboy = createCompositionVisibilityProjection({ zh: '牛仔中景 (Cowboy Shot)', meta: { visibility: 'medium' } });
  assert.equal(shouldProjectWardrobeRole(cowboy, 'legwear', 'lace-top thigh-high stockings'), true);
  assert.equal(shouldProjectWardrobeRole(cowboy, 'legwear', 'ribbed ankle socks'), false);
  assert.equal(shouldProjectWardrobeRole(cowboy, 'shoes', 'stiletto pumps'), false);
});

test('pose projection exposes only the approved direct and conditional parts for each crop', () => {
  const headShoulders = createCompositionVisibilityProjection({ zh: '特寫鏡頭 (Close-Up)', meta: { visibility: 'close' } });
  assert.equal(shouldProjectPosePart(headShoulders, 'head'), false);

  const chestUp = createCompositionVisibilityProjection({ zh: '胸上特寫', meta: { visibility: 'portrait' } });
  assert.equal(shouldProjectPosePart(chestUp, 'head'), true);
  assert.equal(shouldProjectPosePart(chestUp, 'postureBase'), false);
  assert.equal(shouldProjectPosePart(chestUp, 'hand'), false);
  assert.equal(shouldProjectPosePart(chestUp, 'hand', { conditional: true }), true);

  const medium = createCompositionVisibilityProjection({ zh: '中景鏡頭 (Medium Shot)', meta: { visibility: 'medium' } });
  assert.equal(shouldProjectPosePart(medium, 'postureBase'), true);
  assert.equal(shouldProjectPosePart(medium, 'lowerBody'), false);

  const cowboy = createCompositionVisibilityProjection({ zh: '牛仔中景 (Cowboy Shot)', meta: { visibility: 'medium' } });
  assert.equal(shouldProjectPosePart(cowboy, 'lowerBody'), true);
  assert.equal(shouldProjectPosePart(cowboy, 'foot'), false);
});

test('scene projection exposes the approved source mode without adding depth treatment', () => {
  const face = createCompositionVisibilityProjection({ zh: '臉部特寫', meta: { visibility: 'close' } });
  assert.equal(face.scene.mode, 'compactSource');
  assert.equal(face.scene.interactionGeometry, 'omit');
  assert.equal(face.scene.supportObjects, 'omit');
  assert.equal(face.scene.addDepthEffect, false);

  const medium = createCompositionVisibilityProjection({ zh: '中景鏡頭 (Medium Shot)', meta: { visibility: 'medium' } });
  assert.equal(medium.scene.mode, 'conciseSource');
  assert.equal(medium.scene.interactionGeometry, 'visibleOnly');
  assert.equal(medium.scene.supportObjects, 'visibleOnly');
  assert.equal(medium.scene.addDepthEffect, false);

  const full = createCompositionVisibilityProjection({ zh: '全身鏡頭 (Full Body Shot)', meta: { visibility: 'full' } });
  assert.equal(full.scene.mode, 'fullSource');
  assert.equal(full.scene.interactionGeometry, 'full');
  assert.equal(full.scene.supportObjects, 'full');
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

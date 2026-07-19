import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  FIXED_COMPOSITION_PROMPT_PROJECTION_VERSION,
  createFixedCompositionPromptProjection,
} from './fixedCompositionPromptProjection.js';

test('fixed composition prompt projection keeps one frozen canonical model for every renderer', () => {
  const top = { id: 'top-camisole', en: 'cotton camisole top' };
  const bottom = { id: 'bottom-jeans', en: 'straight-leg jeans' };
  const topColor = { id: 'white', en: 'white' };
  const fixedCompositionSet = { id: 'black-velvet-sofa', en: 'fixed black velvet sofa set' };
  const fixedSetPosition = { id: 'free-interaction', en: 'free set interaction' };
  const fixedSetBackgroundState = { id: 'none', en: '' };
  const fixedSetCaptureMode = { id: 'photographer-shot', en: 'photographer-shot portrait' };
  const fixedSetPerformanceState = { id: 'model-natural', en: 'natural performance' };
  const angle = { id: 'shoulder-level', en: 'shoulder-level camera' };
  const orbit = { id: 'right-profile', en: 'right profile view' };
  const wardrobe = [top, bottom];
  const wardrobeColors = { topColor };
  const compositionVisibility = {
    bucket: 'fixedComposition',
    composition: {
      source: 'fixedCompositionSet',
      manualFraming: false,
      cameraDistanceMode: 'fixedSetDefined',
    },
  };

  const projection = createFixedCompositionPromptProjection({
    compositionVisibility,
    wardrobe,
    wardrobeColors,
    projectedCanonicalPoseText: 'She presents a relaxed standing pose.',
    fixedCompositionSet,
    fixedSetPosition,
    fixedSetBackgroundState,
    fixedSetCaptureMode,
    fixedSetPerformanceState,
    angle,
    orbit,
  });

  assert.equal(FIXED_COMPOSITION_PROMPT_PROJECTION_VERSION, 1);
  assert.equal(projection.active, true);
  assert.deepEqual(projection.composition, {
    visibilityBucket: 'fixedComposition',
    source: 'fixedCompositionSet',
    manualFraming: false,
    cameraDistanceMode: 'fixedSetDefined',
  });
  assert.notEqual(projection.wardrobe.items, wardrobe);
  assert.deepEqual(projection.wardrobe.items, wardrobe);
  assert.equal(projection.wardrobe.items[0], top);
  assert.notEqual(projection.wardrobe.colors, wardrobeColors);
  assert.equal(projection.wardrobe.colors.topColor, topColor);
  assert.equal(projection.pose.canonicalText, 'She presents a relaxed standing pose.');
  assert.deepEqual(projection.scene, {
    fixedCompositionSet,
    fixedSetPosition,
    fixedSetBackgroundState,
    fixedSetCaptureMode,
    fixedSetPerformanceState,
    angle,
    orbit,
  });
  assert.ok(Object.isFrozen(projection));
  assert.ok(Object.isFrozen(projection.composition));
  assert.ok(Object.isFrozen(projection.wardrobe));
  assert.ok(Object.isFrozen(projection.wardrobe.items));
  assert.ok(Object.isFrozen(projection.wardrobe.colors));
  assert.ok(Object.isFrozen(projection.pose));
  assert.ok(Object.isFrozen(projection.scene));
  assert.deepEqual(wardrobe, [top, bottom]);
  assert.deepEqual(wardrobeColors, { topColor });
});

test('fixed composition prompt projection stays absent outside an active fixed set', () => {
  assert.equal(createFixedCompositionPromptProjection({ fixedCompositionSet: null }), null);
  assert.equal(createFixedCompositionPromptProjection({ fixedCompositionSet: { id: 'none' } }), null);
});

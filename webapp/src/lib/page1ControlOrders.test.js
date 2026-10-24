import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getLockControls } from './engine.js';
import { getSectionKeys } from '../features/page1/page1Schema.js';
import { SCENE_CAMERA_CONTROL_ORDER } from './page1ControlOrders.js';

test('PAGE1 scene camera controls include fixed composition controls', () => {
  assert.ok(SCENE_CAMERA_CONTROL_ORDER.includes('fixedCompositionSetId'));
  assert.ok(SCENE_CAMERA_CONTROL_ORDER.includes('fixedSetPositionId'));
  assert.ok(SCENE_CAMERA_CONTROL_ORDER.includes('fixedSetBackgroundStateId'));
  assert.ok(SCENE_CAMERA_CONTROL_ORDER.includes('fixedSetCaptureModeId'));
  assert.ok(SCENE_CAMERA_CONTROL_ORDER.includes('fixedSetPerformanceStateId'));
  assert.equal(SCENE_CAMERA_CONTROL_ORDER.includes('aspectRatio'), false);
});

// P3 (2026-10-20): lyingCameraId was in the schema panel but missing here, so the
// core section never built it and the field silently did not render.
test('every core control listed in the scene and photography panels is in the scene camera order', () => {
  const controls = getLockControls();
  const coreKeys = [...getSectionKeys('scene'), ...getSectionKeys('photography')]
    .filter((key) => controls.find((control) => control.key === key)?.section === 'core');
  assert.ok(coreKeys.includes('lyingCameraId'));
  assert.deepEqual(coreKeys.filter((key) => !SCENE_CAMERA_CONTROL_ORDER.includes(key)), []);
});

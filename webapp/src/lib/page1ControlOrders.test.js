import assert from 'node:assert/strict';
import { test } from 'node:test';

import { SCENE_CAMERA_CONTROL_ORDER } from './page1ControlOrders.js';

test('PAGE1 scene camera controls include fixed composition controls', () => {
  assert.ok(SCENE_CAMERA_CONTROL_ORDER.includes('fixedCompositionSetId'));
  assert.ok(SCENE_CAMERA_CONTROL_ORDER.includes('fixedSetPositionId'));
  assert.ok(SCENE_CAMERA_CONTROL_ORDER.includes('fixedSetBackgroundStateId'));
  assert.ok(SCENE_CAMERA_CONTROL_ORDER.includes('fixedSetCaptureModeId'));
  assert.ok(SCENE_CAMERA_CONTROL_ORDER.includes('fixedSetPerformanceStateId'));
  assert.equal(SCENE_CAMERA_CONTROL_ORDER.includes('aspectRatio'), false);
});

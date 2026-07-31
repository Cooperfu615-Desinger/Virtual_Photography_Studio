import assert from 'node:assert/strict';
import test from 'node:test';

import {
  POSE_COMPOSER_CONTROL_KEYS,
  POSE_COMPOSER_KEYS,
  SECTION_SUBPANELS,
  WORKSPACE_SECTIONS,
  getSectionKeys,
} from './page1Schema.js';

test('PAGE1 workspace schema defines every navigation section and unique panel ids', () => {
  assert.deepEqual(WORKSPACE_SECTIONS.map((section) => section.id), [
    'character',
    'pose',
    'wardrobe',
    'scene',
    'photography',
    'midjourney',
  ]);

  WORKSPACE_SECTIONS.forEach(({ id }) => {
    const panelIds = SECTION_SUBPANELS[id].map((panel) => panel.id);
    assert.ok(panelIds.length > 0);
    assert.equal(new Set(panelIds).size, panelIds.length);
    assert.ok(getSectionKeys(id).length > 0);
  });
});

test('MJ parameters have a dedicated F section and stay outside engine random controls', () => {
  assert.deepEqual(getSectionKeys('midjourney'), [
    'mjVersionId',
    'mjAspectRatio',
    'mjRawMode',
    'mjStylize',
    'mjChaos',
    'mjWeirdness',
    'mjResolution',
  ]);
  assert.equal(SECTION_SUBPANELS.midjourney[0].randomization, 'excluded');
});

test('Pose Composer keeps the independent prop control outside the five-layer batch random keys', () => {
  assert.deepEqual(POSE_COMPOSER_KEYS, [
    'poseBaseId',
    'poseArrangementId',
    'poseHandId',
    'poseHeadId',
    'poseAnchorId',
  ]);
  assert.deepEqual(POSE_COMPOSER_CONTROL_KEYS, [
    'poseBaseId',
    'poseArrangementId',
    'poseHandId',
    'posePropId',
    'poseHeadId',
    'poseAnchorId',
  ]);
});

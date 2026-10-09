import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SINGLE_IDENTITY_GROUPS, SECTION_SUBPANELS } from '../features/page1/page1Schema.js';

import {
  PAGE1_SECTION_SUBPANELS,
  isPage1PoseSubpanelDisabled,
  resolvePage1ActiveSubpanel,
} from './page1WorkspacePanels.js';

test('single identity cards retain all six existing fields exactly once and leave person count outside', () => {
  assert.deepEqual(SINGLE_IDENTITY_GROUPS.map(group => group.label), ['外貌', '頭髮']);
  const keys = SINGLE_IDENTITY_GROUPS.flatMap(group => group.keys);
  assert.equal(new Set(keys).size, 6);
  assert.deepEqual(keys, ['bodyTypeId', 'facialFeaturesId', 'skinDetailsId', 'hairstyleId', 'hairStylingStateId', 'hairColorId']);
  const identity = SECTION_SUBPANELS.character.find(panel => panel.id === 'identity');
  keys.forEach(key => assert.ok(identity.keys.includes(key), key));
  assert.ok(!keys.includes('subjectCount'));
});

test('page1 pose panels split single and duo settings without legacy pose controls', () => {
  const posePanels = PAGE1_SECTION_SUBPANELS.pose;
  const singlePanel = posePanels.find((panel) => panel.id === 'single');
  const duoPanel = posePanels.find((panel) => panel.id === 'duo');

  assert.ok(singlePanel);
  assert.ok(duoPanel);
  assert.equal(singlePanel.label, '單人設置');
  assert.equal(duoPanel.label, '雙人設置');
  assert.deepEqual(singlePanel.keys, [
    'expressionId',
    'poseBaseId',
    'poseOrientationId',
    'poseArrangementId',
    'poseHandId',
    'posePropId',
    'poseHeadId',
    'poseAnchorId',
  ]);
  assert.deepEqual(duoPanel.keys, [
    'duoPoseId',
    'duoPoseBaseId',
    'duoExpressionId',
  ]);
  assert.equal(singlePanel.keys.includes('poseId'), false);
  assert.equal(duoPanel.keys.includes('poseId'), false);
  assert.equal(singlePanel.keys.includes('specialActionId'), false);
  assert.equal(duoPanel.keys.includes('specialActionId'), false);
});

test('page1 pose panels disable the opposite subject-count mode', () => {
  const [singlePanel, duoPanel] = PAGE1_SECTION_SUBPANELS.pose;

  assert.equal(isPage1PoseSubpanelDisabled(singlePanel, '1'), false);
  assert.equal(isPage1PoseSubpanelDisabled(duoPanel, '1'), true);
  assert.equal(isPage1PoseSubpanelDisabled(singlePanel, '2'), true);
  assert.equal(isPage1PoseSubpanelDisabled(duoPanel, '2'), false);
});

test('page1 pose active subpanel resolves to the enabled mode', () => {
  const singlePanel = PAGE1_SECTION_SUBPANELS.pose.find((panel) => panel.id === 'single');
  const duoPanel = PAGE1_SECTION_SUBPANELS.pose.find((panel) => panel.id === 'duo');

  const resolvedSingle = resolvePage1ActiveSubpanel('pose', duoPanel, { subjectCount: '1' });
  const resolvedDuo = resolvePage1ActiveSubpanel('pose', singlePanel, { subjectCount: '2' });

  assert.equal(resolvedSingle.id, 'single');
  assert.equal(resolvedDuo.id, 'duo');
});

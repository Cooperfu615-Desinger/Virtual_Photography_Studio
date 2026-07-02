import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PAGE1_SECTION_SUBPANELS,
  isPage1PoseSubpanelDisabled,
  resolvePage1ActiveSubpanel,
} from './page1WorkspacePanels.js';

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
    'poseArrangementId',
    'poseHandId',
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

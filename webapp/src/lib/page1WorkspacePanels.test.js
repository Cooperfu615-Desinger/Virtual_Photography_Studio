import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PAGE1_SECTION_SUBPANELS, resolvePage1ActiveSubpanel } from './page1WorkspacePanels.js';

test('page1 pose panels hide the deprecated special action control', () => {
  const posePanels = PAGE1_SECTION_SUBPANELS.pose;
  const basicPanel = posePanels.find((panel) => panel.id === 'basic');
  const composerPanel = posePanels.find((panel) => panel.id === 'composer');

  assert.ok(basicPanel);
  assert.ok(composerPanel);
  assert.equal(basicPanel.keys.includes('specialActionId'), false);
  assert.equal(composerPanel.keys.includes('specialActionId'), false);
  assert.ok(composerPanel.keys.includes('poseHandId'));
  assert.match(composerPanel.description, /手部 \/ 道具動作/);
});

test('special subject pose special-settings tab keeps pose composer controls', () => {
  const composerSubpanel = {
    id: 'composer',
    description: '用 Pose Composer 精準組合姿勢基底、肢體變化、手部、頭部與接觸點；目前僅支援單人。',
    keys: ['poseBaseId', 'poseArrangementId', 'poseHandId', 'poseHeadId', 'poseAnchorId'],
  };

  const resolved = resolvePage1ActiveSubpanel('pose', composerSubpanel, { isSpecialSubjectMode: true });

  assert.deepEqual(resolved.keys, composerSubpanel.keys);
  assert.equal(resolved.description, composerSubpanel.description);
  assert.match(resolved.description, /Pose Composer/);
});

test('normal pose special-settings tab keeps pose composer controls', () => {
  const composerSubpanel = {
    id: 'composer',
    description: '用 Pose Composer 精準組合姿勢基底、肢體變化、手部、頭部與接觸點；目前僅支援單人。',
    keys: ['poseBaseId', 'poseArrangementId', 'poseHandId', 'poseHeadId', 'poseAnchorId'],
  };

  const resolved = resolvePage1ActiveSubpanel('pose', composerSubpanel, { isSpecialSubjectMode: false });

  assert.deepEqual(resolved.keys, composerSubpanel.keys);
  assert.equal(resolved.description, composerSubpanel.description);
});

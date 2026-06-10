import assert from 'node:assert/strict';
import { test } from 'node:test';

import { resolvePage1ActiveSubpanel } from './page1WorkspacePanels.js';

test('special subject pose special-settings tab shows special actions instead of pose composer controls', () => {
  const composerSubpanel = {
    id: 'composer',
    description: '用 Pose Composer 精準組合姿勢基底、肢體變化、手部、頭部與接觸點；目前僅支援單人。',
    keys: ['poseBaseId', 'poseArrangementId', 'poseHandId', 'poseHeadId', 'poseAnchorId'],
  };

  const resolved = resolvePage1ActiveSubpanel('pose', composerSubpanel, { isSpecialSubjectMode: true });

  assert.deepEqual(resolved.keys, ['specialActionId']);
  assert.match(resolved.description, /特殊動作/);
  assert.doesNotMatch(resolved.description, /Pose Composer/);
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

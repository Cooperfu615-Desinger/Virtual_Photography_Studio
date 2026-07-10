import assert from 'node:assert/strict';
import test from 'node:test';

import { createEmptyLocks, getLockControls } from '../../lib/engine.js';
import { transitionPage1Locks } from './lockTransitions.js';

function optionId(controls, key, zh) {
  return controls.find((control) => control.key === key)?.options.find((option) => option.zh === zh)?.id;
}

test('page1 transition keeps special subject and character profile mutually exclusive', () => {
  const controls = getLockControls();
  const previousLocks = createEmptyLocks();
  const specialSubjectId = controls.find((control) => control.key === 'specialSubjectId')
    .options.find((option) => option.specialSubject)?.id;
  const characterProfileId = controls.find((control) => control.key === 'characterProfileId')
    .options.find((option) => option.specialSubject)?.id;

  const next = transitionPage1Locks({
    previousLocks,
    candidateLocks: { ...previousLocks, specialSubjectId, characterProfileId, subjectCount: '2' },
    lockControls: controls,
  });

  assert.equal(next.specialSubjectId, specialSubjectId);
  assert.equal(next.characterProfileId, 'none');
  assert.equal(next.subjectCount, '1');
});

test('page1 transition makes pose composer override legacy pose and special action', () => {
  const controls = getLockControls();
  const previousLocks = createEmptyLocks();
  const next = transitionPage1Locks({
    previousLocks,
    candidateLocks: {
      ...previousLocks,
      poseId: optionId(controls, 'poseId', '自然站立'),
      specialActionId: optionId(controls, 'specialActionId', '抽菸'),
      poseBaseId: optionId(controls, 'poseBaseId', '站姿'),
    },
    lockControls: controls,
  });

  assert.equal(next.poseId, '');
  assert.equal(next.specialActionId, '');
  assert.notEqual(next.poseBaseId, 'none');
});

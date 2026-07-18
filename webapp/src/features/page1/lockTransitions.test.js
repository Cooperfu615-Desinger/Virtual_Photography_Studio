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

test('page1 transition lets an explicit prop take over hand and clears props in duo mode', () => {
  const controls = getLockControls();
  const previousLocks = createEmptyLocks();
  const handId = optionId(controls, 'poseHandId', '單手摸下巴');
  const propId = optionId(controls, 'posePropId', '手持冰咖啡');
  const propNext = transitionPage1Locks({
    previousLocks,
    candidateLocks: {
      ...previousLocks,
      poseHandId: handId,
      posePropId: propId,
    },
    lockControls: controls,
  });
  assert.equal(propNext.poseHandId, 'none');
  assert.equal(propNext.posePropId, propId);

  const duoNext = transitionPage1Locks({
    previousLocks: propNext,
    candidateLocks: { ...propNext, subjectCount: '2' },
    lockControls: controls,
  });
  assert.equal(duoNext.posePropId, 'none');
});

test('page1 close-up transitions preserve hidden selections and restore them at full body', () => {
  const controls = getLockControls();
  const previousLocks = {
    ...createEmptyLocks(),
    framingId: optionId(controls, 'framingId', '全身鏡頭 (Full Body Shot)'),
    characterProfileId: 'character-rika',
    bodyTypeId: optionId(controls, 'bodyTypeId', '小隻精緻身形'),
    topId: optionId(controls, 'topId', '襯衫'),
    skirtId: optionId(controls, 'skirtId', '百褶短裙'),
    outerwearId: optionId(controls, 'outerwearId', '丹寧外套'),
    legwearId: optionId(controls, 'legwearId', '羅紋短襪'),
    shoesId: optionId(controls, 'shoesId', 'Samba OG'),
    poseBaseId: optionId(controls, 'poseBaseId', '站姿'),
    poseArrangementId: optionId(controls, 'poseArrangementId', '一腳向前點地'),
    poseHandId: optionId(controls, 'poseHandId', '一手扶腰一手自然放下'),
    poseHeadId: optionId(controls, 'poseHeadId', '頭部微微側傾'),
    poseAnchorId: optionId(controls, 'poseAnchorId', '鏡面不鏽鋼立方台'),
    locationId: optionId(controls, 'locationId', '室內：復古美式 Diner'),
  };
  const preservedKeys = [
    'characterProfileId',
    'bodyTypeId',
    'topId',
    'skirtId',
    'outerwearId',
    'legwearId',
    'shoesId',
    'poseBaseId',
    'poseArrangementId',
    'poseHandId',
    'poseHeadId',
    'poseAnchorId',
    'locationId',
  ];

  const closeupLocks = transitionPage1Locks({
    previousLocks,
    candidateLocks: {
      ...previousLocks,
      framingId: optionId(controls, 'framingId', '臉部特寫'),
    },
    lockControls: controls,
  });

  for (const key of preservedKeys) {
    assert.equal(closeupLocks[key], previousLocks[key], `${key} should survive the close-up transition`);
  }

  const restoredLocks = transitionPage1Locks({
    previousLocks: closeupLocks,
    candidateLocks: {
      ...closeupLocks,
      framingId: optionId(controls, 'framingId', '全身鏡頭 (Full Body Shot)'),
    },
    lockControls: controls,
  });

  for (const key of preservedKeys) {
    assert.equal(restoredLocks[key], previousLocks[key], `${key} should return unchanged at full body`);
  }
});

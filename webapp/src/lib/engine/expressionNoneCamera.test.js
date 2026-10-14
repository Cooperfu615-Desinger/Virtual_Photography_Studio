import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import { buildAllNoneLocks } from '../../features/page1/page1Selectors.js';

const controls = getLockControls();
const optionByLabel = (key, label) => {
  const option = controls.find((control) => control.key === key)
    ?.options.find((candidate) => candidate.zh === label);
  assert.ok(option, `Missing ${key} option: ${label}`);
  return option;
};

const noExtraExpressionId = optionByLabel('expressionId', '無額外表情').id;
const noneFramingId = optionByLabel('framingId', '全無').id;
const birdEyeId = optionByLabel('angleId', '鳥瞰視角').id;
const frontOrbitId = optionByLabel('orbitId', '正面 0 度').id;

for (const [name, overrides] of [
  ['ordinary single no-extra expression', { subjectCount: '1' }],
  ['station single no-extra expression', {
    subjectCount: '1', fixedCompositionSetId: 'yamanote-platform-advertising',
  }],
  ['duo shared none with dormant A/B no-extra expressions', { subjectCount: '2' }],
  ['duo legacy A/B no-extra expressions without shared expression locks', {
    subjectCount: '2', duoExpressionId: '', expressionId: '',
  }],
]) {
  test(`${name} preserves the explicit bird-eye camera when framing is none`, () => {
    const locks = {
      ...buildAllNoneLocks(controls, createEmptyLocks()),
      framingId: noneFramingId,
      angleId: birdEyeId,
      orbitId: frontOrbitId,
      lensId: optionByLabel('lensId', '28mm 廣角').id,
      ...overrides,
    };
    assert.equal(locks.expressionAId, noExtraExpressionId);
    assert.equal(locks.expressionBId, noExtraExpressionId);
    if (overrides.expressionId !== '') assert.equal(locks.expressionId, noExtraExpressionId);

    const result = generatePrompts(1, locks, [], {
      random: createSeededRandom('station-fixed-v1'),
    })[0];

    assert.equal(result.selection.framingId, noneFramingId);
    assert.equal(result.selection.angleId, birdEyeId, 'semantic none must not trigger camera compatibility fallback');
    assert.equal(result.selection.orbitId, frontOrbitId);
    assert.equal(result.selection.subjectCount, locks.subjectCount);
  });
}

test('a real medium crop retains the historical bird-eye fallback with no-extra expression', () => {
  const mediumFramingId = optionByLabel('framingId', '中景鏡頭 (Medium Shot)').id;
  const locks = {
    ...buildAllNoneLocks(controls, createEmptyLocks()),
    framingId: mediumFramingId,
    expressionId: noExtraExpressionId,
    angleId: birdEyeId,
    orbitId: frontOrbitId,
    lensId: optionByLabel('lensId', '28mm 廣角').id,
  };
  const result = generatePrompts(1, locks, [], {
    random: createSeededRandom('station-fixed-v1'),
  })[0];

  assert.equal(result.selection.framingId, mediumFramingId);
  assert.equal(result.selection.angleId, optionByLabel('angleId', '肩部高度鏡頭').id);
  assert.notEqual(result.selection.angleId, birdEyeId, 'only none framing bypasses the existing crop restriction');
});

test('legacy fixed-scene managed framing retains its historical angle compatibility', () => {
  const fixedSetId = optionByLabel('fixedCompositionSetId', '暖灰泥黑絲絨工業沙發棚').id;
  const locks = {
    ...buildAllNoneLocks(controls, createEmptyLocks()),
    fixedCompositionSetId: fixedSetId,
    expressionId: noExtraExpressionId,
    angleId: birdEyeId,
    orbitId: frontOrbitId,
  };
  const result = generatePrompts(1, locks, [], {
    random: createSeededRandom('station-fixed-v1'),
  })[0];

  assert.equal(result.selection.fixedCompositionSetId, fixedSetId);
  assert.equal(result.selection.framingId, noneFramingId);
  assert.notEqual(result.selection.angleId, birdEyeId, 'managed none framing keeps the fixed-scene policy');
});

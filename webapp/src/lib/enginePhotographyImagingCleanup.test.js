import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildPhotographyStylePrompt,
  createEmptyLocks,
  generatePrompts,
  getLockControls,
  isWormEyeAngleId,
  normalizeLocks,
  sanitizeLocksForCloseupMode,
} from './engine.js';

function control(key) {
  const entry = getLockControls().find((item) => item.key === key);
  assert.ok(entry, `Missing control ${key}`);
  return entry;
}

function optionByLabel(key, label) {
  const option = control(key).options.find((item) => item.zh === label);
  assert.ok(option, `Missing option ${label} in ${key}`);
  return option;
}

function optionById(key, id) {
  const option = control(key).options.find((item) => item.id === id);
  assert.ok(option, `Missing option id ${id} in ${key}`);
  return option;
}

function options(key) {
  return control(key).options;
}

test('composition and angle prompts stay geometric instead of emotional', () => {
  const cameraGeometryOptions = [
    ...options('framingId'),
    ...options('angleId'),
    ...options('orbitId'),
  ].filter((item) => item.zh !== '全無');

  for (const option of cameraGeometryOptions) {
    assert.doesNotMatch(
      option.en,
      /heroic|dominance|vulnerable|cute|dynamic pose|unsettling|cinematic tension/i,
      `${option.zh} should describe camera geometry instead of subject mood`
    );
  }

  assert.match(optionByLabel('angleId', '地面高度鏡頭').en, /floor-level camera position/);
  assert.match(optionByLabel('angleId', '蟲眼視角鏡頭').en, /ultra-low upward camera/);
  assert.match(optionByLabel('angleId', '蟲眼視角鏡頭').en, /ultra-wide lens perspective/);
  assert.match(optionByLabel('angleId', '蟲眼視角鏡頭').en, /feet extremely close to the lens/);
  assert.match(optionByLabel('angleId', '高位俯視鏡頭').en, /looking downward/);
});

test('worm-eye angle forces photography style and lens optics to none', () => {
  const controls = getLockControls();
  const wormEye = optionByLabel('angleId', '蟲眼視角鏡頭');
  const style = optionByLabel('styleId', 'Ellen von Unwerth（艾倫・馮・昂沃斯）');
  const lens = optionByLabel('lensId', '105mm 中長焦');
  const opticalEffect = optionByLabel('opticalEffectId', '前景遮擋散景');
  const noneStyle = optionByLabel('styleId', '全無');
  const noneLens = optionByLabel('lensId', '全無');
  const noneOpticalEffect = optionByLabel('opticalEffectId', '全無');

  assert.equal(isWormEyeAngleId(wormEye.id), true);

  const sanitized = sanitizeLocksForCloseupMode({
    ...createEmptyLocks(),
    angleId: wormEye.id,
    styleId: style.id,
    lensId: lens.id,
    opticalEffectId: opticalEffect.id,
  }, controls);

  assert.equal(sanitized.styleId, noneStyle.id);
  assert.equal(sanitized.lensId, noneLens.id);
  assert.equal(sanitized.opticalEffectId, noneOpticalEffect.id);

  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    angleId: wormEye.id,
    styleId: style.id,
    lensId: lens.id,
    opticalEffectId: opticalEffect.id,
  });

  assert.equal(prompt.selection.styleId, noneStyle.id);
  assert.equal(prompt.selection.lensId, noneLens.id);
  assert.equal(prompt.selection.opticalEffectId, noneOpticalEffect.id);
  assert.match(prompt.grokPrompt, /ultra-low upward camera/);
  assert.doesNotMatch(prompt.grokPrompt, /Inspired by Ellen von Unwerth/);
  assert.doesNotMatch(prompt.grokPrompt, /105mm medium telephoto lens/);
  assert.doesNotMatch(prompt.grokPrompt, /blurred foreground occlusion near the lens/);
});

test('camera angle control uses height-based definitions with legacy lock migration', () => {
  const angleLabels = options('angleId').map((item) => item.zh);

  assert.deepEqual(angleLabels, [
    '全無',
    '高位俯視鏡頭',
    '平視高度鏡頭',
    '肩部高度鏡頭',
    '腰部高度鏡頭',
    '膝蓋高度鏡頭',
    '地面高度鏡頭',
    '蟲眼視角鏡頭',
    '鳥瞰視角',
    '正上方俯視鏡頭',
    '荷蘭角/傾斜 (Dutch Angle)',
  ]);

  assert.ok(!angleLabels.includes('平視角 (Eye-Level Angle)'));
  assert.ok(!angleLabels.includes('仰角 (Low Angle)'));
  assert.ok(!angleLabels.includes('俯角 (High Angle)'));

  const oldEyeLevel = 'camera:相機視角-angle:平視角-eye-level-angle:1';
  const oldLowAngle = 'camera:相機視角-angle:仰角-low-angle:6';
  const oldHighAngle = 'camera:相機視角-angle:俯角-high-angle:7';
  const oldGroundLevel = 'camera:相機視角-angle:地面高度鏡頭:5';

  assert.equal(optionById('angleId', normalizeLocks({ ...createEmptyLocks(), angleId: oldEyeLevel }).angleId).zh, '平視高度鏡頭');
  assert.equal(optionById('angleId', normalizeLocks({ ...createEmptyLocks(), angleId: oldLowAngle }).angleId).zh, '地面高度鏡頭');
  assert.equal(optionById('angleId', normalizeLocks({ ...createEmptyLocks(), angleId: oldHighAngle }).angleId).zh, '高位俯視鏡頭');
  assert.equal(optionById('angleId', normalizeLocks({ ...createEmptyLocks(), angleId: oldGroundLevel }).angleId).zh, '地面高度鏡頭');

  assert.ok(!optionByLabel('angleId', '高位俯視鏡頭').meta.tags.includes('aerial'));
  assert.ok(optionByLabel('angleId', '鳥瞰視角').meta.tags.includes('aerial'));
});

test('duo angle overrides stay geometric after angle cleanup', () => {
  const dutchAngle = optionByLabel('angleId', '荷蘭角/傾斜 (Dutch Angle)');
  const prompt = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '2',
    angleId: dutchAngle.id,
  })[0].grokPrompt;

  assert.doesNotMatch(prompt, /dominant|cinematic tension/i);
  assert.match(prompt, /tilted two-subject framing/);

  const wormEye = optionByLabel('angleId', '蟲眼視角鏡頭');
  const wormEyePrompt = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '2',
    angleId: wormEye.id,
  })[0].grokPrompt;

  assert.match(wormEyePrompt, /ultra-low upward camera/);
  assert.match(wormEyePrompt, /ultra-wide lens perspective/);
  assert.match(wormEyePrompt, /feet extremely close to the lens/);
});

test('orbit control uses degree-based body orientation with legacy lock migration', () => {
  const orbitLabels = options('orbitId').map((item) => item.zh);

  assert.deepEqual(orbitLabels, [
    '全無',
    '正面 0 度',
    '左前 45 度',
    '左側 90 度',
    '左後 135 度',
    '背面 180 度',
    '右後 225 度',
    '右側 270 度',
    '右前 315 度',
  ]);

  assert.ok(!orbitLabels.includes('左前斜側'));
  assert.ok(!orbitLabels.includes('左後斜側'));
  assert.ok(!orbitLabels.includes('右後斜側'));
  assert.ok(!orbitLabels.includes('右前斜側'));

  const oldFront = 'camera:拍攝方位-orbit-angle:正面:1';
  const oldLeftFront = 'camera:拍攝方位-orbit-angle:左前斜側:2';
  const oldLeftSide = 'camera:拍攝方位-orbit-angle:左側:3';
  const oldLeftRear = 'camera:拍攝方位-orbit-angle:左後斜側:4';
  const oldBack = 'camera:拍攝方位-orbit-angle:背面:5';
  const oldRightRear = 'camera:拍攝方位-orbit-angle:右後斜側:6';
  const oldRightSide = 'camera:拍攝方位-orbit-angle:右側:7';
  const oldRightFront = 'camera:拍攝方位-orbit-angle:右前斜側:8';

  assert.equal(optionById('orbitId', normalizeLocks({ ...createEmptyLocks(), orbitId: oldFront }).orbitId).zh, '正面 0 度');
  assert.equal(optionById('orbitId', normalizeLocks({ ...createEmptyLocks(), orbitId: oldLeftFront }).orbitId).zh, '左前 45 度');
  assert.equal(optionById('orbitId', normalizeLocks({ ...createEmptyLocks(), orbitId: oldLeftSide }).orbitId).zh, '左側 90 度');
  assert.equal(optionById('orbitId', normalizeLocks({ ...createEmptyLocks(), orbitId: oldLeftRear }).orbitId).zh, '左後 135 度');
  assert.equal(optionById('orbitId', normalizeLocks({ ...createEmptyLocks(), orbitId: oldBack }).orbitId).zh, '背面 180 度');
  assert.equal(optionById('orbitId', normalizeLocks({ ...createEmptyLocks(), orbitId: oldRightRear }).orbitId).zh, '右後 225 度');
  assert.equal(optionById('orbitId', normalizeLocks({ ...createEmptyLocks(), orbitId: oldRightSide }).orbitId).zh, '右側 270 度');
  assert.equal(optionById('orbitId', normalizeLocks({ ...createEmptyLocks(), orbitId: oldRightFront }).orbitId).zh, '右前 315 度');

  const backView = optionByLabel('orbitId', '背面 180 度');
  assert.match(backView.en, /180-degree rear view/);
  assert.match(backView.en, /body remains rear-facing even if the head turns/);
  assert.doesNotMatch(backView.en, /no frontal face visible/i);
});

test('duo orbit overrides use current degree labels', () => {
  const rightFront = optionByLabel('orbitId', '右前 315 度');
  const prompt = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '2',
    orbitId: rightFront.id,
  })[0].grokPrompt;

  assert.match(prompt, /315-degree front three-quarter duo view/);
  assert.doesNotMatch(prompt, /正面 315 度/);
});

test('camera and film control separates camera profiles from rendering looks', () => {
  const filmControl = control('filmId');
  assert.equal(filmControl.label, '相機 / 底片');

  const labels = filmControl.options.map((item) => item.zh);
  assert.ok(labels.includes('相機｜Ricoh GR 快拍'));
  assert.ok(labels.includes('高銳利快照黑位'));
  assert.ok(!labels.includes('器材成像｜Ricoh GR 快拍'));
  assert.ok(!labels.includes('Ricoh GR 街頭快照感'));

  const cameraProfile = optionByLabel('filmId', '相機｜Ricoh GR 快拍');
  assert.match(cameraProfile.en, /28mm-equivalent snap perspective/);
  assert.match(cameraProfile.en, /compact APS-C camera profile/);

  const renderingLook = optionByLabel('filmId', '高銳利快照黑位');
  assert.doesNotMatch(renderingLook.en, /Ricoh GR/i);
  assert.match(renderingLook.en, /high-acutance snapshot rendering/);
  assert.ok(
    renderingLook.legacyIds.some((id) => id.includes('ricoh-gr-街頭快照感')),
    'renamed rendering look should keep the old lock id'
  );
});

test('lens and optical effects stay concise while foreground occlusion still blocks part of the frame', () => {
  for (const option of options('lensId').filter((item) => item.zh !== '全無')) {
    const wordCount = option.en.split(/\s+/).filter(Boolean).length;
    assert.ok(wordCount <= 24, `${option.zh} should stay compact`);
  }

  const foregroundOcclusion = optionByLabel('opticalEffectId', '前景遮擋散景');
  assert.match(foregroundOcclusion.en, /meaningful partial frame coverage/);
  assert.match(foregroundOcclusion.en, /thick near-field bokeh veil/);
  assert.doesNotMatch(foregroundOcclusion.en, /one third/i);

  const opticalMist = optionByLabel('opticalEffectId', '光學朦朧薄霧');
  assert.match(opticalMist.en, /lens-only mist-filter haze/);
  assert.doesNotMatch(opticalMist.en, /no environmental fog/i);
});

test('generated prompts expose camera film as a single D-section rendering layer', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    filmId: optionByLabel('filmId', '相機｜Ricoh GR 快拍').id,
    lensId: optionByLabel('lensId', '35mm 廣角 (人文視角)').id,
    opticalEffectId: optionByLabel('opticalEffectId', '前景遮擋散景').id,
  });

  assert.match(prompt.grokPrompt, /Camera Look:\n[\s\S]*Ricoh GR compact APS-C camera profile/);
  assert.match(prompt.grokPrompt, /Camera Look:\n[\s\S]*shot on 35mm lens/);
  assert.match(prompt.grokPrompt, /Camera Look:\n[\s\S]*blurred foreground occlusion near the lens/);
  assert.match(prompt.zImagePrompt, /meaningful partial frame coverage/);
  assert.match(prompt.summary, /鏡頭：[^|]*相機｜Ricoh GR 快拍/);
});

test('photography style prompts stay focused on image language', () => {
  const ellen = optionByLabel('styleId', 'Ellen von Unwerth（艾倫・馮・昂沃斯）');
  const leslie = optionByLabel('styleId', 'Leslie Kee（レスリー・キー）');
  const eikoh = optionByLabel('styleId', 'Eikoh Hosoe（細江英公）');

  assert.doesNotMatch(buildPhotographyStylePrompt(ellen), /sensual/i);
  assert.doesNotMatch(buildPhotographyStylePrompt(leslie), /skin rendering/i);
  assert.doesNotMatch(buildPhotographyStylePrompt(eikoh), /body tension/i);
});

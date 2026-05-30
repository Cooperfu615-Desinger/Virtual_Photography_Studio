import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls } from './engine.js';

function control(key) {
  const entry = getLockControls().find((item) => item.key === key);
  assert.ok(entry, `Expected control ${key}`);
  return entry;
}

function optionId(controlKey, zh) {
  const option = control(controlKey).options.find((entry) => entry.zh === zh);
  assert.ok(option, `Expected option ${zh} in ${controlKey}`);
  return option.id;
}

test('pose composer controls expose base arrangement hand and anchor options', () => {
  assert.ok(control('poseBaseId').options.some((option) => option.zh === '站姿'));
  assert.ok(control('poseBaseId').options.some((option) => option.zh === '躺姿'));
  assert.ok(control('poseArrangementId').options.some((option) => option.zh === '單腳重心' && option.base === 'standing'));
  assert.ok(control('poseArrangementId').options.some((option) => option.zh === '隨性慵懶' && option.base === 'lying'));
  assert.ok(control('poseHandId').options.some((option) => option.zh === '單手摸下巴'));
  assert.ok(control('poseHeadId').options.some((option) => option.zh === '頭部微微側傾'));
  assert.ok(control('poseAnchorId').options.some((option) => option.zh === '站在門框邊' && option.base === 'standing'));
  assert.ok(control('poseAnchorId').options.some((option) => option.zh === '浴缸' && option.bases.includes('lying')));
});

test('single-subject pose composer outputs natural base arrangement hand anchor and head direction in all prompt versions', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    poseBaseId: optionId('poseBaseId', '站姿'),
    poseArrangementId: optionId('poseArrangementId', '單腳重心'),
    poseHandId: optionId('poseHandId', '單手摸下巴'),
    poseAnchorId: optionId('poseAnchorId', '站在門框邊'),
    poseHeadId: optionId('poseHeadId', '頭部微微側傾'),
  });

  for (const text of [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt]) {
    assert.match(text, /She is standing beside a doorway frame with/);
    assert.match(text, /one-leg weight shift/);
    assert.match(text, /one hand touching the chin/);
    assert.match(text, /head slightly tilted/);
  }
});

test('lying pose composer supports languid arrangement bathtub anchor and head direction', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    poseBaseId: optionId('poseBaseId', '躺姿'),
    poseArrangementId: optionId('poseArrangementId', '隨性慵懶'),
    poseHandId: optionId('poseHandId', '單手托下巴'),
    poseAnchorId: optionId('poseAnchorId', '浴缸'),
    poseHeadId: optionId('poseHeadId', '回頭朝向鏡頭'),
  });

  assert.match(prompt.grokPrompt, /She is reclining inside a bathtub with/);
  assert.match(prompt.grokPrompt, /casually languid lying arrangement/);
  assert.match(prompt.grokPrompt, /one hand supporting the chin/);
  assert.match(prompt.grokPrompt, /head turned back toward the camera/);
  assert.match(prompt.zImagePrompt, /reclining inside a bathtub/);
  assert.match(prompt.midjourneyPrompt, /casually languid lying arrangement/);
  assert.equal(prompt.selection.poseBaseId, optionId('poseBaseId', '躺姿'));
  assert.equal(prompt.selection.poseHeadId, optionId('poseHeadId', '回頭朝向鏡頭'));
});

test('shared bathtub anchor phrases naturally for standing sitting and squatting bases', () => {
  const cases = [
    ['站姿', '自然站姿', /She is standing beside a bathtub with/],
    ['坐姿', '自然坐姿', /She is sitting on the edge of a bathtub with/],
    ['蹲姿', '自然蹲姿', /She is squatting inside a bathtub with/],
  ];

  for (const [baseZh, arrangementZh, expected] of cases) {
    const [prompt] = generatePrompts(1, {
      ...createEmptyLocks(),
      subjectCount: '1',
      framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
      poseBaseId: optionId('poseBaseId', baseZh),
      poseArrangementId: optionId('poseArrangementId', arrangementZh),
      poseHandId: optionId('poseHandId', '雙手自然垂放'),
      poseAnchorId: optionId('poseAnchorId', '浴缸'),
      poseHeadId: optionId('poseHeadId', '頭部自然朝向鏡頭'),
    });

    assert.match(prompt.grokPrompt, expected);
  }
});

test('pose composer takes priority over single-subject pose and non-social special action', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    poseId: optionId('poseId', '站姿｜雙臂交疊'),
    specialActionId: optionId('specialActionId', '塗口紅'),
    poseBaseId: optionId('poseBaseId', '坐姿'),
    poseArrangementId: optionId('poseArrangementId', '隨性癱坐'),
    poseHandId: optionId('poseHandId', '雙手放在大腿上'),
    poseAnchorId: optionId('poseAnchorId', '坐在單人雕花絨布椅'),
  });

  assert.match(prompt.grokPrompt, /She is lounging on an ornate single velvet armchair with/);
  assert.match(prompt.grokPrompt, /casually slouched/);
  assert.match(prompt.grokPrompt, /ornate single velvet armchair/);
  assert.doesNotMatch(prompt.grokPrompt, /loosely crossed arms/);
  assert.doesNotMatch(prompt.grokPrompt, /applying lipstick/);
  assert.equal(prompt.selection.poseId, '');
  assert.equal(prompt.selection.specialActionId, '');
});

test('duo mode does not output pose composer', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '2',
    poseBaseId: optionId('poseBaseId', '蹲姿'),
    poseArrangementId: optionId('poseArrangementId', '抱膝蹲'),
    poseHandId: optionId('poseHandId', '雙手扶臉頰'),
    poseAnchorId: optionId('poseAnchorId', '蹲在自動販賣機旁'),
  });

  assert.doesNotMatch(prompt.grokPrompt, /hugging-knees squat/);
  assert.doesNotMatch(prompt.zImagePrompt, /vending machine/);
  assert.equal(prompt.selection.poseBaseId, 'none');
});

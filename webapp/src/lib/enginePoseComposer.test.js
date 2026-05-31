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

function assertArrangementOption(zh, base, expectedEnglish) {
  const option = control('poseArrangementId').options.find((entry) => entry.zh === zh);
  assert.ok(option, `Expected arrangement option ${zh}`);
  assert.equal(option.base, base);
  assert.match(option.en, expectedEnglish);
}

function assertHandOption(zh, expectedEnglish) {
  const option = control('poseHandId').options.find((entry) => entry.zh === zh);
  assert.ok(option, `Expected hand option ${zh}`);
  assert.match(option.en, expectedEnglish);
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

test('pose composer exposes expressive hand interaction batch', () => {
  [
    ['單手扶眼鏡', /adjusting the glasses at the frame or bridge/],
    ['單手把眼鏡拉下', /pulling the glasses slightly down the nose bridge/],
    ['單手碰嘴角', /one hand lightly touching the corner of the mouth/],
    ['單手遮住半邊臉', /partially covering one side of the face/],
    ['雙手整理頭髮', /both hands arranging the hair/],
    ['單手撩起後頸頭髮', /lifting hair away from the nape of the neck/],
    ['單手搭在鎖骨', /one hand resting across the collarbone/],
    ['一手扶腰一手自然放下', /one hand on the waist, the other hand relaxed down/],
    ['一手撐地一手放腿上', /one hand supporting on the ground, the other hand resting on the leg/],
    ['一手扶膝一手垂放', /one hand holding the knee, the other hand hanging relaxed/],
  ].forEach(([zh, expectedEnglish]) => {
    assertHandOption(zh, expectedEnglish);
  });

  assertHandOption('單手撩髮', /brushing hair back from the side of the face/);
  assertHandOption('單手撩髮', /near the temple or ear/);
});

test('expressive hand interactions are preserved in all prompt versions', () => {
  const cases = [
    ['單手扶眼鏡', /adjusting the glasses at the frame or bridge/],
    ['單手把眼鏡拉下', /pulling the glasses slightly down the nose bridge/],
    ['一手撐地一手放腿上', /one hand supporting on the ground, the other hand resting on the leg/],
  ];

  for (const [handZh, expected] of cases) {
    const [prompt] = generatePrompts(1, {
      ...createEmptyLocks(),
      subjectCount: '1',
      framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
      poseBaseId: optionId('poseBaseId', '站姿'),
      poseArrangementId: optionId('poseArrangementId', '交叉腿站姿'),
      poseHandId: optionId('poseHandId', handZh),
      poseHeadId: optionId('poseHeadId', '頭部自然朝向鏡頭'),
    });

    for (const text of [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt]) {
      assert.match(text, expected);
    }
  }
});

test('pose composer exposes new standing sitting and squatting arrangement batch', () => {
  [
    ['交叉腿站姿', 'standing', /crossed-leg standing arrangement/],
    ['膝蓋微彎站姿', 'standing', /soft bent-knee standing arrangement/],
    ['背對回身站姿', 'standing', /back-facing turn-back standing arrangement/],
    ['側身窄站姿', 'standing', /narrow side-facing standing arrangement/],
    ['一腳向前點地', 'standing', /one foot pointed forward/],
    ['單腿屈起坐姿', 'sitting', /one knee drawn up/],
    ['雙腿側放坐姿', 'sitting', /both legs angled to one side/],
    ['坐姿身體前傾', 'sitting', /grounded forward-leaning seated arrangement/],
    ['開闊自信坐姿', 'sitting', /open confident seated arrangement/],
    ['椅緣端坐', 'sitting', /edge-of-seat poised seated arrangement/],
    ['低蹲單腿前伸', 'squatting', /low squat with one leg extended forward/],
    ['側身低蹲', 'squatting', /side-facing low squat/],
    ['腳跟抬起蹲姿', 'squatting', /raised-heel squatting arrangement/],
    ['蹲姿身體前傾', 'squatting', /forward-leaning squatting arrangement/],
    ['緊湊抱膝蹲姿變體', 'squatting', /compact knees-held squat variation/],
  ].forEach(([zh, base, expectedEnglish]) => {
    assertArrangementOption(zh, base, expectedEnglish);
  });
});

test('new arrangement batch is preserved in all prompt versions', () => {
  const cases = [
    ['站姿', '交叉腿站姿', /crossed-leg standing arrangement/],
    ['坐姿', '開闊自信坐姿', /open confident seated arrangement/],
    ['蹲姿', '側身低蹲', /side-facing low squat/],
  ];

  for (const [baseZh, arrangementZh, expected] of cases) {
    const [prompt] = generatePrompts(1, {
      ...createEmptyLocks(),
      subjectCount: '1',
      framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
      poseBaseId: optionId('poseBaseId', baseZh),
      poseArrangementId: optionId('poseArrangementId', arrangementZh),
      poseHandId: optionId('poseHandId', '雙手自然垂放'),
      poseHeadId: optionId('poseHeadId', '頭部自然朝向鏡頭'),
    });

    for (const text of [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt]) {
      assert.match(text, expected);
    }
  }
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
  assert.equal(prompt.selection.poseBaseId, 'none');
  assert.equal(prompt.selection.poseArrangementId, 'none');
  assert.equal(prompt.selection.poseHandId, 'none');
  assert.equal(prompt.selection.poseAnchorId, 'none');
});

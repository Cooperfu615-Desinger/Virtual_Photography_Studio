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

function assertHeadOption(zh, expectedEnglish) {
  const option = control('poseHeadId').options.find((entry) => entry.zh === zh);
  assert.ok(option, `Expected head option ${zh}`);
  assert.match(option.en, expectedEnglish);
}

function assertAnchorOption(zh, base, expectedEnglish) {
  const option = control('poseAnchorId').options.find((entry) => entry.zh === zh);
  assert.ok(option, `Expected anchor option ${zh}`);
  assert.equal(option.base, base);
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

test('pose composer exposes standing lean support anchor options', () => {
  [
    ['靠在欄杆', /leaning lightly against a railing/],
    ['倚靠桌邊', /one hip resting against a table edge/],
    ['肩靠門框', /one shoulder leaning against a doorway frame/],
    ['倚靠窗框', /side of the body lightly supported by a window frame/],
    ['側身靠柱', /side or back lightly leaning against a column/],
    ['倚著椅背', /body lightly leaning against the chair back/],
    ['側身靠自動販賣機', /one shoulder or side leaning against a vending machine/],
    ['倚靠現有場景物件', /leaning against any suitable existing object within the current scene/],
  ].forEach(([zh, expected]) => {
    assertAnchorOption(zh, 'standing', expected);
  });
});

test('pose composer exposes model natural decision options', () => {
  const arrangement = control('poseArrangementId').options.find((option) => option.zh === '模型自然決定');
  assert.ok(arrangement, 'Expected model natural arrangement option');
  assert.ok(arrangement.bases.includes('standing'));
  assert.ok(arrangement.bases.includes('lying'));
  assert.match(arrangement.en, /let the image model choose a clearly varied non-default physically believable body arrangement/);
  assert.match(arrangement.en, /within the selected pose base/);
  assert.match(arrangement.en, /distinct weight shift limb angles torso orientation and asymmetry/);

  assertHandOption('模型自然決定', /let the image model choose natural varied hand placement/);
  assertHandOption('模型自然決定', /without defaulting to stiff arms at the sides/);
  assertHeadOption('模型自然決定', /let the image model choose a natural head angle/);
});

test('model natural decision options become directive variation prompts in all prompt versions', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    poseBaseId: optionId('poseBaseId', '站姿'),
    poseArrangementId: optionId('poseArrangementId', '模型自然決定'),
    poseHandId: optionId('poseHandId', '模型自然決定'),
    poseHeadId: optionId('poseHeadId', '模型自然決定'),
  });

  for (const text of [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt]) {
    assert.match(text, /She is standing\./);
    assert.match(text, /Let the image model choose a clearly varied non-default physically believable body arrangement/);
    assert.match(text, /within the selected pose base/);
    assert.match(text, /distinct weight shift limb angles torso orientation and asymmetry/);
    assert.match(text, /Let the image model choose natural varied hand placement/);
    assert.match(text, /without defaulting to stiff arms at the sides/);
    assert.match(text, /Let the image model choose a natural head angle/);
    assert.doesNotMatch(text, /with let the image model choose/);
  }
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
    ['一手扶腰一手自然放下', /one hand on the waist or hip line with the other hand relaxed along the body or nearby support surface/],
    ['一手撐地一手放腿上', /one hand supporting on the floor or nearby surface with the other hand resting on the leg/],
    ['一手扶膝一手垂放', /one hand holding the knee with the other hand relaxed beside the body or support surface/],
  ].forEach(([zh, expectedEnglish]) => {
    assertHandOption(zh, expectedEnglish);
  });

  assertHandOption('單手撩髮', /brushing hair back from the side of the face/);
  assertHandOption('單手撩髮', /near the temple or ear/);
});

test('generic hand poses adapt beyond standing bases', () => {
  [
    ['雙手自然垂放', /both hands resting naturally along the body or on a nearby support surface/],
    ['雙手撐腰', /both hands placed on the waist or hip line with elbows naturally adapted to the pose/],
    ['雙手背在身後', /both hands drawn behind the back or torso only where physically plausible for the selected pose/],
    ['雙手放在大腿上', /both hands resting on the thighs or nearest upper-leg surface/],
    ['單手托下巴', /one hand supporting the chin with the other hand relaxed along the body or support surface/],
  ].forEach(([zh, expectedEnglish]) => {
    assertHandOption(zh, expectedEnglish);
  });

  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    poseBaseId: optionId('poseBaseId', '躺姿'),
    poseArrangementId: optionId('poseArrangementId', '側躺屈膝'),
    poseHandId: optionId('poseHandId', '雙手自然垂放'),
    poseAnchorId: optionId('poseAnchorId', '躺在沙發上'),
    poseHeadId: optionId('poseHeadId', '頭部自然朝向鏡頭'),
  });

  for (const text of [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt]) {
    assert.match(text, /both hands resting naturally along the body or on a nearby support surface/);
    assert.doesNotMatch(text, /both hands relaxed naturally at the sides/);
  }
});

test('pose composer exposes expanded hand and head direction batch', () => {
  [
    ['雙手在身前交握', /both hands clasped loosely in front of the body/],
    ['單手搭肩', /one hand resting on the opposite shoulder/],
    ['雙手舉過頭頂', /both hands raised overhead/],
    ['單手扶腳踝', /one hand holding the ankle/],
    ['雙手放在頭後', /both hands placed behind the head/],
  ].forEach(([zh, expectedEnglish]) => {
    assertHandOption(zh, expectedEnglish);
  });

  [
    ['頭部微微後仰', /head tilted slightly backward/],
    ['低頭三分之四側臉', /three-quarter side angle/],
    ['越肩回望', /head turned over one shoulder/],
    ['側臉看向遠方', /clean side profile with the face oriented away/],
  ].forEach(([zh, expectedEnglish]) => {
    assertHeadOption(zh, expectedEnglish);
  });
});

test('head direction options stay orientation-only without gaze or expression wording', () => {
  const disallowed = /\b(gaze|expression|eyes?|looking|look)\b/i;
  control('poseHeadId').options
    .filter((option) => !['none', 'random'].includes(option.id))
    .forEach((option) => {
      assert.doesNotMatch(option.en, disallowed, `${option.zh} should stay head-orientation only`);
    });
});

test('pose composer exposes support surface and close-lens head direction batch', () => {
  [
    ['下巴靠近肩線', /chin tucked toward one shoulder line/],
    ['頭部貼近支撐面', /head angled close to a support surface or shoulder line/],
    ['近鏡頭偏轉頭部', /head turned slightly off-axis near the lens/],
    ['頭靠近邊緣支撐', /head angled low near a rim or support edge/],
  ].forEach(([zh, expectedEnglish]) => {
    assertHeadOption(zh, expectedEnglish);
  });
});

test('support surface head directions are preserved in all prompt versions', () => {
  const cases = [
    {
      baseZh: '躺姿',
      arrangementZh: '側躺屈膝',
      anchorZh: '躺在沙發上',
      headZh: '頭部貼近支撐面',
      expected: /head angled close to a support surface or shoulder line/,
    },
    {
      baseZh: '坐姿',
      arrangementZh: '單腿屈起坐姿',
      anchorZh: '坐在床邊',
      headZh: '近鏡頭偏轉頭部',
      expected: /head turned slightly off-axis near the lens/,
    },
  ];

  for (const { baseZh, arrangementZh, anchorZh, headZh, expected } of cases) {
    const [prompt] = generatePrompts(1, {
      ...createEmptyLocks(),
      subjectCount: '1',
      framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
      poseBaseId: optionId('poseBaseId', baseZh),
      poseArrangementId: optionId('poseArrangementId', arrangementZh),
      poseHandId: optionId('poseHandId', '雙手自然垂放'),
      poseAnchorId: optionId('poseAnchorId', anchorZh),
      poseHeadId: optionId('poseHeadId', headZh),
    });

    for (const text of [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt]) {
      assert.match(text, expected);
    }
  }
});

test('expressive hand interactions are preserved in all prompt versions', () => {
  const cases = [
    ['單手扶眼鏡', /adjusting the glasses at the frame or bridge/],
    ['單手把眼鏡拉下', /pulling the glasses slightly down the nose bridge/],
    ['一手撐地一手放腿上', /one hand supporting on the floor or nearby surface with the other hand resting on the leg/],
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

test('pose composer exposes kneeling and lying expansion batch', () => {
  [
    ['直立端正跪姿', 'kneeling', /upright poised kneeling arrangement/],
    ['側坐跪姿', 'kneeling', /side-sitting kneeling arrangement/],
    ['單膝前跨跪姿', 'kneeling', /one-knee-forward kneeling arrangement/],
    ['手肘支撐跪姿', 'kneeling', /forearms supporting the upper body/],
    ['跪姿微後仰', 'kneeling', /slightly backward-arched kneeling arrangement/],
    ['側躺屈膝', 'lying', /side-lying arrangement with both knees softly bent/],
    ['仰躺單手過頭', 'lying', /one arm extended overhead/],
    ['趴臥手肘撐起', 'lying', /elbows propping up the upper body/],
    ['斜向半躺', 'lying', /diagonal reclining arrangement/],
    ['躺姿雙腿屈起', 'lying', /both legs bent upward/],
  ].forEach(([zh, base, expectedEnglish]) => {
    assertArrangementOption(zh, base, expectedEnglish);
  });

  [
    ['跪在矮桌前', 'kneeling', /kneeling in front of a low table/],
    ['跪在床邊倚靠', 'kneeling', /edge of a bed/],
    ['躺在床上', 'lying', /lying on a bed/],
    ['躺在沙發上', 'lying', /lying on a sofa/],
    ['躺在地板', 'lying', /lying on the floor/],
    ['躺在地毯上', 'lying', /lying on a rug/],
    ['半躺在床邊', 'lying', /edge of a bed/],
  ].forEach(([zh, base, expectedEnglish]) => {
    assertAnchorOption(zh, base, expectedEnglish);
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

test('kneeling and lying expansion batch is preserved in all prompt versions', () => {
  const cases = [
    {
      baseZh: '跪姿',
      arrangementZh: '側坐跪姿',
      handZh: '雙手在身前交握',
      anchorZh: '跪在矮桌前',
      headZh: '低頭三分之四側臉',
      expected: [
        /kneeling in front of a low table/,
        /side-sitting kneeling arrangement/,
        /both hands clasped loosely in front of the body/,
        /head lowered into a three-quarter side angle/,
      ],
    },
    {
      baseZh: '躺姿',
      arrangementZh: '趴臥手肘撐起',
      handZh: '單手扶腳踝',
      anchorZh: '躺在床上',
      headZh: '越肩回望',
      expected: [
        /lying on a bed/,
        /prone lying arrangement with elbows propping up/,
        /one hand holding the ankle/,
        /head turned over one shoulder toward the camera/,
      ],
    },
  ];

  for (const { baseZh, arrangementZh, handZh, anchorZh, headZh, expected } of cases) {
    const [prompt] = generatePrompts(1, {
      ...createEmptyLocks(),
      subjectCount: '1',
      framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
      poseBaseId: optionId('poseBaseId', baseZh),
      poseArrangementId: optionId('poseArrangementId', arrangementZh),
      poseHandId: optionId('poseHandId', handZh),
      poseAnchorId: optionId('poseAnchorId', anchorZh),
      poseHeadId: optionId('poseHeadId', headZh),
    });

    for (const text of [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt]) {
      expected.forEach((pattern) => assert.match(text, pattern));
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

test('standing lean scene-object anchor preserves supported body contact wording', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    poseBaseId: optionId('poseBaseId', '站姿'),
    poseArrangementId: optionId('poseArrangementId', '單腳重心'),
    poseHandId: optionId('poseHandId', '雙手自然垂放'),
    poseAnchorId: optionId('poseAnchorId', '倚靠現有場景物件'),
    poseHeadId: optionId('poseHeadId', '頭部自然朝向鏡頭'),
  });

  assert.match(prompt.grokPrompt, /leaning against any suitable existing object within the current scene/);
  assert.match(prompt.grokPrompt, /body weight lightly supported by that existing scene object/);
  assert.match(prompt.zImagePrompt, /using only a naturally available scene object for support/);
  assert.equal(prompt.selection.poseAnchorId, optionId('poseAnchorId', '倚靠現有場景物件'));
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

  assert.match(prompt.grokPrompt, /She is reclining inside a water-filled clawfoot vintage bathtub with/);
  assert.match(prompt.grokPrompt, /casually languid lying arrangement/);
  assert.match(prompt.grokPrompt, /one hand supporting the chin/);
  assert.match(prompt.grokPrompt, /head turned back toward the camera/);
  assert.match(prompt.grokPrompt, /the outfit and exposed skin are soaked by bath water/);
  assert.match(prompt.grokPrompt, /clothing remains complete and non-transparent/);
  assert.match(prompt.zImagePrompt, /reclining inside a water-filled clawfoot vintage bathtub/);
  assert.match(prompt.zImagePrompt, /the outfit and exposed skin are soaked by bath water/);
  assert.match(prompt.midjourneyPrompt, /casually languid lying arrangement/);
  assert.match(prompt.midjourneyPrompt, /clothing remains complete and non-transparent/);
  assert.equal(prompt.selection.poseBaseId, optionId('poseBaseId', '躺姿'));
  assert.equal(prompt.selection.poseHeadId, optionId('poseHeadId', '回頭朝向鏡頭'));
});

test('shared bathtub anchor phrases naturally for standing sitting and squatting bases', () => {
  const cases = [
    ['站姿', '自然站姿', /She is standing beside a water-filled clawfoot vintage bathtub with/, false],
    ['坐姿', '自然坐姿', /She is sitting on the edge of a water-filled clawfoot vintage bathtub with/, true],
    ['蹲姿', '自然蹲姿', /She is squatting inside a water-filled clawfoot vintage bathtub with/, true],
  ];

  for (const [baseZh, arrangementZh, expected, expectsWaterContact] of cases) {
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
    if (expectsWaterContact) {
      assert.match(prompt.grokPrompt, /visible water sheen and droplets/);
      assert.match(prompt.grokPrompt, /clothing remains complete and non-transparent/);
    } else {
      assert.doesNotMatch(prompt.grokPrompt, /soaked by bath water/);
    }
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

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls, getSceneDependentOptions, normalizeLocks } from './engine.js';

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

function optionIdForBase(controlKey, zh, base) {
  const option = control(controlKey).options.find((entry) => entry.zh === zh && entry.base === base);
  assert.ok(option, `Expected ${base} option ${zh} in ${controlKey}`);
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

function assertAnchorOptionForBases(zh, bases, expectedEnglish) {
  const option = control('poseAnchorId').options.find((entry) => entry.zh === zh);
  assert.ok(option, `Expected anchor option ${zh}`);
  bases.forEach((base) => assert.ok(option.bases.includes(base), `${zh} should support ${base}`));
  assert.match(option.en, expectedEnglish);
}

function scenePoseAnchorOptions(locationZh) {
  const locationId = locationZh ? optionId('locationId', locationZh) : '';
  return getSceneDependentOptions([], { ...createEmptyLocks(), locationId }).poseAnchorOptions;
}

function assertSharedCanonicalPose(prompt, expected) {
  const canonicalPose = prompt.grokPrompt.match(/Pose and Composition:\n([^\n]+)/)?.[1] || '';
  assert.equal(canonicalPose, expected);
  assert.ok(prompt.zImagePrompt.includes(expected), 'Grok/Z-Image should reuse the exact canonical pose');
  assert.ok(prompt.midjourneyPrompt.includes(expected), 'AI should reuse the exact canonical pose');
}

function createFullySpecifiedLocks(overrides = {}) {
  const locks = { ...createEmptyLocks() };

  for (const entry of getLockControls()) {
    if (!Array.isArray(entry.options) || entry.options.length === 0) continue;
    const concreteOption = entry.options.find((option) => option.zh === '全無')
      || entry.options.find((option) => option.id === entry.defaultValue)
      || entry.options.find((option) => (
        option.zh !== '隨機'
        && option.random !== true
        && !option.meta?.tags?.includes('random')
      ));
    if (concreteOption) locks[entry.key] = concreteOption.id;
  }

  return { ...locks, subjectCount: '1', ...overrides };
}

test('public hand catalog is compact and carries the clarified garment/accessory language', () => {
  const publicHands = control('poseHandId').options
    .filter((option) => !option.meta?.uiHidden && !['none', 'random', 'model-natural-hand-placement'].includes(option.id));

  assert.deepEqual(publicHands.map((option) => option.zh), [
    '雙手自然垂放',
    '雙臂交疊',
    '一手扶腰一手自然放下',
    '雙手背在身後',
    '雙手放在頭後',
    '單手向鏡頭張開手掌',
    '單手托下巴',
    '單手碰嘴角',
    '單手往後撥瀏海',
    '雙手抓著整束頭髮與髮尾整理',
    '拉下肩線整理上衣',
    '雙手把褲子或裙子的褲頭往上拉',
    '雙手抱膝',
    '雙手插褲子口袋',
    '雙手插外套口袋',
    '單手拿著眼鏡',
    '單手把眼鏡拉下',
    '咬著眼鏡腳',
  ]);

  const byZh = (zh) => publicHands.find((option) => option.zh === zh);
  assert.match(byZh('雙手抓著整束頭髮與髮尾整理').en, /one thick bundle of hair.*holding near the base.*grips and smooths.*ends/i);
  assert.match(byZh('單手往後撥瀏海').en, /sweeping the bangs backward.*fingers combing the fringe/i);
  assert.match(byZh('拉下肩線整理上衣').en, /pulling the neckline or shoulder seam down.*garment stays attached/i);
  assert.match(byZh('雙手把褲子或裙子的褲頭往上拉').en, /pulling the pants or skirt waistband slightly upward.*without lowering or removing/i);
  assert.match(byZh('雙手抱膝').en, /both arms wrapped around the bent knees.*holding the knees close to the torso/i);
  assert.match(byZh('單手拿著眼鏡').en, /holding the glasses by one temple.*removed from the face/i);
  assert.match(byZh('咬著眼鏡腳').en, /one glasses temple held lightly between the teeth.*removed from the face/i);
  assert.equal(publicHands.filter((option) => option.meta?.requiresWardrobeRole === 'eyewear').length, 3);
  assert.equal(control('poseHandId').options.filter((option) => option.meta?.uiHidden).length > 0, true);
});

test('random hand integration excludes unavailable wardrobe and eyewear interactions', () => {
  const none = (key) => optionId(key, '全無');
  const baseLocks = createFullySpecifiedLocks({
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    poseBaseId: optionId('poseBaseId', '站姿'),
    poseArrangementId: optionId('poseArrangementId', '自然站姿'),
    poseHandId: optionId('poseHandId', '隨機'),
    poseHeadId: optionId('poseHeadId', '頭部自然朝向鏡頭'),
    dressId: none('dressId'),
    topId: none('topId'),
    pantsId: none('pantsId'),
    skirtId: none('skirtId'),
    outerwearId: none('outerwearId'),
    eyewearId: none('eyewearId'),
  });
  const forbidden = new Set([
    'hands-lift-waistband',
    'hands-in-pockets',
    'hands-in-outerwear-pockets',
    'one-hand-hold-glasses',
    'one-hand-pull-down-glasses',
    'glasses-temple-between-teeth',
  ]);

  for (const roll of [0, 0.17, 0.34, 0.51, 0.68, 0.85, 0.99]) {
    const [prompt] = generatePrompts(1, baseLocks, [], { random: () => roll });
    assert.equal(forbidden.has(prompt.selection.poseHandId), false, `unexpected hand ${prompt.selection.poseHandId} at roll ${roll}`);
  }
});

test('standing random pools exclude non-standing hand, head, and generic-support options', () => {
  const locks = createFullySpecifiedLocks({
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    poseBaseId: optionId('poseBaseId', '站姿'),
    poseArrangementId: optionId('poseArrangementId', '自然站姿'),
    poseHandId: optionId('poseHandId', '隨機'),
    poseHeadId: optionId('poseHeadId', '隨機'),
    poseAnchorId: optionId('poseAnchorId', '隨機'),
  });
  const forbiddenHands = new Set(['hands-hug-knees']);
  const forbiddenHeads = new Set(['head-close-support-surface', 'head-close-lens-off-axis', 'head-low-rim-support']);
  const forbiddenAnchors = new Set(['shared-natural-support']);

  for (const roll of [0, 0.17, 0.34, 0.51, 0.68, 0.85, 0.99]) {
    const [prompt] = generatePrompts(1, locks, [], { random: () => roll });
    assert.equal(forbiddenHands.has(prompt.selection.poseHandId), false, `unexpected standing hand ${prompt.selection.poseHandId}`);
    assert.equal(forbiddenHeads.has(prompt.selection.poseHeadId), false, `unexpected standing head ${prompt.selection.poseHeadId}`);
    assert.equal(forbiddenAnchors.has(prompt.selection.poseAnchorId), false, `unexpected standing anchor ${prompt.selection.poseAnchorId}`);
  }
});

test('standing matrix exclusions remain explicitly restorable', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    poseBaseId: optionId('poseBaseId', '站姿'),
    poseArrangementId: optionId('poseArrangementId', '自然站姿'),
    poseHandId: optionId('poseHandId', '雙手抱膝'),
    poseHeadId: optionId('poseHeadId', '頭部貼近支撐面'),
    poseAnchorId: optionId('poseAnchorId', '自然受支撐'),
  });

  assert.equal(prompt.selection.poseHandId, optionId('poseHandId', '雙手抱膝'));
  assert.equal(prompt.selection.poseHeadId, optionId('poseHeadId', '頭部貼近支撐面'));
  assert.equal(prompt.selection.poseAnchorId, optionId('poseAnchorId', '自然受支撐'));
  assert.match(prompt.grokPrompt, /both arms wrapped around the bent knees/i);
  assert.match(prompt.grokPrompt, /head angled close to a support surface/i);
  assert.match(prompt.grokPrompt, /body naturally supported/i);
});

test('sitting random pools prefer concrete support and valid raised-knee hand geometry', () => {
  const baseLocks = {
    ...createEmptyLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    poseBaseId: optionId('poseBaseId', '坐姿'),
    poseHandId: optionId('poseHandId', '隨機'),
    poseHeadId: optionId('poseHeadId', '隨機'),
    poseAnchorId: optionId('poseAnchorId', '隨機'),
  };
  ['topId', 'dressId', 'pantsId', 'skirtId', 'outerwearId', 'eyewearId'].forEach((key) => {
    baseLocks[key] = optionId(key, '全無');
  });
  const forbiddenHeads = new Set(['head-close-support-surface', 'head-close-lens-off-axis', 'head-low-rim-support']);
  const forbiddenAnchors = new Set(['shared-natural-support', 'sitting-ornate-velvet-armchair']);

  for (const roll of [0, 0.17, 0.34, 0.51, 0.68, 0.85, 0.99]) {
    const [prompt] = generatePrompts(1, {
      ...baseLocks,
      poseArrangementId: optionId('poseArrangementId', '雙腿自然伸展'),
    }, [], { random: () => roll });
    assert.notEqual(prompt.selection.poseHandId, 'hands-hug-knees');
    assert.equal(forbiddenHeads.has(prompt.selection.poseHeadId), false);
    assert.equal(forbiddenAnchors.has(prompt.selection.poseAnchorId), false);
  }

  let raisedKneeHugFound = false;
  for (const roll of Array.from({ length: 100 }, (_, index) => index / 100)) {
    const [prompt] = generatePrompts(1, {
      ...baseLocks,
      poseArrangementId: optionId('poseArrangementId', '雙腿屈起'),
      poseHeadId: optionId('poseHeadId', '全無'),
      poseAnchorId: optionId('poseAnchorId', '全無'),
    }, [], { random: () => roll });
    if (prompt.selection.poseHandId === 'hands-hug-knees') raisedKneeHugFound = true;
  }
  assert.equal(raisedKneeHugFound, true);
});

test('sitting matrix exclusions remain explicitly restorable', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    poseBaseId: optionId('poseBaseId', '坐姿'),
    poseArrangementId: optionId('poseArrangementId', '自然坐姿'),
    poseHandId: optionId('poseHandId', '雙手抱膝'),
    poseHeadId: optionId('poseHeadId', '頭部貼近支撐面'),
    poseAnchorId: optionId('poseAnchorId', '自然受支撐'),
  });

  assert.equal(prompt.selection.poseHandId, optionId('poseHandId', '雙手抱膝'));
  assert.equal(prompt.selection.poseHeadId, optionId('poseHeadId', '頭部貼近支撐面'));
  assert.equal(prompt.selection.poseAnchorId, optionId('poseAnchorId', '自然受支撐'));
  assert.match(prompt.grokPrompt, /both arms wrapped around the bent knees/i);
  assert.match(prompt.grokPrompt, /head angled close to a support surface/i);
  assert.match(prompt.grokPrompt, /body naturally supported/i);
});

test('hand visibility metadata projects lower-body actions out of chest-up canonical poses', () => {
  const shared = {
    ...createEmptyLocks(),
    subjectCount: '1',
    poseBaseId: optionId('poseBaseId', '站姿'),
    poseArrangementId: optionId('poseArrangementId', '自然站姿'),
    poseHandId: optionId('poseHandId', '雙手把褲子或裙子的褲頭往上拉'),
    poseHeadId: optionId('poseHeadId', '頭部自然朝向鏡頭'),
  };
  const [chestUp] = generatePrompts(1, { ...shared, framingId: optionId('framingId', '胸上特寫') });
  const [fullBody] = generatePrompts(1, { ...shared, framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)') });
  const chestPose = chestUp.grokPrompt.match(/Pose and Composition:\n([^\n]+)/)?.[1] || '';
  const fullPose = fullBody.grokPrompt.match(/Pose and Composition:\n([^\n]+)/)?.[1] || '';
  assert.doesNotMatch(chestPose, /pulling the pants or skirt waistband/i);
  assert.match(fullPose, /pulling the pants or skirt waistband/i);
});

test('crop projection metadata omits lower-only standing geometry without changing full-body output', () => {
  const shared = {
    ...createEmptyLocks(),
    subjectCount: '1',
    poseBaseId: optionId('poseBaseId', '站姿'),
    poseArrangementId: optionId('poseArrangementId', '單腳微抬'),
    poseHandId: optionId('poseHandId', '雙手自然垂放'),
    poseAnchorId: optionId('poseAnchorId', '髖側倚靠現有邊緣'),
    poseHeadId: optionId('poseHeadId', '頭部自然朝向鏡頭'),
  };
  const framing = (zh) => optionId('framingId', zh);
  const canonicalPose = (prompt) => prompt.grokPrompt.match(/Pose and Composition:\n([^\n]+)/)?.[1] || '';

  const [chestUp] = generatePrompts(1, { ...shared, framingId: framing('胸上特寫') });
  const [mediumWaist] = generatePrompts(1, { ...shared, framingId: framing('中景鏡頭 (Medium Shot)') });
  const [cowboy] = generatePrompts(1, { ...shared, framingId: framing('牛仔中景 (Cowboy Shot)') });
  const [fullBody] = generatePrompts(1, { ...shared, framingId: framing('全身鏡頭 (Full Body Shot)') });

  for (const prompt of [chestUp, mediumWaist]) {
    assert.doesNotMatch(canonicalPose(prompt), /one foot slightly lifted|hip resting against an existing waist-height edge/i);
  }
  assert.doesNotMatch(canonicalPose(cowboy), /one foot slightly lifted/i);
  assert.match(canonicalPose(cowboy), /hip resting against an existing waist-height edge/i);
  assert.match(canonicalPose(fullBody), /one foot slightly lifted/);
  assert.match(canonicalPose(fullBody), /hip resting against an existing waist-height edge/i);
});

function generateWithRandomSequence(locks, values) {
  let calls = 0;
  const [prompt] = generatePrompts(1, locks, [], {
    random: () => values[calls++] ?? 0,
  });
  return { prompt, calls };
}

test('pose composer controls expose base arrangement hand and anchor options', () => {
  assert.ok(control('poseBaseId').options.some((option) => option.zh === '站姿'));
  assert.ok(control('poseBaseId').options.some((option) => option.zh === '躺姿'));
  assert.ok(control('poseArrangementId').options.some((option) => option.zh === '單腳重心' && option.base === 'standing'));
  assert.ok(control('poseArrangementId').options.some((option) => option.zh === '隨性慵懶' && option.base === 'lying'));
  assert.ok(control('poseHandId').options.some((option) => option.zh === '單手摸下巴'));
  assert.ok(control('poseHandId').options.some((option) => option.zh === '自然自拍'));
  assert.ok(control('poseHandId').options.some((option) => option.zh === '鏡子自拍'));
  assert.ok(control('poseHandId').options.some((option) => option.zh === '男友/閨蜜自拍'));
  assert.ok(control('poseHeadId').options.some((option) => option.zh === '頭部微微側傾'));
  assert.ok(control('poseAnchorId').options.some((option) => option.zh === '站在門框邊' && option.base === 'standing'));
  assert.ok(control('poseAnchorId').options.some((option) => option.zh === '浴缸' && option.bases.includes('lying')));
});

test('pose composer controls keep only the explicit random option', () => {
  ['poseBaseId', 'poseArrangementId', 'poseHandId', 'poseHeadId', 'poseAnchorId'].forEach((key) => {
    const poseControl = control(key);
    assert.equal(poseControl.suppressDefaultRandomOption, true);
    assert.equal(poseControl.options.filter((option) => option.zh === '隨機').length, 1);
  });
});

test('pose composer samples base arrangement hand head and anchor in documented order', () => {
  const poseKeys = ['poseBaseId', 'poseArrangementId', 'poseHandId', 'poseHeadId', 'poseAnchorId'];
  const values = [0.05, 0.15, 0.25, 0.35, 0.45];
  const fixedLocks = createFullySpecifiedLocks();
  const resolveSingleRandom = (key, value, resolvedBaseId = 'none') => {
    const locks = {
      ...fixedLocks,
      poseBaseId: resolvedBaseId,
      poseArrangementId: 'none',
      poseHandId: 'none',
      poseHeadId: 'none',
      poseAnchorId: 'none',
      [key]: 'random',
    };
    return generateWithRandomSequence(locks, [value]).prompt.selection[key];
  };

  const expectedBaseId = resolveSingleRandom('poseBaseId', values[0]);
  const expectedSelection = {
    poseBaseId: expectedBaseId,
    poseArrangementId: resolveSingleRandom('poseArrangementId', values[1], expectedBaseId),
    poseHandId: resolveSingleRandom('poseHandId', values[2], expectedBaseId),
    poseHeadId: resolveSingleRandom('poseHeadId', values[3], expectedBaseId),
    poseAnchorId: resolveSingleRandom('poseAnchorId', values[4], expectedBaseId),
  };
  const allRandomLocks = {
    ...fixedLocks,
    ...Object.fromEntries(poseKeys.map((key) => [key, 'random'])),
  };
  const { prompt, calls } = generateWithRandomSequence(allRandomLocks, values);
  const actualSelection = Object.fromEntries(poseKeys.map((key) => [key, prompt.selection[key]]));

  assert.deepEqual(actualSelection, expectedSelection);
  assert.equal(calls, 6, 'Five Pose Composer samples plus the runtime prompt id should consume six values');
});

test('random pose composer respects crop and front-orbit compatibility', () => {
  const locks = {
    ...createFullySpecifiedLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '中景鏡頭 (Medium Shot)'),
    angleId: optionId('angleId', '高位俯視鏡頭'),
    orbitId: optionId('orbitId', '正面 0 度'),
    poseBaseId: optionId('poseBaseId', '隨機'),
    poseArrangementId: optionId('poseArrangementId', '隨機'),
    poseHandId: optionId('poseHandId', '隨機'),
    poseHeadId: optionId('poseHeadId', '隨機'),
    poseAnchorId: optionId('poseAnchorId', '隨機'),
  };
  const { prompt } = generateWithRandomSequence(locks, [0.99, 0.99, 0.99, 0.99, 0.99, 0.99]);

  assert.ok(['standing', 'sitting'].includes(prompt.selection.poseBaseId));
  assert.notEqual(prompt.selection.poseArrangementId, optionId('poseArrangementId', '側身蹲姿'));
  assert.doesNotMatch(prompt.grokPrompt, /side-facing squatting|back-facing turn-back/i);
  assertSharedCanonicalPose(prompt, prompt.grokPrompt.match(/Pose and Composition:\n([^\n]+)/)?.[1] || '');
});

test('explicit pose locks remain visible even when they intentionally conflict', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    orbitId: optionId('orbitId', '正面 0 度'),
    poseBaseId: optionId('poseBaseId', '蹲姿'),
    poseArrangementId: optionId('poseArrangementId', '側身蹲姿'),
    poseHandId: optionId('poseHandId', '雙手自然垂放'),
    poseHeadId: optionId('poseHeadId', '頭部自然朝向鏡頭'),
  });

  assert.equal(prompt.selection.poseArrangementId, optionId('poseArrangementId', '側身蹲姿'));
  assert.equal(prompt.selection.poseHeadId, optionId('poseHeadId', '頭部自然朝向鏡頭'));
  assert.match(prompt.grokPrompt, /head naturally facing the camera/);
  assert.match(prompt.grokPrompt, /deep squat with the hips and legs kept low while the torso turns toward the camera/);
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

test('pose composer exposes scene-appropriate sitting chair anchor', () => {
  assertAnchorOption('坐在椅子上', 'sitting', /chair that naturally fits the current scene/);
  assertAnchorOption('坐在椅子上', 'sitting', /chosen to match the environment/);

  const option = control('poseAnchorId').options.find((entry) => entry.zh === '坐在椅子上');
  assert.doesNotMatch(option.en, /armchair|bar stool|high-back|velvet|ornate/i);
});

test('seat-edge and wall-seated poses live in contact support anchors', () => {
  assert.equal(control('poseArrangementId').options.some((option) => option.zh === '椅緣端坐'), false);
  assert.equal(control('poseArrangementId').options.some((option) => option.zh === '靠牆坐姿'), false);

  assertAnchorOption('坐在椅緣', 'sitting', /front edge of a chair/);
  assertAnchorOption('坐在椅緣', 'sitting', /seat-edge support/);
  assertAnchorOption('背靠牆坐在地面', 'sitting', /back resting against a wall/);
  assertAnchorOption('背靠牆坐在地面', 'sitting', /wall-supported seated contact/);
});

test('scene-appropriate sitting chair anchor is preserved in all prompt versions', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    poseBaseId: optionId('poseBaseId', '坐姿'),
    poseArrangementId: optionId('poseArrangementId', '自然坐姿'),
    poseHandId: optionId('poseHandId', '雙手放在大腿上'),
    poseAnchorId: optionId('poseAnchorId', '坐在椅子上'),
    poseHeadId: optionId('poseHeadId', '頭部自然朝向鏡頭'),
  });

  assert.match(prompt.grokPrompt, /natural seated pose on a chair that naturally fits the current scene/);
  assert.match(prompt.grokPrompt, /chair style material and scale chosen to match the environment/);
  for (const text of [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt]) {
    assert.match(text, /chair that naturally fits the current scene|scene-appropriate chair/);
    assert.match(text, /chosen to match the environment|scene-appropriate chair/);
    assert.doesNotMatch(text, /ornate single velvet armchair|bar stool|high-back chair/);
  }
});

test('seat-edge sitting anchor is preserved in all prompt versions', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    poseBaseId: optionId('poseBaseId', '坐姿'),
    poseArrangementId: optionId('poseArrangementId', '自然坐姿'),
    poseHandId: optionId('poseHandId', '雙手放在大腿上'),
    poseAnchorId: optionId('poseAnchorId', '坐在椅緣'),
    poseHeadId: optionId('poseHeadId', '頭部自然朝向鏡頭'),
  });

  assert.equal(prompt.selection.poseAnchorId, optionId('poseAnchorId', '坐在椅緣'));
  for (const text of [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt]) {
    assert.match(text, /front edge of a chair/);
    assert.match(text, /seat-edge support/);
  }
});

test('pose composer exposes water-scene-only contact anchors', () => {
  assertAnchorOptionForBases('在水中', ['standing', 'sitting', 'squatting', 'kneeling', 'lying'], /water contact pose/);
  assertAnchorOptionForBases('靠在水邊支撐', ['standing', 'sitting', 'squatting', 'kneeling', 'lying'], /water edge support pose/);
  assertAnchorOptionForBases('浴缸', ['standing', 'sitting', 'squatting', 'lying'], /water-filled clawfoot vintage bathtub/);

  const waterAnchorOptions = control('poseAnchorId').options
    .filter((option) => ['在水中', '靠在水邊支撐', '浴缸'].includes(option.zh));
  waterAnchorOptions.forEach((option) => {
    assert.equal(option.meta.requiresWaterScene, true);
  });
});

test('water contact anchors only appear for water-capable scenes', () => {
  const waterSceneLabels = [
    '戶外：飯店度假村泳池露台',
    '戶外：金色海灘與浪線',
    '戶外：清澈海灣岩岸',
    '戶外：岩洞感海灣淺灘',
  ];

  for (const label of waterSceneLabels) {
    const options = scenePoseAnchorOptions(label);
    assert.ok(Array.isArray(options), 'Expected scene-dependent pose anchor options');
    assert.ok(options.some((option) => option.zh === '在水中'), `${label} should show in-water anchor`);
    assert.ok(options.some((option) => option.zh === '靠在水邊支撐'), `${label} should show water-edge support anchor`);
    assert.ok(options.some((option) => option.zh === '浴缸'), `${label} should show bathtub anchor`);
  }

  const noSceneOptions = scenePoseAnchorOptions('');
  assert.ok(Array.isArray(noSceneOptions), 'Expected scene-dependent pose anchor options without a location');
  assert.ok(!noSceneOptions.some((option) => option.zh === '在水中'));
  assert.ok(!noSceneOptions.some((option) => option.zh === '靠在水邊支撐'));
  assert.ok(!noSceneOptions.some((option) => option.zh === '浴缸'));

  const indoorOptions = scenePoseAnchorOptions('室內：純潔白幕');
  assert.ok(!indoorOptions.some((option) => option.zh === '在水中'));
  assert.ok(!indoorOptions.some((option) => option.zh === '靠在水邊支撐'));
  assert.ok(!indoorOptions.some((option) => option.zh === '浴缸'));
});

test('water contact anchors adapt to pose base and selected water scene in all prompt versions', () => {
  const lowerBodyImmersionPatterns = [
    /whole lower body submerged/,
    /only the upper body above the water surface/,
  ];
  const cases = [
    {
      locationZh: '戶外：飯店度假村泳池露台',
      baseZh: '站姿',
      arrangementZh: '自然站姿',
      anchorZh: '在水中',
      expected: [/relaxed neutral standing posture waist-deep in clear pool water/, /visible waterline(?: across the body)?/],
      expectedGpt: [/relaxed neutral standing posture waist-deep in clear pool water/, /water-contact realism with the whole lower body submerged/],
    },
    {
      locationZh: '戶外：飯店度假村泳池露台',
      baseZh: '站姿',
      arrangementZh: '自然站姿',
      anchorZh: '靠在水邊支撐',
      expected: [/tiled pool edge/, /forearms or hands supported on that edge/],
      expectedGpt: [/tiled pool edge/, /forearms or hands supported on that edge/],
    },
    {
      locationZh: '戶外：金色海灘與浪線',
      baseZh: '蹲姿',
      arrangementZh: '自然蹲姿',
      anchorZh: '在水中',
      expected: [/deep resting squat with both feet flat on the ground, heels down/, /natural ripples(?: around the torso and limbs)?/],
      expectedGpt: [/deep resting squat with both feet flat on the ground, heels down/, /natural ripples/],
    },
    {
      locationZh: '戶外：岩洞感海灣淺灘',
      baseZh: '躺姿',
      arrangementZh: '側躺屈膝',
      anchorZh: '在水中',
      expected: [/floating or half-floating on the clear shallow cove water surface/, /clothing (?:remains )?complete and non-transparent/],
      expectedGpt: [/floating or half-floating on the clear shallow cove water surface/, /clothing remains complete and non-transparent/],
    },
    {
      locationZh: '戶外：清澈海灣岩岸',
      baseZh: '躺姿',
      arrangementZh: '趴臥手肘撐起',
      anchorZh: '靠在水邊支撐',
      expected: [/wet rock ledge at the cove shoreline/, /whole lower body submerged/],
      expectedGpt: [/wet rock ledge at the cove shoreline/, /whole lower body submerged/],
    },
  ];

  for (const { locationZh, baseZh, arrangementZh, anchorZh, expected, expectedGpt } of cases) {
    const [prompt] = generatePrompts(1, {
      ...createEmptyLocks(),
      subjectCount: '1',
      locationId: optionId('locationId', locationZh),
      framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
      poseBaseId: optionId('poseBaseId', baseZh),
      poseArrangementId: optionId('poseArrangementId', arrangementZh),
      poseHandId: optionId('poseHandId', '雙手自然垂放'),
      poseAnchorId: optionId('poseAnchorId', anchorZh),
      poseHeadId: optionId('poseHeadId', '頭部自然朝向鏡頭'),
    });

    assert.equal(prompt.selection.poseAnchorId, optionId('poseAnchorId', anchorZh));
    expectedGpt.forEach((pattern) => assert.match(prompt.grokPrompt, pattern));
    lowerBodyImmersionPatterns.forEach((pattern) => assert.match(prompt.grokPrompt, pattern));
    for (const text of [prompt.grokPrompt, prompt.zImagePrompt]) {
      expected.forEach((pattern) => assert.match(text, pattern));
      lowerBodyImmersionPatterns.forEach((pattern) => assert.match(text, pattern));
    }
  }
});

test('water contact anchors are ignored outside selected water scenes', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '1',
    locationId: optionId('locationId', '室內：純潔白幕'),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    poseBaseId: optionId('poseBaseId', '站姿'),
    poseArrangementId: optionId('poseArrangementId', '自然站姿'),
    poseHandId: optionId('poseHandId', '雙手自然垂放'),
    poseAnchorId: optionId('poseAnchorId', '在水中'),
    poseHeadId: optionId('poseHeadId', '頭部自然朝向鏡頭'),
  });

  assert.equal(prompt.selection.poseAnchorId, 'none');
  for (const text of [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt]) {
    assert.doesNotMatch(text, /clear pool water|clear shallow seawater|waterline across the body|floating or half-floating/);
  }
});

test('pose composer exposes any decision options', () => {
  const arrangement = control('poseArrangementId').options.find((option) => option.zh === '任意');
  assert.ok(arrangement, 'Expected any arrangement option');
  assert.ok(arrangement.bases.includes('standing'));
  assert.ok(arrangement.bases.includes('lying'));
  assert.match(arrangement.en, /any natural body arrangement fitted to the selected pose base/);
  assert.match(arrangement.desc, /不指定具體肢體變化/);

  assertHandOption('任意', /any natural hand placement fitted to the selected body pose/);
  assertHeadOption('任意', /any natural head direction fitted to the camera angle/);
});

test('any pose options add one shared natural qualifier without fixed directives', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    poseBaseId: optionId('poseBaseId', '站姿'),
    poseArrangementId: optionId('poseArrangementId', '任意'),
    poseHandId: optionId('poseHandId', '任意'),
    poseHeadId: optionId('poseHeadId', '任意'),
  });

  const poseTexts = [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt]
    .map((text) => text.match(/She (?:has|presents)[^.]+\./)?.[0] || '');
  poseTexts.forEach((text) => {
    assert.match(text, /casual, relaxed, and natural standing pose/i);
    assert.equal((text.match(/casual, relaxed, and natural/gi) || []).length, 1);
    assert.doesNotMatch(text, /any natural|let the image model choose/i);
  });
  assert.equal(new Set(poseTexts).size, 1);
});

test('pose composer canonical grammar handles articles, action phrases, and support anchors', () => {
  const fullBodyFraming = optionId('framingId', '全身鏡頭 (Full Body Shot)');
  const cases = [
    {
      locks: {
        poseBaseId: optionId('poseBaseId', '站姿'),
        poseArrangementId: optionId('poseArrangementId', '單腳微抬'),
      },
      expected: 'She presents a delicate standing balance pose with one foot slightly lifted.',
    },
    {
      locks: {
        poseBaseId: optionId('poseBaseId', '坐姿'),
        poseArrangementId: optionId('poseArrangementId', '開闊自信坐姿'),
      },
      expected: 'She presents an open, grounded seated posture with the knees comfortably apart, weight settled through the hips, and the torso relaxed and upright.',
    },
    {
      locks: {
        poseBaseId: optionId('poseBaseId', '跪姿'),
        poseArrangementId: optionId('poseArrangementId', '四足跪姿'),
      },
      expected: 'She presents an all-fours kneeling pose with hands and knees supporting the body.',
    },
    {
      locks: {
        poseBaseId: optionId('poseBaseId', '躺姿'),
        poseArrangementId: optionId('poseArrangementId', '仰躺單手過頭'),
      },
      expected: 'She presents a supine lying pose with one arm extended overhead and a relaxed elongated body line.',
    },
    {
      locks: {
        poseBaseId: optionId('poseBaseId', '坐姿'),
        poseArrangementId: optionId('poseArrangementId', '自然坐姿'),
        poseHandId: optionId('poseHandId', '鏡子自拍'),
        poseHeadId: optionId('poseHeadId', '頭部微微側傾'),
        poseAnchorId: optionId('poseAnchorId', '坐在單人雕花絨布椅'),
      },
      expected: 'She has her head slightly tilted, one hand holding a visible phone toward a mirror for a mirror selfie, with the phone overlapping the face or positioned beside it in the reflection, and presents a natural seated pose on an ornate single velvet armchair in a relaxed lounging posture.',
    },
    {
      locks: {
        poseBaseId: optionId('poseBaseId', '站姿'),
        poseArrangementId: optionId('poseArrangementId', '自然站姿'),
        poseHandId: optionId('poseHandId', '男友/閨蜜自拍'),
      },
      expected: 'She has casual, naturally relaxed hand placement in a close-companion social snapshot, with unforced candid body language, and presents a relaxed neutral standing posture.',
    },
    {
      locks: {
        poseBaseId: optionId('poseBaseId', '站姿'),
        poseArrangementId: optionId('poseArrangementId', '自然站姿'),
        posePropId: optionId('posePropId', '塗口紅｜自由妝感'),
      },
      expected: 'She has one hand applying lipstick directly to the lips with visible hand-to-mouth contact, with the finish varying naturally between clean application and a slightly smudged lip line, and presents a relaxed neutral standing posture.',
    },
    {
      locks: {
        poseBaseId: optionId('poseBaseId', '坐姿'),
        poseArrangementId: optionId('poseArrangementId', '雙手後撐'),
      },
      expected: 'She presents a seated pose with both hands planted behind the body for support.',
    },
    {
      locks: {
        poseBaseId: optionId('poseBaseId', '蹲姿'),
        poseArrangementId: optionId('poseArrangementId', '單手撐地蹲'),
      },
      expected: 'She presents a squatting pose with one hand planted on the ground for support.',
    },
    {
      locks: {
        poseBaseId: optionId('poseBaseId', '站姿'),
        poseArrangementId: optionId('poseArrangementId', '自然站姿'),
        poseHandId: optionId('poseHandId', '整理下身'),
      },
      expected: 'She has one hand adjusting the lower-body garment or hosiery, with the fingers visibly touching a skirt, pants waistband, or stocking, and presents a relaxed neutral standing posture.',
    },
    {
      locks: {
        poseBaseId: optionId('poseBaseId', '站姿'),
        poseArrangementId: optionId('poseArrangementId', '自然站姿'),
        poseHandId: optionId('poseHandId', '一手撐地一手放腿上'),
      },
      expected: 'She has one hand planted on the floor or a nearby surface for support, with the other hand resting on the leg, and presents a relaxed neutral standing posture.',
    },
  ];

  for (const { locks, expected } of cases) {
    const [prompt] = generatePrompts(1, {
      ...createEmptyLocks(),
      subjectCount: '1',
      framingId: fullBodyFraming,
      ...locks,
    });

    assertSharedCanonicalPose(prompt, expected);
    assert.doesNotMatch(expected, /let the image model|no separate photographer|without prescribed/i);
  }
});

test('public standing arrangements use clear canonical English and crop-safe upper-body fragments', () => {
  const fullBodyFraming = optionId('framingId', '全身鏡頭 (Full Body Shot)');
  const chestUpFraming = optionId('framingId', '胸上特寫');
  const cases = [
    {
      zh: '自然站姿',
      full: 'She presents a relaxed neutral standing posture.',
      chest: 'She presents an upper-body pose with a relaxed upright posture.',
    },
    {
      zh: '單腳重心',
      full: 'She presents a relaxed standing posture with weight shifted onto one leg and a natural asymmetrical balance.',
      chest: 'She presents an upper-body pose with a subtle asymmetrical weight shift onto one leg.',
    },
    {
      zh: '身體微前傾',
      full: 'She presents a standing posture with a slight forward lean through the upper body.',
      chest: 'She presents an upper-body pose with a slight forward lean through the upper body.',
    },
    {
      zh: '身體微後仰',
      full: 'She presents a standing posture with a slight backward lean through the upper body.',
      chest: 'She presents an upper-body pose with a slight backward lean through the upper body.',
    },
    {
      zh: '交叉腿站姿',
      full: 'She presents a standing posture with the legs naturally crossed and one hip subtly shifted.',
      chest: '',
    },
    {
      zh: '背對回身站姿',
      full: 'She presents a back-facing standing posture with the torso turned toward the camera.',
      chest: 'She presents an upper-body pose with a back-facing posture, torso turned toward the camera.',
    },
    {
      zh: '側身窄站姿',
      full: 'She presents a narrow side-facing standing posture with feet close together and a clean elongated body line.',
      chest: 'She presents an upper-body pose with a narrow side-facing posture, shoulders in profile.',
    },
    {
      zh: '一腳向前點地',
      full: 'She presents a standing posture with one foot placed slightly forward, its toe lightly touching the ground, and the other leg supporting the body weight.',
      chest: '',
    },
  ];

  for (const { zh, full, chest } of cases) {
    const baseLocks = {
      ...createEmptyLocks(),
      subjectCount: '1',
      poseBaseId: optionId('poseBaseId', '站姿'),
      poseArrangementId: optionId('poseArrangementId', zh),
    };
    const [fullPrompt] = generatePrompts(1, { ...baseLocks, framingId: fullBodyFraming });
    assertSharedCanonicalPose(fullPrompt, full);
    assert.doesNotMatch(full, /\barrangement\b|close-interaction|delicate extended|turn-back/i);

    const [chestPrompt] = generatePrompts(1, { ...baseLocks, framingId: chestUpFraming });
    const projectedPose = chestPrompt.grokPrompt.match(/Pose and Composition:\n([^\n]+)/)?.[1] || '';
    if (chest) {
      assert.equal(projectedPose, chest);
      assert.equal(chestPrompt.zImagePrompt.includes(chest), true);
      assert.equal(chestPrompt.midjourneyPrompt.includes(chest), true);
    } else {
      assert.equal(projectedPose, '');
    }
  }
});

test('squatting arrangements use explicit crop projection without lower-body leakage', () => {
  const framing = (zh) => optionId('framingId', zh);
  const poseText = (prompt) => prompt.grokPrompt.match(/Pose and Composition:\n([^\n]+)/)?.[1] || '';
  const baseLocks = {
    ...createEmptyLocks(),
    subjectCount: '1',
    poseBaseId: optionId('poseBaseId', '蹲姿'),
    poseHandId: optionId('poseHandId', '全無'),
    poseHeadId: optionId('poseHeadId', '全無'),
    poseAnchorId: optionId('poseAnchorId', '全無'),
  };
  const render = (arrangementZh, framingZh) => generatePrompts(1, {
    ...baseLocks,
    poseArrangementId: optionId('poseArrangementId', arrangementZh),
    framingId: framing(framingZh),
  })[0];

  [
    ['自然蹲姿', 'the torso upright and relaxed', 'a relaxed upright upper-body posture'],
    ['身體前傾蹲姿', 'the torso leaning forward from the hips', 'a forward-leaning upper-body posture with the torso inclined from the hips'],
  ].forEach(([arrangementZh, chestExpected, mediumExpected]) => {
    assert.equal(
      poseText(render(arrangementZh, '胸上特寫')),
      `She presents an upper-body pose with ${chestExpected}.`
    );
    assert.equal(
      poseText(render(arrangementZh, '中景鏡頭 (Medium Shot)')),
      `She presents ${mediumExpected}.`
    );
  });

  [
    '單膝抬起不對稱蹲姿',
    '側身蹲姿',
    '低蹲單腿前伸',
    '雙膝合併半蹲',
    '寬膝深蹲／流氓蹲姿',
  ].forEach((arrangementZh) => {
    assert.equal(poseText(render(arrangementZh, '胸上特寫')), '');
    assert.equal(poseText(render(arrangementZh, '中景鏡頭 (Medium Shot)')), 'She presents a squatting pose.');
  });

  ['單手撐地蹲', '腳跟抬起蹲姿'].forEach((arrangementZh) => {
    assert.equal(poseText(render(arrangementZh, '胸上特寫')), '');
    assert.equal(poseText(render(arrangementZh, '中景鏡頭 (Medium Shot)')), 'She presents a squatting pose.');
    assert.equal(poseText(render(arrangementZh, '牛仔中景 (Cowboy Shot)')), 'She presents a squatting pose.');
  });

  assert.match(
    poseText(render('雙膝合併半蹲', '牛仔中景 (Cowboy Shot)')),
    /both knees together and thighs held close and parallel/
  );

  const fullBody = render('低蹲單腿前伸', '全身鏡頭 (Full Body Shot)');
  assert.match(poseText(fullBody), /low squat with one leg extended straight forward/);
  for (const text of [fullBody.grokPrompt, fullBody.zImagePrompt, fullBody.midjourneyPrompt]) {
    assert.match(text, /low squat with one leg extended straight forward/);
  }
});

test('natural support anchor adapts one object-free canonical pose across all five bases', () => {
  const fullBodyFraming = optionId('framingId', '全身鏡頭 (Full Body Shot)');
  const cases = [
    {
      baseZh: '站姿',
      arrangementZh: '自然站姿',
      expected: 'She presents a relaxed neutral standing posture with the body naturally supported.',
    },
    {
      baseZh: '坐姿',
      arrangementZh: '自然坐姿',
      expected: 'She presents a natural seated pose with the seated body naturally supported.',
    },
    {
      baseZh: '跪姿',
      arrangementZh: '單膝跪地',
      expected: 'She presents a one-knee kneeling pose with the upper body naturally supported.',
    },
    {
      baseZh: '蹲姿',
      arrangementZh: '自然蹲姿',
      expected: 'She presents a deep resting squat with both feet flat on the ground, heels down, knees deeply bent, and the body balanced low over the feet with the body naturally supported.',
    },
    {
      baseZh: '躺姿',
      arrangementZh: '自然半躺',
      expected: 'She presents a relaxed half-reclining pose with the upper body naturally supported.',
    },
  ];

  for (const { baseZh, arrangementZh, expected } of cases) {
    const [prompt] = generatePrompts(1, {
      ...createEmptyLocks(),
      subjectCount: '1',
      framingId: fullBodyFraming,
      poseBaseId: optionId('poseBaseId', baseZh),
      poseArrangementId: optionId('poseArrangementId', arrangementZh),
      poseAnchorId: optionId('poseAnchorId', '自然受支撐'),
    });

    assertSharedCanonicalPose(prompt, expected);
    assert.doesNotMatch(expected, /wall|floor|chair|cube|plinth|support surface|object/i);
  }
});

test('pose composer exposes expressive hand interaction batch', () => {
  [
    ['單手扶眼鏡', /adjusting the glasses at the frame or bridge/],
    ['單手把眼鏡拉下', /pulling the glasses slightly down the nose bridge/],
    ['單手碰嘴角', /one hand lightly touching the corner of the mouth/],
    ['單手遮住半邊臉', /partially covering one side of the face/],
    ['雙手整理頭髮', /both hands lifting and gathering the hair behind the head/],
    ['單手撩起後頸頭髮', /lifting hair away from the nape of the neck/],
    ['單手搭在鎖骨', /one hand resting across the collarbone/],
    ['一手扶腰一手自然放下', /one hand on the waist or hip line with the other hand relaxed along the body or nearby support surface/],
    ['一手撐地一手放腿上', /one hand planted on the floor or a nearby surface for support, with the other hand resting on the leg/],
    ['一手扶膝一手垂放', /one hand holding the knee with the other hand relaxed beside the body or support surface/],
  ].forEach(([zh, expectedEnglish]) => {
    assertHandOption(zh, expectedEnglish);
  });

  assertHandOption('單手撩髮', /brushing hair back from the side of the face/);
  assertHandOption('單手撩髮', /near the temple or ear/);
});

test('pose composer exposes selfie hand pose batch', () => {
  [
    ['自然自拍', /front-camera self-shot with her right arm extended to hold the phone/],
    ['自然自拍', /phone just beyond the frame edge/],
    ['自然自拍', /naturally foreshortened right forearm entering from the side/],
    ['鏡子自拍', /one hand holding a visible phone toward a mirror/],
    ['鏡子自拍', /phone overlapping the face or positioned beside it in the reflection/],
    ['男友/閨蜜自拍', /casual, naturally relaxed hand placement/],
    ['男友/閨蜜自拍', /close-companion social snapshot/],
  ].forEach(([zh, expectedEnglish]) => {
    assertHandOption(zh, expectedEnglish);
  });
});

test('selfie hand poses are preserved in all prompt versions and lock orbit to none', () => {
  const rearOrbit = optionId('orbitId', '背面 180 度');
  const noneOrbit = optionId('orbitId', '全無');
  const selfieCases = [
    ['自然自拍', /front-camera self-shot/, /phone just beyond the frame edge/],
    ['鏡子自拍', /visible phone toward a mirror/, /phone overlapping the face/],
    ['男友/閨蜜自拍', /naturally relaxed hand placement/, /close-companion social snapshot/],
  ];

  for (const [handZh, expectedA, expectedB] of selfieCases) {
    const [prompt] = generatePrompts(1, {
      ...createEmptyLocks(),
      subjectCount: '1',
      framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
      orbitId: rearOrbit,
      poseBaseId: optionId('poseBaseId', '站姿'),
      poseArrangementId: optionId('poseArrangementId', '自然站姿'),
      poseHandId: optionId('poseHandId', handZh),
      poseHeadId: optionId('poseHeadId', '頭部自然朝向鏡頭'),
    });

    assert.equal(prompt.selection.orbitId, noneOrbit);
    assert.equal(prompt.selection.poseHandId, optionId('poseHandId', handZh));
    for (const text of [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt]) {
      assert.match(text, expectedA);
      assert.match(text, expectedB);
      assert.doesNotMatch(text, /rear view|back view|from behind/i);
      assert.doesNotMatch(text, /let the image model|no separate photographer|without prescribed/i);
    }
  }
});

test('a random hand no longer resolves to retired selfie actions or clears a locked rear orbit', () => {
  const rearOrbit = optionId('orbitId', '背面 180 度');
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    orbitId: rearOrbit,
    poseBaseId: optionId('poseBaseId', '站姿'),
    poseArrangementId: optionId('poseArrangementId', '自然站姿'),
    poseHandId: optionId('poseHandId', '隨機'),
    poseHeadId: optionId('poseHeadId', '頭部自然朝向鏡頭'),
  }, [], { random: () => 0 });

  assert.equal(prompt.selection.poseHandId, optionId('poseHandId', '雙手自然垂放'));
  assert.equal(prompt.selection.orbitId, rearOrbit);
  assert.equal(prompt.structured.Framing.some((item) => item.id === rearOrbit), true);

  const canonicalPose = prompt.grokPrompt.match(/Pose and Composition:\n([^\n]+)/)?.[1] || '';
  assert.match(canonicalPose, /both hands resting naturally along the body/);
  assertSharedCanonicalPose(prompt, canonicalPose);
  for (const text of [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt]) {
    assert.doesNotMatch(text, /front-camera self-shot|mirror selfie|close-companion social snapshot/i);
  }
});

test('a random hand resolved to a non-selfie preserves an explicitly locked rear orbit', () => {
  const rearOrbit = optionId('orbitId', '背面 180 度');
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    orbitId: rearOrbit,
    poseBaseId: optionId('poseBaseId', '站姿'),
    poseArrangementId: optionId('poseArrangementId', '自然站姿'),
    poseHandId: optionId('poseHandId', '隨機'),
    poseHeadId: optionId('poseHeadId', '頭部自然朝向鏡頭'),
  }, [], { random: () => 0.5 });

  const selfieHandIds = ['自然自拍', '鏡子自拍', '男友/閨蜜自拍']
    .map((label) => optionId('poseHandId', label));
  assert.equal(selfieHandIds.includes(prompt.selection.poseHandId), false);
  assert.equal(prompt.selection.orbitId, rearOrbit);
  for (const text of [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt]) {
    assert.match(text, /back view/i);
    assert.doesNotMatch(text, /front-camera self-shot|mirror selfie|close-companion social snapshot/i);
  }
});

test('generic hand poses adapt beyond standing bases', () => {
  [
    ['雙手自然垂放', /both hands resting naturally along the body or on a nearby support surface/],
    ['雙手撐腰', /both hands placed on the waist or hip line with elbows naturally adapted to the pose/],
    ['雙手背在身後', /both hands drawn behind the back or torso only where physically plausible for the selected pose/],
    ['雙手放在大腿上', /both hands resting on the thighs or nearest upper-leg surface/],
    ['單手托下巴', /one hand supporting the chin.*other hand relaxed along the body or support surface/],
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

  for (const text of [prompt.grokPrompt, prompt.zImagePrompt]) {
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
      expected: /head angled close to a support surface or shoulder line|head close to support surface or shoulder line/,
      expectedGpt: /head angled close to a support surface or shoulder line with the cheek plane following the selected support contact/,
    },
    {
      baseZh: '坐姿',
      arrangementZh: '單腿屈起坐姿',
      anchorZh: '坐在床邊',
      headZh: '近鏡頭偏轉頭部',
      expected: /head turned slightly off-axis near the lens|head slightly off-axis near lens/,
      expectedGpt: /head turned slightly off-axis near the lens with the face plane angled diagonally instead of flat to camera/,
    },
  ];

  for (const { baseZh, arrangementZh, anchorZh, headZh, expected, expectedGpt } of cases) {
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

    assert.match(prompt.grokPrompt, expectedGpt);
    for (const text of [prompt.grokPrompt, prompt.zImagePrompt]) {
      assert.match(text, expected);
    }
  }
});

test('pose composer supports knees-together compact squat with hands gathered near lower abdomen', () => {
  assertArrangementOption(
    '雙膝合併半蹲',
    'squatting',
    /low half-squat with both knees together/
  );
  assertHandOption(
    '雙手收在腹前',
    /both hands gathered close in front of the lower abdomen/
  );
  assertHandOption(
    '雙手收在腹前',
    /elbows tucked inward near the knees/
  );

  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    poseBaseId: optionId('poseBaseId', '蹲姿'),
    poseArrangementId: optionId('poseArrangementId', '雙膝合併半蹲'),
    poseHandId: optionId('poseHandId', '雙手收在腹前'),
    poseAnchorId: optionId('poseAnchorId', '蹲在地面'),
    poseHeadId: optionId('poseHeadId', '頭部微微側傾'),
  });

  assert.match(prompt.grokPrompt, /low half-squat with both knees together/);
  assert.match(prompt.grokPrompt, /feet planted close beneath the body/);
  assert.match(prompt.grokPrompt, /both hands gathered close in front of the lower abdomen/);
  assert.match(prompt.grokPrompt, /elbows tucked inward/);
  for (const text of [prompt.grokPrompt, prompt.zImagePrompt]) {
    assert.match(text, /low half-squat with both knees together/);
    assert.match(text, /feet planted close beneath the body/);
    assert.match(text, /both hands gathered close in front of the lower abdomen|both hands gathered at lower abdomen/);
    assert.match(text, /elbows tucked inward(?: near the knees)?/);
  }
});

test('expressive hand interactions are preserved in all prompt versions', () => {
  const cases = [
    ['單手扶眼鏡', /adjusting the glasses at the frame or bridge/],
    ['單手把眼鏡拉下', /pulling the glasses slightly down the nose bridge/],
    ['雙手整理頭髮', /preparing to tie it up with fingers visibly holding the hair together/],
    ['一手撐地一手放腿上', /one hand planted on the floor or a nearby surface for support, with the other hand resting on the leg/],
  ];

  for (const [handZh, expected, expectedGpt = expected] of cases) {
    const [prompt] = generatePrompts(1, {
      ...createEmptyLocks(),
      subjectCount: '1',
      framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
      poseBaseId: optionId('poseBaseId', '站姿'),
      poseArrangementId: optionId('poseArrangementId', '交叉腿站姿'),
      poseHandId: optionId('poseHandId', handZh),
      poseHeadId: optionId('poseHeadId', '頭部自然朝向鏡頭'),
    });

    assert.match(prompt.grokPrompt, expectedGpt);
    for (const text of [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt]) {
      assert.match(text, expected);
    }
  }
});

test('pocket hand actions distinguish pants and outerwear placement in all prompt versions', () => {
  const cases = [
    ['雙手插褲子口袋', /both hands tucked into the two front pockets of her pants, elbows relaxed and angled slightly outward/],
    ['雙手插外套口袋', /both hands tucked into the two side pockets of her jacket or coat, elbows relaxed and angled slightly outward/],
  ];

  for (const [handZh, expected] of cases) {
    const [prompt] = generatePrompts(1, {
      ...createEmptyLocks(),
      subjectCount: '1',
      framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
      poseBaseId: optionId('poseBaseId', '站姿'),
      poseArrangementId: optionId('poseArrangementId', '自然站姿'),
      poseHandId: optionId('poseHandId', handZh),
      poseHeadId: optionId('poseHeadId', '頭部自然朝向鏡頭'),
    });

    const canonicalPose = prompt.grokPrompt.match(/Pose and Composition:\n([^\n]+)/)?.[1] || '';
    assert.match(canonicalPose, expected);
    for (const text of [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt]) {
      assert.match(text, expected);
      assert.equal(text.split(canonicalPose).length - 1, 1);
    }
    assert.equal(prompt.selection.poseHandId, optionId('poseHandId', handZh));
  }
});

test('hug-knees is an independent hand action rather than a squat arrangement', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    poseBaseId: optionId('poseBaseId', '蹲姿'),
    poseArrangementId: optionId('poseArrangementId', '自然蹲姿'),
    poseHandId: optionId('poseHandId', '雙手抱膝'),
    poseHeadId: optionId('poseHeadId', '頭部自然朝向鏡頭'),
  });

  assert.match(prompt.grokPrompt, /both arms wrapped around the bent knees, hands gently holding the knees close to the torso/);
  assert.match(prompt.grokPrompt, /deep resting squat with both feet flat on the ground, heels down/);
  assert.equal(prompt.selection.poseArrangementId, optionId('poseArrangementId', '自然蹲姿'));
  assert.equal(prompt.selection.poseHandId, optionId('poseHandId', '雙手抱膝'));
});

test('pose composer exposes new standing sitting and squatting arrangement batch', () => {
  [
    ['交叉腿站姿', 'standing', /standing posture with the legs naturally crossed/],
    ['膝蓋微彎站姿', 'standing', /soft bent-knee standing arrangement/],
    ['背對回身站姿', 'standing', /back-facing standing posture with the torso turned toward the camera/],
    ['側身窄站姿', 'standing', /narrow side-facing standing posture/],
    ['一腳向前點地', 'standing', /one foot placed slightly forward, its toe lightly touching the ground/],
    ['單腿屈起坐姿', 'sitting', /one knee drawn up/],
    ['雙腿側放坐姿', 'sitting', /both legs angled to one side/],
    ['坐姿身體前傾', 'sitting', /grounded forward-leaning seated arrangement/],
    ['開闊自信坐姿', 'sitting', /open, grounded seated posture/],
    ['單膝抬起不對稱蹲姿', 'squatting', /asymmetrical deep squat with one knee lifted higher than the other/],
    ['側身蹲姿', 'squatting', /deep squat with the hips and legs kept low while the torso turns toward the camera/],
    ['低蹲單腿前伸', 'squatting', /low squat with one leg extended straight forward/],
    ['身體前傾蹲姿', 'squatting', /deep squat with the torso leaning forward over the thighs/],
    ['雙膝合併半蹲', 'squatting', /low half-squat with both knees together/],
    ['寬膝深蹲／流氓蹲姿', 'squatting', /wide-knee deep squat with feet planted wide/],
  ].forEach(([zh, base, expectedEnglish]) => {
    assertArrangementOption(zh, base, expectedEnglish);
  });
});

test('legacy sitting arrangement locks migrate into contact support anchors', () => {
  const normalizedSeatEdge = normalizeLocks({
    ...createEmptyLocks(),
    poseBaseId: optionId('poseBaseId', '坐姿'),
    poseArrangementId: 'sitting-edge-poised',
  });

  assert.equal(normalizedSeatEdge.poseArrangementId, optionId('poseArrangementId', '全無'));
  assert.equal(normalizedSeatEdge.poseAnchorId, optionId('poseAnchorId', '坐在椅緣'));

  const normalizedWallSeated = normalizeLocks({
    ...createEmptyLocks(),
    poseBaseId: optionId('poseBaseId', '坐姿'),
    poseArrangementId: 'sitting-wall-lean',
  });

  assert.equal(normalizedWallSeated.poseArrangementId, optionId('poseArrangementId', '雙腿自然伸展'));
  assert.equal(normalizedWallSeated.poseAnchorId, optionId('poseAnchorId', '背靠牆坐在地面'));
});

test('legacy poseId locks migrate into visible pose composer controls and clear poseId', () => {
  const cases = [
    {
      poseZh: '坐姿｜側身坐姿',
      baseZh: '坐姿',
      arrangementZh: '雙腿側放坐姿',
    },
    {
      poseZh: '坐姿｜抱膝坐姿',
      baseZh: '坐姿',
      arrangementZh: '雙腿屈起',
    },
    {
      poseZh: '蹲姿｜單膝蹲姿',
      baseZh: '蹲姿',
      arrangementZh: '單膝抬起不對稱蹲姿',
    },
    {
      poseZh: '蹲姿｜手扶膝蓋蹲姿',
      baseZh: '蹲姿',
      arrangementZh: '自然蹲姿',
      handZh: '雙手抱膝',
    },
    {
      poseZh: '半躺低姿態｜手撐半躺',
      baseZh: '躺姿',
      arrangementZh: '半躺倚靠',
      handZh: '一手撐地一手放腿上',
    },
    {
      poseZh: '半躺低姿態｜微蜷放鬆',
      baseZh: '躺姿',
      arrangementZh: '側躺屈膝',
    },
    {
      poseZh: '動態｜輕步移動',
      baseZh: '站姿',
      arrangementZh: '一腳向前點地',
    },
    {
      poseZh: '動態｜整理衣襬',
      baseZh: '站姿',
      arrangementZh: '自然站姿',
      handZh: '整理下身',
      headZh: '低頭看向手部',
    },
    {
      poseZh: '動態｜抬手整理肩頸',
      baseZh: '站姿',
      arrangementZh: '自然站姿',
      handZh: '單手搭肩',
      headZh: '頭部微微側傾',
    },
    {
      poseZh: '動態｜停步姿勢',
      baseZh: '站姿',
      arrangementZh: '膝蓋微彎站姿',
    },
  ];

  for (const expected of cases) {
    const normalized = normalizeLocks({
      ...createEmptyLocks(),
      subjectCount: '1',
      poseId: optionId('poseId', expected.poseZh),
    });

    assert.equal(normalized.poseId, optionId('poseId', '全無'), expected.poseZh);
    assert.equal(normalized.poseBaseId, optionId('poseBaseId', expected.baseZh), expected.poseZh);
    assert.equal(normalized.poseArrangementId, optionId('poseArrangementId', expected.arrangementZh), expected.poseZh);
    if (expected.handZh) {
      assert.equal(normalized.poseHandId, optionId('poseHandId', expected.handZh), expected.poseZh);
    }
    if (expected.headZh) {
      assert.equal(normalized.poseHeadId, optionId('poseHeadId', expected.headZh), expected.poseZh);
    }
  }
});

test('pose composer exposes kneeling and lying expansion batch', () => {
  [
    ['直立端正跪姿', 'kneeling', /upright poised kneeling arrangement/],
    ['側坐跪姿', 'kneeling', /side-sitting kneeling arrangement/],
    ['單膝前跨跪姿', 'kneeling', /one-knee-forward kneeling arrangement/],
    ['手肘支撐跪姿', 'kneeling', /forearms supporting the upper body/],
    ['跪姿微後仰', 'kneeling', /slightly backward-arched kneeling arrangement/],
    ['瑜伽小狗式交叉手托下巴', 'kneeling', /forearms crossed under the chin/],
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
    ['站姿', '交叉腿站姿', /standing posture with the legs naturally crossed/],
    ['坐姿', '開闊自信坐姿', /open, grounded seated posture/],
    ['蹲姿', '側身蹲姿', /deep squat with the hips and legs kept low while the torso turns toward the camera/],
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
        /side-sitting kneeling pose[\s\S]*in front of a low table/,
        /side-sitting kneeling pose/,
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
        /prone lying pose[\s\S]*on a bed/,
        /prone lying pose with elbows propping up/,
        /one hand holding the ankle/,
        /head turned over one shoulder toward the camera/,
      ],
    },
    {
      baseZh: '跪姿',
      arrangementZh: '瑜伽小狗式交叉手托下巴',
      handZh: '全無',
      anchorZh: '跪在地面',
      headZh: '頭部自然朝向鏡頭',
      expected: [
        /extended puppy kneeling pose[\s\S]*on the ground/,
        /extended puppy kneeling pose/,
        /torso folded forward/,
        /forearms crossed under(?: the)? chin/,
        /hands tucked below the jaw|forearms crossed under chin/,
      ],
      expectedGpt: [
        /extended puppy kneeling pose[\s\S]*on the ground/,
        /extended puppy kneeling pose/,
        /knees grounded/,
        /torso folded forward/,
        /forearms crossed under the chin/,
        /hands tucked below the jaw/,
      ],
    },
  ];

  for (const { baseZh, arrangementZh, handZh, anchorZh, headZh, expected, expectedGpt = expected } of cases) {
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

    expectedGpt.forEach((pattern) => assert.match(prompt.grokPrompt, pattern));
    for (const text of [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt]) {
      expected.forEach((pattern) => assert.match(text, pattern));
    }
  }
});

test('lying orientation and body variation compose into one shared canonical pose', () => {
  const poseText = (prompt) => prompt.grokPrompt.match(/Pose and Composition:\n([^\n]+)/)?.[1] || '';
  const baseLocks = {
    ...createEmptyLocks(),
    subjectCount: '1',
    poseBaseId: optionId('poseBaseId', '躺姿'),
    poseHandId: optionId('poseHandId', '全無'),
    posePropId: optionId('posePropId', '全無'),
    poseHeadId: optionId('poseHeadId', '全無'),
    poseAnchorId: optionId('poseAnchorId', '全無'),
  };
  const orientationId = optionId('poseOrientationId', '趴臥');
  const variationId = optionId('poseArrangementId', '上半身撐起');
  const [fullPrompt] = generatePrompts(1, {
    ...baseLocks,
    poseOrientationId: orientationId,
    poseArrangementId: variationId,
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
  });
  const canonical = poseText(fullPrompt);
  assert.match(canonical, /prone lying position/);
  assert.match(canonical, /chest and abdomen facing the support surface/);
  assert.match(canonical, /upper body lifted and supported on the elbows or forearms/);
  assert.match(canonical, /lower body remains on the support surface/);
  assert.equal(fullPrompt.selection.poseOrientationId, 'lying-prone');
  assert.equal(fullPrompt.selection.poseArrangementId, 'lying-body-upper-propped');
  assert.ok(fullPrompt.zImagePrompt.includes(canonical));
  assert.ok(fullPrompt.midjourneyPrompt.includes(canonical));

  const [chestPrompt] = generatePrompts(1, {
    ...baseLocks,
    poseOrientationId: orientationId,
    poseArrangementId: variationId,
    framingId: optionId('framingId', '胸上特寫'),
  });
  const chestCanonical = poseText(chestPrompt);
  assert.match(chestCanonical, /upper-body pose/);
  assert.match(chestCanonical, /upper torso facing downward toward the support surface/);
  assert.match(chestCanonical, /upper body lifted and supported on the elbows or forearms/);
  assert.doesNotMatch(chestCanonical, /lower body remains on the support surface/);
});

test('lying public English keeps orientation and body variation geometry distinct across crops', () => {
  const poseText = (prompt) => prompt.grokPrompt.match(/Pose and Composition:\n([^\n]+)/)?.[1] || '';
  const orientations = [
    ['仰躺', /supine lying position, back supported, chest and face turned upward/],
    ['側躺', /side-lying position, body turned onto one side/],
    ['趴臥', /prone lying position, chest and abdomen facing the support surface, face turned downward/],
  ];
  const variations = [
    { zh: '自然伸展', full: /body extended in a relaxed line, legs resting naturally/ },
    { zh: '雙腿屈起', full: /both legs comfortably bent, knees softly raised/ },
    { zh: '身體微蜷', full: /torso and legs gently curved inward into a soft compact shape/, projected: /torso gently curled into a soft compact curve/ },
    { zh: '上半身半躺', full: /upper body raised into a gentle half-recline while the lower body remains relaxed in the lying position/, projected: /upper body raised into a gentle half-recline/ },
    { zh: '上半身撐起', full: /upper body lifted and supported on the elbows or forearms while the lower body remains on the support surface/, projected: /upper body lifted and supported on the elbows or forearms/ },
  ];
  const lowerBodyVariations = new Set(['自然伸展', '雙腿屈起']);
  const baseLocks = {
    ...createEmptyLocks(),
    subjectCount: '1',
    poseBaseId: optionId('poseBaseId', '躺姿'),
    poseHandId: optionId('poseHandId', '全無'),
    posePropId: optionId('posePropId', '全無'),
    poseHeadId: optionId('poseHeadId', '全無'),
    poseAnchorId: optionId('poseAnchorId', '全無'),
  };

  for (const [orientationZh, orientationPattern] of orientations) {
    for (const variation of variations) {
      const { zh: variationZh, full: variationPattern, projected: projectedVariationPattern } = variation;
      const locks = {
        ...baseLocks,
        poseOrientationId: optionId('poseOrientationId', orientationZh),
        poseArrangementId: optionIdForBase('poseArrangementId', variationZh, 'lying'),
      };
      const [fullPrompt] = generatePrompts(1, {
        ...locks,
        framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
      });
      const fullCanonical = poseText(fullPrompt);
      assert.match(fullCanonical, orientationPattern, `${orientationZh} + ${variationZh} full body orientation`);
      assert.match(fullCanonical, variationPattern, `${orientationZh} + ${variationZh} full body variation`);
      assert.doesNotMatch(fullCanonical, /arrangement|model-decided|front of the body resting toward/i);

      const [chestPrompt] = generatePrompts(1, {
        ...locks,
        framingId: optionId('framingId', '胸上特寫'),
      });
      const chestCanonical = poseText(chestPrompt);
      assert.match(chestCanonical, /upper-body pose/);
      assert.match(chestCanonical, /upper torso|upper body/);
      if (lowerBodyVariations.has(variationZh)) {
        assert.doesNotMatch(chestCanonical, variationPattern);
        assert.doesNotMatch(chestCanonical, /legs|knees|lower body/i);
      } else {
        assert.match(chestCanonical, projectedVariationPattern);
        assert.doesNotMatch(chestCanonical, /legs|knees|lower body remains/i);
      }
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

  const canonicalPose = prompt.grokPrompt.match(/Pose and Composition:\n([^\n]+)/)?.[1] || '';
  for (const text of [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt]) {
    assert.match(text, /She has her head slightly tilted, one hand touching the chin, and presents a relaxed standing posture with weight shifted onto one leg and a natural asymmetrical balance beside a doorway frame/);
    assert.match(text, /weight shifted onto one leg/);
    assert.match(text, /one hand touching the chin/);
    assert.match(text, /head slightly tilted/);
  }
  assert.equal(prompt.zImagePrompt.split(canonicalPose).length - 1, 1);
  assert.equal(prompt.midjourneyPrompt.split(canonicalPose).length - 1, 1);
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
  assert.match(prompt.grokPrompt, /leaning against any suitable existing object within the current scene/);
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
    locationId: optionId('locationId', '戶外：飯店度假村泳池露台'),
    poseAnchorId: optionId('poseAnchorId', '浴缸'),
    poseHeadId: optionId('poseHeadId', '回頭朝向鏡頭'),
  });

  assert.match(prompt.grokPrompt, /presents a casually languid lying pose, relaxed uneven limbs, soft body weight settled into the surface inside a water-filled clawfoot vintage bathtub/);
  assert.match(prompt.grokPrompt, /one hand supporting the chin/);
  assert.match(prompt.grokPrompt, /head turned back toward the camera/);
  assert.match(prompt.grokPrompt, /the outfit and exposed skin are soaked by bath water/);
  assert.match(prompt.grokPrompt, /clothing remains complete and non-transparent/);
  for (const text of [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt]) {
    assert.match(text, /casually languid lying pose/);
    assert.match(text, /inside a water-filled clawfoot vintage bathtub/);
    assert.match(text, /clothing remains complete and non-transparent/);
  }
  assert.equal(prompt.selection.poseBaseId, optionId('poseBaseId', '躺姿'));
  assert.equal(prompt.selection.poseHeadId, optionId('poseHeadId', '回頭朝向鏡頭'));
});

test('shared bathtub anchor phrases naturally for standing sitting and squatting bases', () => {
  const cases = [
    ['站姿', '自然站姿', /presents a relaxed neutral standing posture beside a water-filled clawfoot vintage bathtub/, false],
    ['坐姿', '自然坐姿', /presents a natural seated pose on the edge of a water-filled clawfoot vintage bathtub/, true],
    ['蹲姿', '自然蹲姿', /presents a deep resting squat with both feet flat on the ground, heels down, knees deeply bent, and the body balanced low over the feet inside a water-filled clawfoot vintage bathtub/, true],
  ];

  for (const [baseZh, arrangementZh, expected, expectsWaterContact] of cases) {
    const [prompt] = generatePrompts(1, {
      ...createEmptyLocks(),
      subjectCount: '1',
      framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
      locationId: optionId('locationId', '戶外：飯店度假村泳池露台'),
      poseBaseId: optionId('poseBaseId', baseZh),
      poseArrangementId: optionId('poseArrangementId', arrangementZh),
      poseHandId: optionId('poseHandId', '雙手自然垂放'),
      poseAnchorId: optionId('poseAnchorId', '浴缸'),
      poseHeadId: optionId('poseHeadId', '頭部自然朝向鏡頭'),
    });

    for (const text of [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt]) assert.match(text, expected);
    if (expectsWaterContact) {
      for (const text of [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt]) {
        assert.match(text, /visible water sheen and droplets, darker damp fabric tones, heavier wet folds/);
        assert.match(text, /clothing remains complete and non-transparent/);
      }
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

  assert.match(prompt.grokPrompt, /presents a casually slumped seated posture with a loose, heavy body, dropped shoulders/i);
  assert.match(prompt.grokPrompt, /casually slumped/);
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

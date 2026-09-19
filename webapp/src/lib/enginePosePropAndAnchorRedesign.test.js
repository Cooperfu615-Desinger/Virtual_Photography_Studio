import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createEmptyLocks,
  generatePrompts,
  getLockControls,
  getSceneDependentOptions,
  normalizeLocks,
} from './engine.js';
import { buildPage1ControlGroups } from '../features/page1/page1Selectors.js';
import { poseComposerOptionVisibleForBase } from './engine/poseComposerCompatibility.js';

const LIPSTICK_PROMPT = 'one hand applying lipstick directly to the lips with visible hand-to-mouth contact, with the finish varying naturally between clean application and a slightly smudged lip line';
const FUJI_CAMERA_PROMPT = 'a silver-and-black FUJIFILM X100V camera raised directly in front of her face, her right eye looking through the viewfinder, her right hand gripping the camera with her index finger poised on the shutter button, captured in the act of taking a photograph';
const WHIRLY_LOLLIPOP_PROMPT = 'an oversized colorful whirly pop swirl lollipop with a large playful candy head, held naturally in one hand, cute cheerful prop detail';
const ROUND_LOLLIPOP_PROMPT = 'a round lollipop held between her lips, the white stick extending outward with her right hand gripping the far end, cute playful pose';

function control(key) {
  const entry = getLockControls().find((item) => item.key === key);
  assert.ok(entry, `Expected control ${key}`);
  return entry;
}

function option(controlKey, matcher) {
  const entry = control(controlKey).options.find((item) => (
    typeof matcher === 'function' ? matcher(item) : item.zh === matcher
  ));
  assert.ok(entry, `Expected option ${String(matcher)} in ${controlKey}`);
  return entry;
}

function canonicalPose(prompt) {
  return prompt.grokPrompt.match(/Pose and Composition:\n([^\n]+)/)?.[1] || '';
}

test('Pose Composer exposes prop actions separately from hand actions', () => {
  const handControl = control('poseHandId');
  const propControl = control('posePropId');

  assert.equal(handControl.label, '手部動作');
  assert.equal(propControl.label, '道具動作');
  assert.equal(handControl.options.some((item) => item.meta?.tags?.includes('prop_action')), false);
  assert.equal(handControl.options.some((item) => item.zh === '自然自拍'), true);
  assert.equal(handControl.options.some((item) => item.zh === '整理下身'), true);

  assert.deepEqual(
    propControl.options
      .filter((item) => item.zh !== '全無' && item.zh !== '隨機')
      .map((item) => item.zh),
    ['塗口紅｜自由妝感', '手持冰咖啡', '手持威士忌', '手持香檳', '手持礦泉水瓶', '手持單眼 FUJI X-100V 相機', '手持波板糖', '含著圓形棒棒糖｜右手持棒', '手持香菸', '滑手機'],
  );
  assert.equal(option('posePropId', '塗口紅｜自由妝感').id, 'hand-apply-lipstick');
  assert.equal(option('posePropId', '塗口紅｜自由妝感').en, LIPSTICK_PROMPT);
  assert.equal(option('posePropId', '手持威士忌').id, 'hand-hold-whiskey');
  assert.match(option('posePropId', '手持威士忌').en, /amber whiskey/i);
  assert.equal(option('posePropId', '手持香檳').id, 'hand-hold-champagne');
  assert.match(option('posePropId', '手持香檳').en, /champagne flute/i);
  assert.equal(option('posePropId', '手持礦泉水瓶').id, 'hand-hold-mineral-water');
  assert.match(option('posePropId', '手持礦泉水瓶').en, /condensation droplets/i);
  assert.equal(option('posePropId', '手持單眼 FUJI X-100V 相機').id, 'hand-hold-fuji-x100v');
  assert.equal(option('posePropId', '手持單眼 FUJI X-100V 相機').en, FUJI_CAMERA_PROMPT);
  assert.deepEqual(option('posePropId', '手持單眼 FUJI X-100V 相機').meta.tags, ['prop_action', 'face_action']);
  assert.equal(option('posePropId', '手持波板糖').en, WHIRLY_LOLLIPOP_PROMPT);
  assert.equal(option('posePropId', '含著圓形棒棒糖｜右手持棒').id, 'hand-hold-round-lollipop-mouth');
  assert.equal(option('posePropId', '含著圓形棒棒糖｜右手持棒').en, ROUND_LOLLIPOP_PROMPT);
  assert.deepEqual(option('posePropId', '含著圓形棒棒糖｜右手持棒').meta.tags, ['prop_action', 'face_action']);
  assert.equal(propControl.options.some((item) => item.id === 'hand-messy-lipstick'), false);
});

test('legacy prop-action hand locks migrate into posePropId and clear poseHandId', () => {
  const migrations = new Map([
    ['hand-apply-lipstick', 'hand-apply-lipstick'],
    ['hand-messy-lipstick', 'hand-apply-lipstick'],
    ['hand-hold-iced-coffee', 'hand-hold-iced-coffee'],
    ['hand-hold-whirly-lollipop', 'hand-hold-whirly-lollipop'],
    ['hand-hold-cigarette', 'hand-hold-cigarette'],
    ['hand-use-phone', 'hand-use-phone'],
  ]);

  for (const [legacyHandId, expectedPropId] of migrations) {
    const normalized = normalizeLocks({
      ...createEmptyLocks(),
      subjectCount: '1',
      poseHandId: legacyHandId,
      posePropId: 'none',
    });
    assert.equal(normalized.poseHandId, 'none', legacyHandId);
    assert.equal(normalized.posePropId, expectedPropId, legacyHandId);
  }
});

test('retired pose options stay restorable while the public picker excludes them', () => {
  const retiredCases = [
    ['poseHeadId', '越肩回望', '站姿'],
    ['poseHeadId', '側臉轉向畫面外', '站姿'],
    ['poseHeadId', '下巴靠近肩線', '站姿'],
    ['poseArrangementId', '雙手後撐', '坐姿'],
    ['poseArrangementId', '瑜伽小狗式交叉手托下巴', '跪姿'],
    ['poseArrangementId', '手肘支撐跪姿', '跪姿'],
    ['poseArrangementId', '單膝跪地', '跪姿'],
    ['poseArrangementId', '跪姿微後仰', '跪姿'],
  ];

  for (const [key, label, baseLabel] of retiredCases) {
    const retired = option(key, label);
    assert.equal(retired.meta?.uiHidden, true, label);
    assert.equal(retired.meta?.randomEligible, false, label);
    assert.equal(retired.meta?.deprecated, true, label);

    const locks = {
      ...createEmptyLocks(),
      subjectCount: '1',
      poseBaseId: option('poseBaseId', baseLabel).id,
      [key]: retired.id,
    };
    assert.equal(normalizeLocks(locks)[key], retired.id, label);

    const groups = buildPage1ControlGroups({
      lockControls: getLockControls(),
      locks,
      sceneDependentOptions: getSceneDependentOptions([], locks),
    });
    const picker = groups.characterLockControls.find((item) => item.key === key);
    assert.ok(picker, `Expected picker for ${key}`);
    assert.equal(picker.options.some((item) => item.id === retired.id), true, `${label} should remain visible when selected`);
    assert.equal(picker.options.some((item) => item.meta?.uiHidden && item.id !== retired.id), false, `${label} should hide other retired options`);
  }

  const renamed = option('poseArrangementId', '雙腿屈起');
  assert.equal(renamed.id, 'sitting-hug-knees');
  assert.match(renamed.en, /both legs bent and knees raised/i);
});

test('an active prop takes over the hand layer when both locks are supplied', () => {
  const normalized = normalizeLocks({
    ...createEmptyLocks(),
    subjectCount: '1',
    poseHandId: option('poseHandId', '單手摸下巴').id,
    posePropId: option('posePropId', '手持香菸').id,
  });

  assert.equal(normalized.poseHandId, 'none');
  assert.equal(normalized.posePropId, 'hand-hold-cigarette');
});

test('legacy lipstick special actions converge on the merged prop action', () => {
  for (const label of ['塗口紅', '塗歪口紅']) {
    const legacyAction = option('specialActionId', label);
    const normalized = normalizeLocks({
      ...createEmptyLocks(),
      subjectCount: '1',
      specialActionId: legacyAction.id,
    });

    assert.equal(normalized.specialActionId, option('specialActionId', '全無').id);
    assert.equal(normalized.poseHandId, 'none');
    assert.equal(normalized.posePropId, 'hand-apply-lipstick');
  }
});

test('prop action is emitted once in the shared canonical pose across all three renderers', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '1',
    framingId: option('framingId', '全身鏡頭 (Full Body Shot)').id,
    poseBaseId: option('poseBaseId', '站姿').id,
    poseArrangementId: option('poseArrangementId', '自然站姿').id,
    poseHandId: option('poseHandId', '單手摸下巴').id,
    posePropId: option('posePropId', '塗口紅｜自由妝感').id,
    poseHeadId: option('poseHeadId', '頭部自然朝向鏡頭').id,
    poseAnchorId: 'none',
  });

  const pose = canonicalPose(prompt);
  assert.equal(prompt.selection.poseHandId, 'none');
  assert.equal(prompt.selection.posePropId, 'hand-apply-lipstick');
  assert.ok(pose.includes(LIPSTICK_PROMPT));
  assert.equal(pose.split(LIPSTICK_PROMPT).length - 1, 1);
  assert.ok(prompt.zImagePrompt.includes(pose));
  assert.ok(prompt.midjourneyPrompt.includes(pose));
});

test('round lollipop prop keeps the mouth contact and right-hand grip in the canonical pose', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '1',
    framingId: option('framingId', '全身鏡頭 (Full Body Shot)').id,
    poseBaseId: option('poseBaseId', '站姿').id,
    poseArrangementId: option('poseArrangementId', '自然站姿').id,
    poseHandId: option('poseHandId', '單手摸下巴').id,
    posePropId: option('posePropId', '含著圓形棒棒糖｜右手持棒').id,
    poseHeadId: option('poseHeadId', '頭部自然朝向鏡頭').id,
    poseAnchorId: 'none',
  });

  const pose = canonicalPose(prompt);
  assert.equal(prompt.selection.poseHandId, 'none');
  assert.equal(prompt.selection.posePropId, 'hand-hold-round-lollipop-mouth');
  assert.ok(pose.includes(ROUND_LOLLIPOP_PROMPT));
  assert.equal(pose.split(ROUND_LOLLIPOP_PROMPT).length - 1, 1);
  assert.ok(prompt.zImagePrompt.includes(pose));
  assert.ok(prompt.midjourneyPrompt.includes(pose));
});

test('manual sitting objects are public while generic relationship anchors stay restorable', () => {
  const publicLabels = [
    '坐在一般椅子上',
    '坐在單人雕花絨布椅',
    '坐在沙發上',
    '坐在長椅上',
    '坐在台階上',
    '坐在床上',
    '坐在地面',
    '坐在浴缸內',
    '坐在洗手台檯面上',
  ];
  for (const label of publicLabels) {
    const anchor = option('poseAnchorId', label);
    assert.notEqual(anchor.meta?.uiHidden, true, label);
    assert.equal(anchor.meta?.randomEligibleForBases?.sitting, false, label);
    assert.equal(anchor.meta?.preserveInSceneIntegratedZ, true, label);
  }

  for (const label of ['坐在現有場景座面', '坐在現有抬高邊緣', '站在門框邊']) {
    const legacy = option('poseAnchorId', label);
    assert.equal(legacy.meta?.uiHidden, true, label);
    assert.equal(legacy.meta?.randomEligible, false, label);
    assert.equal(legacy.meta?.deprecated, true, label);
  }

  const legacyDoorway = option('poseAnchorId', '站在門框邊');
  const locks = {
    ...createEmptyLocks(),
    subjectCount: '1',
    poseBaseId: 'standing',
    poseAnchorId: legacyDoorway.id,
  };
  assert.equal(normalizeLocks(locks).poseAnchorId, legacyDoorway.id);

  const groups = buildPage1ControlGroups({
    lockControls: getLockControls(),
    locks,
    sceneDependentOptions: getSceneDependentOptions([], locks),
  });
  const pickerAnchors = groups.characterLockControls.find((item) => item.key === 'poseAnchorId').options;
  assert.equal(pickerAnchors.some((item) => item.id === legacyDoorway.id), true);
  assert.equal(pickerAnchors.some((item) => item.meta?.uiHidden && item.id !== legacyDoorway.id), false);
});

test('standing kneeling and squatting expose no external support choices while sitting exposes nine manual objects', () => {
  const anchors = control('poseAnchorId').options;
  const visibleIdsForBase = (baseId) => anchors
    .filter((anchor) => anchor.meta?.uiHidden !== true)
    .filter((anchor) => poseComposerOptionVisibleForBase(anchor, baseId))
    .filter((anchor) => !anchor.base || anchor.base === baseId)
    .filter((anchor) => !anchor.bases || anchor.bases.includes(baseId))
    .map((anchor) => anchor.id);

  for (const baseId of ['standing', 'kneeling', 'squatting']) {
    assert.deepEqual(visibleIdsForBase(baseId), ['none'], baseId);
  }
  assert.deepEqual(visibleIdsForBase('sitting'), [
    'none',
    'sitting-chair',
    'sitting-ornate-velvet-armchair',
    'sitting-sofa',
    'sitting-bench',
    'sitting-step',
    'sitting-bed',
    'sitting-ground',
    'sitting-inside-bathtub',
    'sitting-vanity-countertop',
  ]);
});

test('every manual sitting object is retained with concise wording in GPT Z-Image and Midjourney', () => {
  const expectedByLabel = new Map([
    ['坐在一般椅子上', 'on a chair'],
    ['坐在單人雕花絨布椅', 'in an ornate single velvet armchair'],
    ['坐在沙發上', 'on a sofa'],
    ['坐在長椅上', 'on a bench'],
    ['坐在台階上', 'on a step'],
    ['坐在床上', 'on a bed'],
    ['坐在地面', 'on the ground'],
    ['坐在浴缸內', 'in a bathtub'],
    ['坐在洗手台檯面上', 'on a bathroom vanity countertop beside the sink'],
  ]);

  for (const [label, phrase] of expectedByLabel) {
    const anchor = option('poseAnchorId', label);
    const [prompt] = generatePrompts(1, {
      ...createEmptyLocks(),
      subjectCount: '1',
      framingId: option('framingId', '全身鏡頭 (Full Body Shot)').id,
      poseBaseId: 'sitting',
      poseArrangementId: option('poseArrangementId', '自然坐姿').id,
      poseAnchorId: anchor.id,
    });
    const expected = `natural seated pose ${phrase}`;
    assert.equal(prompt.selection.poseAnchorId, anchor.id, label);
    assert.match(prompt.grokPrompt, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), label);
    assert.match(prompt.zImagePrompt, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), label);
    assert.match(prompt.midjourneyPrompt, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), label);
    for (const output of [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt]) {
      assert.doesNotMatch(output, /body weight visibly supported|clear .*contact|already present in the scene/i, label);
    }
  }
});

test('cube plinth anchors stay restorable but leave the public picker and random pool', () => {
  const cubeAnchors = [
    option('poseAnchorId', '鏡面不鏽鋼立方台'),
    option('poseAnchorId', '透明壓克力立方台'),
  ];

  for (const cubeAnchor of cubeAnchors) {
    assert.equal(cubeAnchor.meta?.uiHidden, true, cubeAnchor.zh);
    assert.equal(cubeAnchor.meta?.randomEligible, false, cubeAnchor.zh);
    assert.equal(cubeAnchor.meta?.deprecated, true, cubeAnchor.zh);

    const locks = {
      ...createEmptyLocks(),
      subjectCount: '1',
      framingId: option('framingId', '全身鏡頭 (Full Body Shot)').id,
      poseBaseId: 'lying',
      poseArrangementId: 'lying-natural-half-recline',
      poseAnchorId: cubeAnchor.id,
    };
    assert.equal(normalizeLocks(locks).poseAnchorId, cubeAnchor.id);

    const groups = buildPage1ControlGroups({
      lockControls: getLockControls(),
      locks,
      sceneDependentOptions: getSceneDependentOptions([], locks),
    });
    const pickerAnchors = groups.characterLockControls.find((item) => item.key === 'poseAnchorId').options;
    assert.equal(pickerAnchors.some((item) => item.id === cubeAnchor.id), true);
    assert.equal(pickerAnchors.some((item) => item.meta?.uiHidden && item.id !== cubeAnchor.id), false);

    const [prompt] = generatePrompts(1, locks);
    assert.equal(prompt.selection.poseAnchorId, cubeAnchor.id);
    assert.match(prompt.grokPrompt, /cube plinth/);
  }

  const hiddenIds = new Set(cubeAnchors.map((anchor) => anchor.id));
  for (const baseId of ['standing', 'sitting', 'kneeling', 'squatting', 'lying']) {
    const locks = {
      ...createEmptyLocks(),
      subjectCount: '1',
      poseBaseId: baseId,
      ...(baseId === 'lying' ? { poseOrientationId: 'random' } : {}),
      poseAnchorId: 'random',
    };
    const [naturalSupportPrompt] = generatePrompts(1, locks, [], { random: () => 0.34 });
    if (baseId === 'lying') {
      assert.ok(
        naturalSupportPrompt.selection.poseAnchorId.startsWith('lying-')
          || ['water-immersed', 'water-edge-support'].includes(naturalSupportPrompt.selection.poseAnchorId),
        `lying should use a dedicated or water support anchor: ${naturalSupportPrompt.selection.poseAnchorId}`,
      );
    } else {
      assert.equal(naturalSupportPrompt.selection.poseAnchorId, 'none', baseId);
    }

    for (let index = 0; index < 100; index += 1) {
      const [prompt] = generatePrompts(1, locks, [], { random: () => index / 100 });
      assert.equal(hiddenIds.has(prompt.selection.poseAnchorId), false, `${baseId}:${index}`);
    }
  }

  const [weightedStandingPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '1',
    poseBaseId: 'standing',
    poseAnchorId: 'random',
  }, [], { random: () => 0.65 });
  assert.equal(weightedStandingPrompt.selection.poseAnchorId, 'none');
});

test('lying body variations are public while previous specialized arrangements stay restorable but hidden', () => {
  const publicArrangement = option('poseArrangementId', '上半身半躺');
  const legacyArrangement = option('poseArrangementId', '半躺倚靠');
  assert.notEqual(publicArrangement.meta?.uiHidden, true);
  assert.equal(legacyArrangement.meta?.uiHidden, true);
  assert.equal(legacyArrangement.meta?.randomEligible, false);
  assert.equal(legacyArrangement.meta?.deprecated, true);

  const locks = {
    ...createEmptyLocks(),
    subjectCount: '1',
    poseBaseId: 'lying',
    poseArrangementId: legacyArrangement.id,
  };
  assert.equal(normalizeLocks(locks).poseArrangementId, legacyArrangement.id);

  const groups = buildPage1ControlGroups({
    lockControls: getLockControls(),
    locks,
    sceneDependentOptions: getSceneDependentOptions([], locks),
  });
  const pickerArrangements = groups.characterLockControls.find((item) => item.key === 'poseArrangementId').options;
  assert.equal(pickerArrangements.some((item) => item.id === legacyArrangement.id), true);
  assert.equal(pickerArrangements.some((item) => item.meta?.uiHidden && item.id !== legacyArrangement.id), false);
});

test('non-lying random anchors resolve to free arrangement without adding objects', () => {
  const locks = {
    ...createEmptyLocks(),
    subjectCount: '1',
    poseBaseId: 'standing',
    poseAnchorId: 'random',
  };
  const [nonePrompt] = generatePrompts(1, locks, [], { random: () => 0 });
  assert.equal(nonePrompt.selection.poseAnchorId, 'none');

  const [freePrompt] = generatePrompts(1, locks, [], { random: () => 0.99 });
  assert.equal(freePrompt.selection.poseAnchorId, 'none');
});

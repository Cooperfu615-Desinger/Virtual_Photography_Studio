import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createEmptyLocks,
  createSeededRandom,
  generatePrompts,
  getLockControls,
} from '../engine.js';

const controls = getLockControls();
const controlsByKey = new Map(controls.map((control) => [control.key, control]));
const FIXED_SET_SCENE_ANCHOR = /black velvet sofa/i;
const SUBJECT_ANCHOR = /A 20s seductive stunning Japanese or Korean woman/i;

const WARDROBE_CASES = [
  {
    id: 'separates',
    locks: {
      topId: '棉質細肩背心',
      pantsId: '直筒牛仔褲',
    },
    selectedKeys: ['topId', 'pantsId'],
    wardrobeAnchor: /cotton camisole top/i,
  },
  {
    id: 'special-outfit',
    locks: {
      specialOutfitId: '酒紅格紋吊帶牛仔短裙長靴造型',
    },
    selectedKeys: ['specialOutfitId'],
    wardrobeAnchor: /burgundy plaid handkerchief camisole/i,
  },
  {
    id: 'outfit-preset',
    locks: {
      outfitPresetId: '套裝：春日巴黎亞麻長褲',
    },
    selectedKeys: ['outfitPresetId'],
    wardrobeAnchor: /Parisian linen trouser outfit/i,
  },
  {
    id: 'dress',
    locks: {
      dressId: '連身：短版｜一字領哥德迷你洋裝',
    },
    selectedKeys: ['dressId'],
    wardrobeAnchor: /off-shoulder gothic mini dress/i,
  },
];

function optionId(key, zh) {
  const option = controlsByKey.get(key)?.options?.find((entry) => entry.zh === zh);
  assert.ok(option, `Missing ${key} option ${zh}`);
  return option.id;
}

function createAllNoneLocks() {
  const locks = { ...createEmptyLocks() };
  for (const control of controls) {
    const noneOption = control.options?.find((entry) => entry.zh === '全無');
    if (noneOption) locks[control.key] = noneOption.id;
  }
  return locks;
}

function materializeLocks(promptCase) {
  const locks = {
    ...createAllNoneLocks(),
    subjectCount: '1',
    fixedCompositionSetId: optionId('fixedCompositionSetId', '暖灰泥黑絲絨工業沙發棚'),
    fixedSetPositionId: optionId('fixedSetPositionId', '自由場景互動'),
    fixedSetCaptureModeId: optionId('fixedSetCaptureModeId', '攝影師拍攝'),
    fixedSetPerformanceStateId: optionId('fixedSetPerformanceStateId', '模型自然發揮'),
    poseBaseId: optionId('poseBaseId', '站姿'),
    poseArrangementId: optionId('poseArrangementId', '自然站姿'),
  };

  for (const [key, zh] of Object.entries(promptCase.locks)) {
    locks[key] = optionId(key, zh);
  }
  return locks;
}

function poseSection(gptPrompt) {
  const marker = 'Pose and Composition:\n';
  const start = gptPrompt.indexOf(marker);
  assert.ok(start >= 0, 'Gpt should contain Pose and Composition');
  const valueStart = start + marker.length;
  const sceneStart = gptPrompt.indexOf('\n\nScene:\n', valueStart);
  assert.ok(sceneStart > valueStart, 'Gpt pose should precede Scene');
  return gptPrompt.slice(valueStart, sceneStart).trim();
}

function contentIndex(text, pattern) {
  if (pattern instanceof RegExp) return text.search(pattern);
  return text.indexOf(pattern);
}

function assertNaturalOutputOrder(text, wardrobeAnchor, canonicalPose, field, caseId) {
  const subjectIndex = contentIndex(text, SUBJECT_ANCHOR);
  const wardrobeIndex = contentIndex(text, wardrobeAnchor);
  const poseIndex = contentIndex(text, canonicalPose);
  const sceneIndex = contentIndex(text, FIXED_SET_SCENE_ANCHOR);

  assert.ok(subjectIndex >= 0, `${caseId}.${field} should contain the subject`);
  assert.ok(wardrobeIndex >= 0, `${caseId}.${field} should contain the wardrobe`);
  assert.ok(poseIndex >= 0, `${caseId}.${field} should reuse the canonical pose`);
  assert.ok(sceneIndex >= 0, `${caseId}.${field} should contain the fixed-set scene`);
  assert.ok(subjectIndex < wardrobeIndex, `${caseId}.${field} should place subject before wardrobe`);
  assert.ok(wardrobeIndex < poseIndex, `${caseId}.${field} should place wardrobe before pose`);
  assert.ok(poseIndex < sceneIndex, `${caseId}.${field} should place pose before fixed-set scene`);
}

for (const promptCase of WARDROBE_CASES) {
  test(`fixed composition integration preserves canonical order for ${promptCase.id}`, () => {
    const locks = materializeLocks(promptCase);
    const [prompt] = generatePrompts(1, locks, [], {
      random: createSeededRandom(`fixed-composition-integration-${promptCase.id}-v1`),
    });
    const canonicalPose = poseSection(prompt.grokPrompt);

    assert.equal(canonicalPose, 'She presents a natural relaxed standing pose.');
    assert.equal(prompt.selection.fixedCompositionSetId, locks.fixedCompositionSetId);
    assert.equal(prompt.selection.framingId, optionId('framingId', '全無'));
    for (const key of promptCase.selectedKeys) {
      assert.equal(prompt.selection[key], locks[key], `${promptCase.id}: ${key} should remain selected`);
    }

    const gptSubjectIndex = prompt.grokPrompt.indexOf('Subject:\n');
    const gptWardrobeIndex = prompt.grokPrompt.indexOf('Wardrobe:\n');
    const gptPoseIndex = prompt.grokPrompt.indexOf('Pose and Composition:\n');
    const gptSceneIndex = prompt.grokPrompt.indexOf('Scene:\n');
    assert.ok(gptSubjectIndex < gptWardrobeIndex, `${promptCase.id}.grokPrompt should place subject before wardrobe`);
    assert.ok(gptWardrobeIndex < gptPoseIndex, `${promptCase.id}.grokPrompt should place wardrobe before pose`);
    assert.ok(gptPoseIndex < gptSceneIndex, `${promptCase.id}.grokPrompt should place pose before scene`);
    assert.match(prompt.grokPrompt, promptCase.wardrobeAnchor);
    assert.match(prompt.grokPrompt, FIXED_SET_SCENE_ANCHOR);

    assertNaturalOutputOrder(prompt.zImagePrompt, promptCase.wardrobeAnchor, canonicalPose, 'zImagePrompt', promptCase.id);
    assertNaturalOutputOrder(prompt.midjourneyPrompt, promptCase.wardrobeAnchor, canonicalPose, 'midjourneyPrompt', promptCase.id);
  });
}

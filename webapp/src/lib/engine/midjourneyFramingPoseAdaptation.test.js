import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls } from '../engine.js';
import {
  buildMidjourneyFramingPoseAdaptation,
  classifyMidjourneyLens,
  resolveMidjourneyAspectRatio,
} from './midjourneyFramingPoseAdaptation.js';
import { COMPOSITION_VISIBILITY_BUCKETS } from './compositionVisibilityContract.js';

const controls = getLockControls();

function optionId(controlKey, zh) {
  const control = controls.find((entry) => entry.key === controlKey);
  const option = control?.options?.find((entry) => entry.zh === zh);
  assert.ok(option, `Expected option ${zh} in ${controlKey}`);
  return option.id;
}

function createAllNoneLocks() {
  return Object.fromEntries(
    controls.map((control) => [
      control.key,
      control.options?.find((option) => option.zh === '全無')?.id || '',
    ])
  );
}

test('Midjourney lens classification keeps each optical behavior distinct', () => {
  const cases = [
    ['shot on 20mm ultra-wide-angle lens', 'wide_expansion'],
    ['shot on 24mm wide-angle lens', 'wide_expansion'],
    ['shot on 28mm wide-angle lens', 'natural_wide'],
    ['shot on 35mm lens', 'natural_wide'],
    ['shot on 50mm standard lens, moderate background compression', 'neutral_perspective'],
    ['shot on 85mm short telephoto portrait lens', 'telephoto_compression'],
    ['shot on 105mm medium telephoto lens', 'telephoto_compression'],
    ['shot on 135mm long telephoto lens', 'telephoto_compression'],
    ['shot on macro lens', 'close_focus_detail'],
    ['shot on fisheye lens', 'barrel_distortion'],
    ['shot on tilt-shift lens', 'plane_control'],
    ['shot on anamorphic lens', 'anamorphic_optics'],
  ];

  for (const [source, expected] of cases) {
    assert.equal(classifyMidjourneyLens({ en: source }), expected, source);
  }
});

test('Midjourney adaptation resolves an MJ ratio override without changing PAGE1 selection', () => {
  const context = {
    aspectRatio: { id: '4:5' },
    locks: { mjAspectRatio: '16:9' },
    compositionVisibility: { bucket: COMPOSITION_VISIBILITY_BUCKETS.MEDIUM_WAIST },
    lens: { en: 'shot on 50mm standard lens, neutral perspective' },
  };

  assert.equal(resolveMidjourneyAspectRatio(context), '16:9');
  assert.deepEqual(buildMidjourneyFramingPoseAdaptation(context), {
    aspectRatio: '16:9',
    ratioClass: 'wide_canvas',
    framingBucket: COMPOSITION_VISIBILITY_BUCKETS.MEDIUM_WAIST,
    framingIntent: 'natural_crop',
    cropAnchor: 'head through waist',
    lensBehavior: 'neutral_perspective',
    poseSource: 'none',
    poseText: '',
    compositionAdditions: ['natural horizontal crop'],
    imagingAdditions: [],
  });
});

test('AI adapts wide framing and fisheye composition while preserving other primary outputs', () => {
  const baseLocks = {
    ...createEmptyLocks(),
    ...createAllNoneLocks(),
    subjectCount: '1',
    bodyTypeId: optionId('bodyTypeId', '性感曲線身形'),
    framingId: optionId('framingId', '中景鏡頭 (Medium Shot)'),
    angleId: optionId('angleId', '肩部高度鏡頭'),
    orbitId: optionId('orbitId', '右後 225 度'),
    aspectRatio: '16:9',
    lensId: optionId('lensId', '50mm 標準鏡頭 (Standard)'),
  };
  const [widePrompt] = generatePrompts(1, baseLocks);

  assert.match(widePrompt.midjourneyPrompt, /Waist-up portrait[^.]*natural horizontal crop/i);
  assert.doesNotMatch(widePrompt.midjourneyPrompt, /subject kept near the center of the frame/i);
  assert.doesNotMatch(widePrompt.grokPrompt, /natural horizontal crop/i);
  assert.doesNotMatch(widePrompt.zImagePrompt, /natural horizontal crop/i);

  const [fisheyePrompt] = generatePrompts(1, {
    ...baseLocks,
    aspectRatio: '4:3',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    lensId: optionId('lensId', '魚眼鏡頭 Fisheye'),
  });
  assert.match(fisheyePrompt.midjourneyPrompt, /subject kept near the center of the frame/i);
  assert.doesNotMatch(fisheyePrompt.midjourneyPrompt, /avoid distortion|controlled by selection/i);
});

test('AI preserves source-derived telephoto behavior without inventing close foreground action', () => {
  const locks = {
    ...createEmptyLocks(),
    ...createAllNoneLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '中景鏡頭 (Medium Shot)'),
    aspectRatio: '16:9',
    lensId: optionId('lensId', '135mm 長焦壓縮'),
  };
  const [prompt] = generatePrompts(1, locks);

  assert.match(prompt.midjourneyPrompt, /135mm long telephoto lens/i);
  assert.match(prompt.midjourneyPrompt, /narrow field of view/i);
  assert.match(prompt.midjourneyPrompt, /distant working distance/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /reaching close to the lens|close foreground action/i);
});

test('Macro, Tilt-Shift, and Anamorphic keep their own imaging behavior', () => {
  const baseLocks = {
    ...createEmptyLocks(),
    ...createAllNoneLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '中景鏡頭 (Medium Shot)'),
  };
  const [macroPrompt] = generatePrompts(1, {
    ...baseLocks,
    lensId: optionId('lensId', '微距鏡頭 Macro'),
  });
  assert.match(macroPrompt.midjourneyPrompt, /macro lens, close focusing distance/i);
  assert.doesNotMatch(macroPrompt.midjourneyPrompt, /subject kept near the center of the frame/i);

  const [tiltShiftPrompt] = generatePrompts(1, {
    ...baseLocks,
    lensId: optionId('lensId', '移軸鏡頭 Tilt-Shift'),
  });
  assert.match(tiltShiftPrompt.midjourneyPrompt, /tilt-shift lens, shifted perspective control/i);
  assert.match(tiltShiftPrompt.midjourneyPrompt, /corrected vertical lines/i);
  assert.match(tiltShiftPrompt.midjourneyPrompt, /tilted focus plane/i);
  assert.doesNotMatch(tiltShiftPrompt.midjourneyPrompt, /fisheye distortion/i);

  const [anamorphicPrompt] = generatePrompts(1, {
    ...baseLocks,
    aspectRatio: '16:9',
    lensId: optionId('lensId', '變形寬銀幕鏡頭 Anamorphic'),
  });
  assert.match(anamorphicPrompt.midjourneyPrompt, /anamorphic lens, horizontally squeezed widescreen optics/i);
  assert.match(anamorphicPrompt.midjourneyPrompt, /subject kept near the center of the frame/i);
  assert.doesNotMatch(anamorphicPrompt.midjourneyPrompt, /fisheye distortion/i);
});

test('AI receives framing adaptation without rewriting the shared canonical pose', () => {
  const locks = {
    ...createEmptyLocks(),
    ...createAllNoneLocks(),
    subjectCount: '1',
    aspectRatio: '4:3',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    poseBaseId: optionId('poseBaseId', '坐姿'),
    poseArrangementId: optionId('poseArrangementId', '自然坐姿'),
    poseHandId: optionId('poseHandId', '鏡子自拍'),
    poseHeadId: optionId('poseHeadId', '頭部微微側傾'),
    poseAnchorId: optionId('poseAnchorId', '坐在單人雕花絨布椅'),
    lensId: optionId('lensId', '魚眼鏡頭 Fisheye'),
  };
  const [prompt] = generatePrompts(1, locks);
  const canonicalPose = prompt.grokPrompt.match(/Pose and Composition:\n([\s\S]*?)(?:\n\n|$)/)?.[1]?.trim();

  assert.ok(canonicalPose, 'canonical pose exists');
  assert.ok(prompt.midjourneyPrompt.includes(canonicalPose));
  assert.ok(prompt.zImagePrompt.includes(canonicalPose));
  assert.match(prompt.midjourneyPrompt, /subject kept near the center of the frame/i);
});

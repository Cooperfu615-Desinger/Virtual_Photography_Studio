import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createEmptyLocks,
  createSeededRandom,
  generatePrompts,
  getLockControls,
} from './engine.js';
import { buildPage1GenerationPromptCards } from './page1PromptOutputs.js';
import { buildCharacterCardPromptBundle, getCharacterCardOptions } from './characterCardLab.js';

const controls = getLockControls();

function optionId(controlKey, zh) {
  const control = controls.find((entry) => entry.key === controlKey);
  assert.ok(control, `Expected control ${controlKey}`);
  const option = control.options.find((entry) => entry.zh === zh);
  assert.ok(option, `Expected option ${zh} in ${controlKey}`);
  return option.id;
}

function createAllNoneLocks() {
  const locks = { ...createEmptyLocks() };
  for (const control of controls) {
    if (control.multi) {
      locks[control.key] = [];
      continue;
    }
    const noneOption = control.options?.find((entry) => entry.zh === '全無' || entry.id === 'none');
    if (noneOption) locks[control.key] = noneOption.id;
  }
  locks.subjectCount = '1';
  return locks;
}

function generate(locks, seed) {
  return generatePrompts(1, locks, [], { random: createSeededRandom(seed) })[0];
}

function countMatches(value, pattern) {
  return [...String(value || '').matchAll(pattern)].length;
}

test('Z-Image Turbo keeps the historical zImagePrompt field while PAGE1 displays Z-Image', () => {
  const prompt = generate(createAllNoneLocks(), 'z-image-turbo-ui-label');
  const cards = buildPage1GenerationPromptCards(prompt);
  const zImageCard = cards.find((entry) => entry.id === 'grok');

  assert.ok(prompt.zImagePrompt);
  assert.equal(zImageCard?.title, 'Z-Image');
  assert.equal(zImageCard?.value, prompt.zImagePrompt);
});

test('Z-Image Turbo single prompt uses direct visual paragraphs in priority order', () => {
  const prompt = generate({
    ...createAllNoneLocks(),
    imageTypePresetId: 'photorealistic-photo',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    angleId: optionId('angleId', '平視高度鏡頭'),
    orbitId: optionId('orbitId', '右側 270 度'),
    bodyTypeId: optionId('bodyTypeId', '性感曲線身形'),
    topId: optionId('topId', '棉質細肩背心'),
    pantsId: optionId('pantsId', '直筒牛仔褲'),
    poseBaseId: optionId('poseBaseId', '站姿'),
    poseArrangementId: optionId('poseArrangementId', '自然站姿'),
    locationId: optionId('locationId', '室內：廢棄水泥工廠攪拌槽旁'),
    lightingId: optionId('lightingId', '室內低照度暖色夜景'),
    lightDirectionId: optionId('lightDirectionId', '混合色溫光'),
    styleId: optionId('styleId', '蜷川實花｜濃烈色彩戲劇感'),
    lensId: optionId('lensId', '變形寬銀幕鏡頭 Anamorphic'),
    apertureId: optionId('apertureId', 'f/2.8 淺景深'),
    filmId: optionId('filmId', '柯達 Portra 暖膚底片'),
  }, 'z-image-turbo-direct-single');
  const text = prompt.zImagePrompt;

  assert.match(text, /^Photorealistic editorial portrait\./);
  assert.doesNotMatch(text, /\bCreate (?:a|an)\b|^(?:Image Type|Subject|Wardrobe|Lighting|Camera Look):/m);
  assert.match(text, /Full-body portrait, eye-level view, right profile view/);
  assert.match(text, /The scene is cement-mixer tank side area, large cylindrical mixing tank, concrete dust\./i);
  assert.match(text, /Indoor low-light warm night ambience[\s\S]*mixed warm and cool subject lighting/i);

  const ordered = [
    'Photorealistic editorial portrait',
    'Full-body portrait, eye-level view, right profile view',
    'A 20s seductive stunning Japanese or Korean woman',
    'She wears',
    'The scene is cement-mixer tank side area',
    'Indoor low-light warm night ambience',
    'Mika Ninagawa',
    'anamorphic lens',
    'Kodak Portra',
  ];
  let previousIndex = -1;
  for (const fragment of ordered) {
    const index = text.indexOf(fragment);
    assert.ok(index > previousIndex, `${fragment} should follow the previous priority section`);
    previousIndex = index;
  }
});

test('Z-Image Turbo keeps a right-profile seated body side-on when the canonical head turns to camera', () => {
  const prompt = generate({
    ...createAllNoneLocks(),
    imageTypePresetId: 'photorealistic-photo',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    angleId: optionId('angleId', '平視高度鏡頭'),
    orbitId: optionId('orbitId', '右側 270 度'),
    poseBaseId: optionId('poseBaseId', '坐姿'),
    poseArrangementId: optionId('poseArrangementId', '翹二郎腿'),
    poseHandId: optionId('poseHandId', '任意'),
    poseHeadId: optionId('poseHeadId', '頭部自然朝向鏡頭'),
    poseAnchorId: optionId('poseAnchorId', '坐在單人雕花絨布椅'),
  }, 'z-image-turbo-right-profile-head-camera');
  const geometry = "Photographed from the woman's right side. Her near right shoulder visually overlaps the far left shoulder and her near right hip visually overlaps the far left hip, with her torso, pelvis, legs, and feet seen edge-on in a strict 90-degree right-side profile.";
  const canonicalPose = prompt.grokPrompt.match(/Pose and Composition:\n([\s\S]*?)(?=\n\n(?:Scene|Lighting|Camera Look):|\n\nmulti-cut sequence n=2|$)/)?.[1] || '';

  assert.match(prompt.zImagePrompt, /Full-body portrait, eye-level view, right profile view\./);
  assert.ok(prompt.zImagePrompt.includes(geometry));
  assert.match(canonicalPose, /head naturally facing the camera/i);
  assert.match(canonicalPose, /leg-cross seated pose/i);
  assert.match(canonicalPose, /ornate single velvet armchair/i);
  assert.equal(prompt.zImagePrompt.includes(canonicalPose), true);
  assert.equal(prompt.midjourneyPrompt.includes(canonicalPose), true);
  assert.doesNotMatch(prompt.grokPrompt, /near right shoulder visually overlaps the far left shoulder/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /near right shoulder visually overlaps the far left shoulder/i);
});

test('Z-Image Turbo uses neutral camera geometry for a dedicated special subject', () => {
  const prompt = generate({
    ...createAllNoneLocks(),
    specialSubjectId: 'white-skeleton',
    imageTypePresetId: 'photorealistic-photo',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    angleId: optionId('angleId', '平視高度鏡頭'),
    orbitId: optionId('orbitId', '右側 270 度'),
  }, 'z-image-turbo-special-subject-right-profile');

  assert.match(prompt.zImagePrompt, /Photographed from the subject's right side/i);
  assert.match(prompt.zImagePrompt, /subject's near right shoulder[\s\S]*subject's near right hip/i);
  assert.doesNotMatch(prompt.zImagePrompt, /Photographed from the woman's right side/i);
});

test('Z-Image Turbo duo prompt removes Grok-style labels and internal control wording', () => {
  const prompt = generate({
    ...createAllNoneLocks(),
    subjectCount: '2',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    locationId: optionId('locationId', '戶外：社區自動販賣機旁'),
    outfitPresetAId: optionId('outfitPresetAId', '套裝：深灰短背心氣球寬褲'),
    outfitPresetBId: optionId('outfitPresetBId', '套裝：網紗掛脖背心牛仔迷你裙'),
    duoPoseId: optionId('duoPoseId', '時尚雜誌雙人模特兒'),
  }, 'z-image-turbo-direct-duo');
  const text = prompt.zImagePrompt;

  assert.match(text, /^Photorealistic editorial portrait\./);
  assert.match(text, /Two stunning seductive 20-year-old Japanese or Korean women\./);
  assert.match(text, /Woman 1 has [^.]+\. She wears /);
  assert.match(text, /Woman 2 has [^.]+\. She wears /);
  assert.doesNotMatch(text, /^(?:Image Type|Subject|Woman 1|Woman 2|Shared Expression|Pose and Composition|Scene|Lighting|Camera Look):/m);
  assert.doesNotMatch(text, /body posture base|model-decided|controlled by|Keep |Vary only/i);
});

test('Z-Image Turbo character cards use the four permanent anchors once without lock language', () => {
  const prompt = generate({
    ...createAllNoneLocks(),
    characterProfileId: 'character-rika',
    characterCardWardrobeMode: 'full-default',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
  }, 'z-image-turbo-character-card');
  const text = prompt.zImagePrompt;
  const anchors = [
    'petite oval face with full cheeks',
    'large slightly close-set round gray-brown eyes',
    'tiny beauty mark near the outer cheek',
    'cushioned slightly parted rose lips',
  ];

  for (const anchor of anchors) {
    assert.equal(countMatches(text, new RegExp(anchor, 'gi')), 1, `${anchor} should appear once`);
  }
  assert.match(text, /She wears fitted cropped white short-sleeve baby tee/i);
  assert.doesNotMatch(text, /signature outfit locked as|permanent identity anchors|selected character-card outfit layer/i);
});

test('PAGE2 exposes the Z-Image name and direct Character Card prompt', () => {
  const cards = getCharacterCardOptions(controls);
  const bundle = buildCharacterCardPromptBundle(cards, {
    characterProfileId: 'character-rika',
    outputMode: 'pure-character',
  });
  const output = bundle.outputs.find((entry) => entry.id === 'grok-z-image');

  assert.equal(output?.label, 'Z-Image Prompt');
  assert.match(output?.value || '', /^Natural photorealistic character reference/);
  assert.doesNotMatch(output?.value || '', /Create a|permanent identity anchors|no clothing layers included/i);
});

test('Z-Image Turbo fixed composition becomes concrete spatial description without instruction guards', () => {
  const prompt = generate({
    ...createAllNoneLocks(),
    fixedCompositionSetId: optionId('fixedCompositionSetId', '清水模牆面沙發棚'),
    fixedSetPositionId: optionId('fixedSetPositionId', '自由場景互動'),
    fixedSetCaptureModeId: optionId('fixedSetCaptureModeId', '自然自拍感'),
    fixedSetPerformanceStateId: optionId('fixedSetPerformanceStateId', '慵懶無力感'),
    angleId: optionId('angleId', '肩部高度鏡頭'),
    orbitId: optionId('orbitId', '右前 315 度'),
  }, 'z-image-turbo-fixed-composition');
  const text = prompt.zImagePrompt;

  assert.match(text, /raw concrete wall[\s\S]*brown vintage Chesterfield leather sofa[\s\S]*low coffee table/i);
  assert.match(text, /off-center primary zone near the sofa/i);
  assert.match(text, /Close-lens self-shot framing/i);
  assert.match(text, /lazy drained presence/i);
  assert.doesNotMatch(text, /\bKeep\b|Vary only|can interact|\ballow\b|model-decided|without specifying|fixed-set rule/i);
});

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls, normalizeLocks } from './engine.js';

const controlOptions = (key) => getLockControls().find((control) => control.key === key).options;
const optionLabels = (key) => controlOptions(key).map((option) => option.zh);
const optionByLabel = (key, label) => {
  const option = controlOptions(key).find((item) => item.zh === label);
  assert.ok(option, `Missing option ${label} for ${key}`);
  return option;
};

test('expression and pose controls expose the cleaned option sets', () => {
  assert.deepEqual(
    optionLabels('expressionId'),
    [
      '全無',
      '直視鏡頭｜柔和微笑',
      '直視鏡頭｜平靜淡然',
      '直視鏡頭｜無辜清透',
      '抿唇忍笑｜俏皮',
      '離鏡凝視｜若有所思',
      '低頭垂眼｜內斂',
      '回眸側看｜輕柔注意',
      '閉眼沉浸',
      '大笑｜自然喜悅',
    ]
  );

  assert.deepEqual(
    optionLabels('poseId'),
    [
      '全無',
      '站姿｜自然站姿',
      '站姿｜單腳重心',
      '站姿｜雙手自然垂放',
      '站姿｜雙臂交疊',
      '坐姿｜自然坐姿',
      '坐姿｜微微前傾',
      '坐姿｜雙手後撐',
      '坐姿｜單腿放鬆',
      '坐姿｜雙腿自然伸展',
      '坐姿｜盤腿坐姿',
      '坐姿｜側身坐姿',
      '坐姿｜抱膝坐姿',
      '半躺低姿態｜側身半躺',
      '半躺低姿態｜正面仰躺',
      '半躺低姿態｜手撐半躺',
      '半躺低姿態｜微蜷放鬆',
      '半躺低姿態｜趴姿',
      '半躺低姿態｜側躺延伸',
      '蹲姿｜自然蹲姿',
      '蹲姿｜單膝蹲姿',
      '蹲姿｜手扶膝蓋蹲姿',
      '動態｜輕步移動',
      '動態｜整理頭髮',
      '動態｜整理衣襬',
      '動態｜抬手整理肩頸',
      '動態｜回身動作',
      '動態｜停步姿勢',
    ]
  );

  assert.doesNotMatch(optionLabels('poseId').join(' '), /自拍|鏡子自拍|回頭看鏡頭|低頭/);
});

test('social shooting actions are available as special actions', () => {
  assert.ok(optionByLabel('specialActionId', '自然自拍感'));
  assert.ok(optionByLabel('specialActionId', '鏡子自拍'));
  assert.ok(optionByLabel('specialActionId', '男友視角拍攝'));
  assert.ok(optionByLabel('specialActionId', '閨蜜視角拍攝'));
});

test('duo layout/contact replaces separate duo interaction and composition controls', () => {
  const duoLayoutControl = getLockControls().find((control) => control.key === 'duoPoseId');
  assert.equal(duoLayoutControl.label, '雙人佈局 / 接觸');
  assert.deepEqual(
    optionLabels('duoPoseId'),
    [
      '全無',
      '輕微碰肩',
      '彼此倚靠',
      '一前一後',
      '高低層次',
      '親密近身',
      '性感互動',
    ]
  );
});

test('duo sensual interaction outputs as one layout cue without legacy interaction lines', () => {
  const duoLayout = optionByLabel('duoPoseId', '性感互動');
  const oldInteraction = optionByLabel('duoInteractionId', '親密');
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '2',
    duoPoseId: duoLayout.id,
    duoInteractionId: oldInteraction.id,
  });

  const promptText = [
    prompt.grokPrompt,
    prompt.zImagePrompt,
    prompt.midjourneyPrompt,
  ].join('\n');

  assert.equal(prompt.selection.duoPoseId, duoLayout.id);
  assert.equal(prompt.selection.duoInteractionId, '');
  assert.doesNotMatch(prompt.grokPrompt, /^Duo Interaction:/m);
  assert.doesNotMatch(promptText, /both women sharing intimate natural closeness/);
  assert.match(promptText, /intertwined silhouettes/);
  assert.match(promptText, /pressed-together body lines/);
  assert.match(promptText, /tactile provocative chemistry/);
  assert.match(promptText, /drape across/);
  assert.match(promptText, /adult magazine-style erotic fashion energy/);
  assert.match(promptText, /thigh/);
  assert.match(promptText, /hip/);
  assert.match(promptText, /lower back/);
  const sensualCue = promptText.match(/two women in an intense sensual high-fashion editorial interaction[^.]+editorial/i)?.[0] || '';
  assert.ok(sensualCue, 'Expected sensual duo layout cue in prompt output');
  assert.doesNotMatch(sensualCue, /collar|neckline|foot|lingerie/i);
});

test('duo intimate close uses the previous lighter sensual contact level', () => {
  const duoLayout = optionByLabel('duoPoseId', '親密近身');
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '2',
    duoPoseId: duoLayout.id,
  });

  const promptText = [
    prompt.grokPrompt,
    prompt.zImagePrompt,
    prompt.midjourneyPrompt,
  ].join('\n');

  assert.equal(prompt.selection.duoPoseId, duoLayout.id);
  assert.match(promptText, /confident sensual editorial interaction/);
  assert.match(promptText, /teasing hand contact/);
  assert.match(promptText, /thigh/);
  assert.match(promptText, /hip/);
  assert.match(promptText, /lower back/);
  assert.doesNotMatch(promptText, /adult magazine-style erotic fashion energy/);
});

test('legacy duo interaction locks migrate into the merged duo layout control', () => {
  const normalized = normalizeLocks({
    ...createEmptyLocks(),
    subjectCount: '2',
    duoInteractionId: optionByLabel('duoInteractionId', '性感擁抱').id,
  });

  assert.equal(normalized.duoPoseId, optionByLabel('duoPoseId', '性感互動').id);
});

test('social shooting special actions can compose with body poses', () => {
  const pose = optionByLabel('poseId', '坐姿｜微微前傾');
  const specialAction = optionByLabel('specialActionId', '男友視角拍攝');
  const expression = optionByLabel('expressionId', '直視鏡頭｜柔和微笑');
  const framing = optionByLabel('framingId', '全身鏡頭 (Full Body Shot)');
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: framing.id,
    expressionId: expression.id,
    poseId: pose.id,
    specialActionId: specialAction.id,
  });

  const promptText = [
    prompt.grokPrompt,
    prompt.zImagePrompt,
    prompt.summary,
  ].join('\n');

  assert.equal(prompt.selection.poseId, pose.id);
  assert.equal(prompt.selection.specialActionId, specialAction.id);
  assert.match(promptText, /坐姿｜微微前傾|seated pose leaning slightly forward/);
  assert.match(promptText, /男友視角拍攝|boyfriend-perspective candid portrait/);
});

test('close-up framing preserves explicit pose composer directives', () => {
  const framing = optionByLabel('framingId', '胸上特寫');
  const poseBase = optionByLabel('poseBaseId', '坐姿');
  const poseHand = optionByLabel('poseHandId', '單手托下巴');
  const poseHead = optionByLabel('poseHeadId', '頭部自然朝向鏡頭');
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: framing.id,
    poseBaseId: poseBase.id,
    poseHandId: poseHand.id,
    poseHeadId: poseHead.id,
  });

  const promptText = [
    prompt.grokPrompt,
    prompt.zImagePrompt,
    prompt.midjourneyPrompt,
    prompt.summary,
  ].join('\n');

  assert.equal(prompt.selection.framingId, framing.id);
  assert.equal(prompt.selection.poseBaseId, poseBase.id);
  assert.equal(prompt.selection.poseHandId, poseHand.id);
  assert.equal(prompt.selection.poseHeadId, poseHead.id);
  assert.match(promptText, /She is sitting\b/);
  assert.match(promptText, /one hand supporting the chin/);
  assert.match(promptText, /head naturally facing the camera/);
});

test('locked expression updates output even when the previous orbit conflicts', () => {
  const rearOrbit = optionByLabel('orbitId', '背面 180 度');
  const sideGlance = optionByLabel('expressionId', '回眸側看｜輕柔注意');
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    orbitId: rearOrbit.id,
    expressionId: sideGlance.id,
  });

  assert.equal(prompt.selection.expressionId, sideGlance.id);
  assert.notEqual(prompt.selection.orbitId, rearOrbit.id);
  assert.match(prompt.summary, /回眸側看｜輕柔注意/);
  assert.match(prompt.grokPrompt, /glancing back over the shoulder/);
});

test('non-social special actions still replace the body pose slot', () => {
  const pose = optionByLabel('poseId', '坐姿｜自然坐姿');
  const specialAction = optionByLabel('specialActionId', '塗口紅');
  const framing = optionByLabel('framingId', '全身鏡頭 (Full Body Shot)');
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: framing.id,
    poseId: pose.id,
    specialActionId: specialAction.id,
  });

  assert.equal(prompt.selection.specialActionId, specialAction.id);
  assert.equal(prompt.selection.poseId, '');
});

test('legacy expression and selfie pose locks migrate into cleaned options', () => {
  const normalizedSmile = normalizeLocks({
    ...createEmptyLocks(),
    expressionId: 'character:神情與眼神-expression-gaze:直視鏡頭-自信淡笑:3',
  });
  assert.equal(normalizedSmile.expressionId, optionByLabel('expressionId', '直視鏡頭｜柔和微笑').id);

  const normalizedMirrorSelfie = normalizeLocks({
    ...createEmptyLocks(),
    poseId: 'character:姿勢與肢體語言-pose-body-language:站姿-鏡子自拍姿勢:10',
  });
  assert.equal(normalizedMirrorSelfie.poseId, optionByLabel('poseId', '站姿｜自然站姿').id);
  assert.equal(normalizedMirrorSelfie.specialActionId, optionByLabel('specialActionId', '鏡子自拍').id);

  const normalizedMovingSelfie = normalizeLocks({
    ...createEmptyLocks(),
    poseId: 'character:姿勢與肢體語言-pose-body-language:動態互動-自然自拍姿勢:46',
  });
  assert.equal(normalizedMovingSelfie.poseId, optionByLabel('poseId', '動態｜輕步移動').id);
  assert.equal(normalizedMovingSelfie.specialActionId, optionByLabel('specialActionId', '自然自拍感').id);
});

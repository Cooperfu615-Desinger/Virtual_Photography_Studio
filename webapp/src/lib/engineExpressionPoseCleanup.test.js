import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls, normalizeLocks } from './engine.js';

const controlOptions = (key) => {
  const control = getLockControls().find((item) => item.key === key);
  assert.ok(control, `Missing control ${key}`);
  return control.options;
};
const optionLabels = (key) => controlOptions(key).map((option) => option.zh);
const optionByLabel = (key, label) => {
  const option = controlOptions(key).find((item) => item.zh === label);
  assert.ok(option, `Missing option ${label} for ${key}`);
  return option;
};
const gptSection = (prompt, label) => (
  prompt.grokPrompt.match(new RegExp(`${label}:\\n([\\s\\S]*?)(?:\\n\\n(?:Image Type|Subject|Shared Expression|Scene|Wardrobe|Pose and Composition|Lighting|Camera Look):\\n|\\n\\nmulti-cut sequence n=2$|$)`))?.[1] || ''
);

test('expression and pose controls expose the cleaned option sets', () => {
  assert.deepEqual(
    optionLabels('expressionId'),
    [
      '無額外表情',
      '柔和微笑',
      '平靜淡然',
      '無辜清透',
      '俏皮忍笑',
      '若有所思',
      '內斂克制',
      '溫柔含蓄',
      '沉浸平靜',
      '自然喜悅',
      '撒嬌生氣',
      '內斂悲傷',
      '克制憤怒',
      '輕微驚訝',
      '緊張不安',
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

test('subject count control only exposes single and duo modes', () => {
  assert.deepEqual(
    optionLabels('subjectCount'),
    [
      '1 位',
      '2 位',
    ]
  );
});

test('legacy reference subject locks normalize to single subject mode without reference guidance', () => {
  const normalized = normalizeLocks({
    ...createEmptyLocks(),
    subjectCount: 'reference',
  });
  assert.equal(normalized.subjectCount, '1');

  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: 'reference',
  });
  const promptText = [
    prompt.grokPrompt,
    prompt.zImagePrompt,
    prompt.midjourneyPrompt,
    prompt.summary,
  ].join('\n');

  assert.equal(prompt.selection.subjectCount, '1');
  assert.doesNotMatch(promptText, /Reference Guidance|attached reference image|attached reference person|附圖人物|上傳人物/i);
});

test('selfie shooting actions moved from special actions to pose composer hand poses', () => {
  const specialActionLabels = optionLabels('specialActionId').join(' ');

  assert.doesNotMatch(specialActionLabels, /自然自拍感|鏡子自拍|男友視角拍攝|閨蜜視角拍攝/);
  assert.ok(optionByLabel('poseHandId', '自然自拍'));
  assert.ok(optionByLabel('poseHandId', '鏡子自拍'));
  assert.ok(optionByLabel('poseHandId', '男友/閨蜜自拍'));
});

test('duo action scenario and posture base controls expose natural two-layer options', () => {
  const duoLayoutControl = getLockControls().find((control) => control.key === 'duoPoseId');
  const duoPoseBaseControl = getLockControls().find((control) => control.key === 'duoPoseBaseId');
  assert.equal(duoLayoutControl.label, '雙人動作情境');
  assert.equal(duoPoseBaseControl.label, '雙人姿態基底');
  assert.deepEqual(
    optionLabels('duoPoseId'),
    [
      '全無',
      '模型自然決定',
      '時尚雜誌雙人模特兒',
      '相互不認識的兩人擦肩而過',
      '好朋友之間的親密自拍',
      '購物逛街',
      '日常生活紀錄拍照',
      '派對角落即興合照',
      '片場花絮感',
      '慵懶性感寫真',
      '親密性感互動',
      '充滿情慾的時尚寫真',
    ]
  );
  assert.deepEqual(
    optionLabels('duoPoseBaseId'),
    [
      '全無',
      '模型自然決定',
      '站姿',
      '坐姿',
      '蹲姿 / 低姿態',
      '躺姿 / 半躺',
      '行走中',
      '靠牆 / 倚靠物件',
      '近鏡頭自拍感',
    ]
  );
  assert.equal(createEmptyLocks().duoPoseBaseId, '');
});

test('every duo action scenario renders without model-selection control language', () => {
  const modelNaturalBase = optionByLabel('duoPoseBaseId', '模型自然決定');
  const internalControlLanguage = /\b(?:model-decided|(?:the )?image model (?:chooses|decides)|let the image model|natural natural)\b/i;

  for (const scenario of controlOptions('duoPoseId').filter((option) => option.zh !== '全無')) {
    const [prompt] = generatePrompts(1, {
      ...createEmptyLocks(),
      subjectCount: '2',
      duoPoseId: scenario.id,
      duoPoseBaseId: modelNaturalBase.id,
    });

    for (const [field, text] of Object.entries({
      grokPrompt: prompt.grokPrompt,
      zImagePrompt: prompt.zImagePrompt,
      midjourneyPrompt: prompt.midjourneyPrompt,
    })) {
      assert.doesNotMatch(text, internalControlLanguage, `${scenario.zh} leaked control language in ${field}`);
    }
  }
});

test('duo expression exposes shared relationship mood options', () => {
  const duoExpressionControl = getLockControls().find((control) => control.key === 'duoExpressionId');
  assert.equal(duoExpressionControl.label, '雙人互動神情');
  assert.deepEqual(
    optionLabels('duoExpressionId'),
    [
      '全無',
      '兩人直視鏡頭｜冷淡疏離',
      '兩人直視鏡頭｜平靜自然',
      '一人看鏡頭｜一人隨性離鏡',
      '兩人同向離鏡｜沉浸感',
      '兩人相互凝視｜安靜親密',
      '彼此微笑｜柔和默契',
      '彼此大笑｜自然開心',
      '曖昧對視｜性感張力',
      '一人凝視對方｜一人看鏡頭',
      '低眼神互動｜慵懶性感',
    ]
  );
});

test('duo expression outputs one shared relationship cue and ignores legacy per-person expressions', () => {
  const duoExpression = optionByLabel('duoExpressionId', '兩人相互凝視｜安靜親密');
  const expressionA = optionByLabel('expressionAId', '柔和微笑');
  const expressionB = optionByLabel('expressionBId', '自然喜悅');
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '2',
    duoExpressionId: duoExpression.id,
    expressionAId: expressionA.id,
    expressionBId: expressionB.id,
  });

  const promptText = [
    prompt.grokPrompt,
    prompt.zImagePrompt,
    prompt.midjourneyPrompt,
  ].join('\n');

  assert.equal(prompt.selection.duoExpressionId, duoExpression.id);
  assert.equal(prompt.selection.expressionAId, '');
  assert.equal(prompt.selection.expressionBId, '');
  assert.equal(prompt.structured.Character.filter((item) => item.id.includes('duo-expression')).length, 1);
  assert.equal(prompt.structured.Character.filter((item) => item.meta?.characterRole && item.id.includes('expression-gaze')).length, 0);
  assert.doesNotMatch(promptText, /^Woman 1 Expression:/m);
  assert.doesNotMatch(promptText, /^Woman 2 Expression:/m);
  assert.match(promptText, /quietly gaze at each other/);
  assert.match(promptText, /soft emotional connection/);
  assert.match(promptText, /calm private chemistry/);
  assert.doesNotMatch(promptText, /woman 1 looking toward the camera|woman 2 laughing naturally/i);
});

test('duo sensual interaction outputs as one layout cue without legacy interaction lines', () => {
  const duoLayout = optionByLabel('duoPoseId', '充滿情慾的時尚寫真');
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
  assert.match(promptText, /erotic high-fashion photo-story/i);
  assert.match(promptText, /intertwined silhouettes/);
  assert.match(promptText, /tactile provocative chemistry/);
  assert.match(promptText, /adult magazine-style erotic fashion energy/);
  const sensualCue = promptText.match(/two women captured in an erotic high-fashion photo-story[^.]+editorial/i)?.[0] || '';
  assert.ok(sensualCue, 'Expected sensual duo layout cue in prompt output');
  assert.doesNotMatch(sensualCue, /collar|neckline|foot|lingerie/i);
});

test('duo intimate close uses the previous lighter sensual contact level', () => {
  const duoLayout = optionByLabel('duoPoseId', '親密性感互動');
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
  assert.match(promptText, /intimate sensual editorial interaction/);
  assert.match(promptText, /teasing hand contact/);
  assert.match(promptText, /thigh/);
  assert.match(promptText, /hip/);
  assert.match(promptText, /lower back/);
  assert.doesNotMatch(promptText, /adult magazine-style erotic fashion energy/);
});

test('Gpt duo pose and composition uses action scenario with posture base and natural crop freedom', () => {
  const duoScenario = optionByLabel('duoPoseId', '購物逛街');
  const duoPoseBase = optionByLabel('duoPoseBaseId', '行走中');
  const framing = optionByLabel('framingId', '全身鏡頭 (Full Body Shot)');
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '2',
    duoPoseId: duoScenario.id,
    duoPoseBaseId: duoPoseBase.id,
    framingId: framing.id,
  });
  const poseSection = gptSection(prompt, 'Pose and Composition');

  assert.equal(prompt.selection.duoPoseId, duoScenario.id);
  assert.equal(prompt.selection.duoPoseBaseId, duoPoseBase.id);
  assert.match(poseSection, /two women captured during a casual shopping-day outing/i);
  assert.match(poseSection, /Their body posture is walking or mid-step/i);
  assert.match(poseSection, /allowing natural crop, overlap, body blocking, and partial occlusion/i);
  assert.doesNotMatch(poseSection, /preserve an outfit-visible editorial duo composition|both women fully visible|avoid headshot-only crop/i);
});

test('legacy duo interaction locks migrate into the merged duo layout control', () => {
  const normalized = normalizeLocks({
    ...createEmptyLocks(),
    subjectCount: '2',
    duoInteractionId: optionByLabel('duoInteractionId', '性感擁抱').id,
  });

  assert.equal(normalized.duoPoseId, optionByLabel('duoPoseId', '充滿情慾的時尚寫真').id);
});

test('selfie hand poses compose with pose composer body controls', () => {
  const poseBase = optionByLabel('poseBaseId', '坐姿');
  const arrangement = optionByLabel('poseArrangementId', '微微前傾');
  const poseHand = optionByLabel('poseHandId', '男友/閨蜜自拍');
  const expression = optionByLabel('expressionId', '柔和微笑');
  const framing = optionByLabel('framingId', '全身鏡頭 (Full Body Shot)');
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: framing.id,
    expressionId: expression.id,
    poseBaseId: poseBase.id,
    poseArrangementId: arrangement.id,
    poseHandId: poseHand.id,
  });

  const promptText = [
    prompt.grokPrompt,
    prompt.zImagePrompt,
    prompt.summary,
  ].join('\n');

  assert.equal(prompt.selection.poseBaseId, poseBase.id);
  assert.equal(prompt.selection.poseArrangementId, arrangement.id);
  assert.equal(prompt.selection.poseHandId, poseHand.id);
  assert.match(promptText, /坐姿｜微微前傾|slightly forward-leaning seated pose/);
  assert.match(promptText, /男友\/閨蜜自拍|close-companion social snapshot/);
});

test('chest-up framing preserves only visible pose composer directives', () => {
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
  const canonicalPose = prompt.grokPrompt.match(/Pose and Composition:\n([^\n]+)/)?.[1] || '';
  assert.doesNotMatch(canonicalPose, /presents a sitting pose/);
  assert.match(promptText, /one hand supporting the chin/);
  assert.match(promptText, /head naturally facing the camera/);
  assert.equal(prompt.zImagePrompt.split(canonicalPose).length - 1, 1);
  assert.equal(prompt.midjourneyPrompt.split(canonicalPose).length - 1, 1);
});

test('locked expression remains independent from the previous orbit', () => {
  const rearOrbit = optionByLabel('orbitId', '背面 180 度');
  const gentleExpression = optionByLabel('expressionId', '溫柔含蓄');
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    orbitId: rearOrbit.id,
    expressionId: gentleExpression.id,
  });

  assert.equal(prompt.selection.expressionId, gentleExpression.id);
  assert.notEqual(prompt.selection.orbitId, '');
  assert.match(prompt.summary, /溫柔含蓄/);
  assert.match(prompt.grokPrompt, /gentle demure expression/);
  assert.doesNotMatch(prompt.grokPrompt, /gaze|eye contact/i);
  assert.doesNotMatch(prompt.grokPrompt, /glancing back over the shoulder/);
});

test('deprecated non-social special actions migrate away from the body pose slot', () => {
  const pose = optionByLabel('poseId', '坐姿｜自然坐姿');
  const specialAction = optionByLabel('specialActionId', '塗口紅');
  const framing = optionByLabel('framingId', '全身鏡頭 (Full Body Shot)');
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: framing.id,
    poseId: pose.id,
    specialActionId: specialAction.id,
  });

  assert.equal(prompt.selection.specialActionId, '');
  assert.equal(prompt.selection.poseId, '');
  assert.equal(prompt.selection.poseHandId, 'none');
  assert.equal(prompt.selection.posePropId, optionByLabel('posePropId', '塗口紅｜自由妝感').id);
});

test('legacy expression and selfie pose locks migrate into cleaned options', () => {
  const normalizedSmile = normalizeLocks({
    ...createEmptyLocks(),
    expressionId: 'character:神情與眼神-expression-gaze:直視鏡頭-自信淡笑:3',
  });
  assert.equal(normalizedSmile.expressionId, optionByLabel('expressionId', '柔和微笑').id);

  const normalizedMirrorSelfie = normalizeLocks({
    ...createEmptyLocks(),
    poseId: 'character:姿勢與肢體語言-pose-body-language:站姿-鏡子自拍姿勢:10',
  });
  assert.equal(normalizedMirrorSelfie.poseId, optionByLabel('poseId', '全無').id);
  assert.equal(normalizedMirrorSelfie.specialActionId, optionByLabel('specialActionId', '全無').id);
  assert.equal(normalizedMirrorSelfie.poseBaseId, optionByLabel('poseBaseId', '站姿').id);
  assert.equal(normalizedMirrorSelfie.poseArrangementId, optionByLabel('poseArrangementId', '自然站姿').id);
  assert.equal(normalizedMirrorSelfie.poseHandId, optionByLabel('poseHandId', '鏡子自拍').id);

  const normalizedMovingSelfie = normalizeLocks({
    ...createEmptyLocks(),
    poseId: 'character:姿勢與肢體語言-pose-body-language:動態互動-自然自拍姿勢:46',
  });
  assert.equal(normalizedMovingSelfie.poseId, optionByLabel('poseId', '全無').id);
  assert.equal(normalizedMovingSelfie.specialActionId, optionByLabel('specialActionId', '全無').id);
  assert.equal(normalizedMovingSelfie.poseBaseId, optionByLabel('poseBaseId', '站姿').id);
  assert.equal(normalizedMovingSelfie.poseArrangementId, optionByLabel('poseArrangementId', '自然站姿').id);
  assert.equal(normalizedMovingSelfie.poseHandId, optionByLabel('poseHandId', '自然自拍').id);

  const normalizedLegacySpecialAction = normalizeLocks({
    ...createEmptyLocks(),
    specialActionId: 'character:特殊動作-special-actions:男友視角拍攝:26',
  });
  assert.equal(normalizedLegacySpecialAction.specialActionId, optionByLabel('specialActionId', '全無').id);
  assert.equal(normalizedLegacySpecialAction.poseBaseId, optionByLabel('poseBaseId', '站姿').id);
  assert.equal(normalizedLegacySpecialAction.poseHandId, optionByLabel('poseHandId', '男友/閨蜜自拍').id);
});

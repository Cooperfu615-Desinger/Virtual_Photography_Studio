import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls, normalizeLocks } from './engine.js';

function optionId(controlKey, zh) {
  const control = getLockControls().find((item) => item.key === controlKey);
  assert.ok(control, `Expected control ${controlKey}`);
  const option = control.options.find((entry) => entry.zh === zh);
  assert.ok(option, `Expected option ${zh} in ${controlKey}`);
  return option.id;
}

test('special subject control exposes dedicated character options', () => {
  const specialSubjectControl = getLockControls().find((control) => control.key === 'specialSubjectId');
  const specialSubjectOptions = specialSubjectControl.options.filter((option) => option.specialSubject);

  assert.deepEqual(
    specialSubjectOptions.map((option) => [option.id, option.zh]),
    [
      ['skeleton', '黑骷髏'],
      ['white-skeleton', '白骷髏'],
      ['sengoku-samurai', '日本戰國武士'],
      ['european-knight', '歐洲騎士'],
      ['female-android', '女性人形機器人'],
    ]
  );
});

test('white skeleton uses skeleton generation path and ivory bone language', () => {
  const locks = {
    ...createEmptyLocks(),
    specialSubjectId: 'white-skeleton',
  };

  const [prompt] = generatePrompts(1, locks);
  const promptText = [
    prompt.midjourneyPrompt,
    prompt.grokPrompt,
    prompt.zImagePrompt,
    prompt.summary,
  ].join('\n');

  assert.equal(prompt.selection.subjectCount, '1');
  assert.equal(prompt.selection.specialSubjectId, 'white-skeleton');
  assert.equal(prompt.structured.Wardrobe.length, 0);
  assert.match(promptText, /白骷髏|warm ivory bone tone|aged off-white bone surface|米白骨色/);
  assert.match(promptText, /unknown anomalous figure appearing naturally inside a real contemporary environment/);
  assert.match(promptText, /realistic scale, contact shadows, ambient light, and ordinary surroundings/);
  assert.doesNotMatch(promptText, /dark blue-black bone tone/);
});

test('historical warrior special subjects disable wardrobe and preserve expression and pose only', () => {
  const locks = {
    ...createEmptyLocks(),
    specialSubjectId: 'sengoku-samurai',
  };

  const [prompt] = generatePrompts(1, locks);
  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.summary].join('\n');

  assert.equal(prompt.selection.specialSubjectId, 'sengoku-samurai');
  assert.equal(prompt.structured.Wardrobe.length, 0);
  assert.match(promptText, /日本戰國武士/);
  assert.match(promptText, /female Japanese Sengoku-era samurai/);
  assert.match(promptText, /feminine bust-waist-hip silhouette/);
  assert.match(promptText, /live-action photographic realism|practical physical construction|documentary-real material detail/);
  assert.match(promptText, /present-day world|real contemporary environment/);
  assert.match(promptText, /戰國女武士甲冑/);
  assert.doesNotMatch(promptText, /Wardrobe Integrity|Top:|Shoes:|not anime|not cosplay|battlefield presence/);
});

test('sengoku samurai reads as a polished noble-house warrior instead of a weathered ronin', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    specialSubjectId: 'sengoku-samurai',
  });
  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.summary].join('\n');

  assert.match(promptText, /noble aristocratic house|well-groomed noble bearing|clean polished layered lamellar armor/);
  assert.match(promptText, /pristine silk lacing|meticulously maintained materials|documentary-real armor detail/);
  assert.doesNotMatch(promptText, /weathered fabric ties|worn lacquer|ronin|fallen warrior|mud-stained|battle-worn/);
});

test('european knight special subject is female with feminine armor shaping', () => {
  const locks = {
    ...createEmptyLocks(),
    specialSubjectId: 'european-knight',
  };

  const [prompt] = generatePrompts(1, locks);
  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.summary].join('\n');

  assert.equal(prompt.selection.specialSubjectId, 'european-knight');
  assert.equal(prompt.structured.Wardrobe.length, 0);
  assert.match(promptText, /歐洲騎士/);
  assert.match(promptText, /female medieval European knight/);
  assert.match(promptText, /feminine bust-waist-hip silhouette/);
  assert.match(promptText, /live-action photographic realism|practical physical construction|documentary-real material detail/);
  assert.match(promptText, /present-day world|real contemporary environment/);
  assert.match(promptText, /中世紀女騎士板甲/);
  assert.doesNotMatch(promptText, /Wardrobe Integrity|Top:|Shoes:|not fantasy armor|not cosplay|chivalric presence/);
});

test('female android reads as a near-human android and keeps hair controls', () => {
  const controls = getLockControls();
  const hairstyleId = controls
    .find((control) => control.key === 'hairstyleId')
    .options.find((option) => option.zh === '直髮：中分').id;
  const hairColorId = controls
    .find((control) => control.key === 'hairColorId')
    .options.find((option) => option.zh === '自然黑').id;
  const locks = {
    ...createEmptyLocks(),
    specialSubjectId: 'female-android',
    hairstyleId,
    hairColorId,
  };

  const [prompt] = generatePrompts(1, locks);
  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.summary].join('\n');

  assert.equal(prompt.selection.specialSubjectId, 'female-android');
  assert.equal(prompt.structured.Wardrobe.length, 0);
  assert.match(promptText, /女性人形機器人|near-human female android|realistic robotics and synthetic material construction/);
  assert.match(promptText, /subtle facial panel lines|black precision mechanical joint structures/);
  assert.match(promptText, /unknown anomalous figure appearing naturally inside a real contemporary environment/);
  assert.match(promptText, /直髮：中分|long straight hair with a center part|自然黑|natural black hair/);
  assert.doesNotMatch(promptText, /pure white mechanical bodysuit|full enclosed helmet|no visible face required|not a helmeted robot|not cartoon|not toy-like/);
});

test('black skeleton keeps dark tone and uses physical photographic presence', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    specialSubjectId: 'skeleton',
  });
  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.summary].join('\n');

  assert.equal(prompt.selection.specialSubjectId, 'skeleton');
  assert.equal(prompt.structured.Wardrobe.length, 0);
  assert.match(promptText, /黑骷髏|deep blue-black bone tone|深藍黑骨色/);
  assert.match(promptText, /full-body unknown skeletal figure|physical photographic presence/);
  assert.match(promptText, /unknown anomalous figure appearing naturally inside a real contemporary environment/);
  assert.doesNotMatch(promptText, /warm ivory bone tone/);
});

test('expression and pose remain available with special subjects', () => {
  const expression = getLockControls()
    .find((control) => control.key === 'expressionId')
    .options.find((option) => option.zh === '直視鏡頭｜平靜淡然');
  const pose = getLockControls()
    .find((control) => control.key === 'poseId')
    .options.find((option) => option.zh === '站姿｜單腳重心');

  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    specialSubjectId: 'european-knight',
    expressionId: expression.id,
    poseId: pose.id,
  });
  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.summary].join('\n');

  assert.equal(prompt.selection.specialSubjectId, 'european-knight');
  assert.equal(prompt.selection.expressionId, expression.id);
  assert.equal(prompt.selection.poseId, pose.id);
  assert.match(promptText, /calm neutral expression|relaxed half-lidded ease/);
  assert.match(promptText, /weight-on-one-leg standing pose|relaxed asymmetrical stance/);
  assert.doesNotMatch(promptText, /Wardrobe Integrity|Top:|Shoes:/);
});

test('non-social special actions apply to special subjects in every output and replace normal body pose', () => {
  const controls = getLockControls();
  const pose = controls
    .find((control) => control.key === 'poseId')
    .options.find((option) => option.zh === '坐姿｜自然坐姿');
  const specialAction = controls
    .find((control) => control.key === 'specialActionId')
    .options.find((option) => option.zh === '抽煙');

  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    specialSubjectId: 'sengoku-samurai',
    poseId: pose.id,
    specialActionId: specialAction.id,
  });
  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.summary].join('\n');

  assert.equal(prompt.selection.specialSubjectId, 'sengoku-samurai');
  assert.equal(prompt.selection.specialActionId, specialAction.id);
  assert.equal(prompt.selection.poseId, '');
  assert.match(prompt.grokPrompt, /holding a cigarette between the fingers near the lips/);
  assert.match(prompt.zImagePrompt, /holding a cigarette between the fingers near the lips/);
  assert.match(prompt.midjourneyPrompt, /holding a cigarette between the fingers near the lips/);
  assert.doesNotMatch(promptText, /natural seated posture/);
  assert.doesNotMatch(promptText, /Wardrobe Integrity|Top:|Shoes:/);
});

test('social shooting special actions compose with special subject body poses', () => {
  const controls = getLockControls();
  const pose = controls
    .find((control) => control.key === 'poseId')
    .options.find((option) => option.zh === '站姿｜單腳重心');
  const specialAction = controls
    .find((control) => control.key === 'specialActionId')
    .options.find((option) => option.zh === '男友視角拍攝');

  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    specialSubjectId: 'european-knight',
    poseId: pose.id,
    specialActionId: specialAction.id,
  });
  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.summary].join('\n');

  assert.equal(prompt.selection.specialSubjectId, 'european-knight');
  assert.equal(prompt.selection.specialActionId, specialAction.id);
  assert.equal(prompt.selection.poseId, pose.id);
  assert.match(promptText, /boyfriend-perspective candid portrait/);
  assert.match(promptText, /weight-on-one-leg standing pose|relaxed asymmetrical stance/);
  assert.doesNotMatch(promptText, /Wardrobe Integrity|Top:|Shoes:/);
});

test('pose composer applies to special subjects in every output and takes priority', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    specialSubjectId: 'sengoku-samurai',
    poseId: optionId('poseId', '站姿｜雙臂交疊'),
    specialActionId: optionId('specialActionId', '塗口紅'),
    poseBaseId: optionId('poseBaseId', '坐姿'),
    poseArrangementId: optionId('poseArrangementId', '椅緣端坐'),
    poseHandId: optionId('poseHandId', '雙手放在大腿上'),
    poseHeadId: optionId('poseHeadId', '頭部自然朝向鏡頭'),
    poseAnchorId: optionId('poseAnchorId', '坐在椅子上'),
  });
  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt, prompt.summary].join('\n');

  assert.equal(prompt.selection.specialSubjectId, 'sengoku-samurai');
  assert.equal(prompt.selection.poseId, '');
  assert.equal(prompt.selection.specialActionId, '');
  assert.equal(prompt.selection.poseBaseId, optionId('poseBaseId', '坐姿'));
  assert.equal(prompt.selection.poseArrangementId, optionId('poseArrangementId', '椅緣端坐'));
  assert.equal(prompt.selection.poseHandId, optionId('poseHandId', '雙手放在大腿上'));
  assert.equal(prompt.selection.poseHeadId, optionId('poseHeadId', '頭部自然朝向鏡頭'));
  assert.equal(prompt.selection.poseAnchorId, optionId('poseAnchorId', '坐在椅子上'));
  for (const text of [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt]) {
    assert.match(text, /She is sitting/);
    assert.match(text, /edge-of-seat poised seated arrangement/);
    assert.match(text, /seated near the front edge with clear leg line/);
    assert.match(text, /both hands resting on the thighs or nearest upper-leg surface/);
    assert.match(text, /chair that naturally fits the current scene/);
  }
  assert.match(promptText, /日本戰國武士|female Japanese Sengoku-era samurai/);
  assert.doesNotMatch(promptText, /loosely crossed arms/);
  assert.doesNotMatch(promptText, /applying lipstick/);
  assert.doesNotMatch(promptText, /Wardrobe Integrity|Top:|Shoes:/);
});

test('legacy skeleton subject count locks migrate into the special subject control', () => {
  const normalized = normalizeLocks({
    ...createEmptyLocks(),
    subjectCount: 'white-skeleton',
  });

  assert.equal(normalized.subjectCount, '1');
  assert.equal(normalized.specialSubjectId, 'white-skeleton');
});

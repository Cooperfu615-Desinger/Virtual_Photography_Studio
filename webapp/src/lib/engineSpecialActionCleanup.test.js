import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls } from './engine.js';

const EXPECTED_SPECIAL_ACTIONS = [
  '塗口紅',
  '塗歪口紅',
  '喝冰咖啡',
  '咬著波板糖',
  '抽煙',
  '整理絲襪',
  '前傾抓住褲腰',
  '側坐單手後撐',
  '抱膝托腮坐姿',
  '仰躺雙手微抬',
  '跪坐回眸撩髮',
  '半脫上衣整理肩線',
  '隨性癱坐在雕花單人絨布沙發上',
  '趴臥滑手機',
  '靠牆站立',
  '靠牆坐姿',
  '靠牆後仰站姿',
  '靠牆仰躺抬腿',
  '側身斜躺伸腿',
  '跪姿前傾倚靠高背',
  '四足跪姿前傾',
  '抱枕俯臥回眸',
  '分腿跪坐仰視',
  '自然自拍感',
  '鏡子自拍',
  '男友視角拍攝',
  '閨蜜視角拍攝',
];

const controlOptions = (key) => getLockControls().find((control) => control.key === key).options;
const specialActionOptions = () => controlOptions('specialActionId');
const nonNoneSpecialActions = () => specialActionOptions().filter((option) => option.zh !== '全無');
const optionByLabel = (key, label) => {
  const option = controlOptions(key).find((item) => item.zh === label);
  assert.ok(option, `Missing option ${label} for ${key}`);
  return option;
};
const wordCount = (text) => text.trim().split(/\s+/).filter(Boolean).length;
const tagsFor = (label) => new Set(optionByLabel('specialActionId', label).meta.tags);

test('special action controls expose exactly the existing 27 actions', () => {
  assert.deepEqual(nonNoneSpecialActions().map((option) => option.zh), EXPECTED_SPECIAL_ACTIONS);
});

test('special action prompts stay compact and stable', () => {
  const unstableWording = /\b(without|not|do not|avoid|excluding|deliberate)\b/i;

  for (const option of nonNoneSpecialActions()) {
    assert.ok(wordCount(option.en) <= 55, `${option.zh} has ${wordCount(option.en)} words`);
    assert.ok(option.en.length <= 360, `${option.zh} has ${option.en.length} characters`);
    assert.ok(option.desc.length <= 100, `${option.zh} description is too long`);
    assert.doesNotMatch(option.en, unstableWording, `${option.zh} should use compact positive wording`);
  }
});

test('special action metadata keeps intended behavior tags', () => {
  for (const label of ['自然自拍感', '鏡子自拍', '男友視角拍攝', '閨蜜視角拍攝']) {
    assert.ok(tagsFor(label).has('social_shooting_action'), `${label} should be a social shooting action`);
  }

  for (const label of ['塗口紅', '喝冰咖啡', '咬著波板糖', '抽煙']) {
    const tags = tagsFor(label);
    assert.ok(tags.has('prop_action'), `${label} should be a prop action`);
    assert.ok(tags.has('face_action'), `${label} should be a face action`);
  }

  assert.ok(tagsFor('整理絲襪').has('leg_focus_action'));
  assert.ok(tagsFor('隨性癱坐在雕花單人絨布沙發上').has('large_prop_action'));
  assert.ok(tagsFor('趴臥滑手機').has('full_body_action'));
  assert.ok(tagsFor('四足跪姿前傾').has('full_body_action'));
  assert.ok(tagsFor('抱枕俯臥回眸').has('full_body_action'));
  assert.ok(!tagsFor('靠牆站立').has('wardrobe_action'));
});

test('social shooting actions still compose with normal body poses', () => {
  const pose = optionByLabel('poseId', '坐姿｜微微前傾');
  const specialAction = optionByLabel('specialActionId', '男友視角拍攝');
  const framing = optionByLabel('framingId', '全身鏡頭 (Full Body Shot)');
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: framing.id,
    poseId: pose.id,
    specialActionId: specialAction.id,
  });

  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.summary].join('\n');
  assert.equal(prompt.selection.poseId, pose.id);
  assert.equal(prompt.selection.specialActionId, specialAction.id);
  assert.match(promptText, /seated pose leaning slightly forward/);
  assert.match(promptText, /boyfriend-perspective candid portrait/);
});

test('non-social special actions still replace the normal body pose', () => {
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

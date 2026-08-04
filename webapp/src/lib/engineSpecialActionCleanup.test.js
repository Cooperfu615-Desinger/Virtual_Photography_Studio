import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls, normalizeLocks } from './engine.js';

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

test('special action controls expose the non-selfie action set', () => {
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

test('selfie shooting choices are no longer exposed as special actions', () => {
  const labels = nonNoneSpecialActions().map((option) => option.zh).join(' ');

  assert.doesNotMatch(labels, /自然自拍感|鏡子自拍|男友視角拍攝|閨蜜視角拍攝/);
});

test('selfie shooting choices are exposed as pose composer hand poses', () => {
  assert.match(optionByLabel('poseHandId', '自然自拍').en, /front-camera self-shot/);
  assert.match(optionByLabel('poseHandId', '鏡子自拍').en, /visible phone toward a mirror/);
  assert.match(optionByLabel('poseHandId', '男友/閨蜜自拍').en, /naturally relaxed hand placement/);
});

test('prop actions split from pose composer hand controls while wardrobe actions remain', () => {
  const handControl = getLockControls().find((control) => control.key === 'poseHandId');
  const propControl = getLockControls().find((control) => control.key === 'posePropId');
  assert.equal(handControl.label, '手部動作');
  assert.equal(propControl.label, '道具動作');

  [
    '整理下身',
    '拉下肩線整理上衣',
    '雙手抓住褲腰',
  ].forEach((label) => {
    assert.ok(optionByLabel('poseHandId', label));
  });

  [
    '塗口紅｜自由妝感',
    '手持冰咖啡',
    '手持波板糖',
    '手持香菸',
    '滑手機',
  ].forEach((label) => {
    assert.ok(optionByLabel('posePropId', label));
  });

  assert.doesNotMatch(optionByLabel('posePropId', '手持冰咖啡').en, /lips|mid-sip|near the lips/i);
  assert.doesNotMatch(optionByLabel('posePropId', '手持香菸').en, /lips|near the lips/i);
  assert.doesNotMatch(optionByLabel('posePropId', '手持波板糖').en, /biting|lips/i);
});

test('old special actions normalize into pose composer controls', () => {
  const normalizedCoffee = normalizeLocks({
    ...createEmptyLocks(),
    specialActionId: optionByLabel('specialActionId', '喝冰咖啡').id,
  });

  assert.equal(normalizedCoffee.specialActionId, optionByLabel('specialActionId', '全無').id);
  assert.equal(normalizedCoffee.poseBaseId, optionByLabel('poseBaseId', '站姿').id);
  assert.equal(normalizedCoffee.poseHandId, 'none');
  assert.equal(normalizedCoffee.posePropId, optionByLabel('posePropId', '手持冰咖啡').id);

  const normalizedWaistband = normalizeLocks({
    ...createEmptyLocks(),
    specialActionId: optionByLabel('specialActionId', '前傾抓住褲腰').id,
  });

  assert.equal(normalizedWaistband.specialActionId, optionByLabel('specialActionId', '全無').id);
  assert.equal(normalizedWaistband.poseBaseId, optionByLabel('poseBaseId', '站姿').id);
  assert.equal(normalizedWaistband.poseArrangementId, optionByLabel('poseArrangementId', '上身大幅度前傾').id);
  assert.equal(normalizedWaistband.poseHandId, optionByLabel('poseHandId', '雙手抓住褲腰').id);
});

test('pose composer prop actions enter prompt output through posePropId', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionByLabel('framingId', '胸上特寫').id,
    posePropId: optionByLabel('posePropId', '手持冰咖啡').id,
  });

  assert.equal(prompt.selection.poseHandId, 'none');
  assert.equal(prompt.selection.posePropId, optionByLabel('posePropId', '手持冰咖啡').id);
  assert.equal(prompt.selection.specialActionId, '');
  assert.match(prompt.grokPrompt, /iced coffee/i);
  assert.doesNotMatch(prompt.grokPrompt, /near the lips|mid-sip/i);
});

test('pose composer lower-body hand actions keep random framing wide enough', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    poseHandId: optionByLabel('poseHandId', '整理下身').id,
  }, [], { random: () => 0 });
  const framing = getLockControls()
    .find((control) => control.key === 'framingId')
    .options.find((option) => option.id === prompt.selection.framingId);

  assert.ok(['full', 'wide'].includes(framing.meta.visibility));
});

test('wall and pillow legacy actions have pose composer body arrangements and anchors', () => {
  assert.equal(optionByLabel('poseAnchorId', '背靠牆坐在地面').base, 'sitting');
  assert.equal(optionByLabel('poseArrangementId', '靠牆仰躺抬腿').base, 'lying');
  assert.equal(optionByLabel('poseArrangementId', '抱枕俯臥回眸').base, 'lying');

  const normalizedWallSeated = normalizeLocks({
    ...createEmptyLocks(),
    specialActionId: optionByLabel('specialActionId', '靠牆坐姿').id,
  });

  assert.equal(normalizedWallSeated.specialActionId, optionByLabel('specialActionId', '全無').id);
  assert.equal(normalizedWallSeated.poseBaseId, optionByLabel('poseBaseId', '坐姿').id);
  assert.equal(normalizedWallSeated.poseArrangementId, optionByLabel('poseArrangementId', '雙腿自然伸展').id);
  assert.equal(normalizedWallSeated.poseAnchorId, optionByLabel('poseAnchorId', '背靠牆坐在地面').id);
});

test('selfie hand poses compose with pose composer body controls', () => {
  const framing = optionByLabel('framingId', '全身鏡頭 (Full Body Shot)');
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: framing.id,
    poseBaseId: optionByLabel('poseBaseId', '坐姿').id,
    poseArrangementId: optionByLabel('poseArrangementId', '微微前傾').id,
    poseHandId: optionByLabel('poseHandId', '男友/閨蜜自拍').id,
    poseHeadId: optionByLabel('poseHeadId', '頭部自然朝向鏡頭').id,
  });

  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.summary].join('\n');
  assert.equal(prompt.selection.poseBaseId, optionByLabel('poseBaseId', '坐姿').id);
  assert.equal(prompt.selection.poseHandId, optionByLabel('poseHandId', '男友/閨蜜自拍').id);
  assert.match(promptText, /slightly forward-leaning seated pose/);
  assert.match(promptText, /close-companion social snapshot/);
});

test('deprecated non-social special actions migrate away from the normal body pose', () => {
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

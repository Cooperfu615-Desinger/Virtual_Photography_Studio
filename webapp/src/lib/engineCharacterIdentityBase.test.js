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

test('identity base exposes approved body and facial feature options', () => {
  assert.deepEqual(
    optionLabels('bodyTypeId'),
    [
      '高挑時裝模特',
      '優雅曲線模特',
      '柔和沙漏身形',
      '性感曲線身形',
      '運動緊實身形',
      '小隻精緻身形',
    ]
  );

  assert.deepEqual(
    optionLabels('facialFeaturesId'),
    [
      '全無',
      '韓系偶像臉',
      '日系清透臉',
      '甜美可愛臉',
      '冷感高級臉',
      '成熟性感臉',
      '混血立體臉',
    ]
  );
});

test('identity base exposes reduced hairstyle and hair color options', () => {
  assert.deepEqual(
    optionLabels('hairstyleId'),
    [
      '全無',
      '帥氣濕亮油頭',
      '乾淨短鮑伯',
      '齊瀏海圓弧鮑伯',
      '不對稱濕感短鮑伯',
      '復古外翹短髮',
      '自然層次鎖骨髮',
      '韓系柔順中長髮',
      '側分柔波中長髮',
      '半濕感中長髮',
      '直髮：中分',
      '直髮：旁分',
      '直髮：日式瀏海',
      '柔波：中分',
      '柔波：深側分',
      '柔波：瀏海',
      '濕潤感長波浪',
      '高位雙馬尾',
      '蓬鬆高馬尾',
      '低馬尾',
      '低包頭盤髮',
      '半綁公主頭',
      '柔和編髮造型',
    ]
  );
  assert.ok(!optionLabels('hairstyleId').includes('短髮｜精靈短髮'));
  assert.ok(!optionLabels('hairstyleId').includes('長髮（放髮）｜姬髮式長直髮'));

  assert.deepEqual(
    optionLabels('hairColorId'),
    [
      '全無',
      '自然黑',
      '柔霧黑茶',
      '深咖啡棕',
      '栗子棕',
      '奶茶棕',
      '亞麻米棕',
      '蜂蜜焦糖棕',
      '玫瑰可可棕',
      '淺金髮',
      '銀灰白',
      '亮桃粉',
      '寶石藍',
      '深森林綠',
    ]
  );
  ['亮綠色', '亮黃色', '亮紫色', '銅紅髮', '霧感橄欖棕', '霧灰棕'].forEach((label) => {
    assert.ok(!optionLabels('hairColorId').includes(label), `Removed hair color should not appear: ${label}`);
  });
});

test('identity base prompt wording is controlled by selected DNA options', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    bodyTypeId: optionByLabel('bodyTypeId', '性感曲線身形').id,
    facialFeaturesId: optionByLabel('facialFeaturesId', '成熟性感臉').id,
    hairstyleId: optionByLabel('hairstyleId', '柔波：深側分').id,
    hairColorId: optionByLabel('hairColorId', '亮桃粉').id,
  });

  const promptText = [
    prompt.midjourneyPrompt,
    prompt.grokPrompt,
    prompt.zImagePrompt,
    prompt.summary,
  ].join('\n');

  assert.match(promptText, /adult Japanese or Korean female portrait subject/);
  assert.doesNotMatch(promptText, /seductive stunning & beautiful/);
  assert.match(promptText, /curvy silhouette|成熟性感臉|deep side-parted long soft waves|hot-pink fashion hair/);
  assert.equal(prompt.selection.bodyTypeId, optionByLabel('bodyTypeId', '性感曲線身形').id);
  assert.equal(prompt.selection.facialFeaturesId, optionByLabel('facialFeaturesId', '成熟性感臉').id);
  assert.equal(prompt.selection.hairstyleId, optionByLabel('hairstyleId', '柔波：深側分').id);
  assert.equal(prompt.selection.hairColorId, optionByLabel('hairColorId', '亮桃粉').id);
});

test('legacy identity base locks migrate into the merged options', () => {
  const locks = createEmptyLocks();

  assert.equal(
    normalizeLocks({ ...locks, hairstyleId: 'character:髮型-hairstyle:短髮-齊耳法式短鮑伯:3' }).hairstyleId,
    optionByLabel('hairstyleId', '乾淨短鮑伯').id
  );
  assert.equal(
    normalizeLocks({ ...locks, hairstyleId: 'character:髮型-hairstyle:長髮-放髮-姬髮式長直髮:17' }).hairstyleId,
    optionByLabel('hairstyleId', '直髮：日式瀏海').id
  );
  assert.equal(
    normalizeLocks({ ...locks, hairstyleId: 'character:髮型-hairstyle:長髮-綁髮-高級感低盤髮:26' }).hairstyleId,
    optionByLabel('hairstyleId', '低包頭盤髮').id
  );
  assert.equal(
    normalizeLocks({ ...locks, hairColorId: 'character:髮色-hair-color:亮紫色:16' }).hairColorId,
    optionByLabel('hairColorId', '亮桃粉').id
  );
  assert.equal(
    normalizeLocks({ ...locks, bodyTypeId: 'character:體態-body-type:模特兒:0' }).bodyTypeId,
    optionByLabel('bodyTypeId', '高挑時裝模特').id
  );
  assert.equal(
    normalizeLocks({ ...locks, facialFeaturesId: 'character:五官特徵-facial-features:kpop:1' }).facialFeaturesId,
    optionByLabel('facialFeaturesId', '韓系偶像臉').id
  );
});

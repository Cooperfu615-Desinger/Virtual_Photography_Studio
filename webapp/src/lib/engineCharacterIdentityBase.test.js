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
      '一般基本體型',
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
      '直髮：濕感',
      '自然微彎：中分',
      '自然微彎：深側分',
      '自然微彎：瀏海',
      '自然微彎：濕感',
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

test('hairstyle prompt exposes straight wet and subtle bend options without over-curl wording', () => {
  const subtleBend = optionByLabel('hairstyleId', '自然微彎：深側分');
  const straightWet = optionByLabel('hairstyleId', '直髮：濕感');

  assert.match(subtleBend.en, /subtle natural bends/);
  assert.match(subtleBend.en, /mostly smooth texture/);
  assert.doesNotMatch(subtleBend.en, /\bcurl|\bcurls|\bcurly/i);
  assert.match(straightWet.en, /sleek wet texture/);
  assert.match(straightWet.en, /minimal wave/);

  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '1',
    framingId: optionByLabel('framingId', '全身鏡頭 (Full Body Shot)').id,
    specialOutfitId: optionByLabel('specialOutfitId', '全無').id,
    hairstyleId: subtleBend.id,
  });
  assert.match(prompt.grokPrompt, /subtle natural bends/);
  assert.match(prompt.zImagePrompt, /mostly smooth texture/);
  assert.equal(prompt.selection.hairstyleId, subtleBend.id);
});

test('identity base prompt wording is controlled by selected DNA options', () => {
  const bodyType = optionByLabel('bodyTypeId', '性感曲線身形');
  const facialFeatures = optionByLabel('facialFeaturesId', '成熟性感臉');
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    bodyTypeId: bodyType.id,
    facialFeaturesId: facialFeatures.id,
    hairstyleId: optionByLabel('hairstyleId', '柔波：深側分').id,
    hairColorId: optionByLabel('hairColorId', '亮桃粉').id,
  });

  const promptText = [
    prompt.midjourneyPrompt,
    prompt.grokPrompt,
    prompt.zImagePrompt,
    prompt.summary,
  ].join('\n');

  assert.match(promptText, /20-year-old Japanese or Korean female portrait subject/);
  assert.doesNotMatch(promptText, /adult Japanese or Korean female portrait subject/);
  assert.doesNotMatch(promptText, /seductive stunning & beautiful/);
  assert.doesNotMatch(bodyType.en, /\bmature\b|\bolder\b|\bage\b/i);
  assert.match(bodyType.en, /168-173 cm|53-58 kg|F-to-G-cup|bust-waist-hip|rounded hips/);
  assert.doesNotMatch(facialFeatures.en, /\bmature\b/i);
  assert.match(facialFeatures.en, /alluring|seductive|magnetic|sensual/);
  assert.match(promptText, /curvy silhouette|bust-waist-hip|fuller bust|rounded hips|alluring beauty face|deep side-parted long soft waves|hot-pink fashion hair/);
  assert.equal(prompt.selection.bodyTypeId, bodyType.id);
  assert.equal(prompt.selection.facialFeaturesId, facialFeatures.id);
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
    normalizeLocks({ ...locks, bodyTypeId: 'character:體態-body-type:優雅曲線模特:1' }).bodyTypeId,
    optionByLabel('bodyTypeId', '一般基本體型').id
  );
  assert.equal(
    normalizeLocks({ ...locks, facialFeaturesId: 'character:五官特徵-facial-features:kpop:1' }).facialFeaturesId,
    optionByLabel('facialFeaturesId', '韓系偶像臉').id
  );
});

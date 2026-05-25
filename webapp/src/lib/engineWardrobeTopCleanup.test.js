import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls, normalizeLocks } from './engine.js';

const EXPECTED_TOP_LABELS = [
  '全無',
  '襯衫',
  '長版襯衫',
  '領帶襯衫',
  '短袖上衣',
  '落肩 T 恤',
  '短版 T 恤',
  '棉質細肩背心',
  '絲質細肩帶上衣',
  '削肩針織上衣',
  '坦克背心',
  '高領針織上衣',
  '高領連身上衣',
  '長版寬鬆麻花針織毛衣',
  '短版針織背心',
  '短版蕾絲背心',
  '平口上衣',
  '一字領上衣',
  '絲綢緞面襯衫',
  '透膚刺繡襯衫',
  '網紗透視上衣',
  '短版吊帶背心',
  '短版帽T',
  '球衣 / 運動 jersey',
  '維多利亞高領蕾絲襯衫',
  '雪紡荷葉蝴蝶結襯衫',
  '素色緞面旗袍上衣',
  '精緻刺繡旗袍上衣',
  '和服式上衣',
  '浴衣式上衣',
  '比基尼上身',
  '蕾絲胸罩',
  '運動型內衣',
  '蕾絲睡衣上身',
  '波西米亞風上衣',
];

const controlOptions = (key) => getLockControls().find((control) => control.key === key).options;
const optionLabels = (key) => controlOptions(key).map((option) => option.zh);
const optionByLabel = (key, label) => {
  const option = controlOptions(key).find((item) => item.zh === label);
  assert.ok(option, `Missing option ${label} for ${key}`);
  return option;
};

test('top controls expose the simplified upper-body garment set', () => {
  assert.deepEqual(optionLabels('topId'), EXPECTED_TOP_LABELS);

  [
    '細肩帶上衣',
    '羅紋高領連身上衣',
    '鬆領帶襯衫',
    '長版落肩 T 恤',
    '削肩平口連身上衣',
    '荷葉袖絲綢襯衫',
    '柔垂透膚刺繡襯衫',
    '裝飾網紗上衣',
    '漢服式上衣',
    '改良漢服式上衣',
    '透膚蕾絲連身上衣',
    '細肩帶蕾絲胸罩',
    '蕾絲緊身睡衣',
    '蕾絲寬鬆睡衣',
    '無肩帶蕾絲胸罩',
  ].forEach((label) => {
    assert.ok(!optionLabels('topId').includes(label), `Merged top option should not remain: ${label}`);
  });
});

test('legacy top locks migrate into the simplified options', () => {
  const locks = createEmptyLocks();

  assert.equal(
    normalizeLocks({ ...locks, topId: 'wardrobe:上身-tops:細肩帶上衣:6' }).topId,
    optionByLabel('topId', '棉質細肩背心').id
  );
  assert.equal(
    normalizeLocks({ ...locks, topId: 'wardrobe:上身-tops:鬆領帶襯衫:13' }).topId,
    optionByLabel('topId', '領帶襯衫').id
  );
  assert.equal(
    normalizeLocks({ ...locks, topId: 'wardrobe:上身-tops:透膚蕾絲連身上衣:40' }).topId,
    optionByLabel('topId', '網紗透視上衣').id
  );
  assert.equal(
    normalizeLocks({ ...locks, topId: 'wardrobe:上身-tops:無肩帶蕾絲胸罩:47' }).topId,
    optionByLabel('topId', '蕾絲胸罩').id
  );
  assert.equal(
    normalizeLocks({ ...locks, topId: 'wardrobe:上身-tops:漢服式上衣:38' }).topId,
    optionByLabel('topId', '全無').id
  );
});

test('simplified top prompts remain compact and usable in generated wardrobe output', () => {
  const top = optionByLabel('topId', '蕾絲胸罩');
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    topId: top.id,
  });

  assert.match(prompt.grokPrompt, /Wardrobe:\n[\s\S]*lace bra top/);
  assert.match(prompt.zImagePrompt, /lace bra top/);
  assert.ok(top.en.split(/\s+/).length <= 24);
});

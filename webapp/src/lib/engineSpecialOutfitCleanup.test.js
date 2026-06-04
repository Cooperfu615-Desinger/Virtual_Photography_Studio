import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls } from './engine.js';

const EXPECTED_SPECIAL_OUTFITS = [
  '黑色波點頭巾透紗套裝',
  '藍灰長外套蕾絲胸衣寬褲造型',
  '黑白條紋哥德蕾絲層次造型',
  '黑色背心豹紋單車褲機能造型',
  '迷彩透紗白蕾絲束胸裙裝',
  '復古樂團寬版短褲街頭造型',
  'Metallica 圖像T黑罩衫熱褲造型',
  '酒紅格紋吊帶牛仔短裙長靴造型',
  '粉紫蕾絲豹紋低腰喇叭褲造型',
  '深色牛仔短外套條紋襯衫寬褲造型',
  '淺色牛仔外套白粉T灰牛仔寬褲造型',
  '黑色亮片花卉透膚套裝',
  '白色花卉刺繡外套紅寬褲造型',
  '灰格紋西裝短版背心破壞牛仔寬褲造型',
  '棕格紋西裝絲巾白寬褲造型',
  '白色短版背心垂墜牛仔寬褲造型',
  '黑色運動外套抹胸寬版訓練褲造型',
  '紅色棒球外套藍T格紋裙造型',
  '棕色皮革飛行外套角色針織牛仔褲造型',
  '黑粉透膚蕾絲流蘇長裙造型',
  '米色潑染破壞工裝套裝造型',
  '粉白絨格外套蕾絲胸衣黃紗裙造型',
  '藍色束胸粉格裙白綁帶長襪造型',
  '海軍針織背心條紋巨袋褲紅靴造型',
  '橄欖亮面長外套奶油針織牛仔造型',
  '白色寬簷帽丹寧抹胸開衩裙造型',
  '鏽橘紮染工裝吊帶褲帽T造型',
  '白色字母短T條紋蕾絲裙靴造型',
  '金色貝雷帽皮草外套寬牛仔造型',
  '棕色開襟外套細肩背心條紋工裝褲造型',
  '黑毛帽白短背心鏈條工裝寬褲造型',
  '粉色圖像背心格紋襯衫破壞寬褲造型',
  '灰色長版圖像T腰帶短裙靴造型',
  '黑色破壞圖像上衣紅格裙破壞牛仔造型',
  '鼠尾草圖像T白蕾絲長裙靴造型',
  '黃色寬T條紋襯衫橄欖工裝褲造型',
  '黑皮革短外套佩斯利襯衫鉛筆裙造型',
  '棕皮草披肩條紋西裝洋裝造型',
  '黑皮革騎士外套鉛筆裙套裝造型',
  '黑皮革短外套水鑽蛇紋喇叭褲造型',
  '黃色皮革外套紅花洋裝銀靴造型',
  '紅緞背心牛仔迷你裙騎士靴造型',
  '米色細肩背心蕾絲胸衣工裝寬褲造型',
  '粉色蝴蝶結背心牛仔短褲泡泡襪造型',
  '白色短袖背心格紋迷你裙白蕾絲襪造型',
  '黑色哥德蕾絲短袖熱褲長靴造型',
  '灰透紗荷葉吊帶熱褲涼鞋造型',
  '奶白蕾絲荷葉短裙高筒襪造型',
  '米白高領荷葉背心短裙涼鞋造型',
  '白色透紗綁帶洋裝長襪軍靴造型',
  '奶白透膚襯衫腰帶層裙短靴造型',
  '螢光綠熱帶襯衫短褲運動鞋造型',
  '白橘圖案襯衫工裝寬褲帆布鞋造型',
  '灰色圖案衛衣紅傘裙高跟鞋造型',
  '黑透膚連帽流蘇短褲綁帶鞋造型',
  '粉色花朵抹胸洋裝草帽拖鞋造型',
  '格紋襯衫短褲條紋襪球鞋造型',
  '藍白條紋寬襯衫白短裙球鞋造型',
  '酒紅圖像T黑寬牛仔工裝靴造型',
  '紅色短T低腰寬牛仔耳機造型',
  '黃色圖像短T格紋喇叭褲分趾鞋造型',
];

const controlOptions = (key) => getLockControls().find((control) => control.key === key).options;
const specialOutfitOptions = () => controlOptions('specialOutfitId');
const nonNoneSpecialOutfits = () => specialOutfitOptions().filter((option) => option.zh !== '全無');
const optionByLabel = (key, label) => {
  const option = controlOptions(key).find((item) => item.zh === label);
  assert.ok(option, `Missing option ${label} for ${key}`);
  return option;
};

const wordCount = (text) => text.trim().split(/\s+/).filter(Boolean).length;

test('special outfit controls expose exactly the approved 61 complete looks', () => {
  assert.deepEqual(nonNoneSpecialOutfits().map((option) => option.zh), EXPECTED_SPECIAL_OUTFITS);
});

test('special outfit prompts keep complete outfit prefix and stay compact', () => {
  for (const option of nonNoneSpecialOutfits()) {
    assert.match(option.en, /^complete outfit:/, `${option.zh} should start with complete outfit:`);
    assert.ok(wordCount(option.en) <= 90, `${option.zh} has ${wordCount(option.en)} words`);
    assert.ok(option.en.length <= 700, `${option.zh} has ${option.en.length} characters`);
    assert.ok(option.desc.length <= 140, `${option.zh} description is too long`);
  }
});

test('special outfit popup reference metadata uses special outfit png paths', () => {
  for (const option of nonNoneSpecialOutfits()) {
    if (!option.meta?.referenceImage) continue;
    assert.match(
      option.meta.referenceImage,
      /^reference\/wardrobe\/special-outfits\/\d{2}_.+\.png$/,
      `${option.zh} should have a special outfit popup reference image`,
    );
    assert.equal(option.meta?.referenceImageFormat, 'png', `${option.zh} should declare png reference format`);
  }
});

test('special outfit prompts avoid unstable negative phrasing', () => {
  const unstableNegative = /\b(excluding|without|not a|do not|avoid)\b/i;
  for (const option of nonNoneSpecialOutfits()) {
    assert.doesNotMatch(option.en, unstableNegative, `${option.zh} should describe what to generate`);
  }
});

test('recent special outfit refinements preserve requested garment details', () => {
  const expectedFragmentsByLabel = {
    螢光綠熱帶襯衫短褲運動鞋造型: ['intentionally oversized lime-green short-sleeve camp shirt'],
    白橘圖案襯衫工裝寬褲帆布鞋造型: ['randomly overlapped seashell and conch motif print', 'neon orange dyed-texture cargo trousers'],
    灰色圖案衛衣紅傘裙高跟鞋造型: ['cute stylized poodle applique', 'stiff structured pleated red midi skirt'],
    粉色花朵抹胸洋裝草帽拖鞋造型: ['one large central rosette and two smaller side rosettes', 'single-panel waistless cut'],
    格紋襯衫短褲條紋襪球鞋造型: ['bottom three buttons intentionally left undone'],
    藍白條紋寬襯衫白短裙球鞋造型: ['bottom three buttons intentionally left undone'],
    酒紅圖像T黑寬牛仔工裝靴造型: ['slightly cropped length revealing a small midriff gap'],
    紅色短T低腰寬牛仔耳機造型: ['black rectangular sunglasses clipped onto the cap brim'],
  };

  for (const [label, fragments] of Object.entries(expectedFragmentsByLabel)) {
    const option = optionByLabel('specialOutfitId', label);
    for (const fragment of fragments) {
      assert.match(option.en, new RegExp(fragment, 'i'), `${label} should include "${fragment}"`);
    }
  }
});

test('selected special outfit stays the complete wardrobe priority', () => {
  const specialOutfit = optionByLabel('specialOutfitId', '黑色波點頭巾透紗套裝');
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    specialOutfitId: specialOutfit.id,
    topId: optionByLabel('topId', '襯衫').id,
    pantsId: optionByLabel('pantsId', '直筒牛仔褲').id,
    shoesId: optionByLabel('shoesId', '高跟鞋').id,
  });

  assert.match(prompt.grokPrompt, /Wardrobe:\nShe wears black sheer polka-dot matching fashion set/);
  assert.doesNotMatch(prompt.grokPrompt, /\nTop:|\nPants:|\nShoes:|\nOutfit Preset:|\nDress:/);
  assert.match(prompt.zImagePrompt, /She wears complete special outfit: black sheer polka-dot matching fashion set/);
});

test('special outfit hairstyle applies when regular hairstyle is unset', () => {
  const hairstyleOutfit = optionByLabel('specialOutfitId', '棕色開襟外套細肩背心條紋工裝褲造型');
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    specialOutfitId: hairstyleOutfit.id,
  });
  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt, prompt.summary].join('\n');

  assert.equal(prompt.selection.hairstyleId, '');
  assert.equal(prompt.selection.hairColorId, '');
  assert.match(promptText, /long loose center-part brown hair/);
});

test('explicit hairstyle overrides special outfit hairstyle', () => {
  const hairstyleOutfit = optionByLabel('specialOutfitId', '棕色開襟外套細肩背心條紋工裝褲造型');
  const hairstyle = optionByLabel('hairstyleId', '直髮：中分');
  const hairColor = optionByLabel('hairColorId', '寶石藍');
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    specialOutfitId: hairstyleOutfit.id,
    hairstyleId: hairstyle.id,
    hairColorId: hairColor.id,
  });
  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt, prompt.summary].join('\n');

  assert.equal(prompt.selection.hairstyleId, hairstyle.id);
  assert.equal(prompt.selection.hairColorId, hairColor.id);
  assert.match(promptText, /long straight hair with a center part|直髮：中分/);
  assert.match(promptText, /jewel cobalt-blue fashion hair color|寶石藍/);
  assert.match(promptText, /dark brown open knit cardigan/);
  assert.doesNotMatch(promptText, /long loose center-part brown hair/);
});

test('special outfit hair accessories do not suppress regular hairstyle controls', () => {
  const accessoryOutfit = optionByLabel('specialOutfitId', '迷彩透紗白蕾絲束胸裙裝');
  const clawClipOutfit = optionByLabel('specialOutfitId', '粉紫蕾絲豹紋低腰喇叭褲造型');
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    specialOutfitId: accessoryOutfit.id,
    hairstyleId: optionByLabel('hairstyleId', '直髮：中分').id,
    hairColorId: optionByLabel('hairColorId', '寶石藍').id,
  });
  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt, prompt.summary].join('\n');

  assert.equal(prompt.selection.hairstyleId, optionByLabel('hairstyleId', '直髮：中分').id);
  assert.equal(prompt.selection.hairColorId, optionByLabel('hairColorId', '寶石藍').id);
  assert.match(promptText, /small white hair clips/);
  assert.match(promptText, /long straight hair with a center part|直髮：中分/);
  assert.match(promptText, /jewel cobalt-blue fashion hair color|寶石藍/);

  const [clawClipPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    specialOutfitId: clawClipOutfit.id,
    hairstyleId: optionByLabel('hairstyleId', '直髮：中分').id,
    hairColorId: optionByLabel('hairColorId', '寶石藍').id,
  });
  const clawClipText = [clawClipPrompt.grokPrompt, clawClipPrompt.zImagePrompt, clawClipPrompt.midjourneyPrompt, clawClipPrompt.summary].join('\n');

  assert.equal(clawClipPrompt.selection.hairstyleId, optionByLabel('hairstyleId', '直髮：中分').id);
  assert.equal(clawClipPrompt.selection.hairColorId, optionByLabel('hairColorId', '寶石藍').id);
  assert.match(clawClipText, /reddish hair claw clip/);
  assert.match(clawClipText, /long straight hair with a center part|直髮：中分/);
});

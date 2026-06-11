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
  '綠針織運動短褲藍包造型',
  '紅色圖像T格紋短褲長襪造型',
  '紫色佩斯利襯衫短褲軍靴造型',
  '巴西色背心單肩吊帶牛仔造型',
  '紫條紋襯衫洋裝紅包造型',
  '紅帽波點背心寬牛仔造型',
  '粉色愛心T黑寬褲造型',
  '白荷葉襯衫黑吊帶長裙波點包造型',
  '白襯衫黑短褲西部靴造型',
  '奶油掛脖棕紗裙軍靴造型',
  '海軍T灰色工裝長裙造型',
  '黑短外套牛仔短褲樂福造型',
  '乳牛紋連身丹寧開洞褲造型',
  '紅條紋毛衣拼接紗裙造型',
  '薄荷蕾絲短上衣水鑽牛仔造型',
  '黑短T低腰黑牛仔造型',
  '白T紫格長裙灰球鞋造型',
  '黑皮外套波點絲襪長靴造型',
  '黃條紋Polo領帶寬牛仔造型',
  '菱格背心黑寬短褲長襪造型',
  '藍荷葉背心白紗長裙造型',
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

test('special outfit controls expose exactly the approved 82 complete looks', () => {
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

test('special outfit street reference looks 62 to 69 preserve hair, bags, accessories, and footwear', () => {
  const expectedByLabel = {
    綠針織運動短褲藍包造型: [
      'long blonde hair under a pale blue bandana headscarf',
      'semi-transparent brown sunglasses',
      'bright green fuzzy oversized V-neck sweater',
      'black athletic three-stripe knee shorts',
      'large cobalt blue nylon shoulder bag',
      'white crew socks',
      'black three-stripe sneakers',
      'reference/wardrobe/special-outfits/62_綠針織運動短褲藍包.png',
    ],
    紅色圖像T格紋短褲長襪造型: [
      'short reddish pixie hair',
      'semi-transparent brown sunglasses',
      'red fitted graphic T-shirt',
      'plaid drawstring shorts',
      'dark gray thigh-high socks',
      'black chunky Mary Jane shoes',
      'tan structured handbag',
      'reference/wardrobe/special-outfits/63_紅色圖像T格紋短褲長襪.png',
    ],
    紫色佩斯利襯衫短褲軍靴造型: [
      'brown hair tucked under a green bandana headscarf',
      'oversized purple paisley button-down shirt worn open',
      'black leather-look knee-length shorts',
      'black mid-calf socks',
      'chunky black combat boots with yellow lace accents',
      'pearl choker necklace',
      'reference/wardrobe/special-outfits/64_紫色佩斯利襯衫短褲軍靴.png',
    ],
    巴西色背心單肩吊帶牛仔造型: [
      'loose brown hair',
      'yellow-and-green Brazil flag sports bra top',
      'blue denim overalls worn slouched with one bib strap undone',
      'navy shoulder bag',
      'wired white earphones',
      'dark low-profile sneakers',
      'reference/wardrobe/special-outfits/65_巴西色背心單肩吊帶牛仔.png',
    ],
    紫條紋襯衫洋裝紅包造型: [
      'long straight dark hair with full bangs',
      'oversized purple-and-white vertical striped button-down shirt dress',
      'red quilted chain-strap shoulder bag',
      'navy ankle socks',
      'red pointed flats with striped metallic toe detail',
      'reference/wardrobe/special-outfits/66_紫條紋襯衫洋裝紅包.png',
    ],
    紅帽波點背心寬牛仔造型: [
      'long wavy hair under a red baseball cap',
      'white camisole with black polka dots',
      'very wide dark blue low-rise jeans',
      'black handbag with a dangling white star charm',
      'black sunglasses',
      'black sneakers',
      'reference/wardrobe/special-outfits/67_紅帽波點背心寬牛仔.png',
    ],
    粉色愛心T黑寬褲造型: [
      'long black wavy hair with wispy bangs',
      'pink fitted baby tee with I heart ME graphic and leopard heart',
      'black wide-leg drawstring pants',
      'black shoulder bag with chain strap',
      'black heart pendant necklace',
      'black platform clogs',
      'reference/wardrobe/special-outfits/68_粉色愛心T黑寬褲.png',
    ],
    白荷葉襯衫黑吊帶長裙波點包造型: [
      'long wavy platinum-blonde hair with braided side detail',
      'white sheer ruffled Victorian blouse',
      'black long slip dress layered over the blouse',
      'oversized red tote bag with white polka dots',
      'silver pendant necklace',
      'black sneakers with white three-stripe detail',
      'reference/wardrobe/special-outfits/69_白荷葉襯衫黑吊帶長裙波點包.png',
    ],
  };

  for (const [label, expectations] of Object.entries(expectedByLabel)) {
    const referenceImage = expectations.at(-1);
    const fragments = expectations.slice(0, -1);
    const option = optionByLabel('specialOutfitId', label);

    for (const fragment of fragments) {
      assert.match(option.en, new RegExp(fragment, 'i'), `${label} should include "${fragment}"`);
    }

    assert.equal(option.meta.referenceImage, referenceImage);
    assert.equal(option.meta.referenceImageFormat, 'png');
  }
});

test('special outfit street reference looks 70 to 82 omit bags and hairstyles while preserving outfit anchors', () => {
  const expectedByLabel = {
    白襯衫黑短褲西部靴造型: [
      'oversized semi-sheer white button-up shirt worn open',
      'black bandeau crop top',
      'black satin boxer-style micro shorts',
      'tan mid-calf western boots',
      'blue oval sunglasses',
      'reference/wardrobe/special-outfits/70_白襯衫黑短褲西部靴.png',
    ],
    奶油掛脖棕紗裙軍靴造型: [
      'cream halter tube top',
      'layered brown sheer asymmetrical midi skirt',
      'black grommet utility waist belt',
      'white slouch socks',
      'black lace-up combat boots',
      'visible arm tattoos',
      'reference/wardrobe/special-outfits/71_奶油掛脖棕紗裙軍靴.png',
    ],
    海軍T灰色工裝長裙造型: [
      'oversized navy short-sleeve T-shirt',
      'gray full-length cargo maxi skirt',
      'layered silver pendant necklaces',
      'black leather wrist cuff',
      'chunky black-gray sneakers',
      'reference/wardrobe/special-outfits/72_海軍T灰色工裝長裙.png',
    ],
    黑短外套牛仔短褲樂福造型: [
      'cropped black textured jacket with gold buttons',
      'light blue frayed denim shorts',
      'white ankle socks',
      'black tabi-style loafers',
      'layered pearl and gold necklaces',
      'reference/wardrobe/special-outfits/73_黑短外套牛仔短褲樂福.png',
    ],
    乳牛紋連身丹寧開洞褲造型: [
      'off-shoulder cow-print fitted romper',
      'ruffled neckline and long bell sleeves',
      'black waist belt with large silver buckle',
      'dramatic blue denim chaps-style wide pants',
      'large thigh cut-outs',
      'denim cowboy hat',
      'reference/wardrobe/special-outfits/74_乳牛紋連身丹寧開洞褲.png',
    ],
    紅條紋毛衣拼接紗裙造型: [
      'burgundy paisley bandana',
      'oversized red navy and white striped sweater',
      'layered white lace ruffle skirt panel',
      'pale blue draped sheer tie-dye skirt',
      'blue slouchy suede knee boots',
      'visible arm tattoos',
      'reference/wardrobe/special-outfits/75_紅條紋毛衣拼接紗裙.png',
    ],
    薄荷蕾絲短上衣水鑽牛仔造型: [
      'sheer mint off-shoulder wrap crop top',
      'scalloped embroidered lace hem',
      'low-rise wide-leg blue jeans with rhinestone swirl embellishment',
      'silver butterfly chain waist belt',
      'crystal butterfly necklace',
      'reference/wardrobe/special-outfits/76_薄荷蕾絲短上衣水鑽牛仔.png',
    ],
    黑短T低腰黑牛仔造型: [
      'fitted black cropped baby T-shirt',
      'exposed midriff',
      'low-rise black straight-leg jeans',
      'black leather belt with oversized silver western buckle',
      'black leather ankle boots',
      'reference/wardrobe/special-outfits/77_黑短T低腰黑牛仔.png',
    ],
    白T紫格長裙灰球鞋造型: [
      'white short-sleeve graphic T-shirt with pale purple print',
      'lavender plaid semi-sheer maxi skirt',
      'soft ruffled hem',
      'white crew socks',
      'gray low-top sneakers with cream laces',
      'reference/wardrobe/special-outfits/78_白T紫格長裙灰球鞋.png',
    ],
    黑皮外套波點絲襪長靴造型: [
      'oversized black leather blazer',
      'black-and-cream striped knit top',
      'short black mini bottom',
      'sheer black polka-dot tights',
      'tall black leather boots',
      'reference/wardrobe/special-outfits/79_黑皮外套波點絲襪長靴.png',
    ],
    黃條紋Polo領帶寬牛仔造型: [
      'red baseball cap',
      'oversized yellow-and-white striped polo shirt with white collar',
      'black necktie',
      'light blue relaxed straight-leg jeans',
      'silver wallet chain',
      'black leather shoes',
      'reference/wardrobe/special-outfits/80_黃條紋Polo領帶寬牛仔.png',
    ],
    菱格背心黑寬短褲長襪造型: [
      'red baseball cap',
      'white crew-neck T-shirt',
      'red light-blue and white argyle knit vest',
      'black wide knee-length denim shorts',
      'white knee-high socks',
      'visible arm tattoos',
      'reference/wardrobe/special-outfits/81_菱格背心黑寬短褲長襪.png',
    ],
    藍荷葉背心白紗長裙造型: [
      'sheer nude mesh upper layer',
      'light blue pleated ruffle babydoll camisole',
      'voluminous white tiered tulle maxi skirt',
      'multiple ruffle bands',
      'pale mint square-toe shoes',
      'reference/wardrobe/special-outfits/82_藍荷葉背心白紗長裙.png',
    ],
  };
  const omittedTerms = /\b(hair|hairstyle|bangs|bob|braid|blonde|brunette|bag|handbag|shoulder bag|tote|backpack|purse|clutch)\b/i;

  for (const [label, expectations] of Object.entries(expectedByLabel)) {
    const referenceImage = expectations.at(-1);
    const fragments = expectations.slice(0, -1);
    const option = optionByLabel('specialOutfitId', label);

    for (const fragment of fragments) {
      assert.match(option.en, new RegExp(fragment, 'i'), `${label} should include "${fragment}"`);
    }

    assert.doesNotMatch(option.en, omittedTerms, `${label} should omit bags and hairstyles`);
    assert.equal(option.meta.referenceImage, referenceImage);
    assert.equal(option.meta.referenceImageFormat, 'png');
  }
});

test('selected special outfit stays the complete wardrobe priority', () => {
  const specialOutfit = optionByLabel('specialOutfitId', '黑色波點頭巾透紗套裝');
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionByLabel('framingId', '全身鏡頭 (Full Body Shot)').id,
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
    framingId: optionByLabel('framingId', '全身鏡頭 (Full Body Shot)').id,
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
    framingId: optionByLabel('framingId', '全身鏡頭 (Full Body Shot)').id,
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
    framingId: optionByLabel('framingId', '全身鏡頭 (Full Body Shot)').id,
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
    framingId: optionByLabel('framingId', '全身鏡頭 (Full Body Shot)').id,
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

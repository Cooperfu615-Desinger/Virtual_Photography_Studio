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
const allPromptOutputs = (prompt) => [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt].join('\n');

test('outfit presets expose themed options and remove abstract style presets', () => {
  const labels = optionLabels('outfitPresetId');

  [
    '套裝：西裝長褲',
    '套裝：秘書短裙',
    '套裝：空服員制服',
    '套裝：護士制服',
    '套裝：醫生診療袍',
    '套裝：鏈條緞面內衣',
    '套裝：玫瑰哥德蘿莉塔洋裝',
    '套裝：短版運動T熱褲',
    '套裝：開扣短袖襯衫熱褲',
    '套裝：開扣長袖襯衫包臀裙',
    '套裝：粉紅哥德兔耳吊帶束身',
    '套裝：米白緞面蕾絲馬甲短裙',
    '套裝：哥德圖示包臀迷你裙',
  ].forEach((label) => {
    assert.ok(labels.includes(label), `${label} should be available`);
  });

  [
    '套裝：極簡高級',
    '套裝：日系街頭',
    '套裝：居家慵懶',
    '套裝：文青生活',
    '套裝：清爽運動',
    '套裝：甜辣街頭',
    '套裝：都會通勤',
    '套裝：旅行度假',
    '套裝：夜生活辣妹',
    '套裝：經典漢服',
    '套裝：改良漢服',
  ].forEach((label) => {
    assert.ok(!labels.includes(label), `${label} should be removed`);
  });
});

test('reference outfit presets 27 to 38 preserve complete styling anchors and image metadata', () => {
  [
    [
      '套裝：豹紋蕾絲抹胸喇叭牛仔',
      /leopard-pattern strapless corset top/i,
      /lace bust cups/i,
      /low-rise flared jeans/i,
      'reference/wardrobe/outfit-presets/27_豹紋蕾絲抹胸喇叭牛仔.avif',
    ],
    [
      '套裝：網紗掛脖背心牛仔迷你裙',
      /sheer mesh halter camisole/i,
      /denim micro mini skirt/i,
      /platform sandals/i,
      'reference/wardrobe/outfit-presets/28_網紗掛脖牛仔迷你裙.avif',
    ],
    [
      '套裝：天使翅膀三角比基尼',
      /triangle bikini costume set/i,
      /feather angel wings/i,
      /layered body chains/i,
      'reference/wardrobe/outfit-presets/29_天使翅膀比基尼.avif',
    ],
    [
      '套裝：透視背心漆皮短褲長靴',
      /cropped sheer fitted tank top/i,
      /exposed navel and abdomen/i,
      /strapless lace bra layer/i,
      /low-rise glossy micro shorts/i,
      /knee-high leather boots/i,
      'reference/wardrobe/outfit-presets/30_透視背心漆皮短褲長靴.avif',
    ],
    [
      '套裝：馬甲吊帶喇叭褲',
      /button-front corset camisole/i,
      /slim flared trousers/i,
      /lingerie-trim neckline/i,
      'reference/wardrobe/outfit-presets/31_馬甲吊帶喇叭褲.avif',
    ],
    [
      '套裝：豹紋荷葉吊帶漆皮短褲',
      /leopard-pattern ruffled camisole/i,
      /glossy micro shorts/i,
      /knee-high open-toe boots/i,
      'reference/wardrobe/outfit-presets/32_豹紋荷葉吊帶漆皮短褲.avif',
    ],
    [
      '套裝：拼接掛脖長背心漆皮短褲',
      /patchwork halter scarf top/i,
      /glossy micro shorts/i,
      /lace-up ankle boots/i,
      'reference/wardrobe/outfit-presets/33_拼接掛脖漆皮短褲.avif',
    ],
    [
      '套裝：金屬三角比基尼',
      /metallic triangle bikini set/i,
      /side-tie bikini bottoms/i,
      /layered body chains/i,
      'reference/wardrobe/outfit-presets/34_金屬三角比基尼.avif',
    ],
    [
      '套裝：單肩短上衣印花圍裙短裙',
      /one-shoulder cropped top/i,
      /printed scarf-wrap mini skirt/i,
      /lace-up heeled boots/i,
      'reference/wardrobe/outfit-presets/35_單肩短上衣印花圍裙短裙.avif',
    ],
    [
      '套裝：垂墜背心腰鏈短裙',
      /draped sleeveless top/i,
      /asymmetric wrap mini skirt/i,
      /chain belt/i,
      'reference/wardrobe/outfit-presets/36_垂墜背心腰鏈短裙.avif',
    ],
    [
      '套裝：皮革掛脖背心短褲長靴',
      /zip-front leather halter vest/i,
      /low-rise leather shorts/i,
      /knee-high leather boots/i,
      'reference/wardrobe/outfit-presets/37_皮革掛脖短褲長靴.avif',
    ],
    [
      '套裝：斑馬紋馬甲短褲長靴',
      /zebra-pattern corset tank/i,
      /glossy micro shorts/i,
      /knee-high leather boots/i,
      'reference/wardrobe/outfit-presets/38_斑馬紋馬甲短褲長靴.avif',
    ],
  ].forEach(([label, ...expectations]) => {
    const referenceImage = expectations.pop();
    const option = optionByLabel('outfitPresetId', label);
    const text = [option.en, option.desc].join(' ');

    expectations.forEach((pattern) => {
      assert.match(text, pattern);
    });

    if (label === '套裝：拼接掛脖長背心漆皮短褲') {
      assert.match(text, /long pointed draped hem/i);
      assert.doesNotMatch(text, /controlled by the outfit color selection/i);
    } else {
      assert.match(text, /controlled by the outfit color selection/i);
    }
    assert.doesNotMatch(text, /side sash|側邊垂墜薄紗片|側邊腰帶/i);
    assert.equal(option.meta.referenceImage, referenceImage);
    assert.equal(option.meta.referenceImageFormat, 'avif');
  });
});

test('sporty ringer tee hot-pants outfit preserves key garment and accessory anchors', () => {
  const outfit = optionByLabel('outfitPresetId', '套裝：短版運動T熱褲');
  const fullBodyFramingId = optionByLabel('framingId', '全身鏡頭 (Full Body Shot)').id;
  const text = [outfit.en, outfit.desc].join(' ');

  assert.match(text, /sporty ringer baby-tee and dolphin shorts outfit/i);
  assert.match(text, /contrast collar and sleeve binding/i);
  assert.match(text, /low-rise dolphin micro shorts/i);
  assert.match(text, /front drawstring and side lace-up grommet detail/i);
  assert.match(text, /knee-high athletic socks/i);
  assert.doesNotMatch(text, /shoulder bag|handbag/i);
  assert.match(text, /controlled by the outfit color selection/i);
  assert.equal(outfit.meta.referenceImage, 'reference/wardrobe/outfit-presets/39_短版熱褲運動T.avif');
  assert.equal(outfit.meta.referenceImageFormat, 'avif');

  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: fullBodyFramingId,
    outfitPresetId: outfit.id,
    topId: optionByLabel('topId', '全無').id,
    dressId: optionByLabel('dressId', '全無').id,
    pantsId: optionByLabel('pantsId', '全無').id,
    skirtId: optionByLabel('skirtId', '全無').id,
    outerwearId: optionByLabel('outerwearId', '全無').id,
    topBottomPaletteId: optionByLabel('topBottomPaletteId', '全無').id,
  });

  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt].join('\n');

  assert.match(promptText, /sporty ringer baby-tee and dolphin shorts outfit/i);
  assert.match(promptText, /low-rise dolphin micro shorts/i);
  assert.match(promptText, /side lace-up grommet detail/i);
  assert.equal(prompt.selection.outfitPresetId, outfit.id);
});

test('lightweight yukata outfit preserves wrap styling patterns and pouch', () => {
  const outfit = optionByLabel('outfitPresetId', '套裝：輕盈浴衣');
  const fullBodyFramingId = optionByLabel('framingId', '全身鏡頭 (Full Body Shot)').id;
  const text = [outfit.en, outfit.desc].join(' ');

  [
    /crossed wrap front/i,
    /wide kimono sleeves/i,
    /lace inner collar/i,
    /wide obi with floral-petal motif/i,
    /pearl cord/i,
    /seigaiha wave pattern/i,
    /shippo floral lattice panels/i,
    /drawstring kinchaku pouch/i,
  ].forEach((pattern) => {
    assert.match(text, pattern);
  });

  assert.match(text, /controlled by the outfit color selection/i);
  assert.doesNotMatch(text, /hair|hairstyle|髮型|頭髮/i);

  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: fullBodyFramingId,
    outfitPresetId: outfit.id,
    topId: optionByLabel('topId', '全無').id,
    dressId: optionByLabel('dressId', '全無').id,
    pantsId: optionByLabel('pantsId', '全無').id,
    skirtId: optionByLabel('skirtId', '全無').id,
    outerwearId: optionByLabel('outerwearId', '全無').id,
    topBottomPaletteId: optionByLabel('topBottomPaletteId', '全無').id,
  });

  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt].join('\n');

  assert.match(promptText, /crossed wrap front/i);
  assert.match(promptText, /wide obi with floral-petal motif/i);
  assert.match(promptText, /seigaiha wave pattern/i);
  assert.match(promptText, /shippo floral lattice panels/i);
  assert.match(promptText, /drawstring kinchaku pouch/i);
  assert.equal(prompt.selection.outfitPresetId, outfit.id);
});

test('open-button fitted shirt outfit presets preserve shorts and skirt variants', () => {
  [
    [
      '套裝：開扣短袖襯衫熱褲',
      /tight short-sleeve button-up shirt outfit/i,
      /opaque stretch cotton shirting fabric/i,
      /structured collar and short sleeves/i,
      /upper buttons left open/i,
      /visible button placket pulling at the chest and waist/i,
      /skin-tight ultra-short hot pants/i,
      /dominant fabric color controlled by the outfit color selection/i,
      'reference/wardrobe/outfit-presets/50_開扣短袖襯衫熱褲.avif',
    ],
    [
      '套裝：開扣長袖襯衫包臀裙',
      /tight long-sleeve button-up shirt outfit/i,
      /opaque stretch cotton shirting fabric/i,
      /structured collar and long fitted sleeves/i,
      /upper buttons left open/i,
      /visible button placket pulling at the chest and waist/i,
      /tight bodycon mini skirt/i,
      /smooth hip-hugging skirt silhouette/i,
      'reference/wardrobe/outfit-presets/51_開扣長袖襯衫包臀裙.avif',
    ],
  ].forEach(([label, ...expectations]) => {
    const referenceImage = expectations.pop();
    const option = optionByLabel('outfitPresetId', label);
    const text = [option.en, option.desc].join(' ');

    expectations.forEach((pattern) => {
      assert.match(text, pattern);
    });

    assert.match(text, /controlled by the outfit color selection/i);
    assert.doesNotMatch(text, /hair|hairstyle|髮型|頭髮/i);
    assert.equal(option.meta.referenceImage, referenceImage);
    assert.equal(option.meta.referenceImageFormat, 'avif');
  });

  const fullBodyFramingId = optionByLabel('framingId', '全身鏡頭 (Full Body Shot)').id;
  const shortsOutfit = optionByLabel('outfitPresetId', '套裝：開扣短袖襯衫熱褲');
  const skirtOutfit = optionByLabel('outfitPresetId', '套裝：開扣長袖襯衫包臀裙');

  const sharedLocks = {
    ...createEmptyLocks(),
    framingId: fullBodyFramingId,
    topId: optionByLabel('topId', '全無').id,
    dressId: optionByLabel('dressId', '全無').id,
    pantsId: optionByLabel('pantsId', '全無').id,
    skirtId: optionByLabel('skirtId', '全無').id,
    outerwearId: optionByLabel('outerwearId', '全無').id,
    topBottomPaletteId: optionByLabel('topBottomPaletteId', '全無').id,
  };

  const [shortsPrompt] = generatePrompts(1, {
    ...sharedLocks,
    outfitPresetId: shortsOutfit.id,
  });
  const [skirtPrompt] = generatePrompts(1, {
    ...sharedLocks,
    outfitPresetId: skirtOutfit.id,
  });

  assert.match([shortsPrompt.grokPrompt, shortsPrompt.zImagePrompt, shortsPrompt.midjourneyPrompt].join('\n'), /skin-tight (?:ultra-short )?hot pants/i);
  assert.match([skirtPrompt.grokPrompt, skirtPrompt.zImagePrompt, skirtPrompt.midjourneyPrompt].join('\n'), /tight bodycon mini skirt/i);
  assert.equal(shortsPrompt.selection.outfitPresetId, shortsOutfit.id);
  assert.equal(skirtPrompt.selection.outfitPresetId, skirtOutfit.id);
});

test('gothic lingerie outfit presets 52 to 54 stay recolorable while preserving trim anchors', () => {
  [
    [
      '套裝：粉紅哥德兔耳吊帶束身',
      /gothic bunny corset outfit/i,
      /bunny-ear headband with lace inner panels/i,
      /one bunny ear standing upright and the other half-drooping/i,
      /bow accents placed clearly on both the left and right sides of the headband/i,
      /shaped cup seams and vertical boning lines/i,
      /cross appliques/i,
      /matching main-color garter lace thigh-high stockings/i,
      /leather neck choker with metal cross pendant/i,
      /main fabric color controlled by outfit primary color/i,
      /lace ribbons garter straps and trims controlled by outfit contrast color/i,
      'reference/wardrobe/outfit-presets/52_粉紅哥德兔耳吊帶束身.avif',
    ],
    [
      '套裝：米白緞面蕾絲馬甲短裙',
      /satin corset mini outfit/i,
      /strapless underwire cup corset with structured cup seams/i,
      /vertical boning channels/i,
      /lace bust trim/i,
      /front center lace-up cord threaded through small eyelets/i,
      /tiny bow accent at the lower lacing point/i,
      /flared satin peplum overskirt/i,
      /lace micro-skirt layer visible underneath the peplum/i,
      /scalloped lace mini hem/i,
      /satin base controlled by outfit primary color/i,
      /lace cord eyelet and bow details controlled by outfit contrast color/i,
      'reference/wardrobe/outfit-presets/53_米白緞面蕾絲馬甲短裙.avif',
    ],
    [
      '套裝：哥德圖示包臀迷你裙',
      /second-skin gothic graphic mini-dress outfit/i,
      /ultra-tight bodycon fit/i,
      /smooth elastic fabric with a skin-like surface/i,
      /fabric clinging closely to the torso waist hips and upper thighs/i,
      /lace sleeve cuffs and hem trim/i,
      /hand-drawn gothic cross symbols and handwritten icon graphics scattered irregularly/i,
      /non-repeating imperfect marker-like placement/i,
      /choker with cross pendant/i,
      /dress base controlled by outfit primary color/i,
      /lace trims and gothic hand-drawn graphics controlled by outfit contrast color/i,
      'reference/wardrobe/outfit-presets/54_白色哥德圖示包臀迷你裙.avif',
    ],
  ].forEach(([label, ...expectations]) => {
    const referenceImage = expectations.pop();
    const option = optionByLabel('outfitPresetId', label);
    const text = [option.en, option.desc].join(' ');

    expectations.forEach((pattern) => {
      assert.match(text, pattern);
    });

    assert.doesNotMatch(text, /hair|hairstyle|髮型|頭髮/i);
    assert.doesNotMatch(text, /\bsoft pink\b|\bivory\b|\bwhite\b|\bblack\b|\bpink\b/i);
    assert.equal(option.meta.referenceImage, referenceImage);
    assert.equal(option.meta.referenceImageFormat, 'avif');
  });
});

test('qipao outfit presets preserve updated mini and high-slit silhouettes', () => {
  const solidQipao = optionByLabel('outfitPresetId', '套裝：素色緞面旗袍');
  const embroideredQipao = optionByLabel('outfitPresetId', '套裝：精緻刺繡旗袍');
  const fullBodyFramingId = optionByLabel('framingId', '全身鏡頭 (Full Body Shot)').id;

  [
    [solidQipao, /solid satin cheongsam mini outfit/i],
    [solidQipao, /body-contouring short-sleeve cut/i],
    [solidQipao, /ultra-short mini hem/i],
    [solidQipao, /high side slit/i],
    [solidQipao, /curve-emphasizing silhouette/i],
    [embroideredQipao, /embroidered sleeveless cheongsam outfit/i],
    [embroideredQipao, /shoulder-baring armholes/i],
    [embroideredQipao, /body-contouring cut/i],
    [embroideredQipao, /waist-high side slit/i],
    [embroideredQipao, /floral and dragon embroidery/i],
  ].forEach(([option, pattern]) => {
    const text = [option.en, option.desc].join(' ');
    assert.match(text, pattern);
  });

  assert.match(solidQipao.en, /controlled by the outfit color selection/i);
  assert.match(embroideredQipao.en, /controlled by outfit color selection/i);
  assert.equal(solidQipao.meta.referenceImage, 'reference/wardrobe/outfit-presets/16_素面旗袍.avif');
  assert.equal(embroideredQipao.meta.referenceImage, 'reference/wardrobe/outfit-presets/17_緞面旗袍.avif');

  const sharedLocks = {
    ...createEmptyLocks(),
    framingId: fullBodyFramingId,
    topId: optionByLabel('topId', '全無').id,
    dressId: optionByLabel('dressId', '全無').id,
    pantsId: optionByLabel('pantsId', '全無').id,
    skirtId: optionByLabel('skirtId', '全無').id,
    outerwearId: optionByLabel('outerwearId', '全無').id,
    topBottomPaletteId: optionByLabel('topBottomPaletteId', '全無').id,
  };

  const [solidPrompt] = generatePrompts(1, {
    ...sharedLocks,
    outfitPresetId: solidQipao.id,
  });
  const [embroideredPrompt] = generatePrompts(1, {
    ...sharedLocks,
    outfitPresetId: embroideredQipao.id,
  });

  assert.match([solidPrompt.grokPrompt, solidPrompt.zImagePrompt, solidPrompt.midjourneyPrompt].join('\n'), /ultra-short mini hem/i);
  assert.match([solidPrompt.grokPrompt, solidPrompt.zImagePrompt, solidPrompt.midjourneyPrompt].join('\n'), /high side slit/i);
  assert.match([embroideredPrompt.grokPrompt, embroideredPrompt.zImagePrompt, embroideredPrompt.midjourneyPrompt].join('\n'), /sleeveless cheongsam/i);
  assert.match([embroideredPrompt.grokPrompt, embroideredPrompt.zImagePrompt, embroideredPrompt.midjourneyPrompt].join('\n'), /waist-high side slit/i);
});

test('street reference outfit presets 40 to 48 preserve full outfit accessories and footwear', () => {
  [
    [
      '套裝：白蕾絲泡袖七分褲',
      /white lace puff-sleeve tie-front blouse/i,
      /dark brown cropped capri pants/i,
      /white lace socks/i,
      /black patent Mary Jane shoes/i,
      /silver shoulder bag/i,
      'reference/wardrobe/outfit-presets/40_白蕾絲泡袖七分褲.avif',
    ],
    [
      '套裝：粉針織罩衫寬牛仔',
      /pale pink sheer knit cardigan/i,
      /white lace-trim camisole/i,
      /light blue wide-leg jeans/i,
      /silver ballet flats/i,
      /silver shoulder bag/i,
      'reference/wardrobe/outfit-presets/41_粉針織罩衫寬牛仔.avif',
    ],
    [
      '套裝：深灰短背心氣球寬褲',
      /dark gray cropped sleeveless tank/i,
      /light gray balloon wide pants/i,
      /white chunky sneakers/i,
      /silver shoulder bag/i,
      /small cross pendant/i,
      'reference/wardrobe/outfit-presets/42_深灰短背心氣球寬褲.avif',
    ],
    [
      '套裝：白襯衫緞面背心寬牛仔',
      /sheer white long shirt worn open/i,
      /champagne satin camisole/i,
      /light blue wide-leg jeans/i,
      /white strappy heeled sandals/i,
      /silver mini shoulder bag/i,
      'reference/wardrobe/outfit-presets/43_白襯衫緞面背心寬牛仔.avif',
    ],
    [
      '套裝：西裝外套蕾絲迷你洋裝',
      /navy oversized blazer/i,
      /white lace mini dress/i,
      /white knee-high socks/i,
      /black chunky Mary Jane loafers/i,
      /black chain shoulder bag/i,
      'reference/wardrobe/outfit-presets/44_西裝外套蕾絲迷你洋裝.avif',
    ],
    [
      '套裝：球衣荷葉迷你裙',
      /oversized white football jersey/i,
      /large number 28 graphic/i,
      /red tiered ruffle mini skirt/i,
      /white crew socks/i,
      /black chunky Mary Jane shoes/i,
      'reference/wardrobe/outfit-presets/45_球衣荷葉迷你裙.avif',
    ],
    [
      '套裝：綁帶針織寬牛仔',
      /burgundy lace-up cropped cardigan/i,
      /white lace camisole layer/i,
      /distressed black wide-leg jeans/i,
      /red pointed shoes/i,
      /black grommet shoulder bag/i,
      'reference/wardrobe/outfit-presets/46_酒紅綁帶針織寬牛仔.avif',
    ],
    [
      '套裝：運動外套荷葉七分褲',
      /navy zip-up track jacket outer layer/i,
      /contrasting white ruffled camisole/i,
      /skirt-like peplum hem peeking out below the jacket/i,
      /black cropped jogger pants/i,
      /white crew socks/i,
      /black ballet flats/i,
      'reference/wardrobe/outfit-presets/47_運動外套荷葉七分褲.avif',
    ],
    [
      '套裝：白蕾絲長罩衫牛仔褲',
      /long white lace robe cardigan/i,
      /white tie-front camisole/i,
      /ripped light blue jeans/i,
      /brown leather shoulder bag/i,
      /burgundy ballet flats/i,
      'reference/wardrobe/outfit-presets/48_白蕾絲長罩衫牛仔褲.avif',
    ],
  ].forEach(([label, ...expectations]) => {
    const referenceImage = expectations.pop();
    const option = optionByLabel('outfitPresetId', label);
    const text = [option.en, option.desc].join(' ');

    expectations.forEach((pattern) => {
      assert.match(text, pattern);
    });

    assert.doesNotMatch(text, /hair|hairstyle|髮型|頭髮/i);
    assert.equal(option.meta.referenceImage, referenceImage);
    assert.equal(option.meta.referenceImageFormat, 'avif');
  });
});

test('dress controls expose short and long one-piece silhouettes only', () => {
  assert.deepEqual(
    optionLabels('dressId').filter((label) => label !== '隨機'),
    [
      '全無',
      '連身：短版｜無袖迷你洋裝',
      '連身：短版｜細肩帶迷你洋裝',
      '連身：短版｜細肩帶蕾絲棉質迷你洋裝',
      '連身：短版｜亮面乳膠迷你洋裝',
      '連身：短版｜亮面深V掛脖迷你洋裝',
      '連身：短版｜一字領哥德迷你洋裝',
      '連身：短版｜復古雙排釦迷你洋裝',
      '連身：長版｜無袖長洋裝',
      '連身：長版｜細肩帶緞面長洋裝',
      '連身：長版｜波希米亞罩衫洋裝',
      '連身：長版｜針織長洋裝',
      '連身：短版｜蝴蝶結抹胸迷你洋裝',
      '連身：長版｜細肩帶斜荷葉長洋裝',
      '連身：短版｜單肩披袖亮片迷你洋裝',
      '連身：短版｜格紋吊帶荷葉迷你洋裝',
      '連身：短版｜緞面細肩帶迷你洋裝',
      '連身：短版｜高領挖腰連身泳裝',
      '連身：短版｜格紋吊帶不規則傘襬洋裝',
      '連身：短版｜波點方領泡袖迷你洋裝',
      '連身：短版｜波點無袖蓬裙迷你洋裝',
      '連身：短版｜條紋荷葉吊帶罩衫迷你洋裝',
      '連身：短版｜流蘇細肩帶抓皺迷你洋裝',
      '連身：短版｜蝴蝶結抹胸蕾絲荷葉迷你洋裝',
      '連身：短版｜亮面乳膠拉鏈洋裝',
    ]
  );

  assert.ok(!optionLabels('dressId').includes('連身：雛菊背心丹寧吊帶短褲造型'));
});

test('reference dress entries describe garments without accessory or shoe details', () => {
  [
    [
      '連身：短版｜蝴蝶結抹胸迷你洋裝',
      /soft silk strapless mini dress/i,
      /tight cropped bodice ending above waistline/i,
      /oversized front bow/i,
      /ultra-short mini skirt/i,
    ],
    [
      '連身：長版｜細肩帶斜荷葉長洋裝',
      /sheer tulle spaghetti-strap maxi dress/i,
      /soft vertical drape/i,
      /diagonal ruffle hem/i,
    ],
    [
      '連身：短版｜單肩披袖亮片迷你洋裝',
      /one-shoulder sequined mini dress/i,
      /draped cape sleeve/i,
      /shimmering torso panel/i,
    ],
    [
      '連身：短版｜格紋吊帶荷葉迷你洋裝',
      /plaid spaghetti-strap mini dress/i,
      /ruched bust panel/i,
      /waterfall ruffle panels/i,
    ],
    [
      '連身：短版｜緞面細肩帶迷你洋裝',
      /satin spaghetti-strap mini dress/i,
      /inner lace bra detail/i,
      /ruched satin torso/i,
    ],
    [
      '連身：短版｜高領挖腰連身泳裝',
      /high-neck extreme front cut-out monokini swimsuit/i,
      /bikini-like one-piece construction/i,
      /connected only by thin side straps/i,
      /oversized open front torso gap exposing most of the abdomen and navel/i,
    ],
  ].forEach(([label, ...patterns]) => {
    const option = optionByLabel('dressId', label);
    const text = [option.en, option.desc].join(' ');

    patterns.forEach((pattern) => {
      assert.match(text, pattern);
    });

    assert.doesNotMatch(text, /sandals|shoes|bag|bracelet|necklace|choker|cuff|earrings|bracelets|手環|項鍊|鞋|包|耳環/i);
    assert.match(text, /controlled by dress color selection/i);
  });
});

test('zippered latex mini dress preserves collared short sleeves and default lowered zipper styling', () => {
  const dress = optionByLabel('dressId', '連身：短版｜亮面乳膠拉鏈洋裝');
  const text = [dress.en, dress.desc].join(' ');

  assert.match(text, /glossy latex collared short-sleeve mini dress/i);
  assert.match(text, /one-piece bodycon silhouette/i);
  assert.match(text, /tone-on-tone center-front zipper from collar through the skirt/i);
  assert.match(text, /zipper lowered to the lower ribs near the navel by default/i);
  assert.match(text, /controlled by dress color selection/i);
  assert.doesNotMatch(text, /white|glasses|earrings|stockings|kitchen|coffee maker/i);
  assert.equal(dress.meta.referenceImageId, 'dresses-024');
  assert.equal(dress.meta.referenceImage, 'reference/wardrobe/dresses/50_短版亮面乳膠拉鏈洋裝.avif');
  assert.equal(dress.meta.referenceImageFormat, 'avif');
});

test('zippered latex mini dress uses the shared dress color and single-dress wardrobe flow', () => {
  const dress = optionByLabel('dressId', '連身：短版｜亮面乳膠拉鏈洋裝');
  const color = optionByLabel('dressColorId', '紅色');
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    dressId: dress.id,
    dressColorId: color.id,
    topId: optionByLabel('topId', '短版 T 恤').id,
    pantsId: optionByLabel('pantsId', '牛仔短褲').id,
  });
  const text = allPromptOutputs(prompt);

  assert.equal(prompt.selection.dressId, dress.id);
  assert.equal(prompt.selection.dressColorId, color.id);
  assert.match(text, /red glossy latex collared short-sleeve(?: mini)? dress/i);
  assert.match(text, /tone-on-tone center-front zipper from collar through the skirt/i);
  assert.match(text, /zipper lowered to the lower ribs near the navel by default/i);
  assert.doesNotMatch(text, /short-sleeve T-shirt|denim shorts/i);
  assert.doesNotMatch([prompt.zImagePrompt, prompt.midjourneyPrompt].join('\n'), /main latex color controlled by dress color selection/i);
});

test('mirror chrome garment color applies scene-reflective material to the new cut-out one-piece', () => {
  const cutoutSwimsuit = optionByLabel('dressId', '連身：短版｜高領挖腰連身泳裝');
  const mirrorChrome = optionByLabel('dressColorId', '鏡面鉻銀');
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionByLabel('framingId', '全身鏡頭 (Full Body Shot)').id,
    outfitPresetId: optionByLabel('outfitPresetId', '全無').id,
    dressId: cutoutSwimsuit.id,
    dressColorId: mirrorChrome.id,
    topBottomPaletteId: optionByLabel('topBottomPaletteId', '全無').id,
  });

  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt].join('\n');

  assert.match(promptText, /mirror-chrome silver/i);
  assert.match(promptText, /scene-reflective surface/i);
  assert.match(
    promptText,
    /high-neck extreme front cut-out monokini swimsuit[^.]*finished in mirror-chrome silver with a highly polished scene-reflective surface and crisp environment reflections/i
  );
  assert.doesNotMatch(promptText, /mirror-chrome silver, highly polished scene-reflective surface/i);
  assert.match(promptText, /high-neck extreme front cut-out monokini swimsuit/i);
  assert.match(promptText, /bikini-like one-piece construction|separate high-neck chest panel and high-cut bikini bottom/i);
  assert.match(promptText, /connected (?:only )?by thin side straps/i);
  assert.match(promptText, /(?:oversized open front torso gap exposing most of the abdomen and navel|large open front torso gap exposing abdomen and navel)/i);
  assert.equal(prompt.selection.outfitPresetId, '');
  assert.equal(prompt.selection.dressId, cutoutSwimsuit.id);
  assert.equal(prompt.selection.dressColorId, mirrorChrome.id);
  assert.equal(cutoutSwimsuit.meta.referenceImage, 'reference/wardrobe/dresses/43_高領挖腰連身.avif');
  assert.equal(cutoutSwimsuit.meta.referenceImageFormat, 'avif');
});

test('cleaned outfit and dress prompts avoid fixed color wording', () => {
  [
    optionByLabel('outfitPresetId', '套裝：鏈條緞面內衣'),
    optionByLabel('outfitPresetId', '套裝：女僕'),
    optionByLabel('outfitPresetId', '套裝：兔女郎'),
    optionByLabel('dressId', '連身：短版｜亮面深V掛脖迷你洋裝'),
    optionByLabel('dressId', '連身：短版｜一字領哥德迷你洋裝'),
  ].forEach((option) => {
    const text = [option.zh, option.en, option.desc].join(' ');
    assert.doesNotMatch(text, /black|white|ivory|silver|rose pink|burgundy|jewel-tone|nude-beige|deep red|玫瑰粉|酒紅|象牙白|銀色|黑色|白色/i);
  });
});

test('nurse uniform outfit prompt does not include apron-like panel wording', () => {
  const nurseOutfit = optionByLabel('outfitPresetId', '套裝：護士制服');
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    outfitPresetId: nurseOutfit.id,
  });
  const text = [nurseOutfit.en, prompt.grokPrompt, prompt.zImagePrompt].join('\n');

  assert.match(text, /nurse uniform outfit/);
  assert.doesNotMatch(text, /apron-like panel/i);
});

test('doctor and secretary outfit prompts include updated signature props and silhouettes', () => {
  const doctorOutfit = optionByLabel('outfitPresetId', '套裝：醫生診療袍');
  const secretaryOutfit = optionByLabel('outfitPresetId', '套裝：秘書短裙');
  const fullBodyFramingId = optionByLabel('framingId', '全身鏡頭 (Full Body Shot)').id;

  assert.match(doctorOutfit.en, /stethoscope/i);
  assert.match(doctorOutfit.en, /medical chart/i);
  assert.match(secretaryOutfit.en, /body-hugging blazer/i);
  assert.match(secretaryOutfit.en, /tight mini skirt/i);

  const [doctorPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: fullBodyFramingId,
    outfitPresetId: doctorOutfit.id,
  });
  const [secretaryPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: fullBodyFramingId,
    outfitPresetId: secretaryOutfit.id,
  });

  assert.match([doctorPrompt.grokPrompt, doctorPrompt.zImagePrompt].join('\n'), /stethoscope/i);
  assert.match([doctorPrompt.grokPrompt, doctorPrompt.zImagePrompt].join('\n'), /medical chart/i);
  assert.match([secretaryPrompt.grokPrompt, secretaryPrompt.zImagePrompt].join('\n'), /body-hugging blazer/i);
  assert.match([secretaryPrompt.grokPrompt, secretaryPrompt.zImagePrompt].join('\n'), /tight mini skirt/i);
});

test('wardrobe image metadata is available for outfit presets and dresses', () => {
  const doctorOutfit = optionByLabel('outfitPresetId', '套裝：醫生診療袍');
  const halterDress = optionByLabel('dressId', '連身：短版｜亮面深V掛脖迷你洋裝');

  assert.equal(doctorOutfit.meta.referenceImage, 'reference/wardrobe/outfit-presets/10_醫生.avif');
  assert.equal(doctorOutfit.meta.referenceImageFormat, 'avif');
  assert.equal(halterDress.meta.referenceImage, 'reference/wardrobe/dresses/31_深V掛脖迷你洋裝.avif');
  assert.equal(halterDress.meta.referenceImageFormat, 'avif');
});

test('wardrobe image metadata is available for special outfits', () => {
  const specialOutfit = optionByLabel('specialOutfitId', '粉紫蕾絲豹紋低腰喇叭褲造型');

  assert.equal(specialOutfit.meta.referenceImage, 'reference/wardrobe/special-outfits/09_粉紫蕾絲豹紋.avif');
  assert.equal(specialOutfit.meta.referenceImageFormat, 'avif');
});

test('moved and renamed outfit preset legacy locks normalize safely', () => {
  const movedLatexDress = normalizeLocks({
    ...createEmptyLocks(),
    outfitPresetId: 'wardrobe:套裝-outfit-presets:玫瑰粉乳膠迷你洋裝套裝:3',
  });
  assert.equal(movedLatexDress.outfitPresetId, 'outfit-preset-none');
  assert.equal(movedLatexDress.dressId, optionByLabel('dressId', '連身：短版｜亮面乳膠迷你洋裝').id);

  const movedDisplayLatexDress = normalizeLocks({
    ...createEmptyLocks(),
    outfitPresetId: 'wardrobe:套裝-outfit-presets:套裝-乳膠迷你洋裝:3',
  });
  assert.equal(movedDisplayLatexDress.outfitPresetId, 'outfit-preset-none');
  assert.equal(movedDisplayLatexDress.dressId, optionByLabel('dressId', '連身：短版｜亮面乳膠迷你洋裝').id);

  const renamedParisPreset = normalizeLocks({
    ...createEmptyLocks(),
    outfitPresetId: 'wardrobe:套裝-outfit-presets:象牙白春日巴黎套裝:4',
  });
  assert.equal(renamedParisPreset.outfitPresetId, optionByLabel('outfitPresetId', '套裝：春日巴黎亞麻長褲').id);

  const renamedDisplayParisPreset = normalizeLocks({
    ...createEmptyLocks(),
    outfitPresetId: 'wardrobe:套裝-outfit-presets:套裝-春日巴黎:4',
  });
  assert.equal(renamedDisplayParisPreset.outfitPresetId, optionByLabel('outfitPresetId', '套裝：春日巴黎亞麻長褲').id);

  const removedHanfu = normalizeLocks({
    ...createEmptyLocks(),
    outfitPresetId: 'wardrobe:套裝-outfit-presets:經典漢服套裝:26',
  });
  assert.equal(removedHanfu.outfitPresetId, 'outfit-preset-none');
});

test('generated prompts keep outfit preset color separate from clothing structure', () => {
  const outfit = optionByLabel('outfitPresetId', '套裝：鏈條緞面內衣');
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionByLabel('framingId', '全身鏡頭 (Full Body Shot)').id,
    outfitPresetId: outfit.id,
    outfitPresetPrimaryColorId: optionByLabel('outfitPresetPrimaryColorId', '紅色').id,
  });

  assert.equal(prompt.selection.outfitPresetId, outfit.id);
  assert.match(prompt.grokPrompt, /Wardrobe:\nShe wears [\s\S]*red satin lingerie set/);
  assert.match(prompt.grokPrompt, /satin lingerie set/);
});

test('portrait outfit preset output keeps visible upper garments and removes hidden lower-body fragments', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionByLabel('framingId', '胸上特寫').id,
    outfitPresetId: optionByLabel('outfitPresetId', '套裝：透視背心漆皮短褲長靴').id,
    outfitPresetPrimaryColorId: optionByLabel('outfitPresetPrimaryColorId', '白色').id,
    outerwearId: optionByLabel('outerwearId', '全無').id,
  });
  const text = allPromptOutputs(prompt);

  assert.match(text, /cropped sheer fitted tank top/i);
  assert.match(text, /strapless lace bra layer/i);
  assert.doesNotMatch(text, /low-rise glossy micro shorts/i);
  assert.doesNotMatch(text, /knee-high leather boots/i);
});

test('cowboy outfit preset output keeps bottoms but removes shoes', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionByLabel('framingId', '牛仔中景 (Cowboy Shot)').id,
    outfitPresetId: optionByLabel('outfitPresetId', '套裝：透視背心漆皮短褲長靴').id,
    outfitPresetPrimaryColorId: optionByLabel('outfitPresetPrimaryColorId', '白色').id,
    outerwearId: optionByLabel('outerwearId', '全無').id,
  });
  const text = allPromptOutputs(prompt);

  assert.match(text, /cropped sheer fitted tank top/i);
  assert.match(text, /low-rise glossy micro shorts/i);
  assert.doesNotMatch(text, /knee-high leather boots/i);
});

test('complete look palette applies to special outfits, outfit presets, and dresses only', () => {
  const completePalette = optionByLabel('completeLookPaletteId', '黑紅街頭');
  const specialOutfit = optionByLabel('specialOutfitId', '粉紫蕾絲豹紋低腰喇叭褲造型');
  const outfitPreset = optionByLabel('outfitPresetId', '套裝：秘書短裙');
  const dress = optionByLabel('dressId', '連身：短版｜亮面乳膠迷你洋裝');
  const top = optionByLabel('topId', '短版 T 恤');
  const skirt = optionByLabel('skirtId', '百褶短裙');
  const fullBodyFramingId = optionByLabel('framingId', '全身鏡頭 (Full Body Shot)').id;

  const [specialPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: fullBodyFramingId,
    specialOutfitId: specialOutfit.id,
    completeLookPaletteId: completePalette.id,
  });
  const [presetPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: fullBodyFramingId,
    outfitPresetId: outfitPreset.id,
    completeLookPaletteId: completePalette.id,
  });
  const [dressPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: fullBodyFramingId,
    dressId: dress.id,
    completeLookPaletteId: completePalette.id,
  });
  const [separatesPrompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    topId: top.id,
    skirtId: skirt.id,
    completeLookPaletteId: completePalette.id,
  });

  [specialPrompt, presetPrompt, dressPrompt].forEach((prompt) => {
    const text = [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt].join('\n');
    assert.equal(prompt.selection.completeLookPaletteId, completePalette.id);
    assert.match(text, /black-and-red street/i);
    assert.doesNotMatch(prompt.zImagePrompt, /complete outfit palette direction: shift the complete outfit palette|preserving garment structure, accessory separation, material contrast, and multi-piece color variation/);
    assert.doesNotMatch(text, /flat color/i);
  });

  assert.equal(separatesPrompt.selection.completeLookPaletteId, '');
  assert.doesNotMatch(
    [separatesPrompt.grokPrompt, separatesPrompt.zImagePrompt, separatesPrompt.midjourneyPrompt].join('\n'),
    /complete outfit palette direction/
  );
});

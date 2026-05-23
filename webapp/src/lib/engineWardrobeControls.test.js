import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls } from './engine.js';

const optionId = (controlKey, zh) => {
  const control = getLockControls().find((item) => item.key === controlKey);
  const option = control?.options.find((item) => item.zh === zh);
  assert.ok(option, `${controlKey} should include ${zh}`);
  return option.id;
};

test('bottom rise controls include a slightly unbuttoned and unzipped pants state', () => {
  const controls = getLockControls();
  const bottomRiseControl = controls.find((control) => control.key === 'bottomRiseId');
  const pantsControl = controls.find((control) => control.key === 'pantsId');
  const unbuttonedRise = bottomRiseControl.options.find((option) => option.zh === '扣子解開拉鏈微開');
  const jeans = pantsControl.options.find((option) => option.zh === '直筒牛仔褲');

  assert.ok(unbuttonedRise);
  assert.ok(jeans);

  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    pantsId: jeans.id,
    bottomRiseId: unbuttonedRise.id,
  });

  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.summary].join('\n');

  assert.match(promptText, /扣子解開拉鏈微開|waist button undone and front zipper slightly lowered/);
  assert.match(promptText, /直筒牛仔褲|straight-leg jeans/);
});

test('special top and bottom palette controls include the new color-card pairings', () => {
  const controls = getLockControls();
  const paletteControl = controls.find((control) => control.key === 'topBottomPaletteId');
  const expectedPalettes = [
    '櫻花粉 × 奶油黃',
    '皇家海軍藍 × 檸檬雪紡',
    '暗影灰 × 沙陶棕',
    '柔亞麻 × 櫻花粉',
    '藍灰 × 晨光奶油黃',
    '午夜潮汐藍 × 沙丘珍珠',
    '日光薄紗 × 鳳凰陶橘',
    '月騎士銀 × 黑色夜幕',
    '酒紅 × 香檳米',
    '薊花淡紫 × 深摩卡',
    '獵人綠 × 沙丘米',
    '萊姆奶油 × 復古葡萄紫',
    '電光玫瑰 × 查特酒綠',
    '熱情桃紅 × 棉花玫瑰',
    '咖啡豆棕黑 × 覆盆莓紅',
    '丁香紫 × 奶油白',
    '冰藍 × 鎗灰',
    '腮紅粉 × 晨光奶油黃',
    '濃縮咖啡棕 × 牡丹粉',
    '柔光光暈 × 龍焰橘',
    '日蝕紫 × 萊姆低語',
    '暗影木棕 × 月紗沙色',
    '冰藍 × 莓果紅',
    '午夜薰衣草紫 × 黑浪',
    '北極騎士白 × 暗星莓紫',
    '水晶潟湖藍 × 空靈晨曦',
    '宇宙港灣藍 × 櫻花粉',
    '虛空暗流 × 皮卡丘黃',
    '霜薄荷 × 黑水核心',
  ];

  assert.ok(paletteControl);
  for (const zh of expectedPalettes) {
    assert.ok(
      paletteControl.options.some((option) => option.zh === zh),
      `topBottomPaletteId should include ${zh}`
    );
  }
});

test('special top and bottom palettes apply separate colors to top and bottom garments', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    topId: optionId('topId', '棉質細肩背心'),
    pantsId: optionId('pantsId', '直筒牛仔褲'),
    topBottomPaletteId: optionId('topBottomPaletteId', '櫻花粉 × 奶油黃'),
  });

  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.summary].join('\n');

  assert.match(promptText, /cherry blossom pink \(#F9A8BB\)/);
  assert.match(promptText, /cream yellow \(#FAFFC7\)/);
  assert.match(promptText, /棉質細肩背心|cotton camisole/);
  assert.match(promptText, /直筒牛仔褲|straight-leg jeans/);
});

test('special outfit controls include the six street-style outfit presets', () => {
  const controls = getLockControls();
  const specialOutfitControl = controls.find((control) => control.key === 'specialOutfitId');
  const expectedOutfits = [
    '拼布絨呢外套塗鴉奶白工裝褲',
    '紅色寬T棕色工裝吊帶褲',
    '紅長大衣虎紋圍巾學院造型',
    '酒紅皮草白高領短裙長靴造型',
    '棕色羊羔絨飛行外套皮褲造型',
    '黑高領格紋百褶短裙長靴造型',
  ];

  assert.ok(specialOutfitControl);
  for (const zh of expectedOutfits) {
    assert.ok(
      specialOutfitControl.options.some((option) => option.zh === zh),
      `specialOutfitId should include ${zh}`
    );
  }
});

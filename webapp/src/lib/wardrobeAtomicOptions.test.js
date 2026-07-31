import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getLockControls } from './engine.js';

const confirmedAdditions = {
  topId: ['長袖上衣', '馬甲上衣', '掛脖上衣', '泡袖上衣', '針織背心'],
  pantsId: ['喇叭褲', '工裝短褲', '氣球工裝褲', '七分褲'],
  skirtId: ['鉛筆裙', '工裝長裙'],
  outerwearId: ['長版外套', '風衣', '針織開襟外套', '棒球外套', '短版粗花呢外套', '蕾絲罩衫'],
  legwearId: ['泡泡襪'],
  shoesId: ['戰鬥靴', '西部靴', '騎士靴', '帆布鞋', '尖頭平底鞋', '分趾鞋', '厚底拖鞋', '厚底楔形涼鞋'],
  headAccessoryId: [
    '棒球帽',
    '漁夫帽',
    '寬簷帽',
    '毛帽',
    '貝雷帽',
    '頭巾',
    '牛仔帽',
    '兔耳髮箍',
    '女僕頭飾',
    '小禮帽',
    '護士帽',
    '蝴蝶結髮夾',
  ],
  eyewearId: ['矩形眼鏡', '飛行員眼鏡', '貓眼眼鏡', '無框眼鏡'],
  eyewearColorId: ['棕色', '琥珀色', '藍色', '紅色', '紫色', '粉色'],
  neckAccessoryId: ['細領帶', '波洛領帶', '串珠頸鏈'],
};

test('confirmed atomic wardrobe additions are exposed by existing controls', () => {
  const controls = new Map(getLockControls().map((control) => [control.key, control]));
  const labels = Object.values(confirmedAdditions).flat();

  assert.equal(labels.length, 51);

  for (const [controlKey, expectedLabels] of Object.entries(confirmedAdditions)) {
    const control = controls.get(controlKey);
    assert.ok(control, `control ${controlKey} should exist`);

    for (const zh of expectedLabels) {
      assert.ok(
        control.options.some((option) => option.zh === zh),
        `${controlKey} should include ${zh}`
      );
    }
  }
});

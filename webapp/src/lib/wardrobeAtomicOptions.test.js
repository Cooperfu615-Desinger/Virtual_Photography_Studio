import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, getLockControls, normalizeLocks } from './engine.js';

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
    '黑色口罩',
    '防毒面具（3M 6200）',
  ],
  eyewearId: ['矩形眼鏡', '飛行員眼鏡', '貓眼眼鏡', '無框眼鏡'],
  eyewearColorId: ['棕色', '琥珀色', '藍色', '紅色', '紫色', '粉色'],
  earringsId: ['中型光滑金屬圈耳環', '長條幾何耳墜', '耳骨夾', '細鏈條耳墜'],
  neckAccessoryId: [
    '細領帶',
    '波洛領帶',
    '串珠頸鏈',
    '銀色粗鏈項鍊',
    'Y字垂墜項鍊',
    '圓形徽章吊墜項鍊',
    '鑰匙吊墜項鍊',
    '皮革 O 環頸圈',
    '金屬狗牌項鍊',
  ],
};

test('confirmed atomic wardrobe additions are exposed by existing controls', () => {
  const controls = new Map(getLockControls().map((control) => [control.key, control]));
  const labels = Object.values(confirmedAdditions).flat();

  assert.equal(labels.length, 63);

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

test('removed neck scarf options are hidden and old selections normalize to none', () => {
  const controls = new Map(getLockControls().map((control) => [control.key, control]));
  const neckControl = controls.get('neckAccessoryId');
  const noneId = neckControl.options.find((option) => option.zh === '全無').id;

  for (const removedLabel of ['刺繡絲巾', '薄長圍巾', '厚長圍巾']) {
    assert.equal(neckControl.options.some((option) => option.zh === removedLabel), false);
  }

  for (const [label, index] of [['刺繡絲巾', 17], ['薄長圍巾', 18], ['厚長圍巾', 19]]) {
    const normalized = normalizeLocks({
      ...createEmptyLocks(),
      neckAccessoryId: `wardrobe:頸部-neck-accessories:${label}:${index}`,
    }, [...controls.values()]);
    assert.equal(normalized.neckAccessoryId, noneId);
  }

  const shiftedLegacyId = 'wardrobe:頸部-neck-accessories:串珠頸鏈:23';
  const normalizedShiftedOption = normalizeLocks({
    ...createEmptyLocks(),
    neckAccessoryId: shiftedLegacyId,
  }, [...controls.values()]);
  assert.equal(normalizedShiftedOption.neckAccessoryId, neckControl.options.find((option) => option.zh === '串珠頸鏈').id);
});

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls } from './engine.js';
import { getCameraControlDisplayLabel } from './page1CameraLabels.js';

function optionId(controlKey, zh) {
  const control = getLockControls().find((entry) => entry.key === controlKey);
  const option = control.options.find((entry) => entry.zh === zh);
  assert.ok(option, `Expected option ${zh} in ${controlKey}`);
  return option.id;
}

function createAllNoneLocks() {
  const locks = { ...createEmptyLocks() };
  getLockControls().forEach((control) => {
    const noneOption = control.options?.find((entry) => entry.zh === '全無' || entry.zh === '無額外表情');
    if (noneOption) locks[control.key] = noneOption.id;
  });
  return locks;
}

test('all three primary prompts share ordinary framing labels while Z-Image adds orbit geometry', () => {
  const [prompt] = generatePrompts(1, {
    ...createAllNoneLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '胸上特寫'),
    angleId: optionId('angleId', '平視高度鏡頭'),
    orbitId: optionId('orbitId', '左前 45 度'),
  });
  const expected = 'Chest-up portrait, eye-level view, front-left three-quarter view';

  [prompt.grokPrompt, prompt.midjourneyPrompt].forEach((text) => {
    assert.match(text, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.equal(text.indexOf(expected), text.lastIndexOf(expected));
  });

  const zImageGeometry = "Photographed from the woman's front-left side. Her left shoulder is nearer the lens, with her upper torso forming a front-left three-quarter silhouette.";
  assert.match(prompt.zImagePrompt, new RegExp(`^Photorealistic editorial portrait\\.\\n\\n${expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\. ${zImageGeometry.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n\\n`));
  assert.doesNotMatch(prompt.grokPrompt, /left shoulder is nearer the lens/i);
  assert.match(prompt.midjourneyPrompt, /^Photorealistic editorial portrait\. Chest-up portrait, eye-level view, front-left three-quarter view\. /);
  assert.doesNotMatch(prompt.midjourneyPrompt, /left shoulder is nearer the lens/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /\n/);
});

test('orbit controls display short direction labels while preserving stored numeric options', () => {
  const orbitControl = getLockControls().find((entry) => entry.key === 'orbitId');
  assert.deepEqual(
    orbitControl.options.filter((option) => option.zh !== '全無').map((option) => getCameraControlDisplayLabel('orbitId', option)),
    ['正面', '左前', '左側', '左後', '背面', '右後', '右側', '右前'],
  );
  assert.equal(orbitControl.options.find((option) => option.zh === '左前 45 度')?.id.includes('45'), true);
});

test('cowboy framing is labeled as knee-up before the generic medium-shot match', () => {
  const [prompt] = generatePrompts(1, {
    ...createAllNoneLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '牛仔中景 (Cowboy Shot)'),
    angleId: optionId('angleId', '高位俯視鏡頭'),
    orbitId: optionId('orbitId', '左側 90 度'),
  });

  for (const field of ['grokPrompt', 'midjourneyPrompt']) {
    assert.match(prompt[field], /Knee-up cowboy shot, high angle, looking down, left profile view/i, field);
    assert.doesNotMatch(prompt[field], /Waist-up portrait/i, field);
  }
  assert.match(prompt.zImagePrompt, /Knee-up cowboy shot\./i);
  assert.match(prompt.zImagePrompt, /camera is positioned clearly above the woman and tilted downward/i);
  assert.match(prompt.zImagePrompt, /facing the right edge[\s\S]*only the left side of her body[\s\S]*strict 90-degree lateral body view/i);
  assert.doesNotMatch(prompt.zImagePrompt, /high angle, looking down|left profile view|Waist-up portrait/i);
});

test('AI chest-up framing removes lower wardrobe details after the shared opening', () => {
  const [prompt] = generatePrompts(1, {
    ...createAllNoneLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '胸上特寫'),
    topId: optionId('topId', '棉質細肩背心'),
    pantsId: optionId('pantsId', '直筒牛仔褲'),
    legwearId: optionId('legwearId', '羅紋短襪'),
    shoesId: optionId('shoesId', '尖頭細跟高跟鞋'),
  });

  assert.match(prompt.midjourneyPrompt, /Chest-up portrait/);
  assert.match(prompt.midjourneyPrompt, /cotton camisole/i);
  assert.doesNotMatch(prompt.midjourneyPrompt, /straight-leg jeans|ribbed ankle socks|pointed-toe stiletto heels/i);
});

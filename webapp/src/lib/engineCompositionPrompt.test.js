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

test('all three primary prompts share the compact composition opening', () => {
  const [prompt] = generatePrompts(1, {
    ...createAllNoneLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '胸上特寫'),
    angleId: optionId('angleId', '平視高度鏡頭'),
    orbitId: optionId('orbitId', '左前 45 度'),
  });
  const expected = 'Chest-up portrait, eye-level view, front-left three-quarter view';

  [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt].forEach((text) => {
    assert.match(text, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.equal(text.indexOf(expected), text.lastIndexOf(expected));
  });

  assert.match(prompt.zImagePrompt, /^Create a photorealistic editorial portrait\.\n\nChest-up portrait, eye-level view, front-left three-quarter view\n\n/);
  assert.match(prompt.midjourneyPrompt, /^Photorealistic editorial portrait\. Chest-up portrait, eye-level view, front-left three-quarter view\. /);
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

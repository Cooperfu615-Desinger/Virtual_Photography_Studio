import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls } from './engine.js';

function optionId(controlKey, zh) {
  const control = getLockControls().find((entry) => entry.key === controlKey);
  const option = control.options.find((entry) => entry.zh === zh);
  assert.ok(option, `Expected option ${zh} in ${controlKey}`);
  return option.id;
}

test('Grok prompt prioritizes scene before special outfit details', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    specialOutfitId: optionId('specialOutfitId', '黑色波點頭巾透紗套裝'),
    locationId: optionId('locationId', '戶外：首爾聖水洞街區'),
  });

  const grok = prompt.grokPrompt;
  const locationIndex = grok.indexOf('Location:');
  const scenePriorityIndex = grok.indexOf('Scene Priority:');
  const specialOutfitIndex = grok.indexOf('Special Outfit:');

  assert.notEqual(locationIndex, -1);
  assert.notEqual(scenePriorityIndex, -1);
  assert.notEqual(specialOutfitIndex, -1);
  assert.ok(locationIndex < specialOutfitIndex);
  assert.ok(scenePriorityIndex < specialOutfitIndex);
  assert.match(grok, /Scene Priority: \(Seoul Seongsu-dong urban corner, industrial cafe frontage:1\.35\)/);
  assert.match(grok, /recognizable selected environment/);
});

test('Grok prompt keeps scene priority disabled for normal separates', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    locationId: optionId('locationId', '戶外：首爾聖水洞街區'),
    topId: optionId('topId', '棉質細肩背心'),
  });

  assert.doesNotMatch(prompt.grokPrompt, /Scene Priority:/);
});

test('Z-Image prompt prioritizes scene before special outfit details', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    specialOutfitId: optionId('specialOutfitId', '黑色波點頭巾透紗套裝'),
    locationId: optionId('locationId', '戶外：首爾聖水洞街區'),
  });

  const zImage = prompt.zImagePrompt;
  const settingIndex = zImage.indexOf('The setting is');
  const scenePriorityIndex = zImage.indexOf('Scene priority:');
  const wardrobeIndex = zImage.indexOf('She wears complete special outfit:');

  assert.notEqual(settingIndex, -1);
  assert.notEqual(scenePriorityIndex, -1);
  assert.notEqual(wardrobeIndex, -1);
  assert.ok(settingIndex < wardrobeIndex);
  assert.ok(scenePriorityIndex < wardrobeIndex);
  assert.match(zImage, /Scene priority: \(Seoul Seongsu-dong urban corner, industrial cafe frontage:1\.35\)/);
  assert.match(zImage, /recognizable selected environment/);
});

test('Z-Image prompt keeps scene priority disabled for normal separates', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    locationId: optionId('locationId', '戶外：首爾聖水洞街區'),
    topId: optionId('topId', '棉質細肩背心'),
  });

  assert.doesNotMatch(prompt.zImagePrompt, /Scene priority:/);
});

test('PAGE1 camera system lock appears in generated outputs and selection', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    cameraSystemId: optionId('cameraSystemId', 'Ricoh GR 隨身街拍機'),
  });

  assert.equal(prompt.selection.cameraSystemId, 'ricoh-gr-snapshot');
  assert.match(prompt.grokPrompt, /Camera System: Ricoh GR compact snapshot camera/);
  assert.match(prompt.zImagePrompt, /Ricoh GR compact snapshot camera/);
  assert.equal(prompt.structured['Camera & Film'][0].id, 'ricoh-gr-snapshot');
});

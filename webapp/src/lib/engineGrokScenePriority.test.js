import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls } from './engine.js';

function optionId(controlKey, zh) {
  const control = getLockControls().find((entry) => entry.key === controlKey);
  const option = control.options.find((entry) => entry.zh === zh);
  assert.ok(option, `Expected option ${zh} in ${controlKey}`);
  return option.id;
}

test('Gpt prompt prioritizes scene before special outfit details', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    specialOutfitId: optionId('specialOutfitId', '黑色波點頭巾透紗套裝'),
    locationId: optionId('locationId', '戶外：首爾聖水洞街區'),
  });

  const grok = prompt.grokPrompt;
  const sceneIndex = grok.indexOf('Scene:');
  const scenePriorityIndex = grok.indexOf('(Seoul Seongsu-dong urban corner, industrial cafe frontage:1.35)');
  const specialOutfitIndex = grok.indexOf('black sheer polka-dot matching fashion set');

  assert.notEqual(sceneIndex, -1);
  assert.notEqual(scenePriorityIndex, -1);
  assert.notEqual(specialOutfitIndex, -1);
  assert.ok(sceneIndex < specialOutfitIndex);
  assert.ok(scenePriorityIndex < specialOutfitIndex);
  assert.match(grok, /recognizable selected environment/);
});

test('Gpt prompt keeps scene priority disabled for normal separates', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    locationId: optionId('locationId', '戶外：首爾聖水洞街區'),
    topId: optionId('topId', '棉質細肩背心'),
  });

  assert.doesNotMatch(prompt.grokPrompt, /recognizable selected environment/);
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

test('PAGE1 imaging simulation includes merged camera profiles in generated outputs and selection', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    filmId: optionId('filmId', '相機｜Ricoh GR 快拍'),
  });

  assert.equal(prompt.selection.filmId, 'ricoh-gr-snapshot');
  assert.equal(prompt.selection.cameraSystemId, 'ricoh-gr-snapshot');
  assert.doesNotMatch(prompt.grokPrompt, /Camera System:/);
  assert.match(prompt.grokPrompt, /Camera Look:\n[\s\S]*Ricoh GR compact APS-C camera profile/);
  assert.match(prompt.zImagePrompt, /Ricoh GR compact APS-C camera profile/);
  assert.equal(prompt.structured['Lens & Imaging'].at(-1).id, 'ricoh-gr-snapshot');
});

test('legacy camera system lock migrates into imaging simulation', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    cameraSystemId: optionId('cameraSystemId', '相機｜Ricoh GR 快拍'),
  });

  assert.equal(prompt.selection.filmId, 'ricoh-gr-snapshot');
  assert.equal(prompt.selection.cameraSystemId, 'ricoh-gr-snapshot');
  assert.match(prompt.grokPrompt, /Camera Look:\n[\s\S]*Ricoh GR compact APS-C camera profile/);
});

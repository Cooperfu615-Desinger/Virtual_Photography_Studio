import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls } from './engine.js';

function optionId(controlKey, zh) {
  const control = getLockControls().find((entry) => entry.key === controlKey);
  const option = control.options.find((entry) => entry.zh === zh);
  assert.ok(option, `Expected option ${zh} in ${controlKey}`);
  return option.id;
}

test('Gpt prompt preserves the selected scene with special outfit details without public scene-control guidance', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    specialOutfitId: optionId('specialOutfitId', '黑色波點頭巾透紗套裝'),
    locationId: optionId('locationId', '戶外：首爾聖水洞街區'),
  });

  const grok = prompt.grokPrompt;
  const sceneIndex = grok.indexOf('Scene:');
  const locationIndex = grok.indexOf('Seoul Seongsu-dong urban corner');
  const specialOutfitIndex = grok.indexOf('black sheer polka-dot matching fashion set');

  assert.notEqual(sceneIndex, -1);
  assert.notEqual(locationIndex, -1);
  assert.notEqual(specialOutfitIndex, -1);
  assert.ok(specialOutfitIndex < sceneIndex);
  assert.ok(sceneIndex < locationIndex);
  assert.doesNotMatch(grok, /keep the selected environment readable/i);
  assert.doesNotMatch(grok, /moderate depth of field when needed/i);
  assert.doesNotMatch(grok, /background softly separated/i);
  assert.doesNotMatch(grok, /avoid collapsing into a plain backdrop/i);
  assert.doesNotMatch(grok, /\(Seoul Seongsu-dong urban corner, industrial cafe frontage:1\.35\)/);
  assert.doesNotMatch(grok, /avoid plain or empty background/);
});

test('Gpt prompt keeps scene priority disabled for normal separates', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    locationId: optionId('locationId', '戶外：首爾聖水洞街區'),
    topId: optionId('topId', '棉質細肩背心'),
  });

  assert.doesNotMatch(prompt.grokPrompt, /keep the selected environment readable/);
});

test('Z-Image places the selected special outfit before pose and scene without public scene-control guidance', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    specialOutfitId: optionId('specialOutfitId', '黑色波點頭巾透紗套裝'),
    locationId: optionId('locationId', '戶外：首爾聖水洞街區'),
    poseId: optionId('poseId', '站姿｜雙臂交疊'),
  });

  const zImage = prompt.zImagePrompt;
  const subjectIndex = zImage.indexOf('A 20s seductive stunning Japanese or Korean woman');
  const settingIndex = zImage.indexOf('The scene is ');
  const locationIndex = zImage.indexOf('Seoul Seongsu-dong urban corner');
  const wardrobeIndex = zImage.indexOf('She wears black sheer polka-dot matching fashion set');
  const poseIndex = zImage.search(/presents .*standing pose/);

  assert.notEqual(subjectIndex, -1);
  assert.notEqual(settingIndex, -1);
  assert.notEqual(locationIndex, -1);
  assert.notEqual(wardrobeIndex, -1);
  assert.notEqual(poseIndex, -1);
  assert.ok(subjectIndex < wardrobeIndex);
  assert.ok(wardrobeIndex < poseIndex);
  assert.ok(poseIndex < settingIndex);
  assert.ok(settingIndex < locationIndex);
  assert.doesNotMatch(zImage, /keep the selected environment readable/i);
  assert.doesNotMatch(zImage, /moderate depth of field when needed/i);
  assert.doesNotMatch(zImage, /background softly separated/i);
  assert.doesNotMatch(zImage, /avoid collapsing into a plain backdrop/i);
  assert.doesNotMatch(zImage, /Scene priority:/i);
  assert.doesNotMatch(zImage, /\(Seoul Seongsu-dong urban corner, industrial cafe frontage:1\.35\)/);
  assert.doesNotMatch(zImage, /avoid plain or empty background/);
});

test('Z-Image prompt keeps scene priority disabled for normal separates', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    locationId: optionId('locationId', '戶外：首爾聖水洞街區'),
    topId: optionId('topId', '棉質細肩背心'),
  });

  assert.doesNotMatch(prompt.zImagePrompt, /Scene priority:/);
});

test('PAGE1 imaging simulation uses rendering looks in generated outputs and selection', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    filmId: optionId('filmId', '高銳利快照黑位'),
  });

  assert.equal(prompt.selection.filmId, optionId('filmId', '高銳利快照黑位'));
  assert.equal(prompt.selection.cameraSystemId, '');
  assert.doesNotMatch(prompt.grokPrompt, /Camera System:/);
  assert.match(prompt.grokPrompt, /Camera Look:\n[\s\S]*high-acutance snapshot rendering/);
  assert.match(prompt.zImagePrompt, /high-acutance snapshot rendering/i);
  assert.equal(prompt.structured['Lens & Imaging'].at(-1).zh, '高銳利快照黑位');
});

test('legacy camera system lock migrates into rendering simulation', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    cameraSystemId: optionId('cameraSystemId', '相機｜Ricoh GR 快拍'),
  });

  assert.equal(prompt.selection.filmId, optionId('filmId', '高銳利快照黑位'));
  assert.equal(prompt.selection.cameraSystemId, '');
  assert.match(prompt.grokPrompt, /Camera Look:\n[\s\S]*high-acutance snapshot rendering/);
});

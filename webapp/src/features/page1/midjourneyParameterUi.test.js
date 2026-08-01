import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyMidjourneyParameterPreset,
  buildMidjourneyParameterSummary,
  createMidjourneyParameterDraft,
  getMidjourneyAspectRatioIdByIndex,
  getMidjourneyAspectRatioOptionIndex,
  normalizeMidjourneyParameterDraft,
  updateMidjourneyParameterDraft,
} from './midjourneyParameterUi.js';

test('Midjourney aspect ratio slider maps discrete options without changing their ids', () => {
  assert.equal(getMidjourneyAspectRatioOptionIndex('page1'), 0);
  assert.equal(getMidjourneyAspectRatioOptionIndex('21:9'), 5);
  assert.equal(getMidjourneyAspectRatioOptionIndex('1:2'), 9);
  assert.equal(getMidjourneyAspectRatioOptionIndex('unsupported'), 0);
  assert.equal(getMidjourneyAspectRatioIdByIndex(5), '21:9');
  assert.equal(getMidjourneyAspectRatioIdByIndex(9), '1:2');
  assert.equal(getMidjourneyAspectRatioIdByIndex(-10), 'page1');
  assert.equal(getMidjourneyAspectRatioIdByIndex(999), '5:4');
});

test('Midjourney parameter draft starts from the contract defaults', () => {
  assert.deepEqual(createMidjourneyParameterDraft(), {
    mjVersionId: 'v8-2',
    mjAspectRatio: 'page1',
    mjRawMode: 'standard',
    mjStylize: 100,
    mjChaos: 0,
    mjWeirdness: 0,
    mjResolution: 'sd',
  });
});

test('Midjourney parameter draft normalizes invalid enums and clamps integer ranges', () => {
  assert.deepEqual(normalizeMidjourneyParameterDraft({
    mjVersionId: 'unsupported',
    mjAspectRatio: 'unsupported',
    mjRawMode: 'raw',
    mjStylize: 2000,
    mjChaos: -5,
    mjWeirdness: '48.7',
    mjResolution: 'invalid',
  }), {
    mjVersionId: 'v8-2',
    mjAspectRatio: 'page1',
    mjRawMode: 'raw',
    mjStylize: 1000,
    mjChaos: 0,
    mjWeirdness: 49,
    mjResolution: 'sd',
  });
});

test('Midjourney numeric updates clamp values and enum updates reject unknown ids', () => {
  const initial = createMidjourneyParameterDraft();
  const clamped = updateMidjourneyParameterDraft(initial, 'mjChaos', 180);
  const unchanged = updateMidjourneyParameterDraft(clamped, 'mjVersionId', 'v9');

  assert.equal(clamped.mjChaos, 100);
  assert.equal(unchanged.mjVersionId, 'v8-2');
});

test('Midjourney presets only replace their declared creative controls', () => {
  const initial = normalizeMidjourneyParameterDraft({
    ...createMidjourneyParameterDraft(),
    mjVersionId: 'v8-1',
    mjResolution: 'hd',
  });
  const precise = applyMidjourneyParameterPreset(initial, 'preciseRealistic');

  assert.deepEqual(precise, {
    mjVersionId: 'v8-1',
    mjAspectRatio: 'page1',
    mjRawMode: 'raw',
    mjStylize: 25,
    mjChaos: 0,
    mjWeirdness: 0,
    mjResolution: 'hd',
  });
  assert.deepEqual(applyMidjourneyParameterPreset(initial, 'missing'), initial);
});

test('Midjourney summary stays compact and exposes every visible setting', () => {
  assert.deepEqual(buildMidjourneyParameterSummary({
    mjVersionId: 'v8-1',
    mjRawMode: 'raw',
    mjStylize: 25,
    mjChaos: 10,
    mjWeirdness: 40,
    mjResolution: 'hd',
  }), {
    summary: 'V8.1 / AR 跟隨 PAGE1 / Raw / S25 / C10 / W40 / HD',
    meta: '僅影響 AI Prompt；不參與隨機',
  });
});

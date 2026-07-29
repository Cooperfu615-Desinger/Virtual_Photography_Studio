import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyMidjourneyParameterPreset,
  buildMidjourneyParameterSummary,
  createMidjourneyParameterDraft,
  normalizeMidjourneyParameterDraft,
  updateMidjourneyParameterDraft,
} from './midjourneyParameterUi.js';

test('Midjourney parameter draft starts from the contract defaults', () => {
  assert.deepEqual(createMidjourneyParameterDraft(), {
    mjVersionId: 'v8-2',
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
    mjRawMode: 'raw',
    mjStylize: 2000,
    mjChaos: -5,
    mjWeirdness: '48.7',
    mjResolution: 'invalid',
  }), {
    mjVersionId: 'v8-2',
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
    summary: 'V8.1 / Raw / S25 / C10 / W40 / HD',
    meta: '僅影響 AI Prompt；不參與隨機',
  });
});

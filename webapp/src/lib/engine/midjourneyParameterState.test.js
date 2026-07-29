import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createEmptyLocks,
  createSeededRandom,
  generatePrompts,
  getLockControls,
  normalizeLocks,
} from '../engine.js';
import {
  deserializeFavoritePrompt,
  serializeFavoritePrompt,
} from '../../features/saved-cards/cardCodec.js';
import { buildAllNoneLocks } from '../../features/page1/page1Selectors.js';
import {
  attachMidjourneySettingsToPrompt,
  createPromptGenerationLocks,
} from '../../features/page1/midjourneyParameterState.js';
import { randomizeLockKeys } from '../page1SectionRandom.js';
import {
  MIDJOURNEY_PARAMETER_SELECTION_KEYS,
  getDefaultMidjourneyParameterSettings,
} from './midjourneyParameterContract.js';

const CUSTOM_SETTINGS = Object.freeze({
  mjVersionId: 'v8-1',
  mjRawMode: 'raw',
  mjStylize: 333,
  mjChaos: 18,
  mjWeirdness: 47,
  mjResolution: 'hd',
});

function pickSettings(source) {
  return Object.fromEntries(
    MIDJOURNEY_PARAMETER_SELECTION_KEYS.map((key) => [key, source[key]])
  );
}

test('phase 3 registers normalized MJ settings in empty and legacy PAGE1 locks', () => {
  const defaults = getDefaultMidjourneyParameterSettings();
  assert.deepEqual(pickSettings(createEmptyLocks()), defaults);
  assert.deepEqual(pickSettings(normalizeLocks({ subjectCount: '1' })), defaults);

  assert.deepEqual(pickSettings(normalizeLocks({
    subjectCount: '1',
    mjVersionId: 'unsupported',
    mjRawMode: 'raw',
    mjStylize: 5000,
    mjChaos: -8,
    mjWeirdness: '71.6',
    mjResolution: 'invalid',
  })), {
    mjVersionId: 'v8-2',
    mjRawMode: 'raw',
    mjStylize: 1000,
    mjChaos: 0,
    mjWeirdness: 72,
    mjResolution: 'sd',
  });

  assert.deepEqual(pickSettings(normalizeLocks({
    subjectCount: '1',
    mjStylize: null,
    mjChaos: 'not-a-number',
    mjWeirdness: '',
  })), defaults);
});

test('phase 3 copies MJ settings into resolved selection without changing prompt text', () => {
  const baselineLocks = createEmptyLocks();
  const customLocks = { ...baselineLocks, ...CUSTOM_SETTINGS };
  const baseline = generatePrompts(1, baselineLocks, [], {
    random: createSeededRandom('mj-parameter-state-phase3'),
  })[0];
  const customized = generatePrompts(1, customLocks, [], {
    random: createSeededRandom('mj-parameter-state-phase3'),
  })[0];

  [
    'grokPrompt',
    'zImagePrompt',
    'midjourneyPrompt',
  ].forEach((field) => assert.equal(customized[field], baseline[field], field));
  assert.deepEqual(customized.extraPrompts, baseline.extraPrompts);
  assert.deepEqual(pickSettings(customized.selection), CUSTOM_SETTINGS);
});

test('phase 3 isolates F-only changes from live preview regeneration', () => {
  const locks = {
    ...createEmptyLocks(),
    ...CUSTOM_SETTINGS,
  };
  const generationLocks = createPromptGenerationLocks(locks);

  MIDJOURNEY_PARAMETER_SELECTION_KEYS.forEach((key) => {
    assert.equal(Object.hasOwn(generationLocks, key), false, key);
  });

  const preview = {
    id: 'stable-preview',
    midjourneyPrompt: 'unchanged AI text',
    selection: { subjectCount: '1' },
  };
  const attached = attachMidjourneySettingsToPrompt(preview, locks);
  assert.notEqual(attached, preview);
  assert.equal(attached.id, preview.id);
  assert.equal(attached.midjourneyPrompt, preview.midjourneyPrompt);
  assert.deepEqual(pickSettings(attached.selection), CUSTOM_SETTINGS);
});

test('phase 3 preserves MJ settings through Saved Cards and defaults old cards', () => {
  const prompt = generatePrompts(1, {
    ...createEmptyLocks(),
    ...CUSTOM_SETTINGS,
  }, [], {
    random: createSeededRandom('mj-saved-card-phase3'),
  })[0];
  prompt.source = 'page1';

  const serialized = serializeFavoritePrompt(prompt);
  const restored = deserializeFavoritePrompt(serialized);
  assert.deepEqual(pickSettings(restored.selection), CUSTOM_SETTINGS);

  const legacyRecord = {
    ...serialized,
    l: Object.fromEntries(
      Object.entries(serialized.l).filter(([key]) => !MIDJOURNEY_PARAMETER_SELECTION_KEYS.includes(key))
    ),
  };
  const restoredLegacy = deserializeFavoritePrompt(legacyRecord);
  assert.deepEqual(
    pickSettings(restoredLegacy.selection),
    getDefaultMidjourneyParameterSettings()
  );
});

test('phase 3 excludes MJ settings from global random and clear operations', () => {
  const controls = getLockControls();
  const locks = { ...createEmptyLocks(), ...CUSTOM_SETTINGS };
  const randomized = randomizeLockKeys(
    locks,
    controls.map((control) => control.key),
    createEmptyLocks(),
    controls,
  );
  const cleared = buildAllNoneLocks(controls, locks);

  assert.deepEqual(pickSettings(randomized), CUSTOM_SETTINGS);
  assert.deepEqual(pickSettings(cleared), CUSTOM_SETTINGS);
});

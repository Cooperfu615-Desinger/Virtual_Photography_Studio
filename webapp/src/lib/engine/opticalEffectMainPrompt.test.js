import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createEmptyLocks,
  createSeededRandom,
  generatePrompts,
  getLockControls,
  getSceneDependentOptions,
  normalizeLocks,
} from '../engine.js';
import { buildPage1ControlGroups } from '../../features/page1/page1Selectors.js';
import {
  OPTICAL_EFFECT_MAIN_OPTION_POLICY,
  buildPage1OpticalEffectControl,
  getRandomOpticalEffectOptions,
} from './opticalEffectMainPrompt.js';

const controls = getLockControls();
const opticalControl = controls.find((control) => control.key === 'opticalEffectId');

test('refraction effects are restore-only in the PAGE1 optical selector', () => {
  const uiControl = buildPage1ControlGroups({
    lockControls: controls,
    locks: createEmptyLocks(),
    sceneDependentOptions: getSceneDependentOptions([], createEmptyLocks()),
  }).coreLockControls.find((control) => control.key === 'opticalEffectId');

  assert.deepEqual(
    uiControl.options.map((option) => option.zh),
    OPTICAL_EFFECT_MAIN_OPTION_POLICY.visible.map((option) => option.zh),
  );

  for (const legacy of OPTICAL_EFFECT_MAIN_OPTION_POLICY.legacyHidden) {
    const restoredControl = buildPage1OpticalEffectControl(opticalControl, legacy.id);
    const restoredOption = restoredControl.options.find((option) => option.id === legacy.id);
    assert.ok(restoredOption, `${legacy.zh} remains resolvable when restored`);
    assert.equal(restoredOption.disabled, true, `${legacy.zh} is not selectable again`);
  }
});

test('unlocked random optical effects exclude refraction effects', () => {
  const randomOptions = getRandomOpticalEffectOptions(opticalControl.options);
  assert.deepEqual(
    randomOptions.map((option) => option.zh),
    OPTICAL_EFFECT_MAIN_OPTION_POLICY.visible
      .filter((option) => option.randomCandidate)
      .map((option) => option.zh),
  );

  const hiddenIds = new Set(OPTICAL_EFFECT_MAIN_OPTION_POLICY.legacyHidden.map((option) => option.id));
  for (let index = 0; index < 64; index += 1) {
    const [prompt] = generatePrompts(1, {
      ...createEmptyLocks(),
      opticalEffectId: '',
    }, [], {
      random: createSeededRandom(`optical-effect-main-${index}`),
    });
    assert.equal(hiddenIds.has(prompt.selection.opticalEffectId), false, prompt.selection.opticalEffectId);
  }
});

test('legacy refraction locks remain normalized, selectable in output, and are not rewritten', () => {
  for (const legacy of OPTICAL_EFFECT_MAIN_OPTION_POLICY.legacyHidden) {
    const normalized = normalizeLocks({
      ...createEmptyLocks(),
      opticalEffectId: legacy.id,
    }, controls);
    assert.equal(normalized.opticalEffectId, legacy.id);

    const [prompt] = generatePrompts(1, normalized, [], {
      random: createSeededRandom(`optical-effect-legacy-${legacy.id}`),
    });
    assert.equal(prompt.selection.opticalEffectId, legacy.id);
    assert.match(prompt.grokPrompt, new RegExp(legacy.zh === '玻璃前景折射' ? 'foreground glass refraction' : 'prism refraction effect', 'i'));
  }
});

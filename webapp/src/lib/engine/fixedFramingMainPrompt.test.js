import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createEmptyLocks,
  createSeededRandom,
  generatePrompts,
  getLockControls,
  getSceneDependentOptions,
  isCloseupModeFramingId,
  normalizeLocks,
} from '../engine.js';
import { buildPage1ControlGroups } from '../../features/page1/page1Selectors.js';
import {
  FIXED_FRAMING_MAIN_OPTION_POLICY,
  HALF_FACE_COMPOSITION_TARGET,
} from './fixedFramingDerivedPromptContract.js';
import { HALF_FACE_COMPOSITION_REGRESSION_FIXTURES } from './fixedFramingDerivedPromptFixtures.js';

const controls = getLockControls();
const controlsByKey = new Map(controls.map((control) => [control.key, control]));

function optionId(key, zh) {
  const option = controlsByKey.get(key)?.options.find((entry) => entry.zh === zh);
  assert.ok(option, `Missing ${key} option ${zh}`);
  return option.id;
}

function getPage1FramingControl(locks) {
  const { coreLockControls } = buildPage1ControlGroups({
    lockControls: controls,
    locks,
    sceneDependentOptions: getSceneDependentOptions([], locks),
  });
  const framingControl = coreLockControls.find((control) => control.key === 'framingId');
  assert.ok(framingControl, 'Missing PAGE1 framing control');
  return framingControl;
}

function getCompositionBlock(promptText) {
  return String(promptText || '').split(/\n\n+/)[1] || '';
}

test('phase-5 PAGE1 framing selector exposes only the approved main options', () => {
  const locks = createEmptyLocks();
  const framingControl = getPage1FramingControl(locks);

  assert.deepEqual(
    framingControl.options.map((option) => option.id),
    FIXED_FRAMING_MAIN_OPTION_POLICY.visible.map((option) => option.id),
  );
});

test('phase-5 legacy framing ids remain restorable but cannot become a new UI selection', () => {
  for (const legacy of FIXED_FRAMING_MAIN_OPTION_POLICY.legacyHidden) {
    const locks = normalizeLocks({
      ...createEmptyLocks(),
      framingId: legacy.id,
    }, controls);
    const framingControl = getPage1FramingControl(locks);
    const restoredOption = framingControl.options.find((option) => option.id === legacy.id);

    assert.equal(locks.framingId, legacy.id, legacy.zh);
    assert.ok(restoredOption, `${legacy.zh}: restored selection should remain readable`);
    assert.equal(restoredOption.disabled, true, `${legacy.zh}: restored selection should not be selectable again`);
    assert.deepEqual(
      framingControl.options.filter((option) => option.id !== legacy.id).map((option) => option.id),
      FIXED_FRAMING_MAIN_OPTION_POLICY.visible.map((option) => option.id),
      `${legacy.zh}: only the approved main options should remain selectable`,
    );

    const [prompt] = generatePrompts(1, locks, [], {
      random: createSeededRandom(`phase-5-legacy-restore-${legacy.id}`),
    });
    assert.equal(prompt.selection.framingId, legacy.id, `${legacy.zh}: generated selection`);
  }
});

test('phase-5 unlocked framing resolution excludes every legacy-only option', () => {
  const allowedIds = new Set(
    FIXED_FRAMING_MAIN_OPTION_POLICY.visible
      .filter((option) => option.randomCandidate)
      .map((option) => option.id),
  );
  const seenIds = new Set();
  const locks = {
    ...createEmptyLocks(),
    aspectRatio: '1:1',
    framingId: '',
  };

  for (let index = 0; index < 48; index += 1) {
    const [prompt] = generatePrompts(1, locks, [], {
      random: createSeededRandom(`phase-5-main-framing-random-${index}`),
    });
    assert.equal(allowedIds.has(prompt.selection.framingId), true, prompt.selection.framingId);
    seenIds.add(prompt.selection.framingId);
  }

  assert.deepEqual(seenIds, allowedIds);
});

test('phase-5 half-face framing resolves one edge placement shared exactly by all primary prompts', () => {
  const framingId = optionId('framingId', HALF_FACE_COMPOSITION_TARGET.framingZh);
  const variantsById = new Map(
    HALF_FACE_COMPOSITION_TARGET.placementVariants.map((variant) => [variant.id, variant]),
  );

  for (const fixture of HALF_FACE_COMPOSITION_REGRESSION_FIXTURES) {
    const [prompt] = generatePrompts(1, {
      ...createEmptyLocks(),
      framingId,
    }, [], {
      random: createSeededRandom(fixture.seed),
    });
    const expectedVariant = variantsById.get(fixture.resolvedPlacementId);
    assert.ok(expectedVariant, fixture.id);
    const compositionBlock = getCompositionBlock(prompt.grokPrompt);

    assert.equal(
      compositionBlock.startsWith(expectedVariant.opening),
      true,
      `${fixture.id}: ${compositionBlock}`,
    );
    assert.ok(prompt.zImagePrompt.includes(compositionBlock), `${fixture.id}: Grok/Z composition`);
    assert.ok(prompt.midjourneyPrompt.includes(compositionBlock), `${fixture.id}: AI composition`);
    assert.equal(compositionBlock.includes('left or right'), false, fixture.id);
    assert.equal(prompt.selection.framingId, framingId, `${fixture.id}: raw framing selection`);
  }
});

test('phase-5 half-face framing keeps selected upper clothing and does not trigger face-only UI suppression', () => {
  const framingId = optionId('framingId', HALF_FACE_COMPOSITION_TARGET.framingZh);
  const topId = optionId('topId', '領帶襯衫');
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId,
    topId,
  }, [], {
    random: createSeededRandom('phase-5-half-face-upper-clothing'),
  });

  assert.equal(isCloseupModeFramingId(framingId, controls), false);
  for (const field of ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt']) {
    assert.match(prompt[field], /collared shirt with a short (?:soft )?necktie/i, field);
  }
});

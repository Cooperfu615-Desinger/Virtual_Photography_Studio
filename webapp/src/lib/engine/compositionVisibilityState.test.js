import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildRestoreLocks } from '../../features/saved-cards/cardCodec.js';
import {
  createEmptyLocks,
  createSeededRandom,
  generatePrompts,
  getLockControls,
  normalizeLocks,
  sanitizeLocksForCloseupMode,
} from '../engine.js';
import { COMPOSITION_VISIBILITY_REGRESSION_FIXTURES } from './compositionVisibilityFixtures.js';

const controls = getLockControls();
const controlsByKey = new Map(controls.map((control) => [control.key, control]));

function resolveFixture(fixtureId) {
  const fixture = COMPOSITION_VISIBILITY_REGRESSION_FIXTURES.find((entry) => entry.id === fixtureId);
  assert.ok(fixture, `Missing composition visibility fixture ${fixtureId}`);
  const locks = { ...createEmptyLocks() };

  for (const [key, selector] of Object.entries(fixture.locks)) {
    const control = controlsByKey.get(key);
    const option = typeof selector === 'object' && selector?.byZh
      ? control?.options.find((entry) => entry.zh === selector.byZh)
      : control?.options.find((entry) => entry.id === selector);
    assert.ok(option, `${fixtureId}: cannot resolve ${key}`);
    locks[key] = option.id;
  }

  return { fixture, locks };
}

function fullBodyPrompt(prompt) {
  return prompt.extraPrompts.find((entry) => entry.id === 'full-body-character')?.text || '';
}

test('face-detail state keeps raw wardrobe selections through reload, Saved Cards, and generation', () => {
  const { fixture, locks } = resolveFixture('face-detail-full-body-wardrobe-restoration');
  const normalized = sanitizeLocksForCloseupMode(locks, controls);

  for (const key of fixture.expectedProjection.preserveRawLockKeys) {
    assert.equal(normalized[key], locks[key], `${key} should survive close-up state normalization`);
  }

  const [prompt] = generatePrompts(1, normalized, [], {
    random: createSeededRandom(fixture.seed),
  });
  for (const key of fixture.expectedProjection.preserveRawLockKeys) {
    assert.equal(prompt.selection[key], locks[key], `${key} should be stored in the generated selection`);
  }

  const savedCardRestore = normalizeLocks(buildRestoreLocks(prompt.selection, controls), controls);
  for (const key of fixture.expectedProjection.preserveRawLockKeys) {
    assert.equal(savedCardRestore[key], locks[key], `${key} should survive Saved Cards restore`);
  }

  const mainPrompt = [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt].join('\n');
  for (const fragment of fixture.expectedProjection.mainPrompt.excludes) {
    assert.equal(mainPrompt.toLowerCase().includes(fragment.toLowerCase()), false, `main prompt should hide ${fragment}`);
  }

  const referencePrompt = fullBodyPrompt(prompt).toLowerCase();
  for (const fragment of fixture.expectedProjection.fullBodyCharacterPrompt.includes) {
    assert.equal(referencePrompt.includes(fragment.toLowerCase()), true, `full-body prompt should restore ${fragment}`);
  }
});

test('face-detail Character Card selection and complete outfit survive generation', () => {
  const { fixture, locks } = resolveFixture('face-detail-character-card-preservation');
  const [prompt] = generatePrompts(1, locks, [], {
    random: createSeededRandom(fixture.seed),
  });

  assert.equal(prompt.selection.characterProfileId, locks.characterProfileId);
  const referencePrompt = fullBodyPrompt(prompt).toLowerCase();
  for (const fragment of fixture.expectedProjection.fullBodyCharacterPrompt.includes) {
    assert.equal(referencePrompt.includes(fragment.toLowerCase()), true, `full-body prompt should restore ${fragment}`);
  }
});

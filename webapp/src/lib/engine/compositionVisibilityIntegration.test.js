import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createEmptyLocks,
  createSeededRandom,
  generatePrompts,
  getLockControls,
} from '../engine.js';
import { COMPOSITION_VISIBILITY_REGRESSION_FIXTURES } from './compositionVisibilityFixtures.js';

const controlsByKey = new Map(getLockControls().map((control) => [control.key, control]));
const MAIN_OUTPUT_FIELDS = ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt'];
const RETIRED_VISIBILITY_SIGNALS = [
  'Wardrobe Visibility:',
  'Scene Context:',
  'Scene Priority:',
];

function resolveFixtureLocks(fixture) {
  const locks = { ...createEmptyLocks() };

  for (const [key, selector] of Object.entries(fixture.locks)) {
    const control = controlsByKey.get(key);
    const option = typeof selector === 'object' && selector?.byZh
      ? control?.options.find((entry) => entry.zh === selector.byZh)
      : control?.options.find((entry) => entry.id === selector);
    assert.ok(option, `${fixture.id}: cannot resolve ${key}`);
    locks[key] = option.id;
  }

  return locks;
}

function assertIncludes(text, fragment, message) {
  assert.equal(text.toLowerCase().includes(fragment.toLowerCase()), true, message);
}

function assertExcludes(text, fragment, message) {
  assert.equal(text.toLowerCase().includes(fragment.toLowerCase()), false, message);
}

test('all composition fixtures preserve source selections without exposing retired visibility branches', () => {
  for (const fixture of COMPOSITION_VISIBILITY_REGRESSION_FIXTURES) {
    const locks = resolveFixtureLocks(fixture);
    const [prompt] = generatePrompts(1, locks, [], {
      random: createSeededRandom(fixture.seed),
    });
    for (const key of fixture.expectedProjection.preserveRawLockKeys) {
      assert.equal(prompt.selection[key], locks[key], `${fixture.id}: ${key} should survive generation`);
    }

    for (const field of MAIN_OUTPUT_FIELDS) {
      const text = prompt[field] || '';
      assert.notEqual(text, '', `${fixture.id}: ${field} should remain available`);
      for (const signal of RETIRED_VISIBILITY_SIGNALS) {
        assertExcludes(text, signal, `${fixture.id}: ${field} should not expose retired visibility signal ${signal}`);
      }
    }

    const fullBodyText = prompt.extraPrompts.find((entry) => entry.id === 'full-body-character')?.text || '';
    for (const fragment of fixture.expectedProjection.fullBodyCharacterPrompt?.includes || []) {
      assertIncludes(fullBodyText, fragment, `${fixture.id}: full-body output should restore ${fragment}`);
    }
  }
});

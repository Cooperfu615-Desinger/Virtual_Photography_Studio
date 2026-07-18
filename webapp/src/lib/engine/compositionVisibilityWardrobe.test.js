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
const PHASE_THREE_FIXTURE_IDS = [
  'head-shoulders-pose-scene-pressure',
  'chest-up-layered-separates',
  'medium-dress-visible-identity',
  'cowboy-conditional-thigh-highs',
  'chest-up-outfit-preset',
  'chest-up-special-outfit-mixed-fragment',
  'medium-duo-role-visibility',
];
const PHASE_THREE_WARDROBE_EXPECTATIONS = Object.freeze({
  'head-shoulders-pose-scene-pressure': {
    includes: ['off-white off-shoulder gothic dress'],
    excludes: ['mini dress', 'short hem'],
  },
  'chest-up-layered-separates': {
    includes: ['cotton camisole', 'denim jacket'],
    excludes: ['straight-leg jeans', 'ribbed ankle socks', 'pointed-toe stiletto heels'],
  },
  'medium-dress-visible-identity': {
    includes: ['off-white off-shoulder gothic dress'],
    excludes: ['short hem'],
  },
  'cowboy-conditional-thigh-highs': {
    includes: ['cotton camisole', 'pleated mini skirt', 'lace-top thigh-high stockings'],
    excludes: ['stiletto pumps'],
  },
  'chest-up-outfit-preset': {
    includes: ['cropped sheer fitted tank top', 'strapless lace bra layer'],
    excludes: ['exposed navel and abdomen', 'low-rise glossy micro shorts', 'knee-high leather boots'],
  },
  'chest-up-special-outfit-mixed-fragment': {
    includes: ['white long-sleeve pointed-collar button-up shirt', 'slim black scarf tie or lanyard'],
    excludes: ['ankle-length', 'black soft shoulder tote', 'black lace-up leather shoes'],
  },
  'medium-duo-role-visibility': {
    includes: ['cotton camisole', 'straight-leg jeans', 'denim jacket', 'shirt', 'tailored trousers', 'blazer'],
    excludes: ['ribbed ankle socks', 'low-top sneakers', 'knee-high socks', 'loafers'],
  },
});

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

function generateFixture(fixtureId) {
  const { fixture, locks } = resolveFixture(fixtureId);
  const [prompt] = generatePrompts(1, locks, [], {
    random: createSeededRandom(fixture.seed),
  });
  return { fixture, locks, prompt };
}

function assertContains(text, fragment, message) {
  assert.equal(text.toLowerCase().includes(fragment.toLowerCase()), true, message);
}

function assertExcludes(text, fragment, message) {
  assert.equal(text.toLowerCase().includes(fragment.toLowerCase()), false, message);
}

for (const fixtureId of PHASE_THREE_FIXTURE_IDS) {
  test(`${fixtureId} projects the same wardrobe visibility boundary into all main outputs`, () => {
    const { fixture, locks, prompt } = generateFixture(fixtureId);
    const expected = PHASE_THREE_WARDROBE_EXPECTATIONS[fixtureId];

    for (const key of fixture.expectedProjection.preserveRawLockKeys) {
      assert.equal(prompt.selection[key], locks[key], `${fixtureId}: ${key} should survive generation`);
    }

    for (const field of MAIN_OUTPUT_FIELDS) {
      const text = prompt[field] || '';
      for (const fragment of expected.includes || []) {
        assertContains(text, fragment, `${fixtureId}: ${field} should include ${fragment}`);
      }
      for (const fragment of expected.excludes || []) {
        assertExcludes(text, fragment, `${fixtureId}: ${field} should exclude ${fragment}`);
      }
    }
  });
}

for (const fixtureId of PHASE_THREE_FIXTURE_IDS.filter((id) => id !== 'medium-duo-role-visibility')) {
  test(`${fixtureId} keeps the complete wardrobe in the full-body character output`, () => {
    const { fixture, prompt } = generateFixture(fixtureId);
    const text = prompt.extraPrompts.find((entry) => entry.id === 'full-body-character')?.text || '';

    for (const fragment of fixture.expectedProjection.fullBodyCharacterPrompt?.includes || []) {
      assertContains(text, fragment, `${fixtureId}: full-body character output should include ${fragment}`);
    }
  });
}

test('face-detail Character Card keeps identity but projects lower-body wardrobe out of every main output', () => {
  const { fixture, prompt } = generateFixture('face-detail-character-card-preservation');

  for (const field of MAIN_OUTPUT_FIELDS) {
    const text = prompt[field] || '';
    for (const fragment of fixture.expectedProjection.mainPrompt.excludes) {
      assertExcludes(text, fragment, `face-detail Character Card: ${field} should exclude ${fragment}`);
    }
  }
});

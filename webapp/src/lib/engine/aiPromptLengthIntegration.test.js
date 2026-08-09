import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createEmptyLocks,
  createSeededRandom,
  generatePrompts,
  getLockControls,
} from '../engine.js';
import {
  AI_PROMPT_LENGTH_CONTRACT,
  countAiPromptWords,
} from './aiPromptLengthContract.js';
import { AI_PROMPT_LENGTH_FIXTURES } from './aiPromptLengthFixtures.js';
import { validatePromptOutputContract } from './promptOutputContracts.js';

const controls = getLockControls();
const PRIMARY_OUTPUT_FIELDS = Object.freeze([
  'grokPrompt',
  'zImagePrompt',
  'midjourneyPrompt',
]);

function createAllNoneLocks() {
  const locks = { ...createEmptyLocks() };
  for (const control of controls) {
    const noneOption = control.options?.find((entry) => entry.zh === '全無' || entry.zh === '無額外表情');
    if (noneOption) locks[control.key] = noneOption.id;
  }
  return locks;
}

function resolveFixtureLocks(fixture) {
  const locks = createAllNoneLocks();
  const explicitSelections = {};
  for (const [key, selector] of Object.entries(fixture.locks)) {
    if (typeof selector === 'string' || Array.isArray(selector)) {
      locks[key] = selector;
      explicitSelections[key] = selector;
      continue;
    }
    const control = controls.find((entry) => entry.key === key);
    const option = control?.options?.find((entry) => entry.zh === selector.byZh);
    assert.ok(option, `${fixture.id}.${key} cannot resolve ${selector.byZh}`);
    locks[key] = option.id;
    explicitSelections[key] = option.id;
  }
  return { locks, explicitSelections };
}

function generateFixture(fixture) {
  const { locks, explicitSelections } = resolveFixtureLocks(fixture);
  const prompt = generatePrompts(1, locks, [], {
    random: createSeededRandom(fixture.seed),
  })[0];
  return { prompt, explicitSelections };
}

test('phase-6 integration gate preserves mappings, selections, contracts, anchors, and AI budgets', () => {
  for (const fixture of AI_PROMPT_LENGTH_FIXTURES) {
    const { prompt, explicitSelections } = generateFixture(fixture);
    const mode = fixture.mode || 'single';

    for (const field of PRIMARY_OUTPUT_FIELDS) {
      assert.ok(prompt[field]?.trim(), `${fixture.id}/${field}: output`);
      assert.deepEqual(
        validatePromptOutputContract(field, prompt[field], { mode }),
        [],
        `${fixture.id}/${field}: contract`
      );
    }
    for (const [key, expectedValue] of Object.entries(explicitSelections)) {
      if (key === 'orbitId') {
        assert.ok(prompt.selection[key], `${fixture.id}/${key}: compatible resolved selection`);
        continue;
      }
      assert.deepEqual(prompt.selection[key], expectedValue, `${fixture.id}/${key}: selection`);
    }
    for (const fragment of fixture.requiredFragments || []) {
      assert.match(prompt.midjourneyPrompt, new RegExp(fragment, 'i'), `${fixture.id}: ${fragment}`);
    }
    if (fixture.policy) {
      const budget = AI_PROMPT_LENGTH_CONTRACT.budgets[fixture.policy];
      assert.ok(
        countAiPromptWords(prompt.midjourneyPrompt) <= budget.softMaxWords,
        `${fixture.id}: AI soft max`
      );
    }
    if (fixture.requiresCanonicalPose) {
      const canonicalPose = prompt.grokPrompt
        .match(/Pose and Composition:\n([\s\S]*?)(?:\n\n|$)/)?.[1]
        ?.trim();
      assert.ok(canonicalPose, `${fixture.id}: canonical pose`);
      assert.ok(prompt.zImagePrompt.includes(canonicalPose), `${fixture.id}: Grok/Z-Image pose`);
      assert.ok(prompt.midjourneyPrompt.includes(canonicalPose), `${fixture.id}: AI pose`);
    }
  }
});

test('phase-6 gate records the approved single/duo and immutable-section boundaries', () => {
  assert.deepEqual(AI_PROMPT_LENGTH_CONTRACT.applicability, {
    supportedModes: ['single', 'duo'],
    excludedModes: [],
  });
  assert.deepEqual(AI_PROMPT_LENGTH_CONTRACT.immutableSections, [
    'imageType',
    'composition',
    'projectedCanonicalPose',
  ]);
  assert.equal(AI_PROMPT_LENGTH_CONTRACT.rollout.phase6.behaviorNeutral, true);
  assert.equal(AI_PROMPT_LENGTH_FIXTURES.length, 10);
});

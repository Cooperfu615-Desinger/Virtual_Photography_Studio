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
  AI_PROMPT_LENGTH_CONTRACT_VERSION,
  countAiPromptWords,
} from './aiPromptLengthContract.js';
import { AI_PROMPT_LENGTH_FIXTURES } from './aiPromptLengthFixtures.js';
import { validatePromptOutputContract } from './promptOutputContracts.js';

const controls = getLockControls();

function createAllNoneLocks() {
  const locks = { ...createEmptyLocks() };
  for (const control of controls) {
    const noneOption = control.options?.find((entry) => entry.zh === '全無');
    if (noneOption) locks[control.key] = noneOption.id;
  }
  return locks;
}

function resolveLock(key, selector, fixtureId) {
  if (typeof selector === 'string' || Array.isArray(selector)) return selector;
  const control = controls.find((entry) => entry.key === key);
  assert.ok(control, `${fixtureId} references missing control ${key}`);
  const option = control.options?.find((entry) => entry.zh === selector?.byZh);
  assert.ok(option, `${fixtureId}.${key} cannot resolve ${selector?.byZh}`);
  return option.id;
}

function generateFixture(fixture) {
  const locks = createAllNoneLocks();
  for (const [key, selector] of Object.entries(fixture.locks)) {
    locks[key] = resolveLock(key, selector, fixture.id);
  }
  return generatePrompts(1, locks, [], {
    random: createSeededRandom(fixture.seed),
  })[0];
}

test('AI Prompt length contract is frozen serializable policy data', () => {
  assert.equal(AI_PROMPT_LENGTH_CONTRACT_VERSION, '1.1.0');
  assert.ok(Object.isFrozen(AI_PROMPT_LENGTH_CONTRACT));
  assert.ok(Object.isFrozen(AI_PROMPT_LENGTH_CONTRACT.budgets.characterCard));
  assert.deepEqual(
    JSON.parse(JSON.stringify(AI_PROMPT_LENGTH_CONTRACT)),
    AI_PROMPT_LENGTH_CONTRACT
  );
  assert.deepEqual(AI_PROMPT_LENGTH_CONTRACT.applicability.supportedModes, ['single', 'duo']);
  assert.deepEqual(AI_PROMPT_LENGTH_CONTRACT.applicability.excludedModes, []);
  assert.deepEqual(AI_PROMPT_LENGTH_CONTRACT.immutableSections, [
    'imageType',
    'composition',
    'projectedCanonicalPose',
  ]);
  assert.equal(AI_PROMPT_LENGTH_CONTRACT.rollout.phase1.behaviorNeutral, true);
  assert.equal(AI_PROMPT_LENGTH_CONTRACT.rollout.phase3.behaviorNeutral, false);
});

test('AI Prompt length fixtures cover every approved pressure boundary', () => {
  const fixtureIds = AI_PROMPT_LENGTH_FIXTURES.map((fixture) => fixture.id);
  assert.deepEqual(fixtureIds, [
    'normal-separates',
    'complete-look-latex',
    'complete-look-special',
    'complete-look-dress',
    'character-card-jiwoo',
    'character-card-sui',
    'character-card-half-face-pressure',
    'canonical-pose-pressure',
    'half-face-boundary',
    'duo-direct-boundary',
  ]);
  assert.equal(AI_PROMPT_LENGTH_FIXTURES.filter((fixture) => fixture.policy === 'normal').length, 3);
  assert.equal(AI_PROMPT_LENGTH_FIXTURES.filter((fixture) => fixture.policy === 'completeLook').length, 3);
  assert.equal(AI_PROMPT_LENGTH_FIXTURES.filter((fixture) => fixture.policy === 'characterCard').length, 3);
  assert.equal(AI_PROMPT_LENGTH_FIXTURES.filter((fixture) => fixture.policy === 'duo').length, 1);
});

test('phase-1 AI fixtures are deterministic, contract-valid, and preserve required anchors', () => {
  for (const fixture of AI_PROMPT_LENGTH_FIXTURES) {
    const prompt = generateFixture(fixture);
    const repeated = generateFixture(fixture);
    const mode = fixture.mode || 'single';

    assert.equal(repeated.midjourneyPrompt, prompt.midjourneyPrompt, fixture.id);
    assert.deepEqual(
      validatePromptOutputContract('midjourneyPrompt', prompt.midjourneyPrompt, { mode }),
      [],
      fixture.id
    );
    for (const fragment of fixture.requiredFragments || []) {
      assert.match(prompt.midjourneyPrompt, new RegExp(fragment, 'i'), `${fixture.id}: ${fragment}`);
    }
    if (fixture.requiresCanonicalPose) {
      const gptPose = prompt.grokPrompt.match(/Pose and Composition:\n([\s\S]*?)(?:\n\n|$)/)?.[1]?.trim();
      assert.ok(gptPose, `${fixture.id} should expose a canonical pose`);
      assert.ok(prompt.midjourneyPrompt.includes(gptPose), `${fixture.id} should reuse the exact canonical pose`);
    }
  }
});

test('phase-4 resolves complete-look and Character Card pressure within their soft limits', () => {
  const measurements = Object.fromEntries(
    AI_PROMPT_LENGTH_FIXTURES
      .filter((fixture) => fixture.policy)
      .map((fixture) => [
        fixture.id,
        countAiPromptWords(generateFixture(fixture).midjourneyPrompt),
      ])
  );

  assert.ok(measurements['complete-look-latex'] <= AI_PROMPT_LENGTH_CONTRACT.budgets.completeLook.softMaxWords);
  assert.ok(measurements['complete-look-special'] <= AI_PROMPT_LENGTH_CONTRACT.budgets.completeLook.softMaxWords);
  assert.ok(measurements['character-card-jiwoo'] <= AI_PROMPT_LENGTH_CONTRACT.budgets.characterCard.softMaxWords);
  assert.ok(measurements['character-card-sui'] <= AI_PROMPT_LENGTH_CONTRACT.budgets.characterCard.softMaxWords);
  assert.ok(measurements['duo-direct-boundary'] <= AI_PROMPT_LENGTH_CONTRACT.budgets.duo.softMaxWords);
});

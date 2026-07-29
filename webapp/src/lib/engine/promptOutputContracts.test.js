import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createEmptyLocks,
  createSeededRandom,
  generatePrompts,
  getLockControls,
} from '../engine.js';
import {
  PROMPT_OUTPUT_CONTRACTS,
  PROMPT_OUTPUT_CONTRACT_VERSION,
  validatePromptOutputContract,
} from './promptOutputContracts.js';
import { REPRESENTATIVE_PROMPT_FIXTURES } from './representativePromptFixtures.js';

const controls = getLockControls();

function controlByKey(key) {
  const control = controls.find((entry) => entry.key === key);
  assert.ok(control, `Missing control ${key}`);
  return control;
}

function resolveFixtureLock(key, selector, fixtureId) {
  if (typeof selector === 'string' || Array.isArray(selector)) return selector;
  assert.equal(typeof selector?.byZh, 'string', `${fixtureId}.${key} must use a raw id or { byZh } selector`);
  const option = controlByKey(key).options?.find((entry) => entry.zh === selector.byZh);
  assert.ok(option, `${fixtureId}.${key} cannot resolve visible option ${selector.byZh}`);
  return option.id;
}

function createAllNoneLocks() {
  const locks = { ...createEmptyLocks() };
  for (const control of controls) {
    const noneOption = control.options?.find((entry) => entry.zh === '全無');
    if (noneOption) locks[control.key] = noneOption.id;
  }
  return locks;
}

function materializeFixtureLocks(fixture) {
  const locks = createAllNoneLocks();
  for (const [key, selector] of Object.entries(fixture.locks)) {
    locks[key] = resolveFixtureLock(key, selector, fixture.id);
  }
  return locks;
}

function generateFixture(fixture) {
  return generatePrompts(1, materializeFixtureLocks(fixture), [], {
    random: createSeededRandom(fixture.seed),
  })[0];
}

function readContractOutput(prompt, contract) {
  if (contract.source.kind === 'field') return prompt[contract.source.key] || '';
  if (contract.source.kind === 'extraPrompt') {
    return prompt.extraPrompts?.find((entry) => entry.id === contract.source.id)?.text || '';
  }
  assert.fail(`Unknown prompt contract source kind ${contract.source.kind}`);
}

function stablePromptResult(prompt) {
  return {
    grokPrompt: prompt.grokPrompt,
    zImagePrompt: prompt.zImagePrompt,
    midjourneyPrompt: prompt.midjourneyPrompt,
    facialCloseupPortraitPrompt: readContractOutput(prompt, PROMPT_OUTPUT_CONTRACTS.facialCloseupPortraitPrompt),
    chestUpPortraitPrompt: readContractOutput(prompt, PROMPT_OUTPUT_CONTRACTS.chestUpPortraitPrompt),
    fullBodyCharacterPrompt: readContractOutput(prompt, PROMPT_OUTPUT_CONTRACTS.fullBodyCharacterPrompt),
    selection: prompt.selection,
  };
}

function assertLiteralExpectations(text, expectations, fixtureId, field) {
  const lowerText = text.toLowerCase();
  for (const fragment of expectations.includes || []) {
    assert.ok(
      lowerText.includes(fragment.toLowerCase()),
      `${fixtureId}.${field} should include ${JSON.stringify(fragment)}`
    );
  }
  for (const fragment of expectations.excludes || []) {
    assert.equal(
      lowerText.includes(fragment.toLowerCase()),
      false,
      `${fixtureId}.${field} should exclude ${JSON.stringify(fragment)}`
    );
  }
  let previousIndex = -1;
  for (const fragment of expectations.ordered || []) {
    const currentIndex = lowerText.indexOf(fragment.toLowerCase());
    assert.ok(
      currentIndex >= 0,
      `${fixtureId}.${field} ordered fragment should exist: ${JSON.stringify(fragment)}`
    );
    assert.ok(
      currentIndex > previousIndex,
      `${fixtureId}.${field} should place ${JSON.stringify(fragment)} after the previous ordered fragment`
    );
    previousIndex = currentIndex;
  }
}

test('prompt output contracts are frozen serializable data with stable public fields', () => {
  assert.equal(PROMPT_OUTPUT_CONTRACT_VERSION, '1.4.0');
  assert.deepEqual(Object.keys(PROMPT_OUTPUT_CONTRACTS), [
    'grokPrompt',
    'zImagePrompt',
    'midjourneyPrompt',
    'facialCloseupPortraitPrompt',
    'chestUpPortraitPrompt',
    'fullBodyCharacterPrompt',
  ]);
  assert.ok(Object.isFrozen(PROMPT_OUTPUT_CONTRACTS));
  assert.ok(Object.isFrozen(PROMPT_OUTPUT_CONTRACTS.grokPrompt.shape.modes.single));
  assert.deepEqual(JSON.parse(JSON.stringify(PROMPT_OUTPUT_CONTRACTS)), PROMPT_OUTPUT_CONTRACTS);
  assert.equal(PROMPT_OUTPUT_CONTRACTS.grokPrompt.uiLabel, 'Gpt');
  assert.equal(PROMPT_OUTPUT_CONTRACTS.zImagePrompt.uiLabel, 'Grok/Z-Image');
  assert.equal(PROMPT_OUTPUT_CONTRACTS.midjourneyPrompt.uiLabel, 'AI');
  assert.equal(PROMPT_OUTPUT_CONTRACTS.midjourneyPrompt.shape.paragraphSeparator, 'single-block');
  assert.equal(PROMPT_OUTPUT_CONTRACTS.midjourneyPrompt.shape.minimumParagraphs, 1);
  assert.equal(PROMPT_OUTPUT_CONTRACTS.midjourneyPrompt.shape.labelPlacement, 'inline');
  assert.match(
    PROMPT_OUTPUT_CONTRACTS.midjourneyPrompt.tail.requiredPatternSource,
    /--v/
  );
  assert.equal(PROMPT_OUTPUT_CONTRACTS.facialCloseupPortraitPrompt.source.id, 'facial-closeup-portrait');
  assert.equal(PROMPT_OUTPUT_CONTRACTS.chestUpPortraitPrompt.source.id, 'chest-up-portrait');
  assert.deepEqual(PROMPT_OUTPUT_CONTRACTS.fullBodyCharacterPrompt.applicability.supportedModes, ['single']);
});

test('contract validator reports unknown, unsupported, tail, language, and control-leakage failures', () => {
  assert.equal(validatePromptOutputContract('missingField', '', { mode: 'single' })[0]?.code, 'unknown-contract');
  assert.equal(
    validatePromptOutputContract('fullBodyCharacterPrompt', 'unexpected duo output', { mode: 'duo' })[0]?.code,
    'unsupported-output-present'
  );

  const invalidGpt = [
    'Image Type:',
    'Create a photorealistic portrait.',
    '',
    'Subject:',
    '一位 subject.',
    '',
    'Subject Count: 1',
  ].join('\n');
  const issueCodes = validatePromptOutputContract('grokPrompt', invalidGpt, { mode: 'single' })
    .map((entry) => entry.code);

  assert.ok(issueCodes.includes('missing-tail'));
  assert.ok(issueCodes.includes('language-range'));
  assert.ok(issueCodes.includes('control-leakage'));

  const invalidMidjourney = [
    'Create a photorealistic editorial portrait.',
    '',
    'One adult portrait subject.',
  ].join('\n');
  assert.ok(
    validatePromptOutputContract('midjourneyPrompt', invalidMidjourney, { mode: 'single' })
      .some((entry) => entry.code === 'tail-pattern')
  );
});

for (const fixture of REPRESENTATIVE_PROMPT_FIXTURES) {
  test(`representative fixture: ${fixture.id}`, () => {
    const prompt = generateFixture(fixture);
    const repeatedPrompt = generateFixture(fixture);

    assert.deepEqual(
      stablePromptResult(repeatedPrompt),
      stablePromptResult(prompt),
      `${fixture.id} must remain reproducible with seed ${fixture.seed}`
    );

    for (const [field, contract] of Object.entries(PROMPT_OUTPUT_CONTRACTS)) {
      const text = readContractOutput(prompt, contract);
      const issues = validatePromptOutputContract(field, text, { mode: fixture.mode });
      assert.deepEqual(issues, [], `${fixture.id}.${field} contract failures:\n${JSON.stringify(issues, null, 2)}`);
    }

    for (const [field, expectations] of Object.entries(fixture.expectedOutputs || {})) {
      const contract = PROMPT_OUTPUT_CONTRACTS[field];
      assert.ok(contract, `${fixture.id} references unknown output ${field}`);
      const text = readContractOutput(prompt, contract);
      assert.ok(text, `${fixture.id}.${field} should be discoverable`);
      assertLiteralExpectations(text, expectations, fixture.id, field);
    }
  });
}

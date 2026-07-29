import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';

import {
  createEmptyLocks,
  createSeededRandom,
  generatePrompts,
  getLockControls,
} from '../engine.js';
import {
  AI_PROMPT_REDUCTION_SECTION_ORDER,
  AI_PROMPT_SECTION_ORDER,
  createBudgetedAiPromptSectionModel,
  createAiPromptSectionModel,
  renderAiPromptSectionModel,
  resolveAiPromptPolicyKey,
} from './aiPromptBudget.js';
import {
  AI_PROMPT_LENGTH_CONTRACT,
  countAiPromptWords,
} from './aiPromptLengthContract.js';
import { AI_PROMPT_LENGTH_FIXTURES } from './aiPromptLengthFixtures.js';
import { stripMidjourneyParameterTail } from './midjourneyParameterTail.js';

const controls = getLockControls();
const PHASE_1_BASELINE_HASHES = Object.freeze({
  'normal-separates': '322a322efad6e07408cc32c5d3a9e29955ab7a0c91bf31b1c7f64437ddea2f75',
  'complete-look-latex': 'dc8b9b6bba14ede6eb7ab947e3d12f45962a37dfd25e1382e2df153d435b341e',
  'complete-look-special': '00608387af8f83ee2e62f56e05d80c3abb176ee0dfddc7fb7d6a06881ca65ae9',
  'complete-look-dress': '54a7d2d17d9c16da17a4eaea2394b1c70b8a2fb4aa8878e6e90d3c55cf0819cd',
  'character-card-jiwoo': '42f8c161396a7291177c1f3f55ffb6856d31822741689393ff65684698a2a555',
  'character-card-sui': 'b51b74e0321481106bf1c6954877999130a6742f3649f7648612a3ca9a69481b',
  'canonical-pose-pressure': 'ee02c180444f0157d5db0150318b7e7e4b1828e21e18ef0533da45b7694b7523',
  'half-face-boundary': 'b4e518c6db82b58752fb1c375298244d7ea661016f875bc310f260194dbd1d76',
  'duo-excluded-boundary': 'c35f99593547205dff8bf4c1640d1e07c057adb12524c26b03ec7b6484322703',
});
const PHASE_4_STABLE_HASHES = Object.freeze({
  'normal-separates': '9a1216027ae7b41bc0dc0a7e41b1452212572ee2184280d7e177ccdda4a798a3',
  'complete-look-latex': '6fd71b7b04242febb732465df623a0dea715c35d9268aaffff689bc0535cb0bd',
  'complete-look-special': '0468607e12816b3c698e10bcff2dcd174a547c69b8b6fbcab32b33299e0119ad',
  'complete-look-dress': '54a7d2d17d9c16da17a4eaea2394b1c70b8a2fb4aa8878e6e90d3c55cf0819cd',
  'character-card-jiwoo': '0d3b9446582d0f8c8ea396e0a8ce616793d4412ec9351163760c5fa04b1845ba',
  'character-card-sui': '8a770e5dcf92b91856acbeb47f426d4777cdfcb23da9e9b83fe6afae16b64221',
  'canonical-pose-pressure': '97873140a6cd746c15f2772b197bbefdcd6fa6525dee02c2da59515264428927',
  'half-face-boundary': 'b4e518c6db82b58752fb1c375298244d7ea661016f875bc310f260194dbd1d76',
  'duo-excluded-boundary': 'c35f99593547205dff8bf4c1640d1e07c057adb12524c26b03ec7b6484322703',
});

function createAllNoneLocks() {
  const locks = { ...createEmptyLocks() };
  for (const control of controls) {
    const noneOption = control.options?.find((entry) => entry.zh === '全無');
    if (noneOption) locks[control.key] = noneOption.id;
  }
  return locks;
}

function generateFixture(fixture) {
  const locks = createAllNoneLocks();
  for (const [key, selector] of Object.entries(fixture.locks)) {
    if (typeof selector === 'string' || Array.isArray(selector)) {
      locks[key] = selector;
      continue;
    }
    const control = controls.find((entry) => entry.key === key);
    const option = control?.options?.find((entry) => entry.zh === selector.byZh);
    assert.ok(option, `${fixture.id}.${key} cannot resolve ${selector.byZh}`);
    locks[key] = option.id;
  }
  return generatePrompts(1, locks, [], {
    random: createSeededRandom(fixture.seed),
  })[0];
}

test('section-aware budget model records stable order, immutable sections, and diagnostics', () => {
  const model = createAiPromptSectionModel({
    policyKey: 'normal',
    sections: [
      { id: 'subject', text: 'A concise subject.' },
      { id: 'imageType', text: 'Create a portrait.' },
      { id: 'projectedCanonicalPose', text: 'She presents a natural standing pose.' },
    ],
  });

  assert.deepEqual(model.sections.map((section) => section.id), AI_PROMPT_SECTION_ORDER);
  assert.deepEqual(
    model.sections.filter((section) => section.immutable).map((section) => section.id),
    ['imageType', 'composition', 'projectedCanonicalPose']
  );
  assert.equal(model.measurement.totalWords, 12);
  assert.equal(model.measurement.withinSoftMax, true);
  assert.equal(
    renderAiPromptSectionModel(model),
    'Create a portrait.\n\nA concise subject.\n\nShe presents a natural standing pose.'
  );
  assert.ok(Object.isFrozen(model));
  assert.ok(Object.isFrozen(model.sections[0]));
});

test('global arbitration reduces complete imaging then scene alternatives without touching immutable sections', () => {
  const words = (prefix, count) => Array.from({ length: count }, (_, index) => `${prefix}${index}`).join(' ');
  const model = createBudgetedAiPromptSectionModel({
    policyKey: 'normal',
    sections: [
      {
        id: 'composition',
        text: words('composition', 20),
        reductions: ['short composition'],
      },
      { id: 'subject', text: words('subject', 90) },
      {
        id: 'scene',
        text: words('scene', 15),
        reductions: [words('scene', 8)],
      },
      {
        id: 'imaging',
        text: words('imaging', 15),
        reductions: [words('imaging', 5)],
      },
    ],
  });

  assert.deepEqual(AI_PROMPT_REDUCTION_SECTION_ORDER, ['imaging', 'scene', 'wardrobe', 'subject']);
  assert.equal(model.measurement.totalWords, 130);
  assert.equal(model.measurement.withinSoftMax, true);
  assert.equal(model.sections.find((section) => section.id === 'composition').wordCount, 20);
  assert.deepEqual(model.arbitration.reductionsApplied, [{
    sectionId: 'imaging',
    fromWords: 15,
    toWords: 5,
  }]);
});

test('budget policy selection keeps Character Card precedence and complete-look isolation', () => {
  assert.equal(resolveAiPromptPolicyKey(), 'normal');
  assert.equal(resolveAiPromptPolicyKey({ completeLook: true }), 'completeLook');
  assert.equal(resolveAiPromptPolicyKey({ characterCard: true }), 'characterCard');
  assert.equal(
    resolveAiPromptPolicyKey({ characterCard: true, completeLook: true }),
    'characterCard'
  );
});

test('phase-4 keeps the excluded duo output outside its behavior change', () => {
  for (const fixture of AI_PROMPT_LENGTH_FIXTURES.filter((entry) => {
    return entry.excludedFromBudget;
  })) {
    const output = generateFixture(fixture).midjourneyPrompt;
    const hash = createHash('sha256').update(stripMidjourneyParameterTail(output)).digest('hex');
    assert.equal(hash, PHASE_1_BASELINE_HASHES[fixture.id], fixture.id);
  }
});

test('phase-3 normal and complete-look outputs meet their budget and preserve fixture anchors', () => {
  for (const fixture of AI_PROMPT_LENGTH_FIXTURES.filter((entry) => {
    return entry.policy === 'normal' || entry.policy === 'completeLook';
  })) {
    const output = generateFixture(fixture).midjourneyPrompt;
    const budget = AI_PROMPT_LENGTH_CONTRACT.budgets[fixture.policy];
    assert.ok(
      countAiPromptWords(output) <= budget.softMaxWords,
      `${fixture.id} exceeds ${budget.softMaxWords} words:\n${output}`
    );
    for (const fragment of fixture.requiredFragments || []) {
      assert.match(output, new RegExp(fragment, 'i'), `${fixture.id}: ${fragment}`);
    }
  }
});

test('phase-4 Character Card outputs meet their budget and preserve permanent identity and wardrobe anchors', () => {
  for (const fixture of AI_PROMPT_LENGTH_FIXTURES.filter((entry) => {
    return entry.policy === 'characterCard';
  })) {
    const output = generateFixture(fixture).midjourneyPrompt;
    const budget = AI_PROMPT_LENGTH_CONTRACT.budgets.characterCard;
    assert.ok(
      countAiPromptWords(output) <= budget.softMaxWords,
      `${fixture.id} exceeds ${budget.softMaxWords} words:\n${output}`
    );
    for (const fragment of fixture.requiredFragments || []) {
      assert.match(output, new RegExp(fragment, 'i'), `${fixture.id}: ${fragment}`);
    }
  }
});

test('phase-5 leaves every already-compliant fixture byte-stable', () => {
  for (const [fixtureId, expectedHash] of Object.entries(PHASE_4_STABLE_HASHES)) {
    const fixture = AI_PROMPT_LENGTH_FIXTURES.find((entry) => entry.id === fixtureId);
    const output = generateFixture(fixture).midjourneyPrompt;
    assert.equal(
      createHash('sha256').update(stripMidjourneyParameterTail(output)).digest('hex'),
      expectedHash,
      fixtureId
    );
  }
});

test('phase-5 resolves cross-section pressure without dropping source identities', () => {
  const fixture = AI_PROMPT_LENGTH_FIXTURES.find((entry) => {
    return entry.id === 'character-card-half-face-pressure';
  });
  const output = generateFixture(fixture).midjourneyPrompt;
  const budget = AI_PROMPT_LENGTH_CONTRACT.budgets.characterCard;

  assert.ok(
    countAiPromptWords(output) <= budget.softMaxWords,
    `${fixture.id} exceeds ${budget.softMaxWords} words:\n${output}`
  );
  for (const fragment of fixture.requiredFragments) {
    assert.match(output, new RegExp(fragment, 'i'), `${fixture.id}: ${fragment}`);
  }
  assert.doesNotMatch(output, /broad field of view|balcony ledge/i);
});

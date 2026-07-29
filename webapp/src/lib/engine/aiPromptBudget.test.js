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
const MIDJOURNEY_NATIVE_DESCRIPTION_HASHES = Object.freeze({
  'normal-separates': 'c10f6e3b53e84d1ba470ebf944d841945da0fe43c18359da639e52a67e0776db',
  'complete-look-latex': '1e1a37858d210b296e6c0e76bb8268ec40eb1591d427cf8bc8a0e42caf49e5f0',
  'complete-look-special': '8b9a2dcac3dfb8297b644398cf732f6e6bf944700c75b80984131f903fe95e37',
  'complete-look-dress': '40c3231fd8591963b522cccec4acd7089b8a8f1e5ca04eb1568d11f9227100ac',
  'character-card-jiwoo': '662f1609dc1590a40521c78026b541a2c93aecac39959d888d295ccd20145144',
  'character-card-sui': '5c637dd35f141e90355e6880647989ef778787427f3790b8c5bb5d8e84637b51',
  'character-card-half-face-pressure': '433079ea341c1eb9004c7548d967492128bb0d077924a17aaf8fe6a4fbad3079',
  'canonical-pose-pressure': 'e7314f9d387d522b69b7922cfc3556e86bf415abf51f5da5f20fd84ad84072a6',
  'half-face-boundary': '41bc579c09e80dcd1d3c3e90cae06eb502da10ca1ef98298935da3f68994c763',
  'duo-excluded-boundary': 'b44a8ac1ee3b38d1a6c6bc8a2fb93da305100f18886d5d5437d2c47172df5157',
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

test('Midjourney native structure keeps duo outside the single-subject budget policy', () => {
  for (const fixture of AI_PROMPT_LENGTH_FIXTURES.filter((entry) => {
    return entry.excludedFromBudget;
  })) {
    const output = generateFixture(fixture).midjourneyPrompt;
    const hash = createHash('sha256').update(stripMidjourneyParameterTail(output)).digest('hex');
    assert.equal(hash, MIDJOURNEY_NATIVE_DESCRIPTION_HASHES[fixture.id], fixture.id);
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

test('Midjourney native structure freezes every accepted AI description', () => {
  for (const [fixtureId, expectedHash] of Object.entries(MIDJOURNEY_NATIVE_DESCRIPTION_HASHES)) {
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
  assert.doesNotMatch(output, /broad field of view/i);
});

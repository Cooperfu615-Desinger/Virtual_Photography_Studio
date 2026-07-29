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
  'normal-separates': '04b4326bd23327c7862419daaec259c8113c010a296d7d981232e81b0fab7985',
  'complete-look-latex': 'e4624140d5a3cd2f9c6db6a3b034e098a77b1f741bb30873718a19de5de63798',
  'complete-look-special': '3818eae2c9ab85b809992c59360145192aaf294d8128340866663bcd2d26e3c5',
  'complete-look-dress': 'c8408481f066648dbbc30c77fb75f5879dcc03a240e29a2c433d28b3edb1243d',
  'character-card-jiwoo': 'f343eeb3710540a7096dab1b89eca872bf214977040c3462f18ef970b88b83e0',
  'character-card-sui': '80e5afb9f64283ada8c5e7d2a2edb47eb1c85fea7b1e393c681de9e5ab75aedf',
  'character-card-half-face-pressure': '82c41b45168342be7e5cf0f455ddd1553c817695d7ffb20945d86259ea85f45a',
  'canonical-pose-pressure': '3546ed07167cbd3c4cfd4a38daa14145a85f751467b742a9ea3aa058a208267f',
  'half-face-boundary': '05710db3d0d12d11fdd6e43a6f57ab5cf6cc0d2a5e309835f86cf7cc595a68d5',
  'duo-excluded-boundary': '51e3234df5bc91e016fe2ec622eb6b57b7acc31f7950d92c347500fd98e8d9c9',
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
  assert.doesNotMatch(output, /broad field of view|balcony ledge/i);
});

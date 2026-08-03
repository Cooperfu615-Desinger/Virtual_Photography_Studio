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
  'normal-separates': '43d31f88b75d14a2941d42d681f4b1061e42b42e5fdd88f43f6ef196a6c91f82',
  'complete-look-latex': '04740bbd87173abf3a4bd3b3ef59a5e8ef460934ee490223228eca8fcd8baf69',
  'complete-look-special': 'a7039841afd9aab15edb8133f853769b936eabb2b6faf9ea3f8910853f410e4c',
  'complete-look-dress': 'bd4e169efebce32dac2f6806ee122e0a31199a7fd34d692588815fe21098c571',
  'character-card-jiwoo': 'ad7495dafee9cb40daf5592d1101b8e2034b097cdf163d60782ee1321d3f937e',
  'character-card-sui': 'f7d418199d093445bc772f37ce6eaafc29f1ac24ec775bbaf81e5e25aa17d1e8',
  'character-card-half-face-pressure': '059533d4f8a21e77f600d02773ae53248c8a54ee59a04698ba0b9c37f9b3ddd8',
  'canonical-pose-pressure': '7265301187edfa9cda579bf65c6259b70c14c0722e769fb6fab2fa18e1b77dd5',
  'half-face-boundary': '670a27fc44f75f93eff869a4e32952c4e5d247c34c6b3cb4f720195737145331',
  'duo-direct-boundary': 'a2d3ae0df5373935215d7c51f94e21579d9504ec5edc995c7a4f08cd52e8141d',
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

test('Midjourney native structure applies an explicit budget to duo prompts', () => {
  for (const fixture of AI_PROMPT_LENGTH_FIXTURES.filter((entry) => entry.policy === 'duo')) {
    const output = generateFixture(fixture).midjourneyPrompt;
    assert.ok(
      countAiPromptWords(output) <= AI_PROMPT_LENGTH_CONTRACT.budgets.duo.softMaxWords,
      `${fixture.id} exceeds the duo budget`
    );
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
  assert.match(output, /broad field of view/i);
});

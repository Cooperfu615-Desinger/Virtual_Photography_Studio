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
import { countAiPromptWords } from './aiPromptLengthContract.js';
import { AI_PROMPT_LENGTH_FIXTURES } from './aiPromptLengthFixtures.js';
import { stripMidjourneyParameterTail } from './midjourneyParameterTail.js';

const controls = getLockControls();
const MIDJOURNEY_NATIVE_DESCRIPTION_HASHES = Object.freeze({
  'normal-separates': '7e9a73b11ea81efe08a0bcaa330dfcbc1eb5382693045b769343d3d3dd618a3e',
  'complete-look-latex': '79d302b251d3bd52e0311cfcd73254b9bcc7a89a72196989bc7f1b4e0af9311f',
  'complete-look-special': '51d822b857d89d5744e12a82752c1f3fe076d372b6bdb75dc359aa939e2d92ea',
  'complete-look-dress': '9390e5bdbaee6e91bb686863c0c54256f7e7645d82cf0a321ed334d60170a909',
  'character-card-jiwoo': '95cb45387c2ff62aa3a9a93594edb7770aca38ac231563d7f82542035fb7cba4',
  'character-card-sui': '1436fc87a020827d9ddec9ef735247f8069480caf6896bb36c46e32828c1067a',
  'character-card-half-face-pressure': 'e13712f94c12853fc6e9daceef510857d6b6d1ef6e05ca92f78466e892d6f0d4',
  'canonical-pose-pressure': '1f0de768a1c20d257b37934812cb414627620a71eeec220d555aad5fcfbdaba2',
  'half-face-boundary': '2f2930deb06073209a305bd9d548629572477d533375eb9c3805138234a11cf3',
  'duo-direct-boundary': 'd03117d64f729ff32b254f5eea53280203ef0fcf5b800b0725f1feddfeb03a8c',
});

function createAllNoneLocks() {
  const locks = { ...createEmptyLocks() };
  for (const control of controls) {
    const noneOption = control.options?.find((entry) => entry.zh === '全無' || entry.zh === '無額外表情');
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

test('scene-integrated main order is opt-in and preserves section content and measurements', () => {
  const sections = AI_PROMPT_SECTION_ORDER.map((id) => ({ id, text: `${id} source.` }));
  const old = createAiPromptSectionModel({ sections });
  const next = createAiPromptSectionModel({ sections, sceneIntegrated: true });
  assert.deepEqual(next.sections.map((s) => s.id), [
    'imageType', 'composition', 'subject', 'projectedCanonicalPose', 'wardrobe', 'scene', 'imaging',
  ]);
  assert.deepEqual(next.measurement, old.measurement);
  for (const section of old.sections) assert.deepEqual(next.sections.find((s) => s.id === section.id), section);
  assert.deepEqual(createAiPromptSectionModel({ sections }), old, 'opt-in must not persist into the next call');
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

test('Midjourney native structure records duo length diagnostics without a deletion gate', () => {
  for (const fixture of AI_PROMPT_LENGTH_FIXTURES.filter((entry) => entry.policy === 'duo')) {
    const output = generateFixture(fixture).midjourneyPrompt;
    assert.ok(
      Number.isInteger(countAiPromptWords(output)),
      `${fixture.id} diagnostic word count`
    );
    const hash = createHash('sha256').update(stripMidjourneyParameterTail(output)).digest('hex');
    assert.equal(hash, MIDJOURNEY_NATIVE_DESCRIPTION_HASHES[fixture.id], fixture.id);
  }
});

test('normal and complete-look outputs preserve fixture anchors after MJ compression', () => {
  for (const fixture of AI_PROMPT_LENGTH_FIXTURES.filter((entry) => {
    return entry.policy === 'normal' || entry.policy === 'completeLook';
  })) {
    const output = generateFixture(fixture).midjourneyPrompt;
    assert.ok(Number.isInteger(countAiPromptWords(output)), `${fixture.id}: diagnostic word count`);
    for (const fragment of fixture.requiredFragments || []) {
      assert.match(output, new RegExp(fragment, 'i'), `${fixture.id}: ${fragment}`);
    }
  }
});

test('Character Card outputs preserve permanent identity and wardrobe anchors without hard length gating', () => {
  for (const fixture of AI_PROMPT_LENGTH_FIXTURES.filter((entry) => {
    return entry.policy === 'characterCard';
  })) {
    const output = generateFixture(fixture).midjourneyPrompt;
    assert.ok(Number.isInteger(countAiPromptWords(output)), `${fixture.id}: diagnostic word count`);
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

test('cross-section pressure preserves source identities without dropping visual items', () => {
  const fixture = AI_PROMPT_LENGTH_FIXTURES.find((entry) => {
    return entry.id === 'character-card-half-face-pressure';
  });
  const output = generateFixture(fixture).midjourneyPrompt;
  assert.ok(Number.isInteger(countAiPromptWords(output)), `${fixture.id}: diagnostic word count`);
  for (const fragment of fixture.requiredFragments) {
    assert.match(output, new RegExp(fragment, 'i'), `${fixture.id}: ${fragment}`);
  }
  assert.match(output, /broad field of view/i);
});

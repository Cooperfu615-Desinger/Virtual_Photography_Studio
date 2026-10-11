import naturalAccepted from './midjourneyNaturalAccepted.json' with { type: 'json' };
import { generateLegacyBodyPrompts } from './bodyTypeLegacyTestSupport.js';
import { normalizeOuterwearCatalogForLegacy } from './outerwearCatalogTestSupport.js';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';

import {
  createEmptyLocks,
  createSeededRandom,
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
import { PRE_HOURGLASS_BODY_CATALOG } from './sceneIntegratedAssemblyTestSupport.js';

const controls = getLockControls();
const MIDJOURNEY_NATIVE_DESCRIPTION_HASHES = naturalAccepted.lengths;

function createAllNoneLocks() {
  const locks = { ...createEmptyLocks() };
  for (const control of controls) {
    // Preserve the historical fixture inputs before the optional silence additions.
    if (/^(bodyType|hairStylingState)[AB]?Id$|^outerwear[AB]?OpeningId$|^eyewear[AB]?PlacementId$|^sceneAttributeId$/.test(control.key)) continue;
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
  if (fixture.id === 'normal-separates') locks.bodyTypeId = 'character:體態-body-type:一般基本體型:1';
  return generateLegacyBodyPrompts(1, locks, PRE_HOURGLASS_BODY_CATALOG, {
    random: createSeededRandom(fixture.seed),
  })[0];
}

// Exact test-only inverse for this frozen white-shirt fixture. Current-source
// black-tie tests validate the new wording; all other description bytes remain.
function normalizeTieShirtForFrozenFixture(output, fixtureId) {
  return ['normal-separates', 'half-face-boundary'].includes(fixtureId) ? output.replace(
    'collared shirt with a short soft black necktie fastened at the collar, shirt fabric in white',
    'white collared shirt with a short soft necktie',
  ) : output;
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
    const hash = createHash('sha256').update(stripMidjourneyParameterTail(normalizeOuterwearCatalogForLegacy(output, 'midjourneyPrompt'))).digest('hex');
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
      createHash('sha256').update(stripMidjourneyParameterTail(normalizeOuterwearCatalogForLegacy(normalizeTieShirtForFrozenFixture(output, fixtureId), 'midjourneyPrompt'))).digest('hex'),
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

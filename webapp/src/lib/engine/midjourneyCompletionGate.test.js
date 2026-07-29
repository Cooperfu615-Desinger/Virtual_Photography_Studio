import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';

import {
  buildMarkdownExport,
  deserializeFavoritePrompt,
  parseExportedMarkdownPrompt,
  parseLocksFromStandardPrompt,
  serializeFavoritePrompt,
} from '../../features/saved-cards/cardCodec.js';
import {
  buildPage1DllPromptSources,
  buildPage1GenerationPromptCards,
} from '../page1PromptOutputs.js';
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
import {
  MIDJOURNEY_DESCRIPTION_CONTRACT,
  MIDJOURNEY_DESCRIPTION_CONTRACT_VERSION,
} from './midjourneyDescriptionContract.js';
import { MIDJOURNEY_DESCRIPTION_FIXTURES } from './midjourneyDescriptionFixtures.js';
import { MIDJOURNEY_NATIVE_STRUCTURE_FIXTURES } from './midjourneyNativeStructureFixtures.js';
import { MIDJOURNEY_PARAMETER_CONTRACT } from './midjourneyParameterContract.js';
import { MIDJOURNEY_PARAMETER_FIXTURES } from './midjourneyParameterFixtures.js';
import {
  parseMidjourneyParameterTail,
  stripMidjourneyParameterTail,
} from './midjourneyParameterTail.js';
import { validatePromptOutputContract } from './promptOutputContracts.js';
import { REPRESENTATIVE_PROMPT_FIXTURES } from './representativePromptFixtures.js';

const controls = getLockControls();
const extraPromptFields = Object.freeze({
  'facial-closeup-portrait': 'facialCloseupPortraitPrompt',
  'chest-up-portrait': 'chestUpPortraitPrompt',
  'full-body-character': 'fullBodyCharacterPrompt',
});
const primaryPromptFields = Object.freeze({
  gpt: 'grokPrompt',
  grok: 'zImagePrompt',
  ai: 'midjourneyPrompt',
});

function hashPrompt(value) {
  return createHash('sha256').update(value).digest('hex');
}

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
  const option = control?.options?.find((entry) => entry.zh === selector?.byZh);
  assert.ok(option, `${fixtureId}.${key} cannot resolve ${selector?.byZh}`);
  return option.id;
}

function generateFixture(parameterFixture) {
  const sourceFixture = REPRESENTATIVE_PROMPT_FIXTURES.find(
    (fixture) => fixture.id === parameterFixture.sourceFixtureId
  );
  assert.ok(sourceFixture, `${parameterFixture.id}: representative fixture`);

  const locks = {
    ...createAllNoneLocks(),
    ...parameterFixture.futureSettings,
    aspectRatio: parameterFixture.aspectRatio,
  };
  for (const [key, selector] of Object.entries(sourceFixture.locks)) {
    locks[key] = resolveLock(key, selector, sourceFixture.id);
  }

  return {
    mode: sourceFixture.mode,
    prompt: generatePrompts(1, locks, [], {
      random: createSeededRandom(sourceFixture.seed),
    })[0],
  };
}

function expectedParameterSelection(parameterFixture) {
  return {
    ...parameterFixture.futureSettings,
    aspectRatio: parameterFixture.aspectRatio,
  };
}

function assertParameterSelection(actual, parameterFixture, label) {
  for (const [key, value] of Object.entries(expectedParameterSelection(parameterFixture))) {
    assert.equal(actual?.[key], value, `${parameterFixture.id}: ${label}.${key}`);
  }
}

test('phase 6 blocks any engine or public-contract drift across all Midjourney fixtures', () => {
  for (const parameterFixture of MIDJOURNEY_PARAMETER_FIXTURES) {
    const { mode, prompt } = generateFixture(parameterFixture);
    const nativeFixture = MIDJOURNEY_NATIVE_STRUCTURE_FIXTURES.find(
      (fixture) => fixture.id === parameterFixture.id
    );
    assert.ok(nativeFixture, `${parameterFixture.id}: native structure fixture`);

    assert.equal(
      hashPrompt(prompt.grokPrompt),
      parameterFixture.baselineHashes.grokPrompt,
      `${parameterFixture.id}: historical Gpt mapping`
    );
    assert.equal(
      hashPrompt(prompt.zImagePrompt),
      parameterFixture.baselineHashes.zImagePrompt,
      `${parameterFixture.id}: historical Grok/Z-Image mapping`
    );
    assert.equal(
      hashPrompt(stripMidjourneyParameterTail(prompt.midjourneyPrompt)),
      nativeFixture.expectedDescriptionHash,
      `${parameterFixture.id}: Midjourney-native description`
    );

    const parsedTail = parseMidjourneyParameterTail(prompt.midjourneyPrompt);
    assert.equal(parsedTail.matched, true, `${parameterFixture.id}: canonical tail`);
    assert.equal(parsedTail.tail, parameterFixture.expectedTail, `${parameterFixture.id}: tail`);
    assertParameterSelection(prompt.selection, parameterFixture, 'engine selection');

    for (const field of Object.values(primaryPromptFields)) {
      assert.deepEqual(
        validatePromptOutputContract(field, prompt[field], { mode }),
        [],
        `${parameterFixture.id}: ${field} contract`
      );
    }

    const extras = new Map(prompt.extraPrompts.map((entry) => [entry.id, entry.text]));
    for (const [id, field] of Object.entries(extraPromptFields)) {
      const text = extras.get(id) || '';
      assert.deepEqual(
        validatePromptOutputContract(field, text, { mode }),
        [],
        `${parameterFixture.id}: ${field} contract`
      );
      assert.doesNotMatch(
        text,
        /(?:^|\s)--(?:v|ar|raw|s|c|w|sd|hd)(?:\s|$)/,
        `${parameterFixture.id}: ${id} remains parameter-free`
      );
    }
  }
});

test('phase 6 keeps PAGE1 cards and DLL sources byte-identical to engine outputs', () => {
  for (const parameterFixture of MIDJOURNEY_PARAMETER_FIXTURES) {
    const { mode, prompt } = generateFixture(parameterFixture);
    const cards = buildPage1GenerationPromptCards(prompt);
    const sources = buildPage1DllPromptSources(prompt);
    const expectedIds = mode === 'single'
      ? [...Object.keys(primaryPromptFields), ...Object.keys(extraPromptFields)]
      : Object.keys(primaryPromptFields);

    assert.deepEqual(cards.map((entry) => entry.id), expectedIds, `${parameterFixture.id}: card order`);
    assert.deepEqual(sources.map((entry) => entry.id), expectedIds, `${parameterFixture.id}: DLL order`);

    for (const [id, field] of Object.entries(primaryPromptFields)) {
      assert.equal(
        cards.find((entry) => entry.id === id)?.value,
        prompt[field],
        `${parameterFixture.id}: ${id} card`
      );
      assert.equal(
        sources.find((entry) => entry.id === id)?.value,
        prompt[field],
        `${parameterFixture.id}: ${id} DLL`
      );
    }

    for (const [id] of Object.entries(extraPromptFields)) {
      const expectedText = prompt.extraPrompts.find((entry) => entry.id === id)?.text || '';
      assert.equal(
        cards.find((entry) => entry.id === id)?.value || '',
        expectedText,
        `${parameterFixture.id}: ${id} card`
      );
      assert.equal(
        sources.find((entry) => entry.id === id)?.value || '',
        expectedText,
        `${parameterFixture.id}: ${id} DLL`
      );
    }
  }
});

test('phase 6 preserves Midjourney settings through Standard Prompt and Saved Cards', () => {
  for (const parameterFixture of MIDJOURNEY_PARAMETER_FIXTURES) {
    const { prompt } = generateFixture(parameterFixture);
    const parsedStandard = parseLocksFromStandardPrompt(prompt.midjourneyPrompt, controls);
    assertParameterSelection(parsedStandard.locks, parameterFixture, 'Standard Prompt');

    const savedPrompt = {
      ...prompt,
      id: `phase6-${parameterFixture.id}`,
      source: 'page1',
      sourceLabel: 'Prompt 工作台',
      date: '2026-07-29T00:00:00.000Z',
    };
    const favorite = deserializeFavoritePrompt(serializeFavoritePrompt(savedPrompt));
    assert.ok(favorite, `${parameterFixture.id}: favorite round trip`);
    assert.equal(favorite.grokPrompt, prompt.grokPrompt, `${parameterFixture.id}: favorite Gpt`);
    assert.equal(favorite.zImagePrompt, prompt.zImagePrompt, `${parameterFixture.id}: favorite Grok/Z-Image`);
    assert.equal(favorite.midjourneyPrompt, prompt.midjourneyPrompt, `${parameterFixture.id}: favorite AI`);
    assertParameterSelection(favorite.selection, parameterFixture, 'favorite selection');

    const markdown = buildMarkdownExport(savedPrompt);
    const imported = parseExportedMarkdownPrompt(
      markdown,
      controls,
      `phase6-import-${parameterFixture.id}`
    );
    assert.equal(imported.grokPrompt, prompt.grokPrompt, `${parameterFixture.id}: Markdown Gpt`);
    assert.equal(imported.zImagePrompt, prompt.zImagePrompt, `${parameterFixture.id}: Markdown Grok/Z-Image`);
    assert.equal(imported.midjourneyPrompt, prompt.midjourneyPrompt, `${parameterFixture.id}: Markdown AI`);
    assertParameterSelection(imported.selection, parameterFixture, 'Markdown selection');
  }
});

test('phase 6 keeps the canonical pose verbatim in all three primary outputs', () => {
  const parameterFixture = MIDJOURNEY_PARAMETER_FIXTURES.find(
    (fixture) => fixture.id === 'canonical-pose-precise'
  );
  const { prompt } = generateFixture(parameterFixture);
  const canonicalPose = prompt.grokPrompt
    .match(/Pose and Composition:\n([\s\S]*?)(?:\n\n|$)/)?.[1]
    ?.trim();

  assert.ok(canonicalPose, 'canonical pose exists');
  assert.ok(prompt.zImagePrompt.includes(canonicalPose), 'Grok/Z-Image reuses canonical pose');
  assert.ok(prompt.midjourneyPrompt.includes(canonicalPose), 'AI reuses canonical pose');
  assert.equal(
    MIDJOURNEY_PARAMETER_CONTRACT.compatibility.preserveCanonicalPoseVerbatim,
    true
  );
});

test('description phase 6 freezes direct syntax, budgets, mappings, and downstream consumers', () => {
  assert.equal(MIDJOURNEY_DESCRIPTION_CONTRACT_VERSION, '1.5.0');
  assert.equal(
    MIDJOURNEY_DESCRIPTION_CONTRACT.completion.blockingGate,
    'midjourneyCompletionGate.test.js'
  );
  assert.deepEqual(MIDJOURNEY_DESCRIPTION_CONTRACT.completion.requiredConsumers, [
    'engine',
    'promptOutputContracts',
    'page1GenerationCards',
    'dllPromptSources',
    'standardPromptImport',
    'favoritesV3',
    'savedCardsMarkdown',
  ]);
  assert.deepEqual(
    MIDJOURNEY_DESCRIPTION_CONTRACT.completion.historicalPrimaryFields,
    {
      Gpt: 'grokPrompt',
      'Grok/Z-Image': 'zImagePrompt',
      AI: 'midjourneyPrompt',
    }
  );

  for (const parameterFixture of MIDJOURNEY_PARAMETER_FIXTURES) {
    const { prompt } = generateFixture(parameterFixture);
    const target = MIDJOURNEY_DESCRIPTION_FIXTURES.find(
      (fixture) => fixture.id === parameterFixture.id
    );
    assert.ok(target, `${parameterFixture.id}: description target`);

    const description = stripMidjourneyParameterTail(prompt.midjourneyPrompt);
    assert.equal(
      hashPrompt(description),
      target.phase5DescriptionHash,
      `${parameterFixture.id}: accepted description`
    );
    assert.ok(
      description.startsWith(target.phase2Opening),
      `${parameterFixture.id}: direct image identity`
    );
    assert.doesNotMatch(description, /^Create an? /, `${parameterFixture.id}: imperative opening`);
    assert.doesNotMatch(description, /\n/, `${parameterFixture.id}: one text block`);
    assert.doesNotMatch(
      description,
      /\b(?:Woman 1|Woman 2|Pose|Scene|Lighting|Camera Look):/,
      `${parameterFixture.id}: no AI section labels`
    );

    const budgetKey = parameterFixture.id === 'duo-balanced'
      ? 'duo'
      : parameterFixture.id === 'character-card-hd'
        ? 'characterCard'
        : parameterFixture.id.startsWith('complete-look')
          || parameterFixture.id.startsWith('fixed-')
          ? 'completeLook'
          : 'normal';
    assert.ok(
      countAiPromptWords(prompt.midjourneyPrompt)
        <= AI_PROMPT_LENGTH_CONTRACT.budgets[budgetKey].softMaxWords,
      `${parameterFixture.id}: ${budgetKey} soft max`
    );
  }
});

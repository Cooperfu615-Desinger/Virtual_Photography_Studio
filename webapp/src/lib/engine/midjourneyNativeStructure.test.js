import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';

import {
  createEmptyLocks,
  createSeededRandom,
  generatePrompts,
  getLockControls,
} from '../engine.js';
import { countAiPromptWords } from './aiPromptLengthContract.js';
import { MIDJOURNEY_NATIVE_STRUCTURE_FIXTURES } from './midjourneyNativeStructureFixtures.js';
import { MIDJOURNEY_PARAMETER_FIXTURES } from './midjourneyParameterFixtures.js';
import {
  parseMidjourneyParameterTail,
  stripMidjourneyParameterTail,
} from './midjourneyParameterTail.js';
import { validatePromptOutputContract } from './promptOutputContracts.js';
import { REPRESENTATIVE_PROMPT_FIXTURES } from './representativePromptFixtures.js';

const controls = getLockControls();

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
  assert.ok(sourceFixture, `${parameterFixture.id} references missing source fixture`);

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

test('phase 5 emits one Midjourney-native description block before the canonical tail', () => {
  for (const target of MIDJOURNEY_NATIVE_STRUCTURE_FIXTURES) {
    const parameterFixture = MIDJOURNEY_PARAMETER_FIXTURES.find(
      (fixture) => fixture.id === target.id
    );
    assert.ok(parameterFixture, `${target.id}: parameter fixture`);
    const { mode, prompt } = generateFixture(parameterFixture);
    const description = stripMidjourneyParameterTail(prompt.midjourneyPrompt);
    const parsedTail = parseMidjourneyParameterTail(prompt.midjourneyPrompt);

    assert.equal(
      description.split(/\n\s*\n/).length,
      1,
      `${target.id}: one descriptive block`
    );
    assert.equal(hashPrompt(description), target.expectedDescriptionHash, `${target.id}: description`);
    assert.equal(countAiPromptWords(description), target.expectedWords, `${target.id}: words`);
    assert.equal(parsedTail.matched, true, `${target.id}: canonical tail`);
    assert.equal(parsedTail.tail, parameterFixture.expectedTail, `${target.id}: expected tail`);
    assert.deepEqual(
      validatePromptOutputContract('midjourneyPrompt', prompt.midjourneyPrompt, { mode }),
      [],
      `${target.id}: output contract`
    );
  }
});

test('phase 5 changes only AI structure and preserves every non-AI baseline', () => {
  for (const parameterFixture of MIDJOURNEY_PARAMETER_FIXTURES) {
    const { prompt } = generateFixture(parameterFixture);

    assert.equal(
      hashPrompt(prompt.grokPrompt),
      parameterFixture.baselineHashes.grokPrompt,
      `${parameterFixture.id}: Gpt`
    );
    assert.equal(
      hashPrompt(prompt.zImagePrompt),
      parameterFixture.baselineHashes.zImagePrompt,
      `${parameterFixture.id}: Grok/Z-Image`
    );
    assert.doesNotMatch(
      prompt.extraPrompts.map((entry) => entry.text).join('\n'),
      /(?:^|\s)--(?:v|ar|raw|s|c|w|sd|hd)(?:\s|$)/,
      `${parameterFixture.id}: fixed-framing outputs`
    );
  }
});

test('phase 5 preserves positive Body Type anchors and canonical pose verbatim', () => {
  const normalFixture = MIDJOURNEY_PARAMETER_FIXTURES.find(
    (fixture) => fixture.id === 'normal-single-precise'
  );
  const poseFixture = MIDJOURNEY_PARAMETER_FIXTURES.find(
    (fixture) => fixture.id === 'canonical-pose-precise'
  );
  const normalPrompt = generateFixture(normalFixture).prompt;
  const posePrompt = generateFixture(poseFixture).prompt;

  assert.match(
    normalPrompt.midjourneyPrompt,
    /Curvy hourglass silhouette, fuller bust, defined waist, rounded hips/
  );
  assert.doesNotMatch(normalPrompt.midjourneyPrompt, /visual height|visual weight|body proportion anchor|torso-to-leg|\b94-58-92\b/);

  const canonicalPose = posePrompt.grokPrompt
    .match(/Pose and Composition:\n([\s\S]*?)(?:\n\n|$)/)?.[1]
    ?.trim();
  assert.ok(canonicalPose);
  assert.ok(posePrompt.zImagePrompt.includes(canonicalPose));
  assert.ok(posePrompt.midjourneyPrompt.includes(canonicalPose));
});

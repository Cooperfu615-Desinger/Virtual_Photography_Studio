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
  getDefaultMidjourneyParameterSettings,
  MIDJOURNEY_PARAMETER_CONTRACT,
  MIDJOURNEY_PARAMETER_CONTRACT_VERSION,
  validateMidjourneyParameterSettings,
} from './midjourneyParameterContract.js';
import { MIDJOURNEY_NATIVE_STRUCTURE_FIXTURES } from './midjourneyNativeStructureFixtures.js';
import { MIDJOURNEY_PARAMETER_FIXTURES } from './midjourneyParameterFixtures.js';
import { stripMidjourneyParameterTail } from './midjourneyParameterTail.js';
import {
  PROMPT_OUTPUT_CONTRACTS,
  validatePromptOutputContract,
} from './promptOutputContracts.js';
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
  assert.ok(control, `${fixtureId} references missing control ${key}`);
  const option = control.options?.find((entry) => entry.zh === selector?.byZh);
  assert.ok(option, `${fixtureId}.${key} cannot resolve ${selector?.byZh}`);
  return option.id;
}

function generateFixture(parameterFixture) {
  const sourceFixture = REPRESENTATIVE_PROMPT_FIXTURES.find(
    (fixture) => fixture.id === parameterFixture.sourceFixtureId
  );
  assert.ok(sourceFixture, `${parameterFixture.id} references missing source fixture`);

  const locks = createAllNoneLocks();
  for (const [key, selector] of Object.entries(sourceFixture.locks)) {
    locks[key] = resolveLock(key, selector, sourceFixture.id);
  }
  locks.aspectRatio = parameterFixture.aspectRatio;
  Object.assign(locks, parameterFixture.futureSettings);

  return {
    mode: sourceFixture.mode,
    prompt: generatePrompts(1, locks, [], {
      random: createSeededRandom(sourceFixture.seed),
    })[0],
  };
}

test('Midjourney parameter contract is frozen serializable rollout policy data', () => {
  assert.equal(MIDJOURNEY_PARAMETER_CONTRACT_VERSION, '1.4.2');
  assert.ok(Object.isFrozen(MIDJOURNEY_PARAMETER_CONTRACT));
  assert.ok(Object.isFrozen(MIDJOURNEY_PARAMETER_CONTRACT.controls.version.options));
  assert.deepEqual(
    JSON.parse(JSON.stringify(MIDJOURNEY_PARAMETER_CONTRACT)),
    MIDJOURNEY_PARAMETER_CONTRACT
  );

  assert.deepEqual(
    MIDJOURNEY_PARAMETER_CONTRACT.parameterHelp.map((help) => help.parameter),
    ['--v', '--ar', '--raw', '--s', '--c', '--w', '--sd', '--hd'],
  );
  assert.match(MIDJOURNEY_PARAMETER_CONTRACT.parameterHelp.find((help) => help.parameter === '--s').description, /越小/);
  assert.match(MIDJOURNEY_PARAMETER_CONTRACT.parameterHelp.find((help) => help.parameter === '--s').description, /越大/);
  assert.deepEqual(MIDJOURNEY_PARAMETER_CONTRACT.applicability.affectsOnly, ['midjourneyPrompt']);
  assert.equal(MIDJOURNEY_PARAMETER_CONTRACT.derivedParameters.aspectRatio.controlOwner, 'F｜MJ 參數設定');
  assert.equal(MIDJOURNEY_PARAMETER_CONTRACT.controls.aspectRatio.selectionKey, 'mjAspectRatio');
  assert.deepEqual(
    MIDJOURNEY_PARAMETER_CONTRACT.controls.aspectRatio.options.map((option) => option.id),
    ['page1', '1:1', '4:3', '3:2', '16:9', '21:9', '2:3', '3:4', '9:16', '1:2', '4:5', '5:4']
  );
  assert.equal(MIDJOURNEY_PARAMETER_CONTRACT.compatibility.preserveCanonicalPoseVerbatim, true);
  assert.equal(MIDJOURNEY_PARAMETER_CONTRACT.compatibility.preserveCurrentBodyTypeDescriptions, true);
  assert.equal(MIDJOURNEY_PARAMETER_CONTRACT.completionGate.behaviorNeutral, true);
  assert.deepEqual(MIDJOURNEY_PARAMETER_CONTRACT.completionGate.preservesHistoricalMappings, {
    Gpt: 'grokPrompt',
    'Grok/Z-Image': 'zImagePrompt',
    AI: 'midjourneyPrompt',
  });
  assert.deepEqual(MIDJOURNEY_PARAMETER_CONTRACT.completionGate.requiredConsumers, [
    'engine',
    'page1GenerationPromptCards',
    'page1DllPromptSources',
    'standardPromptImport',
    'savedCardsFavoriteCodec',
    'savedCardsMarkdownImport',
  ]);
  assert.equal(MIDJOURNEY_PARAMETER_CONTRACT.rollout.phase1.behaviorNeutral, true);
  assert.equal(MIDJOURNEY_PARAMETER_CONTRACT.rollout.phase4.behaviorNeutral, false);
  assert.deepEqual(MIDJOURNEY_PARAMETER_CONTRACT.assembly.descriptionStructure, {
    blockCount: 1,
    sectionSeparator: 'single-space',
    preserveAuthoredTokens: true,
    preserveSectionOrder: true,
  });
  assert.equal(
    MIDJOURNEY_PARAMETER_CONTRACT.assembly.tailPatternSource,
    '--v (?:8\\.2|8\\.1)(?: --ar \\d+:\\d+)?(?: --raw)? --s \\d+ --c \\d+ --w \\d+ --(?:sd|hd)'
  );
});

test('Midjourney parameter defaults, ranges, presets, and ordering are valid', () => {
  const defaults = getDefaultMidjourneyParameterSettings();
  assert.deepEqual(defaults, {
    mjVersionId: 'v8-2',
    mjAspectRatio: 'page1',
    mjRawMode: 'standard',
    mjStylize: 100,
    mjChaos: 0,
    mjWeirdness: 0,
    mjResolution: 'sd',
  });
  assert.deepEqual(validateMidjourneyParameterSettings(defaults), []);
  assert.deepEqual(
    MIDJOURNEY_PARAMETER_CONTRACT.assembly.parameterOrder,
    ['version', 'aspectRatio', 'rawMode', 'stylize', 'chaos', 'weirdness', 'resolution']
  );

  for (const preset of Object.values(MIDJOURNEY_PARAMETER_CONTRACT.presets)) {
    assert.deepEqual(
      validateMidjourneyParameterSettings({ ...defaults, ...preset.values }),
      [],
      preset.label
    );
  }

  assert.deepEqual(
    validateMidjourneyParameterSettings({ ...defaults, mjStylize: 1001 })
      .map((issue) => issue.code),
    ['out-of-range']
  );
  assert.deepEqual(
    validateMidjourneyParameterSettings({ ...defaults, mjRawMode: 'random' })
      .map((issue) => issue.code),
    ['invalid-enum']
  );
});

test('Midjourney phase-1 fixtures cover the approved parameter and prompt boundaries', () => {
  assert.deepEqual(
    new Set(MIDJOURNEY_PARAMETER_FIXTURES.flatMap((fixture) => fixture.coverage)),
    new Set([
      'single',
      'normal-wardrobe',
      'body-type',
      'outfit-preset',
      'complete-look',
      'canonical-pose',
      'character-card',
      'duo',
      'role-bound-wardrobe',
      'fixed-composition',
      'special-outfit',
      'dress',
      'v8.1-compatibility',
    ])
  );
  assert.ok(MIDJOURNEY_PARAMETER_FIXTURES.some((fixture) => fixture.futureSettings.mjRawMode === 'raw'));
  assert.ok(MIDJOURNEY_PARAMETER_FIXTURES.some((fixture) => fixture.futureSettings.mjChaos > 0));
  assert.ok(MIDJOURNEY_PARAMETER_FIXTURES.some((fixture) => fixture.futureSettings.mjResolution === 'hd'));

  for (const fixture of MIDJOURNEY_PARAMETER_FIXTURES) {
    assert.deepEqual(
      validateMidjourneyParameterSettings(fixture.futureSettings),
      [],
      fixture.id
    );
  }
});

test('phase 4 preserves representative content while adding only the approved AI tail', () => {
  for (const fixture of MIDJOURNEY_PARAMETER_FIXTURES) {
    const first = generateFixture(fixture);
    const repeated = generateFixture(fixture);

    assert.equal(first.prompt.selection.aspectRatio, fixture.aspectRatio, `${fixture.id}: aspect ratio`);
    for (const field of ['grokPrompt', 'zImagePrompt']) {
      assert.equal(repeated.prompt[field], first.prompt[field], `${fixture.id}.${field}: deterministic`);
      assert.equal(
        hashPrompt(first.prompt[field]),
        fixture.baselineHashes[field],
        `${fixture.id}.${field}: baseline`
      );
      assert.deepEqual(
        validatePromptOutputContract(field, first.prompt[field], { mode: first.mode }),
        [],
        `${fixture.id}.${field}: public contract`
      );
    }

    assert.equal(repeated.prompt.midjourneyPrompt, first.prompt.midjourneyPrompt);
    const nativeTarget = MIDJOURNEY_NATIVE_STRUCTURE_FIXTURES.find(
      (target) => target.id === fixture.id
    );
    assert.ok(nativeTarget, `${fixture.id}: native structure fixture`);
    assert.equal(
      hashPrompt(stripMidjourneyParameterTail(first.prompt.midjourneyPrompt)),
      nativeTarget.expectedDescriptionHash,
      `${fixture.id}.midjourneyPrompt: native descriptive baseline`
    );
    assert.equal(
      first.prompt.midjourneyPrompt.endsWith(fixture.expectedTail),
      true,
      `${fixture.id}: parameter tail`
    );
    assert.deepEqual(
      validatePromptOutputContract('midjourneyPrompt', first.prompt.midjourneyPrompt, {
        mode: first.mode,
      }),
      [],
      `${fixture.id}.midjourneyPrompt: public contract`
    );
  }
});

test('phase 1 preserves source-derived positive Body Type anchors and exact canonical pose reuse', () => {
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
  assert.equal(PROMPT_OUTPUT_CONTRACTS.midjourneyPrompt.field, 'midjourneyPrompt');
});

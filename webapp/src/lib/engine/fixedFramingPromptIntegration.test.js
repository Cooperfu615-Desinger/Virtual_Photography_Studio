import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createEmptyLocks,
  createSeededRandom,
  generatePrompts,
  getLockControls,
  getSceneDependentOptions,
  normalizeLocks,
} from '../engine.js';
import { buildPage1ControlGroups } from '../../features/page1/page1Selectors.js';
import {
  buildPage1DllPromptSources,
  buildPage1GenerationPromptCards,
} from '../page1PromptOutputs.js';
import {
  PROMPT_OUTPUT_CONTRACTS,
  validatePromptOutputContract,
} from './promptOutputContracts.js';
import { FIXED_FRAMING_MAIN_OPTION_POLICY } from './fixedFramingDerivedPromptContract.js';
import {
  FIXED_FRAMING_PHASE6_LEGACY_RESTORE_MATRIX,
  FIXED_FRAMING_PHASE6_SINGLE_MATRIX,
} from './fixedFramingPromptIntegrationFixtures.js';

const controls = getLockControls();
const controlsByKey = new Map(controls.map((control) => [control.key, control]));
const PRIMARY_FIELDS = ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt'];
const SIX_OUTPUT_IDS = [
  'gpt',
  'grok',
  'ai',
  'chest-up-portrait',
  'chest-up-mj-portrait',
  'full-body-character',
];

function optionId(key, zh) {
  const option = controlsByKey.get(key)?.options?.find((entry) => entry.zh === zh);
  assert.ok(option, `Missing ${key} option ${zh}`);
  return option.id;
}

function createAllNoneLocks(subjectCount = '1') {
  const locks = {
    ...createEmptyLocks(),
    subjectCount,
  };
  for (const control of controls) {
    const noneOption = control.options?.find((entry) => entry.zh === '全無');
    if (noneOption) locks[control.key] = noneOption.id;
  }
  return locks;
}

function materializeSingleFixture(fixture) {
  const locks = createAllNoneLocks();
  locks.framingId = optionId('framingId', fixture.framingZh);
  for (const [key, zh] of Object.entries(fixture.locks)) {
    locks[key] = optionId(key, zh);
  }
  return locks;
}

function extraText(prompt, id) {
  return prompt.extraPrompts?.find((entry) => entry.id === id)?.text || '';
}

function readContractText(prompt, contract) {
  if (contract.source.kind === 'field') return prompt[contract.source.key] || '';
  return extraText(prompt, contract.source.id);
}

function assertFragments(text, fragments, expected, label) {
  const lowerText = text.toLowerCase();
  for (const fragment of fragments) {
    assert.equal(
      lowerText.includes(fragment.toLowerCase()),
      expected,
      `${label}: ${expected ? 'include' : 'exclude'} ${fragment}`,
    );
  }
}

function getPage1FramingControl(locks) {
  const { coreLockControls } = buildPage1ControlGroups({
    lockControls: controls,
    locks,
    sceneDependentOptions: getSceneDependentOptions([], locks),
  });
  const framingControl = coreLockControls.find((control) => control.key === 'framingId');
  assert.ok(framingControl, 'Missing PAGE1 framing control');
  return framingControl;
}

function assertAllOutputContracts(prompt, mode) {
  for (const [field, contract] of Object.entries(PROMPT_OUTPUT_CONTRACTS)) {
    const issues = validatePromptOutputContract(field, readContractText(prompt, contract), { mode });
    assert.deepEqual(issues, [], `${field}:\n${JSON.stringify(issues, null, 2)}`);
  }
}

test('phase-6 current main framings preserve one resolved source across all six single outputs', () => {
  for (const fixture of FIXED_FRAMING_PHASE6_SINGLE_MATRIX) {
    const locks = materializeSingleFixture(fixture);
    const [prompt] = generatePrompts(1, locks, [], {
      random: createSeededRandom(fixture.seed),
    });

    assert.equal(prompt.selection.framingId, locks.framingId, `${fixture.id}: framing selection`);
    for (const key of Object.keys(fixture.locks)) {
      assert.equal(prompt.selection[key], locks[key], `${fixture.id}: ${key} selection`);
    }
    assertAllOutputContracts(prompt, 'single');
    assert.deepEqual(
      buildPage1GenerationPromptCards(prompt).map((entry) => entry.id),
      SIX_OUTPUT_IDS,
      `${fixture.id}: PAGE1 cards`,
    );
    assert.deepEqual(
      buildPage1DllPromptSources(prompt).map((entry) => entry.id),
      SIX_OUTPUT_IDS,
      `${fixture.id}: DLL sources`,
    );

    for (const field of PRIMARY_FIELDS) {
      const primaryIncludes = field === 'midjourneyPrompt'
        ? fixture.aiPrimaryIncludes || fixture.primaryIncludes
        : fixture.primaryIncludes;
      assertFragments(prompt[field], primaryIncludes, true, `${fixture.id}.${field}`);
      assertFragments(prompt[field], fixture.primaryExcludes, false, `${fixture.id}.${field}`);
    }
    assertFragments(extraText(prompt, 'chest-up-portrait'), fixture.chestIncludes, true, `${fixture.id}.chest`);
    assertFragments(extraText(prompt, 'chest-up-portrait'), fixture.chestExcludes, false, `${fixture.id}.chest`);
    assertFragments(extraText(prompt, 'chest-up-mj-portrait'), fixture.chestIncludes, true, `${fixture.id}.mjChest`);
    assertFragments(extraText(prompt, 'chest-up-mj-portrait'), fixture.chestExcludes, false, `${fixture.id}.mjChest`);
    assertFragments(extraText(prompt, 'full-body-character'), fixture.fullBodyIncludes, true, `${fixture.id}.fullBody`);
    assert.equal(extraText(prompt, 'facial-closeup-portrait'), '', `${fixture.id}: retired face output`);
  }
});

test('phase-6 every retired framing remains restorable and contract-valid without rejoining the current selector', () => {
  for (const fixture of FIXED_FRAMING_PHASE6_LEGACY_RESTORE_MATRIX) {
    const framingId = optionId('framingId', fixture.framingZh);
    const locks = normalizeLocks({
      ...createAllNoneLocks(),
      framingId,
      topId: optionId('topId', '襯衫'),
      pantsId: optionId('pantsId', '直筒牛仔褲'),
    }, controls);
    const framingControl = getPage1FramingControl(locks);
    const restored = framingControl.options.find((option) => option.id === framingId);
    const [prompt] = generatePrompts(1, locks, [], {
      random: createSeededRandom(fixture.seed),
    });

    assert.ok(restored, `${fixture.framingZh}: restore-only option`);
    assert.equal(restored.disabled, true, `${fixture.framingZh}: disabled`);
    assert.equal(prompt.selection.framingId, framingId, `${fixture.framingZh}: generated selection`);
    assert.deepEqual(buildPage1GenerationPromptCards(prompt).map((entry) => entry.id), SIX_OUTPUT_IDS);
    assertAllOutputContracts(prompt, 'single');
  }
});

test('phase-6 unlocked single, Character Card, and duo generation cannot resolve a retired framing', () => {
  const allowedIds = new Set(
    FIXED_FRAMING_MAIN_OPTION_POLICY.visible
      .filter((option) => option.randomCandidate)
      .map((option) => option.id),
  );
  const modes = [
    { id: 'single', subjectCount: '1' },
    { id: 'character-card', subjectCount: '1', characterProfileId: 'character-kaori' },
    { id: 'duo', subjectCount: '2' },
  ];

  for (const mode of modes) {
    for (let index = 0; index < 32; index += 1) {
      const locks = createAllNoneLocks(mode.subjectCount);
      locks.framingId = '';
      if (mode.characterProfileId) locks.characterProfileId = mode.characterProfileId;
      if (mode.subjectCount === '2') {
        locks.duoPoseId = optionId('duoPoseId', '充滿情慾的時尚寫真');
        locks.duoPoseBaseId = optionId('duoPoseBaseId', '站姿');
      }
      const [prompt] = generatePrompts(1, locks, [], {
        random: createSeededRandom(`fixed-framing-phase6-${mode.id}-${index}`),
      });

      assert.equal(allowedIds.has(prompt.selection.framingId), true, `${mode.id}: ${prompt.selection.framingId}`);
      assertAllOutputContracts(prompt, mode.subjectCount === '2' ? 'duo' : 'single');
    }
  }
});

test('phase-6 fixed-composition and duo boundaries remain independent from single fixed-framing outputs', () => {
  const fixedLocks = createAllNoneLocks();
  fixedLocks.fixedCompositionSetId = optionId('fixedCompositionSetId', '暖灰泥黑絲絨工業沙發棚');
  fixedLocks.fixedSetPositionId = optionId('fixedSetPositionId', '自由場景互動');
  fixedLocks.topId = optionId('topId', '棉質細肩背心');
  const [fixedPrompt] = generatePrompts(1, fixedLocks, [], {
    random: createSeededRandom('fixed-framing-phase6-fixed-composition-v1'),
  });

  assert.equal(fixedPrompt.selection.framingId, fixedLocks.framingId);
  assert.deepEqual(buildPage1GenerationPromptCards(fixedPrompt).map((entry) => entry.id), SIX_OUTPUT_IDS);
  assertAllOutputContracts(fixedPrompt, 'single');

  const duoLocks = createAllNoneLocks('2');
  duoLocks.framingId = optionId('framingId', '全身鏡頭 (Full Body Shot)');
  duoLocks.duoPoseId = optionId('duoPoseId', '充滿情慾的時尚寫真');
  duoLocks.duoPoseBaseId = optionId('duoPoseBaseId', '站姿');
  const [duoPrompt] = generatePrompts(1, duoLocks, [], {
    random: createSeededRandom('fixed-framing-phase6-duo-boundary-v1'),
  });

  assert.deepEqual(duoPrompt.extraPrompts, []);
  assert.deepEqual(
    buildPage1GenerationPromptCards(duoPrompt).map((entry) => entry.id),
    ['gpt', 'grok', 'ai'],
  );
  assertAllOutputContracts(duoPrompt, 'duo');
});

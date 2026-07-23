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
  AI_PROMPT_SECTION_ORDER,
  createAiPromptSectionModel,
  renderAiPromptSectionModel,
  resolveAiPromptPolicyKey,
} from './aiPromptBudget.js';
import { AI_PROMPT_LENGTH_FIXTURES } from './aiPromptLengthFixtures.js';

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

test('budget policy selection keeps Character Card precedence and complete-look isolation', () => {
  assert.equal(resolveAiPromptPolicyKey(), 'normal');
  assert.equal(resolveAiPromptPolicyKey({ completeLook: true }), 'completeLook');
  assert.equal(resolveAiPromptPolicyKey({ characterCard: true }), 'characterCard');
  assert.equal(
    resolveAiPromptPolicyKey({ characterCard: true, completeLook: true }),
    'characterCard'
  );
});

test('phase-2 section boundary preserves every phase-1 AI output byte-for-byte', () => {
  for (const fixture of AI_PROMPT_LENGTH_FIXTURES) {
    const output = generateFixture(fixture).midjourneyPrompt;
    const hash = createHash('sha256').update(output).digest('hex');
    assert.equal(hash, PHASE_1_BASELINE_HASHES[fixture.id], fixture.id);
  }
});


import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createEmptyLocks,
  createSeededRandom,
  generatePrompts,
  getLockControls,
} from '../engine.js';
import { PROMPT_OUTPUT_CONTRACTS } from './promptOutputContracts.js';
import {
  FIXED_FRAMING_DERIVED_PROMPT_CONTRACT,
  FIXED_FRAMING_DERIVED_PROMPT_CONTRACT_VERSION,
  FIXED_FRAMING_MAIN_OPTION_POLICY,
  HALF_FACE_COMPOSITION_TARGET,
} from './fixedFramingDerivedPromptContract.js';
import {
  FIXED_FRAMING_DERIVED_PROMPT_FIXTURES,
  HALF_FACE_COMPOSITION_REGRESSION_FIXTURES,
} from './fixedFramingDerivedPromptFixtures.js';

const controls = getLockControls();
const controlsByKey = new Map(controls.map((control) => [control.key, control]));

function resolveSelector(key, selector, fixtureId) {
  if (key === 'subjectCount') return selector;
  const control = controlsByKey.get(key);
  assert.ok(control, `${fixtureId}: missing control ${key}`);
  const option = typeof selector === 'object' && selector?.byZh
    ? control.options.find((entry) => entry.zh === selector.byZh)
    : control.options.find((entry) => entry.id === selector);
  assert.ok(option, `${fixtureId}: cannot resolve ${key} ${JSON.stringify(selector)}`);
  return option.id;
}

function materializeLocks(fixture) {
  const locks = { ...createEmptyLocks() };
  for (const [key, selector] of Object.entries(fixture.locks)) {
    locks[key] = resolveSelector(key, selector, fixture.id);
  }
  return locks;
}

test('phase-1 fixed-framing contract is frozen serializable target data', () => {
  assert.equal(FIXED_FRAMING_DERIVED_PROMPT_CONTRACT_VERSION, 1);
  assert.equal(FIXED_FRAMING_DERIVED_PROMPT_CONTRACT.runtimeConnected, false);
  assert.ok(Object.isFrozen(FIXED_FRAMING_DERIVED_PROMPT_CONTRACT));
  assert.ok(Object.isFrozen(FIXED_FRAMING_DERIVED_PROMPT_CONTRACT.outputs.facialCloseupPortrait.wardrobe.roles));
  assert.deepEqual(
    JSON.parse(JSON.stringify(FIXED_FRAMING_DERIVED_PROMPT_CONTRACT)),
    FIXED_FRAMING_DERIVED_PROMPT_CONTRACT,
  );
  assert.equal(PROMPT_OUTPUT_CONTRACTS.fullBodyCharacterPrompt.source.id, 'full-body-character');
  assert.equal(
    FIXED_FRAMING_DERIVED_PROMPT_CONTRACT.outputs.fullBodyCharacterCompatibility.id,
    PROMPT_OUTPUT_CONTRACTS.fullBodyCharacterPrompt.source.id,
  );
});

test('phase-1 main framing policy partitions every existing option without changing legacy ids', () => {
  const framingOptions = controlsByKey.get('framingId')?.options.filter((option) => !option.random) || [];
  const targetEntries = [
    ...FIXED_FRAMING_MAIN_OPTION_POLICY.visible,
    ...FIXED_FRAMING_MAIN_OPTION_POLICY.legacyHidden,
  ];

  assert.equal(new Set(targetEntries.map((entry) => entry.id)).size, targetEntries.length);
  assert.deepEqual(
    new Set(targetEntries.map((entry) => entry.id)),
    new Set(framingOptions.map((entry) => entry.id)),
  );
  for (const target of targetEntries) {
    const current = framingOptions.find((option) => option.id === target.id);
    assert.ok(current, target.id);
    assert.equal(current.zh, target.zh, target.id);
  }

  assert.deepEqual(
    FIXED_FRAMING_MAIN_OPTION_POLICY.visible.filter((entry) => entry.randomCandidate).map((entry) => entry.zh),
    ['半臉傾斜特寫', '中景鏡頭 (Medium Shot)', '牛仔中景 (Cowboy Shot)', '全身鏡頭 (Full Body Shot)'],
  );
  assert.deepEqual(FIXED_FRAMING_MAIN_OPTION_POLICY.legacyRestore, {
    preserveIds: true,
    remainResolvable: true,
    preserveStoredSelection: true,
    participateInNewRandomSelection: false,
  });
});

test('phase-1 derived output policies record the approved face and chest boundaries', () => {
  const face = FIXED_FRAMING_DERIVED_PROMPT_CONTRACT.outputs.facialCloseupPortrait;
  const chest = FIXED_FRAMING_DERIVED_PROMPT_CONTRACT.outputs.chestUpPortrait;

  assert.equal(face.id, 'facial-closeup-portrait');
  assert.equal(face.aspectRatio, '1:1');
  assert.equal(face.visibilityBucket, 'faceDetail');
  assert.equal(face.body.mode, 'omit');
  assert.equal(face.pose.mode, 'omit');
  assert.equal(face.wardrobe.upperGarmentRequired, true);
  assert.equal(face.wardrobe.fallbackText, 'a simple opaque crew-neck top');
  assert.deepEqual(face.wardrobe.roles, ['top', 'dress', 'outerwear', 'headAccessory', 'eyewear', 'earrings', 'neckAccessory']);
  assert.equal(face.forbiddenSections.includes('Pose and Composition'), true);

  assert.equal(chest.id, 'chest-up-portrait');
  assert.equal(chest.aspectRatio, '4:5');
  assert.equal(chest.visibilityBucket, 'chestUp');
  assert.deepEqual(chest.body, { mode: 'visibleZones', zones: ['chest'] });
  assert.equal(chest.pose.mode, 'projectedCanonical');
  assert.deepEqual(chest.pose.parts, ['head', 'upperBody']);
  assert.deepEqual(chest.pose.conditionalParts, ['hand', 'prop', 'anchor', 'contactWeight']);
  assert.equal(chest.scene.mode, 'compactSource');

  for (const output of [face, chest]) {
    assert.equal(output.scene.preserveLocationIdentity, true);
    assert.equal(output.scene.preserveSourceAnchors, true);
  }
  assert.deepEqual(FIXED_FRAMING_DERIVED_PROMPT_CONTRACT.shared.fixedCompositionScene, {
    preserveSceneIdentityAndSourceAnchors: true,
    omitConflictingFixedCameraDistance: true,
    derivedFramingOverridesFixedSetDistance: true,
  });
});

test('phase-1 deterministic fixtures resolve controls and cover every approved compatibility boundary', () => {
  const ids = new Set();
  const coverage = new Set();

  for (const fixture of FIXED_FRAMING_DERIVED_PROMPT_FIXTURES) {
    assert.equal(ids.has(fixture.id), false, `duplicate fixture ${fixture.id}`);
    ids.add(fixture.id);
    fixture.coverage.forEach((entry) => coverage.add(entry));
    const locks = materializeLocks(fixture);
    for (const key of fixture.expected.preserveRawLockKeys || []) {
      assert.equal(Boolean(locks[key]), true, `${fixture.id}: ${key}`);
    }
  }

  for (const expectedCoverage of [
    'single',
    'duo',
    'facialCloseupPortrait',
    'chestUpPortrait',
    'normalWardrobe',
    'specialOutfit',
    'outfitPreset',
    'dress',
    'characterCard',
    'upperGarmentFallback',
    'fixedCompositionScene',
    'pose',
    'scene',
    'imaging',
    'viewpointCompatibility',
    'selectionPreservation',
    'unsupportedMode',
  ]) {
    assert.equal(coverage.has(expectedCoverage), true, expectedCoverage);
  }
});

test('phase-1 half-face target resolves one explicit edge with opposite negative space and visible upper body', () => {
  const framing = controlsByKey.get('framingId')?.options.find((option) => option.id === HALF_FACE_COMPOSITION_TARGET.framingId);
  assert.ok(framing);
  assert.equal(framing.zh, HALF_FACE_COMPOSITION_TARGET.framingZh);
  assert.equal(framing.en, HALF_FACE_COMPOSITION_TARGET.legacySourceText);
  assert.equal(HALF_FACE_COMPOSITION_TARGET.resolutionMode, 'seededSinglePlacementVariant');
  assert.equal(HALF_FACE_COMPOSITION_TARGET.shareResolvedOpeningAcrossPrimaryOutputs, true);
  assert.equal(HALF_FACE_COMPOSITION_TARGET.placementVariants.length, 2);

  const variantsById = new Map(HALF_FACE_COMPOSITION_TARGET.placementVariants.map((variant) => [variant.id, variant]));
  for (const fixture of HALF_FACE_COMPOSITION_REGRESSION_FIXTURES) {
    const variant = variantsById.get(fixture.resolvedPlacementId);
    assert.ok(variant, fixture.id);
    assert.match(variant.opening, /subject placed flush against the far (?:left|right) frame edge/i);
    assert.match(variant.opening, /vertical frame boundary cropping through the outer half of the face/i);
    assert.match(variant.opening, /broad negative space on the (?:left|right)/i);
    assert.match(variant.opening, /neck, shoulders, and upper torso visible/i);
    assert.equal(variant.opening.includes('left or right'), false);
  }
});

test('phase-1 remains behavior-neutral until the derived renderer phase', () => {
  const fixture = FIXED_FRAMING_DERIVED_PROMPT_FIXTURES.find((entry) => entry.id === 'chest-up-normal-separates-pose-scene-imaging');
  const locks = materializeLocks(fixture);
  const [prompt] = generatePrompts(1, locks, [], {
    random: createSeededRandom(fixture.seed),
  });
  const extraIds = prompt.extraPrompts.map((entry) => entry.id);

  assert.equal(extraIds.includes('full-body-character'), true);
  assert.equal(extraIds.includes('facial-closeup-portrait'), false);
  assert.equal(extraIds.includes('chest-up-portrait'), false);
  assert.equal(prompt.selection.framingId, locks.framingId);
});

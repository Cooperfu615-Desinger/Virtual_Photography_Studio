import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createEmptyLocks,
  createSeededRandom,
  generatePrompts,
  getLockControls,
} from '../engine.js';
import { COMPOSITION_VISIBILITY_REGRESSION_FIXTURES } from './compositionVisibilityFixtures.js';

const controlsByKey = new Map(getLockControls().map((control) => [control.key, control]));
const MAIN_OUTPUT_FIELDS = ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt'];
const PHASE_FOUR_FIXTURE_IDS = [
  'head-shoulders-pose-scene-pressure',
  'chest-up-visible-pose-fragments',
  'medium-pose-base-fallback',
  'medium-hidden-lower-hand-action',
  'cowboy-pose-without-foot-action',
  'full-body-complete-composition',
];

function resolveFixture(fixtureId, overrides = {}) {
  const fixture = COMPOSITION_VISIBILITY_REGRESSION_FIXTURES.find((entry) => entry.id === fixtureId);
  assert.ok(fixture, `Missing composition visibility fixture ${fixtureId}`);
  const locks = { ...createEmptyLocks() };

  for (const [key, selector] of Object.entries(fixture.locks)) {
    const control = controlsByKey.get(key);
    const option = typeof selector === 'object' && selector?.byZh
      ? control?.options.find((entry) => entry.zh === selector.byZh)
      : control?.options.find((entry) => entry.id === selector);
    assert.ok(option, `${fixtureId}: cannot resolve ${key}`);
    locks[key] = option.id;
  }

  return { fixture, locks: { ...locks, ...overrides } };
}

function generateFixture(fixtureId, overrides = {}) {
  const { fixture, locks } = resolveFixture(fixtureId, overrides);
  const [prompt] = generatePrompts(1, locks, [], {
    random: createSeededRandom(fixture.seed),
  });
  return { fixture, locks, prompt };
}

function canonicalPose(prompt) {
  return prompt.grokPrompt.match(/Pose and Composition:\n([^\n]+)/)?.[1] || '';
}

function countOccurrences(text, fragment) {
  if (!fragment) return 0;
  return text.split(fragment).length - 1;
}

for (const fixtureId of PHASE_FOUR_FIXTURE_IDS) {
  test(`${fixtureId} applies one shared composition-projected canonical pose`, () => {
    const { fixture, locks, prompt } = generateFixture(fixtureId);
    const expected = fixture.expectedProjection.mainPrompt;
    const pose = canonicalPose(prompt);

    for (const key of fixture.expectedProjection.preserveRawLockKeys) {
      assert.equal(prompt.selection[key], locks[key], `${fixtureId}: ${key} should survive generation`);
    }

    if (expected.poseMode === 'omit') {
      assert.equal(pose, '', `${fixtureId}: Gpt should omit the pose section`);
    } else {
      assert.notEqual(pose, '', `${fixtureId}: Gpt should expose a projected canonical pose`);
      assert.equal(countOccurrences(prompt.zImagePrompt, pose), 1, `${fixtureId}: Grok/Z-Image should reuse the canonical pose once`);
      assert.equal(countOccurrences(prompt.midjourneyPrompt, pose), 1, `${fixtureId}: AI should reuse the canonical pose once`);
    }

    for (const field of MAIN_OUTPUT_FIELDS) {
      const text = prompt[field] || '';
      for (const fragment of expected.poseIncludes || []) {
        assert.equal(text.toLowerCase().includes(fragment.toLowerCase()), true, `${fixtureId}: ${field} should include ${fragment}`);
      }
      for (const fragment of expected.poseExcludes || []) {
        assert.equal(text.toLowerCase().includes(fragment.toLowerCase()), false, `${fixtureId}: ${field} should exclude ${fragment}`);
      }
    }
  });
}

test('returning a projected medium pose to full body restores the unchanged source canonical pose', () => {
  const { locks: mediumLocks, prompt: mediumPrompt } = generateFixture('medium-pose-base-fallback');
  const fullBodyFraming = controlsByKey.get('framingId').options.find((option) => option.zh === '全身鏡頭 (Full Body Shot)');
  assert.ok(fullBodyFraming);

  const [fullPrompt] = generatePrompts(1, {
    ...mediumLocks,
    framingId: fullBodyFraming.id,
  }, [], {
    random: createSeededRandom('composition-visibility-medium-pose-v1'),
  });

  assert.doesNotMatch(canonicalPose(mediumPrompt), /one foot pointed forward|mirrored stainless-steel cube plinth/i);
  assert.match(canonicalPose(fullPrompt), /one foot pointed forward/i);
  assert.match(canonicalPose(fullPrompt), /mirrored stainless-steel cube plinth/i);
  for (const key of ['poseBaseId', 'poseArrangementId', 'poseHandId', 'posePropId', 'poseHeadId', 'poseAnchorId']) {
    assert.equal(fullPrompt.selection[key], mediumLocks[key], `${key} should remain unchanged after widening the framing`);
  }
});

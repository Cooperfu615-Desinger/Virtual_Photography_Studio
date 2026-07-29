import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createEmptyLocks,
  createSeededRandom,
  generatePrompts,
  getLockControls,
} from '../engine.js';
import { COMPOSITION_VISIBILITY_REGRESSION_FIXTURES } from './compositionVisibilityFixtures.js';
import { stripMidjourneyParameterTail } from './midjourneyParameterTail.js';

const controlsByKey = new Map(getLockControls().map((control) => [control.key, control]));
const PHASE_FIVE_FIXTURE_IDS = [
  'head-shoulders-pose-scene-pressure',
  'face-detail-source-scene-only',
  'chest-up-outfit-preset',
  'medium-scene-concise-source',
  'medium-duo-role-visibility',
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

function gptScene(prompt) {
  return prompt.grokPrompt.match(/(?:^|\n\n)Scene:\n([\s\S]*?)(?=\n\n(?:Lighting|Camera Look):\n|\n\nmulti-cut sequence n=2$|$)/)?.[1] || '';
}

function zImageScene(prompt) {
  const labeled = prompt.zImagePrompt.match(/(?:^|\n\n)Scene:\n([\s\S]*?)(?=\n\n(?:Lighting|Camera Look):\n|$)/)?.[1] || '';
  if (labeled) return labeled;
  return prompt.zImagePrompt.split(/\n{2,}/).find((paragraph) => paragraph.startsWith('Scene:')) || '';
}

function aiScene(prompt) {
  const text = stripMidjourneyParameterTail(prompt.midjourneyPrompt);
  const labeled = text.match(
    /(?:^|\s)Scene:\s*([\s\S]*?)(?=\s+(?:Lighting|Camera Look):\s*|$)/
  )?.[1];
  if (labeled) return labeled;
  return text.match(/(?:^|\s)(In [\s\S]*?)(?=\s+Inspired by\s|$)/)?.[1] || '';
}

function assertIncludes(text, fragment, message) {
  assert.equal(text.toLowerCase().includes(fragment.toLowerCase()), true, message);
}

function assertExcludes(text, fragment, message) {
  assert.equal(text.toLowerCase().includes(fragment.toLowerCase()), false, message);
}

for (const fixtureId of PHASE_FIVE_FIXTURE_IDS) {
  test(`${fixtureId} projects source-traceable scene content by composition`, () => {
    const { fixture, locks, prompt } = generateFixture(fixtureId);
    const expected = fixture.expectedProjection.mainPrompt;
    const scenes = {
      grokPrompt: gptScene(prompt),
      zImagePrompt: zImageScene(prompt),
      midjourneyPrompt: aiScene(prompt),
    };

    for (const key of fixture.expectedProjection.preserveRawLockKeys) {
      assert.equal(prompt.selection[key], locks[key], `${fixtureId}: ${key} should survive generation`);
    }

    for (const [field, scene] of Object.entries(scenes)) {
      assert.notEqual(scene, '', `${fixtureId}: ${field} should expose a scene sentence`);
      for (const fragment of expected.sceneIncludes || []) {
        assertIncludes(scene, fragment, `${fixtureId}: ${field} scene should include ${fragment}`);
      }
      for (const fragment of expected.sceneExcludes || []) {
        assertExcludes(scene, fragment, `${fixtureId}: ${field} scene should exclude ${fragment}`);
      }
      if (expected.addDepthEffect === false) {
        assert.doesNotMatch(scene, /softly blurred|shallow depth of field|faint spatial shapes/i, `${fixtureId}: ${field} must not invent depth treatment`);
      }
    }

    for (const fragment of expected.gptSceneIncludes || []) {
      assertIncludes(scenes.grokPrompt, fragment, `${fixtureId}: Gpt scene should include ${fragment}`);
    }

    for (const field of ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt']) {
      for (const fragment of expected.publicSceneControlExcludes || []) {
        assertExcludes(prompt[field], fragment, `${fixtureId}: ${field} should not expose scene control text ${fragment}`);
      }
    }
  });
}

test('widening a concise projected scene restores the complete source without changing the stored location', () => {
  const { locks: mediumLocks, prompt: mediumPrompt } = generateFixture('medium-scene-concise-source');
  const fullBodyFraming = controlsByKey.get('framingId').options.find((option) => option.zh === '全身鏡頭 (Full Body Shot)');
  assert.ok(fullBodyFraming);

  const [fullPrompt] = generatePrompts(1, {
    ...mediumLocks,
    framingId: fullBodyFraming.id,
  }, [], {
    random: createSeededRandom('composition-visibility-medium-scene-v1'),
  });

  assert.doesNotMatch(gptScene(mediumPrompt), /dense skyline towers|asymmetric metropolitan overlook/i);
  assert.match(gptScene(fullPrompt), /dense skyline towers/i);
  assert.match(gptScene(fullPrompt), /asymmetric metropolitan overlook/i);
  assert.equal(fullPrompt.selection.locationId, mediumLocks.locationId);
});

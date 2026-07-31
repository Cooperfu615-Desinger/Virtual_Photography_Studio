import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';

import {
  createEmptyLocks,
  createSeededRandom,
  generatePrompts,
  getLockControls,
} from '../engine.js';
import { parseLocksFromStandardPrompt } from '../../features/saved-cards/cardCodec.js';
import { countAiPromptWords } from './aiPromptLengthContract.js';
import { MIDJOURNEY_NATIVE_STRUCTURE_FIXTURES } from './midjourneyNativeStructureFixtures.js';
import {
  MIDJOURNEY_ASPECT_RATIO_FIXTURES,
  MIDJOURNEY_PARAMETER_FIXTURES,
} from './midjourneyParameterFixtures.js';
import {
  appendMidjourneyParameterTail,
  buildMidjourneyParameterTail,
  parseMidjourneyParameterTail,
  stripMidjourneyParameterTail,
} from './midjourneyParameterTail.js';
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

  return generatePrompts(1, locks, [], {
    random: createSeededRandom(sourceFixture.seed),
  })[0];
}

test('phase 4 assembles one normalized Midjourney tail in contract order', () => {
  assert.equal(buildMidjourneyParameterTail({
    mjVersionId: 'v8-1',
    mjAspectRatio: '4:5',
    mjRawMode: 'raw',
    mjStylize: 49.6,
    mjChaos: 18,
    mjWeirdness: 47,
    mjResolution: 'hd',
  }), '--v 8.1 --ar 4:5 --raw --s 50 --c 18 --w 47 --hd');

  assert.equal(buildMidjourneyParameterTail({
    mjVersionId: 'invalid',
    mjAspectRatio: 'page1',
    aspectRatio: 'none',
    mjRawMode: 'invalid',
    mjStylize: 5000,
    mjChaos: -1,
    mjWeirdness: '',
    mjResolution: 'invalid',
  }), '--v 8.2 --s 1000 --c 0 --w 0 --sd');
});

test('phase 7 allows the F AI ratio to differ from the PAGE1 composition ratio', () => {
  for (const fixture of MIDJOURNEY_ASPECT_RATIO_FIXTURES) {
    assert.equal(
      buildMidjourneyParameterTail({
        aspectRatio: fixture.page1AspectRatio,
        mjAspectRatio: fixture.mjAspectRatio,
      }),
      fixture.expectedTail,
      fixture.id,
    );
  }
});

test('phase 4 appends, parses, and replaces only the final parameter tail', () => {
  const content = 'Create a photorealistic editorial portrait.\n\nA compact description.';
  const settings = {
    mjVersionId: 'v8-1',
    mjAspectRatio: '9:16',
    aspectRatio: '4:5',
    mjRawMode: 'raw',
    mjStylize: 333,
    mjChaos: 18,
    mjWeirdness: 47,
    mjResolution: 'hd',
  };
  const output = appendMidjourneyParameterTail(content, settings);

  assert.equal(
    output,
    `${content} --v 8.1 --ar 9:16 --raw --s 333 --c 18 --w 47 --hd`
  );
  assert.equal(stripMidjourneyParameterTail(output), content);
  assert.deepEqual(parseMidjourneyParameterTail(output), {
    matched: true,
    content,
    aspectRatio: '9:16',
    settings: {
      mjVersionId: 'v8-1',
      mjAspectRatio: '9:16',
      mjRawMode: 'raw',
      mjStylize: 333,
      mjChaos: 18,
      mjWeirdness: 47,
      mjResolution: 'hd',
    },
    tail: '--v 8.1 --ar 9:16 --raw --s 333 --c 18 --w 47 --hd',
  });
  assert.deepEqual(parseMidjourneyParameterTail(`${output}\ntext after parameters`), {
    matched: false,
    content: `${output}\ntext after parameters`,
    aspectRatio: '',
    settings: null,
    tail: '',
  });
});

test('phase 4 appends parameters only to AI while preserving descriptive baselines', () => {
  for (const fixture of MIDJOURNEY_PARAMETER_FIXTURES) {
    const prompt = generateFixture(fixture);
    const content = stripMidjourneyParameterTail(prompt.midjourneyPrompt);
    const nativeTarget = MIDJOURNEY_NATIVE_STRUCTURE_FIXTURES.find(
      (target) => target.id === fixture.id
    );

    assert.equal(prompt.midjourneyPrompt.endsWith(fixture.expectedTail), true, fixture.id);
    assert.ok(nativeTarget, `${fixture.id}: native structure fixture`);
    assert.equal(hashPrompt(content), nativeTarget.expectedDescriptionHash, `${fixture.id}: AI content`);
    assert.equal(hashPrompt(prompt.grokPrompt), fixture.baselineHashes.grokPrompt, `${fixture.id}: Gpt`);
    assert.equal(hashPrompt(prompt.zImagePrompt), fixture.baselineHashes.zImagePrompt, `${fixture.id}: Grok/Z`);
    assert.doesNotMatch(
      prompt.extraPrompts.map((entry) => entry.text).join('\n'),
      /(?:^|\s)--(?:v|ar|raw|s|c|w|sd|hd)(?:\s|$)/,
      `${fixture.id}: derived outputs`
    );
    assert.equal(countAiPromptWords(prompt.midjourneyPrompt), countAiPromptWords(content), fixture.id);
  }
});

test('phase 4 restores F settings and aspect ratio from a standard AI Prompt tail', () => {
  const parsed = parseLocksFromStandardPrompt(
    'Create a portrait. --v 8.1 --ar 3:4 --raw --s 333 --c 18 --w 47 --hd',
    controls
  );

  assert.deepEqual({
    mjVersionId: parsed.locks.mjVersionId,
    mjAspectRatio: parsed.locks.mjAspectRatio,
    mjRawMode: parsed.locks.mjRawMode,
    mjStylize: parsed.locks.mjStylize,
    mjChaos: parsed.locks.mjChaos,
    mjWeirdness: parsed.locks.mjWeirdness,
    mjResolution: parsed.locks.mjResolution,
    aspectRatio: parsed.locks.aspectRatio,
  }, {
    mjVersionId: 'v8-1',
    mjAspectRatio: '3:4',
    mjRawMode: 'raw',
    mjStylize: 333,
    mjChaos: 18,
    mjWeirdness: 47,
    mjResolution: 'hd',
    aspectRatio: '3:4',
  });
  assert.deepEqual(
    parsed.matchedControls
      .filter((entry) => entry.key.startsWith('mj') || entry.key === 'aspectRatio')
      .map((entry) => entry.key),
    [
      'mjVersionId',
      'mjAspectRatio',
      'mjRawMode',
      'mjStylize',
      'mjChaos',
      'mjWeirdness',
      'mjResolution',
    ]
  );
});

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  auditPrompts,
  countWords,
  detectContradictions,
  detectControlLanguage,
  findDuplicateSegments,
  parseCliArgs,
  summarizeNumbers,
  validateOutputContracts,
  validatePromptLogic,
} from '../validate_prompt_logic.mjs';

function validPromptFixture() {
  const imageType = 'Create a photorealistic editorial portrait.';
  const composition = 'Full-body portrait, eye-level view, front view';
  return {
    id: 'fixture-1',
    summaryFields: {
      style: '寫實攝影',
      location: '攝影棚',
      lighting: '均勻平光',
    },
    selection: { subjectCount: '1' },
    structured: {
      Wardrobe: [{ zh: '連身裙', en: 'dress' }],
    },
    grokPrompt: [
      `Image Type:\n${imageType}`,
      composition,
      'Subject:\nOne adult portrait subject.',
      'Wardrobe:\nShe wears a black dress.',
      'Scene:\nA clean portrait studio.',
      'Lighting:\nSoft even light.',
      'Camera Look:\nNatural photographic detail.',
      'multi-cut sequence n=2',
    ].join('\n\n'),
    zImagePrompt: [
      imageType,
      composition,
      'One adult portrait subject in a clean portrait studio.',
    ].join('\n\n'),
    midjourneyPrompt: [
      'Photorealistic editorial portrait.',
      composition,
      'One adult portrait subject in a clean portrait studio. --v 8.2 --ar 4:5 --s 100 --c 0 --w 0 --sd',
    ].join('\n\n'),
    extraPrompts: [
      {
        id: 'chest-up-portrait',
        label: '胸上特寫照',
        text: [
          'Image Type:\nCreate a photorealistic editorial portrait.',
          'Composition:\nChest-up portrait.',
          'Subject:\nOne adult portrait subject.',
        ].join('\n\n'),
      },
      {
        id: 'chest-up-mj-portrait',
        label: 'MJ 胸上特寫照',
        text: 'Photorealistic editorial portrait. Chest-up editorial portrait, one adult portrait subject, wearing a black dress neckline, soft even light, natural photographic detail. --v 8.2 --ar 4:5 --s 25 --c 0 --w 0 --sd',
      },
      {
        id: 'full-body-character',
        label: '全身角色照',
        text: [
          'Image Type:\nCreate a photorealistic character reference portrait in a single 9:16 vertical image.',
          'Subject:\nOne adult portrait subject.',
          'Lighting:\nClean even lighting.',
          'Camera Look:\nFull-body view, complete figure visible from head to toe, both hands and both feet completely visible, no crop.',
        ].join('\n\n'),
      },
    ],
  };
}

test('countWords treats hyphenated and ratio tokens as one word', () => {
  assert.equal(countWords('Create a 9:16 full-body image.'), 5);
});

test('summarizeNumbers returns stable descriptive statistics', () => {
  assert.deepEqual(summarizeNumbers([1, 2, 3, 4]), {
    samples: 4,
    min: 1,
    max: 4,
    average: 2.5,
    median: 2.5,
    p95: 4,
  });
});

test('findDuplicateSegments reports exact and near duplicates', () => {
  const text = [
    'Soft natural diffused daylight across the face.',
    'Soft natural diffused daylight across the face.',
    'Soft natural diffused daylight over the face.',
  ].join('\n');
  const signals = findDuplicateSegments(text);
  assert.ok(signals.some((signal) => signal.type === 'exact'));
  assert.ok(signals.some((signal) => signal.type === 'near'));
});

test('detectControlLanguage identifies internal renderer vocabulary', () => {
  const signals = detectControlLanguage('Scene Priority: preserve it. The palette is controlled by the outfit color selection.');
  assert.ok(signals.some((signal) => signal.code === 'scene-priority-label'));
  assert.ok(signals.some((signal) => signal.code === 'selection-control-language'));
});

test('detectContradictions reports incompatible single-subject constraints', () => {
  const signals = detectContradictions(
    'Full-body portrait, complete figure visible from head to toe. Head-and-shoulders portrait. Eyes gently closed with direct eye contact.',
    { subjectCount: '1' },
  );
  assert.ok(signals.some((signal) => signal.code === 'full-body-vs-tight-crop'));
  assert.ok(signals.some((signal) => signal.code === 'closed-eyes-vs-direct-eye-contact'));
});

test('validateOutputContracts accepts a complete single-subject fixture', () => {
  assert.deepEqual(validateOutputContracts(validPromptFixture()), []);
});

test('validateOutputContracts catches a missing Gpt terminator', () => {
  const prompt = validPromptFixture();
  prompt.grokPrompt = prompt.grokPrompt.replace(/\n\nmulti-cut sequence n=2$/, '');
  const issues = validateOutputContracts(prompt);
  assert.ok(issues.some((issue) => issue.code === 'missing-tail'));
});

test('validateOutputContracts requires both duo roles and omits the single extra output', () => {
  const prompt = validPromptFixture();
  prompt.selection.subjectCount = '2';
  prompt.extraPrompts = [];
  const issues = validateOutputContracts(prompt);
  assert.equal(issues.filter((issue) => issue.code === 'missing-label' && /^Woman [12]$/.test(issue.label)).length, 4);
  assert.ok(!issues.some((issue) => issue.code === 'output-empty' && issue.field === 'fullBodyCharacterPrompt'));
});

test('legacy wardrobe and scene heuristics remain active', () => {
  const prompt = validPromptFixture();
  prompt.structured.Wardrobe = [
    { zh: '長褲', en: 'pants' },
    { zh: '短裙', en: 'skirt' },
  ];
  assert.ok(validatePromptLogic(prompt).includes('同時出現褲裝與裙裝'));
});

test('auditPrompts aggregates word lengths and diagnostic categories', () => {
  const report = auditPrompts([validPromptFixture()], { seed: 'fixture-seed' });
  assert.equal(report.generatedCount, 1);
  assert.equal(report.seed, 'fixture-seed');
  assert.equal(report.wordLengths.find((item) => item.key === 'gpt').samples, 1);
  assert.equal(report.summary.contractIssues, 0);
  assert.equal(report.summary.blockingSignals, 0);
  assert.equal(report.summary.diagnosticSignals, report.summary.logicIssues + report.summary.nearDuplicateSignals);
});

test('legacy compatibility heuristics are diagnostic-only in strict accounting', () => {
  const prompt = validPromptFixture();
  prompt.structured.Wardrobe = [
    { zh: '長褲', en: 'pants' },
    { zh: '短裙', en: 'skirt' },
  ];
  const report = auditPrompts([prompt]);
  assert.equal(report.summary.logicIssues, 1);
  assert.equal(report.summary.diagnosticSignals, 1);
  assert.equal(report.summary.blockingSignals, 0);
});

test('parseCliArgs supports deterministic seed, JSON, and strict mode', () => {
  assert.deepEqual(parseCliArgs(['25', 'stable-seed', '--json', '--strict']), {
    count: 25,
    seed: 'stable-seed',
    json: true,
    strict: true,
  });
  assert.throws(() => parseCliArgs(['0']), /positive integer/);
});

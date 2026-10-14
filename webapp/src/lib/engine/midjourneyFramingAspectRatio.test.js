import assert from 'node:assert/strict';
import test from 'node:test';

import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import { MIDJOURNEY_FRAMING_ASPECT_RATIO, buildMidjourneyParameterTail, parseMidjourneyParameterTail } from './midjourneyParameterTail.js';

const controls = getLockControls();
const option = (key, zh) => {
  const found = controls.find(c => c.key === key)?.options.find(o => o.zh === zh);
  assert.ok(found, `${key}/${zh}`);
  return found.id;
};
const mainMj = (locks) => generatePrompts(1, { ...createEmptyLocks(), subjectCount: '1', ...locks }, [], {
  random: createSeededRandom('mj-framing-aspect-ratio'),
})[0].midjourneyPrompt;
const ratioOf = prompt => parseMidjourneyParameterTail(prompt).settings?.mjAspectRatio
  ?? prompt.match(/--ar (\d+:\d+)/)?.[1];

// Approved mapping (2026-10-14): close and chest crops 4:5, medium 3:4,
// cowboy, full body and no framing 2:3.
const EXPECTED = [
  ['半臉傾斜特寫', '4:5'], ['局部五官特寫', '4:5'], ['臉部特寫', '4:5'], ['特寫鏡頭 (Close-Up)', '4:5'],
  ['全臉傾斜特寫', '4:5'], ['頭部主導近景', '4:5'], ['胸上特寫', '4:5'],
  ['中景鏡頭 (Medium Shot)', '3:4'], ['牛仔中景 (Cowboy Shot)', '2:3'], ['全身鏡頭 (Full Body Shot)', '2:3'],
  ['全無', '2:3'],
];

test('main MJ takes the approved framing ratio when F follows PAGE1 and PAGE1 has no ratio', () => {
  for (const [framing, ratio] of EXPECTED) {
    const prompt = mainMj({ framingId: option('framingId', framing), mjAspectRatio: 'page1' });
    assert.equal(prompt.match(/--ar (\d+:\d+)/)?.[1], ratio, framing);
  }
});

test('an explicit F ratio still wins over the framing ratio', () => {
  const prompt = mainMj({ framingId: option('framingId', '全身鏡頭 (Full Body Shot)'), mjAspectRatio: '16:9' });
  assert.match(prompt, /--ar 16:9 /);
  assert.doesNotMatch(prompt, /--ar 2:3/);
});

test('the PAGE1 ratio still wins over the framing ratio', () => {
  assert.equal(
    buildMidjourneyParameterTail({ mjAspectRatio: 'page1', aspectRatio: '9:16', framingAspectRatio: '2:3' }).match(/--ar (\S+)/)[1],
    '9:16',
  );
});

test('fixed composition buckets keep their own ratio rule', () => {
  assert.equal(MIDJOURNEY_FRAMING_ASPECT_RATIO.fixedComposition, undefined);
  assert.doesNotMatch(buildMidjourneyParameterTail({ mjAspectRatio: 'page1', framingAspectRatio: '' }), /--ar /);
});

test('the parsed tail exposes the emitted ratio', () => {
  const prompt = mainMj({ framingId: option('framingId', '中景鏡頭 (Medium Shot)'), mjAspectRatio: 'page1' });
  assert.equal(ratioOf(prompt), '3:4');
});

test('Markdown restore treats a framing-derived ratio as follow-PAGE1 and keeps explicit ratios', async () => {
  const { buildMarkdownExport, parseExportedMarkdownPrompt } = await import('../../features/saved-cards/cardCodec.js');
  const generate = locks => generatePrompts(1, { ...createEmptyLocks(), subjectCount: '1', ...locks }, [], {
    random: createSeededRandom('mj-framing-aspect-restore'),
  })[0];
  const fullBody = option('framingId', '全身鏡頭 (Full Body Shot)');

  const derived = generate({ framingId: fullBody, mjAspectRatio: 'page1' });
  assert.match(derived.midjourneyPrompt, /--ar 2:3 /);
  const restoredDerived = parseExportedMarkdownPrompt(buildMarkdownExport(derived), controls, 'derived-ratio');
  assert.equal(restoredDerived.selection.aspectRatio, derived.selection.aspectRatio);
  assert.equal(restoredDerived.selection.mjAspectRatio || 'page1', 'page1');

  const explicit = generate({ framingId: fullBody, mjAspectRatio: '16:9' });
  const restoredExplicit = parseExportedMarkdownPrompt(buildMarkdownExport(explicit), controls, 'explicit-ratio');
  assert.equal(restoredExplicit.selection.mjAspectRatio, '16:9');
});

test('a live F-setting change keeps the framing ratio and an explicit F ratio replaces it', async () => {
  const { attachMidjourneySettingsToPrompt } = await import('../../features/page1/midjourneyParameterState.js');
  const prompt = generatePrompts(1, {
    ...createEmptyLocks(), subjectCount: '1',
    framingId: option('framingId', '中景鏡頭 (Medium Shot)'), mjAspectRatio: 'page1',
  }, [], { random: createSeededRandom('mj-framing-aspect-live') })[0];
  assert.match(prompt.midjourneyPrompt, /--ar 3:4 /);

  const restyled = attachMidjourneySettingsToPrompt(prompt, { mjAspectRatio: 'page1', mjStylize: 100 });
  assert.match(restyled.midjourneyPrompt, /--ar 3:4 /);
  assert.match(restyled.midjourneyPrompt, /--s 100 /);

  const explicit = attachMidjourneySettingsToPrompt(prompt, { mjAspectRatio: '16:9' });
  assert.match(explicit.midjourneyPrompt, /--ar 16:9 /);
});

test('carriage sets that allow framing variation keep the framing ratio through live F changes and restore', async () => {
  const { attachMidjourneySettingsToPrompt } = await import('../../features/page1/midjourneyParameterState.js');
  const { buildMarkdownExport, parseExportedMarkdownPrompt } = await import('../../features/saved-cards/cardCodec.js');
  const prompt = generatePrompts(1, {
    ...createEmptyLocks(), subjectCount: '1',
    fixedCompositionSetId: 'japan-carriage-side-aisle',
    framingId: option('framingId', '中景鏡頭 (Medium Shot)'), mjAspectRatio: 'page1',
  }, [], { random: createSeededRandom('mj-framing-aspect-carriage') })[0];
  assert.match(prompt.midjourneyPrompt, /--ar 3:4 /);

  const restyled = attachMidjourneySettingsToPrompt(prompt, { mjAspectRatio: 'page1', mjStylize: 100 });
  assert.match(restyled.midjourneyPrompt, /--ar 3:4 /);

  // Carriage Markdown text does not round-trip its crop (existing importer limit),
  // so the ratio is kept as the MJ-only F ratio and PAGE1 stays unset.
  const restored = parseExportedMarkdownPrompt(buildMarkdownExport(prompt), controls, 'carriage-ratio');
  assert.equal(restored.selection.aspectRatio, prompt.selection.aspectRatio);
  assert.equal(restored.selection.mjAspectRatio, '3:4');
});

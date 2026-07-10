import assert from 'node:assert/strict';
import test from 'node:test';

import { createEmptyLocks, getLockControls } from '../../lib/engine.js';
import {
  createLineage,
  deserializeFavoritePrompt,
  parseLocksFromStandardPrompt,
  serializeFavoritePrompt,
} from './cardCodec.js';

test('favorite codec preserves card identity, prompts, selection, and lineage', () => {
  const locks = createEmptyLocks();
  locks.subjectCount = '1';
  const prompt = {
    id: 'prompt-123456',
    source: 'page1',
    date: '2026-07-10T00:00:00.000Z',
    summary: '人物：單人 | 場景：街道',
    midjourneyPrompt: 'primary prompt',
    grokPrompt: 'structured prompt',
    zImagePrompt: 'z-image prompt',
    selection: locks,
  };
  prompt.lineage = createLineage(prompt);

  const restored = deserializeFavoritePrompt(serializeFavoritePrompt(prompt));
  assert.equal(restored.id, prompt.id);
  assert.equal(restored.midjourneyPrompt, prompt.midjourneyPrompt);
  assert.equal(restored.selection.subjectCount, '1');
  assert.equal(restored.lineage.rootShortId, '#123456');
});

test('standard prompt parser prefers the longest matching option text', () => {
  const controls = getLockControls();
  const hairstyleControl = controls.find((control) => control.key === 'hairstyleId');
  const target = [...hairstyleControl.options]
    .filter((option) => option.zh !== '全無' && option.en)
    .sort((a, b) => b.en.length - a.en.length)[0];

  const parsed = parseLocksFromStandardPrompt(`portrait, ${target.en}`, controls);
  assert.equal(parsed.locks.hairstyleId, target.id);
  assert.ok(parsed.matchedControls.some((entry) => entry.key === 'hairstyleId'));
});

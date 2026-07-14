import assert from 'node:assert/strict';
import test from 'node:test';

import { createEmptyLocks, getLockControls } from '../../lib/engine.js';
import {
  createLineage,
  buildSavedCardManifestItem,
  collectSourceTags,
  deserializeFavoritePrompt,
  normalizeManifestSummaryFields,
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

test('saved card manifest exports structured source tags without AI inference', () => {
  const prompt = {
    id: 'prompt-manifest-1',
    source: 'page1',
    sourceLabel: 'Prompt 工作台',
    summary: '人物：單人 | 場景：戶外',
    summaryFields: {
      style: '',
      character: '單人',
      wardrobe: '',
      location: '戶外',
      camera: '',
      lighting: '',
    },
    structured: {
      Style: [{ zh: '底片風格', meta: { tags: ['film', 'film', 'soft_grade'] } }],
      Location: [{ zh: '戶外', meta: { tags: ['outdoor'] } }],
    },
  };

  assert.deepEqual(collectSourceTags(prompt), [
    { id: 'film', category: '風格', label: 'Film' },
    { id: 'soft_grade', category: '風格', label: 'Soft Grade' },
    { id: 'outdoor', category: '場景', label: 'Outdoor' },
  ]);

  assert.deepEqual(buildSavedCardManifestItem(prompt, 'prompt_prompt-manifest-1.md'), {
    sourceId: 'prompt-manifest-1',
    file: 'prompt_prompt-manifest-1.md',
    title: '人物：單人 | 場景：戶外',
    source: 'page1',
    sourceLabel: 'Prompt 工作台',
    summary: '人物：單人 | 場景：戶外',
    summaryFields: {
      style: '',
      character: '單人',
      wardrobe: '',
      location: '戶外',
      camera: '',
      lighting: '',
    },
    tags: [
      { id: 'film', category: '風格', label: 'Film' },
      { id: 'soft_grade', category: '風格', label: 'Soft Grade' },
      { id: 'outdoor', category: '場景', label: 'Outdoor' },
    ],
  });
});

test('manifest summary fields normalize PAGE2 and PAGE3 aliases into the fixed schema', () => {
  assert.deepEqual(normalizeManifestSummaryFields({
    source: 'page2',
    summaryFields: {
      characterDna: '37_Hina',
      expressionPose: 'Headshot Prompt',
      wardrobe: '純人物',
      sceneLook: '-',
    },
  }), {
    style: '',
    character: '37_Hina',
    wardrobe: '純人物',
    location: '',
    camera: '',
    lighting: '',
  });

  assert.deepEqual(normalizeManifestSummaryFields({
    summary: '風格：底片 | 人物：單人 | 服裝：白襯衫 | 場景：街道 | 鏡頭：35mm | 光影：柔光',
  }), {
    style: '底片',
    character: '單人',
    wardrobe: '白襯衫',
    location: '街道',
    camera: '35mm',
    lighting: '柔光',
  });
});

test('source tags dedupe by stable id even when categories differ', () => {
  assert.deepEqual(collectSourceTags({
    source: 'page1',
    sourceTags: [{ id: 'film', category: '來源', label: 'Source Film' }],
    structured: {
      Style: [{ meta: { tags: ['film', 'editorial'] } }],
    },
  }), [
    { id: 'film', category: '來源', label: 'Source Film' },
    { id: 'editorial', category: '風格', label: 'Editorial' },
  ]);
});

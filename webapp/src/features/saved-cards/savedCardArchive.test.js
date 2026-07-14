import assert from 'node:assert/strict';
import test from 'node:test';
import JSZip from 'jszip';

import { createEmptyLocks, generatePrompts, getLockControls } from '../../lib/engine.js';
import {
  buildMarkdownExport,
} from './cardCodec.js';
import {
  buildArchiveFileNames,
  createSavedCardsArchive,
  parseSavedCardsArchive,
} from './savedCardArchive.js';

function createPrompt(id) {
  const [prompt] = generatePrompts(1, createEmptyLocks(), [], { random: () => 0.123456 });
  return {
    ...prompt,
    id,
    date: '2026-07-15T00:00:00.000Z',
    title: `Prompt ${id}`,
  };
}

test('saved card archive contains manifest and unchanged markdown exports', async () => {
  const prompt = createPrompt('archive-one');
  const bytes = await createSavedCardsArchive([prompt], 0, 'uint8array');
  const zip = await JSZip.loadAsync(bytes);
  const names = Object.keys(zip.files).sort();

  assert.deepEqual(names, ['manifest.json', 'prompt_archive-one.md']);

  const manifest = JSON.parse(await zip.file('manifest.json').async('string'));
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.sourceProject, 'virtual-photography-studio');
  assert.equal(manifest.exportedAt, '1970-01-01T00:00:00.000Z');
  assert.equal(manifest.items.length, 1);
  assert.equal(manifest.items[0].sourceId, 'archive-one');
  assert.equal(manifest.items[0].file, 'prompt_archive-one.md');
  assert.deepEqual(Object.keys(manifest.items[0].summaryFields), [
    'style', 'character', 'wardrobe', 'location', 'camera', 'lighting',
  ]);

  const markdown = await zip.file('prompt_archive-one.md').async('string');
  assert.equal(markdown, buildMarkdownExport(prompt));
});

test('archive file names stay unique for sanitized id collisions and invalid items are skipped', async () => {
  const prompts = [
    createPrompt('a/b'),
    createPrompt('a_b'),
    createPrompt('a b'),
  ];
  const names = buildArchiveFileNames(prompts);
  assert.equal(new Set(names).size, prompts.length);
  assert.ok(names.every((name) => /^prompt_[a-zA-Z0-9._-]+\.md$/.test(name)));

  const bytes = await createSavedCardsArchive([null, { id: '' }, ...prompts], 1, 'uint8array');
  const zip = await JSZip.loadAsync(bytes);
  const manifest = JSON.parse(await zip.file('manifest.json').async('string'));
  assert.equal(manifest.items.length, 3);
  assert.equal(new Set(manifest.items.map((item) => item.file)).size, 3);
  assert.equal(Object.keys(zip.files).filter((name) => name.endsWith('.md')).length, 3);
});

test('manifest sourceId restores safe-filename exports while old markdown-only archives remain importable', async () => {
  const prompt = createPrompt('原始/卡片');
  const controls = getLockControls();

  const manifestBytes = await createSavedCardsArchive([prompt], 2, 'uint8array');
  const restored = await parseSavedCardsArchive(manifestBytes, controls);
  assert.equal(restored.length, 1);
  assert.equal(restored[0].id, '原始/卡片');
  assert.equal(restored[0].sourceId, '原始/卡片');

  const legacyZip = new JSZip();
  legacyZip.file('prompt_legacy-card.md', buildMarkdownExport(createPrompt('legacy-card')));
  const legacyBytes = await legacyZip.generateAsync({ type: 'uint8array' });
  const importedLegacy = await parseSavedCardsArchive(legacyBytes, controls);
  assert.equal(importedLegacy.length, 1);
  assert.equal(importedLegacy[0].id, 'legacy-card');
});

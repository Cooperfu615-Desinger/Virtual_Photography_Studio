import assert from 'node:assert/strict';
import test from 'node:test';
import JSZip from 'jszip';
import { createSavedCardsArchive } from './savedCardArchive.js';
import { buildMarkdownExport } from './cardCodec.js';
import { makeSyntheticCollection, payloadHash } from '../../../../scripts/lib/savedCardsPersistenceFixtures.mjs';

test('large synthetic backup preserves every Unicode character and original card', async () => {
  const cards = makeSyntheticCollection('131-large');
  const originalHash = payloadHash(cards);
  const zip = await JSZip.loadAsync(await createSavedCardsArchive(cards, 1790812800000, 'uint8array'));
  const manifest = JSON.parse(await zip.file('manifest.json').async('string'));
  const backup = JSON.parse(await zip.file('saved-cards-backup.json').async('string'));
  assert.deepEqual(backup.items, cards);
  assert.equal(backup.restoreStatus, 'backup-only');
  assert.equal(manifest.items.length, cards.length);
  for (const [index, card] of cards.entries()) {
    assert.equal(await zip.file(manifest.items[index].file).async('string'), buildMarkdownExport(card));
  }
  assert.equal(payloadHash(cards), originalHash);
});

test('ZIP text entries retain supplementary characters across long text boundaries', async () => {
  const [card] = makeSyntheticCollection('131-large');
  card.grokPrompt = '文'.repeat(16383) + '🧪' + '字'.repeat(16384) + '😀';
  card.title = '標題🧪';
  const zip = await JSZip.loadAsync(await createSavedCardsArchive([card], 0, 'uint8array'));
  const manifest = JSON.parse(await zip.file('manifest.json').async('string'));
  assert.equal(await zip.file(manifest.items[0].file).async('string'), buildMarkdownExport(card));
  const backup = zip.file('saved-cards-backup.json');
  if (backup) assert.deepEqual(JSON.parse(await backup.async('string')).items, [card]);
});

test('manifest source IDs preserve Unicode at the JSZip chunk boundary', async () => {
  const [card] = makeSyntheticCollection('131-large');
  card.id = 'a'.repeat(16383) + '🧪' + 'b'.repeat(16384);
  const zip = await JSZip.loadAsync(await createSavedCardsArchive([card], 0, 'uint8array'));
  const manifest = JSON.parse(await zip.file('manifest.json').async('string'));
  assert.equal(manifest.items[0].sourceId, card.id);
  assert.equal(await zip.file(manifest.items[0].file).async('string'), buildMarkdownExport(card));
});

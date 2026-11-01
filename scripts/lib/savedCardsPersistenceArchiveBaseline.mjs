// A-stage characterization. Exports to memory only; never invokes saveAs or Import.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createSavedCardsArchive } from '../../webapp/src/features/saved-cards/savedCardArchive.js';
import { buildMarkdownExport } from '../../webapp/src/features/saved-cards/cardCodec.js';
import { makeSyntheticCollection, payloadHash, hashBytes } from './savedCardsPersistenceFixtures.mjs';
const require = createRequire(new URL('../../webapp/package.json', import.meta.url));
const JSZip = require('jszip');
export const ARCHIVE_BASELINE_URL = new URL('../../Docs/reports/saved-cards-persistence-a-2026-11-01/archive-baseline.json', import.meta.url);
function difference(file, expected, actual) {
  if (expected === actual) return null;
  let firstOffset = 0;
  while (firstOffset < Math.min(expected.length, actual.length) && expected[firstOffset] === actual[firstOffset]) firstOffset++;
  return { file, expectedHash: hashBytes(expected), actualHash: hashBytes(actual), firstOffset,
    expectedCodeUnit: expected.charCodeAt(firstOffset), actualCodeUnit: actual.charCodeAt(firstOffset),
    expectedLength: expected.length, actualLength: actual.length };
}
export async function measureArchiveBaseline() {
  const cards = makeSyntheticCollection('131-large'), inputHash = payloadHash(cards);
  const bytes = await createSavedCardsArchive(cards, 1790812800000, 'nodebuffer');
  const zip = await JSZip.loadAsync(bytes);
  const manifest = JSON.parse(await zip.file('manifest.json').async('string'));
  const backupText = (await zip.file('saved-cards-backup.json').async('nodebuffer')).toString('utf8');
  const backup = JSON.parse(backupText);
  const expectedBackup = JSON.stringify({ version: 1, restoreStatus: 'backup-only', sourceProject: 'virtual-photography-studio', items: cards }, null, 2);
  const differences = [difference('saved-cards-backup.json', expectedBackup, backupText)].filter(Boolean);
  for (let index = 0; index < cards.length; index++) {
    const file = manifest.items[index].file;
    const actual = (await zip.file(file).async('nodebuffer')).toString('utf8');
    const item = difference(file, buildMarkdownExport(cards[index]), actual);
    if (item) differences.push(item);
  }
  assert.equal(payloadHash(cards), inputHash);
  return { schemaVersion: 1, stage: 'A-current-archive-characterization',
    status: differences.length ? 'known-current-defect-not-v1-pass' : 'raw-text-preserved',
    recipe: '131-large', inputHash, manifestCount: manifest.items.length,
    markdownCount: Object.keys(zip.files).filter(file => file.endsWith('.md')).length,
    backupCount: backup.items.length, backupPayloadHash: payloadHash(backup.items),
    backupMatchesInput: payloadHash(backup.items) === inputHash, differences };
}

import {preC4LabelsSource, preparePreC4LabelsFiles} from './c4LabelsReplay.mjs';
// Exact test-only inverse; original A–E/A2 evidence is never re-recorded.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root = fileURLToPath(new URL('../../', import.meta.url));
export const DOWNLOAD_REVIEW = JSON.parse(readFileSync(new URL('./savedCardsDownloadPatches.json', import.meta.url)));
const hash = value => createHash('sha256').update(value).digest('hex');
export function preSavedCardsDownloadSource(path, source) {
  source = preC4LabelsSource(path, source);
  const file = DOWNLOAD_REVIEW.files.find(f => f.path === path);
  if (!file || hash(source) !== file.afterHash) return source;
  assert.equal(hash(file.beforeSource), file.beforeHash, 'Download inverse corrupt oracle');
  return Buffer.isBuffer(source) ? Buffer.from(file.beforeSource) : file.beforeSource;
}
export function preparePreSavedCardsDownloadFiles(directory) {
  assert.notEqual(realpathSync(directory), realpathSync(root), 'Download inverse requires isolated copy');
  assert.ok(!existsSync(join(directory, '.git')), 'Download inverse rejects Git checkout');
  const c4 = preparePreC4LabelsFiles(directory);
  const sources = new Map(c4.sources);
  const present = DOWNLOAD_REVIEW.files.filter(f => existsSync(join(directory, f.path)));
  if (present.some(f => hash(readFileSync(join(directory, f.path))) === f.afterHash)) {
    for (const file of present) {
      const source = readFileSync(join(directory, file.path));
      assert.ok([file.beforeHash, file.afterHash].includes(hash(source)), 'Download inverse unknown source: ' + file.path);
      sources.set(file.path, preSavedCardsDownloadSource(file.path, source));
    }
  }
  return { sources, apply() { for (const [path, bytes] of sources) writeFileSync(join(directory, path), bytes); } };
}

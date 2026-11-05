// Run the existing download inverse on its reviewed inputs. Preparation only writes
// to a private scratch directory. The caller receives an atomic, validated plan.
import assert from 'node:assert/strict';
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { preparePreC4LabelsFiles } from './c4LabelsReplay.mjs';
import { DOWNLOAD_REVIEW, preparePreSavedCardsDownloadFiles as prepareOriginal, preSavedCardsDownloadSource as originalSource } from './savedCardsDownloadReplay.mjs';
import { preIndoorSeatSource } from './indoorSeatHistoricalReplay.mjs';
export { DOWNLOAD_REVIEW };
export const preSavedCardsDownloadSource = (path, bytes) => originalSource(path, preIndoorSeatSource(path, bytes));
const helper = 'webapp/src/features/saved-cards/page1MarkdownSnapshot.js';
const root = realpathSync(fileURLToPath(new URL('../../',import.meta.url)));
export function preparePreSavedCardsDownloadFiles(directory) {
  const dir = realpathSync(directory);
  assert.notEqual(dir, root, 'Download inverse requires isolated copy');
  assert.ok(!existsSync(join(dir,'.git')), 'Download inverse rejects Git checkout');
  const path = join(dir,helper);
  if (!existsSync(path)) return prepareOriginal(dir);
  const raw = readFileSync(path), earlier = preIndoorSeatSource(helper,raw);
  if (raw === earlier) return prepareOriginal(dir);
  const sources = new Map(preparePreC4LabelsFiles(dir).sources);
  const scratch = mkdtempSync(join(tmpdir(),'indoor-seat-history-'));
  try {
    for (const file of DOWNLOAD_REVIEW.files) {
      const from = join(dir,file.path), to = join(scratch,file.path);
      if (!existsSync(from)) continue;
      assert.ok(!lstatSync(from).isSymbolicLink() && realpathSync(from).startsWith(dir + '/'), 'Linked download fixture');
      mkdirSync(dirname(to),{recursive:true});
      writeFileSync(to,file.path === helper ? earlier : readFileSync(from));
    }
    sources.set(helper, earlier);
    for (const [file, bytes] of prepareOriginal(scratch).sources) sources.set(file,bytes);
    return { sources, apply() { for (const [file, bytes] of sources) writeFileSync(join(dir,file),bytes); } };
  } finally { rmSync(scratch,{recursive:true,force:true}); }
}

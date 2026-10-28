import { preSavedCardsDownloadSource } from './savedCardsDownloadReplay.mjs';
// Restore this batch only in an isolated tree, then run the unmodified old tools.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, realpathSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
export const SNAPSHOT_ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const SNAPSHOT_PATCHES = JSON.parse(readFileSync(new URL('./a2MarkdownSnapshotPatches.json', import.meta.url)));
const hash = value => createHash('sha256').update(value).digest('hex');
export function restorePreA2MarkdownSnapshotFiles(directory) {
  assert.notEqual(realpathSync(directory), realpathSync(SNAPSHOT_ROOT), 'Snapshot inverse requires an isolated tree');
  const states = SNAPSHOT_PATCHES.files.map(file => {
    const text = preSavedCardsDownloadSource(file.path, readFileSync(join(directory, file.path), 'utf8'));
    const sha = hash(text);
    const state = sha === file.afterHash ? 'after' : sha === file.beforeHash ? 'before' : 'unknown';
    assert.notEqual(state, 'unknown', 'Unreviewed snapshot source: ' + file.path);
    assert.equal(hash(file.before), file.beforeHash);
    assert.equal(hash(file.after), file.afterHash);
    return state;
  });
  assert.equal(new Set(states).size, 1, 'Snapshot inverse rejects mixed states');
  for (const [path, sha] of Object.entries(SNAPSHOT_PATCHES.newFiles)) {
    if (states[0] === 'after' || existsSync(join(directory, path)))
      assert.equal(hash(preSavedCardsDownloadSource(path, readFileSync(join(directory, path)))), sha, 'Unreviewed snapshot helper: ' + path);
  }
  // Prepare and verify every file before the first write.
  if (states[0] === 'after') for (const file of SNAPSHOT_PATCHES.files) writeFileSync(join(directory, file.path), file.before);
  for (const path of Object.keys(SNAPSHOT_PATCHES.newFiles)) rmSync(join(directory, path), { force: true });
}

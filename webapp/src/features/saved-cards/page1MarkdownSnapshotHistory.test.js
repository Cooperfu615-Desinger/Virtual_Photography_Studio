import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { SNAPSHOT_ROOT, SNAPSHOT_PATCHES, restorePreA2MarkdownSnapshotFiles } from '../../../../scripts/lib/a2MarkdownSnapshotReplay.mjs';
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'a2-snapshot-inverse-'));
  for (const file of SNAPSHOT_PATCHES.files) { const path = join(dir, file.path); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, file.after); }
  for (const path of Object.keys(SNAPSHOT_PATCHES.newFiles)) { mkdirSync(dirname(join(dir, path)), { recursive: true }); writeFileSync(join(dir, path), readFileSync(join(SNAPSHOT_ROOT, path))); }
  return dir;
}
test('snapshot inverse restores the exact approved Git base and is idempotent', () => {
  const dir = fixture();
  try {
    restorePreA2MarkdownSnapshotFiles(dir); restorePreA2MarkdownSnapshotFiles(dir);
    for (const file of SNAPSHOT_PATCHES.files) assert.equal(readFileSync(join(dir, file.path), 'utf8'), file.before);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
for (const mode of ['source', 'helper', 'mixed', 'missing']) test('snapshot inverse rejects ' + mode + ' before any partial write', () => {
  const dir = fixture();
  try {
    const file = SNAPSHOT_PATCHES.files[0];
    const target = join(dir, mode === 'helper' ? Object.keys(SNAPSHOT_PATCHES.newFiles)[0] : file.path);
    if (mode === 'missing') rmSync(target);
    else writeFileSync(target, mode === 'mixed' ? file.before : readFileSync(target, 'utf8') + '\n// unreviewed');
    const protectedFile = join(dir, SNAPSHOT_PATCHES.files[1].path), before = readFileSync(protectedFile, 'utf8');
    assert.throws(() => restorePreA2MarkdownSnapshotFiles(dir));
    assert.equal(readFileSync(protectedFile, 'utf8'), before);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('snapshot inverse refuses the product worktree', () => assert.throws(() => restorePreA2MarkdownSnapshotFiles(SNAPSHOT_ROOT)));

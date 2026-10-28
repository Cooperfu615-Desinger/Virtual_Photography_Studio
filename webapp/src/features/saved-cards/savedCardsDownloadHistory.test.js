import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DOWNLOAD_REVIEW, preparePreSavedCardsDownloadFiles } from '../../../../scripts/lib/savedCardsDownloadReplay.mjs';
const root = fileURLToPath(new URL('../../../../', import.meta.url));
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'saved-download-replay-'));
  for (const file of DOWNLOAD_REVIEW.files) {
    mkdirSync(dirname(join(dir, file.path)), { recursive: true });
    writeFileSync(join(dir, file.path), readFileSync(join(root, file.path)));
  }
  return dir;
}
test('download inverse restores exact pre-fix bytes in an isolated tree and is idempotent', () => {
  const dir = fixture();
  try {
    preparePreSavedCardsDownloadFiles(dir).apply();
    preparePreSavedCardsDownloadFiles(dir).apply();
    for (const file of DOWNLOAD_REVIEW.files) assert.equal(readFileSync(join(dir, file.path), 'utf8'), file.beforeSource);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('download inverse rejects unknown edits before writing and refuses the live checkout', () => {
  assert.throws(() => preparePreSavedCardsDownloadFiles(root), /isolated/);
  const dir = fixture();
  try {
    const first = join(dir, DOWNLOAD_REVIEW.files[0].path), protectedPath = join(dir, DOWNLOAD_REVIEW.files[1].path);
    const before = readFileSync(protectedPath);
    writeFileSync(first, readFileSync(first, 'utf8') + '\n// unknown');
    assert.throws(() => preparePreSavedCardsDownloadFiles(dir), /unknown source/);
    assert.deepEqual(readFileSync(protectedPath), before);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

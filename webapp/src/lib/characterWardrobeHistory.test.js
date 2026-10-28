import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { B3_ROOT, B3_REVIEW, restorePreB3WardrobeFiles } from '../../../scripts/lib/b3CharacterWardrobeReplay.mjs';
function fixture(run) {
  const root = mkdtempSync(join(tmpdir(), 'b3-history-test-'));
  try {
    for (const path of [...B3_REVIEW.files.map(f => f.path), ...Object.keys(B3_REVIEW.newFiles)]) {
      mkdirSync(dirname(join(root, path)), { recursive: true });
      writeFileSync(join(root, path), readFileSync(join(B3_ROOT, path)));
    }
    run(root);
  } finally { rmSync(root, { recursive: true, force: true }); }
}
test('B3 inverse restores exact fixed sources once and is idempotent', () => fixture(root => {
  restorePreB3WardrobeFiles(root);
  for (const f of B3_REVIEW.files) assert.equal(readFileSync(join(root, f.path), 'utf8'), f.beforeSource);
  for (const path of Object.keys(B3_REVIEW.newFiles)) assert.equal(existsSync(join(root, path)), false);
  restorePreB3WardrobeFiles(root);
}));
test('B3 inverse refuses checkout, missing, tampered and mixed inputs before writing', () => {
  assert.throws(() => restorePreB3WardrobeFiles(B3_ROOT), /isolated/);
  for (const mutation of ['git', 'missing', 'tamper', 'duplicate', 'mixed', 'test']) fixture(root => {
    const first = B3_REVIEW.files[0], path = join(root, first.path);
    const untouched = join(root, B3_REVIEW.files[1].path), original = readFileSync(untouched);
    if (mutation === 'git') mkdirSync(join(root, '.git'));
    if (mutation === 'missing') rmSync(path);
    if (mutation === 'tamper') writeFileSync(path, readFileSync(path, 'utf8') + '\n// changed');
    if (mutation === 'duplicate') writeFileSync(path, readFileSync(path, 'utf8').repeat(2));
    if (mutation === 'mixed') writeFileSync(path, first.beforeSource);
    if (mutation === 'test') writeFileSync(join(root, Object.keys(B3_REVIEW.newFiles)[0]), '// changed');
    assert.throws(() => restorePreB3WardrobeFiles(root));
    assert.deepEqual(readFileSync(untouched), original);
  });
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { PAGE2_ROOT, PAGE2_REVIEW, restorePrePage2AdultFiles } from '../../../scripts/lib/page2AdultIdentityReplay.mjs';
function fixture(run) {
  const root = mkdtempSync(join(tmpdir(), 'page2-history-test-'));
  try {
    for (const path of [...PAGE2_REVIEW.files.map(f => f.path), ...Object.keys(PAGE2_REVIEW.newTests)]) {
      mkdirSync(dirname(join(root, path)), { recursive: true });
      writeFileSync(join(root, path), readFileSync(join(PAGE2_ROOT, path)));
    }
    run(root);
  } finally { rmSync(root, { recursive: true, force: true }); }
}
test('PAGE2 inverse restores exact fixed sources once and is idempotent', () => fixture(root => {
  restorePrePage2AdultFiles(root);
  for (const f of PAGE2_REVIEW.files) assert.equal(readFileSync(join(root, f.path), 'utf8'), f.beforeSource);
  for (const path of Object.keys(PAGE2_REVIEW.newTests)) assert.equal(existsSync(join(root, path)), false);
  restorePrePage2AdultFiles(root);
}));
test('PAGE2 inverse refuses checkout, missing, tampered and mixed inputs before writing', () => {
  assert.throws(() => restorePrePage2AdultFiles(PAGE2_ROOT), /isolated/);
  for (const mutation of ['git', 'missing', 'tamper', 'duplicate', 'mixed', 'test']) fixture(root => {
    const first = PAGE2_REVIEW.files[0], path = join(root, first.path);
    const untouched = join(root, PAGE2_REVIEW.files[1].path), original = readFileSync(untouched);
    if (mutation === 'git') mkdirSync(join(root, '.git'));
    if (mutation === 'missing') rmSync(path);
    if (mutation === 'tamper') writeFileSync(path, readFileSync(path, 'utf8') + '\n// changed');
    if (mutation === 'duplicate') writeFileSync(path, readFileSync(path, 'utf8').repeat(2));
    if (mutation === 'mixed') writeFileSync(path, first.beforeSource);
    if (mutation === 'test') writeFileSync(join(root, Object.keys(PAGE2_REVIEW.newTests)[0]), '// changed');
    assert.throws(() => restorePrePage2AdultFiles(root));
    assert.deepEqual(readFileSync(untouched), original);
  });
});

// The approved commercial suite remains immutable at pre-CRT Git. Replay it with
// current engine code and precisely restored data; current rows are checked by CRT tests.
import assert from 'node:assert/strict';
import process from 'node:process';
import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { A5_CRT_REVIEW, historicalGit, withPreCrtReplayRoot } from '../../../../scripts/lib/a5CrtHistoricalReplay.mjs';
test('all seven sealed commercial regressions pass on exact pre-CRT data and current engine', async () => {
  await withPreCrtReplayRoot(async directory => {
    const file = 'webapp/src/lib/engine/sceneSemanticA5Commercial.test.js';
    writeFileSync(join(directory, file), historicalGit('show', A5_CRT_REVIEW.baseCommit + ':' + file));
    const env = { ...process.env, GIT_DIR: historicalGit('rev-parse', '--absolute-git-dir').toString().trim() };
    delete env.NODE_TEST_CONTEXT; // The child is an independent test runner.
    const log = execFileSync(process.execPath, ['--test', '--test-reporter=tap', join(directory, file)], {
      cwd: directory, env, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024,
    });
    assert.match(log, /# pass 7\b/); assert.match(log, /# fail 0\b/);
  });
});

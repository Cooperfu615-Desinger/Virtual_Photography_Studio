import { preA2HistoricalTest } from '../../../../scripts/lib/a2DressControlHistoricalTest.mjs';
const a2HistoricalTest = preA2HistoricalTest(import.meta.url);
// Replay the unchanged suite from delivered pre-Ximending Git with current code.
import assert from 'node:assert/strict';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { A5_XIMENDING_REVIEW, historicalGit, withPreXimendingReplayRoot } from '../../../../scripts/lib/a5XimendingHistoricalReplay.mjs';
a2HistoricalTest('sealed Crt regressions pass on exact pre-Ximending data and current engine', async () => {
  await withPreXimendingReplayRoot(async directory => {
    const file = 'webapp/src/lib/engine/sceneSemanticA5Crt.test.js';
    writeFileSync(join(directory, file), historicalGit('show', A5_XIMENDING_REVIEW.baseCommit + ':' + file));
    const env = { ...process.env, GIT_DIR: historicalGit('rev-parse', '--absolute-git-dir').toString().trim() };
    delete env.NODE_TEST_CONTEXT;
    const log = execFileSync(process.execPath, ['--test', '--test-reporter=tap', join(directory, file)], {
      cwd: directory, env, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024,
    });
    assert.match(log, /# pass 9\b/); assert.match(log, /# fail 0\b/);
  });
});

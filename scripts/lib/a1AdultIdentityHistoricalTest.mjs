// Run only a named frozen test on current code with the exact A1 source inverse.
// All other tests in its file continue to exercise the current renderer normally.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { A1_ROOT, A1_AFTER, A1_BEFORE, withPreA1ReplayRoot } from './a1AdultIdentityHistoricalReplay.mjs';
export function preA1HistoricalTest(fileUrl) {
  return (name, body) => {
    if (process.env.VPS_A1_REPLAY_ROOT === realpathSync(A1_ROOT)) {
      const source = readFileSync(join(A1_ROOT, 'webapp/src/lib/engine.js'), 'utf8');
      assert.equal(source.includes(A1_AFTER), false);
      assert.equal(source.split(A1_BEFORE).length - 1, 2);
      return test(name, body);
    }
    return test(name, async () => withPreA1ReplayRoot(async directory => {
      const env = { ...process.env, VPS_A1_REPLAY_ROOT: realpathSync(directory) };
      delete env.NODE_TEST_CONTEXT;
      const pattern = '^' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$';
      const child = spawnSync(process.execPath, ['--test', '--test-reporter=tap', '--test-name-pattern', pattern, join(directory, relative(A1_ROOT, fileURLToPath(fileUrl)))], { cwd: directory, env, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
      assert.equal(child.status, 0, child.stdout + child.stderr);
      const log = child.stdout;
      assert.match(log, /# pass 1\b/); assert.match(log, /# fail 0\b/);
    }));
  };
}

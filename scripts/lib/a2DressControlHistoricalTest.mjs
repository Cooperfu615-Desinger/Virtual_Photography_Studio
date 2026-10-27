// Named frozen checks run with only the exact A2 data inverse; other tests use current sources.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync, execFileSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { A2_ROOT, withPreA2ReplayRoot } from './a2DressControlHistoricalReplay.mjs';
export function preA2HistoricalTest(fileUrl) {
  return (name, body) => {
    if (process.env.VPS_A2_REPLAY_ROOT === realpathSync(A2_ROOT)) return test(name, body);
    return test(name, async () => withPreA2ReplayRoot(async directory => {
      const env = { ...process.env, VPS_A2_REPLAY_ROOT: realpathSync(directory),
        GIT_DIR: execFileSync('git', ['-C', A2_ROOT, 'rev-parse', '--absolute-git-dir'], { encoding: 'utf8' }).trim() };
      delete env.NODE_TEST_CONTEXT;
      const pattern = '^' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$';
      const child = spawnSync(process.execPath, ['--test', '--test-reporter=tap', '--test-name-pattern', pattern, join(directory, relative(A2_ROOT, fileURLToPath(fileUrl)))], { cwd: directory, env, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
      assert.equal(child.status, 0, child.stdout + child.stderr);
      assert.match(child.stdout, /# pass 1\b/); assert.match(child.stdout, /# fail 0\b/);
    }));
  };
}

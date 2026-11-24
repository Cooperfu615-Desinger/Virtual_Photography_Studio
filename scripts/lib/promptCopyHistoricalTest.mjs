// Preserve original assertion bodies against the exact pre-copy catalog only.
// Current source behavior is checked separately by the before/after copy probe.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prePromptCopySource, promptCopyHistoricalPaths } from './promptCopyHistoricalReplay.mjs';
import { preOpenButtonShirtTopsSource } from './gestureExpressionGazeHistoricalReplay.mjs';
const root = fileURLToPath(new URL('../../', import.meta.url));
const database = 'webapp/src/data/database.json';
export function preCopyHistoricalTest(url) {
  return (name, body) => test(name, async context => {
    if (process.env.VPS_COPY_HISTORY_CHILD === '1') return body(context);
    const currentDatabase = readFileSync(join(root, database));
    const historicalDatabase = preOpenButtonShirtTopsSource(database, prePromptCopySource(database, currentDatabase));
    const paths = new Set(promptCopyHistoricalPaths);
    if (!historicalDatabase.equals(currentDatabase)) paths.add(database);
    if (!paths.size) return body(context);
    const directory = mkdtempSync(join(tmpdir(), 'vps-copy-history-'));
    try {
      mkdirSync(join(directory, 'webapp'));
      for (const path of ['webapp/src', 'scripts', 'knowledge_base']) cpSync(join(root, path), join(directory, path), { recursive: true });
      cpSync(join(root, 'webapp/package.json'), join(directory, 'webapp/package.json'));
      symlinkSync(join(root, 'webapp/node_modules'), join(directory, 'webapp/node_modules'), 'dir');
      let changed = 0;
      for (const path of paths) {
        const current = readFileSync(join(directory, path));
        const original = preOpenButtonShirtTopsSource(path, prePromptCopySource(path, current));
        if (!original.equals(current)) changed += 1;
        writeFileSync(join(directory, path), original);
      }
      assert.ok(changed, 'Historical child must restore actual reviewed catalog sources');
      const gitDir = execFileSync('git', ['-C', root, 'rev-parse', '--absolute-git-dir'], { encoding: 'utf8' }).trim();
      const pattern = '^' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$';
      execFileSync(process.execPath, ['--test', '--test-name-pattern=' + pattern,
        relative(root, fileURLToPath(url))], { cwd: directory, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
        timeout: 120000, env: { ...process.env, GIT_DIR: gitDir, VPS_COPY_HISTORY_CHILD: '1' } });
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });
}

// Replay the immediately previous snapshot batch and its full earlier chain unchanged.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { TAPE_ROOT as root, TAPE_REVIEW as review, restorePreA2SpecialTapeFiles } from './lib/a2SpecialTapeReplay.mjs';
import { supplySealedHistory } from './lib/a5XimendingHistoricalReplay.mjs';
const out = resolve(process.argv[2] || '/tmp/a2-special-tape-history');
assert.ok(!out.includes('/page1-markdown-snapshot-a2-') && !out.includes('/wardrobe-color-recovery-a2-'), 'Protect historical evidence');
const ownReport = resolve(root, 'Docs/reports/wardrobe-control-a2-special-tape-2026-10-27');
assert.ok(!out.startsWith(resolve(root) + '/') || out === ownReport || out.startsWith(ownReport + '/'), 'Only this batch report may be written inside the repository');
mkdirSync(out, { recursive: true });
const directory = mkdtempSync(join(tmpdir(), 'vps-tape-history-'));
const results = mkdtempSync(join(tmpdir(), 'vps-tape-results-'));
try {
  for (const p of ['webapp/src', 'scripts', 'knowledge_base']) cpSync(join(root, p), join(directory, p), { recursive: true });
  for (const p of ['package.json', 'package-lock.json']) cpSync(join(root, 'webapp', p), join(directory, 'webapp', p));
  symlinkSync(join(root, 'webapp/node_modules'), join(directory, 'webapp/node_modules'), 'dir');
  restorePreA2SpecialTapeFiles(directory);
  supplySealedHistory(directory);
  // Documentation is not executable state; use the fixed base copy for old whole-tree seals.
  writeFileSync(join(directory, 'knowledge_base/catalog/README.md'), execFileSync('git', ['-C', root, 'show', review.baseCommit + ':knowledge_base/catalog/README.md']));
  for (const p of ['wardrobe-control-a2-outfits-2026-10-27']) cpSync(join(root, 'Docs/reports', p), join(directory, 'Docs/reports', p), { recursive: true });
  const env = { ...process.env, GIT_DIR: execFileSync('git', ['-C', root, 'rev-parse', '--absolute-git-dir'], { encoding: 'utf8' }).trim() };
  for (const [script, dest] of [['page1_markdown_snapshot_a2_acceptance.mjs', 'snapshot'], ['page1_markdown_snapshot_a2_history.mjs', 'earlier']]) {
    const path = 'scripts/' + script;
    assert.deepEqual(readFileSync(join(root, path)), execFileSync('git', ['-C', root, 'show', review.baseCommit + ':' + path]));
    process.stdout.write(execFileSync(process.execPath, [join(directory, path), join(results, dest)], { cwd: directory, env, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }));
  }
  cpSync(results, out, { recursive: true });
} finally { rmSync(directory, { recursive: true, force: true }); rmSync(results, { recursive: true, force: true }); }

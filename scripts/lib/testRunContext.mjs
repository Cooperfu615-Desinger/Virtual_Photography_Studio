// Node-only, ephemeral coordination for one test invocation. No production import.
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import process from 'node:process';
import { performance } from 'node:perf_hooks';

export function createTestRunContext(root) {
  const directory = mkdtempSync(join(tmpdir(), 'vps-tests-run-'));
  const owner = { version: 1, token: randomUUID(), root: realpathSync(root) };
  writeFileSync(join(directory, 'owner.json'), JSON.stringify(owner));
  writeFileSync(join(directory, 'progress.jsonl'), '');
  return { directory, env: { ...process.env, VPS_TEST_RUN_DIRECTORY: directory, VPS_TEST_RUN_TOKEN: owner.token },
    cleanup: () => rmSync(directory, { recursive: true, force: true }) };
}

export function testRunDirectory(root, env = process.env) {
  if (!env.VPS_TEST_RUN_DIRECTORY || !env.VPS_TEST_RUN_TOKEN) return null;
  try {
    const directory = realpathSync(env.VPS_TEST_RUN_DIRECTORY);
    const owner = JSON.parse(readFileSync(join(directory, 'owner.json'), 'utf8'));
    return owner.version === 1 && owner.token === env.VPS_TEST_RUN_TOKEN && owner.root === realpathSync(root) ? directory : null;
  } catch { return null; }
}

export function createTestProgress(label, total, { root, clock = () => performance.now(), emit, intervalMs = 5000 } = {}) {
  const directory = root && testRunDirectory(root);
  const send = emit || (directory ? row => appendFileSync(join(directory, 'progress.jsonl'), JSON.stringify(row) + '\n') : () => {});
  const start = clock(); let last = start, completed = 0;
  const report = (state, extra = {}) => send({ label, state, completed, total, elapsedMs: Math.round(clock() - start), pid: process.pid, rssBytes: process.memoryUsage().rss, ...extra });
  report('start');
  return {
    tick(count, extra = {}) { completed = count; if (clock() - last >= intervalMs) { report('progress', extra); last = clock(); } },
    finish(extra = {}) { report('complete', extra); },
  };
}

// The only shared result is the reviewed pre-Lawson JSON snapshot. Native test
// workers retain isolation. Atomic publication prevents partial reads; no result
// survives the owning runner. Source identity is checked by every consumer.
export function sharedTestJson(root, identity, build, { env = process.env, timeoutMs = 120000 } = {}) {
  const directory = testRunDirectory(root, env);
  if (!directory) return build();
  const file = join(directory, 'pre-lawson.json'), lock = join(directory, 'pre-lawson.lock');
  const start = performance.now();
  for (;;) {
    if (existsSync(file)) {
      const envelope = JSON.parse(readFileSync(file, 'utf8'));
      if (envelope.identity !== identity || envelope.hash !== createHash('sha256').update(envelope.json).digest('hex')) throw new Error('Shared pre-Lawson source/result integrity mismatch');
      return JSON.parse(envelope.json);
    }
    try { mkdirSync(lock); }
    catch (error) {
      if (error.code !== 'EEXIST') throw error;
      if (performance.now() - start > timeoutMs) throw new Error('Timed out waiting for shared pre-Lawson generation');
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
      continue;
    }
    try {
      // Another owner may have published between the read and lock acquisition.
      if (existsSync(file)) continue;
      const value = build(), json = JSON.stringify(value);
      const temporary = resolve(directory, `pre-lawson-${process.pid}.tmp`);
      writeFileSync(temporary, JSON.stringify({ identity, json, hash: createHash('sha256').update(json).digest('hex') }));
      renameSync(temporary, file);
      return JSON.parse(json);
    } finally { rmSync(lock, { recursive: true, force: true }); }
  }
}

export function watchTestProgress(directory, write = text => process.stderr.write(text)) {
  const file = join(directory, 'progress.jsonl'); let offset = 0, remainder = '';
  const flush = () => {
    if (!existsSync(file) || statSync(file).size === offset) return;
    const bytes = readFileSync(file); const text = remainder + bytes.subarray(offset).toString('utf8'); offset = bytes.length;
    const lines = text.split('\n'); remainder = lines.pop();
    for (const line of lines) {
      const row = JSON.parse(line);
      write(`[tests] ${row.label}: ${row.state} ${row.completed}${row.total == null ? '' : '/' + row.total}; ${(row.elapsedMs / 1000).toFixed(1)}s; RSS ${(row.rssBytes / 1048576).toFixed(1)} MiB${row.hits == null ? '' : '; generated ' + row.generations + ', reused ' + row.hits}\n`);
    }
  };
  const timer = setInterval(flush, 250); timer.unref();
  return () => { clearInterval(timer); flush(); };
}

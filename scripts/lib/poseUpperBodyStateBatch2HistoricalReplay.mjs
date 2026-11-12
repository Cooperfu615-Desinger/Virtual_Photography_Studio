// Test-only inverse for the reviewed second posture-projection batch.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import review from './poseUpperBodyStateBatch2History.json' with { type: 'json' };

const hash = source => createHash('sha256').update(source).digest('hex');
export const poseUpperBodyStateBatch2HistoricalPaths = review.files.map(file => file.path);

export function prePoseUpperBodyStateBatch2Source(path, source) {
  const file = review.files.find(item => item.path === path);
  if (!file || hash(source) !== file.afterHash) return source;
  const lines = source.toString().match(/[^\n]*\n|[^\n]+$/g) || [];
  for (const { line, after, before } of [...file.edits].reverse()) {
    assert.deepEqual(lines.slice(line, line + after.length), after, path);
    lines.splice(line, after.length, ...before);
  }
  const original = lines.join('');
  assert.equal(hash(original), file.beforeHash, path);
  return Buffer.isBuffer(source) ? Buffer.from(original) : original;
}

/** Re-run the unchanged first-batch suite against its exact approved runtime. */
export function openPrePoseUpperBodyStateBatch2Runtime() {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const directory = mkdtempSync(join(tmpdir(), 'vps-posture-batch1-'));
  try {
    mkdirSync(join(directory, 'webapp'));
    cpSync(join(root, 'webapp/src'), join(directory, 'webapp/src'), { recursive: true });
    cpSync(join(root, 'webapp/package.json'), join(directory, 'webapp/package.json'));
    symlinkSync(join(root, 'webapp/node_modules'), join(directory, 'webapp/node_modules'), 'dir');
    const evidence = 'Docs/reports/pose-upper-body-state-batch1-2026-11-12';
    mkdirSync(join(directory, evidence), { recursive: true });
    for (const file of ['before.json.gz', 'baseline-revision.json.gz']) {
      cpSync(join(root, evidence, file), join(directory, evidence, file));
    }
    for (const path of poseUpperBodyStateBatch2HistoricalPaths.filter(path => path.startsWith('webapp/'))) {
      const target = join(directory, path);
      const source = readFileSync(target);
      const original = prePoseUpperBodyStateBatch2Source(path, source);
      assert.notEqual(original, source, `${path}: reviewed second-batch bytes required`);
      writeFileSync(target, original);
    }
    return { directory, cleanup: () => rmSync(directory, { recursive: true, force: true }) };
  } catch (error) {
    rmSync(directory, { recursive: true, force: true });
    throw error;
  }
}

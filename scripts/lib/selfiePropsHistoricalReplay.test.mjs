import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import test from 'node:test';
import review from './selfiePropsHistory.json' with { type: 'json' };
import { preSelfiePropsSource, selfiePropsHistoricalPaths } from './selfiePropsHistoricalReplay.mjs';

const root = new URL('../../', import.meta.url);
const hash = value => createHash('sha256').update(value).digest('hex');

test('reviewed phone changes restore exact main bytes, preserving input type and idempotence', () => {
  assert.ok(review.files.length > 0, 'seal must contain the reviewed change');
  assert.equal(new Set(selfiePropsHistoricalPaths).size, review.files.length);
  for (const file of review.files) {
    const current = readFileSync(new URL(file.path, root));
    const original = execFileSync('git', ['show', review.base + ':' + file.path], {
      cwd: fileURLToPath(root), maxBuffer: 16 * 1024 * 1024,
    });
    assert.equal(hash(current), file.afterHash, file.path);
    assert.equal(hash(original), file.beforeHash, file.path);
    const before = preSelfiePropsSource(file.path, current);
    assert.deepEqual(before, original, file.path);
    assert.equal(preSelfiePropsSource(file.path, current.toString()), original.toString(), file.path);
    assert.equal(preSelfiePropsSource(file.path, before), before, file.path);
    const unreviewed = Buffer.concat([current, Buffer.from('\n// unreviewed change\n')]);
    assert.equal(preSelfiePropsSource(file.path, unreviewed), unreviewed, file.path);
  }
  assert.equal(preSelfiePropsSource('unrelated', 'unchanged'), 'unchanged');
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { prePoseUpperBodyStateSource } from './poseUpperBodyStateHistoricalReplay.mjs';
import review from './poseUpperBodyStateHistory.json' with { type: 'json' };

test('batch 1 inverse restores exact reviewed Git bytes and leaves unknown sources untouched', () => {
  assert.equal(review.files.length, 11);
  for (const file of review.files) {
    const current = readFileSync(new URL('../../' + file.path, import.meta.url));
    const before = execFileSync('git', ['show', `${review.base}:${file.path}`]);
    assert.deepEqual(prePoseUpperBodyStateSource(file.path, current), before, file.path);
    assert.equal(prePoseUpperBodyStateSource(file.path, current.toString()), before.toString());
    assert.deepEqual(prePoseUpperBodyStateSource(file.path, before), before, 'idempotent');
    const unknown = Buffer.concat([current, Buffer.from('\n// unreviewed change\n')]);
    assert.equal(prePoseUpperBodyStateSource(file.path, unknown), unknown, 'unknown bytes fail closed');
  }
  const unrelated = Buffer.from('unrelated source');
  assert.equal(prePoseUpperBodyStateSource('not-in-review.js', unrelated), unrelated);
});

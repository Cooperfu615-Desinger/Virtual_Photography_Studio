import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { preLawsonSceneSource } from './lawsonSceneHistoricalReplay.mjs';
import review from './lawsonSceneHistory.json' with { type: 'json' };

test('Lawson historical inverse restores only the exact reviewed main bytes', () => {
  for (const file of review.files) {
    const current = readFileSync(new URL('../../' + file.path, import.meta.url));
    const expected = execFileSync('git', ['show', `${review.baseCommit}:${file.path}`], { maxBuffer: 32 * 1024 * 1024 });
    assert.deepEqual(preLawsonSceneSource(file.path, current), expected, file.path);
    const unknown = Buffer.concat([current, Buffer.from('unreviewed')]);
    assert.equal(preLawsonSceneSource(file.path, unknown), unknown, file.path);
    assert.equal(preLawsonSceneSource(file.path, expected), expected, file.path);
  }
});

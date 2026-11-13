import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import review from './aloofCatsHistory.json' with { type: 'json' };
import { aloofCatsHistoricalPaths, preAloofCatsSource } from './aloofCatsHistoricalReplay.mjs';

const root = new URL('../../', import.meta.url);
const hash = source => createHash('sha256').update(source).digest('hex');

test('adjustable cat-pose inverse restores exact baseline bytes without accepting unreviewed edits', () => {
  assert.equal(review.base, 'f4cf8a81ee6ff5d27dda56c4b7ab38665530c82c');
  assert.ok(review.files.length > 0, 'review must contain the approved source changes');
  assert.equal(new Set(aloofCatsHistoricalPaths).size, review.files.length);
  assert.deepEqual(new Set(aloofCatsHistoricalPaths), new Set([
    'scripts/lib/poseUpperBodyStateBatch3HistoricalReplay.test.mjs',
    'webapp/src/lib/engine/c3PoseGuards.test.js',
    'webapp/src/lib/engine/indoorSeating.js',
    'webapp/src/lib/engine/indoorSeating.test.js',
    'webapp/src/lib/engine/outdoorLeanFixtures.js',
    'webapp/src/lib/engine/outdoorSeatFixtures.js',
    'webapp/src/lib/engine/outdoorSeatPrompt.test.js',
    'webapp/src/lib/engine/outdoorSeating.test.js',
    'webapp/src/lib/engine/specifiedActionUnified.test.js',
    'webapp/src/lib/engine/specifiedActionUpperBodyStateBatch3.test.js',
    'webapp/src/lib/engine/specifiedActionUpperBodyStateBatch3Fixtures.js',
    'webapp/src/lib/engine/specifiedActions.js',
    'webapp/src/lib/engine/specifiedActions.test.js',
  ]));
  for (const file of review.files) {
    const current = readFileSync(new URL(file.path, root));
    const original = execFileSync('git', ['show', `${review.base}:${file.path}`], {
      cwd: fileURLToPath(root), maxBuffer: 16 * 1024 * 1024,
    });
    assert.equal(hash(current), file.afterHash, file.path);
    assert.equal(hash(original), file.beforeHash, file.path);
    const before = preAloofCatsSource(file.path, current);
    assert.deepEqual(before, original, file.path);
    assert.equal(preAloofCatsSource(file.path, current.toString()), original.toString(), file.path);
    assert.equal(preAloofCatsSource(file.path, before), before, 'idempotent');
    const unknown = Buffer.concat([current, Buffer.from('\n// unreviewed change\n')]);
    assert.equal(preAloofCatsSource(file.path, unknown), unknown, 'unknown bytes remain unchanged');
  }
  const unrelated = Buffer.from('unrelated source');
  assert.equal(preAloofCatsSource('not-in-review.js', unrelated), unrelated);
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import review from './poseUpperBodyStateBatch2History.json' with { type: 'json' };
import { prePoseUpperBodyStateBatch2Source } from './poseUpperBodyStateBatch2HistoricalReplay.mjs';

const hash = source => createHash('sha256').update(source).digest('hex');

test('batch 2 inverse restores reviewed first-batch Git bytes and leaves unknown sources untouched', () => {
  assert.equal(review.base, '28200431b85cc49c18900489938f8ae0e8c4e0be');
  assert.deepEqual(new Set(review.files.map(file => file.path)), new Set([
    'webapp/src/lib/engine.js',
    'webapp/src/lib/engine/specifiedActions.js',
    'webapp/src/lib/engine/promptOutputContracts.js',
    'webapp/src/lib/engine/promptOutputContracts.test.js',
    'webapp/src/lib/engine/gazeGesture.test.js',
    'webapp/src/lib/engineBlackTieShirt.test.js',
    'webapp/package.json',
    'webapp/src/lib/engine/specifiedActionUpperBodyState.test.js',
    'webapp/src/lib/engine/upperBodyStateBaselineRevisionTestSupport.js',
    'scripts/lib/poseUpperBodyStateHistoricalReplay.mjs',
  ]));
  for (const file of review.files) {
    const current = readFileSync(new URL('../../' + file.path, import.meta.url));
    const before = execFileSync('git', ['show', `${review.base}:${file.path}`]);
    assert.equal(hash(current), file.afterHash, file.path);
    assert.equal(hash(before), file.beforeHash, file.path);
    assert.deepEqual(prePoseUpperBodyStateBatch2Source(file.path, current), before, file.path);
    assert.equal(prePoseUpperBodyStateBatch2Source(file.path, current.toString()), before.toString(), file.path);
    assert.deepEqual(prePoseUpperBodyStateBatch2Source(file.path, before), before, 'idempotent');
    const unknown = Buffer.concat([current, Buffer.from('\n// unreviewed change\n')]);
    assert.equal(prePoseUpperBodyStateBatch2Source(file.path, unknown), unknown, 'unknown bytes fail closed');
  }
});

test('composed baseline revisions keep original coverage and reject unreviewed or missing cases', async () => {
  const { gunzipSync } = await import('node:zlib');
  const { assertUpperBodyStateBaselineRevision } = await import('../../webapp/src/lib/engine/upperBodyStateBaselineRevisionTestSupport.js');
  const original = JSON.parse(readFileSync(new URL('../../webapp/src/lib/engine/indoorSeatBaseline.json', import.meta.url))).rows;
  const reviews = [1, 2].map(batch => JSON.parse(gunzipSync(readFileSync(new URL(
    `../../Docs/reports/pose-upper-body-state-batch${batch}-2026-11-12/baseline-revision.json.gz`, import.meta.url,
  )))));
  const changes = Object.assign({}, ...reviews.map(review => review.changes.indoorSeat));
  const current = Object.fromEntries(Object.entries(original).filter(([key]) => !key.startsWith('outdoor/'))
    .map(([key, row]) => [key, structuredClone(changes[key]?.after || row)]));
  assertUpperBodyStateBaselineRevision('indoorSeat', current, original);
  const unrelated = Object.keys(current).find(key => !Object.hasOwn(changes, key));
  assert.ok(unrelated);
  const missing = { ...current };
  delete missing[unrelated];
  assert.throws(() => assertUpperBodyStateBaselineRevision('indoorSeat', missing, original));
  const modified = structuredClone(current);
  modified[unrelated].draws += 1;
  assert.throws(() => assertUpperBodyStateBaselineRevision('indoorSeat', modified, original));
});

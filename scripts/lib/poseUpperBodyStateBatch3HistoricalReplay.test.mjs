import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import review from './poseUpperBodyStateBatch3History.json' with { type: 'json' };
import { prePoseUpperBodyStateBatch3Source } from './poseUpperBodyStateBatch3HistoricalReplay.mjs';
import { preAloofCatsSource } from './aloofCatsHistoricalReplay.mjs';

const hash = source => createHash('sha256').update(source).digest('hex');

test('batch 3 inverse restores exact reviewed second-batch Git bytes and leaves unknown sources untouched', () => {
  assert.equal(review.base, '03f2664465351d06abe890445f55b0e1f6791f3d');
  assert.deepEqual(new Set(review.files.map(file => file.path)), new Set([
    'scripts/lib/poseUpperBodyStateBatch2HistoricalReplay.mjs',
    'scripts/lib/poseUpperBodyStateBatch2HistoricalReplay.test.mjs',
    'webapp/src/lib/engine/gazeGesture.test.js',
    'webapp/src/lib/engine/indoorKneelBaseline.test.js',
    'webapp/src/lib/engine/specifiedActionUpperBodyStateBatch2.test.js',
    'webapp/src/lib/engine/upperBodyStateBaselineRevisionTestSupport.js',
    'webapp/src/lib/engine/specifiedActions.js',
    'webapp/src/lib/engine/promptOutputContracts.js',
    'webapp/src/lib/engine/promptOutputContracts.test.js',
    'webapp/package.json',
    'webapp/src/lib/engineBlackTieShirt.test.js',
  ]));
  for (const file of review.files) {
    const current = preAloofCatsSource(file.path, readFileSync(new URL('../../' + file.path, import.meta.url)));
    const before = execFileSync('git', ['show', `${review.base}:${file.path}`]);
    assert.equal(hash(current), file.afterHash, file.path);
    assert.equal(hash(before), file.beforeHash, file.path);
    assert.deepEqual(prePoseUpperBodyStateBatch3Source(file.path, current), before, file.path);
    assert.equal(prePoseUpperBodyStateBatch3Source(file.path, current.toString()), before.toString(), file.path);
    assert.deepEqual(prePoseUpperBodyStateBatch3Source(file.path, before), before, 'idempotent');
    const unknown = Buffer.concat([current, Buffer.from('\n// unreviewed change\n')]);
    assert.equal(prePoseUpperBodyStateBatch3Source(file.path, unknown), unknown, 'unknown bytes fail closed');
  }
  const unrelated = Buffer.from('unrelated source');
  assert.equal(prePoseUpperBodyStateBatch3Source('not-in-review.js', unrelated), unrelated);
});

test('batch 3 kneel revision preserves every original matrix row and rejects missing or unrelated changes', async () => {
  const { assertUpperBodyStateBaselineRevision } = await import('../../webapp/src/lib/engine/upperBodyStateBaselineRevisionTestSupport.js');
  const original = JSON.parse(readFileSync(new URL('../../webapp/src/lib/engine/indoorKneelProtectedBaseline.json', import.meta.url))).rows;
  const revision = JSON.parse(gunzipSync(readFileSync(new URL('../../Docs/reports/pose-upper-body-state-batch3-2026-11-12/baseline-revision.json.gz', import.meta.url))));
  assert.equal(revision.base, review.base);
  assert.equal(revision.actionIds.length, 6);
  assert.deepEqual(Object.keys(revision.changes), ['indoorSeat', 'indoorSeating', 'outdoorLean', 'indoorKneel']);
  assert.ok(Object.values(revision.changes).slice(0, 3).every(rows => Object.keys(rows).length === 0));
  const changes = revision.changes.indoorKneel;
  assert.equal(Object.keys(changes).length, 924); // 83 indoor + 71 outdoor scenes, six general kneels.
  for (const [key, change] of Object.entries(changes)) {
    assert.match(key, /^(indoor-kneel-unspecified|outdoor-kneel)\//);
    assert.ok(revision.actionIds.includes(change.actionId));
    assert.equal(change.after.samples, change.before.samples, key);
    assert.notEqual(change.after.sha256, change.before.sha256, key);
  }
  const current = Object.fromEntries(Object.entries(original).map(([key, row]) => [key, structuredClone(changes[key]?.after || row)]));
  assert.equal(Object.keys(current).length, 1528);
  assert.equal(Object.values(current).reduce((sum, row) => sum + row.samples, 0), 17220);
  assertUpperBodyStateBaselineRevision('indoorKneel', current, original);
  const unaffected = Object.keys(current).find(key => !Object.hasOwn(changes, key));
  assert.ok(unaffected);
  const missing = { ...current };
  delete missing[unaffected];
  assert.throws(() => assertUpperBodyStateBaselineRevision('indoorKneel', missing, original));
  const modified = structuredClone(current);
  modified[unaffected].sha256 = 'unreviewed';
  assert.throws(() => assertUpperBodyStateBaselineRevision('indoorKneel', modified, original));
  const approvedChanged = structuredClone(current);
  approvedChanged[Object.keys(changes)[0]].sha256 = 'unreviewed';
  assert.throws(() => assertUpperBodyStateBaselineRevision('indoorKneel', approvedChanged, original));
});

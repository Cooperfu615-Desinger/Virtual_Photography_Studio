// Current approved differences are explicit; the older frozen baselines are never rewritten.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

const review = JSON.parse(gunzipSync(readFileSync(new URL('../../../../Docs/reports/pose-upper-body-state-batch1-2026-11-12/baseline-revision.json.gz', import.meta.url))));

export function assertUpperBodyStateBaselineRevision(kind, current, baseline) {
  const changes = review.changes[kind];
  assert.ok(changes, kind);
  const keys = Object.keys(baseline).filter(key => kind !== 'indoorSeat' || !key.startsWith('outdoor/'));
  assert.deepEqual(Object.keys(current), keys, `${kind}: original ordered case coverage`);
  for (const [key, row] of Object.entries(current)) {
    const approved = changes[key];
    assert.ok(Object.hasOwn(baseline, key), key);
    if (approved) {
      assert.ok(review.actionIds.includes(approved.actionId), key);
      assert.deepEqual(baseline[key], approved.before, `${key}: original immutable baseline`);
      assert.deepEqual(row, approved.after, `${key}: approved upper-body-state revision`);
    } else assert.deepEqual(row, baseline[key], key);
  }
  for (const key of Object.keys(changes)) assert.ok(Object.hasOwn(current, key), `${kind}: missing revision case ${key}`);
}

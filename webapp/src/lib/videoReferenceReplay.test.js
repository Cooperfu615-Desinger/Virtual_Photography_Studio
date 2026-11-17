import { Buffer } from 'node:buffer';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { preVideoReferenceSource } from '../../../scripts/lib/videoReferenceReplay.mjs';
const review = JSON.parse(readFileSync(new URL('../../../scripts/lib/videoReferenceReplay.json', import.meta.url)));
test('reference-video replay restores only exact approved changes against the pinned main commit', () => {
  const root = new URL('../../../', import.meta.url);
  for (const file of review.files) {
    const current = readFileSync(new URL(file.path, root));
    const original = execFileSync('git', ['show', `${review.baseCommit}:${file.path}`], { cwd: root });
    assert.deepEqual(preVideoReferenceSource(file.path, current), original);
    assert.equal(preVideoReferenceSource(file.path, file.beforeSource), file.beforeSource);
    const unknown = Buffer.concat([current, Buffer.from('\nunknown')]);
    assert.equal(preVideoReferenceSource(file.path, unknown), unknown);
  }
});

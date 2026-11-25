import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { preOmniRemovalSource } from '../../../scripts/lib/omniRemovalReplay.mjs';
import review from '../../../scripts/lib/omniRemovalReplay.json' with { type: 'json' };

test('Omni removal inverse restores exact prior bytes and rejects unknown changes', () => {
  for (const file of review.files) {
    const current = readFileSync(new URL('../../../' + file.path, import.meta.url));
    assert.deepEqual(preOmniRemovalSource(file.path, current), execFileSync('git', ['show', `${review.baseCommit}:${file.path}`]));
    const unknown = Buffer.concat([current, Buffer.from('changed')]);
    assert.deepEqual(preOmniRemovalSource(file.path, unknown), unknown);
  }
});

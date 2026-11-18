import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { preClosedEyeGazeSource, preGestureExpressionGazeSource } from '../../../../scripts/lib/gestureExpressionGazeHistoricalReplay.mjs';
import review from '../../../../scripts/lib/gestureExpressionGazeHistory.json' with { type: 'json' };

import closedEyeReview from '../../../../scripts/lib/closedEyeGazeHistory.json' with { type: 'json' };

const hash = value => createHash('sha256').update(value).digest('hex');
test('the separate exact inverse reconstructs every pre-addition source without rewriting old seals', () => {
  for (const file of closedEyeReview.files) {
    const source = readFileSync(new URL(`../../../../${file.path}`, import.meta.url));
    assert.equal(hash(source), file.afterHash, file.path);
    assert.equal(hash(preClosedEyeGazeSource(file.path, source)), file.beforeHash, file.path);
    const unknown = Buffer.concat([source, Buffer.from('\n// unreviewed change\n')]);
    assert.equal(preClosedEyeGazeSource(file.path, unknown), unknown);
  }
  for (const file of review.files) {
    const source = readFileSync(new URL(`../../../../${file.path}`, import.meta.url));
    assert.equal(hash(preClosedEyeGazeSource(file.path, source)), file.afterHash, file.path);
    const original = preGestureExpressionGazeSource(file.path, source);
    assert.ok(Buffer.isBuffer(original)); assert.equal(hash(original), file.beforeHash, file.path);
    assert.equal(preGestureExpressionGazeSource(file.path, original), original);
    const unknown = Buffer.concat([source, Buffer.from('\n// unreviewed change\n')]);
    assert.equal(preGestureExpressionGazeSource(file.path, unknown), unknown);
  }
});

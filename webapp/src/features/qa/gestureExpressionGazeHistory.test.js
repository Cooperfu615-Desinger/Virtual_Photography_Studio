import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { preClosedEyeGazeSource, preGestureExpressionGazeSource, prePage3FieldActionsSource, prePage3PersonSource } from '../../../../scripts/lib/gestureExpressionGazeHistoricalReplay.mjs';
import review from '../../../../scripts/lib/gestureExpressionGazeHistory.json' with { type: 'json' };

import closedEyeReview from '../../../../scripts/lib/closedEyeGazeHistory.json' with { type: 'json' };

import page3PersonReview from '../../../../scripts/lib/page3PersonHistory.json' with { type: 'json' };

import page3FieldActionsReview from '../../../../scripts/lib/page3FieldActionsHistory.json' with { type: 'json' };

const readSource = path => readFileSync(new URL(`../../../../${path}`, import.meta.url));
const hash = value => createHash('sha256').update(value).digest('hex');
test('the separate exact inverse reconstructs every pre-addition source without rewriting old seals', () => {
  for (const file of page3FieldActionsReview.files) {
    const source = readSource(file.path);
    assert.equal(hash(source), file.afterHash, file.path);
    assert.equal(hash(prePage3FieldActionsSource(file.path, source)), file.beforeHash, file.path);
    const unknown = Buffer.concat([source, Buffer.from('\n// unreviewed change\n')]);
    assert.equal(prePage3FieldActionsSource(file.path, unknown), unknown);
  }
  for (const file of page3PersonReview.files) {
    const source = prePage3FieldActionsSource(file.path, readSource(file.path));
    assert.equal(hash(source), file.afterHash, file.path);
    assert.equal(hash(prePage3PersonSource(file.path, source)), file.beforeHash, file.path);
    const unknown = Buffer.concat([source, Buffer.from('\n// unreviewed change\n')]);
    assert.equal(prePage3PersonSource(file.path, unknown), unknown);
  }
  for (const file of closedEyeReview.files) {
    const source = prePage3PersonSource(file.path, readSource(file.path));
    assert.equal(hash(source), file.afterHash, file.path);
    assert.equal(hash(preClosedEyeGazeSource(file.path, source)), file.beforeHash, file.path);
    const unknown = Buffer.concat([source, Buffer.from('\n// unreviewed change\n')]);
    assert.equal(preClosedEyeGazeSource(file.path, unknown), unknown);
  }
  for (const file of review.files) {
    const source = prePage3PersonSource(file.path, readSource(file.path));
    assert.equal(hash(preClosedEyeGazeSource(file.path, source)), file.afterHash, file.path);
    const original = preGestureExpressionGazeSource(file.path, source);
    assert.ok(Buffer.isBuffer(original)); assert.equal(hash(original), file.beforeHash, file.path);
    assert.equal(preGestureExpressionGazeSource(file.path, original), original);
    const unknown = Buffer.concat([source, Buffer.from('\n// unreviewed change\n')]);
    assert.equal(preGestureExpressionGazeSource(file.path, unknown), unknown);
  }
});

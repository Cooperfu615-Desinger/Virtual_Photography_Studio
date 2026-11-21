import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { preClosedEyeGazeSource, preGestureExpressionGazeSource, prePage3FieldActionsSource, prePage3LocationExpansionSource, prePage3LocationPilotSource, prePage3PersonPerformanceSource, prePage3PersonSource } from '../../../../scripts/lib/gestureExpressionGazeHistoricalReplay.mjs';
import review from '../../../../scripts/lib/gestureExpressionGazeHistory.json' with { type: 'json' };

import closedEyeReview from '../../../../scripts/lib/closedEyeGazeHistory.json' with { type: 'json' };

import page3PersonReview from '../../../../scripts/lib/page3PersonHistory.json' with { type: 'json' };

import page3FieldActionsReview from '../../../../scripts/lib/page3FieldActionsHistory.json' with { type: 'json' };
import page3LocationPilot from '../../../../scripts/lib/page3LocationPilotHistory.json' with { type: 'json' };
import page3LocationExpansion from '../../../../scripts/lib/page3LocationExpansionHistory.json' with { type: 'json' };
import page3PersonPerformance from '../../../../scripts/lib/page3PersonPerformanceHistory.json' with { type: 'json' };

const readSource = path => readFileSync(new URL(`../../../../${path}`, import.meta.url));
const hash = value => createHash('sha256').update(value).digest('hex');
test('scene-person performance can restore each previous runtime source byte for byte', () => {
  for (const file of page3PersonPerformance.files) {
    const source = readSource(file.path);
    assert.equal(hash(source), file.afterHash, file.path);
    assert.equal(hash(prePage3PersonPerformanceSource(file.path, source)), file.beforeHash, file.path);
    const unknown = Buffer.concat([source, Buffer.from('\n// unreviewed change\n')]);
    assert.equal(prePage3PersonPerformanceSource(file.path, unknown), unknown);
  }
});

test('the twelve-location expansion restores the accepted four-location pilot exactly', () => {
  assert.ok(page3LocationExpansion.files.some(file => file.path === 'webapp/src/data/page3WorldScenes.js'));
  for (const file of page3LocationExpansion.files) {
    const source = readSource(file.path);
    assert.equal(hash(source), file.afterHash, file.path);
    const pilot = page3LocationPilot.files.find(item => item.path === file.path);
    assert.equal(file.beforeHash, pilot.afterHash, file.path);
    assert.equal(hash(prePage3LocationExpansionSource(file.path, source)), pilot.afterHash, file.path);
    const unknown = Buffer.concat([source, Buffer.from('\n// unreviewed change\n')]);
    assert.equal(prePage3LocationExpansionSource(file.path, unknown), unknown);
  }
});

test('the four-location pilot restores the prior PAGE3 locations and renderer exactly', () => {
  for (const file of page3LocationPilot.files) {
    const source = prePage3LocationExpansionSource(file.path, readSource(file.path));
    assert.equal(hash(source), file.afterHash, file.path);
    assert.equal(hash(prePage3LocationPilotSource(file.path, source)), file.beforeHash, file.path);
    const unknown = Buffer.concat([source, Buffer.from('\n// unreviewed change\n')]);
    assert.equal(prePage3LocationPilotSource(file.path, unknown), unknown);
  }
});

test('the separate exact inverse reconstructs every pre-addition source without rewriting old seals', () => {
  for (const file of page3FieldActionsReview.files) {
    const source = prePage3LocationPilotSource(file.path, readSource(file.path));
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

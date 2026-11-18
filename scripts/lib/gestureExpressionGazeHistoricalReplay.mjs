// Test-only exact inverse of the seven approved additions; historical seals stay immutable.
// Unknown source bytes pass through, so earlier strict replay continues to reject drift.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import review from './gestureExpressionGazeHistory.json' with { type: 'json' };

import closedEyeReview from './closedEyeGazeHistory.json' with { type: 'json' };

const hash = source => createHash('sha256').update(source).digest('hex');
export const gestureExpressionGazeHistoricalPaths = [...new Set(
  [...closedEyeReview.files, ...review.files].map(file => file.path)
)];
export function preGestureExpressionGazeSource(path, source) {
  return reverseReviewedSource(review, path, preClosedEyeGazeSource(path, source));
}

export function preClosedEyeGazeSource(path, source) {
  return reverseReviewedSource(closedEyeReview, path, source);
}

function reverseReviewedSource(manifest, path, source) {
  const file = manifest.files.find(item => item.path === path);
  if (!file || hash(source) !== file.afterHash) return source;
  const lines = source.toString().match(/[^\n]*\n|[^\n]+$/g) || [];
  for (const { line, after, before } of [...file.edits].reverse()) {
    assert.deepEqual(lines.slice(line, line + after.length), after, path);
    lines.splice(line, after.length, ...before);
  }
  const original = lines.join('');
  assert.equal(hash(original), file.beforeHash, path);
  return Buffer.isBuffer(source) ? Buffer.from(original) : original;
}

// Test-only exact inverse of the seven approved additions; historical seals stay immutable.
// Unknown source bytes pass through, so earlier strict replay continues to reject drift.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import review from './gestureExpressionGazeHistory.json' with { type: 'json' };
import biteHemGesture from './biteHemGestureHistory.json' with { type: 'json' };

import raisedTopHem from './raisedTopHemHistory.json' with { type: 'json' };
import underbustTeeGesture from './underbustTeeGestureHistory.json' with { type: 'json' };
import waistbandLiftGesture from './waistbandLiftGestureHistory.json' with { type: 'json' };
import adjustTopGesture from './adjustTopGestureHistory.json' with { type: 'json' };
import bodyTightFit from './bodyTightFitHistory.json' with { type: 'json' };
import page3FieldActions from './page3FieldActionsHistory.json' with { type: 'json' };
import page3Person from './page3PersonHistory.json' with { type: 'json' };
import page3Compression from './page3PromptCompressionHistory.json' with { type: 'json' };
import closedEyeReview from './closedEyeGazeHistory.json' with { type: 'json' };

const hash = source => createHash('sha256').update(source).digest('hex');
export const gestureExpressionGazeHistoricalPaths = [...new Set(
  [...biteHemGesture.files, ...bodyTightFit.files, ...adjustTopGesture.files, ...waistbandLiftGesture.files, ...underbustTeeGesture.files, ...raisedTopHem.files, ...page3FieldActions.files, ...page3Person.files, ...page3Compression.files, ...closedEyeReview.files, ...review.files].map(file => file.path)
)];
export function preGestureExpressionGazeSource(path, source) {
  const prePage3PromptSource = reverseReviewedSource(page3Compression, path, prePage3PersonSource(path, source));
  return reverseReviewedSource(review, path, preClosedEyeGazeSource(path, prePage3PromptSource));
}

export function prePage3FieldActionsSource(path, source) {
  return reverseReviewedSource(page3FieldActions, path, preRaisedTopHemSource(path, source));
}

export function preRaisedTopHemSource(path, source) {
  const beforeBiteHem = reverseReviewedSource(biteHemGesture, path, source);
  const beforeBodyTightFit = reverseReviewedSource(bodyTightFit, path, beforeBiteHem);
  const beforeAdjustTop = reverseReviewedSource(adjustTopGesture, path, beforeBodyTightFit);
  const beforeWaistbandLift = reverseReviewedSource(waistbandLiftGesture, path, beforeAdjustTop);
  return reverseReviewedSource(raisedTopHem, path, reverseReviewedSource(underbustTeeGesture, path, beforeWaistbandLift));
}

export function prePage3PersonSource(path, source) {
  return reverseReviewedSource(page3Person, path, prePage3FieldActionsSource(path, source));
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

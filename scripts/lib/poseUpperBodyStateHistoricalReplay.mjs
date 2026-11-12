// Test-only inverse of the approved batch 1 projection. Historical seals stay unchanged.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import review from './poseUpperBodyStateHistory.json' with { type: 'json' };
import { poseUpperBodyStateBatch2HistoricalPaths, prePoseUpperBodyStateBatch2Source } from './poseUpperBodyStateBatch2HistoricalReplay.mjs';

const hash = value => createHash('sha256').update(value).digest('hex');
export const poseUpperBodyStateHistoricalPaths = [...new Set([...poseUpperBodyStateBatch2HistoricalPaths, ...review.files.map(file => file.path)])];

export function prePoseUpperBodyStateSource(path, source) {
  source = prePoseUpperBodyStateBatch2Source(path, source);
  const file = review.files.find(item => item.path === path);
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

// Exact test-only inverse for replaying frozen pre-Lawson history.
import { poseUpperBodyStateHistoricalPaths, prePoseUpperBodyStateSource } from './poseUpperBodyStateHistoricalReplay.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import review from './lawsonSceneHistory.json' with { type: 'json' };

const hash = value => createHash('sha256').update(value).digest('hex');
export const lawsonSceneHistoricalPaths = [...new Set([...poseUpperBodyStateHistoricalPaths, ...review.files.map(file => file.path)])];
export function preLawsonSceneSource(path, source) {
  source = prePoseUpperBodyStateSource(path, source);
  const file = review.files.find(item => item.path === path);
  if (!file || hash(source) !== file.afterHash) return source;
  const lines = source.toString().match(/[^\n]*\n|[^\n]+$/g) || [];
  for (const { line, after, before } of [...file.edits].reverse()) {
    assert.deepEqual(lines.slice(line, line + after.length), after, path);
    lines.splice(line, after.length, ...before);
  }
  const result = lines.join('');
  assert.equal(hash(result), file.beforeHash, path);
  return Buffer.isBuffer(source) ? Buffer.from(result) : result;
}

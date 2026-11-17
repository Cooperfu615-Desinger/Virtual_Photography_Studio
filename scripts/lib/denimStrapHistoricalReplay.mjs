// Test-only exact inverse of the reviewed loose-strap clarification.
// Preserve the original overalls revision and all earlier seals unchanged.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import review from './denimStrapHistory.json' with { type: 'json' };

const hash = source => createHash('sha256').update(source).digest('hex');
export const denimStrapHistoricalPaths = review.files.map(file => file.path);
export function preDenimStrapSource(path, source) {
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

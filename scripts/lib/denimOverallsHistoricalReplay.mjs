// Exact test-only inverse of the approved two-item wording and MJ exception.
// Unknown bytes pass through so the older strict seals still reject them.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import review from './denimOverallsHistory.json' with { type: 'json' };

const hash = source => createHash('sha256').update(source).digest('hex');
export const denimOverallsHistoricalPaths = review.files.map(file => file.path);
export function preDenimOverallsSource(path, source) {
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

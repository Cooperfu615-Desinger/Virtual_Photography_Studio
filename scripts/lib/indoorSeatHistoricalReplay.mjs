// Strip this feature only from exact, reviewed source bytes used by historical tests.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import review from './indoorSeatHistory.json' with { type:'json' };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export const indoorSeatHistoricalPaths = review.files.map(file => file.path);
export function preIndoorSeatSource(path, source) {
  const file = review.files.find(entry => entry.path === path);
  if (!file || hash(source) !== file.afterHash) return source;
  const lines = source.toString().match(/[^\n]*\n|[^\n]+$/g) || [];
  for (const {line, after, before} of [...file.edits].reverse()) {
    assert.deepEqual(lines.slice(line, line + after.length), after, path);
    lines.splice(line, after.length, ...before);
  }
  const original = lines.join('');
  assert.equal(hash(original), file.beforeHash, path);
  return Buffer.isBuffer(source) ? Buffer.from(original) : original;
}

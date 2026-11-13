// Test-only exact inverse for the separately selected adjustable-angle cat pose.
// Older source seals and saved public prompts remain immutable.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import review from './aloofCatsHistory.json' with { type: 'json' };

const hash = source => createHash('sha256').update(source).digest('hex');
export const aloofCatsHistoricalPaths = review.files.map(file => file.path);

export function preAloofCatsSource(path, source) {
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

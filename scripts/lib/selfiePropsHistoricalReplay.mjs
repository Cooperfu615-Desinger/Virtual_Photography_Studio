// Test-only inverse of the reviewed phone-prop and companion-orbit changes.
// Runtime product code never imports this module or its review data.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import review from './selfiePropsHistory.json' with { type: 'json' };

const hash = value => createHash('sha256').update(value).digest('hex');
export const selfiePropsHistoricalPaths = review.files.map(file => file.path);

export function preSelfiePropsSource(path, source) {
  const file = review.files.find(entry => entry.path === path);
  // Unknown bytes must reach the older strict boundaries unchanged.
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

// Test-only inverse of the reviewed skirt-underlayer extension.
// Earlier replay stages keep their original seals and receive the same source bytes.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import review from './skirtUnderlayerHistory.json' with { type: 'json' };

const hash = value => createHash('sha256').update(value).digest('hex');
export const skirtUnderlayerHistoricalPaths = review.files.map(file => file.path);

export function preSkirtUnderlayerSource(path, source) {
  const file = review.files.find(entry => entry.path === path);
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

// Apply an exact, test-only inverse before the older historical replay stages.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import review from './manualUnderlayerHistory.json' with { type:'json' };
import { preSelfiePropsSource, selfiePropsHistoricalPaths } from './selfiePropsHistoricalReplay.mjs';

const hash = input => createHash('sha256').update(input).digest('hex');
export const underlayerHistoricalPaths = [...new Set([...selfiePropsHistoricalPaths, ...review.files.map(file => file.path)])];
export function preUnderlayerSource(path, source) {
  source = preSelfiePropsSource(path, source);
  const file = review.files.find(entry => entry.path === path);
  if (!file || hash(source) !== file.afterHash) return source;
  const lines = source.toString().match(/[^\n]*\n|[^\n]+$/g) || [];
  for (const edit of [...file.edits].reverse()) {
    assert.deepEqual(lines.slice(edit.line, edit.line + edit.after.length), edit.after, path);
    lines.splice(edit.line, edit.after.length, ...edit.before);
  }
  const original = lines.join('');
  assert.equal(hash(original), file.beforeHash, path);
  return Buffer.isBuffer(source) ? Buffer.from(original) : original;
}

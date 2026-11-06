// Strip this feature only from exact, reviewed source bytes used by historical tests.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import review from './indoorSeatHistory.json' with { type:'json' };
import restore from './indoorSeatRestoreHistory.json' with { type:'json' };
import { indoorLeanHistoricalPaths, preIndoorLeanSource } from './indoorLeanHistoricalReplay.mjs';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export const indoorSeatHistoricalPaths = [...new Set([...indoorLeanHistoricalPaths, ...[...review.files, ...restore.files].map(file => file.path)])];
function undo(file, source) {
  if (!file || hash(source) !== file.afterHash) return source;
  const lines = source.toString().match(/[^\n]*\n|[^\n]+$/g) || [];
  for (const {line, after, before} of [...file.edits].reverse()) {
    assert.deepEqual(lines.slice(line, line + after.length), after, file.path);
    lines.splice(line, after.length, ...before);
  }
  const original = lines.join('');
  assert.equal(hash(original), file.beforeHash, file.path);
  return Buffer.isBuffer(source) ? Buffer.from(original) : original;
}

export function preIndoorSeatSource(path, source) {
  source = preIndoorLeanSource(path, source);
  const beforeRestore = undo(restore.files.find(file => file.path === path), source);
  return undo(review.files.find(entry => entry.path === path), beforeRestore);
}

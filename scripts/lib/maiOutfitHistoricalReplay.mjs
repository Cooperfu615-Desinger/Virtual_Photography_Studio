// Test-only inverse of the new catalog entry for sealed historical replays.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import patches from './maiOutfitHistoricalPatches.json' with { type: 'json' };
import { preSelfiePropsSource } from './selfiePropsHistoricalReplay.mjs';
const hash = value => createHash('sha256').update(value).digest('hex');
export const maiOutfitHistoricalPaths = patches.files.map(item => item.path);
export function preMaiOutfitSource(path, source) {
 source = preSelfiePropsSource(path, source);
 const patch = patches.files.find(item => item.path === path);
 if (!patch || hash(source) !== patch.afterHash) return source;
 const lines = source.toString().match(/[^\n]*\n|[^\n]+$/g) || [];
 for (const edit of [...patch.edits].reverse()) {
  const count = (edit.after.match(/\n/g) || []).length;
  assert.equal(lines.slice(edit.afterLine, edit.afterLine + count).join(''), edit.after, 'Outfit inverse fragment: ' + path);
  lines.splice(edit.afterLine, count, edit.before);
 }
 const before = lines.join('');
 assert.equal(hash(before), patch.beforeHash, 'Outfit inverse must restore main bytes: ' + path);
 return Buffer.isBuffer(source) ? Buffer.from(before) : before;
}

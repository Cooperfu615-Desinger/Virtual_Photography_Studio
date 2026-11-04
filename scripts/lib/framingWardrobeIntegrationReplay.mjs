// Test-only exact inverse for integration with the reviewed main baseline.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, realpathSync, existsSync, lstatSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import review from './framingWardrobeIntegrationPatches.json' with { type: 'json' };
const root = fileURLToPath(new URL('../../', import.meta.url));
const hash = value => createHash('sha256').update(value).digest('hex');
export function preFramingWardrobeSource(path, source) {
  const patch = review.files.find(item => item.path === path);
  if (!patch) return source;
  const sha = hash(source);
  if (sha !== patch.afterHash) {
    // Earlier replay stages own their own hashes. A modified current engine
    // must never silently bypass this integration boundary.
    if (path === 'webapp/src/lib/engine.js') assert.ok(!source.toString().includes('function retainResolvedWardrobe('), 'Framing inverse rejects unknown current engine');
    return source;
  }
  const lines = source.toString().match(/[^\n]*\n|[^\n]+$/g) || [];
  for (const edit of [...patch.edits].reverse()) {
    const count = (edit.after.match(/\n/g) || []).length;
    assert.equal(lines.slice(edit.afterLine, edit.afterLine + count).join(''), edit.after, 'Framing inverse fragment: ' + path);
    lines.splice(edit.afterLine, count, edit.before);
  }
  const before = lines.join('');
  assert.equal(hash(before), patch.beforeHash, 'Framing inverse must restore reviewed main bytes: ' + path);
  return Buffer.isBuffer(source) ? Buffer.from(before) : before;
}
export function preparePreFramingWardrobeFiles(directory) {
  const resolved = realpathSync(directory);
  assert.notEqual(resolved, realpathSync(root), 'Framing inverse requires isolated copy');
  assert.ok(!existsSync(join(directory, '.git')), 'Framing inverse rejects Git checkout');
  const sources = new Map();
  for (const item of review.files) {
    const path = join(directory, item.path);
    if (!existsSync(path)) continue;
    assert.ok(!lstatSync(path).isSymbolicLink() && realpathSync(path).startsWith(resolved + '/'), 'Framing inverse rejects linked source');
    const source = readFileSync(path), before = preFramingWardrobeSource(item.path, source);
    if (!source.equals(before)) sources.set(item.path, before);
  }
  return { sources, apply() { for (const [path, source] of sources) writeFileSync(join(directory, path), source); } };
}

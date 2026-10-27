import { preA2RuntimeColorSources, preparePreA2RuntimeColorFiles, applyPreA2RuntimeColorFiles } from './a2RuntimeColorReplay.mjs';
// Test-only exact inverse of the one approved special-outfit source change.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { createHash } from 'node:crypto';
export const TAPE_ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const TAPE_REVIEW = JSON.parse(readFileSync(new URL('./a2SpecialTapeReview.json', import.meta.url)));
function inverse(rows, key, beforeKey, afterKey) {
  assert.deepEqual(rows.map(row => row[key]), TAPE_REVIEW.categoryIds, 'Tape inverse rejects changed order or missing/duplicate IDs');
  const index = rows.findIndex(row => row[key] === TAPE_REVIEW.id);
  const value = rows[index];
  const state = isDeepStrictEqual(value, TAPE_REVIEW[afterKey]) ? 'after'
    : isDeepStrictEqual(value, TAPE_REVIEW[beforeKey]) ? 'before' : 'unknown';
  assert.notEqual(state, 'unknown', 'Tape inverse rejects unreviewed text, aliases or metadata');
  rows[index] = structuredClone(TAPE_REVIEW[beforeKey]);
  return state;
}
export function preA2SpecialTapeDatabase(database) {
  const copy = structuredClone(database);
  inverse(copy.Wardrobe[TAPE_REVIEW.category], 'stableId', 'generatedBefore', 'generatedAfter');
  return copy;
}
function requireIsolated(directory) {
  assert.notEqual(realpathSync(directory), realpathSync(TAPE_ROOT), 'Tape inverse requires an isolated tree');
}
export function restorePreA2SpecialTapeDatabaseFile(directory) {
  requireIsolated(directory);
  const runtime = preparePreA2RuntimeColorFiles(directory, { optional: true });
  const file = join(directory, 'webapp/src/data/database.json');
  const restored = preA2SpecialTapeDatabase(JSON.parse(readFileSync(file)));
  applyPreA2RuntimeColorFiles(directory, runtime);
  writeFileSync(file, JSON.stringify(restored, null, 2) + '\n');
}
export function preA2SpecialTapeManagementSources(sources) {
  sources = preA2RuntimeColorSources(sources);
  const restored = { ...sources }, states = [];
  const hash = v => createHash('sha256').update(v).digest('hex');
  for (const file of TAPE_REVIEW.management) {
    assert.equal(typeof sources[file.path], 'string', 'Tape inverse missing management: ' + file.path);
    const sha = hash(sources[file.path]);
    const state = sha === file.afterHash ? 'after' : sha === file.beforeHash ? 'before' : 'unknown';
    assert.notEqual(state, 'unknown', 'Tape inverse rejects changed management: ' + file.path);
    states.push(state);
    const value = JSON.parse(sources[file.path]);
    if (state === 'after') for (const patch of file.patches) {
      const keys = [...patch.keys], last = keys.pop(), parent = keys.reduce((v, k) => v[k], value);
      assert.deepEqual(parent[last], patch.after);
      if (patch.beforePresent) parent[last] = patch.before; else delete parent[last];
    }
    restored[file.path] = JSON.stringify(value, null, 2) + '\n';
    assert.equal(hash(restored[file.path]), file.beforeHash, 'Tape inverse must restore exact management');
  }
  assert.equal(new Set(states).size, 1, 'Tape inverse rejects mixed management states');
  return restored;
}
function prepareReplayFiles(directory) {
  const hash = v => createHash('sha256').update(v).digest('hex');
  const states = [];
  const prepared = TAPE_REVIEW.replayFiles.map(file => {
    const sha = hash(readFileSync(join(directory, file.path)));
    const state = sha === file.afterHash ? 'after' : sha === file.beforeHash ? 'before' : 'unknown';
    assert.notEqual(state, 'unknown', 'Tape inverse rejects unreviewed replay helper: ' + file.path);
    assert.equal(hash(file.before), file.beforeHash);
    states.push(state);
    return [file.path, file.before];
  });
  assert.equal(new Set(states).size, 1, 'Tape inverse rejects mixed replay helper states');
  return prepared;
}
export function restorePreA2SpecialTapeReplayFiles(directory) {
  requireIsolated(directory);
  const runtime = preparePreA2RuntimeColorFiles(directory, { optional: true });
  const prepared = prepareReplayFiles(directory);
  applyPreA2RuntimeColorFiles(directory, runtime);
  for (const [path, text] of prepared) writeFileSync(join(directory, path), text);
}
export function restorePreA2SpecialTapeFiles(directory) {
  requireIsolated(directory);
  const runtime = preparePreA2RuntimeColorFiles(directory, { optional: true });
  const sourceFile = join(directory, TAPE_REVIEW.sourceFile);
  const source = JSON.parse(readFileSync(sourceFile));
  const state = inverse(source.entries, 'id', 'before', 'after');
  const dbFile = join(directory, 'webapp/src/data/database.json');
  const db = JSON.parse(readFileSync(dbFile));
  const dbState = inverse(db.Wardrobe[TAPE_REVIEW.category], 'stableId', 'generatedBefore', 'generatedAfter');
  assert.equal(state, dbState, 'Tape inverse rejects mixed source and generated states');
  const mdFile = join(directory, 'knowledge_base/wardrobe_and_styling.md');
  const md = readFileSync(mdFile, 'utf8'), from = '| `' + TAPE_REVIEW[state].en + '` |';
  assert.equal(md.split(from).length - 1, 1, 'Tape inverse requires exactly one matching Markdown row');
  const other = '| `' + TAPE_REVIEW[state === 'after' ? 'before' : 'after'].en + '` |';
  assert.equal(md.includes(other), false, 'Tape inverse rejects mixed Markdown');
  const restoredMd = state === 'after' ? md.replace(from, '| `' + TAPE_REVIEW.before.en + '` |') : md;
  const management = TAPE_REVIEW.management.map(file => {
    const text = readFileSync(join(directory, file.path), 'utf8');
    const hash = v => createHash('sha256').update(v).digest('hex');
    assert.equal(hash(text), file[state + 'Hash'], 'Tape inverse rejects mixed or changed management: ' + file.path);
    const value = JSON.parse(text);
    if (state === 'after') for (const patch of file.patches) {
      const keys = [...patch.keys], last = keys.pop(), parent = keys.reduce((v, k) => v[k], value);
      assert.deepEqual(parent[last], patch.after);
      if (patch.beforePresent) parent[last] = patch.before; else delete parent[last];
    }
    const before = JSON.stringify(value, null, 2) + '\n';
    assert.equal(hash(before), file.beforeHash, 'Tape inverse must restore management byte-for-byte');
    return [file.path, before];
  });
  const replayFiles = prepareReplayFiles(directory);
  // Every input passed before the first write; all writes are in a disposable copy.
  applyPreA2RuntimeColorFiles(directory, runtime);
  writeFileSync(sourceFile, JSON.stringify(source, null, 2) + '\n');
  writeFileSync(dbFile, JSON.stringify(db, null, 2) + '\n');
  writeFileSync(mdFile, restoredMd);
  for (const [path, text] of [...management, ...replayFiles]) writeFileSync(join(directory, path), text);
}

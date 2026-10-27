// Test-only inverse; validate the whole reviewed state before writing an isolated replay.
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { createHash } from 'node:crypto';
export const A2_OUTFIT_ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const A2_OUTFIT_REVIEW = JSON.parse(readFileSync(new URL('./a2OutfitControlReview.json', import.meta.url)));
const patches = JSON.parse(readFileSync(new URL('./a2OutfitControlPatches.json', import.meta.url)));
const hash = text => createHash('sha256').update(text).digest('hex');
function inverse(rows, key, beforeKey, afterKey) {
  assert.deepEqual(rows.map(x => x[key]), patches.categoryIds, 'A2 outfit inverse rejects changed ID order or missing/duplicate IDs');
  const matches = A2_OUTFIT_REVIEW.rows.map(r => {
    const index = rows.findIndex(x => x[key] === r.id), value = rows[index];
    const state = isDeepStrictEqual(value, r[afterKey]) ? 'after' : isDeepStrictEqual(value, r[beforeKey]) ? 'before' : 'unknown';
    assert.notEqual(state, 'unknown', 'A2 outfit inverse rejects changed text, aliases or metadata: ' + r.id);
    return { index, state, r };
  });
  assert.equal(new Set(matches.map(x => x.state)).size, 1, 'A2 outfit inverse rejects mixed migration states');
  for (const { index, r } of matches) rows[index] = structuredClone(r[beforeKey]);
  return matches[0].state;
}
export function preA2OutfitDatabase(database) {
  const copy = structuredClone(database);
  inverse(copy.Wardrobe[A2_OUTFIT_REVIEW.category], 'stableId', 'generatedBefore', 'generatedAfter');
  return copy;
}
export function preA2OutfitProgramSources(sources, state) {
  assert.ok(['before', 'after'].includes(state));
  const restored = { ...sources };
  for (const [path, hashes] of Object.entries(patches.hashes)) {
    assert.equal(typeof sources[path], 'string', 'A2 outfit inverse missing program source: ' + path);
    const accepted = [hashes[state], ...(state === 'before' ? hashes.earlierBefore || [] : [])];
    assert.ok(accepted.includes(hash(sources[path])), 'A2 outfit inverse rejects unreviewed or mixed program source: ' + path);
  }
  for (const [path, expected] of Object.entries(patches.newFiles)) {
    if (state === 'after' || sources[path] !== undefined) assert.equal(hash(sources[path] || ''), expected, 'A2 outfit inverse rejects missing or changed new helper');
    delete restored[path];
  }
  if (state === 'after') {
    for (const p of patches.patches) {
      assert.equal(restored[p.path].split(p.after).length - 1, 1, 'A2 outfit inverse requires exact insertion');
      restored[p.path] = restored[p.path].replace(p.after, p.before);
    }
    for (const file of patches.management) {
      const value = JSON.parse(restored[file.path]);
      for (const change of file.changes) {
        const keys = [...change.keys], last = keys.pop();
        const parent = keys.reduce((x, key) => x[key], value);
        assert.deepEqual(parent[last], change.after);
        if (change.beforePresent) parent[last] = change.before;
        else delete parent[last];
      }
      restored[file.path] = JSON.stringify(value, null, 2) + '\n';
    }
    for (const [path, hashes] of Object.entries(patches.hashes)) assert.equal(hash(restored[path]), hashes.before, 'A2 outfit inverse must exactly restore base: ' + path);
  }
  return restored;
}
export function restorePreA2OutfitFiles(directory) {
  assert.notEqual(realpathSync(directory), realpathSync(A2_OUTFIT_ROOT), 'A2 outfit inverse only writes an isolated copy');
  const categoryFile = join(directory, A2_OUTFIT_REVIEW.sourceFile);
  const category = JSON.parse(readFileSync(categoryFile));
  const state = inverse(category.entries, 'id', 'before', 'after');
  const databaseFile = join(directory, 'webapp/src/data/database.json');
  const database = JSON.parse(readFileSync(databaseFile));
  const dbState = inverse(database.Wardrobe[A2_OUTFIT_REVIEW.category], 'stableId', 'generatedBefore', 'generatedAfter');
  assert.equal(state, dbState, 'A2 outfit inverse requires matching source and generated states');
  const markdownFile = join(directory, 'knowledge_base/wardrobe_and_styling.md');
  let markdown = readFileSync(markdownFile, 'utf8');
  for (const row of A2_OUTFIT_REVIEW.rows) {
    const from = '| `' + row[state].en + '` |';
    assert.equal(markdown.split(from).length - 1, 1, 'A2 outfit inverse Markdown must agree: ' + row.id);
    if (state === 'after') markdown = markdown.replace(from, '| `' + row.before.en + '` |');
  }
  const sources = Object.fromEntries([...Object.keys(patches.hashes), ...Object.keys(patches.newFiles)]
    .filter(path => existsSync(join(directory, path))).map(path => [path, readFileSync(join(directory, path), 'utf8')]));
  const restored = preA2OutfitProgramSources(sources, state);
  // All source, generated, Markdown and program checks succeeded before the first write.
  writeFileSync(categoryFile, JSON.stringify(category, null, 2) + '\n');
  writeFileSync(databaseFile, JSON.stringify(database, null, 2) + '\n');
  writeFileSync(markdownFile, markdown);
  for (const [path, text] of Object.entries(restored)) writeFileSync(join(directory, path), text);
  for (const path of Object.keys(patches.newFiles)) rmSync(join(directory, path), { force: true });
}
export function openPreA2OutfitReplayRoot() {
  const directory = mkdtempSync(join(tmpdir(), 'vps-a2-outfits-history-'));
  try {
    mkdirSync(join(directory, 'webapp'));
    for (const path of ['webapp/src', 'scripts', 'knowledge_base']) cpSync(join(A2_OUTFIT_ROOT, path), join(directory, path), { recursive: true });
    for (const file of ['package.json', 'package-lock.json']) cpSync(join(A2_OUTFIT_ROOT, 'webapp', file), join(directory, 'webapp', file));
    symlinkSync(join(A2_OUTFIT_ROOT, 'webapp/node_modules'), join(directory, 'webapp/node_modules'), 'dir');
    restorePreA2OutfitFiles(directory);
    return { directory, cleanup: () => rmSync(directory, { recursive: true, force: true }) };
  } catch (error) { rmSync(directory, { recursive: true, force: true }); throw error; }
}

import { restorePreA2LegacyDressFiles } from './a2LegacyDressReplay.mjs';
// Test-only exact data inverse. No public renderer or historical seal is rewritten.
import assert from 'node:assert/strict';
import { preA2OutfitDatabase, restorePreA2OutfitFiles } from './a2OutfitControlHistoricalReplay.mjs';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
export const A2_ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const A2_REVIEW = JSON.parse(readFileSync(new URL('./a2DressControlReview.json', import.meta.url)));
// Separately reviewed main integration; the original prompt oracle remains at A2_REVIEW.baseCommit.
export const A2_INTEGRATION_COMMIT = 'e9983769e326ead175b381834c6e2df4fd02e28d';
export const A2_VIDEO_PATHS = Object.freeze([
  'webapp/src/App.jsx',
  'webapp/src/components/VideoWorkspace.jsx',
  'webapp/src/lib/comfyVideoClient.js',
  'webapp/src/lib/videoWorkspaceController.js',
  'webapp/src/main.jsx',
  'webapp/src/styles/videoWorkspace.css',
]);
export function preVideoSources(current, before, after) {
  const states = A2_VIDEO_PATHS.map(path => {
    assert.equal(typeof before[path], 'string', 'A2 video inverse requires old source: ' + path);
    assert.equal(typeof after[path], 'string', 'A2 video inverse requires reviewed source: ' + path);
    assert.notEqual(before[path], after[path], 'A2 video inverse requires a changed source: ' + path);
    const state = current[path] === before[path] ? 'before' : current[path] === after[path] ? 'after' : 'unknown';
    assert.notEqual(state, 'unknown', 'A2 video inverse rejects unreviewed source: ' + path);
    return state;
  });
  assert.equal(new Set(states).size, 1, 'A2 video inverse rejects mixed states');
  return Object.fromEntries(A2_VIDEO_PATHS.map(path => [path, before[path]]));
}
function restorePreVideoFiles(directory) {
  const fromGit = commit => Object.fromEntries(A2_VIDEO_PATHS.map(path => [path,
    execFileSync('git', ['-C', A2_ROOT, 'show', commit + ':' + path], { encoding: 'utf8' }),
  ]));
  const current = Object.fromEntries(A2_VIDEO_PATHS.map(path => [path, readFileSync(join(directory, path), 'utf8')]));
  // Validate all six exact sources before writing anything in the isolated replay copy.
  const restored = preVideoSources(current, fromGit(A2_REVIEW.baseCommit), fromGit(A2_INTEGRATION_COMMIT));
  for (const [path, source] of Object.entries(restored)) writeFileSync(join(directory, path), source);
}

function inverse(rows, key, beforeKey, afterKey) {
  const matches = A2_REVIEW.rows.map(r => {
    const indices = rows.flatMap((x, i) => x[key] === r.id ? [i] : []);
    assert.equal(indices.length, 1, 'A2 inverse requires exactly one issued ID: ' + r.id);
    const index = indices[0], value = rows[index];
    const state = isDeepStrictEqual(value, r[afterKey]) ? 'after' : isDeepStrictEqual(value, r[beforeKey]) ? 'before' : 'unknown';
    assert.notEqual(state, 'unknown', 'A2 inverse rejects changed text, aliases or metadata: ' + r.id);
    return { index, state, r };
  });
  assert.equal(new Set(matches.map(x => x.state)).size, 1, 'A2 inverse rejects mixed migration states');
  for (const { index, r } of matches) rows[index] = structuredClone(r[beforeKey]);
  return matches[0].state;
}
export function preA2Database(database) {
  const copy = preA2OutfitDatabase(database);
  inverse(copy.Wardrobe['連身 (Dresses)'], 'stableId', 'generatedBefore', 'generatedAfter');
  return copy;
}
export function restorePreA2Files(directory) {
  restorePreA2OutfitFiles(directory);
  const categoryFile = join(directory, A2_REVIEW.sourceFile);
  const category = JSON.parse(readFileSync(categoryFile));
  const state = inverse(category.entries, 'id', 'before', 'after');
  const databaseFile = join(directory, 'webapp/src/data/database.json');
  const database = JSON.parse(readFileSync(databaseFile));
  const databaseState = inverse(database.Wardrobe['連身 (Dresses)'], 'stableId', 'generatedBefore', 'generatedAfter');
  assert.equal(state, databaseState, 'A2 category and generated data must agree');
  const markdownFile = join(directory, 'knowledge_base/wardrobe_and_styling.md');
  let markdown = readFileSync(markdownFile, 'utf8');
  for (const row of A2_REVIEW.rows) {
    const from = '| `' + row[state === 'after' ? 'after' : 'before'].en + '` |';
    assert.equal(markdown.split(from).length - 1, 1, 'A2 Markdown row must agree: ' + row.id);
    if (state === 'after') markdown = markdown.replace(from, '| `' + row.before.en + '` |');
  }
  writeFileSync(categoryFile, JSON.stringify(category, null, 2) + '\n');
  writeFileSync(databaseFile, JSON.stringify(database, null, 2) + '\n');
  writeFileSync(markdownFile, markdown);
  restorePreVideoFiles(directory);
}
export function openPreA2ReplayRoot() {
  const directory = mkdtempSync(join(tmpdir(), 'vps-a2-dresses-history-'));
  try {
    mkdirSync(join(directory, 'webapp'));
    for (const path of ['webapp/src', 'scripts', 'knowledge_base']) cpSync(join(A2_ROOT, path), join(directory, path), { recursive: true });
    for (const file of ['package.json', 'package-lock.json']) cpSync(join(A2_ROOT, 'webapp', file), join(directory, 'webapp', file));
    symlinkSync(join(A2_ROOT, 'webapp/node_modules'), join(directory, 'webapp/node_modules'), 'dir');
    restorePreA2LegacyDressFiles(directory);
    restorePreA2Files(directory);
    return { directory, cleanup: () => rmSync(directory, { recursive: true, force: true }) };
  } catch (error) { rmSync(directory, { recursive: true, force: true }); throw error; }
}
export async function withPreA2ReplayRoot(run) {
  const { directory, cleanup } = openPreA2ReplayRoot();
  try { return await run(directory); } finally { cleanup(); }
}

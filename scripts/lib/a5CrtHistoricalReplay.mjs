// Test-only exact inverse of CRT; no production imports or broad tag normalization.
import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { preAllA5Database as previousA5Database } from './a5CommercialHistoricalReplay.mjs';
export const A5_CRT_REVIEW = JSON.parse(readFileSync(new URL('./a5CrtReview.json', import.meta.url)));
export const CRT_ROOT = fileURLToPath(new URL('../../', import.meta.url));
export function preCrtDatabase(source = JSON.parse(readFileSync(join(CRT_ROOT, 'webapp/src/data/database.json')))) {
  const copy = structuredClone(source), r = A5_CRT_REVIEW;
  const rows = Object.values(copy.Locations).flat().filter(x => x.stableId === r.id);
  assert.equal(rows.length, 1, 'CRT inverse requires exactly one issued ID');
  const expected = structuredClone(r.generatedBefore); expected.meta.semantic.tags = [...r.afterTags];
  assert.deepEqual(rows[0], expected, 'CRT inverse rejects unreviewed source or semantic changes');
  rows[0].meta.semantic.tags = [...r.beforeTags];
  return copy;
}
export function preAllA5Database(source) { return previousA5Database(preCrtDatabase(source)); }
async function withReplay(database, run, restoreCategory = false) {
  const directory = mkdtempSync(join(tmpdir(), 'vps-a5-crt-history-'));
  try {
    mkdirSync(join(directory, 'webapp'));
    for (const path of ['webapp/src', 'scripts', 'knowledge_base']) cpSync(join(CRT_ROOT, path), join(directory, path), { recursive: true });
    for (const file of ['package.json', 'package-lock.json']) cpSync(join(CRT_ROOT, 'webapp', file), join(directory, 'webapp', file));
    symlinkSync(join(CRT_ROOT, 'webapp/node_modules'), join(directory, 'webapp/node_modules'), 'dir');
    writeFileSync(join(directory, 'webapp/src/data/database.json'), JSON.stringify(database, null, 2) + '\n');
    if (restoreCategory) {
      const r = A5_CRT_REVIEW, file = join(directory, r.sourceFile), document = JSON.parse(readFileSync(file));
      const rows = document.entries.filter(x => x.id === r.id); assert.equal(rows.length, 1);
      const expected = structuredClone(r.source); expected.meta.semantic.tags = [...r.afterTags];
      assert.deepEqual(rows[0], expected); rows[0].meta.semantic.tags = [...r.beforeTags];
      writeFileSync(file, JSON.stringify(document, null, 2) + '\n');
    }
    return await run(directory);
  } finally { rmSync(directory, { recursive: true, force: true }); }
}
export async function withPreCrtReplayRoot(run) { return withReplay(preCrtDatabase(), run, true); }
export async function withPreAllA5ReplayRoot(run) { return withReplay(preAllA5Database(), run); }
export function historicalGit(...args) { return execFileSync('git', ['-C', CRT_ROOT, ...args], { maxBuffer: 256 * 1024 * 1024 }); }
export function supplySealedHistory(directory) {
  for (const path of historicalGit('ls-tree', '-r', '--name-only', A5_CRT_REVIEW.baseCommit).toString().trim().split('\n').filter(x => /catalog-architecture-[a-e]-.*\/.*\.(?:json|gz)$/.test(x))) {
    mkdirSync(dirname(join(directory, path)), { recursive: true }); cpSync(join(CRT_ROOT, path), join(directory, path));
  }
}

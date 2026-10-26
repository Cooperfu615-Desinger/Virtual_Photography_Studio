// Test-only, exact inverse of the approved second A5 batch. No production imports.
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { preA5Database } from './a5HistoricalReplay.mjs';
export const A5_COMMERCIAL_REVIEW = JSON.parse(readFileSync(new URL('./a5CommercialReview.json', import.meta.url)));
const root = fileURLToPath(new URL('../../', import.meta.url));
export function preCommercialDatabase(source = JSON.parse(readFileSync(join(root, 'webapp/src/data/database.json')))) {
  const copy = structuredClone(source), rows = Object.values(copy.Locations).flat();
  for (const revision of A5_COMMERCIAL_REVIEW.entries) {
    const matches = rows.filter(row => row.stableId === revision.id);
    assert.equal(matches.length, 1, `commercial inverse requires exactly one ${revision.id}`);
    assert.deepEqual(matches[0].meta.semantic.tags, revision.afterTags, `commercial inverse rejects an unreviewed change: ${revision.id}`);
    if (revision.decision === 'remove') matches[0].meta.semantic.tags = [...revision.beforeTags];
  }
  return copy;
}
export function preAllA5Database(source) {
  return preA5Database(preCommercialDatabase(source));
}
async function withReplayRoot(database, run) {
  const directory = mkdtempSync(join(tmpdir(), 'vps-a5-commercial-history-'));
  try {
    mkdirSync(join(directory, 'webapp'));
    cpSync(join(root, 'webapp/src'), join(directory, 'webapp/src'), { recursive: true });
    cpSync(join(root, 'scripts'), join(directory, 'scripts'), { recursive: true });
    for (const file of ['package.json', 'package-lock.json']) cpSync(join(root, 'webapp', file), join(directory, 'webapp', file));
    symlinkSync(resolve(root, 'webapp/node_modules'), join(directory, 'webapp/node_modules'), 'dir');
    writeFileSync(join(directory, 'webapp/src/data/database.json'), JSON.stringify(database, null, 2) + '\n');
    return await run(directory);
  } finally { rmSync(directory, { recursive: true, force: true }); }
}
export async function withPreAllA5ReplayRoot(run) { return withReplayRoot(preAllA5Database(), run); }
export async function withPreCommercialReplayRoot(run) { return withReplayRoot(preCommercialDatabase(), run); }

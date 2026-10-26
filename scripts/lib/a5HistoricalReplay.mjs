// Test-only inverse of the three approved A5 tags. Historical A-E artifacts stay sealed.
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
export const A5_TAG_REVISIONS = Object.freeze([
  { id: 'locations:城市與社群感-urban-social-snapshots:戶外-倫敦排屋街道:41', before: ['urban', 'outdoor', 'heritage', 'subterranean'], after: ['urban', 'outdoor', 'heritage'] },
  { id: 'locations:自然與戶外-nature-outdoors:戶外-清澈海灣岩岸:1', before: ['outdoor', 'natural', 'commercial', 'waterfront'], after: ['outdoor', 'natural', 'waterfront'] },
  { id: 'locations:自然與戶外-nature-outdoors:戶外-草地與樹木:3', before: ['outdoor', 'natural', 'commercial', 'green_space'], after: ['outdoor', 'natural', 'green_space'] },
]);
export function preA5Database(source = JSON.parse(readFileSync(join(root, 'webapp/src/data/database.json')))) {
  const copy = structuredClone(source);
  const rows = Object.values(copy.Locations).flat();
  for (const revision of A5_TAG_REVISIONS) {
    const matches = rows.filter(row => row.stableId === revision.id);
    assert.equal(matches.length, 1, `A5 inverse requires exactly one ${revision.id}`);
    assert.deepEqual(matches[0].meta.semantic.tags, revision.after, `A5 inverse rejects an unreviewed change: ${revision.id}`);
    matches[0].meta.semantic.tags = [...revision.before];
  }
  return copy;
}
// Original sealed capture tools hardcode default runtime input. Copy the CURRENT
// runtime/tools to a fresh temporary module graph and reverse ONLY the three tags.
// No Git checkout/reset, environment switch, shared-cache mutation or old artifact edit.
export async function withPreA5ReplayRoot(run) {
  const directory = mkdtempSync(join(tmpdir(), 'vps-a5-history-'));
  try {
    mkdirSync(join(directory, 'webapp'));
    cpSync(join(root, 'webapp/src'), join(directory, 'webapp/src'), { recursive: true });
    cpSync(join(root, 'scripts'), join(directory, 'scripts'), { recursive: true });
    for (const file of ['package.json', 'package-lock.json']) cpSync(join(root, 'webapp', file), join(directory, 'webapp', file));
    symlinkSync(resolve(root, 'webapp/node_modules'), join(directory, 'webapp/node_modules'), 'dir');
    writeFileSync(join(directory, 'webapp/src/data/database.json'), JSON.stringify(preA5Database(), null, 2) + '\n');
    return await run(directory);
  } finally { rmSync(directory, { recursive: true, force: true }); }
}

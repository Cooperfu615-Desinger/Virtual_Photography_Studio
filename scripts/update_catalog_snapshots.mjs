import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { getCompiledCatalogForTesting, getLockControls } from '../webapp/src/lib/engine.js';
import { createCatalogSnapshots, differences } from './lib/catalogBaseline.mjs';

// Deliberately not part of npm test or CI. Never re-record to silence migration failures.
const snapshots = createCatalogSnapshots(getCompiledCatalogForTesting(), getLockControls());
const changes = [];
for (const [kind, snapshot] of Object.entries(snapshots)) {
  const file = fileURLToPath(new URL(`../webapp/src/lib/engine/catalogSnapshot.${kind}.json`, import.meta.url));
  const before = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
  const diff = differences(before, snapshot);
  changes.push({ kind, differences: diff.length, sample: diff.slice(0, 10) });
  if (diff.length) writeFileSync(file, JSON.stringify(snapshot, null, 2) + '\n');
}
console.log(JSON.stringify(changes, null, 2));

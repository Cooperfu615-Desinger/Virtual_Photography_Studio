#!/usr/bin/env node
// One-time C acceptance against an immutable pre-cutover Git object. Never records A.
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { getCompiledCatalogForTesting, getLockControls } from '../webapp/src/lib/engine.js';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceSha = process.argv[3];
assert.equal(process.argv[2], '--source-sha');
assert.equal(sourceSha, '64870460e8a153a07baf953df0d6cf784ce2aca4', 'C acceptance pins reviewed pre-C main');
const before = JSON.parse(execFileSync('git', ['-C', root, 'show', sourceSha+':webapp/src/data/database.json'], { maxBuffer: 8e6 }));
const after = JSON.parse(readFileSync(resolve(root, 'webapp/src/data/database.json')));
const stripped = db => JSON.stringify(Object.fromEntries(Object.entries(db).map(([s, cs]) => [s, Object.fromEntries(Object.entries(cs).map(([c, rows]) => [c, rows.map(row => Object.fromEntries(Object.entries(row).filter(([k]) => !['stableId','legacyIds'].includes(k))))]))])), null, 2);
assert.equal(stripped(after), stripped(before), 'raw data changed beyond explicit IDs');
// Compile old data with the OLD engine: the one pre-C row already carrying
// both fields still gained inferred aliases before C. Using today's engine on
// that row would create a false reference and conceal the actual old contract.
const temporary = mkdtempSync(join(tmpdir(), 'catalog-c-reference-'));
let oldCompiled, oldControls;
try {
  const archive = execFileSync('git', ['-C', root, 'archive', sourceSha, 'webapp/src/lib', 'webapp/src/data', 'webapp/package.json'], { maxBuffer: 64e6 });
  execFileSync('tar', ['-x', '-C', temporary], { input: archive });
  const historical = await import(pathToFileURL(join(temporary, 'webapp/src/lib/engine.js')).href);
  oldCompiled = historical.getCompiledCatalogForTesting(before);
  oldControls = historical.getLockControls(before);
} finally { rmSync(temporary, { recursive: true, force: true }); }
const newCompiled = getCompiledCatalogForTesting(after);
assert(JSON.stringify(newCompiled) === JSON.stringify(oldCompiled), 'compiled entries/catalog/inference changed');
assert(JSON.stringify(getLockControls(after)) === JSON.stringify(oldControls), 'controls changed');
const groups = { regional: 'Regional', wardrobe: 'Wardrobe', camera: 'CameraLighting', locations: 'Locations', character: 'Character', negative: 'Negative' };
let rows = 0;
for (const [group, cs] of Object.entries(oldCompiled.entries)) for (const [category, entries] of Object.entries(cs)) entries.forEach((row, i) => {
  const raw = after[groups[group]][category][i];
  assert.equal(raw.stableId, row.id);assert.deepEqual(raw.legacyIds, row.legacyIds);rows++;
});
const markdown = JSON.parse(execFileSync('python3', ['-B', resolve(root, 'scripts/validate_catalog_markdown.py'), sourceSha], { encoding: 'utf8' }));
console.log(JSON.stringify({sourceSha, records: rows, databaseDifferences: 0, entriesDifferences: 0, catalogDifferences: 0, controlDifferences: 0, idAliasDifferences: 0, strippedDatabaseSha256: createHash('sha256').update(stripped(after)).digest('hex'), ...markdown}, null, 2));

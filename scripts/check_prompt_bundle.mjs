// Validate the actual production catalog chunk before deployment.
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
const assets = resolve(process.argv[2] || 'webapp/dist/assets');
const files = (await readdir(assets)).filter(name => /^prompt-catalog-.*\.js$/.test(name));
assert.equal(files.length, 1, 'Expected one built prompt catalog');
const file = join(assets, files[0]);
const source = await readFile(file, 'utf8');
assert.ok(!/(?:from\s*|import\s*\()["'][^"']*prompt-engine-/.test(source), 'Catalog must not depend on the consuming engine chunk');
const module = await import(pathToFileURL(file).href);
const profiles = Object.values(module).find(value => Array.isArray(value) && value.some(row => row?.id === 'character-rika'));
assert.ok(profiles, 'Built catalog must export character profiles');
assert.equal(profiles.filter(row => row.profile).length, 33);
for (const row of profiles.filter(row => row.profile)) assert.ok(row.profile.outfit?.trim(), row.id + ': built wardrobe missing');
console.log('Production catalog initializes successfully: 33 character profiles, no reverse engine dependency');

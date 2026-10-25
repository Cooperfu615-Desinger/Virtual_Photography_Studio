// D tools share the real pre-D compiler; never reimplement semantic inference.
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

export const PRE_D = '17074fbe3850e2e9fea300b36697643913f707a1';
export const GROUPS = { Regional: 'regional', Wardrobe: 'wardrobe', CameraLighting: 'camera', Locations: 'locations', Character: 'character', Negative: 'negative' };
export const encode = value => JSON.stringify(value, null, 2)+'\n';
export const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export function equalOrdered(actual, expected, label) {
  assert.equal(JSON.stringify(actual) === JSON.stringify(expected), true, label+' differs (including key/array order)');
}
export async function readPreD(root, sourceSha) {
  assert.equal(sourceSha, PRE_D, 'D tools require the reviewed full pre-D SHA');
  execFileSync('git', ['-C', root, 'merge-base', '--is-ancestor', sourceSha, 'HEAD']);
  const temporary = mkdtempSync(join(tmpdir(), 'catalog-d-reference-'));
  try {
    const archive = execFileSync('git', ['-C', root, 'archive', sourceSha, 'webapp/src/lib', 'webapp/src/data', 'webapp/package.json', 'knowledge_base/catalog'], { maxBuffer: 64e6 });
    execFileSync('tar', ['-x', '-C', temporary], { input: archive });
    const engine = await import(pathToFileURL(join(temporary, 'webapp/src/lib/engine.js')).href);
    const database = JSON.parse(readFileSync(join(temporary, 'webapp/src/data/database.json')));
    const compiled = engine.getCompiledCatalogForTesting(database), controls = engine.getLockControls(database);
    const index = JSON.parse(readFileSync(join(temporary, 'knowledge_base/catalog/index.json')));
    const files = index.sections.flatMap(section => section.categories.map(category => {
      const path = 'knowledge_base/catalog/'+category.path;
      const bytes = readFileSync(join(temporary, path));
      const document = JSON.parse(bytes);
      const entries = compiled.entries[GROUPS[section.name]][category.name];
      assert.equal(document.entries.length, entries.length);
      document.entries.forEach((row, i) => {
        assert.equal(row.id, entries[i].id, path+': ID mismatch');
        assert(!Object.hasOwn(row.meta || {}, 'semantic'), 'Pre-D must not contain semantic');
      });
      return {path, sha256: hash(bytes), document, entries};
    }));
    return {sourceSha, database, compiled, controls, files};
  } finally { rmSync(temporary, {recursive: true, force: true}); }
}
export function materializeDocument(document, entries) {
  const result = structuredClone(document);
  assert.equal(result.entries.length, entries.length);
  result.entries.forEach((row, i) => {
    assert.equal(row.id, entries[i].id, 'source/compiled identity mismatch');
    assert(!Object.hasOwn(row.meta || {}, 'semantic'), 'Refusing to overwrite existing semantic');
    assert(entries[i].inferredMeta && typeof entries[i].inferredMeta === 'object' && !Array.isArray(entries[i].inferredMeta));
    row.meta ??= {};
    row.meta.semantic = structuredClone(entries[i].inferredMeta);
  });
  return result;
}
export function withoutMaterializedSemantic(after, before) {
  const result = structuredClone(after);
  if (Object.hasOwn(result.meta || {}, 'semantic')) delete result.meta.semantic;
  if (!Object.hasOwn(before, 'meta') && result.meta && !Object.keys(result.meta).length) delete result.meta;
  return result;
}

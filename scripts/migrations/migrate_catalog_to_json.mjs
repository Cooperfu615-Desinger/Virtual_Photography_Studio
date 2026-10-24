#!/usr/bin/env node
// Phase B rehearsal only. Never switches the production reader or writes into the repo.
import { readFileSync, writeFileSync, existsSync, realpathSync, mkdtempSync, renameSync, rmSync } from 'node:fs';
import { resolve, dirname, join, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { verifySeal } from '../catalog_baseline.mjs';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const sha = data => createHash('sha256').update(data).digest('hex');
const git = (...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim();
export function assertOutputPath(output, root = repo) {
  const target = resolve(output), parent = realpathSync(dirname(target)), actual = join(parent, target.split('/').pop());
  const rel = relative(realpathSync(root), actual);
  if (!rel || (!rel.startsWith('..'+ '/') && !isAbsolute(rel))) throw new Error('B rehearsal output must be outside the repository');
  if (existsSync(target)) throw new Error('Refusing to overwrite an existing rehearsal target');
  return actual;
}

export async function publishRehearsal(target, produce) {
  const staging = mkdtempSync(join(dirname(target), '.catalog-b-staging-'));
  try {
    const report = await produce(staging);
    if (existsSync(target)) throw new Error('Target appeared during rehearsal; refusing overwrite');
    renameSync(staging, target);
    return report;
  } catch (error) { rmSync(staging, { recursive: true, force: true }); throw error; }
}

export async function rehearse({ output, sourceSha }) {
  if (!/^[a-f0-9]{40}$/.test(sourceSha || '') || git('rev-parse', 'HEAD') !== sourceSha) throw new Error('explicit current committed --source-sha required');
  const target = assertOutputPath(output);
  // The B tools may be dirty, but runtime, data and source authoring files must equal the specified commit.
  const paths = git('ls-files', 'webapp/src', 'knowledge_base').split('\n').filter(Boolean);
  const hashes = {};
  for (const p of paths) {
    if (p.startsWith('knowledge_base/catalog/')) continue;
    const blob = execFileSync('git', ['-C', repo, 'show', `${sourceSha}:${p}`], { maxBuffer: 64 * 1024 * 1024 });
    assert.deepEqual(readFileSync(join(repo, p)), blob, `unreviewed source modification: ${p}`);
    hashes[p] = sha(blob);
  }
  const untracked = git('ls-files', '--others', '--exclude-standard', 'webapp/src', 'knowledge_base').split('\n').filter(p => p && !p.startsWith('knowledge_base/catalog/'));
  if (untracked.length) throw new Error(`Untracked runtime/source files: ${untracked.join(', ')}`);
  const sealed = verifySeal();
  const E = await import(pathToFileURL(join(repo, 'webapp/src/lib/engine.js')).href);
  const database = JSON.parse(readFileSync(join(repo, 'webapp/src/data/database.json')));
  const compiled = E.getCompiledCatalogForTesting(database);
  const sourceA = JSON.parse(execFileSync('git', ['-C', repo, 'show', `${sealed.manifest.baselineCommit}:webapp/src/data/database.json`], { maxBuffer: 32 * 1024 * 1024 }));
  const historical = E.getCompiledCatalogForTesting(sourceA).entries;
  const frozenA = Object.entries(historical).flatMap(([initialGroup, cs]) => Object.entries(cs).flatMap(([initialCategory, rows]) => rows.map(row => ({ id: row.id, initialGroup, initialCategory, createdFrom: sealed.manifest.baselineCommit }))));
  const snapshot = JSON.parse(readFileSync(join(repo, 'webapp/src/lib/engine/catalogSnapshot.catalog.json')));
  const snapshotIds = new Set(Object.values(snapshot).flatMap(cs => Object.values(cs).flat()).map(x => x.id));
  for (const row of frozenA) assert(snapshotIds.has(row.id), `historical source ID absent from sealed A snapshot: ${row.id}`);
  return publishRehearsal(target, async staging => {
    const summary = JSON.parse(execFileSync('python3', ['-B', join(repo, 'scripts/catalog_prepare.py'), '--repo', repo, '--output', staging], {
      input: JSON.stringify({ database, entries: compiled.entries, frozenA }), encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
    }));
    const generated = JSON.parse(readFileSync(join(staging, 'database.json')));
    const converted = E.getCompiledCatalogForTesting(generated);
    assert.deepEqual(converted, compiled, 'compiled entries/catalog changed');
    assert.deepEqual(E.getLockControls(generated), E.getLockControls(database), 'final controls changed');
    const files = git('ls-files', 'webapp/src', 'knowledge_base').split('\n').filter(p => hashes[p]);
    for (const p of files) assert.equal(sha(readFileSync(join(repo, p))), hashes[p], `source changed during rehearsal: ${p}`);
    const report = { phase: 'B', sourceSha, frozenBaselineCommit: sealed.manifest.baselineCommit, sourceHashes: hashes, ...summary,
      compiledDifferences: 0, controlDifferences: 0, productionReader: 'Markdown', output: target };
    writeFileSync(join(staging, 'rehearsal.json'), JSON.stringify(report, null, 2)+'\n');
    return report;
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), opts = {};
  for (let i = 0; i < args.length; i += 2) {
    if (!['--output', '--source-sha'].includes(args[i]) || !args[i+1] || opts[args[i]]) throw new Error('Usage: --output NEW_EXTERNAL_DIRECTORY --source-sha FULL_HEAD_SHA');
    opts[args[i]] = args[i+1];
  }
  if (!opts['--output']) throw new Error('--output is required; no default production destination');
  console.log(JSON.stringify(await rehearse({ output: opts['--output'], sourceSha: opts['--source-sha'] }), null, 2));
}

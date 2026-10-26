// Replay the sealed first A5 acceptance on current code plus the exact previous data.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { A5_COMMERCIAL_REVIEW as review, withPreCommercialReplayRoot } from './lib/a5CommercialHistoricalReplay.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(process.argv[2] || '/tmp/a5-previous-replay.json');
const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
await withPreCommercialReplayRoot(async directory => {
  cpSync(join(root, 'knowledge_base'), join(directory, 'knowledge_base'), { recursive: true });
  for (const file of new Set(review.entries.map(x => x.sourceFile))) {
    const source = JSON.parse(readFileSync(join(directory, file)));
    for (const row of source.entries) {
      const revision = review.entries.find(x => x.id === row.id);
      if (revision) { assert.deepEqual(row.meta.semantic.tags, revision.afterTags); row.meta.semantic.tags = [...revision.beforeTags]; }
    }
    writeFileSync(join(directory, file), JSON.stringify(source, null, 2) + '\n');
  }
  // The sealed old checker also verifies A-E report artifacts. Supply unchanged
  // files to its isolated root; never modify the archived checker or its expected data.
  for (const path of git('ls-tree', '-r', '--name-only', review.baseCommit).trim().split('\n').filter(x => /catalog-architecture-[a-e]-.*\/.*\.(?:json|gz)$/.test(x))) {
    if (!existsSync(join(directory, path))) { mkdirSync(dirname(join(directory, path)), { recursive: true }); cpSync(join(root, path), join(directory, path)); }
  }
  const text = execFileSync(process.execPath, [join(directory, 'scripts/scene_semantic_a5_acceptance.mjs'), output], {
    cwd: directory, env: { ...process.env, GIT_DIR: git('rev-parse', '--absolute-git-dir').trim() }, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024,
  });
  process.stdout.write(text);
});

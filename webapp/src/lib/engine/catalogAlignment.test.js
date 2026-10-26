import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { withPreAllA5ReplayRoot as withPreA5ReplayRoot } from '../../../../scripts/lib/a5XimendingHistoricalReplay.mjs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { alignmentDir, verifyAlignment, checkAlignment } from '../../../../scripts/catalog_alignment_baseline.mjs';

test('aligned A replays imported people, scene/crop matrix, transitions and JSON/Markdown restores', async () => {
  const result = await withPreA5ReplayRoot(repo => checkAlignment(repo));
  assert.equal(result.sourceScenarios, 5);
  assert.equal(result.importCases, 170);
  assert.equal(result.savedPayloads, 10);
  assert.equal(result.differences, 0);
  assert.equal(result.flowDifferences, 0);
});

test('alignment seal rejects changed parent hashes, tool hashes and sealed artifacts', () => {
  const original = JSON.parse(readFileSync(join(alignmentDir, 'manifest.json')));
  for (const field of ['inheritedArtifacts', 'generatorAndFixtureHashes', 'artifacts']) {
    const dir = mkdtempSync(join(tmpdir(), 'catalog-seal-'));
    try {
      const manifest = structuredClone(original);
      // Artifact verification requires earlier paths only; each selected field is checked first.
      if (field === 'artifacts') {
        for (const f of Object.keys(manifest.artifacts)) writeFileSync(join(dir, f), readFileSync(join(alignmentDir, f)));
      }
      manifest[field][Object.keys(manifest[field])[0]] = 'corrupt';
      writeFileSync(join(dir, 'manifest.json'), JSON.stringify(manifest));
      assert.throws(() => verifyAlignment(dir), /changed/);
    } finally { rmSync(dir, { recursive: true }); }
  }
});

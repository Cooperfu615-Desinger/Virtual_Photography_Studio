// Supplemental coverage is recorded from an exported original Git tree, never the modified runtime.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readJson, pack, sha256, compareCaptures } from './lib/catalogBaseline.mjs';
import { baselineDir, captureCorpus, verifySeal } from './catalog_baseline.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export async function checkCoverage() {
  const manifest = readJson(join(baselineDir, 'coverage-manifest.json'));
  for (const [file, hash] of Object.entries(manifest.artifacts)) {
    if (sha256(readFileSync(join(baselineDir, file))) !== hash) throw new Error(`coverage artifact changed: ${file}`);
  }
  if (sha256(readFileSync(fileURLToPath(import.meta.url))) !== manifest.generatorHash) throw new Error('coverage generator changed');
  const corpus = readJson(join(baselineDir, 'coverage-corpus.json.gz'));
  const expected = readJson(join(baselineDir, 'coverage-outputs.json.gz'));
  if (JSON.stringify(manifest.caseIds) !== JSON.stringify(corpus.cases.map(x => x.id))) throw new Error('coverage case set changed');
  const actual = await captureCorpus(root, corpus);
  assertOrientations(actual);
  const diff = compareCaptures(expected, actual);
  if (diff.length) throw new Error(JSON.stringify(diff.slice(0, 8)));
  return { cases: actual.cases.length, explicitSurfaces: actual.cases.filter(x => x.id.startsWith('explicit-surface:')).length, differences: 0 };
}
function assertOrientations(capture) {
  for (const row of capture.cases.filter(x => x.id.startsWith('explicit-surface:'))) {
    const wanted = row.id.split(':').at(-1);
    if (row.prompt.selection.poseOrientationId !== wanted) throw new Error(`${row.id}: requested orientation not effective`);
  }
}
async function main() {
  if (process.argv[2] !== 'record') { console.log(await checkCoverage()); return; }
  if (existsSync(join(baselineDir, 'coverage-manifest.json'))) throw new Error('refusing to replace sealed coverage');
  const original = resolve(process.argv[3] || 'missing-original-tree');
  const { manifest, corpus: core } = verifySeal();
  // Verify every original runtime/data file by Git blob hash, not just engine.js.
  const tree = execFileSync('git', ['ls-tree', '-r', manifest.baselineCommit, '--', 'webapp/src', 'scripts/validate_prompt_logic.mjs'], { cwd: root, encoding: 'utf8' });
  for (const line of tree.trim().split('\n')) {
    const [header, file] = line.split('\t');
    const actual = execFileSync('git', ['hash-object', join(original, file)], { encoding: 'utf8' }).trim();
    if (actual !== header.split(' ')[2]) throw new Error(`original source mismatch: ${file}`);
  }
  const cases = core.cases.filter(x => x.id.startsWith('audit:')).map(x => structuredClone(x));
  for (const row of core.cases.filter(x => x.id.startsWith('surface:'))) {
    const orientation = row.id.split(':').at(-1), id = row.id.replace(/^surface:/, 'explicit-surface:');
    cases.push({ ...row, id, stream: id, locks: { ...row.locks, specifiedActionId: 'none', poseBaseId: 'lying', poseOrientationId: orientation, poseArrangementId: 'lying-body-natural-stretch' } });
  }
  const corpus = { ...core, cases };
  const first = await captureCorpus(original, corpus), second = await captureCorpus(original, corpus);
  assertOrientations(first);
  if (compareCaptures(first, second).length) throw new Error('non-deterministic original coverage');
  const artifacts = { 'coverage-corpus.json.gz': pack(corpus), 'coverage-outputs.json.gz': pack(first) };
  for (const [file, bytes] of Object.entries(artifacts)) writeFileSync(join(baselineDir, file), bytes, { flag: 'wx' });
  writeFileSync(join(baselineDir, 'coverage-manifest.json'), JSON.stringify({ baselineCommit: manifest.baselineCommit,
    reason: 'Keep the original legacy arrangement inputs; additionally assert actual side/prone/supine orientation on every lyingSurface scene.',
    generatorHash: sha256(readFileSync(fileURLToPath(import.meta.url))), node: process.version, caseIds: cases.map(x => x.id),
    artifacts: Object.fromEntries(Object.entries(artifacts).map(([file, bytes]) => [file, sha256(bytes)])),
  }, null, 2) + '\n', { flag: 'wx' });
  console.log(await checkCoverage());
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { await main(); } catch (error) { console.error(error.stack); process.exitCode = 1; }
}

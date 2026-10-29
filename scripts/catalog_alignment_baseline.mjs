import {preC4CatalogSource} from './lib/c4CatalogLabelsReplay.mjs';
// A-only addendum: preserve the accepted 0746b28 baseline and bind new coverage to reviewed main.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { baselineDir, verifySeal, captureCorpus } from './catalog_baseline.mjs';
import { readJson, sha256, pack, compareCaptures, differences } from './lib/catalogBaseline.mjs';
import { createImportCorpus, captureImportFlows, assertImportedCases } from './lib/catalogImportCorpus.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const alignmentDir = join(baselineDir, 'revisions/2f56438');
const expectedCommit = '2f56438804e751de4556060b293231966d6ea3b3';
const tools = ['scripts/catalog_alignment_baseline.mjs', 'scripts/lib/catalogImportCorpus.mjs'];
const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const hash = path => sha256(readFileSync(path));
export function verifyAlignment(directory = alignmentDir) {
  const manifest = readJson(join(directory, 'manifest.json'));
  assert.equal(manifest.baselineCommit, expectedCommit);
  for (const [file, digest] of Object.entries(manifest.inheritedArtifacts)) assert.equal(hash(join(baselineDir, file)), digest, `old baseline changed: ${file}`);
  for (const [file, digest] of Object.entries(manifest.generatorAndFixtureHashes)) assert.equal(sha256(preC4CatalogSource(file, readFileSync(join(root, file)))), digest, `generator changed: ${file}`);
  for (const [file, digest] of Object.entries(manifest.artifacts)) assert.equal(hash(join(directory, file)), digest, `alignment artifact changed: ${file}`);
  const corpus = readJson(join(directory, 'corpus.json.gz')), capture = readJson(join(directory, 'outputs.json.gz'));
  assert.deepEqual(corpus.cases.map(x => x.id), manifest.caseIds);
  assert.deepEqual(capture.cases.map(x => x.id), manifest.caseIds);
  assert.deepEqual(Object.keys(corpus.savedPayloads), manifest.savedPayloadIds);
  compareCaptures(capture, capture);
  assert.deepEqual(capture.cases.map(x => ({ id: x.id, outputs: Object.fromEntries(Object.entries(x.outputs).map(([k, v]) => [k, v.status])) })), manifest.expectedOutputs);
  return { manifest, corpus, capture, flows: readJson(join(directory, 'flows.json.gz')) };
}
export async function checkAlignment(repo = root, directory = alignmentDir) {
  const { manifest, corpus, capture, flows } = verifyAlignment(directory);
  const actual = await captureCorpus(repo, corpus);
  const diff = compareCaptures(capture, actual);
  assert.equal(diff.length, 0, JSON.stringify(diff.slice(0, 5)));
  const actualFlows = await captureImportFlows(repo, corpus.sources);
  const flowDiff = differences(flows, actualFlows);
  assert.equal(flowDiff.length, 0, JSON.stringify(flowDiff.slice(0, 5)));
  assertImportedCases(corpus, actual);
  return { baselineCommit: manifest.baselineCommit, cases: actual.cases.length, importCases: actual.cases.filter(x => x.id.startsWith('import-')).length, sourceScenarios: corpus.sources.sources.length, savedPayloads: Object.keys(corpus.savedPayloads).length, differences: 0, flowDifferences: 0 };
}
async function record(original, directory) {
  assert.ok(!existsSync(directory), 'refusing to replace sealed alignment; use a new reviewed revision');
  assert.equal(git(['rev-parse', 'HEAD']), expectedCommit);
  // Require exact committed runtime/data. A's test hook is deliberately excluded from this source tree.
  const tree = git(['ls-tree', '-r', expectedCommit, '--', 'webapp/src', 'webapp/package.json', 'webapp/package-lock.json', 'scripts/validate_prompt_logic.mjs']);
  const sourceHashes = {};
  for (const line of tree.split('\n')) {
    const [header, file] = line.split('\t'), digest = header.split(' ')[2];
    assert.equal(git(['hash-object', join(original, file)]), digest, `source is not committed main: ${file}`); sourceHashes[file] = digest;
  }
  const old = verifySeal();
  const inheritedComparisons = {};
  for (const [name, corpus, expected] of [
    ['core', old.corpus, old.capture],
    ['coverage', readJson(join(baselineDir, 'coverage-corpus.json.gz')), readJson(join(baselineDir, 'coverage-outputs.json.gz'))],
  ]) {
    const actual = await captureCorpus(original, corpus), diff = compareCaptures(expected, actual);
    assert.equal(diff.length, 0, JSON.stringify(diff.slice(0, 3)));
    inheritedComparisons[name] = { cases: actual.cases.length, differences: 0, audit: actual.audit.summary };
  }
  const corpus = await createImportCorpus(original, old.corpus.cases.filter(x => x.id.startsWith('audit:')));
  const first = await captureCorpus(original, corpus), second = await captureCorpus(original, corpus);
  assert.deepEqual(compareCaptures(first, second), []);
  const flows = await captureImportFlows(original, corpus.sources), flowsAgain = await captureImportFlows(original, corpus.sources);
  assert.deepEqual(differences(flows, flowsAgain), []); assertImportedCases(corpus, first);
  const artifacts = { 'corpus.json.gz': pack(corpus), 'outputs.json.gz': pack(first), 'flows.json.gz': pack(flows) };
  const inheritedFiles = ['manifest.json', 'corpus.json.gz', 'outputs.json.gz', 'coverage-manifest.json', 'coverage-corpus.json.gz', 'coverage-outputs.json.gz', '../catalogSnapshot.controls.json', '../catalogSnapshot.catalog.json', '../catalogSnapshot.meta.json'];
  const manifest = { format: 'catalog-alignment-v1', baselineCommit: expectedCommit, previousBaselineCommit: old.manifest.baselineCommit,
    reason: 'User approved A alignment after observation full-body import PR #15 and pose inventory docs. No B migration or renderer change.',
    acceptedUpstreamCommits: ['d469a329c34f8f325f0af065639acaac2c55e2da', '9c1a58fa350f0cff1dc6c0827c1dc8f040fe4a24', git(['rev-parse', 'a70cf85']), expectedCommit],
    node: process.version, platform: process.platform, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, locale: Intl.DateTimeFormat().resolvedOptions().locale,
    lockfile: { path: old.manifest.lockfile.path, sha256: hash(join(original, old.manifest.lockfile.path)) }, volatilePaths: old.manifest.volatilePaths,
    sourceGitBlobHashes: sourceHashes, inheritedArtifacts: Object.fromEntries(inheritedFiles.map(f => [f, hash(join(baselineDir, f))])), inheritedComparisons,
    generatorAndFixtureHashes: { ...old.manifest.generatorAndFixtureHashes, ...Object.fromEntries(tools.map(f => [f, hash(join(root, f))])) },
    caseIds: corpus.cases.map(x => x.id), savedPayloadIds: Object.keys(corpus.savedPayloads),
    groups: Object.fromEntries([...new Set(corpus.cases.map(x => x.id.split(':')[0]))].map(group => [group, corpus.cases.filter(x => x.id.split(':')[0] === group).length])),
    expectedOutputs: first.cases.map(x => ({ id: x.id, outputs: Object.fromEntries(Object.entries(x.outputs).map(([k,v]) => [k, v.status])) })),
    artifacts: Object.fromEntries(Object.entries(artifacts).map(([f, bytes]) => [f, sha256(bytes)])),
  };
  mkdirSync(directory, { recursive: true });
  for (const [file, bytes] of Object.entries(artifacts)) writeFileSync(join(directory, file), bytes, { flag: 'wx' });
  writeFileSync(join(directory, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ recorded: directory, groups: manifest.groups, inheritedComparisons }));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [command = 'check', source, destination] = process.argv.slice(2);
    if (command === 'record') { assert.ok(source, 'requires exported committed main'); await record(resolve(source), resolve(destination || alignmentDir)); }
    else if (command === 'verify') console.log(JSON.stringify({ sealed: verifyAlignment().manifest.baselineCommit }));
    else if (command === 'check') console.log(JSON.stringify(await checkAlignment(source ? resolve(source) : root)));
    else throw new Error('Usage: catalog_alignment_baseline.mjs record source-tree [new-directory] | verify | check [repo]');
  } catch (error) { console.error(error.stack); process.exitCode = 1; }
}

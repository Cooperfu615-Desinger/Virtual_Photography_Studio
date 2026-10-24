import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createCorpus } from './lib/catalogCorpus.mjs';
import { OUTPUTS, VOLATILE_PATHS, sha256, pack, readJson, stablePrompt, outputStates, compareCaptures, captureIdResolution, differences } from './lib/catalogBaseline.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const baselineDir = join(root, 'webapp/src/lib/engine/catalogBaseline');
const load = (repo, file) => import(pathToFileURL(join(repo, file)).href);

export async function captureCorpus(repo, corpus) {
  if (corpus?.format !== 'catalog-corpus-v1' || !corpus.cases?.length) throw new Error('invalid corpus');
  const E = await load(repo, 'webapp/src/lib/engine.js');
  const codec = await load(repo, 'webapp/src/features/saved-cards/cardCodec.js');
  const display = await load(repo, 'webapp/src/lib/page1PromptOutputs.js');
  const { auditPrompts } = await load(repo, 'scripts/validate_prompt_logic.mjs');
  const controls = E.getLockControls(), streams = new Map(), audit = [], seen = new Set();
  const cases = corpus.cases.map(input => {
    if (!input.id || seen.has(input.id)) throw new Error(`duplicate case ID ${input.id}`);
    seen.add(input.id);
    if (!streams.has(input.stream)) streams.set(input.stream, { seed: input.seed, random: E.createSeededRandom(input.seed) });
    const stream = streams.get(input.stream);
    if (stream.seed !== input.seed) throw new Error(`stream seed mismatch ${input.id}`);
    let rngCalls = 0;
    const generated = E.generatePrompts(1, structuredClone(input.locks), [], { random: () => { rngCalls++; return stream.random(); } });
    if (generated.length !== 1) throw new Error(`UNRESOLVED ${input.id}`);
    const prompt = generated[0];
    if (input.id.startsWith('audit:')) audit.push({ ...prompt, id: input.id });
    return { id: input.id, status: 'resolved', rngCalls, outputs: outputStates(prompt), prompt: stablePrompt(prompt),
      restoreLocks: codec.buildRestoreLocks(prompt.selection, controls),
      normalizedLocks: E.normalizeLocks(input.locks, controls),
      eligibleSceneOptions: Object.fromEntries(Object.entries(E.getSceneDependentOptions([], input.locks)).map(([key, options]) => [key, options.map(option => option.id)])),
      display: display.buildPage1DisplayOutputs(prompt),
    };
  });
  const saved = Object.fromEntries(Object.entries(corpus.savedPayloads).map(([key, payload]) => {
    const decoded = key.toLowerCase().includes('markdown')
      ? codec.parseExportedMarkdownPrompt(payload, controls, `catalog-import-${key}`)
      : codec.deserializeFavoritePrompt(structuredClone(payload));
    const normalized = { ...decoded, id: `catalog-import-${key}`, date: '2026-10-24T00:00:00.000Z' };
    const serialized = codec.serializeFavoritePrompt(normalized);
    const reloaded = codec.deserializeFavoritePrompt(JSON.parse(JSON.stringify(serialized)));
    const locks = codec.buildRestoreLocks(reloaded.selection, controls);
    let rngCalls = 0;
    const random = E.createSeededRandom(`restore:${key}`);
    const regenerated = E.generatePrompts(1, locks, [], { random: () => { rngCalls++; return random(); } });
    if (regenerated.length !== 1) throw new Error(`UNRESOLVED saved:${key}`);
    return [key, { decoded: stablePrompt(decoded), serialized, reloaded, locks, rngCalls, regenerated: stablePrompt(regenerated[0]) }];
  }));
  const appendices = ['', 'four-free-variations', 'four-camera-views', 'amateur-selfies', 'everyday-snapshots']
    .map(template => ({ template, ...display.buildPage1DisplayOutputs(cases[0].prompt, template, { customEnabled: true, customText: '  Soft side lighting.\n背景保持簡潔。  ' }) }));
  return { format: 'catalog-baseline-v1', cases, saved, appendices, idResolution: captureIdResolution(E), audit: auditPrompts(audit, { seed: corpus.audit.seed, requireCompleteCoverage: true }) };
}

export function verifySeal(directory = baselineDir) {
  const manifest = readJson(join(directory, 'manifest.json'));
  if (!/^[0-9a-f]{40}$/.test(manifest.baselineCommit)) throw new Error('invalid baselineCommit');
  for (const [file, hash] of Object.entries(manifest.artifacts)) {
    if (sha256(readFileSync(join(directory, file))) !== hash) throw new Error(`sealed artifact changed: ${file}`);
  }
  for (const [file, hash] of Object.entries(manifest.generatorAndFixtureHashes)) {
    if (sha256(readFileSync(join(root, file))) !== hash) throw new Error(`generator/fixture changed: ${file}`);
  }
  const corpus = readJson(join(directory, 'corpus.json.gz'));
  const capture = readJson(join(directory, 'outputs.json.gz'));
  const ids = corpus.cases.map(x => x.id);
  if (JSON.stringify(ids) !== JSON.stringify(manifest.caseIds) || JSON.stringify(ids) !== JSON.stringify(capture.cases.map(x => x.id))) throw new Error('manifest/corpus/output case set mismatch');
  compareCaptures(capture, capture);
  if (differences(capture.cases.map(x => ({ id: x.id, outputs: Object.fromEntries(Object.entries(x.outputs).map(([k, v]) => [k, v.status])) })), manifest.expectedOutputs).length) throw new Error('manifest expected outputs mismatch');
  return { manifest, corpus, capture };
}

async function main() {
  const [command, arg, arg2] = process.argv.slice(2);
  if (command === 'record') {
    const directory = resolve(arg || baselineDir);
    if (existsSync(directory)) throw new Error('refusing to overwrite baseline directory; record a separately reviewed revision');
    const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
    // A source baseline must come from clean runtime/data; tools and documents may be uncommitted.
    const changed = execFileSync('git', ['diff', 'HEAD', '--name-only', '--', 'webapp/src', 'knowledge_base'], { cwd: root, encoding: 'utf8' }).trim();
    if (changed) throw new Error(`runtime/data differs from source commit: ${changed}`);
    const corpus = await createCorpus(root);
    const first = await captureCorpus(root, corpus), second = await captureCorpus(root, corpus);
    const diff = compareCaptures(first, second);
    if (diff.length) throw new Error(`nondeterministic baseline ${JSON.stringify(diff.slice(0, 3))}`);
    const artifacts = { 'corpus.json.gz': pack(corpus), 'outputs.json.gz': pack(first) };
    const files = ['scripts/catalog_baseline.mjs', 'scripts/dump_prompt_outputs.mjs', 'scripts/lib/catalogBaseline.mjs', 'scripts/lib/catalogCorpus.mjs', 'scripts/validate_prompt_logic.mjs', 'webapp/src/lib/engine/representativePromptFixtures.js', 'webapp/src/lib/engine/promptOutputContracts.js', 'webapp/src/lib/engine/specifiedActions.js', 'webapp/src/lib/page1SectionRandom.js'];
    const manifest = { format: 'catalog-manifest-v1', baselineCommit: commit, sourceState: 'clean runtime and data; A tools uncommitted by user instruction', node: process.version, platform: process.platform, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, locale: Intl.DateTimeFormat().resolvedOptions().locale,
      lockfile: { path: 'webapp/package-lock.json', lockfileVersion: readJson(join(root, 'webapp/package-lock.json')).lockfileVersion, sha256: sha256(readFileSync(join(root, 'webapp/package-lock.json'))) },
      generatorAndFixtureHashes: Object.fromEntries(files.map(file => [file, sha256(readFileSync(join(root, file)))])), volatilePaths: VOLATILE_PATHS, outputFields: OUTPUTS,
      caseIds: corpus.cases.map(x => x.id), groups: Object.fromEntries([...new Set(corpus.cases.map(x => x.id.split(':')[0]))].map(group => [group, corpus.cases.filter(x => x.id.split(':')[0] === group).length])),
      expectedOutputs: first.cases.map(x => ({ id: x.id, outputs: Object.fromEntries(Object.entries(x.outputs).map(([k, v]) => [k, v.status])) })),
      artifacts: Object.fromEntries(Object.entries(artifacts).map(([file, bytes]) => [file, sha256(bytes)])),
    };
    mkdirSync(directory, { recursive: true });
    for (const [file, bytes] of Object.entries(artifacts)) writeFileSync(join(directory, file), bytes, { flag: 'wx' });
    writeFileSync(join(directory, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
    console.log(JSON.stringify({ recorded: directory, count: first.cases.length, groups: manifest.groups, audit: first.audit.summary }));
  } else if (command === 'check' || command === 'capture') {
    const { corpus, capture: expected } = verifySeal();
    const actual = await captureCorpus(resolve(arg2 || root), corpus);
    if (command === 'capture') {
      if (!arg) throw new Error('capture requires output path');
      writeFileSync(arg, pack(actual), { flag: 'wx' });
    }
    const diff = compareCaptures(expected, actual);
    console.log(JSON.stringify({ cases: actual.cases.length, differences: diff.length, sample: diff.slice(0, 20) }, null, 2));
    if (diff.length) process.exitCode = 1;
  } else if (command === 'compare') {
    const diff = compareCaptures(readJson(arg), readJson(arg2));
    console.log(JSON.stringify({ differences: diff.length, sample: diff.slice(0, 20) }, null, 2));
    if (diff.length) process.exitCode = 1;
  } else if (command === 'verify') {
    console.log(JSON.stringify({ sealed: verifySeal().manifest.baselineCommit }));
  } else throw new Error('Usage: catalog_baseline.mjs record [new-directory] | check | capture out.json.gz [repo] | compare before after | verify');
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { await main(); } catch (error) { console.error(error.stack); process.exitCode = 1; }
}

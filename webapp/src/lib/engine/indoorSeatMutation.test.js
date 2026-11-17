import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import process from 'node:process';

const root = fileURLToPath(new URL('../../../../', import.meta.url));
const seating = 'webapp/src/lib/engine/indoorSeating.js';
const engine = 'webapp/src/lib/engine.js';
const codec = 'webapp/src/features/saved-cards/cardCodec.js';
const outputAnchor = '  if (runtimeOptions.experimentalGrok7 !== false) {\n    const preCropPage1';
const outputFault = code => code + '\n' + outputAnchor;
// Each fault changes executable production source in a disposable copy, never expected data.
const faults = [
  { id: 'bed-edge-is-bed-top', family: 'bed-edge', path: seating,
    from: "'bed-edge': ['床邊', 'on the edge of the bed']", to: "'bed-edge': ['床邊', 'on the bed']", detects: '[rules]' },
  { id: 'unselected-auto-selects', family: 'classroom-chair', path: seating,
    from: 'const selected = options.find(option => option.id === locks.indoorSeatId);',
    to: 'const selected = options.find(option => option.id === locks.indoorSeatId) || options[0];', detects: '[rules]' },
  { id: 'candidate-order-reversed', family: 'classroom-chair', path: seating,
    from: '.filter(id => compatible.includes(id)).map(id => {', to: '.filter(id => compatible.includes(id)).reverse().map(id => {', detects: '[rules]' },
  { id: 'tatami-becomes-floor', family: 'ground-tatami', path: seating,
    from: "const tatami = location.lyingSurface?.type === 'tatami';", to: 'const tatami = false;', detects: '[rules]' },
  { id: 'bed-ground-invents-floor', family: 'ground-bed', path: seating,
    from: "phrase: !scene || bedOnly ? '' : tatami ? 'on the tatami floor' : 'on the floor'",
    to: "phrase: !scene ? '' : tatami ? 'on the tatami floor' : 'on the floor'", detects: '[rules]' },
  { id: 'duo-owner-guard-removed', family: 'classroom-chair', path: seating,
    from: "|| locks.subjectCount !== '1' || locks.captureMode === 'observation'", to: "|| locks.captureMode === 'observation'", detects: '[owner]', legacy: false },
  { id: 'common-gpt-opening-omission', family: 'classroom-chair', path: engine,
    from: outputAnchor, to: outputFault("  prompt.grokPrompt = prompt.grokPrompt.split('\\n\\n').slice(1).join('\\n\\n');"), detects: '[output:gpt]' },
  { id: 'extra-random-draw', family: 'classroom-chair', path: engine,
    from: '  const prompt = {\n    id:', to: '  random();\n  const prompt = {\n    id:', detects: '[rng]' },
  { id: 'structured-scene-lost', family: 'classroom-chair', path: engine,
    from: outputAnchor, to: outputFault('  prompt.structured.Location = [];'), detects: '[structured]' },
  { id: 'summary-lost', family: 'classroom-chair', path: engine,
    from: outputAnchor, to: outputFault("  prompt.summary = '';"), detects: '[summary]' },
  { id: 'grok-imagine-duplicated', family: 'classroom-chair', path: engine,
    from: '    registerGrokImagineResult(prompt, grokImagine);',
    to: "    registerGrokImagineResult(prompt, grokImagine + '\\n' + grokImagine);", detects: '[output:grok-imagine]' },
  { id: 'chair-leaks-into-chest-crop', family: 'classroom-chair', path: engine,
    from: outputAnchor, to: outputFault("  if (context.framing.zh === '胸上特寫') prompt.grokPrompt += '\\nShe sits on a chair.';"), detects: '[output:gpt]' },
  { id: 'restore-drops-seat', family: 'bed-edge', path: codec,
    from: '  const restoredLocks = { ...createEmptyLocks(), ...nextLocks };',
    to: '  const restoredLocks = { ...createEmptyLocks(), ...nextLocks };\n  delete restoredLocks.indoorSeatId;', detects: '[restore]', legacy: false, restore: true },
  { id: 'incompatible-seats-allowed', family: 'classroom-floor', path: seating,
    from: '.filter(id => compatible.includes(id)).map(id => {', to: '.filter(() => true).map(id => {', detects: '[rules]' },
];
let temporary;
const originals = new Map();
const env = { ...process.env };
// A mutant must never consume any previous runner's successful generation cache.
for (const key of ['VPS_TEST_RUN_DIRECTORY', 'VPS_TEST_RUN_TOKEN', 'NODE_TEST_CONTEXT']) delete env[key];
function probe(fault) {
  return JSON.parse(execFileSync(process.execPath,
    [join(temporary, 'webapp/src/lib/engine/indoorSeatMutationProbe.js'), fault.family, fault.restore ? 'restore' : ''],
    { cwd: temporary, env, encoding: 'utf8', timeout: 30000, maxBuffer: 2 * 1024 * 1024 }));
}
function oldRestore() {
  const result = spawnSync(process.execPath, ['--test', 'src/features/saved-cards/indoorSeatRestore.test.js'],
    { cwd: join(temporary, 'webapp'), env, encoding: 'utf8', timeout: 30000, maxBuffer: 2 * 1024 * 1024 });
  if (result.error) throw result.error;
  assert.equal(result.signal, null, 'Original restore suite must finish normally');
  assert.match(result.stdout, /# tests 4\b/, 'All four original restore tests must execute');
  return result;
}
before(() => {
  temporary = mkdtempSync(join(tmpdir(), 'vps-seat-phase3a-mutation-'));
  mkdirSync(join(temporary, 'webapp'), { recursive: true });
  cpSync(join(root, 'webapp/src'), join(temporary, 'webapp/src'), { recursive: true });
  cpSync(join(root, 'webapp/package.json'), join(temporary, 'webapp/package.json'));
  symlinkSync(join(root, 'webapp/node_modules'), join(temporary, 'webapp/node_modules'), 'dir');
  for (const batch of [1, 2, 3]) {
    const path = `Docs/reports/pose-upper-body-state-batch${batch}-2026-11-12/baseline-revision.json.gz`;
    mkdirSync(join(temporary, path, '..'), { recursive: true });
    cpSync(join(root, path), join(temporary, path));
  }
  for (const path of [seating, engine, codec]) originals.set(path, readFileSync(join(temporary, path), 'utf8'));
});
after(() => { if (temporary) rmSync(temporary, { recursive: true, force: true }); });

test('seat phase 3A mutation controls: unmodified copied sources pass every probe and original restore suite', () => {
  const scenarios = new Map(faults.map(f => [f.family + Boolean(f.restore), f]));
  for (const fault of scenarios.values()) assert.deepEqual(probe(fault).failures, [], fault.family);
  assert.equal(oldRestore().status, 0);
});

for (const fault of faults) test('seat phase 3A mutation: ' + fault.id, t => {
  const original = originals.get(fault.path);
  assert.equal(original.split(fault.from).length - 1, 1, 'Fault anchor must match exactly once; review after source changes');
  try {
    writeFileSync(join(temporary, fault.path), original.replace(fault.from, fault.to));
    const { failures } = probe(fault);
    assert.ok(failures.some(f => f.category !== 'legacy-row' && f.message.startsWith(fault.detects)),
      'Expected independent detector ' + fault.detects + ': ' + JSON.stringify(failures));
    const oldRowDetected = failures.some(f => f.category === 'legacy-row');
    assert.equal(oldRowDetected, fault.legacy !== false, 'Record actual historical row coverage');
    if (fault.restore) {
      const old = oldRestore();
      assert.equal(old.status, 1);
      assert.match(old.stdout, /ERR_ASSERTION/, 'Original suite must reject the value, not crash while importing');
      assert.doesNotMatch(old.stdout + old.stderr, /SyntaxError|ERR_MODULE_NOT_FOUND|ReferenceError|TypeError/);
    }
    t.diagnostic(JSON.stringify({ fault: fault.id, independent: fault.detects, oldRowDetected, oldRestoreDetected: Boolean(fault.restore) }));
  } finally {
    writeFileSync(join(temporary, fault.path), original);
  }
});

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import process from 'node:process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  groupWebappTestArguments,
  HISTORICAL_SCENE_MATRIX_FILES as members,
  HISTORICAL_SCENE_MATRIX_AGGREGATOR as aggregator,
  spawnWebappTests,
} from '../../../../scripts/run_webapp_tests.mjs';

const webappDirectory = fileURLToPath(new URL('../../../', import.meta.url));
const packageJson = JSON.parse(readFileSync(new URL('../../../package.json', import.meta.url), 'utf8'));
const absolute = file => resolve(webappDirectory, file);
const expandedFileSet = files => new Set(files.flatMap(file => (
  absolute(file) === absolute(aggregator) ? members.map(absolute) : [absolute(file)]
)));
const testFiles = directory => readdirSync(absolute(directory))
  .filter(file => file.endsWith('.test.js')).map(file => `${directory}/${file}`);

test('complete historical group substitutes one entry and preserves all other arguments in order', () => {
  const args = ['--test-concurrency=4', 'src/lib/engine.test.js', members[0],
    '--test-reporter', 'spec', members[1], 'src/features/page1/sceneEditor.test.js', members[2]];
  const before = [...args];
  assert.deepEqual(groupWebappTestArguments(args, webappDirectory), [
    '--test-concurrency=4', 'src/lib/engine.test.js', aggregator,
    '--test-reporter', 'spec', 'src/features/page1/sceneEditor.test.js',
  ]);
  assert.deepEqual(args, before, 'the caller owns its argument array');
});

test('full npm test selection retains the exact test-file union without a duplicate historical entry', () => {
  assert.match(packageJson.scripts.test, /^node \.\.\/scripts\/run_webapp_tests\.mjs /);
  assert.deepEqual(packageJson.scripts.test.split(/\s+/).slice(2), [
    'src/lib/*.test.js', 'src/lib/engine/*.test.js', 'src/features/*/*.test.js',
  ]);
  const selected = [...testFiles('src/lib'), ...testFiles('src/lib/engine'),
    ...readdirSync(absolute('src/features'), { withFileTypes: true })
      .filter(entry => entry.isDirectory()).flatMap(entry => testFiles(`src/features/${entry.name}`))];
  assert.ok(selected.includes(aggregator));
  for (const member of members) assert.ok(selected.includes(member));
  const grouped = groupWebappTestArguments(selected, webappDirectory);
  assert.equal(grouped.filter(file => absolute(file) === absolute(aggregator)).length, 1);
  assert.ok(!grouped.some(file => members.includes(file)));
  assert.deepEqual(expandedFileSet(grouped), expandedFileSet(selected));
  const expectedOthers = selected.filter(file => !members.includes(file));
  assert.deepEqual(grouped, expectedOthers);
});

test('prompt quality selection retains every original selected suite and all three historical matrices', () => {
  const words = packageJson.scripts['test:prompt-quality'].split(/\s+/);
  assert.deepEqual(words.slice(0, 2), ['node', '../scripts/run_webapp_tests.mjs']);
  const selected = words.slice(2);
  for (const member of members) assert.ok(selected.includes(member));
  const grouped = groupWebappTestArguments(selected, webappDirectory);
  assert.equal(grouped.filter(file => absolute(file) === absolute(aggregator)).length, 1);
  assert.deepEqual(expandedFileSet(grouped), expandedFileSet(selected));
  assert.deepEqual(grouped.filter(file => file !== aggregator), selected.filter(file => !members.includes(file)));
});

test('focused single and partial matrix selections never expand or drop their scope', () => {
  for (const subset of [[], [members[0]], members.slice(0, 2), members.slice(1)]) {
    const args = ['--test-concurrency', '2', ...subset, '--test-name-pattern', 'frozen'];
    assert.deepEqual(groupWebappTestArguments(args, webappDirectory), args);
  }
});

test('native flag values are preserved even when they look exactly like a matrix test path', () => {
  const args = ['--test-name-pattern', members[2], '--test-concurrency', '4', ...members.slice(0, 2)];
  assert.deepEqual(groupWebappTestArguments(args, webappDirectory), args);
  const complete = ['--import', members[0], '--test-skip-pattern', members[1], '--test-shard', '1/2', ...members];
  assert.deepEqual(groupWebappTestArguments(complete, webappDirectory), [
    '--import', members[0], '--test-skip-pattern', members[1], '--test-shard', '1/2', aggregator,
  ]);
});

test('absolute paths, relative aliases and the native option delimiter identify the same complete group', () => {
  const args = ['--', absolute(members[0]), `./${members[1]}`, members[2], 'src/lib/page1PromptOutputs.test.js'];
  assert.deepEqual(groupWebappTestArguments(args, webappDirectory), [
    '--', aggregator, 'src/lib/page1PromptOutputs.test.js',
  ]);
});

test('an explicitly selected aggregator is retained once and does not need another generated entry', () => {
  const args = [members[0], aggregator, members[1], 'src/lib/engine.test.js', members[2]];
  assert.deepEqual(groupWebappTestArguments(args, webappDirectory), [aggregator, 'src/lib/engine.test.js']);
});

test('runner starts the same Node binary with native test isolation and preserves caller flags', () => {
  const marker = {};
  const args = ['--test-concurrency=4', ...members, 'src/lib/engine.test.js'];
  const child = spawnWebappTests(args, {
    cwd: webappDirectory,
    spawnProcess(executable, childArgs, options) {
      assert.equal(executable, process.execPath);
      assert.deepEqual(childArgs, ['--test', '--test-concurrency=4', aggregator, 'src/lib/engine.test.js']);
      assert.deepEqual(options, { cwd: webappDirectory, stdio: 'inherit' });
      assert.ok(!childArgs.some(argument => argument.includes('test-isolation=none')));
      return marker;
    },
  });
  assert.equal(child, marker);
});

test('CLI returns the native test success and failure status without swallowing failed assertions', () => {
  const directory = mkdtempSync(resolve(tmpdir(), 'vps-test-runner-'));
  const runner = fileURLToPath(new URL('../../../../scripts/run_webapp_tests.mjs', import.meta.url));
  try {
    for (const [name, assertion, expectedStatus] of [
      ['pass', 'assert.equal(1, 1)', 0],
      ['fail', 'assert.equal(1, 2)', 1],
    ]) {
      const fixture = resolve(directory, `${name}.test.mjs`);
      writeFileSync(fixture, `import { test } from 'node:test';\nimport assert from 'node:assert/strict';\ntest('${name}', () => { ${assertion}; });\n`);
      const result = spawnSync(process.execPath, [runner, '--test-concurrency=2', fixture], {
        cwd: webappDirectory,
        encoding: 'utf8',
        // Model a terminal invocation rather than another native test child.
        env: { ...process.env, NODE_TEST_CONTEXT: undefined },
      });
      assert.equal(result.status, expectedStatus, result.stderr || result.stdout);
      assert.match(result.stdout, expectedStatus === 0 ? /# pass 1/ : /# fail 1/);
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('grouped original suites keep real historical fixture reuse enabled for their entire lifecycle', () => {
  const runner = fileURLToPath(new URL('../../../../scripts/run_webapp_tests.mjs', import.meta.url));
  const result = spawnSync(process.execPath, [runner,
    '--test-name-pattern=approved near-contact medium and cowboy copy|historical scene fixture reuse stays enabled', ...members], {
    cwd: webappDirectory,
    encoding: 'utf8',
    timeout: 15000,
    env: { ...process.env, NODE_TEST_CONTEXT: undefined },
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /# pass 2/);
  // The original first suite generates its 30 cases before the memo check;
  // this pins activation before imported tests and cleanup after the last one.
  assert.match(result.stdout, /historical scene fixture reuse: 31 generations, 1 hits/);
});

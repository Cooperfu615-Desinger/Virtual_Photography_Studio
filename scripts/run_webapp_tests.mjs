// Node-only test orchestration. Keep ordinary test files in their native process
// isolation and group only the three overlapping immutable scene matrices.
import { spawn } from 'node:child_process';
import { resolve, relative } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const webappDirectory = fileURLToPath(new URL('../webapp/', import.meta.url));

export const HISTORICAL_SCENE_MATRIX_FILES = Object.freeze([
  'src/lib/engine/closeWormEye.test.js',
  'src/lib/engine/gptCameraSpatial.test.js',
  'src/lib/engine/gptSceneVisibility.test.js',
]);
export const HISTORICAL_SCENE_MATRIX_AGGREGATOR = 'src/lib/engine/historicalSceneMatrices.test.js';

// These native options accept a separate argument as well as --option=value.
// In particular, an option's value must never be mistaken for a test file.
const OPTIONS_WITH_VALUES = new Set([
  '--test-concurrency', '--test-name-pattern', '--test-skip-pattern',
  '--test-reporter', '--test-reporter-destination', '--test-shard',
  '--test-timeout', '--test-isolation', '--experimental-test-isolation',
  '--test-coverage-branches', '--test-coverage-functions', '--test-coverage-lines',
  '--test-coverage-include', '--test-coverage-exclude',
  '--require', '-r', '--import', '--loader', '--experimental-loader',
  '--conditions', '-C', '--eval', '-e', '--print', '-p',
  '--inspect-port', '--inspect-publish-uid', '--input-type',
]);

function testFilePositions(args) {
  const positions = [];
  let filesOnly = false;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (!filesOnly && argument === '--') {
      filesOnly = true;
    } else if (!filesOnly && OPTIONS_WITH_VALUES.has(argument)) {
      index += 1;
    } else if (filesOnly || !argument.startsWith('-')) {
      positions.push(index);
    }
  }
  return positions;
}

export function groupWebappTestArguments(args, cwd = process.cwd()) {
  const selected = testFilePositions(args);
  const members = new Set(HISTORICAL_SCENE_MATRIX_FILES.map(file => resolve(webappDirectory, file)));
  const aggregator = resolve(webappDirectory, HISTORICAL_SCENE_MATRIX_AGGREGATOR);
  const memberPositions = selected.filter(index => members.has(resolve(cwd, args[index])));
  const selectedMembers = new Set(memberPositions.map(index => resolve(cwd, args[index])));
  // A focused request for one or two files must stay exactly that request.
  if (selectedMembers.size !== members.size) return [...args];

  const aggregatorAlreadySelected = selected.some(index => resolve(cwd, args[index]) === aggregator);
  const firstMember = memberPositions[0];
  const memberIndexes = new Set(memberPositions);
  return args.flatMap((argument, index) => {
    if (!memberIndexes.has(index)) return [argument];
    return index === firstMember && !aggregatorAlreadySelected
      ? [relative(cwd, aggregator)] : [];
  });
}

export function spawnWebappTests(args, { cwd = process.cwd(), spawnProcess = spawn } = {}) {
  return spawnProcess(process.execPath, ['--test', ...groupWebappTestArguments(args, cwd)], {
    cwd,
    stdio: 'inherit',
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const child = spawnWebappTests(process.argv.slice(2));
  const forwardInterrupt = () => child.kill('SIGINT');
  const forwardTermination = () => child.kill('SIGTERM');
  process.once('SIGINT', forwardInterrupt);
  process.once('SIGTERM', forwardTermination);
  child.once('error', error => {
    process.stderr.write(`Unable to start webapp tests: ${error.message}\n`);
    process.exitCode = 1;
  });
  child.once('exit', (code, signal) => {
    process.removeListener('SIGINT', forwardInterrupt);
    process.removeListener('SIGTERM', forwardTermination);
    // Preserve native test failures so CI still blocks lint/build/deployment.
    process.exitCode = code ?? (signal ? 1 : 0);
  });
}

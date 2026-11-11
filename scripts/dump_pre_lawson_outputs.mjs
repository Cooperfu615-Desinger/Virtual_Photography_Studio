// Run the current engine against the exact pre-Lawson catalog in an isolated
// copy so frozen random-pool baselines retain their original input and seed.
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { preLawsonSceneSource } from './lib/lawsonSceneHistoricalReplay.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = mkdtempSync(join(tmpdir(), 'vps-pre-lawson-dump-'));
try {
  const webapp = join(directory, 'webapp');
  mkdirSync(webapp);
  cpSync(join(root, 'webapp/src'), join(webapp, 'src'), { recursive: true });
  cpSync(join(root, 'webapp/package.json'), join(webapp, 'package.json'));
  symlinkSync(join(root, 'webapp/node_modules'), join(webapp, 'node_modules'), 'dir');
  const database = 'webapp/src/data/database.json';
  const current = readFileSync(join(root, database));
  const previous = preLawsonSceneSource(database, current);
  if (current.equals(previous)) throw new Error('Pre-Lawson catalog requires the exact reviewed current database');
  writeFileSync(join(directory, database), previous);
  const dump = join(directory, 'scripts/dump_prompt_outputs.mjs');
  mkdirSync(dirname(dump), { recursive: true });
  cpSync(join(root, 'scripts/dump_prompt_outputs.mjs'), dump);
  execFileSync(process.execPath, [dump, resolve(process.argv[2])], { cwd: webapp, stdio: 'inherit', timeout: 110000 });
} finally {
  rmSync(directory, { recursive: true, force: true });
}

// Replay original A1 and four A5 tools without modifying their evidence.
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
import { A2_ROOT, withPreA2ReplayRoot } from './lib/a2DressControlHistoricalReplay.mjs';
import { supplySealedHistory } from './lib/a5XimendingHistoricalReplay.mjs';
const out = resolve(process.argv[2] || '/tmp/a2-dresses-history'); mkdirSync(out, { recursive: true });
await withPreA2ReplayRoot(async directory => {
  supplySealedHistory(directory);
  const env = { ...process.env, GIT_DIR: execFileSync('git', ['-C', A2_ROOT, 'rev-parse', '--absolute-git-dir'], { encoding: 'utf8' }).trim() };
  for (const [script, dest] of [['character_adult_identity_acceptance.mjs', 'a1'], ['character_adult_identity_history.mjs', 'a5']]) {
    process.stdout.write(execFileSync(process.execPath, [join(directory, 'scripts', script), join(out, dest)], { cwd: directory, env, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }));
  }
});

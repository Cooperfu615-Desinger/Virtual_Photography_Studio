// Original A5 tools run unchanged on current code with only the A1 additions reversed.
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
import { withPreA1ReplayRoot, A1_ROOT } from './lib/a1AdultIdentityHistoricalReplay.mjs';
import { supplySealedHistory } from './lib/a5XimendingHistoricalReplay.mjs';
const out = resolve(process.argv[2] || '/tmp/a1-history'); mkdirSync(out, { recursive: true });
await withPreA1ReplayRoot(async directory => {
  supplySealedHistory(directory);
  const env = { ...process.env, GIT_DIR: execFileSync('git', ['-C', A1_ROOT, 'rev-parse', '--absolute-git-dir'], { encoding: 'utf8' }).trim() };
  for (const [script, file] of [['scene_semantic_a5_ximending_acceptance.mjs', 'ximending.json.gz'], ['scene_semantic_a5_ximending_imports.mjs', 'ximending-imports.json.gz'], ['scene_semantic_a5_ximending_history.mjs', 'previous']]) {
    process.stdout.write(execFileSync(process.execPath, [join(directory, 'scripts', script), join(out, file)], { cwd: directory, env, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }));
  }
});

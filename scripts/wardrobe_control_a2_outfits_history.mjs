// Original A2 first-batch, A1 and four A5 tools run against exact isolated inverses.
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
import { A2_OUTFIT_ROOT, openPreA2OutfitReplayRoot } from './lib/a2OutfitControlHistoricalReplay.mjs';
import { supplySealedHistory } from './lib/a5XimendingHistoricalReplay.mjs';
const out = resolve(process.argv[2] || '/tmp/a2-outfits-history'); mkdirSync(out, { recursive: true });
const { directory, cleanup } = openPreA2OutfitReplayRoot();
try {
  supplySealedHistory(directory);
  const env = { ...process.env, GIT_DIR: execFileSync('git', ['-C', A2_OUTFIT_ROOT, 'rev-parse', '--absolute-git-dir'], { encoding: 'utf8' }).trim() };
  for (const [script, dest] of [['wardrobe_control_a2_acceptance.mjs', 'a2-dresses'], ['wardrobe_control_a2_history.mjs', 'a1-a5']])
    process.stdout.write(execFileSync(process.execPath, [join(directory, 'scripts', script), join(out, dest)], { cwd: directory, env, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }));
} finally { cleanup(); }

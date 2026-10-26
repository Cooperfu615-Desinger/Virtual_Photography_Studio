// Replay all three delivered A5 batches without editing their tools or expectations.
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
import { historicalGit, supplySealedHistory, withPreXimendingReplayRoot } from './lib/a5XimendingHistoricalReplay.mjs';
const out = resolve(process.argv[2] || '/tmp/a5-ximending-history'); mkdirSync(out, { recursive: true });
await withPreXimendingReplayRoot(async directory => {
  supplySealedHistory(directory);
  const env = { ...process.env, GIT_DIR: historicalGit('rev-parse', '--absolute-git-dir').toString().trim() };
  for (const [script, file] of [['scene_semantic_a5_crt_acceptance.mjs','crt.json.gz'], ['scene_semantic_a5_crt_imports.mjs','crt-imports.json.gz'], ['scene_semantic_a5_crt_history.mjs','previous']]) {
    const log = execFileSync(process.execPath, [join(directory, 'scripts', script), join(out, file)], { cwd: directory, env, encoding:'utf8', maxBuffer:20*1024*1024 });
    process.stdout.write(script + '\n' + log);
  }
});

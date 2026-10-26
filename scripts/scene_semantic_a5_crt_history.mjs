// Run both prior A5 acceptance tools unchanged, on exact pre-CRT/current-code input.
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
import { historicalGit, supplySealedHistory, withPreCrtReplayRoot } from './lib/a5CrtHistoricalReplay.mjs';
const out = resolve(process.argv[2] || '/tmp/a5-crt-history'); mkdirSync(out, { recursive: true });
await withPreCrtReplayRoot(async directory => {
  supplySealedHistory(directory);
  const env = { ...process.env, GIT_DIR: historicalGit('rev-parse', '--absolute-git-dir').toString().trim() };
  for (const [script, file] of [['scene_semantic_a5_commercial_acceptance.mjs','commercial.json.gz'], ['scene_semantic_a5_commercial_history.mjs','first-a5.json']]) {
    const log = execFileSync(process.execPath, [join(directory, 'scripts', script), join(out, file)], { cwd: directory, env, encoding:'utf8', maxBuffer:20*1024*1024 });
    process.stdout.write(script + '\n' + log);
  }
});

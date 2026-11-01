// Replays the sealed A characterization in a disposable source copy.
// No browser, private storage, baseline writes, or Git checkout mutations.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const revision = '70129ef836d46a7cadd1be3d511c5476c2ecd909';
const dir = mkdtempSync(join(tmpdir(), 'saved-cards-unicode-history-'));
try {
  const archive = execFileSync('git', ['archive', revision, 'webapp/src', 'webapp/package.json', 'webapp/package-lock.json', 'scripts', 'Docs/reports/saved-cards-persistence-a-2026-11-01', 'firestore.rules'], { cwd: root, maxBuffer: 256 * 1024 * 1024 });
  execFileSync('tar', ['-xf', '-', '-C', dir], { input: archive, maxBuffer: 1024 * 1024 });
  symlinkSync(join(root, 'webapp/node_modules'), join(dir, 'webapp/node_modules'), 'dir');
  execFileSync(process.execPath, ['scripts/check_saved_cards_persistence_a.mjs', '--check'], { cwd: dir, stdio: 'inherit' });
  execFileSync(process.execPath, ['--test', 'scripts/tests/saved-cards-persistence-a.test.mjs'], { cwd: dir, stdio: 'inherit' });
} finally {
  rmSync(dir, { recursive: true, force: true });
}

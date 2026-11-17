import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { createTestProgress, sharedTestJson } from './testRunContext.mjs';
const root = fileURLToPath(new URL('../../', import.meta.url));
function sourceIdentity() {
  const hash = createHash('sha256');
  const visit = relative => {
    for (const entry of readdirSync(join(root, relative), { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name))) {
      const path = join(relative, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (/\.(?:js|mjs|json)$/.test(path)) hash.update(path).update('\0').update(readFileSync(join(root, path)));
    }
  };
  visit('webapp/src'); visit('scripts');
  hash.update(readFileSync(join(root, 'webapp/package.json')));
  return hash.digest('hex');
}
export function preLawsonTestSnapshot() {
  return sharedTestJson(root, sourceIdentity(), () => {
    const progress = createTestProgress('pre-Lawson snapshot (shared)', 1686, { root });
    const directory = mkdtempSync(join(tmpdir(), 'vps-lawson-provider-'));
    try {
      const file = join(directory, 'outputs.json');
      execFileSync(process.execPath, [join(root, 'scripts/dump_pre_lawson_outputs.mjs'), file], { cwd: join(root, 'webapp'), stdio: 'pipe', timeout: 120000 });
      const value = JSON.parse(readFileSync(file, 'utf8'));
      if (Object.keys(value).length !== 1686) throw new Error('Shared snapshot must retain all 1686 original cases');
      progress.tick(1686); progress.finish();
      return value;
    } finally { rmSync(directory, {recursive:true,force:true}); }
  });
}

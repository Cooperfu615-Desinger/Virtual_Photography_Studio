import { restorePreChestDressRegionFiles } from './a2ChestDressRegionReplay.mjs';
import { restorePreA2LegacyDressProseFiles } from './a2LegacyDressProseReplay.mjs';
import { restorePreA2LegacyDressFiles } from './a2LegacyDressReplay.mjs';
// Test-only exact inverse. Preserve all other current code and historical evidence.
import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { restorePreA2Files } from './a2DressControlHistoricalReplay.mjs';
export const A1_BASE_COMMIT = 'ffb2e91e61787159d7dbc724dc0129e87537dfcb';
export const A1_ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const A1_BEFORE = `? structuredIdentityLines
      : [groupLine('Identity and body', groups.identityAndBody)]`;
export const A1_AFTER = `? [
          ensureTerminalPeriod(cleanCharacterProfileGroupText(groups.identityAndBody)
            .match(/^a\\s+20-year-old\\s+adult\\s+[^,]*?\\bwoman\\b/i)?.[0] || ''),
          ...structuredIdentityLines,
        ]
      : [groupLine('Identity and body', groups.identityAndBody)]`;
export function preA1EngineSource(source) {
  assert.equal(source.split(A1_AFTER).length - 1, 2, 'A1 inverse requires both exact reviewed insertions');
  assert.equal(source.includes(A1_BEFORE), false, 'A1 inverse rejects mixed or duplicated branches');
  return source.replaceAll(A1_AFTER, A1_BEFORE);
}
export function openPreA1ReplayRoot() {
  const directory = mkdtempSync(join(tmpdir(), 'vps-a1-history-'));
  try {
    mkdirSync(join(directory, 'webapp'));
    for (const path of ['webapp/src', 'scripts', 'knowledge_base']) cpSync(join(A1_ROOT, path), join(directory, path), { recursive: true });
    for (const file of ['package.json', 'package-lock.json']) cpSync(join(A1_ROOT, 'webapp', file), join(directory, 'webapp', file));
    symlinkSync(join(A1_ROOT, 'webapp/node_modules'), join(directory, 'webapp/node_modules'), 'dir');
    restorePreChestDressRegionFiles(directory);
    restorePreA2LegacyDressProseFiles(directory);
    restorePreA2LegacyDressFiles(directory);
    restorePreA2Files(directory);
    const file = join(directory, 'webapp/src/lib/engine.js');
    writeFileSync(file, preA1EngineSource(readFileSync(file, 'utf8')));
    return { directory, cleanup: () => rmSync(directory, { recursive: true, force: true }) };
  } catch (error) { rmSync(directory, { recursive: true, force: true }); throw error; }
}
export async function withPreA1ReplayRoot(run) {
  const { directory, cleanup } = openPreA1ReplayRoot();
  try { return await run(directory); } finally { cleanup(); }
}
export async function withPreAllA5ReplayRoot(run) {
  return withPreA1ReplayRoot(async directory => {
    const historical = await import(pathToFileURL(join(directory, 'scripts/lib/a5XimendingHistoricalReplay.mjs')).href);
    return historical.withPreAllA5ReplayRoot(run);
  });
}

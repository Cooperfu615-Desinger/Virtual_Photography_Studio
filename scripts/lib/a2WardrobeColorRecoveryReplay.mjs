import { restorePreA2LegacyDressProseFiles } from './a2LegacyDressProseReplay.mjs';
import { restorePreA2LegacyDressFiles } from './a2LegacyDressReplay.mjs';
import { restorePreA2SpecialTapeDatabaseFile, restorePreA2SpecialTapeReplayFiles } from './a2SpecialTapeReplay.mjs';
import { restorePreA2MarkdownSnapshotFiles } from './a2MarkdownSnapshotReplay.mjs';
// Restore only the reviewed parser delta in an isolated copy. Historical seals stay immutable.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, realpathSync, rmSync, cpSync, mkdirSync, mkdtempSync, symlinkSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
export const RECOVERY_ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const RECOVERY_PATCHES = JSON.parse(readFileSync(new URL('./a2WardrobeColorRecoveryPatches.json', import.meta.url)));
const hash = text => createHash('sha256').update(text).digest('hex');
export function restorePreA2WardrobeRecoveryFiles(directory) {
  assert.notEqual(realpathSync(directory),realpathSync(RECOVERY_ROOT),'Recovery inverse must use an isolated copy');
  const prepared = [];
  const states = [];
  for (const entry of RECOVERY_PATCHES.files) {
    const text = readFileSync(join(directory,entry.path),'utf8');
    const state = hash(text) === entry.afterHash ? 'after' : hash(text) === entry.beforeHash ? 'before' : 'unknown';
    assert.notEqual(state,'unknown','Recovery inverse rejects unreviewed source: '+entry.path);
    states.push(state);
    let before = text;
    if(state === 'after') for(const patch of entry.patches){
      assert.equal(before.split(patch.after).length-1,1,'Recovery inverse requires exact insertion');
      before=before.replace(patch.after,patch.before);
    }
    assert.equal(hash(before),entry.beforeHash,'Recovery inverse must restore exact base');
    prepared.push([entry.path,before]);
  }
  assert.equal(new Set(states).size,1,'Recovery inverse rejects mixed source states');
  const state=states[0];
  for(const [path,sha] of Object.entries(RECOVERY_PATCHES.newFiles)){
    if(state==='after'||existsSync(join(directory,path)))assert.equal(hash(readFileSync(join(directory,path))),sha,'Recovery inverse rejects changed helper');
  }
  // No writes until every input passed. Idempotent historical roots are valid.
  if(state==='after') for(const [path,text] of prepared)writeFileSync(join(directory,path),text);
  for(const path of Object.keys(RECOVERY_PATCHES.newFiles))rmSync(join(directory,path),{force:true});
}

export async function withPreA2WardrobeRecoveryReplay(run) {
  const directory=mkdtempSync(join(tmpdir(),'vps-a2-recovery-test-'));
  try {
    mkdirSync(join(directory,'webapp'));
    cpSync(join(RECOVERY_ROOT,'webapp/src'),join(directory,'webapp/src'),{recursive:true});
    cpSync(join(RECOVERY_ROOT,'webapp/package.json'),join(directory,'webapp/package.json'));
    symlinkSync(join(RECOVERY_ROOT,'webapp/node_modules'),join(directory,'webapp/node_modules'),'dir');
    cpSync(join(RECOVERY_ROOT,'scripts/lib'),join(directory,'scripts/lib'),{recursive:true});
    restorePreA2LegacyDressProseFiles(directory);
    restorePreA2LegacyDressFiles(directory);
    restorePreA2SpecialTapeDatabaseFile(directory);
    restorePreA2SpecialTapeReplayFiles(directory);
    restorePreA2MarkdownSnapshotFiles(directory);
    restorePreA2WardrobeRecoveryFiles(directory);
    return await run(directory);
  } finally { rmSync(directory,{recursive:true,force:true}); }
}

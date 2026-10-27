import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { RECOVERY_ROOT, RECOVERY_PATCHES, restorePreA2WardrobeRecoveryFiles } from '../../../../scripts/lib/a2WardrobeColorRecoveryReplay.mjs';
const fixture = () => {
 const directory=mkdtempSync(join(tmpdir(),'a2-recovery-inverse-test-'));
 for(const file of RECOVERY_PATCHES.files){const path=join(directory,file.path);mkdirSync(dirname(path),{recursive:true});writeFileSync(path,file.patches[0].after);}
 for(const file of Object.keys(RECOVERY_PATCHES.newFiles)){const path=join(directory,file);mkdirSync(dirname(path),{recursive:true});writeFileSync(path,readFileSync(join(RECOVERY_ROOT,file)));}
 return directory;
};
test('A2 recovery inverse restores exact prior code and is idempotent',()=>{
 const dir=fixture();try{restorePreA2WardrobeRecoveryFiles(dir);restorePreA2WardrobeRecoveryFiles(dir);for(const f of RECOVERY_PATCHES.files)assert.equal(readFileSync(join(dir,f.path),'utf8'),f.patches[0].before);}finally{rmSync(dir,{recursive:true,force:true});}
});
for(const bad of ['extra-source','mixed-state','helper'])test('A2 recovery inverse rejects '+bad+' before any partial write',()=>{
 const dir=fixture();try{
  const f=RECOVERY_PATCHES.files[0],target=bad==='helper'?Object.keys(RECOVERY_PATCHES.newFiles)[0]:f.path;
  if(bad==='mixed-state')writeFileSync(join(dir,target),f.patches[0].before);
  else writeFileSync(join(dir,target),readFileSync(join(dir,target),'utf8')+'\n// unreviewed\n');
  const before=RECOVERY_PATCHES.files.map(x=>readFileSync(join(dir,x.path),'utf8'));
  assert.throws(()=>restorePreA2WardrobeRecoveryFiles(dir));
  assert.deepEqual(RECOVERY_PATCHES.files.map(x=>readFileSync(join(dir,x.path),'utf8')),before);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

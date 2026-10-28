import {preLegacyDressProseSource} from '../../../../scripts/lib/a2LegacyDressProseReplay.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync,existsSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {LEGACY_DRESS_ROOT as root,LEGACY_DRESS_REVIEW as review,restorePreA2LegacyDressFiles as restore} from '../../../../scripts/lib/a2LegacyDressReplay.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
const paths=[...review.files.map(f=>f.path),...Object.keys(review.newTests)];
function seed(dir){for(const p of paths){mkdirSync(dirname(join(dir,p)),{recursive:true});writeFileSync(join(dir,p),preLegacyDressProseSource(p,readFileSync(join(root,p))));}}
test('A2 legacy dress inverse restores exact fixed sources atomically and is idempotent only in isolated copies',()=>{
 assert.throws(()=>restore(root),/isolated/);
 const dir=mkdtempSync(join(tmpdir(),'legacy-dress-inverse-'));
 try{seed(dir);restore(dir);for(const f of review.files)assert.equal(hash(readFileSync(join(dir,f.path))),f.beforeHash);
 for(const p of Object.keys(review.newTests))assert.equal(existsSync(join(dir,p)),false);
 restore(dir);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('A2 legacy dress inverse rejects unknown, missing, mixed and Git inputs before any writes',()=>{
 const dir=mkdtempSync(join(tmpdir(),'legacy-dress-invalid-'));
 const snapshot=()=>paths.map(p=>existsSync(join(dir,p))?readFileSync(join(dir,p)):null);
 try{
  for(const p of paths)for(const type of ['missing','changed']){seed(dir);if(type==='missing')rmSync(join(dir,p));else writeFileSync(join(dir,p),readFileSync(join(dir,p),'utf8')+'\n// unknown');const before=snapshot();assert.throws(()=>restore(dir),/rejects|missing/);assert.deepEqual(snapshot(),before);}
  seed(dir);writeFileSync(join(dir,review.files[0].path),review.files[0].beforeSource);let before=snapshot();assert.throws(()=>restore(dir),/mixed/);assert.deepEqual(snapshot(),before);
  seed(dir);writeFileSync(join(dir,'.git'),'gitdir: forbidden');before=snapshot();assert.throws(()=>restore(dir),/Git checkout/);assert.deepEqual(snapshot(),before);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

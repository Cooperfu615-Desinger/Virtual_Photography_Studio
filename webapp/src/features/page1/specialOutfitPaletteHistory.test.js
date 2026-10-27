import {prePairedCaptureSource} from '../../../../scripts/lib/a2PairedCaptureReplay.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync,existsSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {SPECIAL_PALETTE_ROOT as root,SPECIAL_PALETTE_REVIEW as review,restorePreA2SpecialPaletteFiles as restore} from '../../../../scripts/lib/a2SpecialPaletteReplay.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
test('A2 special palette history restores exact fixed transition and is idempotent only in isolated copies',()=>{
 assert.throws(()=>restore(root),/isolated/);
 const dir=mkdtempSync(join(tmpdir(),'special-palette-inverse-'));
 try{
  for(const p of [review.path,...Object.keys(review.newTests)]){mkdirSync(dirname(join(dir,p)),{recursive:true});writeFileSync(join(dir,p),prePairedCaptureSource(p,readFileSync(join(root,p))));}
  restore(dir);assert.equal(hash(readFileSync(join(dir,review.path))),review.beforeHash);
  for(const p of Object.keys(review.newTests))assert.equal(existsSync(join(dir,p)),false);
  restore(dir);assert.equal(hash(readFileSync(join(dir,review.path))),review.beforeHash);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('A2 special palette inverse rejects missing, changed, mixed and Git inputs before writing',()=>{
 const dir=mkdtempSync(join(tmpdir(),'special-palette-invalid-')),paths=[review.path,...Object.keys(review.newTests)];
 const seed=()=>{for(const p of paths){mkdirSync(dirname(join(dir,p)),{recursive:true});writeFileSync(join(dir,p),prePairedCaptureSource(p,readFileSync(join(root,p))));}};
 const snapshot=()=>paths.map(p=>existsSync(join(dir,p))?readFileSync(join(dir,p)):null);
 try{
  for(const p of paths)for(const type of ['missing','changed']){seed();if(type==='missing')rmSync(join(dir,p));else writeFileSync(join(dir,p),readFileSync(join(dir,p),'utf8')+'\n// unknown');const before=snapshot();assert.throws(()=>restore(dir),/rejects|missing/);assert.deepEqual(snapshot(),before);}
  seed();writeFileSync(join(dir,review.path),readFileSync(join(dir,review.path),'utf8').replace(review.after,review.before));let before=snapshot();assert.throws(()=>restore(dir),/mixed/);assert.deepEqual(snapshot(),before);
  seed();writeFileSync(join(dir,'.git'),'gitdir: forbidden');before=snapshot();assert.throws(()=>restore(dir),/Git checkout/);assert.deepEqual(snapshot(),before);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

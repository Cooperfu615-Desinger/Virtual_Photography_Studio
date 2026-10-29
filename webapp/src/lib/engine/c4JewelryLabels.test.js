import assert from 'node:assert/strict';
import test from 'node:test';
import process from 'node:process';
import {readFileSync,mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {getLockControls,normalizeLocks} from '../engine.js';
import {parseLocksFromStandardPrompt} from '../../features/saved-cards/cardCodec.js';
import review from '../../../../scripts/lib/c4JewelryLabelsReview.json' with {type:'json'};
import {C4_JEWELRY_ROOT as root,C4_JEWELRY_PATCHES as patches,preC4JewelrySource,preparePreC4JewelryFiles} from '../../../../scripts/lib/c4JewelryLabelsReplay.mjs';
const controls=getLockControls();
test('C4 jewelry source delta is exactly four names and two descriptions; IDs/English/semantics stay',()=>{
 let names=0,descs=0;
 for(const path of new Set(review.entries.map(e=>e.path))){
  const before=JSON.parse(patches.files.find(f=>f.path===path).beforeSource),after=JSON.parse(readFileSync(join(root,path)));
  after.entries.forEach((row,i)=>{const old=before.entries[i],target=review.entries.find(x=>x.id===row.id);if(target){assert.equal(row.zh,target.after);row.zh=target.before;names++;}if(old.desc!==row.desc){assert.equal(row.desc,old.desc.replaceAll('項鏈','項鍊').replaceAll('腰鏈','腰鍊'));row.desc=old.desc;descs++;}});
  assert.deepEqual(after,before);
 }
 assert.equal(names,4);assert.equal(descs,2);
});
test('C4 legacy jewelry scalar/array restore and explicit choice priority stay intact',()=>{
 const rows=review.entries.filter(e=>e.control==='neckAccessory');
 for(const row of rows){
  assert.equal(normalizeLocks({jewelryId:row.id},controls).neckAccessoryId,row.id);
  assert.equal(normalizeLocks({jewelryIds:[row.id]},controls).neckAccessoryId,row.id);
  const other=rows.find(x=>x.id!==row.id);assert.equal(normalizeLocks({jewelryIds:[row.id],neckAccessoryId:other.id},controls).neckAccessoryId,other.id);
 }
 assert.equal(normalizeLocks({jewelryIds:rows.map(x=>x.id)},controls).neckAccessoryId,rows[0].id);
 const necklace=controls.find(c=>c.key==='neckAccessoryId').options.find(o=>o.zh==='街頭風格金項鍊');
 for(const text of [necklace.en,'street-style gold chain detail, subtle urban neck accent'])assert.equal(parseLocksFromStandardPrompt(text,controls).locks.neckAccessoryId,necklace.id);
 for(const role of ['','A','B'])assert.equal(normalizeLocks({['neckAccessory'+role+'Id']:'wardrobe:頸部-neck-accessories:街頭風格金項鏈:20'},controls)['neckAccessory'+role+'Id'],necklace.id);
});
test('C4 image manifest only changes display name; original preview files are retained',()=>{
 const path='knowledge_base/wardrobe_reference_manifest.json',before=JSON.parse(patches.files.find(f=>f.path===path).beforeSource),after=JSON.parse(readFileSync(join(root,path)));
 let n=0;for(const category of Object.values(after.categories))for(const item of category.items)if(item.name==='垂墜背心腰鍊短裙'){item.name='垂墜背心腰鏈短裙';n++;}
 assert.equal(n,1);assert.deepEqual(after,before);
});
test('C4 exact inverse rejects live and unknown copies; fixed Git before bytes are preserved',()=>{
 assert.throws(()=>preparePreC4JewelryFiles(root));const dir=mkdtempSync(join(tmpdir(),'c4c-negative-'));
 try{for(const f of patches.files){const bytes=readFileSync(join(root,f.path));assert.equal(preC4JewelrySource(f.path,bytes).toString(),f.beforeSource);mkdirSync(dirname(join(dir,f.path)),{recursive:true});writeFileSync(join(dir,f.path),bytes);}const f=patches.files[0];writeFileSync(join(dir,f.path),'unknown');assert.throws(()=>preparePreC4JewelryFiles(dir),/rejects/);}finally{rmSync(dir,{recursive:true,force:true});}
});
test('C4 216 six-output cases and 1098 historical restore cases equal pre-change baseline',()=>{
 execFileSync(process.execPath,[join(root,'scripts/c4_jewelry_labels_acceptance.mjs')],{stdio:'pipe'});
});

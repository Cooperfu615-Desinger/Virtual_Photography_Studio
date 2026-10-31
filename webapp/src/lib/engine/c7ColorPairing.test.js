import assert from 'node:assert/strict';
import test from 'node:test';
import * as engine from '../engine.js';
import {fixtures,runCase,referenceAllows} from '../../../../scripts/lib/c7ColorFixtures.mjs';
const matrix=fixtures(engine),opts=k=>matrix.controls.find(c=>c.key===k).options;
test('C7 color pairing: ordinary random rendering respects a manual monochrome style',()=>{
 const seen=new Set();for(let i=0;i<80;i++){
  const {prompt}=runCase(engine,{name:'mono',input:{...matrix.base,styleId:matrix.monoStyle,filmId:''},seed:'c7-color-mono:'+i});
  const s=opts('styleId').find(x=>x.id===prompt.selection.styleId),f=opts('filmId').find(x=>x.id===prompt.selection.filmId);
  assert.ok(referenceAllows(s,f),f.zh);seen.add(f.zh);
 }assert.equal(seen.size,2);
});

test('C7 color pairing: reverse/manual/none priorities and exact source review',async()=>{
 const {reviewedImagingColorMode,imagingColorsCompatible}=await import('./imagingColorCompatibility.js');
 assert.equal(matrix.review.style.filter(x=>x.mode==='mono').length,2);
 assert.equal(matrix.review.style.filter(x=>x.mode==='color').length,13);
 assert.equal(matrix.review.style.filter(x=>x.mode==='open').length,11);
 assert.equal(matrix.review.film.filter(x=>x.mode==='mono').length,2);
 assert.equal(matrix.review.film.filter(x=>x.mode==='color').length,23);
 const s=opts('styleId').find(x=>x.id===matrix.monoStyle),f=opts('filmId').find(x=>x.id===matrix.monoFilm);
 assert.equal(reviewedImagingColorMode('style',{...s,en:s.en+' edited'}),'open');
 assert.equal(reviewedImagingColorMode('film',{...f,id:'unknown'}),'open');
 assert.equal(reviewedImagingColorMode('style',opts('styleId').find(x=>x.zh.includes('莎莉'))),'open');
 for(const filmId of [matrix.monoFilm,matrix.colorFilm])for(let i=0;i<50;i++){
  const {prompt}=runCase(engine,{name:'reverse',input:{...matrix.base,styleId:'',filmId},seed:'reverse:'+i});
  assert.equal(prompt.selection.filmId,filmId);assert.ok(imagingColorsCompatible(opts('styleId').find(x=>x.id===prompt.selection.styleId),opts('filmId').find(x=>x.id===filmId)));
 }
 for(const styleId of [matrix.monoStyle,matrix.colorStyle,opts('styleId')[0].id])for(const filmId of [matrix.monoFilm,matrix.colorFilm,opts('filmId')[0].id]){
  const {prompt}=runCase(engine,{name:'manual',input:{...matrix.base,styleId,filmId},seed:'manual'});
  assert.equal(prompt.selection.styleId,styleId);assert.equal(prompt.selection.filmId,filmId);
 }
});

test('C7 color sampler preserves original group/index draws including preview-excluded VHS and empty pools',async()=>{
 const {pickColorCompatibleFilm,pickColorCompatibleStyle}=await import('./imagingColorCompatibility.js');
 const mono=opts('styleId').find(x=>x.id===matrix.monoStyle),color=opts('styleId').find(x=>x.id===matrix.colorStyle),pool=opts('filmId').filter(x=>x.zh!=='全無');
 for(const first of [0,0.87999,0.88,0.999]){
  let calls=0;const chosen=pickColorCompatibleFilm(pool,mono,()=>[first,0.7][calls++]);
  assert.equal(calls,2);assert.ok(referenceAllows(mono,chosen));
  calls=0;const other=pickColorCompatibleFilm(pool,color,()=>[first,0.7][calls++]);
  assert.equal(calls,2);assert.ok(referenceAllows(color,other));if(first>=0.88)assert.match(other.zh,/VHS/);
 }
 let calls=0;pickColorCompatibleFilm(pool.filter(x=>!x.meta.tags.includes('low_frequency_film')),mono,()=>{calls++;return .5;});assert.equal(calls,1);
 calls=0;assert.equal(pickColorCompatibleFilm([],mono,()=>{calls++;return .5;}),null);assert.equal(calls,0);
 calls=0;assert.equal(pickColorCompatibleStyle([mono],opts('filmId').find(x=>x.id===matrix.colorFilm),()=>{calls++;return .5;}),null);assert.equal(calls,1);
});

test('C7 color pairing keeps default caches isolated from custom data and ignores unknown explicit IDs',()=>{
 for(let i=0;i<8;i++){
  const row={name:'cache',input:{...matrix.base,styleId:matrix.monoStyle,filmId:''},seed:'cache:'+i};
  const before=runCase(engine,row);runCase(engine,row,matrix.db);assert.deepEqual(runCase(engine,row),before);
  for(const patch of [{styleId:'unknown-style'},{filmId:'unknown-film'}]){
   const unknown={...row,input:{...row.input,...patch}};
   assert.deepEqual(runCase(engine,unknown),runCase(engine,unknown,matrix.db));
  }
 }
});

test('C7 color preserves existing scene policy for Elsa while manual Elsa uses the shared color pairing',()=>{
 const elsa=opts('styleId').find(x=>x.zh.includes('艾爾莎'));
 for(let i=0;i<60;i++){
  const input={...matrix.base,styleId:elsa.id,filmId:''};
  const {prompt}=runCase(engine,{name:'Elsa',input,seed:'Elsa:'+i});
  assert.equal(prompt.selection.styleId,elsa.id);assert.ok(referenceAllows(elsa,opts('filmId').find(x=>x.id===prompt.selection.filmId)));
 }
 for(const loc of opts('locationId').filter(x=>x.zh!=='全無')){
  const row={name:'scene-Elsa',input:{...matrix.base,locationId:loc.id,styleId:'',filmId:''},seed:'Elsa-scene:'+loc.id};
  assert.notEqual(runCase(engine,row).prompt.selection.styleId,elsa.id);
 }
});

test('C7 color inverse reproduces trusted Git, rejects unknown/linked/checkout sources and is atomic',async()=>{
 const {readFileSync,writeFileSync,mkdtempSync,mkdirSync,rmSync,symlinkSync}=await import('node:fs');
 const {join,dirname}=await import('node:path');const {tmpdir}=await import('node:os');
 const {fileURLToPath}=await import('node:url');const {execFileSync}=await import('node:child_process');
 const {createHash}=await import('node:crypto');
 const {preparePreC7ColorPairingFiles}=await import('../../../../scripts/lib/c7ColorPairingReplay.mjs');
 const patch=(await import('../../../../scripts/lib/c7ColorPairingPatches.json',{with:{type:'json'}})).default;
 const root=fileURLToPath(new URL('../../../../',import.meta.url)),dir=mkdtempSync(join(tmpdir(),'c7-color-inverse-'));
 assert.throws(()=>preparePreC7ColorPairingFiles(root),/isolated/);
 try{
  for(const item of patch.files){
   assert.equal(execFileSync('git',['-C',root,'show',patch.base+':'+item.path],{encoding:'utf8',maxBuffer:16*1024*1024}),item.beforeSource);
   const content=readFileSync(join(root,item.path));assert.equal(createHash('sha256').update(content).digest('hex'),item.afterHash);
   mkdirSync(dirname(join(dir,item.path)),{recursive:true});writeFileSync(join(dir,item.path),content);
  }
  const [a,b]=patch.files,path=join(dir,a.path),original=readFileSync(path),untouched=readFileSync(join(dir,b.path));
  writeFileSync(path,'unknown');assert.throws(()=>preparePreC7ColorPairingFiles(dir),/unknown or mixed/);assert.deepEqual(readFileSync(join(dir,b.path)),untouched);
  rmSync(path);symlinkSync(join(root,a.path),path);assert.throws(()=>preparePreC7ColorPairingFiles(dir),/linked/);rmSync(path);writeFileSync(path,original);
  preparePreC7ColorPairingFiles(dir).apply();for(const item of patch.files)assert.equal(readFileSync(join(dir,item.path),'utf8'),item.beforeSource);
  preparePreC7ColorPairingFiles(dir).apply();mkdirSync(join(dir,'.git'));assert.throws(()=>preparePreC7ColorPairingFiles(dir),/Git checkout/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

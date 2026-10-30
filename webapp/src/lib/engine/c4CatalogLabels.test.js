import {preC2WaistHistoricalTest} from '../../../../scripts/lib/c2WaistHistoricalTest.mjs';
const c2HistoricalTest=preC2WaistHistoricalTest(import.meta.url);
import {preC4JewelrySource} from '../../../../scripts/lib/c4JewelryLabelsReplay.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync,mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
import process from 'node:process';
import {getLockControls,normalizeLocks} from '../engine.js';
import review from '../../../../scripts/lib/c4CatalogLabelsReview.json' with {type:'json'};
import {C4_CATALOG_PATCHES,preC4CatalogSource,preparePreC4CatalogFiles,C4_CATALOG_ROOT} from '../../../../scripts/lib/c4CatalogLabelsReplay.mjs';
const controls=getLockControls();
test('C4 seven Chinese names change without English, IDs, metadata, order or old keys changing',()=>{
 for(const path of new Set(review.entries.map(e=>e.path))){
  const before=JSON.parse(C4_CATALOG_PATCHES.files.find(f=>f.path===path).beforeSource);
  const after=JSON.parse(preC4JewelrySource(path,readFileSync(join(C4_CATALOG_ROOT,path))));
  for(const row of review.entries.filter(e=>e.path===path)){
   const e=after.entries.find(e=>e.id===row.id);assert.equal(e.zh,row.after);e.zh=row.before;
  }
  assert.deepEqual(after,before);
 }
 const path='knowledge_base/catalog/legacy_mappings.json';
 const before=JSON.parse(C4_CATALOG_PATCHES.files.find(f=>f.path===path).beforeSource),after=JSON.parse(preC4JewelrySource(path,readFileSync(join(C4_CATALOG_ROOT,path))));
 let count=0;for(const table of Object.values(after.tables))for(const row of (Array.isArray(table.source)?table.source:[])){const target=review.entries.find(e=>e.after===row.targetZh);if(target){row.targetZh=target.before;count++;}}
 assert.equal(count,6);assert.deepEqual(after,before);
});
test('C4 old hairstyle IDs retain wet migration and explicit A/B styling choices',()=>{
 const state=controls.find(c=>c.key==='hairStylingStateId').options.find(o=>o.zh==='強烈風感').id;
 const wet=controls.find(c=>c.key==='hairStylingStateId').options.find(o=>o.zh==='濕髮分束').id;
 for(const row of review.entries.filter(e=>e.path.includes('/Character/')))for(const role of ['', 'A','B']){
  const hair=`hairstyle${role}Id`,styling=`hairStylingState${role}Id`;
  assert.equal(normalizeLocks({[hair]:row.id},controls)[hair],row.id);
  assert.equal(normalizeLocks({[hair]:row.id},controls)[styling],wet);
  assert.equal(normalizeLocks({[hair]:row.id,[styling]:state},controls)[styling],state);
 }
});
test('C4 exact inverse preserves fixed Git bytes and rejects live/unknown copies before writing',()=>{
 assert.throws(()=>preparePreC4CatalogFiles(C4_CATALOG_ROOT));
 const dir=mkdtempSync(join(tmpdir(),'c4-inverse-negative-'));
 try{
  for(const f of C4_CATALOG_PATCHES.files){const bytes=readFileSync(join(C4_CATALOG_ROOT,f.path));assert.equal(preC4CatalogSource(f.path,bytes).toString(),f.beforeSource);mkdirSync(dirname(join(dir,f.path)),{recursive:true});writeFileSync(join(dir,f.path),bytes);}
  const f=C4_CATALOG_PATCHES.files[0],path=join(dir,f.path);writeFileSync(path,'unknown');
  assert.throws(()=>preparePreC4CatalogFiles(dir),/unknown/);assert.equal(readFileSync(path,'utf8'),'unknown');
 }finally{rmSync(dir,{recursive:true,force:true});}
});
c2HistoricalTest('C4 558 current cases and 1098 old restore paths match approved fixed baseline',()=>{
 execFileSync(process.execPath,[join(C4_CATALOG_ROOT,'scripts/c4_catalog_labels_acceptance.mjs')],{stdio:'pipe'});
});

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import * as engine from '../webapp/src/lib/engine.js';
import * as codec from '../webapp/src/features/saved-cards/cardCodec.js';
import { RECOVERED_WARDROBE_COLOR_KEY } from '../webapp/src/features/saved-cards/wardrobeColorRecovery.js';
import { stablePrompt, outputStates } from './lib/catalogBaseline.mjs';
const base='471115c08e4415643b8acbb87b7c2709f98e117c',root=resolve('.'),out=resolve(process.argv[2]||'/tmp/a2-recovery-acceptance');mkdirSync(out,{recursive:true});
const previous=mkdtempSync(join(tmpdir(),'vps-a2-recovery-base-'));
const write=(name,data)=>writeFileSync(join(out,name),name.endsWith('.gz')?gzipSync(JSON.stringify(data)):JSON.stringify(data,null,2)+'\n');
try{
 execFileSync('tar',['-x','-C',previous],{input:execFileSync('git',['archive',base,'webapp/src','webapp/package.json'],{maxBuffer:64*1024*1024})});
 symlinkSync(join(root,'webapp/node_modules'),join(previous,'webapp/node_modules'),'dir');
 const old=await import(pathToFileURL(join(previous,'webapp/src/lib/engine.js'))),oldCodec=await import(pathToFileURL(join(previous,'webapp/src/features/saved-cards/cardCodec.js')));
 const controls=engine.getLockControls(),options=k=>controls.find(c=>c.key===k).options,option=(k,zh)=>options(k).find(o=>o.zh.includes(zh));
 const empty=()=>{const l=engine.createEmptyLocks();for(const c of controls){const n=c.options.find(o=>o.zh==='全無'||o.id==='none');if(n)l[c.key]=n.id;}return {...l,subjectCount:'1',framingId:option('framingId','全身鏡頭').id};};
 const cases=[];
 for(const key of ['outfitPresetId','dressId','specialOutfitId'])for(const item of options(key).filter(o=>o.id!=='random'&&o.zh!=='全無'))cases.push({name:key+':'+item.id,locks:{...empty(),[key]:item.id}});
 for(const row of JSON.parse(readFileSync('scripts/lib/a2OutfitControlReview.json')).rows)for(const primary of ['red','mirror-chrome-silver','glossy-black-latex'])cases.push({name:row.id+':'+primary,locks:{...empty(),outfitPresetId:row.id,outfitPresetPrimaryColorId:primary,outfitPresetContrastColorId:'white'}});
 for(const palette of options('completeLookPaletteId').filter(o=>o.id!=='none'))cases.push({name:'palette:'+palette.id,locks:{...empty(),outfitPresetId:option('outfitPresetId','粉紅哥德').id,completeLookPaletteId:palette.id}});
 for(const framing of options('framingId').filter(o=>o.id!=='random'&&o.zh!=='全無'))cases.push({name:'duo:'+framing.id,locks:{...empty(),subjectCount:'2',framingId:framing.id,outfitPresetAId:option('outfitPresetAId','粉紅哥德').id,outfitPresetBId:option('outfitPresetBId','鏈條緞面').id,outfitPresetAPrimaryColorId:'red',outfitPresetAContrastColorId:'white',outfitPresetBPrimaryColorId:'light-blue',outfitPresetBContrastColorId:'black'}});
 for(const [name,wardrobe] of [
  ['duo-outerwear',{outerwearAId:option('outerwearAId','西裝外套').id,outerwearBId:option('outerwearBId','連帽外套').id,outerwearAColorId:'red',outerwearBColorId:'white'}],
  ['duo-separate-pieces',{topAId:option('topAId','棉質細肩背心').id,topBId:option('topBId','領帶襯衫').id,topAColorId:'red',topBColorId:'white',pantsAId:option('pantsAId','牛仔').id,pantsBId:option('pantsBId','牛仔').id,bottomAColorId:'light-blue',bottomBColorId:'black'}],
 ])cases.push({name,locks:{...empty(),subjectCount:'2',...wardrobe}});
 const archived=JSON.parse(gunzipSync(readFileSync('Docs/reports/wardrobe-control-a2-outfits-2026-10-27/acceptance/baseline-and-saved.json.gz')));
 const importCases=[],generation=[];
 const run=(e,locks,seed)=>{let calls=0;const random=e.createSeededRandom(seed);const p=e.generatePrompts(1,structuredClone(locks),[],{random:()=>{calls++;return random();}})[0];return {p,calls};};
 const allowedRoleItem=/^(?:specialOutfit|outfitPreset|top|dress|pants|skirt|outerwear|legwear|shoes|headphones|faceCovering|headAccessory|eyewear)[AB]Id$/;
 function compareImport(name,md){
  const before=oldCodec.parseExportedMarkdownPrompt(md,old.getLockControls(),'same'),after=codec.parseExportedMarkdownPrompt(md,controls,'same');
  assert.deepEqual(outputStates(after),outputStates(before),name+': historical public text');
  const changed=[];
  for(const key of new Set([...Object.keys(before.selection),...Object.keys(after.selection)]))if(JSON.stringify(before.selection[key])!==JSON.stringify(after.selection[key])){
   assert.ok(RECOVERED_WARDROBE_COLOR_KEY.test(key)||allowedRoleItem.test(key),name+': unexpected selection '+key);
   changed.push({key,before:before.selection[key],after:after.selection[key]});
  }
  importCases.push({name,changes:changed});
  return after;
 }
 for(const s of archived.saved){
  const p=compareImport('archived:'+s.id,s.markdown);assert.equal(p.selection.outfitPresetId,s.id);
  assert.equal(p.selection.outfitPresetPrimaryColorId,'none');assert.equal(p.selection.outfitPresetContrastColorId,'none');
  assert.deepEqual(stablePrompt(codec.deserializeFavoritePrompt(s.raw,controls)),stablePrompt(oldCodec.deserializeFavoritePrompt(s.raw,old.getLockControls())));
  for(const captureLocks of [s.oldCaptureLocks,s.newCaptureLocks]){
   const a=run(engine,captureLocks,'capture:'+s.id),b=run(old,captureLocks,'capture:'+s.id);assert.deepEqual(stablePrompt(a.p),stablePrompt(b.p));assert.equal(a.calls,b.calls);
   const md=oldCodec.buildMarkdownExport(b.p),restored=codec.parseExportedMarkdownPrompt(md,controls,'capture'),before=oldCodec.parseExportedMarkdownPrompt(md,old.getLockControls(),'capture');
   assert.deepEqual(stablePrompt(restored),stablePrompt(before),'capture metadata remains authoritative');
  }
 }
 for(const c of cases){
  const a=run(engine,c.locks,c.name),b=run(old,c.locks,c.name);assert.deepEqual(stablePrompt(a.p),stablePrompt(b.p),c.name);assert.equal(a.calls,b.calls,c.name);
  generation.push({name:c.name,randomDraws:a.calls,outputs:outputStates(a.p),selection:a.p.selection});
  compareImport(c.name,oldCodec.buildMarkdownExport(b.p));
 }
 write('baseline-and-results.json.gz',{baseCommit:base,generation,importCases});
 const result={baseCommit:base,generationCases:cases.length,archivedMarkdownCases:40,archivedJsonCases:40,captureCases:80,importCases:importCases.length,unapprovedDifferences:0};write('acceptance.json',result);console.log(JSON.stringify(result));
}finally{rmSync(previous,{recursive:true,force:true});}

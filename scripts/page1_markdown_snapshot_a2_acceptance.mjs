import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runInNewContext } from 'node:vm';
import * as engine from '../webapp/src/lib/engine.js';
import * as codec from '../webapp/src/features/saved-cards/cardCodec.js';
import { encodePage1MarkdownSnapshot } from '../webapp/src/features/saved-cards/page1MarkdownSnapshot.js';
import { normalizeZImageDisplayLabel } from '../webapp/src/features/saved-cards/promptLabels.js';
import { stablePrompt, outputStates } from './lib/catalogBaseline.mjs';
const base='943ab65fa153fbc5050ee2c9690e429c326296f2',root=resolve('.'),out=resolve(process.argv[2]||'/tmp/a2-markdown-acceptance');
assert.ok(!out.includes('catalog-architecture-') && !out.includes('wardrobe-control-') && !out.includes('wardrobe-color-recovery-'), 'Do not overwrite historical reports');
mkdirSync(out,{recursive:true});
const previous=mkdtempSync(join(tmpdir(),'vps-a2-markdown-base-'));
const write=(name,data)=>writeFileSync(join(out,name),name.endsWith('.gz')?gzipSync(JSON.stringify(data)):JSON.stringify(data,null,2)+'\n');
const makeSingle=source=>runInNewContext(source.slice(source.indexOf('function buildMarkdownExport'),source.indexOf('const SUMMARY_FIELD_LABELS'))+'\nbuildMarkdownExport', {encodePage1MarkdownSnapshot,normalizeZImageDisplayLabel});
try{
 execFileSync('tar',['-x','-C',previous],{input:execFileSync('git',['archive',base,'webapp/src','webapp/package.json'],{maxBuffer:64*1024*1024})});
 symlinkSync(join(root,'webapp/node_modules'),join(previous,'webapp/node_modules'),'dir');
 const old=await import(pathToFileURL(join(previous,'webapp/src/lib/engine.js'))),oldCodec=await import(pathToFileURL(join(previous,'webapp/src/features/saved-cards/cardCodec.js')));
 const single=makeSingle(readFileSync('webapp/src/components/PromptCard.jsx','utf8')),oldSingle=makeSingle(readFileSync(join(previous,'webapp/src/components/PromptCard.jsx'),'utf8'));
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

 for(const palette of options('topBottomPaletteId').filter(o=>!['none','random'].includes(o.id))) for(const crop of ['全身鏡頭','特寫鏡頭']) cases.push({name:'topBottom:'+palette.id+':'+crop,locks:{...empty(),topId:option('topId','棉質細肩背心').id,pantsId:option('pantsId','牛仔').id,topBottomPaletteId:palette.id,framingId:option('framingId',crop).id}});
 for(const key of ['characterProfileId','fixedCompositionSetId'])for(const item of options(key).filter(o=>!['none','random'].includes(o.id)&&o.zh!=='全無'))cases.push({name:key+':'+item.id,locks:{...empty(),[key]:item.id}});
 cases.push({name:'world-scene-text',locks:{...empty(),importedWorldSceneMode:'architecture',importedWorldSceneLabel:'街景',importedWorldSceneArchitectureText:'brick walls with pale window frames'}});
 const archived=JSON.parse(gunzipSync(readFileSync('Docs/reports/wardrobe-control-a2-outfits-2026-10-27/acceptance/baseline-and-saved.json.gz')));
 for(const s of archived.saved)for(const [i,locks]of [s.oldCaptureLocks,s.newCaptureLocks].entries())cases.push({name:'capture:'+i+':'+s.id,locks});
 const run=(e,locks,seed)=>{let calls=0;const random=e.createSeededRandom(seed);const p=e.generatePrompts(1,structuredClone(locks),[],{random:()=>{calls++;return random();}})[0];return {p,calls};};
 const generation=[],legacy=[],snapshots=[];
 const importState=p=>({selection:p.selection,structured:p.structured,outputs:outputStates(p),extras:p.extraPrompts,summary:p.summary,notices:p.accessoryRestoreNotices});
 function oldImport(name,md){
  let before;try{before=oldCodec.parseExportedMarkdownPrompt(md,old.getLockControls(),'same');}catch(error){assert.throws(()=>codec.parseExportedMarkdownPrompt(md,controls,'same'));legacy.push({name,error:error.message});return;}
  const after=codec.parseExportedMarkdownPrompt(md,controls,'same');assert.deepEqual(importState(after),importState(before),name+': legacy');legacy.push({name,selection:before.selection,outputs:outputStates(before)});
 }
 for(const s of archived.saved){
  oldImport('archived:'+s.id,s.markdown);
  const p=codec.parseExportedMarkdownPrompt(s.markdown,controls,'same');assert.equal(p.selection.outfitPresetPrimaryColorId,'none');assert.equal(p.selection.outfitPresetContrastColorId,'none');
  assert.deepEqual(stablePrompt(codec.deserializeFavoritePrompt(s.raw)),stablePrompt(oldCodec.deserializeFavoritePrompt(s.raw)));
 }
 for(const c of cases){
  const a=run(engine,c.locks,c.name),b=run(old,c.locks,c.name);assert.deepEqual(stablePrompt(a.p),stablePrompt(b.p),c.name);assert.equal(a.calls,b.calls,c.name);
  // Dates are not compared across generation; reuse the same card for byte comparisons.
  const p=b.p,json=codec.deserializeFavoritePrompt(codec.serializeFavoritePrompt(p));
  const newSingle=single(p),newArchive=codec.buildMarkdownExport(p);
  assert.equal(newSingle.split('\n')[0],newArchive.split('\n')[0]);
  assert.equal(newSingle.slice(newSingle.indexOf('\n')+1),oldSingle(p));
  assert.equal(newArchive.slice(newArchive.indexOf('\n')+1),oldCodec.buildMarkdownExport(p));
  for(const [kind,md] of [['single',newSingle],['zip',newArchive]]){
   const restored=codec.parseExportedMarkdownPrompt(md,controls,'same');assert.deepEqual(restored.selection,codec.sanitizeStoredPrompt(p).selection,c.name+':'+kind);
   assert.deepEqual(engine.normalizeLocks(codec.buildRestoreLocks(restored.selection,controls)),engine.normalizeLocks(codec.buildRestoreLocks(json.selection,controls)),c.name+': JSON apply parity');
   assert.deepEqual(outputStates(restored),outputStates(p));assert.deepEqual(restored.extraPrompts,p.extraPrompts||[]);
  }
  oldImport(c.name,oldCodec.buildMarkdownExport(p));
  assert.deepEqual(codec.parseLocksFromStandardPrompt(p.grokPrompt,controls),oldCodec.parseLocksFromStandardPrompt(p.grokPrompt,old.getLockControls()),c.name+': paste');
  generation.push({name:c.name,locks:c.locks,randomDraws:b.calls,prompt:stablePrompt(b.p)});
  snapshots.push({name:c.name,selection:codec.sanitizeStoredPrompt(p).selection,extraIds:p.extraPrompts?.map(e=>e.id)||[]});
 }
 write('baseline-and-results.json.gz',{baseCommit:base,generation,legacy,snapshots});
 const result={baseCommit:base,generationCases:cases.length,snapshotRoundTrips:cases.length*2,legacyMarkdownCases:legacy.length,legacyJsonCases:40,legacyPasteCases:cases.length,readableExportBodiesUnchanged:cases.length*2,unapprovedDifferences:0};write('acceptance.json',result);console.log(JSON.stringify(result));
}finally{rmSync(previous,{recursive:true,force:true});}

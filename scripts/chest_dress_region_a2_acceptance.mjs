// Fixed Git comparison: only the derived chest Wardrobe can change. No candidate-derived oracle.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync,symlinkSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath,pathToFileURL} from 'node:url';
import * as engine from '../webapp/src/lib/engine.js';
import * as codec from '../webapp/src/features/saved-cards/cardCodec.js';
import {parseSavedCardsArchive} from '../webapp/src/features/saved-cards/savedCardArchive.js';
import {buildAllNoneLocks} from '../webapp/src/features/page1/page1Selectors.js';
import {resolveCapture,rerollCapture} from '../webapp/src/lib/observationCaptureMode.js';
import {FIXED_FRAMING_DERIVED_PROMPT_FIXTURES} from '../webapp/src/lib/engine/fixedFramingDerivedPromptFixtures.js';
import {stablePrompt,pack,sha256,differences} from './lib/catalogBaseline.mjs';
import JSZip from '../webapp/node_modules/jszip/lib/index.js';
const root=fileURLToPath(new URL('../',import.meta.url)),base='9a0c4f2df7790d2728701e384b9dfc635d428a73';
const out=resolve(process.argv[2]||'/tmp/a2-chest-dress-acceptance'),own=resolve(root,'Docs/reports/chest-dress-region-a2-2026-10-28');
assert.ok(!out.startsWith(resolve(root)+'/')||out===own||out.startsWith(own+'/'),'Protect other reports');mkdirSync(out,{recursive:true});
const dir=mkdtempSync(join(tmpdir(),'vps-chest-dress-oracle-')),cases=[],saved=[],mismatches=[],counts={matrix:0,boundaries:0,captures:0,stored:0,changed:0,generations:0};
const git=(...args)=>execFileSync('git',['-C',root,...args],{maxBuffer:128*1024*1024});
function same(label,a,b){const diff=differences(a,b);if(diff.length)mismatches.push({label,diff});assert.deepEqual(diff,[],label);}
function run(e,locks,seed){let calls=0;const random=e.createSeededRandom(seed),p=e.generatePrompts(1,structuredClone(locks),[],{random:()=>{calls++;return random();}})[0];counts.generations++;return {p,calls};}
const chest=p=>p.extraPrompts.find(x=>x.id==='chest-up-portrait')?.text||'';
const wardrobe=p=>chest(p).split('Wardrobe:\n')[1]?.split('\n\n')[0]||'';
try{
 execFileSync('tar',['-x','-C',dir],{input:git('archive',base,'webapp/src','webapp/package.json')});symlinkSync(join(root,'webapp/node_modules'),join(dir,'webapp/node_modules'),'dir');
 const old=await import(pathToFileURL(join(dir,'webapp/src/lib/engine.js')).href);
 const oldCodec=await import(pathToFileURL(join(dir,'webapp/src/features/saved-cards/cardCodec.js')).href);
 const {getFullBodyImportSource}=await import(pathToFileURL(join(dir,'webapp/src/lib/observationCaptureImport.js')).href);
 const controls=engine.getLockControls(),options=k=>controls.find(c=>c.key===k).options,active=k=>options(k).filter(o=>o.id&&!['none','random'].includes(o.id)&&o.zh!=='全無');
 const dresses=active('dressId'),palettes=active('topBottomPaletteId');assert.equal(dresses.length,24);assert.equal(palettes.length,42);
 same('controls',old.getLockControls(),controls);same('catalog',old.getKnowledgeBaseSnapshot(),engine.getKnowledgeBaseSnapshot());
 const empty=()=>({...buildAllNoneLocks(controls,engine.createEmptyLocks()),subjectCount:'1',framingId:options('framingId').find(o=>o.zh.includes('全身鏡頭')).id});
 const dressLocks=(d=dresses[0],p=palettes[0])=>({...empty(),dressId:d.id,topBottomPaletteId:p.id});
 function compare(label,locks,{expectChange=false,oracle=true,save=false}={}){
  const a=run(old,locks,label),b=run(engine,locks,label);same(label+':RNG',a.calls,b.calls);
  const protectedActual=stablePrompt(b.p),original=stablePrompt(a.p);
  const x=protectedActual.extraPrompts.find(e=>e.id==='chest-up-portrait'),y=original.extraPrompts.find(e=>e.id==='chest-up-portrait');
  if(x&&y)x.text=y.text;same(label+':five outputs and complete resolved state',original,protectedActual);
  const changed=chest(a.p)!==chest(b.p);if(expectChange)assert.ok(changed,label);if(changed){
   counts.changed++;const pair=palettes.find(p=>p.id===b.p.selection.topBottomPaletteId)||locks.observationCapture?.importedPerson?.wardrobeColors.topBottomPalette;assert.ok(pair,label);
   const phrase=`upper/main dress area in ${pair.topColor.en}`;
   assert.equal(wardrobe(b.p).split(phrase).length-1,1,label);assert.doesNotMatch(wardrobe(b.p),/lower hem or skirt area|dress palette from top to bottom/);
   same(label+':non-wardrobe chest sections',chest(a.p).replace(wardrobe(a.p),'<wardrobe>'),chest(b.p).replace(wardrobe(b.p),'<wardrobe>'));
   if(oracle){
    // Independent oracle: the unchanged Git engine supplies the complete colorless visible dress.
    // Remove only the explicitly approved region suffix from the candidate; every other byte must equal it.
    const uncolored=run(old,{...locks,topBottomPaletteId:'none',dressColorId:'none'},label).p;
    same(label+':authored visible details',wardrobe(uncolored),wardrobe(b.p).replace(', '+phrase,''));
   }
  }else same(label+':unchanged',original,stablePrompt(b.p));
  cases.push({label,locks,before:{prompt:original,calls:a.calls},afterHash:sha256(JSON.stringify(stablePrompt(b.p))),changed});
  if(save)saved.push({kind:label,locks,old:{...a.p,id:'chest-old-'+saved.length,date:'2026-10-28T00:00:00.000Z'},current:b.p,raw:codec.serializeFavoritePrompt(a.p)});
  return {a:a.p,b:b.p,changed};
 }
 for(const d of dresses)for(const p of palettes){compare('pair:'+d.id+':'+p.id,dressLocks(d,p),{expectChange:true,save:d===dresses[0]&&p===palettes[0]});counts.matrix++;}
 for(const f of active('framingId')){compare('crop:'+f.id,{...dressLocks(),framingId:f.id},{expectChange:true});counts.boundaries++;}
 for(const coat of active('outerwearId'))for(const opening of active('outerwearOpeningId')){
  compare('coat:'+coat.id+':'+opening.id,{...dressLocks(),outerwearId:coat.id,outerwearOpeningId:opening.id},{save:coat.en?.includes('blazer')&&opening.id.includes('fully-closed')});counts.boundaries++;
 }
 for(const palette of active('completeLookPaletteId')){compare('complete-look:'+palette.id,{...dressLocks(),completeLookPaletteId:palette.id},{expectChange:true});counts.boundaries++;}
 for(const p of palettes){const r=compare('duo:'+p.id,{...empty(),subjectCount:'2',dressAId:dresses[0].id,dressBId:dresses[1].id,topBottomPaletteAId:p.id,topBottomPaletteBId:palettes[1].id});assert.equal(r.changed,false);counts.boundaries++;}
 for(const key of ['dressColorId','specialOutfitId','outfitPresetId'])for(const o of active(key)){const r=compare(key+':'+o.id,{...empty(),[key]:o.id,...(key==='dressColorId'?{dressId:dresses[0].id}:{} )});assert.equal(r.changed,false);counts.boundaries++;}
 for(const f of FIXED_FRAMING_DERIVED_PROMPT_FIXTURES){const locks={...dressLocks()};for(const[k,v]of Object.entries(f.locks))locks[k]=v?.byZh?options(k).find(o=>o.zh===v.byZh).id:v;compare('fixture:'+f.id,locks);counts.boundaries++;}
 for(const set of active('fixedCompositionSetId')){compare('fixed:'+set.id,{...dressLocks(),fixedCompositionSetId:set.id});counts.boundaries++;}
 for(const dress of dresses){
  const locks=dressLocks(dress),source=run(old,locks,'capture-source:'+dress.id).p,person=getFullBodyImportSource(source);assert.ok(person);
  const capture={...locks,captureMode:'observation',observationCapture:{...resolveCapture({seed:31}).profile,personSource:'full-body',importedPerson:person,availablePerson:person}},frozen=JSON.stringify(person);
  for(let i=0;i<2;i++){const r=compare('capture:'+dress.id+':'+i,capture,{expectChange:true,oracle:false,save:dress===dresses[0]&&i===0});assert.equal(r.b.extraPrompts.find(x=>x.id==='full-body-character').text,person.fullBodyPrompt);assert.equal(JSON.stringify(capture.observationCapture.importedPerson),frozen);capture.observationCapture=rerollCapture(capture.observationCapture).profile;counts.captures++;}
 }
 for(const row of saved)for(const [version,p]of [['old',row.old],['current',row.current]]){
  same(row.kind+version+':JSON',stablePrompt(oldCodec.deserializeFavoritePrompt(oldCodec.serializeFavoritePrompt(p))),stablePrompt(codec.deserializeFavoritePrompt(codec.serializeFavoritePrompt(p))));
  const md=codec.buildMarkdownExport(p),parsed=codec.parseExportedMarkdownPrompt(md,controls,'snapshot'),zip=new JSZip();zip.file('prompt.md',md);const [imported]=await parseSavedCardsArchive(await zip.generateAsync({type:'nodebuffer'}),controls);
  for(const target of [parsed,imported]){for(const key of ['grokPrompt','zImagePrompt','midjourneyPrompt','nanoBananaPrompt','extraPrompts'])same(row.kind+version+':original:'+key,p[key],target[key]);assert.deepEqual(oldCodec.parseExportedMarkdownPrompt(oldCodec.buildMarkdownExport(p),controls,'reference').selection,target.selection,row.kind+version+':selection');counts.stored++;}
  counts.stored++;
 }
 const protectedFiles=git('ls-tree','-r','-z','--name-only',base,'webapp/src','knowledge_base').toString().split('\0').filter(p=>p&&!p.endsWith('.test.js')&&p!=='webapp/src/lib/engine.js');
 for(const p of protectedFiles)assert.deepEqual(readFileSync(join(root,p)),git('show',base+':'+p),p);
 writeFileSync(join(out,'baseline-and-saved.json.gz'),pack({baseCommit:base,counts,cases,saved}));
 writeFileSync(join(out,'oracle-mismatches.json'),JSON.stringify(mismatches,null,2)+'\n');writeFileSync(join(out,'acceptance.json'),JSON.stringify({baseCommit:base,counts,protectedFiles:protectedFiles.length,oracleMismatches:mismatches.length,passed:true},null,2)+'\n');console.log(JSON.stringify({counts,protectedFiles:protectedFiles.length,passed:true}));
}catch(error){writeFileSync(join(out,'failure-'+Date.now()+'.json'),JSON.stringify({message:error.message,stack:error.stack,counts,mismatches},null,2)+'\n');throw error;}finally{rmSync(dir,{recursive:true,force:true});}

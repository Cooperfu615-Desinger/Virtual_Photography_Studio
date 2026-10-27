// Fixed-Git state oracle. The renderer and catalog must remain byte-for-byte unchanged.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync,symlinkSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath,pathToFileURL} from 'node:url';
import * as current from '../webapp/src/lib/engine.js';
import * as codec from '../webapp/src/features/saved-cards/cardCodec.js';
import {transitionPage1Locks as transition} from '../webapp/src/features/page1/lockTransitions.js';
import {reconcilePage1SingleWardrobeLocks} from '../webapp/src/features/page1/page1WardrobeExclusivity.js';
import {buildAllNoneLocks} from '../webapp/src/features/page1/page1Selectors.js';
import {randomizePage1WardrobePanelLocks,setLockKeysToNone} from '../webapp/src/lib/page1SectionRandom.js';
import {getWardrobePanelKeys} from '../webapp/src/features/page1/wardrobeEditor.js';
import {getFullBodyImportSource} from '../webapp/src/lib/observationCaptureImport.js';
import {resolveCapture} from '../webapp/src/lib/observationCaptureMode.js';
import {stablePrompt,outputStates,pack,sha256,differences} from './lib/catalogBaseline.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),base='15580949ac1f00e7a2628209d91a301434504965';
const out=resolve(process.argv[2]||'/tmp/a2-special-palette-acceptance'),own=resolve(root,'Docs/reports/special-outfit-palette-a2-2026-10-27');
assert.ok(!out.startsWith(resolve(root)+'/')||out===own||out.startsWith(own+'/'),'Protect other reports');mkdirSync(out,{recursive:true});
const dir=mkdtempSync(join(tmpdir(),'vps-special-palette-base-'));
const git=(...args)=>execFileSync('git',['-C',root,...args],{maxBuffer:128*1024*1024});
const cases=[],saved=[],mismatches=[],counts={transitions:0,changedTransitions:0,generations:0,directGenerations:0,restores:0,frozenCaptures:0};
try{
 execFileSync('tar',['-x','-C',dir],{input:git('archive',base,'webapp/src','webapp/package.json')});
 symlinkSync(join(root,'webapp/node_modules'),join(dir,'webapp/node_modules'),'dir');
 const load=p=>import(pathToFileURL(join(dir,p)).href);
 const old=await load('webapp/src/lib/engine.js'),oldCodec=await load('webapp/src/features/saved-cards/cardCodec.js');
 const oldTransition=(await load('webapp/src/features/page1/lockTransitions.js')).transitionPage1Locks;
 const oldImport=await load('webapp/src/lib/observationCaptureImport.js');
 const controls=current.getLockControls();assert.deepEqual(controls,old.getLockControls());assert.deepEqual(current.getKnowledgeBaseSnapshot(),old.getKnowledgeBaseSnapshot());
 const options=k=>controls.find(c=>c.key===k).options,concrete=k=>options(k).filter(x=>x.id&&!['none','random'].includes(x.id)&&x.zh!=='全無');
 const empty=()=>({...buildAllNoneLocks(controls,current.createEmptyLocks()),subjectCount:'1',framingId:options('framingId').find(x=>x.zh.startsWith('全身鏡頭')).id});
 function checkState(name,previous,candidate,restoringSelection=false){
  const args={previousLocks:previous,candidateLocks:candidate,lockControls:controls,restoringSelection};
  const before=oldTransition(args),expected=structuredClone(before),normalized=old.normalizeLocks(candidate,controls);
  const selected=options('specialOutfitId').find(x=>x.id===before.specialOutfitId);
  if(before.subjectCount!=='2'&&selected&&selected.zh!=='全無')expected.completeLookPaletteId=normalized.completeLookPaletteId;
  const actual=transition(args),diff=differences(expected,actual);assert.deepEqual(diff,[],name);
  const changed=JSON.stringify(before)!==JSON.stringify(actual);counts.transitions++;if(changed)counts.changedTransitions++;
  cases.push({name,old:sha256(JSON.stringify(before)),expected:sha256(JSON.stringify(expected)),actual:sha256(JSON.stringify(actual)),changed});
  return {actual,expected,before};
 }
 function run(e,l,seed){let calls=0;const rng=e.createSeededRandom(seed);return {p:e.generatePrompts(1,structuredClone(l),[],{random:()=>{calls++;return rng();}})[0],calls};}
 function checkGeneration(name,expectedLocks,actualLocks,direct=false){
  const before=run(old,expectedLocks,name),after=run(current,actualLocks,name);
  const diff=differences({p:stablePrompt(before.p),calls:before.calls},{p:stablePrompt(after.p),calls:after.calls});
  if(diff.length)mismatches.push({name,diff});assert.deepEqual(diff,[],name);
  counts.generations++;if(direct)counts.directGenerations++;
  cases.push({name,outputs:sha256(JSON.stringify(outputStates(after.p))),prompt:sha256(JSON.stringify(stablePrompt(before.p))),rngCalls:after.calls});
  return {before:before.p,after:after.p};
 }
 const specials=concrete('specialOutfitId'),palettes=options('completeLookPaletteId');assert.equal(specials.length,90);assert.equal(palettes.length,10);
 for(const item of specials)for(const palette of palettes){
  const l={...empty(),specialOutfitId:item.id,completeLookPaletteId:palette.id},name=item.id+':'+palette.id;
  checkState('manual:'+name,{...l,completeLookPaletteId:'none'},l);
  checkState('update:'+name,l,{...l,hairColorId:'red'});
  checkState('switch:'+name,{...l,specialOutfitId:specials[(specials.indexOf(item)+1)%specials.length].id},l);
  const restored=current.normalizeLocks(codec.buildRestoreLocks(l,controls));
  const state=checkState('restore:'+name,empty(),restored,true);
  checkGeneration('after-restore:'+name,state.expected,state.actual);
  checkGeneration('direct:'+name,l,l,true);
  const reload=reconcilePage1SingleWardrobeLocks({previousLocks:current.createEmptyLocks(),candidateLocks:current.normalizeLocks(JSON.parse(JSON.stringify(l))),lockControls:controls});
  checkState('reload-next-update:'+name,reload,{...reload,hairColorId:'red'});
  for(const role of ['A','B']){
   const other=role==='A'?'B':'A';
   const duo={...empty(),subjectCount:'2',['specialOutfit'+role+'Id']:item.id,['completeLookPalette'+role+'Id']:palette.id,['top'+other+'Id']:concrete('top'+other+'Id')[0].id,['completeLookPalette'+other+'Id']:'cream-neutral'};
   checkState('duo:'+role+name,empty(),duo,true);
  }
 }
 const reps=[specials[0],specials.find(x=>x.zh.includes('紅色亮面膠帶')),specials.find(x=>x.zh.includes('鏈'))||specials[1]];
 for(const item of reps)for(const palette of palettes){
  const l={...empty(),specialOutfitId:item.id,completeLookPaletteId:palette.id};
  const pair=checkGeneration('saved:'+item.id+palette.id,l,l,true);
  const raw=oldCodec.serializeFavoritePrompt({...pair.before,id:'special-palette-'+saved.length,date:'2026-10-27T00:00:00.000Z'}),bytes=JSON.stringify(raw);
  const md=oldCodec.buildMarkdownExport(pair.before);
  const restored=[['json',oldCodec.deserializeFavoritePrompt(raw),codec.deserializeFavoritePrompt(raw)],['snapshot',oldCodec.parseExportedMarkdownPrompt(md,controls,'saved'),codec.parseExportedMarkdownPrompt(md,controls,'saved')],['prose',oldCodec.parseExportedMarkdownPrompt(md.slice(md.indexOf('\n')+1),controls,'saved'),codec.parseExportedMarkdownPrompt(md.slice(md.indexOf('\n')+1),controls,'saved')]];
  for(const [kind,a,b]of restored){assert.deepEqual(stablePrompt(a),stablePrompt(b));if(kind!=='prose')assert.deepEqual(outputStates(b),outputStates(pair.before));
   const state=checkState('saved-apply:'+kind+saved.length,empty(),current.normalizeLocks(codec.buildRestoreLocks(b.selection,controls)),true);
   checkGeneration('saved-apply-output:'+kind+saved.length,state.expected,state.actual);counts.restores++;
  }
  assert.equal(JSON.stringify(raw),bytes);
  assert.deepEqual(codec.parseLocksFromStandardPrompt(pair.before.grokPrompt,controls),oldCodec.parseLocksFromStandardPrompt(pair.before.grokPrompt,controls));
  const next=codec.parseExportedMarkdownPrompt(codec.buildMarkdownExport(pair.after),controls,'current');assert.deepEqual(outputStates(next),outputStates(pair.after));
  const imported=oldImport.getFullBodyImportSource(pair.before);assert.deepEqual(getFullBodyImportSource(pair.after),imported);assert.ok(imported);
  for(const seed of [41,42]){
   const capture={...l,captureMode:'observation',observationCapture:{...resolveCapture({seed}).profile,personSource:'full-body',importedPerson:imported}};
   const state=checkState('capture-state:'+saved.length+':'+seed,empty(),capture,true);
   const p=checkGeneration('capture:'+saved.length+':'+seed,state.expected,state.actual).after;
   assert.deepEqual(state.actual.observationCapture.importedPerson,imported);assert.equal(p.extraPrompts.find(x=>x.id==='full-body-character').text,imported.fullBodyPrompt);counts.frozenCaptures++;
  }
  for(const crop of options('framingId')){const candidate={...l,framingId:crop.id},state=checkState('crop-state:'+saved.length+crop.id,empty(),candidate,true);checkGeneration('crop:'+saved.length+crop.id,state.expected,state.actual);}
  saved.push({locks:l,raw,markdown:md,imported});
 }
 for(const key of ['outfitPresetId','dressId','characterProfileId','fixedCompositionSetId'])for(const item of concrete(key)){
  const l={...empty(),[key]:item.id,completeLookPaletteId:'black-red-street'};
  const state=checkState('protected:'+key+item.id,empty(),l,true);checkGeneration('protected-output:'+key+item.id,state.expected,state.actual);
 }
 const original={...empty(),specialOutfitId:specials[0].id,completeLookPaletteId:'silver-metallic'};
 for(const specialId of ['', 'random', 'none', 'invalid-special'])for(const palette of ['','none','black-red-street'])checkState('boundary:'+specialId+palette,original,{...original,specialOutfitId:specialId,completeLookPaletteId:palette});
 for(const [name,l]of [['all-none',buildAllNoneLocks(controls,original)],['random',current.createEmptyLocks()],['separates',{...empty(),topId:concrete('topId')[0].id,completeLookPaletteId:'silver-metallic'}]])checkState(name,original,l);
 for(const panel of ['overall','garments','layers','accessories']){const keys=getWardrobePanelKeys(panel,'');checkState('panel-random:'+panel,original,randomizePage1WardrobePanelLocks(original,panel,keys,current.createEmptyLocks(),controls));checkState('panel-clear:'+panel,original,setLockKeysToNone(original,keys,controls));}
 for(let i=0;i<100;i++){const l=current.createEmptyLocks();checkGeneration('random-output:'+i,l,l,true);}
 const dress={...empty(),dressId:concrete('dressId')[0].id,topBottomPaletteId:concrete('topBottomPaletteId')[0].id};
 assert.equal(codec.buildRestoreLocks(dress,controls).topBottomPaletteId,'none');assert.equal(getFullBodyImportSource(run(current,dress,'deferred').p),null);
 // Every existing production source other than the reviewed transition is protected.
 const protectedFiles=git('ls-tree','-r','--name-only','-z',base).toString().split('\0').filter(p=>/^(knowledge_base\/|webapp\/src\/)/.test(p)&&p!=='webapp/src/features/page1/lockTransitions.js');
 for(const p of protectedFiles)assert.equal(sha256(readFileSync(join(root,p))),sha256(git('show',base+':'+p)),p);
 const report={baseCommit:base,...counts,saved:saved.length,protectedFiles:protectedFiles.length,oracleMismatches:mismatches.length,deferredLimits:'split-dress restore and capture remain unchanged'};
 writeFileSync(join(out,'acceptance.json'),JSON.stringify(report,null,2)+'\n');writeFileSync(join(out,'baseline-and-saved.json.gz'),pack({baseCommit:base,cases,saved}));console.log(JSON.stringify(report));
}finally{writeFileSync(join(out,'oracle-mismatches.json'),JSON.stringify(mismatches,null,2)+'\n');rmSync(dir,{recursive:true,force:true});}

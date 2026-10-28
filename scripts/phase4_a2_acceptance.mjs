import assert from 'node:assert/strict';
import{execFileSync}from'node:child_process';
import{readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync,symlinkSync}from'node:fs';
import{join}from'node:path';import{tmpdir}from'node:os';import{fileURLToPath,pathToFileURL}from'node:url';
import * as engine from '../webapp/src/lib/engine.js';
import{buildAllNoneLocks}from'../webapp/src/features/page1/page1Selectors.js';
import{createCompositionVisibilityProjection}from'../webapp/src/lib/engine/compositionVisibilityContract.js';
import * as codec from '../webapp/src/features/saved-cards/cardCodec.js';
import{getFullBodyImportSource}from'../webapp/src/lib/observationCaptureImport.js';
import{resolveCapture}from'../webapp/src/lib/observationCaptureMode.js';
import{stablePrompt,pack,differences}from'./lib/catalogBaseline.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),base='ae57e34341890d2ac77b2deb133a317a7451a2b9',out=join(root,'Docs/reports/phase4-completion-2026-10-28/a2-main'),dir=mkdtempSync(join(tmpdir(),'phase4-a2-'));mkdirSync(out,{recursive:true});
const c=engine.getLockControls(),options=k=>c.find(x=>x.key===k).options,active=k=>options(k).filter(o=>o.id&&!['none','random'].includes(o.id)&&o.zh!=='全無'),near=f=>['headShoulders','chestUp','mediumWaist'].includes(createCompositionVisibilityProjection(f).bucket);
const empty=()=>({...buildAllNoneLocks(c,engine.createEmptyLocks()),subjectCount:'1'}),dresses=active('dressId'),palettes=active('topBottomPaletteId');
const cases=[],saved=[],counts={matrix:0,boundaries:0,capture:0,changed:0,generations:0,roundTrips:0};
function run(e,locks,seed){let calls=0;const random=e.createSeededRandom(seed),p=e.generatePrompts(1,structuredClone(locks),[],{random:()=>{calls++;return random();}})[0];counts.generations++;return{p,calls};}
try{
 execFileSync('tar',['-x','-C',dir],{input:execFileSync('git',['-C',root,'archive',base,'webapp/src','webapp/package.json'],{maxBuffer:128e6})});symlinkSync(join(root,'webapp/node_modules'),join(dir,'webapp/node_modules'),'dir');const old=await import(pathToFileURL(join(dir,'webapp/src/lib/engine.js')).href);
 function check(label,locks,{required=false,oracle=true,save=false}={}){
  const a=run(old,locks,label),b=run(engine,locks,label),before=stablePrompt(a.p),after=stablePrompt(b.p);assert.equal(a.calls,b.calls,label);assert.deepEqual(a.p.selection,b.p.selection,label);assert.deepEqual(a.p.extraPrompts,b.p.extraPrompts,label+':derived');assert.equal(a.p.midjourneyPrompt,b.p.midjourneyPrompt,label+':MJ');
  const protectedAfter=structuredClone(after);for(const k of ['grokPrompt','zImagePrompt','nanoBananaPrompt'])protectedAfter[k]=before[k];assert.deepEqual(differences(before,protectedAfter),[],label+':resolved/source');
  const changed=before.grokPrompt!==after.grokPrompt;if(required)assert.ok(changed,label);if(changed){counts.changed++;if(oracle){const clear={...locks};const colors=[];for(const suffix of ['','A','B']){const palette=palettes.find(p=>p.id===locks['topBottomPalette'+suffix+'Id']);if(palette){clear['topBottomPalette'+suffix+'Id']='none';clear['dress'+suffix+'ColorId']='none';colors.push(palette.topColor.en);}}
    const reference=run(old,clear,label).p;
    for(const k of ['grokPrompt','zImagePrompt','nanoBananaPrompt']){let text=b.p[k];for(const color of colors)text=text.replace(', upper/main dress area in '+color,'');assert.equal(text,reference[k],label+':visible-source:'+k);}
   }}
  cases.push({label,locks,before,calls:a.calls,changed});if(save)saved.push({label,locks,old:a.p,current:b.p,raw:codec.serializeFavoritePrompt(a.p)});return b.p;
 }
 const bucketFrames=[...new Map(active('framingId').filter(near).map(f=>[createCompositionVisibilityProjection(f).bucket,f])).values()];
 for(const dress of dresses)for(const palette of palettes)for(const frame of bucketFrames){check('matrix:'+dress.id+palette.id+frame.id,{...empty(),dressId:dress.id,topBottomPaletteId:palette.id,framingId:frame.id},{required:true,save:dress===dresses[0]&&palette===palettes[0]});counts.matrix++;}
 for(const framing of active('framingId')){check('framing:'+framing.id,{...empty(),dressId:dresses[0].id,topBottomPaletteId:palettes[0].id,framingId:framing.id});counts.boundaries++;}
 for(const palette of palettes){check('duo:'+palette.id,{...empty(),subjectCount:'2',dressAId:dresses[0].id,dressBId:dresses[1].id,topBottomPaletteAId:palette.id,topBottomPaletteBId:palettes[1].id,framingId:bucketFrames[1].id},{required:true});counts.boundaries++;}
 for(const coat of active('outerwearId'))for(const opening of active('outerwearOpeningId')){check('coat:'+coat.id+opening.id,{...empty(),dressId:dresses[0].id,topBottomPaletteId:palettes[0].id,framingId:bucketFrames[1].id,outerwearId:coat.id,outerwearOpeningId:opening.id});counts.boundaries++;}
 for(const dress of dresses){const full=run(engine,{...empty(),dressId:dress.id,topBottomPaletteId:palettes[0].id,framingId:options('framingId').find(f=>f.zh.includes('全身鏡頭')).id},'fullsource').p,person=getFullBodyImportSource(full);assert.ok(person);const locks={...empty(),framingId:options('framingId').find(f=>f.zh.includes('中景鏡頭')).id,captureMode:'observation',observationCapture:{...resolveCapture({seed:31}).profile,personSource:'full-body',importedPerson:person,availablePerson:person}};check('capture:'+dress.id,locks,{oracle:false});counts.capture++;}
 for(const row of saved)for(const p of [row.old,row.current])for(const method of ['json','markdown']){const actual=method==='json'?codec.deserializeFavoritePrompt(codec.serializeFavoritePrompt(p)):codec.parseExportedMarkdownPrompt(codec.buildMarkdownExport(p),c,'restored');for(const k of ['grokPrompt','zImagePrompt','midjourneyPrompt','nanoBananaPrompt','extraPrompts'])assert.deepEqual(actual[k],p[k]);assert.equal(actual.selection.topBottomPaletteId,p.selection.topBottomPaletteId);counts.roundTrips++;}
 writeFileSync(join(out,'baseline.json.gz'),pack({baseCommit:base,counts,cases,saved}));writeFileSync(join(out,'acceptance.json'),JSON.stringify({baseCommit:base,counts,oracleMismatches:0,passed:true},null,2)+'\n');console.log(counts);
}catch(error){writeFileSync(join(out,'failure-'+Date.now()+'.json'),JSON.stringify({message:error.message,stack:error.stack,counts},null,2));throw error;}finally{rmSync(dir,{recursive:true,force:true});}

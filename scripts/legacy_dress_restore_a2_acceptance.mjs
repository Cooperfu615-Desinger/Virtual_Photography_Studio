// Fixed-Git oracle: approved restore/lifecycle deltas only; the generator stays byte-identical.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync,symlinkSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath,pathToFileURL} from 'node:url';
import * as engine from '../webapp/src/lib/engine.js';
import * as codec from '../webapp/src/features/saved-cards/cardCodec.js';
import {transitionPage1Locks as transition} from '../webapp/src/features/page1/lockTransitions.js';
import {reconcilePage1SingleWardrobeLocks as reconcile} from '../webapp/src/features/page1/page1WardrobeExclusivity.js';
import {buildAllNoneLocks} from '../webapp/src/features/page1/page1Selectors.js';
import {getWardrobePanelKeys} from '../webapp/src/features/page1/wardrobeEditor.js';
import {randomizePage1WardrobePanelLocks,setLockKeysToNone} from '../webapp/src/lib/page1SectionRandom.js';
import {getFullBodyImportSource} from '../webapp/src/lib/observationCaptureImport.js';
import {resolveCapture,rerollCapture} from '../webapp/src/lib/observationCaptureMode.js';
import {stablePrompt,pack,sha256,differences,readJson} from './lib/catalogBaseline.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),base='0babbebb8c5fabfe9a1fa16d8824e1c5651ffffd';
const out=resolve(process.argv[2]||'/tmp/a2-legacy-dress-acceptance'),own=resolve(root,'Docs/reports/legacy-dress-restore-a2-2026-10-27');
assert.ok(!out.startsWith(resolve(root)+'/')||out===own||out.startsWith(own+'/'),'Protect other reports');mkdirSync(out,{recursive:true});
const dir=mkdtempSync(join(tmpdir(),'vps-legacy-dress-oracle-'));
const git=(...args)=>execFileSync('git',['-C',root,...args],{maxBuffer:128*1024*1024});
const counts={matrix:0,transitions:0,generations:0,storedRoundTrips:0,prose:0,captures:0,archivedCards:0},cases=[],saved=[],mismatches=[];
function same(name,a,b){const diff=differences(a,b);if(diff.length)mismatches.push({name,diff});assert.deepEqual(diff,[],name);}
function run(e,locks,seed){let calls=0;const random=e.createSeededRandom(seed);return {prompt:e.generatePrompts(1,structuredClone(locks),[],{random:()=>{calls++;return random();}})[0],calls};}
try {
 execFileSync('tar',['-x','-C',dir],{input:git('archive',base,'webapp/src','webapp/package.json')});
 symlinkSync(join(root,'webapp/node_modules'),join(dir,'webapp/node_modules'),'dir');
 const load=p=>import(pathToFileURL(join(dir,p)).href);
 const old={engine:await load('webapp/src/lib/engine.js'),codec:await load('webapp/src/features/saved-cards/cardCodec.js'),transition:(await load('webapp/src/features/page1/lockTransitions.js')).transitionPage1Locks,reconcile:(await load('webapp/src/features/page1/page1WardrobeExclusivity.js')).reconcilePage1SingleWardrobeLocks};
 const controls=engine.getLockControls(),options=k=>controls.find(c=>c.key===k).options;
 const active=k=>options(k).filter(o=>o.id&&!['none','random'].includes(o.id)&&o.zh!=='全無');
 const id=(k,s)=>{const x=options(k).find(o=>o.zh.includes(s));assert.ok(x,k+s);return x.id;};
 const empty=()=>({...buildAllNoneLocks(controls,engine.createEmptyLocks()),subjectCount:'1',framingId:id('framingId','全身鏡頭')});
 const args=(previous,candidate,restoringSelection=false)=>({previousLocks:previous,candidateLocks:candidate,lockControls:controls,restoringSelection});
 const gen=(name,locks)=>{const before=run(old.engine,locks,name),after=run(engine,locks,name);same(name,{prompt:stablePrompt(before.prompt),calls:before.calls},{prompt:stablePrompt(after.prompt),calls:after.calls});counts.generations++;return {...after.prompt,id:'legacy-dress-'+sha256(name).slice(0,16),date:'2026-10-27T00:00:00.000Z'};};
 const compareTransition=(name,previous,candidate,expected,restore=false)=>{const actual=transition(args(previous,candidate,restore));same(name,expected,actual);counts.transitions++;return actual;};
 same('controls',old.engine.getLockControls(),controls);same('catalog',old.engine.getKnowledgeBaseSnapshot(),engine.getKnowledgeBaseSnapshot());
 const dresses=active('dressId'),palettes=active('topBottomPaletteId');assert.equal(dresses.length,24);assert.equal(palettes.length,42);
 for(const dress of dresses)for(const [pi,palette]of palettes.entries()) {
  const name=dress.id+':'+palette.id,input={...empty(),dressId:dress.id,topBottomPaletteId:palette.id};counts.matrix++;
  const expected={...old.transition(args(empty(),input,true)),topBottomPaletteId:palette.id};
  const restored=compareTransition(name+':apply',empty(),input,expected,true);
  same(name+':codec',{...old.codec.buildRestoreLocks(input,controls),topBottomPaletteId:palette.id},codec.buildRestoreLocks(input,controls));
  const init={previousLocks:engine.createEmptyLocks(),candidateLocks:engine.normalizeLocks(input),lockControls:controls,restoringSelection:true};
  same(name+':initialize',{...old.reconcile(init),topBottomPaletteId:palette.id},reconcile(init));
  for(const [kind,patch]of [['idle',{}],['shoes',{shoesColorId:'red'}],['palette-direction',{completeLookPaletteId:active('completeLookPaletteId')[0].id}],['crop',{framingId:id('framingId','中景鏡頭')}],['scene',{sceneAttributeId:active('sceneAttributeId')[0].id}]]) {
   const candidate={...restored,...patch};compareTransition(name+':'+kind,restored,candidate,{...old.transition(args(restored,candidate)),topBottomPaletteId:palette.id});
  }
  for(const [kind,patch]of [['dress',{dressId:dresses[(dresses.indexOf(dress)+1)%dresses.length].id}],['no-dress',{dressId:id('dressId','全無')}],['random-dress',{dressId:''}],['color',{dressColorId:'red'}],['random-color',{dressColorId:''}],['top',{topId:active('topId')[0].id}]]) {
   const candidate={...restored,...patch};compareTransition(name+':'+kind,restored,candidate,old.transition(args(restored,{...candidate,topBottomPaletteId:'none'})));
  }
  for(const [kind,patch]of [['release',{topBottomPaletteId:'none'}],['new-pair',{topBottomPaletteId:palettes[(pi+1)%palettes.length].id}],['preset',{outfitPresetId:active('outfitPresetId')[0].id}],['special',{specialOutfitId:active('specialOutfitId')[0].id}]]) {
   const candidate={...restored,...patch};compareTransition(name+':'+kind,restored,candidate,old.transition(args(restored,candidate)));
  }
  const p=gen(name+':direct',input),applied=gen(name+':applied',restored);
  assert.ok(applied.grokPrompt.includes(palette.topColor.en));assert.ok(applied.grokPrompt.includes(palette.bottomColor.en));
  assert.equal(applied.selection.topBottomPaletteId,palette.id);
  const raw=old.codec.serializeFavoritePrompt(p),md=old.codec.buildMarkdownExport(p);
  for(const card of [codec.deserializeFavoritePrompt(raw),codec.parseExportedMarkdownPrompt(md,controls,'roundtrip')]) {
   for(const key of ['grokPrompt','zImagePrompt','midjourneyPrompt','nanoBananaPrompt','extraPrompts'])same(name+':saved-text:'+key,p[key],card[key]);
   const oldApplied=old.codec.buildRestoreLocks(card.selection,controls),expectedSaved={...oldApplied,topBottomPaletteId:palette.id};
   const newApplied=codec.buildRestoreLocks(card.selection,controls);same(name+':saved-selection',expectedSaved,newApplied);
   const step=compareTransition(name+':saved-apply',empty(),newApplied,{...old.transition(args(empty(),newApplied,true)),topBottomPaletteId:palette.id},true);
   const generated=gen(name+':resaved',step);assert.equal(generated.selection.topBottomPaletteId,palette.id);
   const resaved=codec.deserializeFavoritePrompt(codec.serializeFavoritePrompt(generated));assert.equal(resaved.selection.topBottomPaletteId,palette.id);counts.storedRoundTrips++;
  }
  same(name+':prose',old.codec.parseLocksFromStandardPrompt(p.grokPrompt,controls),codec.parseLocksFromStandardPrompt(p.grokPrompt,controls));counts.prose++;
  if(pi===0){
   const person=getFullBodyImportSource(applied);assert.ok(person);const captureLocks={...restored,captureMode:'observation',observationCapture:{...resolveCapture({seed:31}).profile,personSource:'full-body',importedPerson:person,availablePerson:person}};
   const frozen=JSON.stringify(person);let cp=gen(name+':capture',captureLocks);counts.captures++;
   for(let i=0;i<3;i++){captureLocks.observationCapture=rerollCapture(captureLocks.observationCapture).profile;cp=gen(name+':reroll'+i,captureLocks);assert.equal(JSON.stringify(captureLocks.observationCapture.importedPerson),frozen);assert.equal(cp.extraPrompts.find(x=>x.id==='full-body-character').text,person.fullBodyPrompt);counts.captures++;}
   const restoredCapture=codec.buildRestoreLocks(codec.deserializeFavoritePrompt(codec.serializeFavoritePrompt(cp)).selection,controls);same(name+':capture-person',restoredCapture.observationCapture.importedPerson,person);
   saved.push({name,locks:input,prompt:p,raw,markdown:md,appliedPrompt:applied,captureLocks,capturePrompt:cp});
  }
  if(pi===palettes.length-1)console.log(JSON.stringify({completedDresses:dresses.indexOf(dress)+1,matrix:counts.matrix}));
  cases.push({name,beforeRestore:old.codec.buildRestoreLocks(input,controls).topBottomPaletteId,afterRestore:restored.topBottomPaletteId,promptHash:sha256(JSON.stringify(p)),appliedHash:sha256(JSON.stringify(applied))});
 }
 const sample={...empty(),dressId:dresses[0].id,topBottomPaletteId:palettes[0].id};
 for(const [kind,candidate]of [['all-random',engine.createEmptyLocks()],['all-none',buildAllNoneLocks(controls,sample)],...['overall','garments','layers','accessories'].flatMap(panel=>{const keys=getWardrobePanelKeys(panel,'');return [[panel+'-random',randomizePage1WardrobePanelLocks(sample,panel,keys,engine.createEmptyLocks(),controls)],[panel+'-none',setLockKeysToNone(sample,keys,controls)]];})]) {
  const prior=old.transition(args(sample,kind==='overall-none'?{...candidate,topBottomPaletteId:'none'}:candidate));
  // Layer/accessory operations retain the existing one-piece combination; wardrobe reset operations release it.
  const keep=/^(layers|accessories)-/.test(kind);
  compareTransition(kind,sample,candidate,keep?{...prior,topBottomPaletteId:sample.topBottomPaletteId}:prior);
 }
 for(const role of ['A','B'])for(const palette of palettes){
  const locks={...empty(),subjectCount:'2',dressAId:dresses[0].id,dressBId:dresses[1].id,topBottomPaletteAId:palettes[0].id,topBottomPaletteBId:palettes[1].id,['topBottomPalette'+role+'Id']:palette.id};
  compareTransition('duo:'+role+palette.id,empty(),locks,old.transition(args(empty(),locks,true)),true);same('duo-codec',old.codec.buildRestoreLocks(locks,controls),codec.buildRestoreLocks(locks,controls));gen('duo:'+role+palette.id,locks);
 }
 for(const key of ['specialOutfitId','outfitPresetId','dressId'])for(const item of active(key)) {
  const locks={...empty(),[key]:item.id};same('ordinary-codec:'+item.id,old.codec.buildRestoreLocks(locks,controls),codec.buildRestoreLocks(locks,controls));gen('ordinary:'+item.id,locks);
 }
 for(let i=0;i<30;i++)gen('random:'+i,engine.createEmptyLocks());
 const archive=readJson(join(root,'Docs/reports/wardrobe-control-a2-dresses-2026-10-26/baseline-and-saved.json.gz'));
 for(const s of archive.saved){
  same(s.id+':old-json',old.codec.deserializeFavoritePrompt(s.raw),codec.deserializeFavoritePrompt(s.raw));
  const a=old.codec.parseExportedMarkdownPrompt(s.markdown,controls,'archived'),b=codec.parseExportedMarkdownPrompt(s.markdown,controls,'archived');same(s.id+':old-md',stablePrompt(a),stablePrompt(b));counts.archivedCards++;counts.prose++;
 }
 const productionAllow=new Set(['webapp/src/features/page1/page1WardrobeExclusivity.js','webapp/src/features/page1/lockTransitions.js','webapp/src/features/page1/usePromptWorkspace.js','webapp/src/features/saved-cards/cardCodec.js','webapp/src/components/Page1Workspace.jsx','webapp/src/lib/page1WorkspaceSummary.js']);
 const protectedFiles=git('ls-tree','-r','--name-only','-z',base).toString().split('\0').filter(p=>/^(knowledge_base\/|webapp\/src\/)/.test(p)&&!p.endsWith('.test.js')&&!productionAllow.has(p));
 for(const p of protectedFiles)assert.equal(sha256(readFileSync(join(root,p))),sha256(git('show',base+':'+p)),p);
 const report={baseCommit:base,...counts,saved:saved.length,protectedFiles:protectedFiles.length,oracleMismatches:mismatches.length,oracle:'Fixed Git restore/transition with only reviewed pair-retain or explicit-release inputs; unchanged fixed Git engine for all six outputs and RNG.',deferred:'Prose normalization, prose palette recognition and chest projection unchanged'};
 writeFileSync(join(out,'acceptance.json'),JSON.stringify(report,null,2)+'\n');writeFileSync(join(out,'baseline-and-saved.json.gz'),pack({baseCommit:base,cases,saved}));writeFileSync(join(out,'oracle-mismatches.json'),JSON.stringify(mismatches,null,2)+'\n');console.log(JSON.stringify(report));
}finally{rmSync(dir,{recursive:true,force:true});}

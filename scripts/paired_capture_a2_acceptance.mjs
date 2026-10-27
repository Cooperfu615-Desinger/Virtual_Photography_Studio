// Compare ordinary outputs with fixed Git. A second isolated oracle exposes only
// the raw generated snapshot by bypassing the old ID-only gate on trusted fixtures.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync,symlinkSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath,pathToFileURL} from 'node:url';
import * as current from '../webapp/src/lib/engine.js';
import * as capture from '../webapp/src/lib/observationCaptureImport.js';
import * as codec from '../webapp/src/features/saved-cards/cardCodec.js';
import {transitionPage1Locks} from '../webapp/src/features/page1/lockTransitions.js';
import {buildAllNoneLocks} from '../webapp/src/features/page1/page1Selectors.js';
import {resolveCapture,rerollCapture} from '../webapp/src/lib/observationCaptureMode.js';
import {stablePrompt,outputStates,pack,sha256,differences} from './lib/catalogBaseline.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),base='58516b20c6631b1a61faa48ee22abfb05ea29384';
const out=resolve(process.argv[2]||'/tmp/a2-paired-capture-acceptance'),own=resolve(root,'Docs/reports/paired-capture-a2-2026-10-27');
assert.ok(!out.startsWith(resolve(root)+'/')||out===own||out.startsWith(own+'/'),'Protect other reports');mkdirSync(out,{recursive:true});
const dirs=[],cases=[],saved=[],mismatches=[],counts={ordinary:0,captures:0,newlyAccepted:0,unchangedSources:0,restores:0,rerolls:0,transitions:0};
const git=(...args)=>execFileSync('git',['-C',root,...args],{maxBuffer:128*1024*1024});
async function baseline(raw){
 const dir=mkdtempSync(join(tmpdir(),'vps-paired-oracle-'));dirs.push(dir);
 execFileSync('tar',['-x','-C',dir],{input:git('archive',base,'webapp/src','webapp/package.json')});
 symlinkSync(join(root,'webapp/node_modules'),join(dir,'webapp/node_modules'),'dir');
 if(raw){const file=join(dir,'webapp/src/lib/observationCaptureImport.js'),text=readFileSync(file,'utf8');
  const gate="  if (!Object.values(value.wardrobeColors).every(item => item === null || record(item) && typeof item.id === 'string')) return null;";
  assert.equal(text.split(gate).length-1,1);writeFileSync(file,text.replace(gate,'  // TEST ORACLE ONLY: expose the trusted generator snapshot without the old ID-only gate.'));
 }
 const load=p=>import(pathToFileURL(join(dir,p)).href);
 return {engine:await load('webapp/src/lib/engine.js'),capture:await load('webapp/src/lib/observationCaptureImport.js'),codec:await load('webapp/src/features/saved-cards/cardCodec.js'),transition:(await load('webapp/src/features/page1/lockTransitions.js')).transitionPage1Locks};
}
function run(engine,locks,seed){let calls=0;const rng=engine.createSeededRandom(seed);return {prompt:engine.generatePrompts(1,structuredClone(locks),[],{random:()=>{calls++;return rng();}})[0],calls};}
function same(name,a,b){const diff=differences(a,b);if(diff.length)mismatches.push({name,diff});assert.deepEqual(diff,[],name);}
try{
 const old=await baseline(false),oracle=await baseline(true),controls=current.getLockControls();
 assert.deepEqual(controls,old.engine.getLockControls());assert.deepEqual(current.getKnowledgeBaseSnapshot(),old.engine.getKnowledgeBaseSnapshot());
 const options=k=>controls.find(c=>c.key===k).options,active=k=>options(k).filter(o=>o.id&&!['none','random'].includes(o.id)&&o.zh!=='全無');
 const id=(k,s)=>{const o=options(k).find(o=>o.zh.includes(s));assert.ok(o,k+s);return o.id;};
 const empty=()=>({...buildAllNoneLocks(controls,current.createEmptyLocks()),subjectCount:'1',framingId:id('framingId','全身鏡頭')});
 const palettes=active('topBottomPaletteId'),families=[
  ['pants',{topId:id('topId','領帶襯衫'),pantsId:id('pantsId','牛仔')}],
  ['skirt',{topId:id('topId','領帶襯衫'),skirtId:id('skirtId','短裙')}],
  ['top',{topId:id('topId','領帶襯衫')}],['bottom',{pantsId:id('pantsId','牛仔')}],
  ...active('dressId').map(o=>['dress:'+o.id,{dressId:o.id}]),
  ['preset',{outfitPresetId:id('outfitPresetId','鏈條緞面')}],
 ];
 function check(name,locks,{save=false,cycle=false}={}){
  const before=run(old.engine,locks,name),after=run(current,locks,name),raw=run(oracle.engine,locks,name);counts.ordinary++;
  same(name+':ordinary',{prompt:stablePrompt(before.prompt),calls:before.calls},{prompt:stablePrompt(after.prompt),calls:after.calls});
  const expected=oracle.capture.getFullBodyImportSource(raw.prompt),actual=capture.getFullBodyImportSource(after.prompt),prior=old.capture.getFullBodyImportSource(before.prompt);
  same(name+':raw-source',expected,actual);
  if(prior){counts.unchangedSources++;same(name+':old-source',prior,actual);}else if(actual)counts.newlyAccepted++;
  const args={previousLocks:empty(),candidateLocks:locks,lockControls:controls,restoringSelection:true};
  same(name+':transition',old.transition(args),transitionPage1Locks(args));counts.transitions++;
  same(name+':restore',old.codec.buildRestoreLocks(after.prompt.selection,controls),codec.buildRestoreLocks(after.prompt.selection,controls));
  if(active('dressId').some(o=>o.id===locks.dressId)&&locks.topBottomPaletteId&&locks.topBottomPaletteId!=='none')assert.equal(codec.buildRestoreLocks(locks,controls).topBottomPaletteId,'none');
  cases.push({name,ordinary:sha256(JSON.stringify(stablePrompt(after.prompt))),source:sha256(JSON.stringify(actual)),newlyAccepted:!prior&&!!actual,rngCalls:after.calls});
  if(!actual)return;
  const profile={...resolveCapture({seed:31}).profile,personSource:'full-body',importedPerson:actual,availablePerson:actual};
  const next={...locks,captureMode:'observation',observationCapture:profile};
  const expectedCapture=run(oracle.engine,next,name+':capture'),actualCapture=run(current,next,name+':capture');
  if(!expectedCapture.prompt){assert.equal(actualCapture.prompt,undefined,name+':existing capture exclusion');counts.captureExcluded=(counts.captureExcluded||0)+1;return;}
  same(name+':capture',{prompt:stablePrompt(expectedCapture.prompt),calls:expectedCapture.calls},{prompt:stablePrompt(actualCapture.prompt),calls:actualCapture.calls});counts.captures++;
  assert.equal(actualCapture.prompt.extraPrompts.find(x=>x.id==='full-body-character').text,actual.fullBodyPrompt);
  if(cycle){
   for(const restored of [current.normalizeLocks(JSON.parse(JSON.stringify(next))),current.normalizeLocks(codec.buildRestoreLocks(codec.deserializeFavoritePrompt(codec.serializeFavoritePrompt(actualCapture.prompt)).selection,controls)),current.normalizeLocks(codec.parseExportedMarkdownPrompt(codec.buildMarkdownExport(actualCapture.prompt),controls,'capture-restore').selection)]){
    same(name+':restored-person',restored.observationCapture.importedPerson,actual);
    same(name+':restored-outputs',outputStates(run(current,restored,name+':capture').prompt),outputStates(actualCapture.prompt));counts.restores++;
   }
   for(let i=0;i<3;i++){next.observationCapture=rerollCapture(next.observationCapture).profile;
    const a=run(current,next,name+':reroll:'+i),b=run(oracle.engine,next,name+':reroll:'+i);
    same(name+':reroll',{prompt:stablePrompt(a.prompt),calls:a.calls},{prompt:stablePrompt(b.prompt),calls:b.calls});same(name+':frozen-person',next.observationCapture.importedPerson,actual);counts.rerolls++;
   }
  }
  if(save)saved.push({name,locks,prompt:after.prompt,raw:codec.serializeFavoritePrompt(after.prompt),imported:actual,captureLocks:{...locks,captureMode:'observation',observationCapture:profile},capturePrompt:actualCapture.prompt,captureRaw:codec.serializeFavoritePrompt(actualCapture.prompt)});
 }
 assert.equal(palettes.length,42);assert.equal(active('dressId').length,24);
 for(const [family,wardrobe]of families)for(const [i,p]of palettes.entries())check(family+':'+p.id,{...empty(),...wardrobe,topBottomPaletteId:p.id},{save:i===0,cycle:i===0||family==='pants'});
 for(const framing of ['中景鏡頭','牛仔中景','全臉傾斜特寫'])for(const p of palettes)check('crop:'+framing+':'+p.id,{...empty(),...families[0][1],topBottomPaletteId:p.id,framingId:id('framingId',framing)});
 for(let i=0;i<20;i++)check('random-pair:'+i,{...empty(),...families[0][1],topBottomPaletteId:'random'},{cycle:true,save:i===0});
 for(const [family,wardrobe]of families)check('none:'+family,{...empty(),...wardrobe},{cycle:true});
 for(const key of ['specialOutfitId','outfitPresetId','dressId'])for(const palette of options('completeLookPaletteId'))check('complete:'+key+palette.id,{...empty(),[key]:active(key)[0].id,completeLookPaletteId:palette.id});
 for(let i=0;i<50;i++)check('ordinary-random:'+i,current.createEmptyLocks());
 for(const role of ['A','B'])for(const p of palettes.slice(0,3))check('duo:'+role+p.id,{...empty(),subjectCount:'2',['top'+role+'Id']:id('top'+role+'Id','領帶襯衫'),['pants'+role+'Id']:id('pants'+role+'Id','牛仔'),['topBottomPalette'+role+'Id']:p.id});
 for(const c of active('characterProfileId').slice(0,3))check('card:'+c.id,{...empty(),characterProfileId:c.id});
 for(const c of active('fixedCompositionSetId').slice(0,3))check('fixed:'+c.id,{...empty(),fixedCompositionSetId:c.id});
 // No production code outside the narrow validator, no catalog or generated outputs changed.
 const protectedFiles=git('ls-tree','-r','--name-only','-z',base).toString().split('\0').filter(p=>/^(knowledge_base\/|webapp\/src\/)/.test(p)&&!p.endsWith('.test.js')&&p!=='webapp/src/lib/observationCaptureImport.js');
 for(const p of protectedFiles)assert.equal(sha256(readFileSync(join(root,p))),sha256(git('show',base+':'+p)),p);
 const report={baseCommit:base,...counts,saved:saved.length,protectedFiles:protectedFiles.length,oracleMismatches:mismatches.length,oracle:'Fixed Git ordinary engine; isolated ID-gate bypass exposes trusted generated snapshots only. Negative validation is tested separately.',deferred:'Legacy dress structured/prose restore and wardrobe exclusivity unchanged'};
 writeFileSync(join(out,'acceptance.json'),JSON.stringify(report,null,2)+'\n');writeFileSync(join(out,'baseline-and-saved.json.gz'),pack({baseCommit:base,cases,saved}));writeFileSync(join(out,'oracle-mismatches.json'),JSON.stringify(mismatches,null,2)+'\n');console.log(JSON.stringify(report));
}finally{for(const d of dirs)rmSync(d,{recursive:true,force:true});}

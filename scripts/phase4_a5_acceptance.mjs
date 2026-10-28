import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as current from '../webapp/src/lib/engine.js';
import * as codec from '../webapp/src/features/saved-cards/cardCodec.js';
import { transitionPage1Locks } from '../webapp/src/features/page1/lockTransitions.js';
import { buildAllNoneLocks } from '../webapp/src/features/page1/page1Selectors.js';
import { stablePrompt, outputStates, pack, sha256 } from './lib/catalogBaseline.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),out=join(root,'Docs/reports/phase4-completion-2026-10-28/a5'),review=JSON.parse(readFileSync(join(out,'review.json'))),base=review.baseCommit,dir=mkdtempSync(join(tmpdir(),'phase4-a5-'));
const git=(...a)=>execFileSync('git',['-C',root,...a],{maxBuffer:128e6}),controls=current.getLockControls(),options=k=>controls.find(x=>x.key===k).options,active=k=>options(k).filter(x=>x.id&&!['none','random'].includes(x.id)&&x.zh!=='全無');
const cases=[],pools=[],saved=[],transitions=[];let generations=0;
try {
 execFileSync('tar',['-x','-C',dir],{input:git('archive',base,'webapp/src','webapp/package.json')});symlinkSync(join(root,'webapp/node_modules'),join(dir,'webapp/node_modules'),'dir');const load=p=>import(pathToFileURL(join(dir,p)));
 const old=await load('webapp/src/lib/engine.js'),oldCodec=await load('webapp/src/features/saved-cards/cardCodec.js'),oldTransition=(await load('webapp/src/features/page1/lockTransitions.js')).transitionPage1Locks;
 const oracle=structuredClone(old.getKnowledgeBaseSnapshot());
 for(const row of review.rows){const x=Object.values(oracle.Locations).flat().find(x=>x.stableId===row.id);assert.deepEqual(x.meta.semantic,row.before.meta.semantic);x.meta.semantic.tags=row.afterTags;}
 assert.deepEqual(current.getKnowledgeBaseSnapshot(),oracle);(await load('webapp/src/lib/engine/runtimeCache.js')).prepareImmutableRuntimeLibrary(oracle);
 const allowed=new Set([...review.rows.map(x=>x.source),'webapp/src/data/database.json']);let protectedFiles=0;
 for(const path of git('ls-tree','-r','--name-only',base).toString().trim().split('\n').filter(p=>/^(knowledge_base\/|webapp\/src\/(data|lib|features)\/)/.test(p)&&!p.endsWith('.test.js')&&!p.endsWith('README.md'))){if(!allowed.has(path)){assert.equal(sha256(readFileSync(join(root,path))),sha256(git('show',base+':'+path)),path);protectedFiles++;}}
 for(const path of new Set(review.rows.map(x=>x.source))){const expected=JSON.parse(git('show',base+':'+path));for(const row of review.rows.filter(x=>x.source===path))expected.entries.find(x=>x.id===row.id).meta.semantic.tags=row.afterTags;assert.deepEqual(JSON.parse(readFileSync(join(root,path))),expected);}
 const run=(engine,library,locks,seed)=>{let draws=0;const rng=engine.createSeededRandom(seed),p=engine.generatePrompts(1,structuredClone(locks),library,{random:()=>{draws++;return rng();}})[0];assert.ok(p);generations++;return{p:stablePrompt(p),draws};};
 function compare(label,locks,seed=label,save=false){const before=run(old,[],locks,seed),expected=run(old,oracle,locks,seed),after=run(current,[],locks,seed);assert.deepEqual(after,expected,label);cases.push({label,locks,seed,beforeHash:sha256(JSON.stringify(before)),afterHash:sha256(JSON.stringify(after)),rngBefore:before.draws,rngAfter:after.draws,outputsChanged:JSON.stringify(outputStates(before.p))!==JSON.stringify(outputStates(after.p))});if(save){const card={...before.p,id:'a5-'+saved.length,date:'2026-10-28T00:00:00.000Z'},next={...after.p,id:'a5-new-'+saved.length,date:card.date};saved.push({label,locks,old:card,current:next,raw:oldCodec.serializeFavoritePrompt(card)});}}
 const allNone={...buildAllNoneLocks(controls,current.createEmptyLocks()),subjectCount:'1'},full=active('framingId').find(x=>x.zh.includes('全身鏡頭')).id;
 for(const row of review.rows){
  const fixed={...allNone,locationId:row.id,framingId:full,sceneAttributeId:'none'},random={...current.createEmptyLocks(),subjectCount:'1',locationId:row.id,framingId:full,sceneAttributeId:'none'};
  for(const frame of active('framingId'))for(const subjectCount of ['1','2'])compare('fixed:'+row.id+frame.id+subjectCount,{...fixed,framingId:frame.id,subjectCount},'a5-fixed',frame.id===full&&subjectCount==='1');
  for(const lightingId of ['',...options('lightingId').map(x=>x.id)])for(const frame of [full,active('framingId').find(x=>x.zh==='胸上特寫').id]){
   const locks={...random,lightingId,framingId:frame},a=old.getSceneDependentOptions([],locks),e=old.getSceneDependentOptions(oracle,locks),b=current.getSceneDependentOptions([],locks);assert.deepEqual(b,e);pools.push({id:row.id,lightingId,frame,before:Object.fromEntries(Object.entries(a).map(([k,v])=>[k,v.map(x=>x.id)])),after:Object.fromEntries(Object.entries(b).map(([k,v])=>[k,v.map(x=>x.id)]))});compare('ambient:'+row.id+lightingId+frame,locks,'a5-ambient');
  }
  for(const lightDirectionId of ['',...options('lightDirectionId').map(x=>x.id)])compare('direction:'+row.id+lightDirectionId,{...random,lightDirectionId},'a5-direction');
  for(let i=0;i<25;i++)compare('random:'+row.id+i,random,'a5-random-'+i);
  for(const poseBaseId of ['standing','sitting','lying'])for(const poseOrientationId of ['','lying-supine','lying-prone'])compare('pose:'+row.id+poseBaseId+poseOrientationId,{...random,poseBaseId,poseOrientationId},'a5-pose');
  for(const restoringSelection of [false,true]){const args={previousLocks:current.createEmptyLocks(),candidateLocks:random,lockControls:controls,restoringSelection};assert.deepEqual(transitionPage1Locks(args),oldTransition({...args,activeLibrary:oracle}));transitions.push({id:row.id,restoringSelection});}
 }
 for(const location of active('locationId').filter(x=>!review.rows.some(r=>r.id===x.id)))compare('other:'+location.id,{...allNone,locationId:location.id,sceneAttributeId:'none',framingId:full});
 let roundTrips=0;for(const row of saved)for(const p of [row.old,row.current])for(const mode of ['json','markdown']){
  const decode=c=>mode==='json'?c.deserializeFavoritePrompt(c.serializeFavoritePrompt(p)):c.parseExportedMarkdownPrompt(c.buildMarkdownExport(p),controls,'restore');const actual=decode(codec),before=decode(oldCodec);assert.deepEqual(outputStates(actual),outputStates(p));assert.deepEqual(actual.selection,before.selection);const locks=codec.buildRestoreLocks(actual.selection,controls);compare('restore:'+row.label+mode+roundTrips,locks,'a5-restore');roundTrips++;
 }
 const result={baseCommit:base,passed:true,cases:cases.length,generations,pools:pools.length,roundTrips,transitions:transitions.length,protectedFiles,changed:cases.filter(x=>x.outputsChanged).length,rngChanged:cases.filter(x=>x.rngBefore!==x.rngAfter).length};writeFileSync(join(out,'baseline.json.gz'),pack({result,cases,pools,saved,transitions}));writeFileSync(join(out,'acceptance.json'),JSON.stringify(result,null,2)+'\n');console.log(result);
}finally{rmSync(dir,{recursive:true,force:true});}

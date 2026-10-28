import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as current from '../webapp/src/lib/engine.js';
import * as codec from '../webapp/src/features/saved-cards/cardCodec.js';
import { buildAllNoneLocks } from '../webapp/src/features/page1/page1Selectors.js';
import { transitionPage1Locks } from '../webapp/src/features/page1/lockTransitions.js';
import { stablePrompt, outputStates, pack, sha256 } from './lib/catalogBaseline.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),out=join(root,'Docs/reports/phase4-completion-2026-10-28/a6'),review=JSON.parse(readFileSync(join(out,'review.json'))),base=review.baseCommit,dir=mkdtempSync(join(tmpdir(),'phase4-a6-'));
const git=(...a)=>execFileSync('git',['-C',root,...a],{maxBuffer:128e6}),c=current.getLockControls(),opts=k=>c.find(x=>x.key===k).options,active=k=>opts(k).filter(x=>x.id&&x.zh!=='全無');
const full=active('framingId').find(x=>x.zh.includes('全身鏡頭')).id,empty=()=>({...buildAllNoneLocks(c,current.createEmptyLocks()),subjectCount:'1',framingId:full});
const cases=[],pools=[],saved=[],roundTrips=[];let generations=0;
const studio=x=>x&&x.zh!=='全無'&&x.meta.tags.includes('studio')&&x.meta.tags.includes('indoor')&&!x.meta.tags.includes('outdoor');
const underground=x=>x?.meta.tags.some(t=>['underground','subterranean'].includes(t));
// Independently reviewed semantic policy, used to remove only unavailable catalog options from old Git.
const ambientAllowed=(loc,x)=>!((studio(loc)||underground(loc))&&x.meta.tags.some(t=>['natural_light','window_light','sunlight'].includes(t)));
const subjectAllowed=(loc,x)=>x.meta.subjectLight?.independentKey===true||(!((studio(loc)||underground(loc))&&x.meta.tags.some(t=>['natural_light','window_light','sunlight'].includes(t)))&&!(studio(loc)&&x.meta.tags.some(t=>['outdoor_only','wet_surface','dappled_subject_light'].includes(t))));
try {
 execFileSync('tar',['-x','-C',dir],{input:git('archive',base,'webapp/src','webapp/package.json')});symlinkSync(join(root,'webapp/node_modules'),join(dir,'webapp/node_modules'),'dir');const load=p=>import(pathToFileURL(join(dir,p)));
 const old=await load('webapp/src/lib/engine.js'),oldCodec=await load('webapp/src/features/saved-cards/cardCodec.js'),prepare=(await load('webapp/src/lib/engine/runtimeCache.js')).prepareImmutableRuntimeLibrary;
 const original=old.getKnowledgeBaseSnapshot(),data=structuredClone(original);for(const x of Object.values(data.Locations).flat())if(review.labels.includes(x.zh))x.meta.semantic.tags.push('studio_lighting_scene');assert.deepEqual(current.getKnowledgeBaseSnapshot(),data);
 const source=JSON.parse(git('show',base+':'+review.source));for(const x of source.entries)if(review.labels.includes(x.zh))x.meta.semantic.tags.push('studio_lighting_scene');assert.deepEqual(JSON.parse(readFileSync(join(root,review.source))),source);
 const allowed=new Set([review.source,'webapp/src/data/database.json','webapp/src/lib/engine.js']);let protectedFiles=0;
 for(const path of git('ls-tree','-r','--name-only',base).toString().trim().split('\n').filter(p=>/^(knowledge_base\/|webapp\/src\/(data|lib|features)\/)/.test(p)&&!p.endsWith('.test.js')&&!p.endsWith('README.md')))if(!allowed.has(path)){assert.equal(sha256(readFileSync(join(root,path))),sha256(git('show',base+':'+path)),path);protectedFiles++;}
 const cache=new Map();function library(loc,randomAmbient=true,randomSubject=true){const key=[loc?.id,randomAmbient,randomSubject].join(':');if(cache.has(key))return cache.get(key);const db=structuredClone(data),allowedAmbient=new Set(opts('lightingId').filter(x=>!randomAmbient||ambientAllowed(loc,x)).map(x=>x.id)),allowedSubject=new Set(opts('lightDirectionId').filter(x=>!randomSubject||subjectAllowed(loc,x)).map(x=>x.id));for(const [name,rows]of Object.entries(db.CameraLighting)){if(name.includes('Ambient Light Conditions'))db.CameraLighting[name]=rows.filter(x=>allowedAmbient.has(x.stableId));if(name.includes('Light Style'))db.CameraLighting[name]=rows.filter(x=>allowedSubject.has(x.stableId));}prepare(db);cache.set(key,db);return db;}
 const run=(e,lib,locks,seed)=>{let draws=0;const rng=e.createSeededRandom(seed),p=e.generatePrompts(1,structuredClone(locks),lib,{random:()=>{draws++;return rng();}})[0];assert.ok(p);generations++;return{p,draws};};
 function compare(label,locks,loc,seed=label,save=false){const before=run(old,[],locks,seed),expected=run(old,library(loc,!locks.lightingId,!locks.lightDirectionId),locks,seed),after=run(current,[],locks,seed);assert.deepEqual({p:stablePrompt(after.p),draws:after.draws},{p:stablePrompt(expected.p),draws:expected.draws},label+':independent filtered old Git');cases.push({label,locks,seed,before:sha256(JSON.stringify(stablePrompt(before.p))),after:sha256(JSON.stringify(stablePrompt(after.p))),drawsBefore:before.draws,drawsAfter:after.draws});if(save)saved.push({label,locks,old:before.p,current:after.p,raw:oldCodec.serializeFavoritePrompt(before.p)});return after.p;}
 const locations=active('locationId');
 for(const loc of locations){const input={...empty(),locationId:loc.id,sceneAttributeId:'none'},target=studio(loc)||underground(loc);
  for(const frame of [full,active('framingId').find(x=>x.zh==='胸上特寫').id])for(const light of opts('lightingId')){
   const locks={...input,framingId:frame,lightingId:light.id},expected=old.getSceneDependentOptions(library(loc),locks),actual=current.getSceneDependentOptions([],locks);for(const key of Object.keys(actual))assert.deepEqual(actual[key],expected[key],loc.zh+light.zh+key);pools.push({location:loc.id,frame,light:light.id,ambient:actual.lightingOptions.map(x=>x.id),subject:actual.lightDirectionOptions.map(x=>x.id)});
  }
  compare('explicit:'+loc.zh,input,loc,'a6-explicit',review.labels.includes(loc.zh)||loc.zh.includes('地下排洪道積水'));
  if(target){for(let n=0;n<12;n++)compare('random:'+loc.id+n,{...input,lightingId:'',lightDirectionId:''},loc,'a6-random-'+n);for(const light of opts('lightingId'))compare('manual:'+loc.id+light.id,{...input,lightingId:light.id,lightDirectionId:''},loc,'a6-manual');}
 }
 let fixedChoices=0;
 for(const set of active('fixedCompositionSetId')){
  const transit=set.meta.tags.some(t=>['station_set','carriage_set'].includes(t));const input={...empty(),fixedCompositionSetId:set.id,sceneAttributeId:'outdoor',locationId:locations.find(x=>x.zh==='室內：純潔白幕').id};
  for(const light of current.getSceneDependentOptions([],input).lightingOptions){const locked={...input,lightingId:light.id};const p=compare('fixed:'+set.id+light.id,locked,set,'a6-fixed',set.id==='luxury-hotel-window-nyc'&&light.zh==='室內窗邊日光');assert.equal(p.selection.lightingId,light.id);fixedChoices++;if(light.zh==='全無')continue;
   for(const direction of current.getSceneDependentOptions([],{...locked}).lightDirectionOptions){const q=run(current,[],{...locked,lightDirectionId:direction.id},'a6-direction').p;assert.equal(q.selection.lightDirectionId,direction.id,set.zh+light.zh+direction.zh);fixedChoices++;}
  }
  if(transit)assert.deepEqual(current.getSceneDependentOptions([],input).lightingOptions,opts('lightingId'));
  for(let n=0;n<10;n++)compare('fixed-random:'+set.id+n,{...input,lightingId:'',lightDirectionId:''},set,'a6-fixed-random-'+n);
 }
 for(const row of saved)for(const p of [row.old,row.current])for(const mode of ['json','markdown']){const decode=co=>mode==='json'?co.deserializeFavoritePrompt(co.serializeFavoritePrompt(p)):co.parseExportedMarkdownPrompt(co.buildMarkdownExport(p),c,'restore');const a=decode(codec),b=decode(oldCodec);assert.deepEqual(outputStates(a),outputStates(p));assert.deepEqual(a.selection,b.selection);const restored=codec.buildRestoreLocks(a.selection,c),transitioned=transitionPage1Locks({previousLocks:current.createEmptyLocks(),candidateLocks:restored,lockControls:c,restoringSelection:true});roundTrips.push({label:row.label,mode,requested:restored.lightingId,afterTransition:transitioned.lightingId});}
 const result={baseCommit:base,passed:true,cases:cases.length,generations,pools:pools.length,fixedChoices,roundTrips:roundTrips.length,protectedFiles,changed:cases.filter(x=>x.before!==x.after).length};writeFileSync(join(out,'baseline.json.gz'),pack({result,cases,pools,saved,roundTrips}));writeFileSync(join(out,'acceptance.json'),JSON.stringify(result,null,2)+'\n');console.log(result);
}finally{rmSync(dir,{recursive:true,force:true});}

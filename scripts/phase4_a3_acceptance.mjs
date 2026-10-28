import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync,symlinkSync} from 'node:fs';
import {join} from 'node:path';import {tmpdir} from 'node:os';import {fileURLToPath,pathToFileURL} from 'node:url';
import * as current from '../webapp/src/lib/engine.js';
import {buildAllNoneLocks} from '../webapp/src/features/page1/page1Selectors.js';
import * as world from '../webapp/src/lib/page3WorldScene.js';
import * as codec from '../webapp/src/features/saved-cards/cardCodec.js';
import {stablePrompt,pack} from './lib/catalogBaseline.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),base='8bbc60565ee46aeb04b630a2fb471d2ef5f1d74c',out=join(root,'Docs/reports/phase4-completion-2026-10-28/a3'),dir=mkdtempSync(join(tmpdir(),'phase4-a3-'));
const reviewed=JSON.parse(readFileSync(join(out,'light-review.json'))),rows=[],saved=[],counts={cases:0,generations:0,changed:0,roundTrips:0};mkdirSync(out,{recursive:true});
const c=current.getLockControls(),opts=k=>c.find(x=>x.key===k).options,active=k=>opts(k).filter(x=>x.id&&!['none','random'].includes(x.id)&&x.zh!=='全無');
const empty=()=>({...buildAllNoneLocks(c,current.createEmptyLocks()),subjectCount:'1',framingId:active('framingId').find(x=>x.zh.includes('全身鏡頭')).id});
const projected=s=>s.replace(/, no background structure specified/gi,'').replace(/ without generating a stage venue/gi,'').replace(/PAGE3 camera and environment layer/gi,'camera and environment').replace(/real-place guards adapted for the background/gi,'local spatial character').replace(/bare feet as the locked footwear state/gi,'bare feet');
function transformLight(x){
 if(typeof x==='string')return reviewed.reduce((s,r)=>s.replaceAll(r.before,r.after),x);
 if(Array.isArray(x))return x.map(transformLight);
 if(x&&typeof x==='object'){const result=Object.fromEntries(Object.entries(x).map(([k,v])=>[k,transformLight(v)]));const row=reviewed.find(r=>r.id===x.id);if(row&&result.meta)result.meta.legacyPromptAliases=[row.before];return result;}return x;
}
const texts=p=>[p.grokPrompt,p.zImagePrompt,p.midjourneyPrompt,p.nanoBananaPrompt,...p.extraPrompts.map(x=>x.text)];
try{
 execFileSync('tar',['-x','-C',dir],{input:execFileSync('git',['-C',root,'archive',base,'webapp/src','webapp/package.json'],{maxBuffer:128e6})});symlinkSync(join(root,'webapp/node_modules'),join(dir,'webapp/node_modules'),'dir');
 const oldCodec=await import(pathToFileURL(join(dir,'webapp/src/features/saved-cards/cardCodec.js')));
 const old=await import(pathToFileURL(join(dir,'webapp/src/lib/engine.js'))),oldWorld=await import(pathToFileURL(join(dir,'webapp/src/lib/page3WorldScene.js'))),{polishPublicPromptText:polish}=await import(pathToFileURL(join(dir,'webapp/src/lib/engine/publicPromptPolish.js')));
 function run(e,locks,label){let calls=0;const rng=e.createSeededRandom(label),p=e.generatePrompts(1,structuredClone(locks),[],{random:()=>{calls++;return rng();}})[0];counts.generations++;assert.ok(p,label);return {p,calls};}
 function check(label,locks,save=false){const a=run(old,locks,label),b=run(current,locks,label);assert.equal(a.calls,b.calls,label);assert.deepEqual(a.p.selection,b.p.selection,label+':selection');const expected=transformLight(stablePrompt(a.p));for(const k of ['grokPrompt','zImagePrompt','midjourneyPrompt','nanoBananaPrompt'])expected[k]=polish(projected(expected[k]));expected.extraPrompts=expected.extraPrompts.map(x=>({...x,text:polish(projected(x.text))}));assert.deepEqual(stablePrompt(b.p),expected,label);counts.cases++;if(JSON.stringify(texts(a.p))!==JSON.stringify(texts(b.p)))counts.changed++;rows.push({label,locks,before:stablePrompt(a.p),calls:a.calls});if(save)saved.push({label,locks,old:a.p,current:b.p,raw:codec.serializeFavoritePrompt(a.p)});}
 for(const light of active('lightingId'))for(const set of [{id:'none'},...active('fixedCompositionSetId')])check('light:'+light.id+set.id,{...empty(),lightingId:light.id,fixedCompositionSetId:set.id},reviewed.some(r=>r.id===light.id)&&set.id==='none');
 for(const card of active('characterProfileId'))for(const framing of [active('framingId').find(x=>x.zh.includes('全身鏡頭')),active('framingId').find(x=>x.zh==='胸上特寫')])check('card:'+card.id+framing.id,{...empty(),characterProfileId:card.id,framingId:framing.id},card.id==='character-hina');
 for(const l of [...world.WORLD_SCENE_LOCATIONS,...world.SPECIAL_SCENE_LOCATIONS]){const profile={sceneMode:'street-only',worldLocation:l.id,specialLocation:l.id,cameraSystem:'ricoh-gr',ambientLight:'blue-hour-city-glow'},a=oldWorld.buildPage1WorldSceneArchitecture(profile),b=world.buildPage1WorldSceneArchitecture(profile);assert.equal(b.text,projected(a.text));for(const f of [empty().framingId,active('framingId').find(x=>x.zh==='胸上特寫').id])check('world:'+l.id+f,{...empty(),framingId:f,importedWorldSceneMode:'architecture',importedWorldSceneArchitectureText:a.text},l===world.WORLD_SCENE_LOCATIONS[0]);}
 for(const r of reviewed){assert.equal(codec.parseLocksFromStandardPrompt('Lighting:\n'+r.before,c).locks.lightingId,r.id);}
 for(const row of saved)for(const p of [row.old,row.current]){for(const mode of ['json','markdown']){const restore=(co)=>mode==='json'?co.deserializeFavoritePrompt(co.serializeFavoritePrompt(p)):co.parseExportedMarkdownPrompt(co.buildMarkdownExport(p),c,'roundtrip');const restored=restore(codec);assert.deepEqual(texts(restored),texts(p));assert.deepEqual(restored.selection,restore(oldCodec).selection);counts.roundTrips++;}}
 writeFileSync(join(out,'baseline.json.gz'),pack({baseCommit:base,counts,cases:rows,saved}));writeFileSync(join(out,'acceptance.json'),JSON.stringify({baseCommit:base,counts,passed:true},null,2)+'\n');console.log(counts);
}catch(e){writeFileSync(join(out,'failure-'+Date.now()+'.json'),JSON.stringify({message:e.message,stack:e.stack,counts},null,2));throw e;}finally{rmSync(dir,{recursive:true,force:true});}

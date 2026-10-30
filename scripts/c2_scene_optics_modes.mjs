import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {join} from 'node:path';
import * as current from '../webapp/src/lib/engine.js';
import review from './lib/c2SceneOpticsReview.json' with {type:'json'};
import {withPreC2SceneOpticsReplay} from './lib/c2SceneOpticsReplay.mjs';
const controls=current.getLockControls(),empty=current.createEmptyLocks(),fields=['grokPrompt','zImagePrompt','midjourneyPrompt','nanoBananaPrompt','extraPrompts'];
for(const c of controls){const n=c.options.find(o=>o.zh==='全無'||o.id==='none');if(n)empty[c.key]=n.id;}
const full=controls.find(c=>c.key==='framingId').options.find(o=>o.zh==='全身鏡頭 (Full Body Shot)').id;
const modes=controls.find(c=>c.key==='fixedCompositionSetId').options.filter(o=>o.id!=='none'&&o.en!=='none').map(o=>({fixedCompositionSetId:o.id}));
const profile=controls.find(c=>c.key==='characterProfileId').options.find(o=>o.id!=='none'&&o.en!=='none');assert.ok(profile);modes.push({characterProfileId:profile.id});
const project=value=>{let s=JSON.stringify(value);for(const r of review.changes)s=s.split(r.replaceFrom).join(r.replaceTo);return JSON.parse(s);};
let cases=0,differing=0;
await withPreC2SceneOpticsReplay(async dir=>{
 const old=await import(pathToFileURL(join(dir,'webapp/src/lib/engine.js')));
 for(const mode of modes)for(const r of review.changes)for(const subjectCount of ['1','2']){
  const input={...empty,subjectCount,framingId:full,[r.key]:r.id,...mode},seed='c2so-modes:'+cases;
  let beforeCalls=0,afterCalls=0;const bRandom=old.createSeededRandom(seed),aRandom=current.createSeededRandom(seed);
  const [b]=old.generatePrompts(1,input,[],{random:()=>{beforeCalls++;return bRandom();}}),[a]=current.generatePrompts(1,input,[],{random:()=>{afterCalls++;return aRandom();}});
  assert.deepEqual(a.selection,b.selection);assert.equal(afterCalls,beforeCalls);
  const before=Object.fromEntries(fields.map(f=>[f,b[f]])),after=Object.fromEntries(fields.map(f=>[f,a[f]]));assert.deepEqual(after,project(before));if(JSON.stringify(after)!==JSON.stringify(before))differing++;cases++;
 }
});
console.log(JSON.stringify({cases,modes:modes.length,differing,selectionAndRngUnchanged:true}));

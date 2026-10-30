import process from 'node:process';
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync,mkdtempSync,mkdirSync,writeFileSync,rmSync,symlinkSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {getLockControls,createEmptyLocks} from '../engine.js';
import {parseLocksFromStandardPrompt,parseExportedMarkdownPrompt,serializeFavoritePrompt,deserializeFavoritePrompt} from '../../features/saved-cards/cardCodec.js';
import {buildPage1OpticalEffectControl,getRandomOpticalEffectOptions} from './opticalEffectMainPrompt.js';
import review from '../../../../scripts/lib/c2SceneOpticsReview.json' with {type:'json'};
import patches from '../../../../scripts/lib/c2SceneOpticsPatches.json' with {type:'json'};
import {C2_SCENE_OPTICS_ROOT as root,preparePreC2SceneOpticsFiles,preC2SceneOpticsSource} from '../../../../scripts/lib/c2SceneOpticsReplay.mjs';
const controls=getLockControls();
test('C2 scene optics exact three changes and all 29 reviewed records protect metadata and stable IDs',()=>{
 for(const path of new Set(review.changes.map(r=>r.path))){
  const now=JSON.parse(readFileSync(join(root,path))),before=JSON.parse(execFileSync('git',['-C',root,'show',review.base+':'+path]));
  for(const r of review.changes.filter(r=>r.path===path)){
   const e=now.entries.find(e=>e.id===r.id);assert.deepEqual(r.original,before.entries.find(e=>e.id===r.id));assert.equal(e.en,r.after);assert.equal(r.after,r.before.replace(r.replaceFrom,r.replaceTo));
   assert.deepEqual(e.legacyPromptAliases,[...(r.original.legacyPromptAliases||[]),r.before]);e.en=r.before;if(r.original.legacyPromptAliases)e.legacyPromptAliases=r.original.legacyPromptAliases;else delete e.legacyPromptAliases;
  }assert.deepEqual(now,before);
 }
 assert.equal(review.retentions.length,29);
 for(const r of review.retentions){assert.ok(r.reason.trim());const e=JSON.parse(readFileSync(join(root,r.path))).entries.find(e=>e.id===r.id);if(r.decision==='retain')assert.deepEqual(e,r.original);}
});
test('C2 scene optics new and old full English restore IDs and preserve public Markdown and structured selections',()=>{
 for(const r of review.changes){
  for(const en of [r.before,r.after,...(r.original.legacyPromptAliases||[])]){
   assert.equal(parseLocksFromStandardPrompt(en,controls).locks[r.key],r.id);
   const md=`**Summary:** C2 old scene optics\n\n## Gpt\n\`\`\`text\n${en}\n\`\`\`\n\n## AI Prompt\n\`\`\`text\n${en}\n\`\`\``;
   const card=parseExportedMarkdownPrompt(md,controls,'c2-so-old');assert.equal(card.selection[r.key],r.id);assert.equal(card.grokPrompt,en);
  }
  const other=controls.find(c=>c.key===r.key).options.find(o=>o.en!=='none'&&o.id!==r.id);
  for(const subjectCount of ['1','2']){
   const saved=serializeFavoritePrompt({id:'legacy',date:'2026-10-30',source:'page1',grokPrompt:r.before,selection:{...createEmptyLocks(),subjectCount,[r.key]:other.id}}),loaded=deserializeFavoritePrompt(saved);
   assert.equal(loaded.selection[r.key],other.id);assert.equal(loaded.grokPrompt,r.before);assert.equal(loaded.selection.subjectCount,subjectCount);
  }
 }
});
test('C2 scene optics hidden refraction remains restore-only and ordered random pool remains unchanged',()=>{
 const control=controls.find(c=>c.key==='opticalEffectId'),hidden=control.options.filter(o=>/玻璃前景折射|稜鏡折射/.test(o.zh));assert.equal(hidden.length,2);
 assert.equal(buildPage1OpticalEffectControl(control).options.length,18);assert.equal(getRandomOpticalEffectOptions(control.options).length,17);
 for(const h of hidden){assert.ok(!getRandomOpticalEffectOptions(control.options).some(o=>o.id===h.id));assert.equal(buildPage1OpticalEffectControl(control,h.id).options.find(o=>o.id===h.id).disabled,true);assert.equal(parseLocksFromStandardPrompt(h.en,controls).locks.opticalEffectId,h.id);}
});
test('C2 scene optics frozen 644-case matrix keeps selections RNG saved originals and only approved text changes',()=>{
 execFileSync(process.execPath,[join(root,'scripts/c2_scene_optics_acceptance.mjs')],{encoding:'utf8',maxBuffer:32*1024*1024});
});
test('C2 scene optics exact inverse rejects checkout mixed corruption and symlinks atomically',()=>{
 assert.throws(()=>preparePreC2SceneOpticsFiles(root),/isolated/);const dir=mkdtempSync(join(tmpdir(),'c2so-negative-'));
 try{
  for(const f of patches.files){assert.equal(preC2SceneOpticsSource(f.path,readFileSync(join(root,f.path))).toString(),f.beforeSource);assert.equal(f.beforeSource,execFileSync('git',['-C',root,'show',review.base+':'+f.path],{encoding:'utf8',maxBuffer:16*1024*1024}));mkdirSync(dirname(join(dir,f.path)),{recursive:true});writeFileSync(join(dir,f.path),readFileSync(join(root,f.path)));}
  const [first,second]=patches.files,p=join(dir,first.path),other=join(dir,second.path),bytes=readFileSync(other);writeFileSync(p,'corrupt');assert.throws(()=>preparePreC2SceneOpticsFiles(dir),/unknown/);assert.deepEqual(readFileSync(other),bytes);
  rmSync(p);symlinkSync(join(root,first.path),p);assert.throws(()=>preparePreC2SceneOpticsFiles(dir),/linked/);rmSync(p);writeFileSync(p,readFileSync(join(root,first.path)));
  preparePreC2SceneOpticsFiles(dir).apply();for(const f of patches.files)assert.equal(readFileSync(join(dir,f.path),'utf8'),f.beforeSource);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

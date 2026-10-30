import process from 'node:process';
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync,mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {getLockControls,normalizeLocks,createEmptyLocks} from '../engine.js';
import {parseLocksFromStandardPrompt,parseExportedMarkdownPrompt,serializeFavoritePrompt,deserializeFavoritePrompt} from '../../features/saved-cards/cardCodec.js';
import review from '../../../../scripts/lib/c2OutfitReview.json' with {type:'json'};
import patches from '../../../../scripts/lib/c2OutfitPatches.json' with {type:'json'};
import {C2_OUTFIT_ROOT as root,preparePreC2OutfitFiles,preC2OutfitSource} from '../../../../scripts/lib/c2OutfitReplay.mjs';
const controls=getLockControls();
test('C2 outfit exact twenty-row review: one repeated noun only, nineteen records unchanged',()=>{
 const current=JSON.parse(readFileSync(join(root,review.path))),base=JSON.parse(execFileSync('git',['-C',root,'show',review.base+':'+review.path]));
 const targets=base.entries.filter(e=>/styling|silhouette/.test(e.en.split(',').at(-1)));
 assert.deepEqual(review.entries.map(e=>e.id),targets.map(e=>e.id));assert.equal(targets.length,20);
 assert.equal(review.entries.filter(e=>e.decision==='trim').length,1);
 for(const row of review.entries){
  const e=current.entries.find(e=>e.id===row.id);assert.ok(row.reason.trim());assert.deepEqual(row.original,base.entries.find(e=>e.id===row.id));
  assert.equal(e.en,row.after);assert.equal(row.before.slice(0,-row.tailBefore.length),row.after.slice(0,-row.tailAfter.length));
  if(row.decision==='trim'){
   assert.deepEqual(e.legacyPromptAliases,[...(row.original.legacyPromptAliases||[]),row.before]);
   e.en=row.before;if(row.original.legacyPromptAliases)e.legacyPromptAliases=row.original.legacyPromptAliases;else delete e.legacyPromptAliases;
  }else assert.deepEqual(e,row.original);
 }
 assert.deepEqual(current,base,'all other fields, order, IDs and semantics immutable');
});
test('C2 outfit all current and historical aliases restore IDs; Markdown keeps public original',()=>{
 for(const row of review.entries)for(const en of [row.before,row.after,...(row.original.legacyPromptAliases||[])]){
  assert.equal(parseLocksFromStandardPrompt(en,controls).locks.outfitPresetId,row.id);
  const md=`**Summary:** old outfit\n\n## Gpt\n\`\`\`text\n${en}\n\`\`\`\n\n## AI Prompt\n\`\`\`text\n${en}\n\`\`\``;
  const card=parseExportedMarkdownPrompt(md,controls,'c2-outfit-old');assert.equal(card.selection.outfitPresetId,row.id);assert.equal(card.grokPrompt,en);
 }
 const unrelated='a completely unknown garment with no catalog counterpart';assert.ok(!parseLocksFromStandardPrompt(unrelated,controls).locks.outfitPresetId);
 for(const row of review.entries){
  for(const role of ['','A','B']){const k='outfitPreset'+role+'Id';assert.equal(normalizeLocks({[k]:row.id},controls)[k],row.id);}
  const selection={...createEmptyLocks(),subjectCount:'2',outfitPresetAId:row.id,outfitPresetBId:review.entries[0].id};
  const saved=serializeFavoritePrompt({id:'old',date:'2026-10-30',source:'page1',grokPrompt:review.entries[1].before,selection});
  const loaded=deserializeFavoritePrompt(saved);assert.equal(loaded.grokPrompt,review.entries[1].before);assert.equal(loaded.selection.outfitPresetAId,row.id);assert.equal(loaded.selection.outfitPresetBId,review.entries[0].id);
 }
});
test('C2 outfit frozen 1440 cases preserve projected details, colors, A/B, RNG and saved originals',()=>{
 execFileSync(process.execPath,[join(root,'scripts/c2_outfit_acceptance.mjs')],{encoding:'utf8',maxBuffer:32*1024*1024});
});
test('C2 outfit inverse uses fixed Git bytes and rejects checkout or corrupt mixed copy before writes',()=>{
 assert.throws(()=>preparePreC2OutfitFiles(root),/isolated/);assert.ok(patches.files.length>=3);
 const dir=mkdtempSync(join(tmpdir(),'c2-outfit-negative-'));
 try{
  for(const f of patches.files){const bytes=readFileSync(join(root,f.path));assert.equal(preC2OutfitSource(f.path,bytes).toString(),f.beforeSource);assert.equal(f.beforeSource,execFileSync('git',['-C',root,'show',review.base+':'+f.path],{encoding:'utf8',maxBuffer:16*1024*1024}));mkdirSync(dirname(join(dir,f.path)),{recursive:true});writeFileSync(join(dir,f.path),bytes);}
  const f=patches.files[0],p=join(dir,f.path),other=join(dir,patches.files[1].path),bytes=readFileSync(other);
  writeFileSync(p,'unknown');assert.throws(()=>preparePreC2OutfitFiles(dir),/unknown/);assert.deepEqual(readFileSync(other),bytes);
  writeFileSync(p,readFileSync(join(root,f.path)));preparePreC2OutfitFiles(dir).apply();for(const f of patches.files)assert.equal(readFileSync(join(dir,f.path),'utf8'),f.beforeSource);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

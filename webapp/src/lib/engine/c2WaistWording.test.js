import process from 'node:process';
import assert from 'node:assert/strict';
import {preC2OutfitHistoricalTest} from '../../../../scripts/lib/c2OutfitHistoricalTest.mjs';
const test=preC2OutfitHistoricalTest(import.meta.url);
import {readFileSync,mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {join,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {tmpdir} from 'node:os';
import {getLockControls,createEmptyLocks,generatePrompts,createSeededRandom,normalizeLocks} from '../engine.js';
import {parseLocksFromStandardPrompt,serializeFavoritePrompt,deserializeFavoritePrompt,parseExportedMarkdownPrompt} from '../../features/saved-cards/cardCodec.js';
import review from '../../../../scripts/lib/c2WaistReview.json' with {type:'json'};
import patches from '../../../../scripts/lib/c2WaistPatches.json' with {type:'json'};
import {C2_WAIST_ROOT as root,preparePreC2WaistFiles,preC2WaistSource,withPreC2WaistReplay} from '../../../../scripts/lib/c2WaistReplay.mjs';
const controls=getLockControls();
const project=value=>{let s=JSON.stringify(value);for(const r of review.entries)for(const cap of [false,true]){const f=x=>cap?x[0].toUpperCase()+x.slice(1):x;s=s.split(f(r.before)).join(f(r.after));}return JSON.parse(s);};
const outputs=p=>Object.fromEntries(['grokPrompt','zImagePrompt','midjourneyPrompt','nanoBananaPrompt','extraPrompts'].map(k=>[k,p[k]]));
test('C2 only two English sources plus ordered aliases change; three complete records remain',()=>{
 const current=JSON.parse(readFileSync(join(root,review.path))),before=JSON.parse(execFileSync('git',['-C',root,'show',review.base+':'+review.path]));
 for(const [i,row]of review.entries.entries()){
  const entry=current.entries.find(e=>e.id===row.id);assert.equal(entry.en,row.after);
  if(i<2){assert.deepEqual(entry.legacyPromptAliases,[row.before]);entry.en=row.before;delete entry.legacyPromptAliases;}else assert.deepEqual(entry,row.original);
 }
 assert.deepEqual(current,before);
});
test('C2 old and new full English resolve same stable waist IDs; structured choices keep priority',()=>{
 for(const row of review.entries){
  for(const text of [row.before,row.after]){
   assert.equal(parseLocksFromStandardPrompt(text,controls).locks.waistAccessoryId,row.id);
   const markdown=`**Summary:** C2 legacy\n\n## Gpt\n\`\`\`text\n${text}\n\`\`\`\n\n## AI Prompt\n\`\`\`text\n${text}\n\`\`\``;
   const card=parseExportedMarkdownPrompt(markdown,controls,'c2-legacy');assert.equal(card.selection.waistAccessoryId,row.id);assert.equal(card.grokPrompt,text);
  }
  for(const role of ['','A','B']){const key='waistAccessory'+role+'Id';assert.equal(normalizeLocks({[key]:row.id},controls)[key],row.id);}
  const selection={...createEmptyLocks(),subjectCount:'2',waistAccessoryAId:review.entries[2].id,waistAccessoryBId:row.id};
  const saved=serializeFavoritePrompt({id:'old',date:'2026-10-30',source:'page1',grokPrompt:row.before,selection});
  const loaded=deserializeFavoritePrompt(saved);assert.equal(loaded.grokPrompt,row.before);assert.equal(loaded.selection.waistAccessoryAId,review.entries[2].id);assert.equal(loaded.selection.waistAccessoryBId,row.id);
 }
});
test('C2 fixed 360-case baseline protects six outputs, RNG, selections and saved originals',()=>{
 execFileSync(process.execPath,[join(root,'scripts/c2_waist_acceptance.mjs')],{stdio:'pipe'});
});
test('C2 explicit palettes and visible duo crops preserve fixed jewelry colors',async()=>withPreC2WaistReplay(async dir=>{
 const old=await import(pathToFileURL(join(dir,'webapp/src/lib/engine.js')));
 const frames=controls.find(c=>c.key==='framingId').options.filter(o=>o.en!=='none').slice(2,8);
 let count=0;
 for(const row of review.entries)for(const paletteKey of ['completeLookPaletteId','topBottomPaletteId'])for(const frame of frames){
  const option=controls.find(c=>c.key===paletteKey).options.find(o=>o.en&&o.en!=='none'&&!o.random&&o.id!=='random');assert.ok(option);
  const empty=createEmptyLocks();for(const c of controls){const n=c.options.find(o=>o.zh==='全無'||o.id==='none');if(n)empty[c.key]=n.id;}
  const wardrobe=paletteKey==='completeLookPaletteId'?{outfitPresetId:controls.find(c=>c.key==='outfitPresetId').options.find(o=>o.zh.includes('鏈條緞面')).id}:{dressId:controls.find(c=>c.key==='dressId').options.find(o=>o.zh.includes('無袖迷你')).id};
  const locks={...empty,...wardrobe,waistAccessoryId:row.id,[paletteKey]:option.id,framingId:frame.id};
  const [before]=old.generatePrompts(1,locks,[],{random:old.createSeededRandom('c2-palette:'+count)});
  const [after]=generatePrompts(1,locks,[],{random:createSeededRandom('c2-palette:'+count)});
  assert.equal(after.selection[paletteKey],option.id);assert.deepEqual(after.selection,before.selection);assert.deepEqual(outputs(after),project(outputs(before)));count++;
 }
 assert.equal(count,60);
 for(const row of review.entries)for(const role of ['A','B'])for(const frame of frames.slice(-3)){
  const locks={...createEmptyLocks(),subjectCount:'2',framingId:frame.id,['waistAccessory'+role+'Id']:row.id,['waistAccessory'+(role==='A'?'B':'A')+'Id']:review.entries[4].id};
  const seed='c2-duo-visible:'+count;
  const [before]=old.generatePrompts(1,locks,[],{random:old.createSeededRandom(seed)}),[after]=generatePrompts(1,locks,[],{random:createSeededRandom(seed)});
  assert.deepEqual(after.selection,before.selection);assert.deepEqual(outputs(after),project(outputs(before)));count++;
 }
 assert.equal(count,90);
}));
test('C2 exact inverse verifies fixed Git bytes and rejects checkout or corrupt mixed copies atomically',()=>{
 assert.throws(()=>preparePreC2WaistFiles(root),/isolated/);
 const dir=mkdtempSync(join(tmpdir(),'c2-waist-negative-'));
 try{
  for(const f of patches.files){const bytes=readFileSync(join(root,f.path));assert.equal(preC2WaistSource(f.path,bytes).toString(),f.beforeSource);assert.equal(f.beforeSource,execFileSync('git',['-C',root,'show',review.base+':'+f.path],{encoding:'utf8',maxBuffer:16*1024*1024}));mkdirSync(dirname(join(dir,f.path)),{recursive:true});writeFileSync(join(dir,f.path),bytes);}
  const f=patches.files[0],p=join(dir,f.path);writeFileSync(p,'unknown');const remaining=patches.files[1],bytes=readFileSync(join(dir,remaining.path));assert.throws(()=>preparePreC2WaistFiles(dir),/unknown/);assert.deepEqual(readFileSync(join(dir,remaining.path)),bytes);
  writeFileSync(p,readFileSync(join(root,f.path)));preparePreC2WaistFiles(dir).apply();for(const item of patches.files)assert.equal(readFileSync(join(dir,item.path),'utf8'),item.beforeSource);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('C2 historical DLL context is exact, isolated and rejects corruption without partial writes',async()=>{
 const {prepareC2HistoricalContext}=await import('../../../../scripts/lib/c2WaistHistoryContext.mjs');
 assert.throws(()=>prepareC2HistoricalContext(root),/isolated/);
 await withPreC2WaistReplay(async dir=>{
  const plan=prepareC2HistoricalContext(dir);assert.equal(plan.sources.size,8);
  const [path]=plan.sources.keys(),current=readFileSync(join(dir,path));writeFileSync(join(dir,path),'unknown');
  assert.throws(()=>prepareC2HistoricalContext(dir),/unknown/);writeFileSync(join(dir,path),current);
  plan.apply();for(const [p,s]of plan.sources)assert.deepEqual(readFileSync(join(dir,p)),s);
 });
});

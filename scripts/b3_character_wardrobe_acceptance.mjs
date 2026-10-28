// Source-only B3 migration: every public output and resolved selection must remain exact.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, symlinkSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import * as engine from '../webapp/src/lib/engine.js';
import * as lab from '../webapp/src/lib/characterCardLab.js';
import * as codec from '../webapp/src/features/saved-cards/cardCodec.js';
import * as archive from '../webapp/src/features/saved-cards/savedCardArchive.js';
import { resolveCapture, rerollCapture } from '../webapp/src/lib/observationCaptureMode.js';
import { getFullBodyImportSource } from '../webapp/src/lib/observationCaptureImport.js';
import { stablePrompt, sha256, pack } from './lib/catalogBaseline.mjs';
import { B3_ROOT as root, B3_BASE as base, B3_REVIEW } from './lib/b3CharacterWardrobeReplay.mjs';
const out = resolve(process.argv[2] || '/tmp/vps-b3-wardrobe/acceptance');
assert.ok(!out.startsWith(root) || out.startsWith(join(root,'Docs/reports/b3-character-wardrobe-2026-10-28/')), 'Protect historical reports');
mkdirSync(out,{recursive:true});
const git=(...args)=>execFileSync('git',['-C',root,...args],{maxBuffer:256*1024*1024});
const dir=mkdtempSync(join(tmpdir(),'page2-adult-oracle-'));
try {
 execFileSync('tar',['-x','-C',dir],{input:git('archive',base,'webapp/src','webapp/package.json','webapp/package-lock.json','scripts','knowledge_base')});
 symlinkSync(join(root,'webapp/node_modules'),join(dir,'webapp/node_modules'),'dir');
 const load=p=>import(pathToFileURL(join(dir,p)).href);
 const old=await load('webapp/src/lib/engine.js'), oldLab=await load('webapp/src/lib/characterCardLab.js'), oldCodec=await load('webapp/src/features/saved-cards/cardCodec.js'), oldArchive=await load('webapp/src/features/saved-cards/savedCardArchive.js');
 for(const f of B3_REVIEW.files){assert.equal(f.beforeSource,git('show',base+':'+f.path).toString());assert.equal(sha256(readFileSync(join(root,f.path))),f.afterHash);}
 const protectedPaths=git('ls-tree','-r','--name-only',base).toString().trim().split('\n').filter(p=>/^(knowledge_base\/|webapp\/src\/)/.test(p)&&!['webapp/src/lib/characterCardLab.js','webapp/src/lib/engine/characterProfiles.js'].includes(p));
 for(const p of protectedPaths)assert.equal(sha256(readFileSync(join(root,p))),sha256(git('show',base+':'+p)),p);
 const controls=engine.getLockControls(), cards=lab.getCharacterCardOptions(controls),oldCards=oldLab.getCharacterCardOptions(old.getLockControls());
 assert.deepEqual(controls,old.getLockControls());assert.deepEqual(cards,oldCards);assert.equal(cards.length,33);
 const rows=[], saved=[],page1=[],limitations=[];let jsonChecks=0,markdownChecks=0,zipChecks=0;
 const publicValues=p=>[p.grokPrompt,p.zImagePrompt,p.midjourneyPrompt,...p.extraPrompts.map(x=>x.text)];
 const fixedSaved=(l,cs,v,b)=>({...l.buildCharacterCardSavedCard(cs,v,b),id:'page2-'+v.characterProfileId,date:'2026-10-28T00:00:00.000Z'});
 const run=(e,locks,seed)=>{let rngCalls=0;const rng=e.createSeededRandom(seed);return {prompt:stablePrompt(e.generatePrompts(1,structuredClone(locks),[],{random:()=>{rngCalls++;return rng();}})[0]),rngCalls};};
 const comparePage1=(id,locks)=>{const a=run(old,locks,id),b=run(engine,locks,id);assert.deepEqual(b,a,id);page1.push({id,hash:sha256(JSON.stringify(b)),rngCalls:b.rngCalls});return b.prompt;};
 function compare(card,v,label){
  const before=oldLab.buildCharacterCardPromptBundle(oldCards,v),after=lab.buildCharacterCardPromptBundle(cards,v),expected=structuredClone(before);
  assert.deepEqual(after,expected,label);rows.push({label,beforeHash:sha256(JSON.stringify(before)),afterHash:sha256(JSON.stringify(after))});return {before,after};
 }
 for(const card of cards){
  const def=lab.createEmptyCharacterCardVariant([card]);
  const variants=[];
  for(const hair of lab.getCompatibleHairVariants(card))for(const eye of ['default','glasses-on','glasses-off'])for(const mode of ['all','pure','selected'])variants.push({...def,hairVariantId:hair.id,eyewearMode:eye,outputMode:mode==='pure'?'pure-character':'included-wardrobe',includedWardrobeLayers:mode==='selected'?def.includedWardrobeLayers.slice(0,1):def.includedWardrobeLayers});
  for(const layer of def.includedWardrobeLayers)variants.push({...def,includedWardrobeLayers:[layer]});
  variants.push({...def,promptOverrideText:'steady neutral expression, natural photographic detail'});
  for(const [i,v]of variants.entries())compare(card,v,card.id+':'+i);
  const pair=compare(card,def,card.id+':saved');
  for(const [kind,bundle,l,cs]of[['old',pair.before,oldLab,oldCards],['new',pair.after,lab,cards]]){
   const prompt=fixedSaved(l,cs,def,bundle),raw=oldCodec.serializeFavoritePrompt(prompt),original=JSON.stringify(raw);
   const decoded=codec.deserializeFavoritePrompt(raw);assert.deepEqual(decoded,oldCodec.deserializeFavoritePrompt(raw));assert.deepEqual(publicValues(decoded),publicValues(prompt));assert.equal(JSON.stringify(raw),original);jsonChecks++;
   assert.deepEqual(stablePrompt(lab.buildCharacterCardSavedCard(cards,def,bundle)),stablePrompt(oldLab.buildCharacterCardSavedCard(oldCards,def,bundle)));
   const markdown=codec.buildMarkdownExport(prompt);assert.equal(markdown,oldCodec.buildMarkdownExport(prompt));for(const text of publicValues(prompt))assert.ok(markdown.includes(text));markdownChecks++;
   // PAGE2 Markdown uses GPT Prompt, which the pre-existing PAGE1 parser does not accept.
   for(const parser of [codec,oldCodec])assert.throws(()=>parser.parseExportedMarkdownPrompt(markdown,controls,'check'),/missing required markdown sections/);
   const zip=await oldArchive.createSavedCardsArchive([prompt],0,'nodebuffer');
   for(const parser of [archive,oldArchive])await assert.rejects(()=>parser.parseSavedCardsArchive(zip,controls),/missing required markdown sections/);zipChecks++;
   if(kind==='old')saved.push({cardId:card.id,variant:def,before:pair.before,after:pair.after,prompt,raw,markdown});
  }
  const locks=lab.buildPage1LocksFromCharacterCardVariant(engine.createEmptyLocks(),def,cards);
  assert.deepEqual(locks,oldLab.buildPage1LocksFromCharacterCardVariant(old.createEmptyLocks(),def,oldCards));
  for(const frame of controls.find(c=>c.key==='framingId').options)comparePage1(card.id+':'+frame.id,{...locks,framingId:frame.id});
  for(const frame of controls.find(c=>c.key==='framingId').options)comparePage1(card.id+':full-default:'+frame.id,{...engine.createEmptyLocks(),characterProfileId:card.id,characterCardWardrobeMode:'full-default',framingId:frame.id});
  const cap={...resolveCapture({seed:41}).profile,personSource:'card'};
  for(const [i,profile]of[cap,rerollCapture(cap).profile].entries())comparePage1(card.id+':capture:'+i,{...locks,captureMode:'observation',observationCapture:profile});
 }
 for(const subjectCount of ['1','2'])for(let i=0;i<10;i++)comparePage1('ordinary:'+subjectCount+':'+i,{...engine.createEmptyLocks(),subjectCount});
 const full=controls.find(c=>c.key==='framingId').options.find(x=>x.zh.startsWith('全身鏡頭')).id;
 comparePage1('full-body-import-source',{...engine.createEmptyLocks(),framingId:full,subjectCount:'1'});const person=getFullBodyImportSource(engine.generatePrompts(1,{...engine.createEmptyLocks(),framingId:full,subjectCount:'1'},[],{random:engine.createSeededRandom('full-body-import-source')})[0]);assert.ok(person);
 const imported={...resolveCapture({seed:81}).profile,personSource:'full-body',importedPerson:person,availablePerson:person};
 for(const [i,profile]of[imported,rerollCapture(imported).profile].entries())comparePage1('full-body-capture:'+i,{...engine.createEmptyLocks(),captureMode:'observation',observationCapture:profile});
 limitations.push('Existing PAGE2 GPT Prompt Markdown and ZIP import is rejected by both fixed and current parser; export bytes and old JSON text remain preserved. No parser change in this batch.');
 const report={passed:true,baseCommit:base,cards:33,page2Cases:rows.length,allowedChangedOutputs:[],allSixOutputsUnchanged:true,page1Cases:page1.length,rngUnchanged:true,jsonChecks,markdownChecks,zipCompatibilityChecks:zipChecks,protectedFiles:protectedPaths.length,differencesOutsideAllowance:0,limitations};
 writeFileSync(join(out,'baseline.json.gz'),pack({report,rows,page1,saved}));writeFileSync(join(out,'acceptance.json'),JSON.stringify(report,null,2)+'\n');console.log(report);
}finally{rmSync(dir,{recursive:true,force:true});}

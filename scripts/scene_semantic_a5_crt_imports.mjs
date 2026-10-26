// CRT-specific full-body -> observation capture -> saved-card round trips.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import * as current from '../webapp/src/lib/engine.js';
import { CRT_MIDJOURNEY_SELECTIONS, naturalFixtureLocks } from '../webapp/src/lib/engine/midjourneyNaturalFixtures.js';
import { stablePrompt, outputStates, pack, sha256 } from './lib/catalogBaseline.mjs';
import { A5_CRT_REVIEW as r, CRT_ROOT as root, historicalGit as git } from './lib/a5CrtHistoricalReplay.mjs';
const temp=mkdtempSync(join(tmpdir(),'vps-crt-import-oracle-'));
try {
 execFileSync('tar',['-x','-C',temp],{input:git('archive',r.baseCommit,'webapp/src','webapp/package.json')});symlinkSync(join(root,'webapp/node_modules'),join(temp,'webapp/node_modules'),'dir');
 const load=(base,file)=>import(pathToFileURL(join(base,file)).href),old=await load(temp,'webapp/src/lib/engine.js'),oracle=old.getKnowledgeBaseSnapshot();
 Object.values(oracle.Locations).flat().find(x=>x.stableId===r.id).meta.semantic.tags=[...r.afterTags];
 (await load(temp,'webapp/src/lib/engine/runtimeCache.js')).prepareImmutableRuntimeLibrary(oracle);
 const full=current.getLockControls().find(x=>x.key==='framingId').options.find(x=>x.zh.includes('全身')).id;
 const base=naturalFixtureLocks({...CRT_MIDJOURNEY_SELECTIONS,framingId:full});
 const cases=[{id:'manual-swimsuit',locks:base},{id:'random-garments',locks:{...base,topId:'',pantsId:'',outerwearId:'',outerwearFitId:'',outerwearPatternId:'',outerwearOpeningId:'',outerwearStylingId:''}}];
 async function flow(engine,library,directory,input){
  const I=await load(directory,'webapp/src/lib/observationCaptureImport.js'),M=await load(directory,'webapp/src/lib/observationCaptureMode.js'),C=await load(directory,'webapp/src/features/saved-cards/cardCodec.js');
  const gen=(locks,seed)=>engine.generatePrompts(1,locks,library,{random:engine.createSeededRandom(seed)})[0];
  const source=gen(input,'crt-valid-random-0'),snapshot=I.getFullBodyImportSource(source);assert.ok(snapshot);
  const initial=I.importCapturePerson(I.prepareCaptureEntry(M.resolveCapture({seed:41}).profile,source)),profiles=[initial];
  let profile=initial;
  for(let i=0;i<3;i++){profile=M.rerollCapture(profile).profile;assert.deepEqual(profile.importedPerson,snapshot);profiles.push(profile);}
  const replacement=gen(input,'crt-valid-random-1');profile=I.prepareCaptureEntry(profile,replacement);assert.deepEqual(profile.importedPerson,snapshot);profiles.push(profile);
  profile=I.importCapturePerson(profile);assert.deepEqual(profile.importedPerson,I.getFullBodyImportSource(replacement));profiles.push(profile);
  const prompt=gen({...input,captureMode:'observation',observationCapture:initial},'crt-capture');
  assert.equal(prompt.extraPrompts.find(x=>x.id==='full-body-character').text,snapshot.fullBodyPrompt);
  const saved={...stablePrompt(prompt),id:'crt-capture-saved',date:'2026-10-26T00:00:00.000Z'},raw=C.serializeFavoritePrompt(saved),bytes=JSON.stringify(raw),decoded=C.deserializeFavoritePrompt(structuredClone(raw));
  assert.deepEqual(decoded.selection.observationCapture.importedPerson,snapshot);assert.deepEqual(outputStates(decoded),outputStates(saved));assert.equal(JSON.stringify(raw),bytes);
  const controls=engine.getLockControls(library),restored=C.buildRestoreLocks(decoded.selection,controls),reloaded=gen(restored,'crt-reload');assert.equal(reloaded.extraPrompts.find(x=>x.id==='full-body-character').text,snapshot.fullBodyPrompt);
  const markdown=C.buildMarkdownExport(saved),parsed=C.parseExportedMarkdownPrompt(markdown,controls,'crt-markdown');assert.deepEqual(parsed.selection.observationCapture.importedPerson,snapshot);
  return {source:stablePrompt(source),snapshot,profiles,prompt:stablePrompt(prompt),restored:stablePrompt(reloaded),markdown};
 }
 const results=[];
 for(const c of cases){const expected=await flow(old,oracle,temp,c.locks),actual=await flow(current,[],root,c.locks);assert.deepEqual(actual,expected,c.id);results.push({id:c.id,sha256:sha256(JSON.stringify(actual)),result:actual});}
 const report={baseCommit:r.baseCommit,cases:results.length,oracleMismatches:0,rerollsPerCase:3,jsonMarkdownRoundTrips:true,results};
 if(process.argv[2])writeFileSync(resolve(process.argv[2]),pack(report));console.log(JSON.stringify({...report,results:results.map(x=>({id:x.id,sha256:x.sha256}))},null,2));
}finally{rmSync(temp,{recursive:true,force:true});}

// Independent product oracle: pinned Git engine with ONLY the reviewed CRT tag removed.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import * as current from '../webapp/src/lib/engine.js';
import * as codec from '../webapp/src/features/saved-cards/cardCodec.js';
import { transitionPage1Locks } from '../webapp/src/features/page1/lockTransitions.js';
import { CRT_MIDJOURNEY_SELECTIONS, naturalFixtureLocks, midjourneyNaturalFixtures } from '../webapp/src/lib/engine/midjourneyNaturalFixtures.js';
import { stablePrompt, outputStates, differences, sha256, readJson, pack } from './lib/catalogBaseline.mjs';
import { captureImportFlows } from './lib/catalogImportCorpus.mjs';
import { A5_CRT_REVIEW as r, CRT_ROOT as root, historicalGit as git } from './lib/a5CrtHistoricalReplay.mjs';
const temp = mkdtempSync(join(tmpdir(), 'vps-crt-oracle-'));
const find = db => Object.values(db.Locations).flat().find(x => x.stableId === r.id);
const approvedMetadata = value => {
  const copy = structuredClone(value);
  const walk = item => {
    if (!item || typeof item !== 'object') return;
    if ((item.id || item.stableId) === r.id) for (const meta of [item.meta, item.meta?.semantic]) if (meta?.tags) {
      assert.deepEqual(meta.tags, r.beforeTags); meta.tags = [...r.afterTags];
    }
    for (const child of Object.values(item)) walk(child);
  }; walk(copy); return copy;
};
try {
  execFileSync('tar', ['-x', '-C', temp], { input: git('archive', r.baseCommit, 'webapp/src', 'webapp/package.json', 'webapp/package-lock.json', 'scripts', 'knowledge_base') });
  symlinkSync(join(root, 'webapp/node_modules'), join(temp, 'webapp/node_modules'), 'dir');
  const load = file => import(pathToFileURL(join(temp, file)).href);
  const old = await load('webapp/src/lib/engine.js'), oldCodec = await load('webapp/src/features/saved-cards/cardCodec.js');
  const oldTransition = (await load('webapp/src/features/page1/lockTransitions.js')).transitionPage1Locks;
  const { prepareImmutableRuntimeLibrary } = await load('webapp/src/lib/engine/runtimeCache.js');
  const original = old.getKnowledgeBaseSnapshot(), oracle = structuredClone(original);
  assert.deepEqual(find(oracle).meta.semantic.tags, r.beforeTags); find(oracle).meta.semantic.tags = [...r.afterTags];
  assert.deepEqual(current.getKnowledgeBaseSnapshot(), oracle, 'entire database has only one exact tag removal');
  prepareImmutableRuntimeLibrary(oracle);
  const expectedSource = JSON.parse(git('show', r.baseCommit + ':' + r.sourceFile));
  expectedSource.entries.find(x => x.id === r.id).meta.semantic.tags = [...r.afterTags];
  assert.deepEqual(JSON.parse(readFileSync(join(root, r.sourceFile))), expectedSource);
  const allowed = new Set([r.sourceFile, 'webapp/src/data/database.json']);
  const protectedPaths = git('ls-tree','-r','--name-only','-z',r.baseCommit).toString().split('\0').filter(p => p && !p.endsWith('.test.js') && !p.endsWith('/README.md') && /^(knowledge_base\/|webapp\/src\/data\/|webapp\/src\/lib\/|webapp\/src\/features\/)/.test(p));
  for (const p of protectedPaths) if (!allowed.has(p)) assert.equal(sha256(readFileSync(join(root,p))), sha256(git('show',r.baseCommit+':'+p)),p);
  const controls=current.getLockControls(), oldControls=old.getLockControls(), options=k=>controls.find(x=>x.key===k).options;
  const byZh=(k,zh)=>options(k).find(x=>x.zh===zh).id, full=byZh('framingId','全身鏡頭 (Full Body Shot)');
  const locks={...current.createEmptyLocks(),subjectCount:'1',locationId:r.id,sceneAttributeId:'indoor',framingId:full};
  const run=(engine,library,input,seed)=>{let draws=0;const rng=engine.createSeededRandom(seed);const prompt=engine.generatePrompts(1,structuredClone(input),library,{random:()=>{draws++;return rng();}})[0];assert.ok(prompt);return {prompt:stablePrompt(prompt),draws};};
  const comparisons=[],pools=[],savedCards=[],transitions=[];
  function compare(id,input,seed,fixed=false) {
    const before=run(old,[],input,seed),expected=run(old,oracle,input,seed),after=run(current,[],input,seed);
    assert.deepEqual(after,expected,id+': independent oracle mismatch');
    const actualCrt=JSON.stringify(before.prompt).includes(r.id);
    if(!actualCrt) assert.deepEqual(after,before,id+': non-CRT changed');
    if(fixed) assert.deepEqual(after,approvedMetadata(before),id+': fully pinned result changed beyond metadata');
    const changedOutputs=Object.keys(outputStates(before.prompt)).filter(k=>JSON.stringify(outputStates(before.prompt)[k])!==JSON.stringify(outputStates(after.prompt)[k]));
    comparisons.push({id,seed,actualCrt,beforeSha256:sha256(JSON.stringify(before)),afterSha256:sha256(JSON.stringify(after)),rngBefore:before.draws,rngAfter:after.draws,changedOutputs,selectionChanged:JSON.stringify(before.prompt.selection)!==JSON.stringify(after.prompt.selection),changedPaths:differences(before,after).map(x=>x.path)});
    return before.prompt;
  }
  const ids=list=>list.map(x=>x.id);
  for(const frame of options('framingId'))for(const attr of ['none','indoor'])for(const light of ['',...ids(options('lightingId'))]) {
    const input={...locks,framingId:frame.id,sceneAttributeId:attr,lightingId:light};
    const a=old.getSceneDependentOptions([],input),expected=old.getSceneDependentOptions(oracle,input),b=current.getSceneDependentOptions([],input);
    assert.deepEqual(b,expected);
    for(const key of ['locationOptions','lightingOptions'])assert.deepEqual(ids(a[key]),ids(b[key]));
    const added=b.lightDirectionOptions.filter(x=>!ids(a.lightDirectionOptions).includes(x.id));
    assert.ok(added.every(x=>['窗格投影光','百葉窗條紋投影光'].includes(x.zh)));
    assert.deepEqual(ids(a.lightDirectionOptions).filter(x=>!ids(b.lightDirectionOptions).includes(x)),[]);
    assert.deepEqual(ids(a.poseAnchorOptions).filter(x=>!ids(b.poseAnchorOptions).includes(x)),['lying-grass-ground','lying-concrete-ground','lying-sand-ground','lying-clear-sea-surface']);
    assert.deepEqual(ids(b.poseAnchorOptions).filter(x=>!ids(a.poseAnchorOptions).includes(x)),[]);
    pools.push({frame:frame.id,attr,light,addedSubject:ids(added),before: Object.fromEntries(Object.entries(a).map(([k,v])=>[k,v.length])),after:Object.fromEntries(Object.entries(b).map(([k,v])=>[k,v.length]))});
    compare('ambient:'+frame.id+':'+attr+':'+light,input,'crt-ambient');
  }
  for(const frame of options('framingId'))for(const subjectCount of ['1','2']) {
    const manual=naturalFixtureLocks({...CRT_MIDJOURNEY_SELECTIONS,framingId:frame.id,subjectCount}); compare('manual:'+frame.id+subjectCount,manual,'crt-manual',true);
    for(const direction of ['',...ids(options('lightDirectionId'))]) compare('direction:'+frame.id+subjectCount+direction,{...locks,subjectCount,framingId:frame.id,lightDirectionId:direction},'crt-direction');
  }
  for(const key of ['topId','pantsId','outfitPresetId','dressId','outerwearId'])for(const item of options(key)) {
    compare('wardrobe:'+key+item.id,{...naturalFixtureLocks({...CRT_MIDJOURNEY_SELECTIONS,framingId:full}),[key]:item.id},'crt-wardrobe');
  }
  const randomVariants={all:{...locks},top:{...naturalFixtureLocks({...CRT_MIDJOURNEY_SELECTIONS,framingId:full}),topId:''},outerwear:{...naturalFixtureLocks({...CRT_MIDJOURNEY_SELECTIONS,framingId:full}),outerwearId:'',outerwearFitId:'',outerwearPatternId:'',outerwearOpeningId:'',outerwearStylingId:''}};
  for(const [name,input] of Object.entries(randomVariants))for(let n=0;n<100;n++)compare('random:'+name+':'+n,input,'crt-valid-random-'+n);
  for(const base of ['standing','sitting','lying'])for(const orientation of ['', 'lying-supine','lying-prone','lying-side'])for(const anchor of ['', 'lying-grass-ground','lying-concrete-ground','lying-sand-ground','lying-clear-sea-surface'])compare('legacy-pose:'+base+orientation+anchor,{...locks,poseBaseId:base,poseOrientationId:orientation,poseAnchorId:anchor},'crt-legacy');
  const unaffected=options('locationId').filter(x=>x.id!==r.id);
  for(const row of unaffected)for(const frame of [full,byZh('framingId','胸上特寫')])compare('unaffected:'+row.id+frame,{...locks,sceneAttributeId:'none',locationId:row.id,framingId:frame},'crt-unaffected');
  for(const fixture of midjourneyNaturalFixtures())compare('mode:'+fixture.id,fixture.locks,fixture.seed);
  const corpus=readJson(join(root,'webapp/src/lib/engine/catalogBaseline/revisions/2f56438/corpus.json.gz'));
  for(const row of corpus.cases)compare('alignment:'+row.id,row.locks,row.seed);
  const importsBefore=await captureImportFlows(temp,corpus.sources),importsAfter=await captureImportFlows(root,corpus.sources);
  assert.deepEqual(importsAfter,approvedMetadata(importsBefore),'existing import/reimport/reroll corpus');
  for(const light of ['',byZh('lightingId','全無'),byZh('lightingId','高調純白攝影棚'),byZh('lightingId','室內陰雨昏暗天光')])for(const direction of ['',byZh('lightDirectionId','窗格投影光'),byZh('lightDirectionId','百葉窗條紋投影光')]) {
    const input={...naturalFixtureLocks({...CRT_MIDJOURNEY_SELECTIONS,framingId:full}),lightingId:light,lightDirectionId:direction};
    for(const restoringSelection of [false,true]){
      const args={previousLocks:current.createEmptyLocks(),candidateLocks:input,lockControls:oldControls,restoringSelection};
      const before=oldTransition(args),expected=oldTransition({...args,activeLibrary:oracle}),after=transitionPage1Locks({...args,lockControls:controls});assert.deepEqual(after,expected);
      transitions.push({light,direction,restoringSelection,differences:differences(before,after)});
    }
    const saved={...run(old,[],input,'crt-card').prompt,id:'crt-old-'+savedCards.length,date:'2026-10-26T00:00:00.000Z'},raw=oldCodec.serializeFavoritePrompt(saved),bytes=JSON.stringify(raw);
    const oldDecoded=oldCodec.deserializeFavoritePrompt(structuredClone(raw)),decoded=codec.deserializeFavoritePrompt(structuredClone(raw));
    assert.deepEqual(decoded,approvedMetadata(oldDecoded));assert.deepEqual(outputStates(decoded),outputStates(saved));assert.equal(JSON.stringify(raw),bytes);
    const restore=codec.buildRestoreLocks(decoded.selection,controls);assert.deepEqual(restore,oldCodec.buildRestoreLocks(oldDecoded.selection,oldControls));compare('restore:'+saved.id,restore,'crt-restore');
    const markdown=oldCodec.buildMarkdownExport(saved),parsed=codec.parseExportedMarkdownPrompt(markdown,controls,saved.id),oldParsed=oldCodec.parseExportedMarkdownPrompt(markdown,oldControls,saved.id);
    assert.deepEqual(stablePrompt(parsed),approvedMetadata(stablePrompt(oldParsed)));savedCards.push({raw,markdown,parsedLocationId:parsed.selection.locationId});
  }
  assert.ok(comparisons.some(x=>x.changedOutputs.includes('full-body-character')),'must exercise wardrobe cascade');
  assert.ok(comparisons.some(x=>x.rngBefore!==x.rngAfter),'must exercise RNG cascade');
  const report={version:1,baseCommit:r.baseCommit,sourceDelta:differences(original,oracle),protectedFiles:protectedPaths.length,poolCases:pools.length,cases:comparisons.length,outputChangedCases:comparisons.filter(x=>x.changedOutputs.length).length,selectionChangedCases:comparisons.filter(x=>x.selectionChanged).length,rngChangedCases:comparisons.filter(x=>x.rngBefore!==x.rngAfter).length,oracleMismatches:0,unaffectedLocations:unaffected.length,importSources:Object.keys(importsAfter.sources).length,pools,comparisons,savedCards,transitions};
  if(process.argv[2])writeFileSync(resolve(process.argv[2]),pack(report));
  console.log(JSON.stringify({...report,pools:undefined,comparisons:undefined,savedCards:savedCards.length,transitions:transitions.length},null,2));
} finally { rmSync(temp,{recursive:true,force:true}); }

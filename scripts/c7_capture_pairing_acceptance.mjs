import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,mkdirSync,cpSync,symlinkSync,rmSync,existsSync} from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import * as engine from '../webapp/src/lib/engine.js';
import {serializeFavoritePrompt,deserializeFavoritePrompt,buildMarkdownExport,parseExportedMarkdownPrompt} from '../webapp/src/features/saved-cards/cardCodec.js';
import {BASE,REPORT,fixtures,runCase} from './lib/c7CaptureFixtures.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),record=process.argv.includes('--record'),phase=process.argv.includes('--season')?'season':'combined',file=join(root,REPORT,'before.json.gz');
const m=fixtures(engine),hash=x=>createHash('sha256').update(x).digest('hex'),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);let oracle=engine,dir;
if(record){
 assert.ok(!existsSync(file),'Baseline already exists; never overwrite');assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),BASE);
 const original=readFileSync(join(root,'webapp/src/lib/engine.js'),'utf8');assert.equal(original,execFileSync('git',['show',BASE+':webapp/src/lib/engine.js'],{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024}));
 dir=mkdtempSync(join(tmpdir(),'c7-capture-oracle-'));mkdirSync(join(dir,'webapp'));cpSync(join(root,'webapp/src'),join(dir,'webapp/src'),{recursive:true});cpSync(join(root,'webapp/package.json'),join(dir,'webapp/package.json'));symlinkSync(join(root,'webapp/node_modules'),join(dir,'webapp/node_modules'),'dir');
 let s=original;const replace=(a,b)=>{assert.equal(s.split(a).length,2,a);s=s.replace(a,b);};
 replace('  const location = supineSurfaceOnly\n',`  const c7CaptureCheck = (stage,item,extra={}) => !runtimeOptions.c7CaptureReference || runtimeOptions.c7CaptureReference(stage,item,{
    style:findById(runtime.flatCatalog.regional,effectiveLocks.styleId), ambient:findById(runtime.flatCatalog.lighting,effectiveLocks.lightingId),
    subject:findById(runtime.flatCatalog.lightDirection,effectiveLocks.lightDirectionId), shutter:findById(runtime.flatCatalog.shutter,effectiveLocks.shutterId),...extra});
  const location = supineSurfaceOnly\n`);
 replace('(item) => locationMatchesSceneAttribute(item, sceneAttribute),\n      sample,\n      [\'locationId\'],',"(item) => locationMatchesSceneAttribute(item, sceneAttribute) && c7CaptureCheck('location',item),\n      sample,\n      ['locationId'],");
 replace('(item) => styleFitsLocation(item, location),',"(item) => styleFitsLocation(item, location) && c7CaptureCheck('style',item,{location}),");
 replace('const shutter = pickLocked(runtime.flatCatalog.shutter, shutterLockId, () => true, sample, [\'shutterId\']);',"const shutter = pickLocked(runtime.flatCatalog.shutter, shutterLockId, item => c7CaptureCheck('shutter',item,{location,style}), sample, ['shutterId']);");
 replace('&& (!applyNightPartyRandomAmbient || nightPartyAllowsRandomAmbient(location, item)),',"&& (!applyNightPartyRandomAmbient || nightPartyAllowsRandomAmbient(location, item)) && c7CaptureCheck('ambient',item,{location,style}),");
 replace('(item) => lightDirectionSupportsScene(item, framing, locationForLightingCompatibility, lighting),',"(item) => lightDirectionSupportsScene(item, framing, locationForLightingCompatibility, lighting) && c7CaptureCheck('subject',item,{location,style}),");
 writeFileSync(join(dir,'webapp/src/lib/engine.js'),s);oracle=await import(pathToFileURL(join(dir,'webapp/src/lib/engine.js')));
 mkdirSync(join(root,REPORT),{recursive:true});const transform=JSON.stringify({base:BASE,beforeHash:hash(original),oracleHash:hash(s),method:'Original engine and samplers; independent reviewed relation predicates; separate season and combined expectations.'},null,2),transformFile=join(root,REPORT,'oracle-transform.json');if(existsSync(transformFile))assert.equal(readFileSync(transformFile,'utf8'),transform);else writeFileSync(transformFile,transform,{flag:'wx'});
}
try{
 const old=record?null:JSON.parse(gunzipSync(readFileSync(file))),rows=[],stats={base:BASE,record,phase,cases:m.cases.length,seasonChanges:0,combinedChanges:0,locationChanges:0,locationDependentBudgetChanges:0,manualCases:0,excludedCases:0};
 if(old){assert.equal(old.base,BASE);assert.equal(JSON.stringify(m.controls),JSON.stringify(old.controls));assert.deepEqual(m.review,old.review);assert.deepEqual(JSON.parse(JSON.stringify(m.cases)),old.rows.map(x=>x.case));}
 for(const[i,row]of m.cases.entries()){
  const actual=runCase(engine,row,row.custom?m.db:[]),before=record?actual:old.rows[i].before;
  const season=record?runCase(oracle,row,row.custom?m.db:[],'season'):old.rows[i].season||before;
  const combined=record?runCase(oracle,row,row.custom?m.db:[],'combined'):old.rows[i].combined||before;
  for(const expected of [season,combined]){
   const locChanged=before.prompt.selection.locationId!==expected.prompt.selection.locationId;
   if(!locChanged){assert.equal(expected.calls,before.calls,'unchanged scene RNG:'+row.name);assert.deepEqual(expected.prompt.extraPrompts.find(x=>x.id==='full-body-character'),before.prompt.extraPrompts.find(x=>x.id==='full-body-character'),'unchanged scene full body:'+row.name);
    const diffs=Object.keys(before.prompt.selection).filter(k=>!same(before.prompt.selection[k],expected.prompt.selection[k]));assert.ok(diffs.every(k=>['styleId','filmId','opticalEffectId','lightingId','lightDirectionId','shutterId'].includes(k)),row.name+': '+diffs);
   }
   if(!row.eligible||row.name.startsWith('manual-'))assert.deepEqual(expected,before,row.name);
  }
  if(row.name.startsWith('manual-'))stats.manualCases++;if(!row.eligible)stats.excludedCases++;
  if(!same(season,before))stats.seasonChanges++;if(!same(combined,before))stats.combinedChanges++;
  if(before.prompt.selection.locationId!==combined.prompt.selection.locationId)stats.locationChanges++;
  if(before.calls!==combined.calls)stats.locationDependentBudgetChanges++;
  if(record)rows.push({case:row,before,season:same(season,before)?null:season,combined:same(combined,before)?null:combined});else assert.deepEqual(actual,phase==='season'?season:combined,row.name);
 }
 const src=record?rows:old.rows,original=src.find(r=>r.case.input.locationId===m.sunflower&&r.case.input.lightingId===m.winter).before.prompt;
 const saved=record?serializeFavoritePrompt({...original,id:'c7-old-sunflower-winter',date:'2026-10-31'}):old.saved,restored=deserializeFavoritePrompt(saved),roundtrip=serializeFavoritePrompt(restored);
 assert.deepEqual({...roundtrip,l:null},{...saved,l:null});for(const[k,v]of Object.entries(saved.l))assert.deepEqual(roundtrip.l[k],v);
 const imported=parseExportedMarkdownPrompt(buildMarkdownExport(restored),m.controls,'c7-integration-import');for(const k of ['grokPrompt','zImagePrompt','midjourneyPrompt','nanoBananaPrompt'])assert.equal(imported[k],restored[k]);assert.equal(imported.selection.locationId,m.sunflower);assert.equal(imported.selection.lightingId,m.winter);
 if(record)writeFileSync(file,gzipSync(JSON.stringify({base:BASE,controls:m.controls,review:m.review,rows,saved,roundtrip})),{flag:'wx'});else assert.deepEqual(roundtrip,old.roundtrip);
 console.log(JSON.stringify(stats));
}finally{if(dir)rmSync(dir,{recursive:true,force:true});}

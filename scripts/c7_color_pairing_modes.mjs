import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,mkdirSync,cpSync,symlinkSync,rmSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath,pathToFileURL} from 'node:url';
import * as engine from '../webapp/src/lib/engine.js';
import {SPECIFIED_ACTION_LYING_POOL} from '../webapp/src/lib/engine/specifiedActions.js';
import {createSavedCardsArchive,parseSavedCardsArchive} from '../webapp/src/features/saved-cards/savedCardArchive.js';
import {deserializeFavoritePrompt} from '../webapp/src/features/saved-cards/cardCodec.js';
import {BASE,REPORT,fixtures,runCase} from './lib/c7ColorFixtures.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),dir=mkdtempSync(join(tmpdir(),'c7-color-modes-')),m=fixtures(engine),opts=k=>m.controls.find(c=>c.key===k).options;
const report={base:BASE,cases:0,randomLying:0,allRandomBudgetsPreserved:true,zipOriginalPreserved:false};
try{
 mkdirSync(join(dir,'webapp'));cpSync(join(root,'webapp/src'),join(dir,'webapp/src'),{recursive:true});cpSync(join(root,'webapp/package.json'),join(dir,'webapp/package.json'));symlinkSync(join(root,'webapp/node_modules'),join(dir,'webapp/node_modules'),'dir');
 writeFileSync(join(dir,'webapp/src/lib/engine.js'),execFileSync('git',['-C',root,'show',BASE+':webapp/src/lib/engine.js'],{maxBuffer:16*1024*1024}));
 const before=await import(pathToFileURL(join(dir,'webapp/src/lib/engine.js'))),bed=opts('locationId').find(o=>o.zh==='其他：白色床鋪').id;
 for(const action of SPECIFIED_ACTION_LYING_POOL)for(let i=0;i<4;i++){
  const row={name:'lying:'+action.id+':'+i,input:{...m.base,locationId:bed,specifiedActionId:action.id,lyingCameraId:i%2?'random':'lying-overhead',styleId:i%2?m.monoStyle:'',filmId:i%2?'':m.monoFilm},seed:'c7-lying:'+i};
  assert.deepEqual(runCase(engine,row),runCase(before,row),row.name);report.cases++;
 }
 for(let i=0;i<80;i++){
  const row={name:'random-action:'+i,input:{...m.base,locationId:bed,specifiedActionId:'random',styleId:m.monoStyle,filmId:'',topId:''},seed:'c7-action:'+i};
  const a=runCase(engine,row),b=runCase(before,row);assert.equal(a.calls,b.calls);assert.deepEqual(a.prompt.extraPrompts.find(x=>x.id==='full-body-character'),b.prompt.extraPrompts.find(x=>x.id==='full-body-character'));
  if(b.prompt.selection.specifiedActionId?.startsWith('specified-lying-')){assert.deepEqual(a,b);report.randomLying++;}report.cases++;
 }
 assert.ok(report.randomLying>0);
 for(const profile of opts('cameraSystemId').filter(o=>o.id!=='none'))for(const filmId of [m.colorFilm,opts('filmId')[0].id]){
  const raw={...m.base,styleId:m.monoStyle,filmId,cameraSystemId:profile.id},normalized=engine.normalizeLocks(raw);
  assert.deepEqual(normalized,before.normalizeLocks(raw));assert.equal(normalized.filmId,filmId);
  const row={name:'legacy precedence',input:normalized,seed:'profile:'+profile.id};assert.deepEqual(runCase(engine,row),runCase(before,row));report.cases++;
 }
 const saved=JSON.parse(gunzipSync(readFileSync(join(root,REPORT,'before.json.gz')))).saved,old=deserializeFavoritePrompt(saved);
 const archive=await createSavedCardsArchive([old],0,'uint8array'),[restored]=await parseSavedCardsArchive(archive,m.controls);
 for(const k of ['grokPrompt','zImagePrompt','midjourneyPrompt','nanoBananaPrompt'])assert.equal(restored[k],old[k]);
 assert.deepEqual(restored.extraPrompts,old.extraPrompts);assert.equal(restored.selection.styleId,old.selection.styleId);assert.equal(restored.selection.filmId,old.selection.filmId);report.zipOriginalPreserved=true;
 console.log(JSON.stringify(report));
}finally{rmSync(dir,{recursive:true,force:true});}

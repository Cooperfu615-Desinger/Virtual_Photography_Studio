import process from 'node:process';
import assert from 'node:assert/strict';
import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdtempSync,mkdirSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {preparePreC7NightLightingFiles} from '../../../../scripts/lib/c7NightLightingReplay.mjs';
import patch from '../../../../scripts/lib/c7NightLightingPatch.json' with {type:'json'};
import {gunzipSync} from 'node:zlib';
import * as engine from '../engine.js';
import {transitionPage1Locks} from '../../features/page1/lockTransitions.js';
import {NIGHT_SCENE,DAY_LIGHTS,fixtures,runCase} from '../../../../scripts/lib/c7NightLightingFixtures.mjs';
const root=new URL('../../../../',import.meta.url),matrix=fixtures(engine);
const before=JSON.parse(gunzipSync(readFileSync(new URL('Docs/reports/c7-night-lighting-2026-10-31/before.json.gz',root))));

test('C7 night-party random ambient excludes exactly six reviewed daylight sources',()=>{
 const seen=new Set();
 for(let i=0;i<200;i++){
  const p=runCase(engine,{name:'random '+i,input:matrix.base,seed:'c7-random:'+i}).prompt;
  assert.equal(p.selection.locationId,NIGHT_SCENE);
  assert.equal(DAY_LIGHTS.includes(p.selection.lightingId),false,p.selection.lightingId);
  seen.add(p.selection.lightingId);
 }
 const expected=matrix.menu.lightingOptions.filter(o=>o.zh!=='全無'&&!DAY_LIGHTS.includes(o.id)).map(o=>o.id);
 assert.deepEqual([...seen].sort(),expected.sort());assert.equal(seen.size,9);
});

test('C7 controls, source text, daylight/manual/none transitions and unrelated subject light stay unchanged',()=>{
 assert.deepEqual(JSON.parse(JSON.stringify(engine.getLockControls())),before.controls);
 const menu=engine.getSceneDependentOptions([],matrix.base);assert.deepEqual(menu,before.menu);assert.equal(menu.lightingOptions.length,16);
 const previous={...matrix.base,locationId:matrix.controls.find(c=>c.key==='locationId').options.find(o=>o.zh==='全無').id};
 for(const lightingId of [...DAY_LIGHTS,menu.lightingOptions.find(o=>o.zh==='全無').id]){
  const locks=transitionPage1Locks({previousLocks:{...previous,lightingId},candidateLocks:{...matrix.base,lightingId},lockControls:matrix.controls});
  assert.equal(locks.lightingId,lightingId);
  assert.equal(runCase(engine,{name:'manual',input:locks,seed:'manual'}).prompt.selection.lightingId,lightingId);
 }
 const light=matrix.controls.find(c=>c.key==='lightDirectionId').options.find(o=>o.zh==='冷白日光色溫');assert.ok(light);
 const p=runCase(engine,{name:'subject daylight temperature',input:{...matrix.base,lightDirectionId:light.id},seed:'subject'}).prompt;
 assert.equal(p.selection.lightDirectionId,light.id);
});

test('C7 custom-library compilation never contaminates the default runtime',()=>{
 for(let i=0;i<8;i++){
  const row={name:'cache isolation',input:matrix.base,seed:'cache:'+i};
  const first=runCase(engine,row);runCase(engine,row,matrix.db);runCase(engine,row,matrix.filtered);
  assert.deepEqual(runCase(engine,row),first);
 }
});

test('C7 sealed pre-change matrix allows only the independently recorded random-pool change',()=>{
 const result=execFileSync(process.execPath,['scripts/c7_night_lighting_acceptance.mjs'],{cwd:root,encoding:'utf8',maxBuffer:1024*1024});
 const report=JSON.parse(result);assert.equal(report.record,false);assert.ok(report.cases>800);assert.ok(report.changed>0);
});

test('C7 history inverse reproduces trusted Git, rejects checkout/linked/unknown source, and is idempotent',()=>{
 assert.throws(()=>preparePreC7NightLightingFiles(fileURLToPath(root)),/isolated/);
 const dir=mkdtempSync(join(tmpdir(),'c7-inverse-test-')),path=join(dir,patch.path);
 const current=readFileSync(new URL(patch.path,root));
 assert.equal(createHash('sha256').update(current).digest('hex'),patch.afterHash);
 try{
  mkdirSync(dirname(path),{recursive:true});writeFileSync(path,current.toString()+'\n// unknown');
  assert.throws(()=>preparePreC7NightLightingFiles(dir),/unknown or mixed/);
  rmSync(path);symlinkSync(fileURLToPath(new URL(patch.path,root)),path);
  assert.throws(()=>preparePreC7NightLightingFiles(dir),/linked/);rmSync(path);writeFileSync(path,current);
  preparePreC7NightLightingFiles(dir).apply();
  const original=execFileSync('git',['show',patch.base+':'+patch.path],{cwd:root,maxBuffer:16*1024*1024});
  assert.deepEqual(readFileSync(path),original);preparePreC7NightLightingFiles(dir).apply();assert.deepEqual(readFileSync(path),original);
  mkdirSync(join(dir,'.git'));assert.throws(()=>preparePreC7NightLightingFiles(dir),/Git checkout/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

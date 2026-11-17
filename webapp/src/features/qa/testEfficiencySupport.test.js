import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';
import { createTestRunContext, sharedTestJson, testRunDirectory, createTestProgress, watchTestProgress } from '../../../../scripts/lib/testRunContext.mjs';
import { createPlannedFixtureReuse, seatRequestKey, withSeatFixtureReuse, enableSeatFixtureReuse } from '../../lib/engine/seatFixtureReuseTestSupport.js';

function setup(run) { const root=mkdtempSync(join(tmpdir(),'vps-efficiency-test-')), context=createTestRunContext(root);try{return run(root,context);}finally{context.cleanup();rmSync(root,{recursive:true,force:true});} }

test('per-run snapshot shares only matching source identity, clones each result and rejects corruption',()=>setup((root,c)=>{
 let calls=0;const build=()=>{calls++;return {x:['first']};};const options={env:c.env};
 const first=sharedTestJson(root,'source-a',build,options);first.x.push('mutated');
 assert.deepEqual(sharedTestJson(root,'source-a',build,options),{x:['first']});assert.equal(calls,1);
 assert.throws(()=>sharedTestJson(root,'source-b',build,options),/integrity mismatch/);
 writeFileSync(join(c.directory,'pre-lawson.json'),JSON.stringify({identity:'source-a',json:'{}',hash:'bad'}));
 assert.throws(()=>sharedTestJson(root,'source-a',build,options),/integrity mismatch/);
}));

test('snapshot ownership, historical copies, separate invocations and failed builds never share results',()=>setup((root,c)=>{
 assert.equal(testRunDirectory(root,{...c.env,VPS_TEST_RUN_TOKEN:'wrong'}),null);
 assert.equal(testRunDirectory(tmpdir(),c.env),null);
 let calls=0;const build=()=>{calls++;return {ok:true};};
 sharedTestJson(root,'a',build,{env:{}});sharedTestJson(root,'a',build,{env:{}});assert.equal(calls,2);
 assert.throws(()=>sharedTestJson(root,'a',()=>{throw Error('build failed')},{env:c.env}),/build failed/);
 assert.deepEqual(sharedTestJson(root,'a',build,{env:c.env}),{ok:true});assert.equal(calls,3);
 const other=createTestRunContext(root);try{sharedTestJson(root,'a',build,{env:other.env});assert.equal(calls,4);}finally{other.cleanup();}
}));

test('concurrent native workers publish one complete snapshot',async()=>{
 const root=mkdtempSync(join(tmpdir(),'vps-efficiency-workers-')),c=createTestRunContext(root);
 const module=new URL('../../../../scripts/lib/testRunContext.mjs',import.meta.url).href;
 const script=`import {sharedTestJson} from ${JSON.stringify(module)};import {writeFileSync} from 'node:fs';const value=sharedTestJson(${JSON.stringify(root)},'same',()=>{writeFileSync(${JSON.stringify(join(root,'once'))},'once',{flag:'wx'});Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,100);return {rows:Array(100).fill('complete')};});console.log(JSON.stringify(value));`;
 const worker=()=>new Promise((resolve,reject)=>{const p=spawn(process.execPath,['--input-type=module','-e',script],{env:{...c.env,NODE_TEST_CONTEXT:undefined}});let out='',err='';p.stdout.on('data',d=>out+=d);p.stderr.on('data',d=>err+=d);p.once('error',reject);p.once('exit',code=>code?reject(Error(err)):resolve(JSON.parse(out)));});
 try { const [a,b]=await Promise.all([worker(),worker()]);assert.deepEqual(a,b);assert.equal(a.rows.length,100);assert.equal(readFileSync(join(root,'once'),'utf8'),'once'); }
 finally{c.cleanup();rmSync(root,{recursive:true,force:true});}
});

test('progress reports actual counts and elapsed time rather than a timer heartbeat',()=>{
 let now=0;const rows=[];const p=createTestProgress('matrix',10,{clock:()=>now,emit:r=>rows.push(r),intervalMs:5});
 p.tick(2);assert.equal(rows.length,1);now=6;p.tick(4);p.finish();
 assert.deepEqual(rows.map(r=>[r.state,r.completed]),[['start',0],['progress',4],['complete',4]]);
 assert.equal(rows[1].elapsedMs,6);assert.equal(rows[1].total,10);
});

test('outer runner forwards completed progress without altering native TAP output',()=>setup((_root,c)=>{
 let text='';const stop=watchTestProgress(c.directory,s=>text+=s);
 writeFileSync(join(c.directory,'progress.jsonl'),JSON.stringify({label:'probe',state:'progress',completed:2,total:3,elapsedMs:5000,rssBytes:1048576})+'\n');stop();
 assert.match(text,/probe: progress 2\/3; 5.0s; RSS 1.0 MiB/);
}));

test('planned fixture cache keeps clones, releases its last consumer, and never caches failures or unplanned requests',()=>{
 const key=seatRequestKey('room','pose','frame',{nested:{x:1}}),memo=createPlannedFixtureReuse(new Map([[key,3]]));let calls=0;
 const generate=()=>{calls++;return {value:{x:1},optional:undefined};};
 const first=memo.run(key,generate);first.value.x=9;const next=memo.run(key,generate);assert.equal(next.value.x,1);next.value.x=8;
 assert.equal(memo.run(key,generate).value.x,1);assert.equal(calls,1);assert.equal(memo.statistics().hits,2);assert.equal(memo.statistics().retainedBytes,0);
 memo.run(key,generate);assert.equal(calls,2);
 const changed=seatRequestKey('room','pose','frame',{nested:{x:2}});memo.run(changed,generate);memo.run(changed,generate);assert.equal(calls,4);
 const failed=createPlannedFixtureReuse(new Map([['x',2]]));assert.throws(()=>failed.run('x',()=>{throw Error('failure')}),/failure/);assert.equal(failed.statistics().generations,0);
 failed.run('x',generate);failed.run('x',generate);assert.equal(failed.statistics().hits,1);
});

test('ordinary and restore fixture calls remain uncached outside an explicit suite session',()=>{
 let n=0;const generate=()=>++n;withSeatFixtureReuse('r','p','f',{},generate);withSeatFixtureReuse('r','p','f',{},generate);assert.equal(n,2);
 const session=enableSeatFixtureReuse(new Map([[seatRequestKey('r','p','f'),2]]));
 try{assert.equal(withSeatFixtureReuse('r','p','f',{},generate),3);assert.equal(withSeatFixtureReuse('r','p','f',{},generate),3);assert.throws(()=>enableSeatFixtureReuse(new Map()),/already active/);}finally{session.stop();}
 assert.equal(withSeatFixtureReuse('r','p','f',{},generate),4);
});


test('abandoned snapshot ownership times out instead of hanging or fabricating a result',()=>setup((root,c)=>{
 mkdirSync(join(c.directory,'pre-lawson.lock'));
 assert.throws(()=>sharedTestJson(root,'a',()=>({}),{env:c.env,timeoutMs:1}),/Timed out/);
}));

test('compressed reuse reports real completed work at bounded checkpoints',()=>{
 const reports=[],memo=createPlannedFixtureReuse(new Map(),s=>reports.push(s));
 for(let n=0;n<1001;n++)memo.run('uncached',()=>n);
 assert.deepEqual(reports.map(r=>r.generations),[500,1000]);assert.ok(reports.every(r=>r.hits===0));
});

test('CLI streams progress while a synchronous test is still running and cleans its run directory',async()=>{
 const root=new URL('../../../../',import.meta.url),directory=mkdtempSync(join(tmpdir(),'vps-live-progress-'));
 const script=new URL('scripts/lib/testRunContext.mjs',root).href;
 const fixture=join(directory,'live.test.mjs');
 writeFileSync(fixture,`import {test} from 'node:test';import {writeFileSync} from 'node:fs';import process from 'node:process';import {createTestProgress} from ${JSON.stringify(script)};test('live',()=>{writeFileSync(${JSON.stringify(join(directory,'owned'))},process.env.VPS_TEST_RUN_DIRECTORY);const p=createTestProgress('live-probe',2,{root:${JSON.stringify(root.pathname)},intervalMs:1});p.tick(1);Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,1200);p.tick(2);p.finish();});`);
 let output='',errors='',seenBeforeExit=false,exited=false;
 try{
  const child=spawn(process.execPath,[new URL('scripts/run_webapp_tests.mjs',root).pathname,fixture],{env:{...process.env,NODE_TEST_CONTEXT:undefined}});
  child.stdout.on('data',d=>output+=d);child.stderr.on('data',d=>{errors+=d;if(errors.includes('live-probe: start')&&!exited)seenBeforeExit=true;});
  const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',code=>{exited=true;resolve(code);});});
  assert.equal(code,0,errors+output);assert.ok(seenBeforeExit);assert.match(errors,/live-probe: complete 2\/2/);
  assert.throws(()=>readFileSync(join(readFileSync(join(directory,'owned'),'utf8'),'owner.json')),/ENOENT/);
 }finally{rmSync(directory,{recursive:true,force:true});}
});


test('reuse keys distinguish omitted, undefined, null and non-finite override values',()=>{
 const keys=[{}, {locationId:undefined},{locationId:null},{locationId:NaN},{locationId:Infinity},{locationId:''}].map(patch=>seatRequestKey('room','pose','frame',patch));
 assert.equal(new Set(keys).size,keys.length);
 assert.notEqual(seatRequestKey('room','pose','frame',{nested:{x:undefined}}),seatRequestKey('room','pose','frame',{nested:{}}));
});

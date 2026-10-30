import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {createEmptyLocks,createSeededRandom,generatePrompts,getLockControls,normalizeLocks} from '../webapp/src/lib/engine.js';
import {serializeFavoritePrompt,deserializeFavoritePrompt,parseLocksFromStandardPrompt} from '../webapp/src/features/saved-cards/cardCodec.js';
import review from './lib/c2WaistReview.json' with {type:'json'};
const file=new URL('../Docs/reports/c2-waist-2026-10-30/before.json.gz',import.meta.url),record=process.argv.includes('--record');
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex'),controls=getLockControls();
const before=record?null:JSON.parse(gunzipSync(readFileSync(file))),rows=[];
const frames=controls.find(c=>c.key==='framingId').options.filter(x=>x.en!=='none').slice(0,6);
const fields=['grokPrompt','zImagePrompt','midjourneyPrompt','nanoBananaPrompt','extraPrompts'];
const project=x=>{let s=JSON.stringify(x);for(const r of review.entries){s=s.split(r.before).join(r.after);const cap=x=>x[0].toUpperCase()+x.slice(1);s=s.split(cap(r.before)).join(cap(r.after));}return JSON.parse(s);};
for(const row of review.entries)for(const role of ['','A','B'])for(const frame of frames)for(const variant of ['plain','default-second-seed','coat','other-person']){
 const i=rows.length,locks={...createEmptyLocks(),subjectCount:role?'2':'1',framingId:frame.id,['waistAccessory'+role+'Id']:row.id};
 if(variant==='coat'){const k='outerwear'+role+'Id';locks[k]=controls.find(c=>c.key===k).options.find(o=>o.en&&o.en!=='none').id;}
 if(variant==='other-person'&&role)locks['waistAccessory'+(role==='A'?'B':'A')+'Id']=review.entries[4].id;
 const random=createSeededRandom('c2w:'+i);let calls=0;const[p]=generatePrompts(1,locks,[],{random:()=>{calls++;return random();}});
 const outputs=Object.fromEntries(fields.map(k=>[k,p[k]])),saved=serializeFavoritePrompt({...p,id:'c2w-'+i,date:'2026-10-30'});
 const old=before?.rows[i]?.saved||saved,loaded=deserializeFavoritePrompt(old);
 const r={input:locks,selection:p.selection,outputs,calls,saved:old,roundtrip:hash(serializeFavoritePrompt(loaded)),normalized:normalizeLocks(locks,controls)};
 if(before){assert.deepEqual(r.input,before.rows[i].input);assert.deepEqual(r.selection,before.rows[i].selection);assert.equal(calls,before.rows[i].calls);assert.deepEqual(r.normalized,before.rows[i].normalized);assert.equal(r.roundtrip,before.rows[i].roundtrip);for(const k of fields)assert.deepEqual(loaded[k],before.rows[i].outputs[k]);assert.deepEqual(outputs,project(before.rows[i].outputs),`case ${i}: approved complete-source replacements only`);}
 rows.push(r);
}
if(record)writeFileSync(file,gzipSync(JSON.stringify({base:review.base,rows})),{flag:'wx'});
else for(const r of review.entries)for(const text of [r.before,r.after])assert.equal(parseLocksFromStandardPrompt(text,controls).locks.waistAccessoryId,r.id);
console.log(JSON.stringify({cases:rows.length,record}));

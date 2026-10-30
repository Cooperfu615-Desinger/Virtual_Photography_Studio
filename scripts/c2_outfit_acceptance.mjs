import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createEmptyLocks,createSeededRandom,generatePrompts,getLockControls,normalizeLocks} from '../webapp/src/lib/engine.js';
import {serializeFavoritePrompt,deserializeFavoritePrompt,parseLocksFromStandardPrompt} from '../webapp/src/features/saved-cards/cardCodec.js';
import review from './lib/c2OutfitReview.json' with {type:'json'};
const file=new URL('../Docs/reports/c2-outfit-tails-2026-10-30/before.json.gz',import.meta.url),record=process.argv.includes('--record');
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex'),controls=getLockControls();
if(record){const path=new URL('../'+review.path,import.meta.url);assert.equal(readFileSync(path,'utf8'),execFileSync('git',['show',review.base+':'+review.path],{encoding:'utf8'}),'Record only trusted unchanged source');}
const before=record?null:JSON.parse(gunzipSync(readFileSync(file))),rows=[];
const labels=['臉部特寫','特寫鏡頭 (Close-Up)','胸上特寫','中景鏡頭 (Medium Shot)','牛仔中景 (Cowboy Shot)','全身鏡頭 (Full Body Shot)'];
const frames=labels.map(zh=>{const o=controls.find(c=>c.key==='framingId').options.find(x=>x.zh===zh);assert.ok(o,zh);return o;});
const fields=['grokPrompt','zImagePrompt','midjourneyPrompt','nanoBananaPrompt','extraPrompts'];
const project=x=>{let s=JSON.stringify(x);for(const r of review.entries.filter(r=>r.decision==='trim'))for(const cap of [false,true]){const f=x=>cap?x[0].toUpperCase()+x.slice(1):x;s=s.split(f(r.tailBefore)).join(f(r.tailAfter));}return JSON.parse(s);};
const empty=createEmptyLocks();for(const c of controls){const n=c.options.find(o=>o.zh==='全無'||o.id==='none');if(n)empty[c.key]=n.id;}
for(const row of review.entries)for(const role of ['','A','B'])for(const frame of frames)for(const variant of ['plain','colors','palette','coat']){
 const i=rows.length,locks={...empty,subjectCount:role?'2':'1',framingId:frame.id,['outfitPreset'+role+'Id']:row.id};
 if(role)locks['outfitPreset'+(role==='A'?'B':'A')+'Id']=review.entries[(review.entries.indexOf(row)+1)%20].id;
 if(variant==='colors'){locks['outfitPreset'+role+'PrimaryColorId']='red';locks['outfitPreset'+role+'ContrastColorId']='white';}
 if(variant==='palette')locks['completeLookPalette'+role+'Id']='black-red-street';
 if(variant==='coat'){const k='outerwear'+role+'Id';locks[k]=controls.find(c=>c.key===k).options.find(o=>o.zh==='西裝外套').id;}
 const random=createSeededRandom('c2o:'+i);let calls=0;const[p]=generatePrompts(1,locks,[],{random:()=>{calls++;return random();}});
 if(frame.zh==='全身鏡頭 (Full Body Shot)')assert.equal(p.selection['outfitPreset'+role+'Id'],row.id,'Visible case must exercise selected preset');
 if(variant==='palette'&&frame.zh==='全身鏡頭 (Full Body Shot)')assert.equal(p.selection['completeLookPalette'+role+'Id'],'black-red-street');
 if(variant==='colors'&&frame.zh==='全身鏡頭 (Full Body Shot)'){assert.equal(p.selection['outfitPreset'+role+'PrimaryColorId'],'red');assert.equal(p.selection['outfitPreset'+role+'ContrastColorId'],'white');}
 const outputs=Object.fromEntries(fields.map(k=>[k,p[k]])),saved=serializeFavoritePrompt({...p,id:'c2o-'+i,date:'2026-10-30'});
 const old=before?.rows[i]?.saved||saved,loaded=deserializeFavoritePrompt(old);
 const item={input:locks,selection:p.selection,outputs,calls,saved:old,roundtrip:hash(serializeFavoritePrompt(loaded)),normalized:normalizeLocks(locks,controls)};
 if(before){assert.deepEqual(item.input,before.rows[i].input);assert.deepEqual(item.selection,before.rows[i].selection);assert.equal(calls,before.rows[i].calls);assert.deepEqual(item.normalized,before.rows[i].normalized);assert.equal(item.roundtrip,before.rows[i].roundtrip);for(const k of fields)assert.deepEqual(loaded[k],before.rows[i].outputs[k]);assert.deepEqual(outputs,project(before.rows[i].outputs),`case ${i}: only reviewed tail replacements`);}
 rows.push(item);
}
if(record)writeFileSync(file,gzipSync(JSON.stringify({base:review.base,rows})),{flag:'wx'});
else for(const r of review.entries)for(const text of [r.before,r.after,...(r.original.legacyPromptAliases||[])])assert.equal(parseLocksFromStandardPrompt(text,controls).locks.outfitPresetId,r.id);
console.log(JSON.stringify({cases:rows.length,record,frames:labels,roles:['single','A','B'],variants:['plain','colors','palette','coat']}));

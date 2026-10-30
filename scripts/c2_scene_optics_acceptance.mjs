import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import {createEmptyLocks,createSeededRandom,generatePrompts,getLockControls,normalizeLocks} from '../webapp/src/lib/engine.js';
import {serializeFavoritePrompt,deserializeFavoritePrompt} from '../webapp/src/features/saved-cards/cardCodec.js';
import review from './lib/c2SceneOpticsReview.json' with {type:'json'};
const record=process.argv.includes('--record'),file=new URL('../Docs/reports/c2-scene-optics-2026-10-30/before.json.gz',import.meta.url);
if(record)for(const path of new Set(review.changes.map(r=>r.path)))assert.equal(readFileSync(new URL('../'+path,import.meta.url),'utf8'),execFileSync('git',['show',review.base+':'+path],{encoding:'utf8'}));
const before=record?null:JSON.parse(gunzipSync(readFileSync(file))),controls=getLockControls(),rows=[];
const option=(key,zh)=>{const x=controls.find(c=>c.key===key).options.find(o=>o.zh===zh);assert.ok(x,key+':'+zh);return x.id;};
const fields=['grokPrompt','zImagePrompt','midjourneyPrompt','nanoBananaPrompt','extraPrompts'];
const project=value=>{let s=JSON.stringify(value);for(const r of review.changes)s=s.split(r.replaceFrom).join(r.replaceTo);return JSON.parse(s);};
const empty=createEmptyLocks();for(const c of controls){const n=c.options.find(o=>o.zh==='全無'||o.id==='none');if(n)empty[c.key]=n.id;}
const frames=['臉部特寫','特寫鏡頭 (Close-Up)','胸上特寫','中景鏡頭 (Medium Shot)','牛仔中景 (Cowboy Shot)','全身鏡頭 (Full Body Shot)'];
const angles=['高位俯視鏡頭','平視高度鏡頭','地面高度鏡頭','蟲眼視角鏡頭'];
function run(locks,key,id,label){
 const i=rows.length,random=createSeededRandom('c2so:'+i);let calls=0;
 const[p]=generatePrompts(1,locks,[],{random:()=>{calls++;return random();}});assert.equal(p.selection[key],id,'case must exercise target: '+label);
 const outputs=Object.fromEntries(fields.map(k=>[k,p[k]]));
 const saved=before?.rows[i]?.saved||serializeFavoritePrompt({...p,id:'c2so-'+i,date:'2026-10-30'}),loaded=deserializeFavoritePrompt(saved);
 const row={label,key,id,input:locks,selection:p.selection,normalized:normalizeLocks(locks,controls),calls,outputs,saved,roundtrip:serializeFavoritePrompt(loaded)};
 if(before){const old=before.rows[i];assert.deepEqual({...row,outputs:null}, {...old,outputs:null},'stable state '+i);assert.deepEqual(outputs,project(old.outputs),'reviewed text only '+i+' '+label);for(const k of fields)assert.deepEqual(loaded[k],old.outputs[k]);}
 rows.push(row);
}
for(const r of review.changes)for(const subjectCount of ['1','2'])for(const frame of frames)for(const angle of angles)for(const look of ['none','wide-deep','portrait-shallow']){
 const locks={...empty,subjectCount,[r.key]:r.id,framingId:option('framingId',frame),angleId:option('angleId',angle)};
 if(look!=='none'){locks.lensId=option('lensId',look==='wide-deep'?'20mm 超廣角':'85mm 中長焦 (人像鏡皇)');locks.apertureId=option('apertureId',look==='wide-deep'?'f/11 深焦清晰':'f/1.4 極淺景深散景');locks.filmId=option('filmId','柯達 Portra 暖膚底片');}
 run(locks,r.key,r.id,r.zh+':'+look);
}
for(const r of review.retentions)for(const subjectCount of ['1','2'])for(const angle of ['平視高度鏡頭','高位俯視鏡頭','正上方俯視鏡頭']){
 const key=r.path.includes('/Locations/')?'locationId':r.path.includes('景別')?'framingId':'opticalEffectId';
 run({...empty,subjectCount,framingId:option('framingId','全身鏡頭 (Full Body Shot)'),angleId:option('angleId',angle),[key]:r.id},key,r.id,'review:'+r.zh);
}
// All optical identities include restore-only hidden refraction, never newly exposed.
for(const r of controls.find(c=>c.key==='opticalEffectId').options.filter(o=>o.en!=='none'))for(const subjectCount of ['1','2'])run({...empty,subjectCount,framingId:option('framingId','全身鏡頭 (Full Body Shot)'),opticalEffectId:r.id},'opticalEffectId',r.id,'optics:'+r.zh);
assert.equal(rows.length,644);
if(record)writeFileSync(file,gzipSync(JSON.stringify({base:review.base,rows})),{flag:'wx'});
console.log(JSON.stringify({cases:rows.length,record,changedRows:before?rows.filter((r,i)=>JSON.stringify(r.outputs)!==JSON.stringify(before.rows[i].outputs)).length:null,frames,angles}));

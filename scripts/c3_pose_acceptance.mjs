import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {createEmptyLocks,createSeededRandom,generatePrompts,getLockControls,normalizeLocks} from '../webapp/src/lib/engine.js';
import {SPECIFIED_ACTION_CONCRETE_OPTIONS} from '../webapp/src/lib/engine/specifiedActions.js';
import {POSE_COMPOSER_ANCHOR_OPTIONS} from '../webapp/src/lib/engine/poseComposerOptions.js';
import {serializeFavoritePrompt,deserializeFavoritePrompt} from '../webapp/src/features/saved-cards/cardCodec.js';
import review from './lib/c3PoseReview.json' with {type:'json'};
const file=new URL('../Docs/reports/c3-pose-guards-2026-10-30/before.json.gz',import.meta.url);
const record=process.argv.includes('--record'),hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const controls=getLockControls(),inputs=[];
for(const action of SPECIFIED_ACTION_CONCRETE_OPTIONS)inputs.push({specifiedActionId:action.id});
for(const id of review.ids){const a=POSE_COMPOSER_ANCHOR_OPTIONS.find(a=>a.id===id);for(const base of a.bases||[a.base])inputs.push({poseBaseId:base,poseAnchorId:id});}
for(const head of controls.find(c=>c.key==='headPostureId').options)for(const gaze of ['none','gaze-camera','gaze-down'])inputs.push({headPostureId:head.id,gazeId:gaze});
for(const captureStyleId of ['standard','selfie','companion','mirror'])inputs.push({captureStyleId});
for(const poseBaseId of ['standing','sitting','kneeling','squatting','lying'])inputs.push({poseBaseId,poseAnchorId:'random'});
const frames=controls.find(c=>c.key==='framingId').options.filter(x=>x.en!=='none').slice(0,6),rows=[];
const prior=record?null:JSON.parse(gunzipSync(readFileSync(file)));
const fields=['selection','grokPrompt','zImagePrompt','midjourneyPrompt','nanoBananaPrompt','extraPrompts'];
for(const input of inputs)for(const frame of frames){const i=rows.length,locks={...createEmptyLocks(),...input,framingId:frame.id},random=createSeededRandom('c3:'+i);let calls=0;
 const [p]=generatePrompts(1,locks,[],{random:()=>{calls++;return random();}});
 const saved=serializeFavoritePrompt({...p,id:'c3-'+i,date:'2026-10-30'}),old=prior?.rows[i].saved||saved,loaded=deserializeFavoritePrompt(old);
 const row={input:{...input,framingId:frame.id},output:hash(Object.fromEntries(fields.map(k=>[k,p[k]]))),calls,normalized:hash(normalizeLocks(locks,controls)),roundtrip:hash(serializeFavoritePrompt(loaded)),saved:old};
 if(prior){for(const k of ['output','calls','normalized','roundtrip'])assert.deepEqual(row[k],prior.rows[i][k],`${i}:${k}`);for(const k of fields.filter(k=>k!=='selection'))assert.deepEqual(loaded[k],p[k],`${i}:public:${k}`);}
 rows.push(row);
}
if(record)writeFileSync(file,gzipSync(JSON.stringify({base:review.base,rows})),{flag:'wx'});
console.log(JSON.stringify({cases:rows.length,outputsSelectionsRngRestore:'equal',record}));

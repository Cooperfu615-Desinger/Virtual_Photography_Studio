import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createEmptyLocks,createSeededRandom,generatePrompts,getLockControls} from '../webapp/src/lib/engine.js';
import {serializeFavoritePrompt,deserializeFavoritePrompt} from '../webapp/src/features/saved-cards/cardCodec.js';
const controls=getLockControls(),rows=[];
for(const base of ['standing','sitting','kneeling','squatting','lying'])for(const target of ['one-hand-support-chin','one-hand-chin-other-down','hand-hold-fuji-x100v'])for(const framing of controls.find(x=>x.key==='framingId').options.filter(x=>x.en!=='none').slice(0,6)){
 const random=createSeededRandom('c4:'+base+target+framing.id);let calls=0;
 const [p]=generatePrompts(1,{...createEmptyLocks(),subjectCount:'1',poseBaseId:base,framingId:framing.id,[target.startsWith('hand-hold')?'posePropId':'poseHandId']:target},[],{random:()=>{calls++;return random();}});
 const value={selection:p.selection,grokPrompt:p.grokPrompt,zImagePrompt:p.zImagePrompt,midjourneyPrompt:p.midjourneyPrompt,nanoBananaPrompt:p.nanoBananaPrompt,extraPrompts:p.extraPrompts,calls};
 rows.push(value);
 const restored=deserializeFavoritePrompt(serializeFavoritePrompt({...p,id:'fixture',date:'2026-10-29'}));
 for(const k of ['grokPrompt','zImagePrompt','midjourneyPrompt','nanoBananaPrompt','extraPrompts'])assert.deepEqual(restored[k],p[k]);
}
const file=new URL('../Docs/reports/c4-labels-2026-10-29/before.json.gz',import.meta.url);
if(process.argv.includes('--record'))writeFileSync(file,gzipSync(JSON.stringify(rows)));
else assert.deepEqual(rows,JSON.parse(gunzipSync(readFileSync(file))));
console.log({cases:rows.length,publicOutputsSelectionsAndRng:'equal',storedPublicText:'preserved'});

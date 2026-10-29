import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {createEmptyLocks,createSeededRandom,generatePrompts,getLockControls,normalizeLocks} from '../webapp/src/lib/engine.js';
import {serializeFavoritePrompt,deserializeFavoritePrompt,parseLocksFromStandardPrompt} from '../webapp/src/features/saved-cards/cardCodec.js';
import review from './lib/c4CatalogLabelsReview.json' with {type:'json'};
import legacy from '../webapp/src/lib/engine/legacyMappings.baseline.json' with {type:'json'};
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const controls=getLockControls(),rows=[],restores=[];
const frames=controls.find(c=>c.key==='framingId').options.filter(x=>x.en!=='none').slice(0,6);
const states=controls.find(c=>c.key==='hairStylingStateId').options;
const keys=['grokPrompt','zImagePrompt','midjourneyPrompt','nanoBananaPrompt','extraPrompts'];
const data=p=>Object.fromEntries(['selection',...keys].map(k=>[k,p[k]]));
const file=new URL('../Docs/reports/c4-catalog-labels-2026-10-29/before.json.gz',import.meta.url);
const recording=process.argv.includes('--record');
const baseline=recording?null:JSON.parse(gunzipSync(readFileSync(file)));
let index=0;
for(const target of review.entries)for(const role of ['single','A','B'])for(const frame of frames)for(const state of (target.path.includes('/Character/')?states:[null])){
 const locks={...createEmptyLocks(),subjectCount:role==='single'?'1':'2',framingId:frame.id};
 locks[target.path.includes('/Character/')?(role==='single'?'hairstyleId':`hairstyle${role}Id`):'locationId']=target.id;
 if(state)locks[role==='single'?'hairStylingStateId':`hairStylingState${role}Id`]=state.id;
 const seed='c4b:'+index,random=createSeededRandom(seed);let calls=0;
 const [p]=generatePrompts(1,locks,[],{random:()=>{calls++;return random();}});
 const saved=serializeFavoritePrompt({...p,id:'c4b-'+index,date:'2026-10-29'});
 const old=baseline?.rows[index]?.saved??saved;
 const loaded=deserializeFavoritePrompt(old);
 if(!recording)assert.equal(hash(serializeFavoritePrompt(loaded)),baseline.rows[index].roundtrip,'existing restore normalization unchanged');
 for(const k of keys)assert.deepEqual(loaded[k],p[k],'saved public text preserved');
 rows.push({hash:hash(data(p)),calls,roundtrip:hash(serializeFavoritePrompt(loaded)),saved:recording?saved:baseline.rows[index].saved});
 if(!recording){assert.equal(rows[index].hash,baseline.rows[index].hash,seed);assert.equal(calls,baseline.rows[index].calls,seed);assert.deepEqual(data(loaded),data(deserializeFavoritePrompt(baseline.rows[index].saved)));}
 index++;
}
for(const row of legacy.cases){const value=row.prompt===undefined?normalizeLocks(row.input,controls):parseLocksFromStandardPrompt(row.prompt,controls);restores.push(hash(value));}
const result={rows,restores};
if(recording)writeFileSync(file,gzipSync(JSON.stringify(result)),{flag:'wx'});
else assert.deepEqual(restores,baseline.restores,'all historical restore outcomes');
console.log(JSON.stringify({cases:rows.length,legacyCases:restores.length,outputsSelectionsRng:'equal',oldCards:'public-text-and-restore-preserved'}));

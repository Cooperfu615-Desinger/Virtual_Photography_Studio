import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import * as engine from '../webapp/src/lib/engine.js';
import {fixtures,runCase,referenceAllows,REPORT} from './lib/c7CaptureFixtures.mjs';
import {NIGHT_SCENE,DAY_LIGHTS} from './lib/c7NightLightingFixtures.mjs';
import {referenceAllows as colorAllows} from './lib/c7ColorFixtures.mjs';
const m=fixtures(engine),opts=k=>m.controls.find(c=>c.key===k).options,by=(k,id)=>opts(k).find(x=>x.id===id),random=v=>!v||v==='random';
function conflicts(input,s){
 const state={location:by('locationId',s.locationId),style:by('styleId',s.styleId),ambient:by('lightingId',s.lightingId),subject:by('lightDirectionId',s.lightDirectionId),shutter:by('shutterId',s.shutterId)},bad=[];
 if((random(input.locationId)||random(input.lightingId))&&!referenceAllows('ambient',state.ambient,{location:state.location},'season'))bad.push('season');
 if((random(input.styleId)||random(input.locationId))&&!referenceAllows('location',state.location,{style:state.style}))bad.push('style-location');
 if((random(input.styleId)||random(input.lightingId))&&!referenceAllows('style',state.style,{ambient:state.ambient}))bad.push('style-ambient');
 if((random(input.styleId)||random(input.lightDirectionId))&&!referenceAllows('subject',state.subject,{style:state.style}))bad.push('style-subject');
 if((random(input.styleId)||input.shutterId==='random')&&!referenceAllows('shutter',state.shutter,{style:state.style}))bad.push('style-shutter');
 if((random(input.styleId)||random(input.filmId))&&!colorAllows(state.style,by('filmId',s.filmId)))bad.push('color');
 if(random(input.lightingId)&&s.locationId===NIGHT_SCENE&&DAY_LIGHTS.includes(s.lightingId))bad.push('night-party');
 return bad;
}
const baseline=JSON.parse(gunzipSync(readFileSync(new URL('../'+REPORT+'/before.json.gz',import.meta.url))));let before=0,after=0;const fields={};
for(const row of baseline.rows){const result=row.combined||row.before;if(row.case.eligible){before+=conflicts(row.case.input,row.before.prompt.selection).length>0;after+=conflicts(row.case.input,result.prompt.selection).length>0;}for(const[k,v]of Object.entries(row.before.prompt.selection))if(JSON.stringify(v)!==JSON.stringify(result.prompt.selection[k]))fields[k]=(fields[k]||0)+1;}
assert.equal(after,0);
let count=0;const scenarios=[{locationId:'',styleId:'',lightingId:'',lightDirectionId:'',shutterId:'random',filmId:''},...opts('styleId').map(s=>({styleId:s.id,locationId:'',lightingId:'',lightDirectionId:'',shutterId:'random',filmId:''})),{locationId:m.party,styleId:'',lightingId:'',lightDirectionId:'',shutterId:'random',filmId:''}];
for(const[index,patch]of scenarios.entries())for(let i=0;i<40;i++){const input={...m.base,...patch},row={name:'integration:'+index+':'+i,input,seed:'c7-three-batches:'+index+':'+i};const {prompt}=runCase(engine,row);assert.deepEqual(conflicts(input,prompt.selection),[],row.name);count++;}
for(let i=0;i<12;i++){const row={name:'cache',input:{...m.base,locationId:m.sunflower,lightingId:'',styleId:m.slow},seed:'c7-cache:'+i},a=runCase(engine,row);runCase(engine,row,m.db);assert.deepEqual(runCase(engine,row),a);}
console.log(JSON.stringify({sealedCases:baseline.rows.length,eligibleRandomConflictCasesBefore:before,eligibleRandomConflictCasesAfter:after,changedSelectionFields:fields,integrationCases:count,customCacheIsolationCases:12,allThreePoliciesCompatible:true}));

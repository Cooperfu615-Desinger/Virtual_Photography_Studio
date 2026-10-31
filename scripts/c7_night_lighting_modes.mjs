import assert from 'node:assert/strict';
import * as engine from '../webapp/src/lib/engine.js';
import {fixtures,runCase,NIGHT_SCENE,DAY_LIGHTS} from './lib/c7NightLightingFixtures.mjs';
const {filtered,controls}=fixtures(engine);let cases=0;const seen=new Set();
for(const lightDirectionId of ['', 'random'])for(let i=0;i<40;i++){
 const input={...engine.createEmptyLocks(),subjectCount:'1',locationId:NIGHT_SCENE,lightingId:'',lightDirectionId};
 const row={name:'unlocked:'+lightDirectionId+':'+i,input,seed:'c7-unlocked:'+i};
 const actual=runCase(engine,row),reference=runCase(engine,row,filtered);
 assert.deepEqual(actual,reference,row.name);assert.equal(DAY_LIGHTS.includes(actual.prompt.selection.lightingId),false);
 seen.add(actual.prompt.selection.lightDirectionId);cases++;
}
const elsa=controls.find(c=>c.key==='styleId').options.find(o=>o.zh.includes('艾爾莎'));assert.ok(elsa);
for(let i=0;i<10;i++){
 const row={name:'manual Elsa',input:{...engine.createEmptyLocks(),locationId:NIGHT_SCENE,styleId:elsa.id},seed:'c7-elsa:'+i};
 const actual=runCase(engine,row);assert.equal(actual.prompt.selection.styleId,elsa.id);assert.deepEqual(actual,runCase(engine,row,filtered));cases++;
}
console.log(JSON.stringify({passed:true,cases,randomSubjectLightVariants:seen.size,manualElsaPreserved:10,reference:'unchanged custom-library path with exactly six ambient sources removed'}));

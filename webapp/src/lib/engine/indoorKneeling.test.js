import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {createEmptyLocks,getLockControls,getSceneDependentOptions,normalizeLocks} from '../engine.js';
import {indoorKneelingModel,isIndoorKneelId} from './indoorKneeling.js';
import {kneelActions} from './indoorKneelFixtures.js';
import scenes from './indoorKneelScenes.json' with {type:'json'};
import {transitionPage1Locks} from '../../features/page1/lockTransitions.js';
import {randomizeLockKeys,setLockKeysToNone} from '../page1SectionRandom.js';
const controls=getLockControls(),places=getSceneDependentOptions([],{subjectCount:'1',sceneAttributeId:'indoor'}).locationOptions.filter(o=>o.zh!=='全無');
const state=(place,action,id='')=>({subjectCount:'1',locationId:place.id,specifiedActionId:action.id,indoorKneelId:id});
const model=(place,action,id='')=>indoorKneelingModel(state(place,action,id),place,controls);
const change=(previous,candidate)=>transitionPage1Locks({previousLocks:previous,candidateLocks:{...previous,...candidate},lockControls:controls});

test('83 scenes × six actions independently match the approved ordered options, every value and source catalog',()=>{
 const rows=readFileSync(new URL('../../../../Docs/specs/indoor-kneeling-scenes-v1.md',import.meta.url),'utf8').split('\n').filter(s=>/^\| \d+ \|/.test(s)).map(s=>s.split('|').slice(1,-1).map(s=>s.trim()));
 assert.equal(rows.length,83);assert.equal(kneelActions.length,6);assert.deepEqual(new Set(Object.keys(scenes)),new Set(places.map(o=>o.id)));
 const all=new Set();let choices=0;
 for(const [,zh,approved] of rows){const place=places.find(o=>o.zh===zh);assert.ok(place,zh);choices+=scenes[place.id].length;
  for(const action of kneelActions){const m=model(place,action);assert.deepEqual(m.options.map(o=>o.label),approved.split('、'),zh);assert.equal(m.selectedId,'');assert.equal(m.phrase,'');
   for(const option of m.options){all.add(option.id);assert.equal(normalizeLocks(state(place,action,option.id)).indoorKneelId,option.id);assert.equal(model(place,action,option.id).selectedId,option.id);}
  }
 }
 assert.equal(choices,104);assert.equal(all.size,11);assert.equal(Object.hasOwn(createEmptyLocks(),'indoorKneelId'),false);
 for(const id of all)assert.ok(isIndoorKneelId(id));assert.equal(isIndoorKneelId('unknown'),false);assert.equal(isIndoorKneelId(4),false);
});

test('all compatible scene and pose transitions retain choices; other owners, resets and capture clear or pause correctly',()=>{
 for(const place of places)for(const action of kneelActions)for(const id of scenes[place.id]){
  const previous=state(place,action,id),next=places[(places.indexOf(place)+1)%places.length];
  assert.equal(change(previous,{locationId:next.id}).indoorKneelId,model(next,action,id).selectedId||undefined);
  for(const target of kneelActions)assert.equal(change(previous,{specifiedActionId:target.id}).indoorKneelId,id);
 }
 const hotel=places.find(o=>o.zh==='室內：精品飯店房間'),action=kneelActions[0],previous=state(hotel,action,'bed-top');
 assert.equal(change(previous,{lightingId:''}).indoorKneelId,'bed-top');
 for(const patch of [{locationId:''},{locationId:'none'},{specifiedActionId:'random'},{specifiedActionId:'none'},{specifiedActionId:'specified-kneeling-all-fours-palms'},{subjectCount:'2'},{fixedCompositionSetId:'japan-carriage-bench-front'},{importedWorldSceneMode:'architecture'},{indoorKneelId:'unknown'}])assert.equal(change(previous,patch).indoorKneelId,undefined,JSON.stringify(patch));
 for(const mutate of [s=>randomizeLockKeys(s,['locationId'],{},controls),s=>setLockKeysToNone(s,['locationId'],controls)])assert.equal(change(previous,mutate(previous)).indoorKneelId,undefined);
 assert.equal(change(previous,{captureMode:'observation'}).indoorKneelId,'bed-top');
 const paused=change(previous,{captureMode:'observation'}),classroom=places.find(o=>o.zh==='室內：日本學校教室');
 assert.equal(change(paused,{captureMode:'standard',locationId:classroom.id}).indoorKneelId,undefined);
 assert.equal(model({id:'future',zh:'室內：未審閱場景'},action),null);
});

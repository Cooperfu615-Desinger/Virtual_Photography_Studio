import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { getLockControls, getSceneDependentOptions, normalizeLocks } from '../engine.js';
import { indoorLeaningModel } from './indoorLeaning.js';
import { SPECIFIED_ACTION_RANDOM_POOL } from './specifiedActions.js';
import { transitionPage1Locks } from '../../features/page1/lockTransitions.js';
import { randomizeLockKeys, setLockKeysToNone } from '../page1SectionRandom.js';
import scenes from './outdoorLeanScenes.json' with {type:'json'};
const controls=getLockControls();
const places=getSceneDependentOptions([],{subjectCount:'1',sceneAttributeId:'outdoor'}).locationOptions.filter(o=>o.zh!=='全無');
const actions=['specified-standing-back-lean','specified-standing-shoulder-lean'];
const state=(place,action,id='')=>({subjectCount:'1',locationId:place.id,specifiedActionId:action,indoorLeanId:id});
const model=(place,action,id='')=>indoorLeaningModel(state(place,action,id),place,controls);
const transition=(previous,candidate)=>transitionPage1Locks({previousLocks:previous,candidateLocks:{...previous,...candidate},lockControls:controls});

test('71 × 2 ordered choices and all empty sets match the approved document independently',()=>{
  const rows=readFileSync(new URL('../../../../Docs/specs/outdoor-leaning-scenes-v1.md',import.meta.url),'utf8')
    .split('\n').filter(s=>/^\| \d+ \|/.test(s)).map(s=>s.split('|').slice(1,-1).map(t=>t.trim()));
  assert.equal(rows.length,71);assert.equal(places.length,71);
  assert.deepEqual(new Set(Object.keys(scenes)),new Set(places.map(o=>o.id)));
  const counts=[0,0,0];
  for(const [,zh,...reviewed] of rows){
    const place=places.find(o=>o.zh===zh);assert.ok(place,zh);
    actions.forEach((action,index)=>{
      const result=model(place,action),expected=reviewed[index]==='—'?[]:reviewed[index].split('、');
      assert.deepEqual(result.options.map(o=>o.label),expected,zh+'/'+action);
      assert.equal(result.selectedId,'');assert.equal(result.sentence,'');
      if(!expected.length)counts[index]++;
      for(const option of result.options){
        if(index===0)assert.ok(!['doorframe','pole'].includes(option.id));else assert.notEqual(option.id,'railing');
        assert.equal(normalizeLocks(state(place,action,option.id)).indoorLeanId,option.id);
        const selected=model(place,action,option.id);assert.equal(selected.selectedId,option.id);
        if(option.id==='railing'){assert.match(selected.sentence,/her lower back/);assert.equal(selected.upperVisible,false);}
        else assert.equal(selected.upperVisible,true);
      }
    });
    if(reviewed.every(v=>v==='—'))counts[2]++;
  }
  assert.deepEqual(counts,[8,11,7]);
  for(const id of actions)assert.ok(!SPECIFIED_ACTION_RANDOM_POOL.some(o=>o.id===id));
});

test('scene/action changes, indoor/outdoor, resets and capture retain only compatible explicit choices',()=>{
  for(const place of places)for(const action of actions)for(const option of model(place,action).options){
    const previous=state(place,action,option.id),next=places[(places.indexOf(place)+1)%places.length];
    assert.equal(transition(previous,{locationId:next.id}).indoorLeanId,model(next,action,option.id).selectedId||undefined);
    for(const target of actions)assert.equal(transition(previous,{specifiedActionId:target}).indoorLeanId,model(place,target,option.id).selectedId||undefined);
  }
  const forest=places.find(o=>o.zh==='戶外：森林步道'),city=places.find(o=>o.zh==='戶外：首爾聖水洞街區');
  const indoor=controls.find(c=>c.key==='locationId').options.find(o=>o.zh==='室內：日本學校教室');
  assert.equal(transition(state(city,actions[0],'wall'),{locationId:indoor.id}).indoorLeanId,'wall');
  assert.equal(transition(state(indoor,actions[0],'wall'),{locationId:city.id}).indoorLeanId,'wall');
  const previous=state(forest,actions[0],'tree-trunk');
  assert.equal(transition(previous,{locationId:indoor.id}).indoorLeanId,undefined);
  assert.equal(transition(previous,{lightingId:''}).indoorLeanId,'tree-trunk');
  for(const candidate of [{locationId:''},{locationId:'none'},{specifiedActionId:'none'},{specifiedActionId:'random'},
    {specifiedActionId:'specified-sitting-natural'},{subjectCount:'2'},{fixedCompositionSetId:'japan-carriage-bench-front'},
    {importedWorldSceneMode:'architecture'},{indoorLeanId:'unknown'}])assert.equal(transition(previous,candidate).indoorLeanId,undefined);
  for(const mutate of [s=>randomizeLockKeys(s,['locationId'],{},controls),s=>setLockKeysToNone(s,['locationId'],controls)])assert.equal(transition(previous,mutate(previous)).indoorLeanId,undefined);
  assert.equal(transition(previous,{captureMode:'observation'}).indoorLeanId,'tree-trunk');
  assert.equal(model({id:'future-outdoor',zh:'戶外：未審閱場景'},actions[0],'tree-trunk'),null);
});

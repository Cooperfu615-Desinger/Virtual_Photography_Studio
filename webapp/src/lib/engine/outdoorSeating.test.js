import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { getLockControls, getSceneDependentOptions, normalizeLocks } from '../engine.js';
import { SPECIFIED_ACTION_CONCRETE_OPTIONS } from './specifiedActions.js';
import { applyIndoorSeat, indoorSeatingModel } from './indoorSeating.js';
import { transitionPage1Locks } from '../../features/page1/lockTransitions.js';
import { randomizeLockKeys, setLockKeysToNone } from '../page1SectionRandom.js';
import scenes from './outdoorSeatScenes.json' with {type:'json'};

const controls=getLockControls();
const locations=getSceneDependentOptions([], {subjectCount:'1',sceneAttributeId:'outdoor'}).locationOptions.filter(o=>o.zh!=='全無');
const actions=SPECIFIED_ACTION_CONCRETE_OPTIONS.filter(o=>o.family==='sitting');
const doc=name=>readFileSync(new URL('../../../../Docs/specs/'+name,import.meta.url),'utf8');
const rows=text=>text.split('\n').filter(line=>line.startsWith('| ')).map(line=>line.split('|').slice(1,-1).map(s=>s.trim()));
const state=(location,action,id='')=>({subjectCount:'1',locationId:location.id,specifiedActionId:action.id,indoorSeatId:id});
const model=(location,action,id='')=>indoorSeatingModel(state(location,action,id),location,controls);
const transition=(previous,candidate)=>transitionPage1Locks({previousLocks:previous,candidateLocks:{...previous,...candidate},lockControls:controls});

test('71 × 14 ordered menus and fixed surfaces match the independent approved review tables',()=>{
  assert.equal(locations.length,71);assert.equal(actions.length,14);
  assert.deepEqual(new Set(Object.keys(scenes)),new Set(locations.map(o=>o.id)));
  const scenery=new Map(rows(doc('outdoor-seating-scenes-v1.md')).filter(([n])=>/^\d+$/.test(n)).map(([,zh,options,ground])=>[zh,{options:options.split('、'),ground}]));
  const rules=rows(doc('outdoor-seating-v1.md')).filter(([names])=>names.split('、').some(name=>actions.some(a=>a.zh===name)));
  assert.equal(scenery.size,71);
  const phrases={地面:'on the ground',草地:'on the grass',沙地:'on the sand',平台:'on the deck'};
  for(const location of locations) for(const action of actions) {
    const reviewed=scenery.get(location.zh);assert.ok(reviewed,location.zh);
    const [,rule]=rules.find(([names])=>names.split('、').includes(action.zh));
    const actual=model(location,action,'unknown'),label=location.zh+'/'+action.zh;
    if(rule.startsWith('固定地面')) {
      assert.equal(actual.mode,'ground',label);assert.equal(actual.groundLabel,reviewed.ground,label);
      assert.equal(actual.phrase,phrases[reviewed.ground],label);
      assert.equal(applyIndoorSeat(action.en,actual),action.en.replaceAll('on the ground',phrases[reviewed.ground]),label);
      continue;
    }
    const allowed=rule.startsWith('允許')?reviewed.options:rule.replace('。','').split('、');
    assert.equal(actual.mode,'choice',label);assert.equal(actual.selectedId,'',label);
    assert.deepEqual(actual.options.map(o=>o.label),reviewed.options.filter(name=>allowed.includes(name)),label);
    assert.equal(applyIndoorSeat(action.en,actual),action.en,label);
    for(const option of actual.options) {
      assert.equal(normalizeLocks(state(location,action,option.id)).indoorSeatId,option.id,label);
      assert.ok(applyIndoorSeat(action.en,model(location,action,option.id)).includes(option.phrase),label);
    }
  }
});

test('switching scenes, actions and indoor/outdoor keeps only effective choices and never substitutes an object',()=>{
  const natural=actions.find(o=>o.id==='specified-sitting-natural');
  for(const location of locations) for(const action of actions) for(const option of model(location,action).options||[]) {
    const previous=state(location,action,option.id),target=locations[(locations.indexOf(location)+1)%locations.length];
    assert.equal(transition(previous,{locationId:target.id}).indoorSeatId,model(target,action,option.id).selectedId||undefined);
    for(const next of actions) assert.equal(transition(previous,{specifiedActionId:next.id}).indoorSeatId,model(location,next,option.id).selectedId||undefined);
  }
  const cafe=locations.find(o=>o.zh==='戶外：法租界咖啡館窗外露台座位');
  const classroom=controls.find(c=>c.key==='locationId').options.find(o=>o.zh==='室內：日本學校教室');
  assert.equal(transition(state(cafe,natural,'chair'),{locationId:classroom.id}).indoorSeatId,'chair');
  assert.equal(transition(state(classroom,natural,'chair'),{locationId:cafe.id}).indoorSeatId,'chair');
  const beach=locations.find(o=>o.zh==='戶外：金色海灘與浪線'),previous=state(beach,natural,'sand');
  assert.equal(transition(previous,{locationId:classroom.id}).indoorSeatId,undefined);
  assert.equal(transition(previous,{lightingId:''}).indoorSeatId,'sand');
  for(const candidate of [{locationId:''},{locationId:'none'},{specifiedActionId:'random'},{specifiedActionId:'none'},
    {specifiedActionId:'specified-standing-back-lean'},{subjectCount:'2'},
    {fixedCompositionSetId:'japan-carriage-bench-front'},{importedWorldSceneMode:'architecture'}]) {
    assert.equal(transition(previous,candidate).indoorSeatId,undefined);
  }
  for(const mutate of [locks=>randomizeLockKeys(locks,['locationId'],{},controls),locks=>setLockKeysToNone(locks,['locationId'],controls)]) assert.equal(transition(previous,mutate(previous)).indoorSeatId,undefined);
  assert.equal(transition(previous,{captureMode:'observation'}).indoorSeatId,'sand');
  const future={id:'new-outdoor',zh:'戶外：未審閱'};
  assert.equal(model(future,natural,'ground'),null);
});

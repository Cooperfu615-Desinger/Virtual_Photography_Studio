import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { getLockControls, getSceneDependentOptions, normalizeLocks } from '../engine.js';
import { SPECIFIED_ACTION_RANDOM_POOL } from './specifiedActions.js';
import { indoorLeaningModel, applyIndoorLean } from './indoorLeaning.js';
import { transitionPage1Locks } from '../../features/page1/lockTransitions.js';
import { randomizeLockKeys, setLockKeysToNone } from '../page1SectionRandom.js';

const controls = getLockControls();
const all = getSceneDependentOptions([], {subjectCount:'1', sceneAttributeId:'indoor'}).locationOptions.filter(o=>o.zh!=='全無' && !o.zh.includes('日本 Lawson 便利商店'));
const actions = ['specified-standing-back-lean', 'specified-standing-shoulder-lean'];
const state = (room, action = actions[0], id = '') => ({subjectCount:'1',locationId:room.id,specifiedActionId:action,indoorLeanId:id});
const model = (room, action, id) => indoorLeaningModel(state(room, action, id),room,controls);
const room = zh => all.find(o=>o.zh===zh);
const change = (previous, overrides) => transitionPage1Locks({previousLocks:previous,candidateLocks:{...previous,...overrides},lockControls:controls});

test('83 × 2 ordered lists match the approved scene document independently of runtime data',()=>{
  const rows=readFileSync(new URL('../../../../Docs/specs/indoor-leaning-scenes-v1.md',import.meta.url),'utf8').split('\n').filter(s=>/^\| (室內：|其他：)/.test(s));
  assert.equal(all.length,83);assert.equal(rows.length,83);
  const names = new Set();
  for(const row of rows) {
    const [zh,...expected]=row.split('|').slice(1,4).map(s=>s.trim());
    const location=room(zh);assert.ok(location,zh);assert.ok(!names.has(zh));names.add(zh);
    actions.forEach((action,index)=>{
      const m=model(location,action);
      assert.deepEqual(m.options.map(o=>o.label),expected[index]==='—'?[]:expected[index].split('、'),zh+'/'+action);
      assert.equal(m.selectedId,'');assert.equal(applyIndoorLean(m.action.en,m),m.action.en);
      for(const option of m.options) {
        const locks=state(location,action,option.id), selected=model(location,action,option.id);
        assert.equal(normalizeLocks(locks).indoorLeanId,option.id);
        assert.equal(selected.selectedId,option.id);
        assert.ok(selected.sentence.endsWith('.'));
        if(action===actions[0]) assert.ok(!['doorframe','pole'].includes(option.id));
        else assert.notEqual(option.id,'railing');
        const next=actions[1-index];
        assert.equal(change(locks,{specifiedActionId:next}).indoorLeanId,model(location,next,option.id).selectedId||undefined);
      }
    });
  }
});

test('studio walls, CRT wall, two empty scenes and the separate washitsu keep their approved boundaries',()=>{
  const studios=all.filter(o=>/攝影棚|背景|白幕|黑幕/.test(o.zh));assert.equal(studios.length,14);
  for(const location of studios) for(const action of actions) {
    assert.deepEqual(model(location,action).options.map(o=>o.id),[location.zh.includes('CRT')?'tv-wall':'wall']);
  }
  for(const zh of ['其他：白色床鋪','其他：生活感日式榻榻米房間']) for(const action of actions) assert.deepEqual(model(room(zh),action).options,[]);
  assert.deepEqual(model(room('室內：日式和室'),actions[0]).options.map(o=>o.id),['wall','column']);
  for(const action of actions) assert.ok(!SPECIFIED_ACTION_RANDOM_POOL.some(o=>o.id===action));
});

test('scene changes retain a valid object, clear an invalid one and never substitute a new object',()=>{
  for(const location of all) for(const action of actions) for(const option of model(location,action).options) {
    const locks=state(location,action,option.id);
    // Consecutive source/target pairs cover every scene without a redundant 83² Cartesian test.
    const target=all[(all.indexOf(location)+1)%all.length];
    assert.equal(change(locks,{locationId:target.id}).indoorLeanId,model(target,action,option.id).selectedId||undefined);
  }
  const classroom=room('室內：日本學校教室'), locks=state(classroom,actions[1],'doorframe');
  for(const candidate of [{locationId:''},{locationId:'none'},{specifiedActionId:'random'},
    {specifiedActionId:'none'},{specifiedActionId:'specified-sitting-natural'},{subjectCount:'2'},
    {fixedCompositionSetId:'japan-carriage-bench-front'},{importedWorldSceneMode:'architecture'}]) {
    assert.equal(change(locks,candidate).indoorLeanId,undefined);
  }
  for(const mutate of [x=>randomizeLockKeys(x,['locationId'],{},controls),x=>setLockKeysToNone(x,['locationId'],controls)]) {
    assert.equal(change(locks,mutate(locks)).indoorLeanId,undefined);
  }
  assert.equal(change(locks,{lightingId:''}).indoorLeanId,'doorframe');
  assert.equal(change(locks,{indoorLeanId:'unknown'}).indoorLeanId,undefined);
  assert.equal(change(locks,{captureMode:'observation'}).indoorLeanId,'doorframe');
  const fresh={id:'custom-indoor',zh:'室內：新場景'};
  assert.deepEqual(model(fresh,actions[0],'wall').options,[]);
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { getSceneDependentOptions } from '../engine.js';
import { SPECIFIED_ACTION_CONCRETE_OPTIONS } from './specifiedActions.js';
import { indoorSeatingModel, applyIndoorSeat } from './indoorSeating.js';
import sceneSeats from './indoorSeatScenes.json' with {type:'json'};

const locations = getSceneDependentOptions([], {subjectCount:'1', sceneAttributeId:'indoor'}).locationOptions.filter(x => x.zh !== '全無' && !x.zh.includes('日本 Lawson 便利商店'));
const actions = SPECIFIED_ACTION_CONCRETE_OPTIONS.filter(x => x.family === 'sitting');
const model = (location, action, id = '', overrides = {}) => indoorSeatingModel({
  subjectCount:'1', locationId:location.id, specifiedActionId:action.id, indoorSeatId:id, ...overrides,
},location);

test('83 scene IDs and all fourteen sitting actions resolve without silently choosing a seat', () => {
  assert.deepEqual(new Set(Object.keys(sceneSeats).filter(id=>id!=='locations:生活感室內-indoor-lifestyle:indoor-lawson-store')),new Set(locations.map(x => x.id)));
  assert.equal(locations.length,83); assert.equal(actions.length,14);
  for (const location of locations) for (const action of actions) {
    const result = model(location,action,'unrecognized');
    if (result.mode === 'ground') {
      assert.match(action.en,/on the ground/);
      if (result.phrase) assert.ok(!applyIndoorSeat(action.en,result).includes('on the ground'));
      continue;
    }
    assert.equal(result.mode,'choice'); assert.equal(result.selectedId,'');
    assert.equal(applyIndoorSeat(action.en,result),action.en);
    for (const option of result.options) {
      assert.ok(sceneSeats[location.id].includes(option.id));
      const chosen = model(location,action,option.id);
      assert.ok(applyIndoorSeat(action.en,chosen).includes(option.phrase));
    }
  }
});
test('classroom, tatami, bed edge and bed top use distinct physical relationships', () => {
  const pick = (place,pose,id) => model(locations.find(x=>x.zh===place),actions.find(x=>x.zh===pose),id);
  assert.deepEqual(pick('室內：日本學校教室','自然坐姿').options.map(x=>x.id),['chair','table','platform','floor']);
  assert.equal(pick('室內：日本學校教室','盤腿坐姿','chair').selectedId,'');
  for(const place of ['室內：日式和室','其他：生活感日式榻榻米房間']) {
    assert.equal(pick(place,'盤腿坐姿','floor').phrase,'on the tatami floor');
    assert.equal(pick(place,'自然坐姿','cushion').phrase,'on a cushion');
  }
  assert.equal(pick('其他：白色床鋪','自然坐姿','bed-edge').phrase,'on the edge of the bed');
  assert.equal(pick('其他：白色床鋪','盤腿坐姿','bed-top').phrase,'on the bed');
  assert.equal(pick('其他：白色床鋪','低坐抱膝').phrase,'');
});

test('the actual 83 × 14 menus agree with both approved review tables', () => {
  const doc = name => readFileSync(new URL('../../../../Docs/specs/'+name,import.meta.url),'utf8');
  const rows = markdown => markdown.split('\n').filter(line=>line.startsWith('| ')).map(line=>line.split('|').slice(1,-1).map(s=>s.trim()));
  const scenery = new Map(rows(doc('indoor-seating-scenes-v1.md')).filter(([name])=>name.startsWith('室內：') || name.startsWith('其他：')));
  const rules = rows(doc('indoor-seating-v1.md')).filter(([names])=>names.split('、').some(name=>actions.some(action=>action.zh===name)));
  assert.equal(scenery.size,locations.length);
  for(const location of locations) {
    const offered = scenery.get(location.zh).split('、').flatMap(s=>s==='床'?['床邊','床上']:[s]);
    for(const action of actions) {
      const [,rule]=rules.find(([names])=>names.split('、').includes(action.zh));
      const state=model(location,action);
      if(rule.startsWith('固定地面')) {assert.equal(state.mode,'ground');continue;}
      const allowed=rule.startsWith('允許')?offered:rule.replace('。','').split('、');
      const expected=offered.filter(s=>allowed.includes(s)).map(s=>s==='地板' && location.lyingSurface?.type==='tatami'?'榻榻米':s);
      assert.deepEqual(state.options.map(o=>o.label),expected,location.zh+' / '+action.zh);
    }
  }
});
test('unreviewed indoor scenes only offer unspecified; outdoor scenes never acquire a seat',()=>{
  const action=actions.find(a=>a.zh==='自然坐姿');
  const place={id:'future-indoor',zh:'室內：新場景'};
  const future=model(place,action,'chair');
  assert.equal(future.mode,'choice');assert.deepEqual(future.options,[]);assert.equal(future.selectedId,'');
  assert.equal(model({...place,zh:'戶外：新場景'},action,'chair'),null);
});

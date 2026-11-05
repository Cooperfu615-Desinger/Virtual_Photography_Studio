import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getLockControls } from '../engine.js';
import { SPECIFIED_ACTION_CONCRETE_OPTIONS } from './specifiedActions.js';
import { applyIndoorSeat, indoorSeatingModel } from './indoorSeating.js';
import { seatFixture, seatFramings } from './indoorSeatFixtures.js';
const room = '室內：日本學校教室';
const allControls = getLockControls();
const location = allControls.find(c=>c.key==='locationId').options.find(x=>x.zh===room);
const actions = SPECIFIED_ACTION_CONCRETE_OPTIONS.filter(x=>x.family==='sitting');
const framing = zh => allControls.find(c=>c.key==='framingId').options.find(x=>x.zh===zh).id;

test('all 14 poses use the correct physical relationship through the real generator at 10 framings', () => {
  for (const action of actions) {
    const state = {subjectCount:'1', locationId:location.id, specifiedActionId:action.id};
    const initial = indoorSeatingModel(state,location);
    const id = initial.options?.[0]?.id || '';
    const model = indoorSeatingModel({...state,indoorSeatId:id},location);
    for (const frame of seatFramings) {
      const original = seatFixture(room,action.zh,frame);
      const selected = seatFixture(room,action.zh,frame,{indoorSeatId:id});
      const label = action.zh + '/' + frame;
      assert.equal(selected.draws,original.draws,label);
      assert.deepEqual(selected.prompt.selection,{...original.prompt.selection,...(id?{indoorSeatId:id}:{})},label);
      const old = Object.fromEntries(original.cards.map(c=>[c.id,c.value]));
      const cards = Object.fromEntries(selected.cards.map(c=>[c.id,c.value]));
      const expected = applyIndoorSeat(action.en,model);
      assert.ok(cards['grok-imagine'].includes(expected),label);
      assert.equal(cards['full-body-character'],old['full-body-character'],label);
      assert.equal(cards['chest-up-portrait'],old['chest-up-portrait'],label);
      if (model.mode !== 'choice') continue;
      for(const key of ['gpt','grok','ai','nano-banana-2.1']) {
        if (old[key].includes(action.en)) assert.ok(cards[key].includes(expected),label+'/'+key);
        else assert.equal(cards[key],old[key],label+'/'+key);
      }
    }
  }
});
test('random, incompatible, unknown and outside-mode selections never produce or save a seat', () => {
  const full=framing('全身鏡頭 (Full Body Shot)');
  for(const overrides of [{specifiedActionId:'random'},{specifiedActionId:'none'},{locationId:''},
    {fixedCompositionSetId:'japan-carriage-bench-front'},{subjectCount:'2'},
    {characterProfileId:'character-48g'},{importedWorldSceneMode:'architecture',importedWorldSceneArchitectureText:'a studio'},
    {indoorSeatId:'unknown'}]) {
    const noSeat=seatFixture(room,'自然坐姿',full,overrides);
    const added=seatFixture(room,'自然坐姿',full,{indoorSeatId:'chair',...overrides});
    assert.deepEqual(added.cards,noSeat.cards);
    assert.equal(added.draws,noSeat.draws);
    assert.equal(added.prompt.selection.indoorSeatId,undefined);
  }
});
test('grounded poses name all contacts consistently and do not convert a bed into a floor', () => {
  const full=framing('全身鏡頭 (Full Body Shot)');
  for (const room of ['室內：日式和室','其他：生活感日式榻榻米房間','其他：白色床鋪']) {
    const result=seatFixture(room,'折腿低坐・雙掌後撐',full);
    const fullPose=result.cards.at(-1).value;
    assert.ok(fullPose.includes('both palms planted'));
    assert.ok(fullPose.includes(room.endsWith('白色床鋪')?'hips directly on the ground':'hips directly on the tatami floor'));
    assert.equal(result.prompt.selection.indoorSeatId,undefined);
  }
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getLockControls } from '../engine.js';
import { SPECIFIED_ACTION_CONCRETE_OPTIONS } from './specifiedActions.js';
import { seatFixture, seatFramings } from './indoorSeatFixtures.js';

const controls=getLockControls(),actions=SPECIFIED_ACTION_CONCRETE_OPTIONS.filter(o=>o.family==='sitting');
const byId=result=>Object.fromEntries(result.cards.map(c=>[c.id,c.value]));
const newSeats=[
  ['戶外：白色鹽湖乾裂荒漠','ground','on the ground'],
  ['其他：草地','grass','on the grass'],['其他：沙灘海岸線','sand','on the sand'],
  ['戶外：清澈海灣岩岸','rock','on a rock'],['戶外：高樓頂樓城市天際線','low-wall','on a low wall'],
  ['戶外：飯店度假村泳池露台','lounge-chair','on a lounge chair'],
  ['戶外：日式旅館緣側木廊','deck-edge','on the edge of the deck'],
  ['戶外：日式旅館緣側木廊','deck-top','on the deck'],
];
// Independent reviewed compatibility, not read from the implementation's tables.
const forAction={
  '自然坐姿':newSeats.map(([,id])=>id),'微微前傾':newSeats.map(([,id])=>id),
  '雙腿自然伸展':['ground','grass','sand','lounge-chair','deck-edge','deck-top'],
  '盤腿坐姿':['ground','grass','sand','deck-top'],'雙腿屈起':['ground','grass','sand','deck-top'],
  '隨性癱坐':['lounge-chair'],
  '翹二郎腿':['rock','low-wall','lounge-chair','deck-edge'],
  '單腿屈起坐姿':['ground','grass','sand','deck-top'],'雙腿側放坐姿':['ground','grass','sand','deck-top'],
  '開闊自信坐姿':['rock','low-wall','lounge-chair','deck-edge'],
};
const expectedSeat=(en,phrase)=>en.startsWith('She sits leaning')?en.replace('She sits leaning','She sits '+phrase+', leaning')
  :en.replace(/^She sits(?: cross-legged| casually slumped)?/,lead=>lead+' '+phrase);

test('all eight new choices × compatible actions × ten framings share exactly one pose and preserve RNG',()=>{
  for(const [room,id,phrase] of newSeats) for(const action of actions.filter(a=>forAction[a.zh]?.includes(id))) for(const frame of seatFramings) {
    const original=seatFixture(room,action.zh,frame),chosen=seatFixture(room,action.zh,frame,{indoorSeatId:id});
    const old=byId(original),next=byId(chosen),label=room+'/'+action.zh+'/'+frame;
    assert.equal(chosen.draws,original.draws,label);
    assert.deepEqual(chosen.prompt.selection,{...original.prompt.selection,indoorSeatId:id},label);
    const expected=expectedSeat(action.en,phrase);
    assert.ok(next['grok-imagine'].includes(expected),label+'/full G7');
    assert.equal(next['full-body-character'],old['full-body-character'],label+'/reference');
    assert.equal(next['chest-up-portrait'],old['chest-up-portrait'],label+'/chest');
    for(const key of ['gpt','grok','ai','nano-banana-2.1']) assert.equal(next[key],old[key].includes(action.en)?old[key].replaceAll(action.en,expected):old[key],label+'/'+key);
    if(phrase==='on the edge of the deck') assert.doesNotMatch(next['grok-imagine'],/feet flat on the ground/);
  }
});

test('four grounded actions × four surfaces × ten framings retain every contact and body clause',()=>{
  const grounded=actions.filter(a=>!forAction[a.zh]);assert.equal(grounded.length,4);
  for(const [room,phrase] of [['戶外：白色鹽湖乾裂荒漠','on the ground'],['其他：草地','on the grass'],
    ['其他：沙灘海岸線','on the sand'],['戶外：湖邊木棧道','on the deck']]) for(const action of grounded) for(const frame of seatFramings) {
    const result=seatFixture(room,action.zh,frame),text=byId(result)['grok-imagine'];
    assert.ok(text.includes(action.en.replaceAll('on the ground',phrase)),room+'/'+action.zh+'/'+frame);
    assert.equal(result.prompt.selection.indoorSeatId,undefined);
    assert.doesNotMatch(byId(result)['full-body-character'],/on the grass|on the sand|on the deck/);
  }
});

test('invalid, random and owned selections neither emit nor save a manual outdoor seat',()=>{
  const full=seatFramings.find(id=>id.includes('full-body-shot'));
  const character=controls.find(c=>c.key==='characterProfileId').options.find(o=>o.specialSubject==='character-profile');
  for(const overrides of [{specifiedActionId:'random'},{specifiedActionId:'none'},{locationId:''},{subjectCount:'2'},
    {fixedCompositionSetId:'japan-carriage-bench-front'},{characterProfileId:character.id},
    {importedWorldSceneMode:'architecture',importedWorldSceneArchitectureText:'an outdoor plaza'},
    {indoorSeatId:'unknown'},{indoorSeatId:'floor'},{indoorSeatId:'grass'}]) {
    const before=seatFixture('其他：沙灘海岸線','自然坐姿',full,overrides);
    const after=seatFixture('其他：沙灘海岸線','自然坐姿',full,{indoorSeatId:'sand',...overrides});
    assert.deepEqual(after.cards,before.cards);assert.equal(after.draws,before.draws);
    assert.equal(after.prompt.selection.indoorSeatId,undefined);
  }
});

test('legacy capture choices retain the outdoor seat and head while active phones pause the selected gesture',()=>{
  for(const captureStyleId of ['standard','selfie','companion','mirror']) for(const frame of seatFramings) {
    const settings={captureStyleId,gestureId:'gesture-collarbone',headPostureId:'chin-slightly-raised',gazeId:'gaze-camera'};
    const before=seatFixture('其他：草地','自然坐姿',frame,settings),after=seatFixture('其他：草地','自然坐姿',frame,{...settings,indoorSeatId:'grass'});
    assert.equal(after.draws,before.draws);
    assert.deepEqual(after.prompt.selection,{...before.prompt.selection,indoorSeatId:'grass'});
    const text=byId(after)['grok-imagine'];
    assert.match(text,/She sits on the grass in a relaxed, natural posture/);
    if(captureStyleId==='selfie'||captureStyleId==='mirror'){
      assert.match(text,captureStyleId==='selfie'?/front-camera self-shot/:/visible phone toward a mirror/);
      assert.doesNotMatch(text,/one hand resting on her collarbone/);
      assert.equal(after.prompt.selection.gestureId,'gesture-collarbone');
    }else assert.match(text,/one hand resting on her collarbone/);
    assert.match(text,/chin slightly raised/);
  }
});

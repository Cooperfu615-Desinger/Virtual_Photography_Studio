import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getLockControls } from '../engine.js';
import { seatFixture, seatFramings } from './indoorSeatFixtures.js';

const controls = getLockControls();
const cases = [
  ['室內：日本學校教室','wall','a wall'], ['室內：日本學校教室','cabinet','a cabinet'],
  ['室內：日式和室','column','a column'], ['室內：古書二手書店','bookcase','a bookcase'],
  ['室內：CRT 電視牆攝影棚','tv-wall','the TV wall'],
  ['室內：夜間家庭派對','railing','a railing'],
  ['室內：日本學校教室','doorframe','a doorframe'], ['室內：電車車廂側面走道視角','pole','a pole'],
];
const poses = [
  ['背部倚靠','She stands with her upper body angled slightly back.','her back'],
  ['側肩倚靠','She stands with her upper body tilted slightly to one side, one shoulder lower than the other.','one shoulder'],
];
const byId = result => Object.fromEntries(result.cards.map(c=>[c.id,c.value]));

test('every support through both actions × 10 framings keeps one effective pose, same selections and RNG',()=>{
  for(const [room,id,noun] of cases) for(const [pose,neutral,part] of poses) {
    if(pose==='背部倚靠' && ['doorframe','pole'].includes(id) || pose==='側肩倚靠' && id==='railing') continue;
    const expected=`She stands with ${id==='railing'?'her lower back':part} resting against ${noun}.`;
    for(const frame of seatFramings) {
      const before=seatFixture(room,pose,frame), after=seatFixture(room,pose,frame,{indoorLeanId:id});
      const old=byId(before), next=byId(after), label=pose+'/'+id+'/'+frame;
      assert.equal(after.draws,before.draws,label);
      assert.deepEqual(after.prompt.selection,{...before.prompt.selection,indoorLeanId:id},label);
      assert.ok(next['grok-imagine'].includes(expected),label+'/G7 full source');
      assert.ok(!next['grok-imagine'].includes(neutral),label+'/no duplicate');
      assert.equal(next['full-body-character'],old['full-body-character'],label+'/reference');
      const mediumOrChest=/中景鏡頭|胸上特寫|頭部主導近景/.test(controls.find(c=>c.key==='framingId').options.find(o=>o.id===frame).zh);
      for(const key of ['gpt','grok','ai','nano-banana-2.1','chest-up-portrait']) {
        if(!old[key].includes(neutral)) { assert.equal(next[key],old[key],label+'/'+key+'/omitted');continue; }
        const invisible=id==='railing' && (mediumOrChest || key==='chest-up-portrait');
        assert.equal(next[key],invisible?old[key]:old[key].replaceAll(neutral,expected),label+'/'+key);
      }
    }
  }
});

test('free-hand gestures, props, head and gaze survive replacement of only the posture core',()=>{
  const full=seatFramings.find(id=>id.includes('full-body-shot'));
  const option=(key,zh)=>controls.find(c=>c.key===key).options.find(o=>o.zh===zh).id;
  for(const [pose] of poses) {
    const overrides={indoorLeanId:'wall',gestureId:option('gestureId','一手放鎖骨'),headPostureId:option('headPostureId','下巴微抬'),gazeId:option('gazeId','看鏡頭'),propId:'hand-hold-iced-coffee'};
    const selected=seatFixture('室內：日本學校教室',pose,full,overrides);
    const text=byId(selected)['grok-imagine'];
    assert.match(text,/resting against a wall, one hand resting on her collarbone/);
    assert.match(text,/chin slightly raised/);
    assert.match(text,/iced coffee/);
    assert.equal((text.match(/resting against a wall/g)||[]).length,1);
  }
});

test('random scenes/actions, owners, outdoor and invalid support never use a latent lean object',()=>{
  const full=seatFramings.find(id=>id.includes('full-body-shot'));
  for(const overrides of [{specifiedActionId:'random'},{specifiedActionId:'none'},{locationId:''},
    {locationId:controls.find(c=>c.key==='locationId').options.find(o=>o.zh==='戶外：金色海灘與浪線').id},
    {fixedCompositionSetId:'japan-carriage-bench-front'},{subjectCount:'2'},
    {characterProfileId:'character-48g'},{importedWorldSceneMode:'architecture',importedWorldSceneArchitectureText:'a studio'},
    {indoorLeanId:'unknown'},{indoorLeanId:'pole'}]) {
    const before=seatFixture('室內：日本學校教室','背部倚靠',full,overrides);
    const after=seatFixture('室內：日本學校教室','背部倚靠',full,{indoorLeanId:'wall',...overrides});
    assert.deepEqual(after.cards,before.cards);
    assert.equal(after.draws,before.draws);
    assert.equal(after.prompt.selection.indoorLeanId,undefined);
  }
});

test('selfie, companion and mirror capture keep the same selected support without extra random draws',()=>{
  for(const [pose] of poses) for(const captureStyleId of ['selfie','companion','mirror']) for(const frame of seatFramings) {
    const before=seatFixture('室內：日本學校教室',pose,frame,{captureStyleId});
    const after=seatFixture('室內：日本學校教室',pose,frame,{captureStyleId,indoorLeanId:'wall'});
    assert.equal(after.draws,before.draws);
    assert.deepEqual(after.prompt.selection,{...before.prompt.selection,indoorLeanId:'wall'});
    assert.match(byId(after)['grok-imagine'],/resting against a wall/);
    assert.equal(byId(after)['full-body-character'],byId(before)['full-body-character']);
  }
});

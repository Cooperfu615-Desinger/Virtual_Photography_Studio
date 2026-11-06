import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getLockControls, getSceneDependentOptions } from '../engine.js';
import { seatFixture, seatFramings } from './indoorSeatFixtures.js';
import scenes from './outdoorLeanScenes.json' with {type:'json'};
const controls=getLockControls();
const locations=getSceneDependentOptions([],{subjectCount:'1',sceneAttributeId:'outdoor'}).locationOptions.filter(o=>o.zh!=='全無');
const actions=[['背部倚靠','back','She stands with her upper body angled slightly back.'],
  ['側肩倚靠','shoulder','She stands with her upper body tilted slightly to one side, one shoulder lower than the other.']];
const nouns={wall:'a wall',column:'a column',doorframe:'a doorframe',railing:'a railing',pole:'a pole',
  'tree-trunk':'a tree trunk','rock-face':'a rock face','vending-machine':'a vending machine','train-car':'a train car'};
const cards=result=>Object.fromEntries(result.cards.map(o=>[o.id,o.value]));

test('every outdoor scene × both poses × ten framings retains the same effective state and projected contact',()=>{
  const seen=new Set();
  for(const place of locations)for(const [pose,kind,neutral] of actions)for(const frame of seatFramings){
    const id=scenes[place.id][kind][0]||'';
    const before=seatFixture(place.zh,pose,frame),after=seatFixture(place.zh,pose,frame,id?{indoorLeanId:id}:{});
    const old=cards(before),next=cards(after),label=place.zh+'/'+pose+'/'+frame;
    assert.equal(after.draws,before.draws,label);
    assert.deepEqual(after.prompt.selection,{...before.prompt.selection,...(id?{indoorLeanId:id}:{})},label);
    if(!id){assert.deepEqual(after.cards,before.cards,label);assert.ok(next['grok-imagine'].includes(neutral),label);continue;}
    seen.add(kind+'/'+id);
    const contact=kind==='shoulder'?'one shoulder':id==='railing'?'her lower back':'her back';
    const expected=`She stands with ${contact} resting against ${nouns[id]}.`;
    assert.ok(next['grok-imagine'].includes(expected),label+'/G7 full source');
    assert.ok(!next['grok-imagine'].includes(neutral),label+'/single effective pose');
    assert.equal(next['full-body-character'],old['full-body-character'],label+'/reference');
    const upper=/中景鏡頭|胸上特寫|頭部主導近景/.test(controls.find(c=>c.key==='framingId').options.find(o=>o.id===frame).zh);
    for(const key of ['gpt','grok','ai','nano-banana-2.1','chest-up-portrait']){
      const keepsOriginal=!old[key].includes(neutral)||id==='railing'&&(upper||key==='chest-up-portrait');
      assert.equal(next[key],keepsOriginal?old[key]:old[key].replaceAll(neutral,expected),label+'/'+key);
    }
  }
  assert.equal(seen.size,15,'all allowed posture/noun combinations appear in the real generator');
});

test('four capture styles keep head, gesture, prop sources and draw counts alongside the chosen tree',()=>{
  for(const [pose] of actions)for(const captureStyleId of ['standard','selfie','companion','mirror'])for(const frame of seatFramings){
    const settings={captureStyleId,gestureId:'gesture-collarbone',headPostureId:'chin-slightly-raised',gazeId:'gaze-camera',propId:'hand-hold-iced-coffee'};
    const before=seatFixture('戶外：森林步道',pose,frame,settings),after=seatFixture('戶外：森林步道',pose,frame,{...settings,indoorLeanId:'tree-trunk'});
    assert.equal(after.draws,before.draws);
    assert.deepEqual(after.prompt.selection,{...before.prompt.selection,indoorLeanId:'tree-trunk'});
    const text=cards(after)['grok-imagine'];
    assert.match(text,/resting against a tree trunk, one hand resting on her collarbone/);
    assert.match(text,/chin slightly raised/);
    if(cards(before)['grok-imagine'].includes('iced coffee'))assert.ok(text.includes('iced coffee'));
    assert.equal(cards(after)['full-body-character'],cards(before)['full-body-character']);
  }
});

test('random, owned, unknown and incompatible choices neither emit nor save a manual outdoor lean',()=>{
  const full=seatFramings.find(id=>id.includes('full-body-shot'));
  const character=controls.find(c=>c.key==='characterProfileId').options.find(o=>o.specialSubject==='character-profile');
  for(const overrides of [{specifiedActionId:'random'},{specifiedActionId:'none'},{locationId:''},{subjectCount:'2'},
    {fixedCompositionSetId:'japan-carriage-bench-front'},{characterProfileId:character.id},
    {importedWorldSceneMode:'architecture',importedWorldSceneArchitectureText:'an outdoor plaza'},
    {actionPoseCardId:'low-seated-aloof-cats-street-mood'},
    {indoorLeanId:'unknown'},{indoorLeanId:'rock-face'},{indoorLeanId:'pole'}]){
    const before=seatFixture('戶外：森林步道','背部倚靠',full,overrides);
    const after=seatFixture('戶外：森林步道','背部倚靠',full,{indoorLeanId:'tree-trunk',...overrides});
    assert.deepEqual(after.cards,before.cards);assert.equal(after.draws,before.draws);
    assert.equal(after.prompt.selection.indoorLeanId,undefined);
  }
});

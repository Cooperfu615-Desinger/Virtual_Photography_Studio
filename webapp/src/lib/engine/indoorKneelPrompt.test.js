import assert from 'node:assert/strict';
import {test} from 'node:test';
import {getLockControls,getSceneDependentOptions} from '../engine.js';
import {seatFixture,seatFramings} from './indoorSeatFixtures.js';
import {kneelActions} from './indoorKneelFixtures.js';
import scenes from './indoorKneelScenes.json' with {type:'json'};
import outdoorScenes from './outdoorKneelScenes.json' with {type:'json'};
const controls=getLockControls(),places=getSceneDependentOptions([],{subjectCount:'1',sceneAttributeId:'indoor'}).locationOptions.filter(o=>o.zh!=='全無' && !o.zh.includes('日本 Lawson 便利商店'));
const phrases={'bed-top':'on the bed',floor:'on the floor',tatami:'on the tatami floor',carpet:'on the carpet',mat:'on a mat',ground:'on the ground',sofa:'on a sofa','reading-table':'on a reading table',bench:'on a bench',aisle:'on the aisle floor','train-seat':'on a train seat'};
export const expectedKneel=(action,p)=>({
 'specified-kneeling-seiza':`She kneels ${p} in a seiza posture with her hips resting on her heels, her knees together, her torso upright.`,
 'specified-kneeling-wide':`She kneels with both knees resting ${p} and naturally apart, her hips resting ${p} between her legs, her lower legs folded back on either side, her torso upright.`,
 'specified-kneeling-forward-lean':`She kneels high with both knees resting ${p} and her hips lifted clear of her heels, her upper body inclined forward from the hips.`,
 'specified-kneeling-upright-poised':`She kneels upright with both knees resting ${p}, her thighs nearly vertical and her hips lifted clear of her heels above her knees, her torso tall with relaxed shoulders.`,
 'specified-kneeling-side-sit':`She kneels ${p} in a side-sitting posture with her hips lowered beside her folded legs, her torso relaxed and upright.`,
 'specified-kneeling-one-knee-forward':`She half-kneels with one knee resting ${p}, the other leg stepped forward with the front knee bent.`,
})[action];
const cards=r=>Object.fromEntries(r.cards.map(c=>[c.id,c.value]));

const outdoorPhrases = {
 ...phrases, 'deck-top':'on a platform', step:'on a step', walkway:'on the walkway',
 board:'on a wooden board', box:'on a box', stool:'on a stool', grass:'on the grass',
 chair:'on a chair', 'lounge-chair':'on a lounge chair', sand:'on the sand', rock:'on a rock',
};
const outdoors = getSceneDependentOptions([], {subjectCount:'1', sceneAttributeId:'outdoor'}).locationOptions.filter(o=>o.zh!=='全無' && !o.zh.includes('日本 Lawson 便利商店'));
for (const [region, locations, surfaces, contact, count, unique] of [
 ['indoor', places, scenes, phrases, 6240, 66],
 ['outdoor', outdoors, outdoorScenes, outdoorPhrases, 6720, 84],
]) test(region + ' manual kneels × six actions × ten framings preserve selections, RNG and exact projected contact',()=>{
 let compared=0;const seen=new Set();
 for(const place of locations)for(const action of kneelActions)for(const frame of seatFramings){
  const before=seatFixture(place.zh,action.zh,frame),old=cards(before);
  for(const id of surfaces[place.id]){const after=seatFixture(place.zh,action.zh,frame,{indoorKneelId:id}),next=cards(after),label=place.zh+'/'+action.id+'/'+id+'/'+frame,expected=expectedKneel(action.id,contact[id]);
   assert.equal(after.draws,before.draws,label);assert.deepEqual(after.prompt.selection,{...before.prompt.selection,indoorKneelId:id},label);
   assert.ok(next['grok-imagine'].includes(expected),label+'/G7 complete');assert.equal(next['full-body-character'],old['full-body-character'],label+'/reference');
   for(const key of ['gpt','grok','ai','nano-banana-2.1','chest-up-portrait'])assert.equal(next[key],old[key].replaceAll(action.en,expected),label+'/'+key);
   seen.add(action.id+'/'+id);compared++;
  }
 }
 assert.equal(compared,count);assert.equal(seen.size,unique);
});

test('six poses × four capture styles × ten framings keep selected bench, gestures, props, head and gaze',()=>{
 for(const action of kneelActions)for(const captureStyleId of ['standard','selfie','companion','mirror'])for(const frame of seatFramings){
  const settings={captureStyleId,gestureId:'gesture-collarbone',headPostureId:'chin-slightly-raised',gazeId:'gaze-camera',propId:'hand-hold-iced-coffee'};
  const before=seatFixture('室內：無人月台長椅區',action.zh,frame,settings),after=seatFixture('室內：無人月台長椅區',action.zh,frame,{...settings,indoorKneelId:'bench'});
  assert.equal(after.draws,before.draws);assert.deepEqual(after.prompt.selection,{...before.prompt.selection,indoorKneelId:'bench'});
  const next=cards(after)['grok-imagine'],old=cards(before)['grok-imagine'];assert.ok(next.includes('on a bench'));assert.ok(next.includes('her hips resting on a bench')||action.id!=='specified-kneeling-wide');
  for(const text of ['one hand resting on her collarbone','chin slightly raised','iced coffee'])if(old.includes(text))assert.ok(next.includes(text),text);
  assert.equal(cards(after)['full-body-character'],cards(before)['full-body-character']);
 }
});

test('random choices, incompatible surfaces, fixed hands and excluded owners ignore an ineffective manual surface',()=>{
 const full=seatFramings.find(id=>id.includes('full-body-shot')),character=controls.find(c=>c.key==='characterProfileId').options.find(o=>o.specialSubject==='character-profile');
 for(const patch of [{specifiedActionId:'random'},{specifiedActionId:'none'},{locationId:''},{subjectCount:'2'},{fixedCompositionSetId:'japan-carriage-bench-front'},
  {locationId:controls.find(c=>c.key==='locationId').options.find(o=>o.zh==='戶外：森林步道').id},{specifiedActionId:'specified-kneeling-all-fours-palms'},
  {specifiedActionId:'specified-kneeling-all-fours-forearms'},{specifiedActionId:'specified-kneeling-wide-hands-front'},
  {characterProfileId:character.id},{importedWorldSceneMode:'architecture',importedWorldSceneArchitectureText:'an indoor room'},
  {actionPoseCardId:'low-seated-aloof-cats-street-mood'},{indoorKneelId:'unknown'},{indoorKneelId:'bench'}]){
  const before=seatFixture('室內：精品飯店房間','跪坐',full,patch),after=seatFixture('室內：精品飯店房間','跪坐',full,{indoorKneelId:'bed-top',...patch});
  assert.deepEqual(after.cards,before.cards);assert.equal(after.draws,before.draws);assert.equal(after.prompt.selection.indoorKneelId,undefined);
 }
});

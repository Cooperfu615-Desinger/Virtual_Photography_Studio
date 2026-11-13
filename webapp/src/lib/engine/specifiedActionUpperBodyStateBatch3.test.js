import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { getLockControls } from '../engine.js';
import { SPECIFIED_ACTION_CONCRETE_OPTIONS } from './specifiedActions.js';
import { indoorKneelingModel, applyIndoorKneel } from './indoorKneeling.js';
import { transitionPage1Locks } from '../../features/page1/lockTransitions.js';
import { buildMarkdownExport, buildRestoreLocks, deserializeFavoritePrompt, parseExportedMarkdownPrompt, serializeFavoritePrompt } from '../../features/saved-cards/cardCodec.js';
import { createSavedCardsArchive, parseSavedCardsArchive } from '../../features/saved-cards/savedCardArchive.js';
import { withGrokImagineForSave } from '../grokImagineResult.js';
import { buildPage1DisplayOutputs } from '../page1PromptOutputs.js';
import { UPPER_BODY_STATE_BATCH3, UPPER_BODY_STATE_BATCH3_SCENES, UPPER_BODY_STATE_PARIS, upperBodyStateBatch3Cases,
  upperBodyStateBatch3SupportCases, upperBodyStateBatch3SourceRows, runUpperBodyStateCase, upperBodyStateRow,
  upperBodyStateLocks, upperBodyStateOption, batch3PreviousProjection, batch3ComparableText } from './specifiedActionUpperBodyStateBatch3Fixtures.js';

const before = JSON.parse(gunzipSync(readFileSync(new URL('../../../../Docs/reports/pose-upper-body-state-batch3-2026-11-12/before.json.gz', import.meta.url))));
const controls = getLockControls();
const targets = new Map(UPPER_BODY_STATE_BATCH3.map(target=>[target.id,target]));
const mainOutputs = new Set(['gpt','grok','ai','nano-banana-2.1']);
const outputValues = card=>buildPage1DisplayOutputs(card).cards.map(output=>[output.id,output.value]);
const isUpperCrop = result=>['中景鏡頭 (Medium Shot)','胸上特寫'].includes(controls.find(control=>control.key==='framingId').options.find(frame=>frame.id===result.prompt.selection.framingId)?.zh);
const mayChange = (fixture,result,card)=>fixture.target && (card.id==='chest-up-portrait'||isUpperCrop(result)&&mainOutputs.has(card.id));
const assertPosture = (text,target,label)=>{
  const stem=target.upper.replace(/\.$/,'');
  assert.equal(text.split(stem).length-1,1,label+'/one reviewed posture fragment');
};

test('batch 3 historical providers exclude only the separately reviewed adjustable cat addition',()=>{
  const added='specified-sitting-low-aloof-cats-adjustable-angle';
  assert.ok(SPECIFIED_ACTION_CONCRETE_OPTIONS.some(action=>action.id===added));
  const originalIds=SPECIFIED_ACTION_CONCRETE_OPTIONS.filter(action=>action.id!==added).map(action=>action.id);
  assert.deepEqual(upperBodyStateBatch3SourceRows().map(row=>row.id),originalIds);
  const scenarioIds=new Set(upperBodyStateBatch3Cases().map(fixture=>fixture.locks.specifiedActionId));
  assert.deepEqual(scenarioIds,new Set([...originalIds,'none']));
});

test('batch 3 changes only six reviewed kneeling projections, retaining original head crops and every other source field',()=>{
  assert.equal(before.base,'03f2664465351d06abe890445f55b0e1f6791f3d');
  assert.deepEqual(UPPER_BODY_STATE_BATCH3,before.targets);
  const sources=upperBodyStateBatch3SourceRows();
  assert.deepEqual(sources.map(row=>row.id),before.actions.map(row=>row.id));
  for(const [index,{id,source}] of sources.entries()){
    const original=before.actions[index].source,target=targets.get(id);
    if(!target){assert.deepEqual(source,original,id);continue;}
    assert.equal(original.upperBodyEn,target.previousUpper,id);
    assert.equal(source.upperBodyEn,target.upper,id);
    assert.equal(source.meta.upperBodyOmitted,undefined,id);
    for(const bucket of ['chestUp','mediumWaist'])assert.deepEqual(source.meta.projectionByBucket[bucket],{mode:'projected',en:target.upper},id+'/'+bucket);
    if(target.previousUpper)assert.equal(source.meta.upperBodyEnByFraming['頭部主導近景'],target.previousUpper,id);
    else assert.deepEqual(source.meta.upperBodyOmittedFramings,['頭部主導近景'],id);
    source.upperBodyEn=original.upperBodyEn;
    source.meta.projectionByBucket.chestUp=original.meta.projectionByBucket.chestUp;
    source.meta.projectionByBucket.mediumWaist=original.meta.projectionByBucket.mediumWaist;
    delete source.meta.upperBodyEnByFraming;
    delete source.meta.upperBodyOmittedFramings;
    if(original.meta.upperBodyOmitted)source.meta.upperBodyOmitted=original.meta.upperBodyOmitted;
    assert.deepEqual(source,original,id+'/all other fields');
  }
});

test('same-seed seven-output scenarios preserve all words outside approved posture and the existing conditional Z capture opening',()=>{
  const cases=upperBodyStateBatch3Cases();
  assert.deepEqual(cases.map(fixture=>fixture.key),Object.keys(before.rows));
  const zOpeningCases=new Set(['specified-kneeling-seiza','specified-kneeling-wide','specified-kneeling-side-sit','specified-kneeling-one-knee-forward']
    .flatMap(id=>['中景鏡頭 (Medium Shot)','胸上特寫'].flatMap(frame=>['general','paris'].map(mode=>id+'/'+frame+'/'+mode))));
  const oldOpening='Photorealistic editorial portrait.';
  const captureOpening='Photorealistic editorial portrait of one young adult woman.';
  let compared=0,zOpeningChanges=0;
  for(const fixture of cases){
    const result=runUpperBodyStateCase(fixture),row=upperBodyStateRow(result),original=before.rows[fixture.key];
    assert.equal(row.resolved,original.resolved,fixture.key+'/resolved');
    for(const card of result.cards){
      compared++;
      const label=fixture.key+'/'+card.id;
      if(!mayChange(fixture,result,card)){assert.equal(row.outputs[card.id],original.outputs[card.id],label);continue;}
      const target=targets.get(fixture.locks.specifiedActionId);
      assertPosture(card.value,target,label);
      let expectedText=original.texts[card.id];
      if(card.id==='grok'&&zOpeningCases.has(fixture.key)){
        // Existing E1 policy introduces the person when scene-first capture now
        // contains a visible pose. Pin the exact 16 triggers and two full lines.
        assert.equal(expectedText.split('\n')[0],oldOpening,label+'/historical opening');
        assert.equal(card.value.split('\n')[0],captureOpening,label+'/existing E1 opening');
        expectedText=captureOpening+expectedText.slice(oldOpening.length);
        zOpeningChanges++;
      }
      assert.equal(batch3ComparableText(batch3PreviousProjection(card.value,target)),batch3ComparableText(expectedText),label+'/only approved posture and exact E1 opening');
    }
  }
  assert.equal(compared,cases.length*7-12); // Duo intentionally has five public outputs.
  assert.equal(zOpeningChanges,16);
  assert.equal(zOpeningCases.size,16);
});

test('all 156 current scenes, six kneels, every surface and framing preserve effective support and protected public outputs',()=>{
  assert.equal(Object.keys(UPPER_BODY_STATE_BATCH3_SCENES).length,156);
  let compared=0;
  const scenes=new Set(),surfaces=new Set();
  for(const fixture of upperBodyStateBatch3SupportCases()){
    const result=runUpperBodyStateCase(fixture),row=upperBodyStateRow(result),original=before.supportRows[fixture.key];
    assert.ok(original,fixture.key);
    assert.equal(row.resolved,original.resolved,fixture.key+'/resolved');
    assert.equal(result.prompt.selection.indoorKneelId,fixture.locks.indoorKneelId,fixture.key+'/support selection');
    const target=targets.get(fixture.locks.specifiedActionId);
    const action=SPECIFIED_ACTION_CONCRETE_OPTIONS.find(action=>action.id===target.id);
    const place=controls.find(control=>control.key==='locationId').options.find(place=>place.id===fixture.locks.locationId);
    const support=indoorKneelingModel(fixture.locks,place,controls);
    const canonical=applyIndoorKneel(action.en,support);
    assert.ok(result.cards.find(card=>card.id==='grok-imagine').value.includes(canonical),fixture.key+'/complete canonical contact');
    for(const card of result.cards){
      if(mayChange(fixture,result,card))assertPosture(card.value,target,fixture.key+'/'+card.id);
      else assert.equal(row.outputs[card.id],original.outputs[card.id],fixture.key+'/'+card.id);
    }
    scenes.add(fixture.locks.locationId);if(fixture.locks.indoorKneelId)surfaces.add(fixture.locks.indoorKneelId);compared++;
  }
  assert.equal(compared,Object.keys(before.supportRows).length);
  assert.equal(compared,24684);
  assert.equal(scenes.size,156);
  assert.equal(surfaces.size,22);
});

test('Paris import order and valid or invalid scene-support transitions retain the existing ownership rules',()=>{
  const transition=(previous,patch)=>transitionPage1Locks({previousLocks:previous,candidateLocks:{...previous,...patch},lockControls:controls});
  const initial=upperBodyStateLocks({framingId:upperBodyStateOption('framingId','中景鏡頭 (Medium Shot)')});
  const imported={...UPPER_BODY_STATE_PARIS,locationId:'',fixedCompositionSetId:'none',fixedSetPositionId:'none'};
  const hotel=upperBodyStateOption('locationId','室內：精品飯店房間');
  const forest=upperBodyStateOption('locationId','戶外：森林步道');
  for(const target of UPPER_BODY_STATE_BATCH3){
    for(const locks of [transition(transition(initial,{specifiedActionId:target.id}),imported),transition(transition(initial,imported),{specifiedActionId:target.id})]){
      const result=runUpperBodyStateCase({key:target.id,seed:'batch3-paris-order',locks});
      for(const card of result.cards.filter(card=>mainOutputs.has(card.id)||card.id==='chest-up-portrait'))assertPosture(card.value,target,target.id+'/'+card.id);
      assert.equal(result.prompt.selection.indoorKneelId,undefined,target.id+'/import has no manual support');
    }
    const selected=transition(initial,{locationId:hotel,specifiedActionId:target.id,indoorKneelId:'bed-top'});
    assert.equal(selected.indoorKneelId,'bed-top');
    for(const next of UPPER_BODY_STATE_BATCH3)assert.equal(transition(selected,{specifiedActionId:next.id}).indoorKneelId,'bed-top');
    assert.equal(transition(selected,{locationId:forest}).indoorKneelId,undefined);
    const outdoor=transition(selected,{locationId:forest,indoorKneelId:'ground'});
    assert.equal(outdoor.indoorKneelId,'ground');
    assert.equal(transition(outdoor,{indoorKneelId:'unknown'}).indoorKneelId,undefined);
    assert.equal(transition(selected,imported).indoorKneelId,undefined);
    assert.equal(transition(selected,{specifiedActionId:'specified-kneeling-all-fours-palms'}).indoorKneelId,undefined);
  }
});

test('all six kneels and framings retain seven saved texts and effective support through favorites, Markdown, ZIP and regeneration',async()=>{
  const cases=[],frames=controls.find(control=>control.key==='framingId').options;
  const contexts=[['paris',UPPER_BODY_STATE_PARIS],['indoor',{locationId:upperBodyStateOption('locationId','室內：精品飯店房間'),indoorKneelId:'bed-top'}],['outdoor',{locationId:upperBodyStateOption('locationId','戶外：森林步道'),indoorKneelId:'ground'}]];
  for(const target of UPPER_BODY_STATE_BATCH3)for(const frame of frames)for(const [name,context] of contexts){
    const fixture={key:target.id+'/'+frame.id+'/'+name,seed:'batch3-saved/'+target.id+'/'+frame.id+'/'+name,
      locks:upperBodyStateLocks({specifiedActionId:target.id,framingId:frame.id,...context,headPostureId:'head-slight-tilt',gazeId:'gaze-camera'})};
    const result=runUpperBodyStateCase(fixture);
    cases.push({fixture,card:withGrokImagineForSave({...result.prompt,id:fixture.key,date:'2026-11-12T08:00:00.000Z',source:'page1'})});
  }
  // Every support noun is also restored for each action, beyond the three common contexts.
  const representatives=new Map();
  for(const [locationId,surfaces] of Object.entries(UPPER_BODY_STATE_BATCH3_SCENES))for(const surface of surfaces)if(!representatives.has(surface))representatives.set(surface,locationId);
  for(const target of UPPER_BODY_STATE_BATCH3)for(const [surface,locationId] of representatives){
    const fixture={key:target.id+'/surface/'+surface,seed:'batch3-saved/'+target.id+'/'+surface,
      locks:upperBodyStateLocks({specifiedActionId:target.id,locationId,indoorKneelId:surface,framingId:upperBodyStateOption('framingId','中景鏡頭 (Medium Shot)')})};
    cases.push({fixture,card:withGrokImagineForSave({...runUpperBodyStateCase(fixture).prompt,id:fixture.key,date:'2026-11-12T08:00:00.000Z',source:'page1'})});
  }
  const archive=await parseSavedCardsArchive(await createSavedCardsArchive(cases.map(row=>row.card),0,'uint8array'),controls);
  assert.equal(archive.length,cases.length);
  const archived=new Map(archive.map(card=>[card.id,card]));
  for(const {fixture,card} of cases){
    const expected=outputValues(card);assert.equal(expected.length,7,fixture.key);
    for(const restored of [deserializeFavoritePrompt(serializeFavoritePrompt(card)),parseExportedMarkdownPrompt(buildMarkdownExport(card),controls,card.id),archived.get(card.id)]){
      assert.deepEqual(outputValues(restored),expected,fixture.key+'/saved public texts');
      const locks=buildRestoreLocks(restored.selection,controls);
      assert.equal(locks.specifiedActionId,card.selection.specifiedActionId,fixture.key);
      assert.equal(locks.indoorKneelId,card.selection.indoorKneelId,fixture.key+'/support');
      assert.equal(locks.importedWorldSceneArchitectureText,card.selection.importedWorldSceneArchitectureText,fixture.key+'/import');
      const regenerated=runUpperBodyStateCase({...fixture,locks});
      assert.deepEqual(regenerated.cards.map(output=>[output.id,output.value]),expected,fixture.key+'/regenerated');
    }
  }
  assert.equal(cases.length,330);
});

test('historical saved seven-output text stays verbatim until the user explicitly regenerates',()=>{
  for(const target of UPPER_BODY_STATE_BATCH3){
    const fixture=upperBodyStateBatch3Cases().find(fixture=>fixture.locks.specifiedActionId===target.id&&fixture.key.includes('/中景鏡頭 (Medium Shot)/general'));
    const current=withGrokImagineForSave(runUpperBodyStateCase(fixture).prompt),old=before.rows[fixture.key].texts;
    const saved={...current,grokPrompt:old.gpt,zImagePrompt:old.grok,midjourneyPrompt:old.ai,nanoBananaPrompt:old['nano-banana-2.1'],extraPrompts:current.extraPrompts.map(entry=>({...entry,text:old[entry.id]}))};
    for(const restored of [deserializeFavoritePrompt(serializeFavoritePrompt(saved)),parseExportedMarkdownPrompt(buildMarkdownExport(saved),controls,saved.id)]){
      assert.deepEqual(outputValues(restored),Object.entries(old),target.id+'/historical public text');
      const regenerated=runUpperBodyStateCase({...fixture,locks:buildRestoreLocks(restored.selection,controls)});
      assertPosture(regenerated.prompt.grokPrompt,target,target.id+'/regenerated');
    }
  }
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSeededRandom, generatePrompts, getLockControls, normalizeLocks } from '../../lib/engine.js';
import { resolveCapture } from '../../lib/observationCaptureMode.js';
import { getReferencePersonPreview } from '../../lib/referencePersonPreview.js';
import { getGrokImagineResult, withGrokImagineForSave } from '../../lib/grokImagineResult.js';
import { buildPage1DisplayOutputs } from '../../lib/page1PromptOutputs.js';
import { indoorSeatingModel } from '../../lib/engine/indoorSeating.js';
import { SPECIFIED_ACTION_CONCRETE_OPTIONS } from '../../lib/engine/specifiedActions.js';
import { seatFixture, seatFramings } from '../../lib/engine/indoorSeatFixtures.js';
import { transitionPage1Locks } from '../page1/lockTransitions.js';
import { buildMarkdownExport, buildRestoreLocks, deserializeFavoritePrompt, parseExportedMarkdownPrompt, serializeFavoritePrompt } from './cardCodec.js';
import { createSavedCardsArchive, parseSavedCardsArchive } from './savedCardArchive.js';

const controls=getLockControls(),full=seatFramings.find(id=>id.includes('full-body-shot'));
const location=zh=>controls.find(c=>c.key==='locationId').options.find(o=>o.zh===zh);
const make=(id,room,pose,seat)=>withGrokImagineForSave({...seatFixture(room,pose,full,seat?{indoorSeatId:seat}:{}).prompt,id,date:'2026-11-06T12:00:00.000Z',source:'page1'});
const displayed=card=>{
  const output=buildPage1DisplayOutputs(card);
  assert.deepEqual(output.dllSources.map(o=>o.value),output.cards.map(o=>o.value));
  return output.cards.map(o=>o.value);
};

test('all eight new IDs, fourteen sitting actions and old indoor cards survive save, Markdown, ZIP and regeneration',async()=>{
  const cards=[
    make('ground','戶外：白色鹽湖乾裂荒漠','自然坐姿','ground'),make('grass','其他：草地','盤腿坐姿','grass'),
    make('sand','其他：沙灘海岸線','雙腿側放坐姿','sand'),make('rock','戶外：清澈海灣岩岸','翹二郎腿','rock'),
    make('wall','戶外：高樓頂樓城市天際線','微微前傾','low-wall'),make('lounger','戶外：飯店度假村泳池露台','隨性癱坐','lounge-chair'),
    make('edge','戶外：日式旅館緣側木廊','自然坐姿','deck-edge'),make('top','戶外：日式旅館緣側木廊','盤腿坐姿','deck-top'),
    make('mat','戶外：金色海灘與浪線','雙腿屈起','mat'),make('chair','室內：日本學校教室','自然坐姿','chair'),
    make('bed','室內：精品飯店房間','自然坐姿','bed-edge'),make('tatami','室內：日式和室','盤腿坐姿','floor'),
    make('unspecified','其他：沙灘海岸線','自然坐姿'),
  ];
  const camp=location('戶外：森林營地帳篷營火');
  for(const action of SPECIFIED_ACTION_CONCRETE_OPTIONS.filter(o=>o.family==='sitting')) {
    const model=indoorSeatingModel({subjectCount:'1',locationId:camp.id,specifiedActionId:action.id},camp,controls);
    cards.push(make(action.id,camp.zh,action.zh,model.options?.[0]?.id));
  }
  const archive=await parseSavedCardsArchive(await createSavedCardsArchive(cards,0,'uint8array'),controls);
  for(const card of cards) {
    const original=displayed(card),md=buildMarkdownExport(card);
    assert.equal(original.length,7);
    if(!card.selection.indoorSeatId) assert.ok(!md.includes('indoorSeatId'));
    for(const read of [deserializeFavoritePrompt(serializeFavoritePrompt(card)),parseExportedMarkdownPrompt(md,controls,card.id),archive.find(o=>o.id===card.id)]) {
      assert.deepEqual(displayed(read),original,card.id);
      const locks=normalizeLocks(buildRestoreLocks(read.selection,controls));
      assert.equal(locks.indoorSeatId,card.selection.indoorSeatId,card.id);
      const [next]=generatePrompts(1,locks,[],{random:createSeededRandom('outdoor-restore')});assert.ok(next);
      assert.equal(next.selection.indoorSeatId,card.selection.indoorSeatId,card.id);
      const selectedLocation=controls.find(c=>c.key==='locationId').options.find(o=>o.id===locks.locationId);
      const model=indoorSeatingModel(locks,selectedLocation,controls);
      if(model?.phrase) assert.ok(getGrokImagineResult(next).includes(model.phrase),card.id);
    }
  }
});

test('unknown/incompatible IDs drop on restore while saved public text and legacy selections are retained',()=>{
  const card=make('test','其他：沙灘海岸線','自然坐姿','sand'),md=buildMarkdownExport(card);
  for(const id of ['unknown','grass','floor','bed-edge','deck-top']) {
    const read=parseExportedMarkdownPrompt(md.replace('"indoorSeatId":"sand"','"indoorSeatId":"'+id+'"'),controls,'test');
    assert.equal(read.selection.indoorSeatId,undefined);assert.deepEqual(displayed(read),displayed(card));
  }
  const legacy=make('legacy','戶外：清澈海灣岩岸','自然坐姿');
  const imported=parseExportedMarkdownPrompt(buildMarkdownExport(legacy),controls,'legacy');
  assert.equal(imported.selection.indoorSeatId,undefined);assert.deepEqual(displayed(imported),displayed(legacy));
});

test('reference preview keeps the source; capture preserves dormant selection but owns its output',()=>{
  const {prompt,locks}=seatFixture('其他：草地','自然坐姿',full,{indoorSeatId:'grass'});
  assert.match(getGrokImagineResult(getReferencePersonPreview(prompt)),/sits on the grass/);
  const character=controls.find(c=>c.key==='characterProfileId').options.find(o=>o.specialSubject==='character-profile');
  const capture={...locks,characterProfileId:character.id,captureMode:'observation',observationCapture:resolveCapture({seed:27}).profile};
  assert.equal(normalizeLocks(capture).indoorSeatId,'grass');
  const gen=state=>generatePrompts(1,state,[],{random:createSeededRandom('outdoor-capture')})[0];
  const withSeat=gen(capture),without=gen({...capture,indoorSeatId:''});assert.ok(withSeat&&without);
  assert.deepEqual(displayed(withSeat),displayed(without));assert.equal(withSeat.selection.indoorSeatId,undefined);
  const resumed=transitionPage1Locks({previousLocks:capture,candidateLocks:{...capture,captureMode:'standard',characterProfileId:'none',locationId:location('其他：沙灘海岸線').id},lockControls:controls});
  assert.equal(resumed.indoorSeatId,undefined);
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSeededRandom, generatePrompts, getLockControls, normalizeLocks } from '../../lib/engine.js';
import { resolveCapture } from '../../lib/observationCaptureMode.js';
import { getReferencePersonPreview } from '../../lib/referencePersonPreview.js';
import { getGrokImagineResult, withGrokImagineForSave } from '../../lib/grokImagineResult.js';
import { buildPage1DisplayOutputs } from '../../lib/page1PromptOutputs.js';
import { seatFixture, seatFramings } from '../../lib/engine/indoorSeatFixtures.js';
import { transitionPage1Locks } from '../page1/lockTransitions.js';
import { buildMarkdownExport, buildRestoreLocks, deserializeFavoritePrompt, parseExportedMarkdownPrompt, serializeFavoritePrompt } from './cardCodec.js';
import { createSavedCardsArchive, parseSavedCardsArchive } from './savedCardArchive.js';
const controls=getLockControls(),full=seatFramings.find(id=>id.includes('full-body-shot'));
const make=(id,room,pose,values={})=>withGrokImagineForSave({...seatFixture(room,pose,full,values).prompt,id,date:'2026-11-06T12:00:00.000Z',source:'page1'});
const display=card=>{
  const output=buildPage1DisplayOutputs(card);
  assert.deepEqual(output.dllSources.map(o=>o.value),output.cards.map(o=>o.value));
  return output.cards.map(o=>o.value);
};

test('all nine nouns and both applicable poses survive save, Markdown, ZIP, apply and regeneration',async()=>{
  const cases=[['戶外：森林步道','tree-trunk'],['戶外：清澈海灣岩岸','rock-face'],
    ['戶外：社區自動販賣機旁','vending-machine'],['戶外：滿佈塗鴉的火車調車場','train-car'],
    ['戶外：首爾聖水洞街區','wall'],['戶外：辦公大樓人行道（上班途中）','column'],
    ['戶外：蘇荷區酒吧門口','doorframe'],['戶外：城市遊艇碼頭欄杆旁','railing'],['戶外：澀谷站前大型看板下穿越口','pole']];
  const cards=[];
  for(const [room,id] of cases)for(const pose of ['背部倚靠','側肩倚靠']){
    if(pose==='背部倚靠'&&['doorframe','pole'].includes(id)||pose==='側肩倚靠'&&id==='railing')continue;
    cards.push(make(id+'/'+pose,room,pose,{indoorLeanId:id}));
  }
  cards.push(make('unspecified','戶外：森林步道','背部倚靠'),make('empty','戶外：金色海灘與浪線','側肩倚靠'),
    make('wall-indoor','室內：日本學校教室','背部倚靠',{indoorLeanId:'wall'}),
    make('tv-indoor','室內：CRT 電視牆攝影棚','側肩倚靠',{indoorLeanId:'tv-wall'}),
    make('seat-indoor','室內：精品飯店房間','自然坐姿',{indoorSeatId:'bed-edge'}),
    make('seat-outdoor','其他：沙灘海岸線','盤腿坐姿',{indoorSeatId:'sand'}));
  assert.equal(cards.length,21);
  const archive=await parseSavedCardsArchive(await createSavedCardsArchive(cards,0,'uint8array'),controls);
  for(const card of cards){
    const original=display(card),md=buildMarkdownExport(card);assert.equal(original.length,7);
    if(!card.selection.indoorLeanId)assert.ok(!md.includes('indoorLeanId'));
    for(const read of [deserializeFavoritePrompt(serializeFavoritePrompt(card)),parseExportedMarkdownPrompt(md,controls,card.id),archive.find(o=>o.id===card.id)]){
      assert.deepEqual(display(read),original,card.id);
      const locks=normalizeLocks(buildRestoreLocks(read.selection,controls));
      for(const key of ['indoorLeanId','indoorSeatId'])assert.equal(locks[key],card.selection[key],card.id+'/'+key);
      const [next]=generatePrompts(1,locks,[],{random:createSeededRandom('outdoor-lean-restore')});assert.ok(next);
      assert.equal(next.selection.indoorLeanId,card.selection.indoorLeanId,card.id);
      if(card.selection.indoorLeanId)assert.match(getGrokImagineResult(next),/resting against/);
    }
  }
});

test('unknown or incompatible restored objects drop without rewriting public text; old cards keep their shape',()=>{
  const card=make('test','戶外：森林步道','背部倚靠',{indoorLeanId:'tree-trunk'}),md=buildMarkdownExport(card);
  for(const id of ['unknown','rock-face','tv-wall','vending-machine','pole']){
    const read=parseExportedMarkdownPrompt(md.replace('"indoorLeanId":"tree-trunk"','"indoorLeanId":"'+id+'"'),controls,'test');
    assert.equal(read.selection.indoorLeanId,undefined);assert.deepEqual(display(read),display(card));
  }
  const old=make('legacy','戶外：首爾聖水洞街區','自然站姿');
  const restored=parseExportedMarkdownPrompt(buildMarkdownExport(old),controls,'legacy');
  assert.equal(restored.selection.indoorLeanId,undefined);assert.deepEqual(display(restored),display(old));
  assert.equal(normalizeLocks({...card.selection,indoorLeanId:42}).indoorLeanId,undefined);
});

test('reference identity retains the selected tree; capture owns output while preserving a dormant lock',()=>{
  const {prompt,locks}=seatFixture('戶外：森林步道','背部倚靠',full,{indoorLeanId:'tree-trunk'});
  assert.match(getGrokImagineResult(getReferencePersonPreview(prompt)),/resting against a tree trunk/);
  const character=controls.find(c=>c.key==='characterProfileId').options.find(o=>o.specialSubject==='character-profile');
  const capture={...locks,characterProfileId:character.id,captureMode:'observation',observationCapture:resolveCapture({seed:27}).profile};
  assert.equal(normalizeLocks(capture).indoorLeanId,'tree-trunk');
  const gen=value=>generatePrompts(1,value,[],{random:createSeededRandom('outdoor-lean-capture')})[0];
  const chosen=gen(capture),empty=gen({...capture,indoorLeanId:''});assert.ok(chosen&&empty);
  assert.deepEqual(display(chosen),display(empty));assert.equal(chosen.selection.indoorLeanId,undefined);
  const coast=controls.find(c=>c.key==='locationId').options.find(o=>o.zh==='戶外：清澈海灣岩岸');
  const restored=transitionPage1Locks({previousLocks:capture,candidateLocks:{...capture,captureMode:'standard',characterProfileId:'none',locationId:coast.id},lockControls:controls});
  assert.equal(restored.indoorLeanId,undefined);
});

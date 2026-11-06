import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSeededRandom, generatePrompts, getLockControls, normalizeLocks } from '../../lib/engine.js';
import { resolveCapture } from '../../lib/observationCaptureMode.js';
import { getReferencePersonPreview } from '../../lib/referencePersonPreview.js';
import { seatFixture, seatFramings } from '../../lib/engine/indoorSeatFixtures.js';
import { getGrokImagineResult, withGrokImagineForSave } from '../../lib/grokImagineResult.js';
import { buildPage1DisplayOutputs } from '../../lib/page1PromptOutputs.js';
import { buildMarkdownExport, buildRestoreLocks, deserializeFavoritePrompt, parseExportedMarkdownPrompt, serializeFavoritePrompt } from './cardCodec.js';
import { createSavedCardsArchive, parseSavedCardsArchive } from './savedCardArchive.js';
const controls=getLockControls(), full=seatFramings.find(id=>id.includes('full-body-shot'));
const make=(id,room,pose,object)=>withGrokImagineForSave({...seatFixture(room,pose,full,object?{indoorLeanId:object}:{}).prompt,id,date:'2026-11-06T00:00:00.000Z',source:'page1'});
const display=card=>{
  const result=buildPage1DisplayOutputs(card);
  assert.deepEqual(result.dllSources.map(o=>o.value),result.cards.map(o=>o.value));
  return result.cards.map(o=>o.value);
};

test('both poses and all support IDs survive local storage, Markdown, ZIP, apply and regeneration',async()=>{
  const cards=[
    make('wall','室內：日本學校教室','背部倚靠','wall'),
    make('cabinet','室內：日本學校教室','側肩倚靠','cabinet'),
    make('column','室內：日式和室','背部倚靠','column'),
    make('bookcase','室內：古書二手書店','側肩倚靠','bookcase'),
    make('tv','室內：CRT 電視牆攝影棚','側肩倚靠','tv-wall'),
    make('rail','室內：夜間家庭派對','背部倚靠','railing'),
    make('door','室內：日本學校教室','側肩倚靠','doorframe'),
    make('pole','室內：電車車廂側面走道視角','側肩倚靠','pole'),
    make('unspecified','其他：生活感日式榻榻米房間','背部倚靠'),
    make('legacy','室內：日本學校教室','自然站姿'),
  ];
  const archive=await parseSavedCardsArchive(await createSavedCardsArchive(cards,0,'uint8array'),controls);
  for(const card of cards) {
    const original=display(card),md=buildMarkdownExport(card);
    assert.equal(original.length,7);
    if(!card.selection.indoorLeanId) assert.ok(!md.includes('indoorLeanId'));
    for(const read of [deserializeFavoritePrompt(serializeFavoritePrompt(card)),parseExportedMarkdownPrompt(md,controls,card.id),archive.find(c=>c.id===card.id)]) {
      assert.deepEqual(display(read),original);
      const locks=normalizeLocks(buildRestoreLocks(read.selection,controls));
      assert.equal(locks.indoorLeanId,card.selection.indoorLeanId);
      const [next]=generatePrompts(1,locks,[],{random:createSeededRandom('lean-restore')});
      assert.equal(next.selection.indoorLeanId,card.selection.indoorLeanId);
      if(card.selection.indoorLeanId) assert.match(getGrokImagineResult(next),/resting against/);
    }
  }
});

test('unknown/incompatible restored object clears without changing the saved public text',()=>{
  const card=make('test','室內：日本學校教室','背部倚靠','wall'), md=buildMarkdownExport(card);
  for(const id of ['unknown','tv-wall','pole','doorframe']) {
    const read=parseExportedMarkdownPrompt(md.replace('"indoorLeanId":"wall"','"indoorLeanId":"'+id+'"'),controls,'test');
    assert.equal(read.selection.indoorLeanId,undefined);assert.deepEqual(display(read),display(card));
  }
  assert.equal(normalizeLocks({...card.selection,indoorLeanId:42}).indoorLeanId,undefined);
});

test('reference preview retains lean; observation capture neither emits nor saves dormant support',()=>{
  const {prompt:card}=seatFixture('室內：日本學校教室','背部倚靠',full,{indoorLeanId:'wall'});
  const reference=getReferencePersonPreview(card);
  assert.match(buildPage1DisplayOutputs(reference).cards.find(o=>o.id==='grok-imagine').value,/resting against a wall/);
  const character=controls.find(c=>c.key==='characterProfileId').options.find(o=>o.specialSubject==='character-profile');
  const locks={...card.selection,characterProfileId:character.id,captureMode:'observation',observationCapture:resolveCapture({seed:27}).profile};
  assert.equal(normalizeLocks(locks).indoorLeanId,'wall');
  const gen=l=>generatePrompts(1,l,[],{random:createSeededRandom('lean-capture')})[0];
  const withLean=gen(locks), without=gen({...locks,indoorLeanId:''});
  assert.ok(withLean && without);
  assert.deepEqual(display(withLean),display(without));
  assert.equal(withLean.selection.indoorLeanId,undefined);
});

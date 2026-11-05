import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSeededRandom, generatePrompts, getLockControls, normalizeLocks } from '../../lib/engine.js';
import { resolveCapture } from '../../lib/observationCaptureMode.js';
import { getReferencePersonPreview } from '../../lib/referencePersonPreview.js';
import { seatFixture } from '../../lib/engine/indoorSeatFixtures.js';
import { withGrokImagineForSave } from '../../lib/grokImagineResult.js';
import { buildPage1DisplayOutputs } from '../../lib/page1PromptOutputs.js';
import { transitionPage1Locks } from '../page1/lockTransitions.js';
import { buildMarkdownExport, buildRestoreLocks, deserializeFavoritePrompt, parseExportedMarkdownPrompt, serializeFavoritePrompt } from './cardCodec.js';
import { createSavedCardsArchive, parseSavedCardsArchive } from './savedCardArchive.js';
const controls = getLockControls();
const full = controls.find(c=>c.key==='framingId').options.find(x=>x.zh==='全身鏡頭 (Full Body Shot)').id;
function makeCard(id, location, action, seat) {
  const {prompt} = seatFixture(location, action, full, seat ? {indoorSeatId:seat} : {});
  return withGrokImagineForSave({...prompt, id, date:'2026-11-05T00:00:00.000Z', source:'page1'});
}
function displayed(card) {
  const display=buildPage1DisplayOutputs(card);
  assert.deepEqual(display.dllSources.map(s=>s.value),display.cards.map(c=>c.value));
  return display.cards.map(c=>c.value);
}
test('bed edge, bed top, tatami, cushion and a legacy card survive save, Markdown, ZIP and apply', async () => {
  const cards=[
    makeCard('edge','室內：精品飯店房間','自然坐姿','bed-edge'),
    makeCard('top','室內：精品飯店房間','盤腿坐姿','bed-top'),
    makeCard('tatami','室內：日式和室','盤腿坐姿','floor'),
    makeCard('cushion','其他：生活感日式榻榻米房間','微微前傾','cushion'),
    makeCard('legacy','室內：日本學校教室','自然坐姿'),
  ];
  const archive=await parseSavedCardsArchive(await createSavedCardsArchive(cards,0,'uint8array'),controls);
  const phrases=['on the edge of the bed','on the bed','on the tatami floor','on a cushion',''];
  for(const [i,card] of cards.entries()) {
    const original=displayed(card);
    assert.equal(original.length,7);
    if(phrases[i]) assert.ok(original.at(-1).includes(phrases[i]));
    const md=buildMarkdownExport(card);
    if(!phrases[i]) assert.ok(!md.includes('indoorSeatId'));
    for(const read of [deserializeFavoritePrompt(serializeFavoritePrompt(card)),parseExportedMarkdownPrompt(md,controls,card.id),archive.find(c=>c.id===card.id)]) {
      assert.deepEqual(displayed(read),original);
      const restored=normalizeLocks(buildRestoreLocks(read.selection,controls));
      assert.equal(restored.indoorSeatId,card.selection.indoorSeatId);
      const [next]=generatePrompts(1,restored,[],{random:createSeededRandom('restore-seat')});
      assert.equal(next.selection.indoorSeatId,card.selection.indoorSeatId);
      if(phrases[i]) assert.ok(displayed(next).at(-1).includes(phrases[i]));
    }
  }
});
test('unknown or incompatible saved seat falls back to unspecified without changing stored prompt text',()=>{
  const card=makeCard('fixture','室內：日本學校教室','自然坐姿','chair');
  const md=buildMarkdownExport(card);
  for(const id of ['unknown-seat','bed-edge']) {
    const imported=parseExportedMarkdownPrompt(md.replace('"indoorSeatId":"chair"','"indoorSeatId":"'+id+'"'),controls,'legacy');
    assert.equal(imported.selection.indoorSeatId,undefined);
    assert.deepEqual(displayed(imported),displayed(card));
  }
});
test('switching rooms or actions preserves only compatible seats; capture keeps its dormant lock',()=>{
  const {locks}=seatFixture('室內：日本學校教室','自然坐姿',full,{indoorSeatId:'chair'});
  const change=(overrides)=>transitionPage1Locks({previousLocks:locks,candidateLocks:{...locks,...overrides},lockControls:controls});
  const id=zh=>controls.find(c=>c.key==='locationId').options.find(x=>x.zh===zh).id;
  assert.equal(change({locationId:id('室內：精品飯店房間')}).indoorSeatId,'chair');
  assert.equal(change({locationId:id('其他：白色床鋪')}).indoorSeatId,undefined);
  assert.equal(change({specifiedActionId:'specified-sitting-cross-legged'}).indoorSeatId,undefined);
  assert.equal(change({locationId:''}).indoorSeatId,undefined);
  assert.equal(change({captureMode:'observation'}).indoorSeatId,'chair');
});

test('reference person retains the chosen pose; observation capture uses its own pose',()=>{
  const {prompt, locks}=seatFixture('室內：日本學校教室','自然坐姿',full,{indoorSeatId:'chair'});
  const reference=getReferencePersonPreview(prompt);
  assert.notEqual(reference,prompt);
  assert.match(displayed(reference).at(-1),/attached reference image/i);
  assert.match(displayed(reference).at(-1),/sits on a chair/i);
  const card=controls.find(c=>c.key==='characterProfileId').options.find(o=>o.specialSubject==='character-profile');
  const capture={...locks,characterProfileId:card.id,captureMode:'observation',observationCapture:resolveCapture({seed:27}).profile};
  const [withSeat]=generatePrompts(1,capture),[withoutSeat]=generatePrompts(1,{...capture,indoorSeatId:''});
  assert.ok(withSeat && withoutSeat);
  assert.deepEqual(displayed(withSeat),displayed(withoutSeat));
  assert.equal(withSeat.selection.indoorSeatId,undefined);
});

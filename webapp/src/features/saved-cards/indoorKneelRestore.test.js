import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createSeededRandom,generatePrompts,getLockControls,normalizeLocks} from '../../lib/engine.js';
import {seatFixture,seatFramings} from '../../lib/engine/indoorSeatFixtures.js';
import {kneelActions} from '../../lib/engine/indoorKneelFixtures.js';
import {getGrokImagineResult,withGrokImagineForSave} from '../../lib/grokImagineResult.js';
import {buildPage1DisplayOutputs} from '../../lib/page1PromptOutputs.js';
import {getReferencePersonPreview} from '../../lib/referencePersonPreview.js';
import {resolveCapture} from '../../lib/observationCaptureMode.js';
import {transitionPage1Locks} from '../page1/lockTransitions.js';
import {buildMarkdownExport,buildRestoreLocks,deserializeFavoritePrompt,parseExportedMarkdownPrompt,serializeFavoritePrompt} from './cardCodec.js';
import {createSavedCardsArchive,parseSavedCardsArchive} from './savedCardArchive.js';
const controls=getLockControls(),full=seatFramings.find(id=>id.includes('full-body-shot'));
const make=(id,room,pose,values={})=>withGrokImagineForSave({...seatFixture(room,pose,full,values).prompt,id,date:'2026-11-07T06:00:00.000Z',source:'page1'});
const display=card=>{const result=buildPage1DisplayOutputs(card);assert.deepEqual(result.dllSources.map(o=>o.value),result.cards.map(o=>o.value));return result.cards.map(o=>o.value)};

test('all eleven surfaces × six poses, unspecified and existing seats/leans survive save, Markdown, ZIP and regeneration',async()=>{
 const cases=[['室內：精品飯店房間','bed-top'],['室內：日本學校教室','floor'],['室內：日式和室','tatami'],['室內：現代高樓公寓客廳','carpet'],['室內：廢棄校舍體育器材室','mat'],['室內：純潔白幕','ground'],['室內：復古美式 Diner','sofa'],['室內：木造圖書館閱讀桌旁','reading-table'],['室內：無人月台長椅區','bench'],['室內：電車車廂側面走道視角','aisle'],['室內：電車車廂坐滿與站滿乘客','train-seat']];
 const cards=cases.flatMap(([room,id])=>kneelActions.map(action=>make(id+'/'+action.id,room,action.zh,{indoorKneelId:id})));
 for(const action of kneelActions)cards.push(make('unspecified/'+action.id,'室內：精品飯店房間',action.zh));
 cards.push(make('indoor-seat','室內：精品飯店房間','自然坐姿',{indoorSeatId:'bed-edge'}),make('outdoor-seat','其他：草地','盤腿坐姿',{indoorSeatId:'grass'}),make('indoor-lean','室內：日本學校教室','背部倚靠',{indoorLeanId:'wall'}),make('outdoor-lean','戶外：森林步道','側肩倚靠',{indoorLeanId:'tree-trunk'}));
 assert.equal(cards.length,76);
 const archive=await parseSavedCardsArchive(await createSavedCardsArchive(cards,0,'uint8array'),controls);
 for(const card of cards){const values=display(card),md=buildMarkdownExport(card);assert.equal(values.length,7);if(!card.selection.indoorKneelId)assert.ok(!md.includes('indoorKneelId'));
  for(const restored of [deserializeFavoritePrompt(serializeFavoritePrompt(card)),parseExportedMarkdownPrompt(md,controls,card.id),archive.find(c=>c.id===card.id)]){
   assert.deepEqual(display(restored),values,card.id);const locks=normalizeLocks(buildRestoreLocks(restored.selection,controls));
   for(const key of ['indoorKneelId','indoorSeatId','indoorLeanId'])assert.equal(locks[key],card.selection[key],card.id+'/'+key);
   const [next]=generatePrompts(1,locks,[],{random:createSeededRandom('indoor-kneel-restore')});assert.ok(next);assert.equal(next.selection.indoorKneelId,card.selection.indoorKneelId,card.id);
  }
 }
});

test('unknown, incompatible and malformed optional values clear while saved public text and old card shape remain intact',()=>{
 const card=make('test','室內：精品飯店房間','分腿跪坐',{indoorKneelId:'bed-top'}),md=buildMarkdownExport(card);
 for(const id of ['unknown','bench','train-seat','aisle']){const read=parseExportedMarkdownPrompt(md.replace('"indoorKneelId":"bed-top"','"indoorKneelId":"'+id+'"'),controls,'test');assert.equal(read.selection.indoorKneelId,undefined);assert.deepEqual(display(read),display(card));}
 const old=make('old','室內：精品飯店房間','跪坐'),read=parseExportedMarkdownPrompt(buildMarkdownExport(old),controls,'old');assert.equal(read.selection.indoorKneelId,undefined);assert.deepEqual(display(read),display(old));
 assert.equal(normalizeLocks({...card.selection,indoorKneelId:42}).indoorKneelId,undefined);
});

test('reference preview uses the same selected surface; capture keeps a dormant value without using it',()=>{
 const {prompt,locks}=seatFixture('室內：精品飯店房間','分腿跪坐',full,{indoorKneelId:'bed-top'});assert.match(getGrokImagineResult(getReferencePersonPreview(prompt)),/her hips resting on the bed/);
 const character=controls.find(c=>c.key==='characterProfileId').options.find(o=>o.specialSubject==='character-profile');
 const capture={...locks,characterProfileId:character.id,captureMode:'observation',observationCapture:resolveCapture({seed:27}).profile};assert.equal(normalizeLocks(capture).indoorKneelId,'bed-top');
 const run=s=>generatePrompts(1,s,[],{random:createSeededRandom('indoor-kneel-capture')})[0];const chosen=run(capture),empty=run({...capture,indoorKneelId:''});assert.ok(chosen&&empty);assert.deepEqual(display(chosen),display(empty));assert.equal(chosen.selection.indoorKneelId,undefined);
 const classroom=controls.find(c=>c.key==='locationId').options.find(o=>o.zh==='室內：日本學校教室');
 const restored=transitionPage1Locks({previousLocks:capture,candidateLocks:{...capture,captureMode:'standard',characterProfileId:'none',locationId:classroom.id},lockControls:controls});assert.equal(restored.indoorKneelId,undefined);
});

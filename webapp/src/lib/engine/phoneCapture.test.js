import { SPECIFIED_ACTION_CONCRETE_OPTIONS } from './specifiedActions.js';
import assert from 'node:assert/strict';
import test from 'node:test';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import { getGrokImagineResult } from '../grokImagineResult.js';
import { resolveCapture } from '../observationCaptureMode.js';
import { deserializeFavoritePrompt, serializeFavoritePrompt } from '../../features/saved-cards/cardCodec.js';
import { resolveProp } from './gazeGesture.js';
import { PHONE_SELFIE_ID, PHONE_MIRROR_ID, COMPANION_ORBIT_ID, migratePhoneCaptureLocks, phoneCaptureStatus } from './phoneCapture.js';
const controls=getLockControls();
const none=()=>{const l={...createEmptyLocks(),subjectCount:'1'};for(const c of controls){const n=c.options.find(o=>o.zh==='全無');if(n)l[c.key]=n.id;}l.framingId=controls.find(c=>c.key==='framingId').options.find(o=>o.zh==='全身鏡頭 (Full Body Shot)').id;return l;};
const run=patch=>generatePrompts(1,{...none(),...patch},[],{random:createSeededRandom('phone-capture-v1')})[0];
test('phone props combine with standing, sitting and kneeling in shared outputs',()=>{
 for(const action of ['specified-standing-natural','specified-sitting-natural','specified-kneeling-seiza'])for(const prop of [PHONE_SELFIE_ID,PHONE_MIRROR_ID]){
  const p=run({specifiedActionId:action,propId:prop});
  for(const text of [p.grokPrompt,p.zImagePrompt,p.nanoBananaPrompt,getGrokImagineResult(p)])assert.match(text,prop===PHONE_SELFIE_ID?/front-camera self-shot/i:/visible phone.*mirror/i);
  assert.equal(p.selection.propId,prop);assert.equal(p.selection.specifiedActionId,action);
 }
});
test('fixed supporting hands pause phone props without deleting selections',()=>{
 const p=run({specifiedActionId:'specified-kneeling-all-fours-palms',propId:PHONE_SELFIE_ID});
 assert.doesNotMatch(p.grokPrompt,/self-shot/);assert.equal(p.selection.propId,PHONE_SELFIE_ID);assert.match(p.grokPrompt,/palms/);
});
test('companion orbit changes camera feeling without replacing pose or hands',()=>{
 const p=run({specifiedActionId:'specified-sitting-natural',orbitId:COMPANION_ORBIT_ID});
 assert.match(p.grokPrompt,/companion snapshot/i);assert.match(p.grokPrompt,/She sits/);assert.doesNotMatch(p.grokPrompt,/hands relaxed in candid|leaning naturally toward/);
});

const outputs = p => [p.grokPrompt, p.zImagePrompt, p.midjourneyPrompt, p.nanoBananaPrompt, getGrokImagineResult(p)];
const PHONE_TEXT = /front-camera self-shot|visible phone toward a mirror/ig;

test('ordinary Z writes each phone capture source once across visible crops and omits it at face crops', () => {
 for (const framing of ['中景鏡頭 (Medium Shot)', '牛仔中景 (Cowboy Shot)', '全身鏡頭 (Full Body Shot)', '胸上特寫', '臉部特寫', '局部五官特寫']) {
  const framingId = controls.find(c => c.key === 'framingId').options.find(o => o.zh === framing).id;
  for (const propId of [PHONE_SELFIE_ID, PHONE_MIRROR_ID]) {
   const p = run({ specifiedActionId: 'specified-standing-natural', propId, framingId });
   const visible = !['臉部特寫', '局部五官特寫'].includes(framing);
   assert.equal((p.zImagePrompt.match(PHONE_TEXT) || []).length, visible ? 1 : 0, `${framing}/${propId}`);
   assert.equal((getGrokImagineResult(p).match(PHONE_TEXT) || []).length, 1, `${framing}/${propId}: seventh output keeps full source`);
   const reference = p.extraPrompts.find(e => e.id === 'full-body-character').text;
   assert.doesNotMatch(reference, /self-shot|visible phone toward a mirror|She kneels/i);
  }
 }
});

test('companion orbit pauses either phone without losing the selected prop or the pose', () => {
 for (const propId of [PHONE_SELFIE_ID, PHONE_MIRROR_ID]) {
  const p = run({ specifiedActionId: 'specified-kneeling-seiza', propId, orbitId: COMPANION_ORBIT_ID });
  for (const text of outputs(p)) assert.doesNotMatch(text, /self-shot|visible phone toward a mirror/i);
  assert.match(p.grokPrompt, /companion snapshot/i);
  assert.match(p.grokPrompt, /She kneels/i);
  assert.equal(p.selection.propId, propId);
  assert.equal(p.selection.orbitId, COMPANION_ORBIT_ID);
  const restored = deserializeFavoritePrompt(serializeFavoritePrompt(p));
  assert.equal(restored.selection.propId, propId);
  assert.equal(restored.grokPrompt, p.grokPrompt);
 }
});

test('an active phone pauses the hand gesture while retaining it for cancellation', () => {
 const patch = { specifiedActionId: 'specified-standing-natural', gestureId: 'gesture-tuck-hair' };
 const phone = run({ ...patch, propId: PHONE_SELFIE_ID });
 assert.match(phone.grokPrompt, /front-camera self-shot/i);
 assert.doesNotMatch(phone.grokPrompt, /tucking.*hair/i);
 assert.equal(phone.selection.gestureId, patch.gestureId);
 const canceled = run({ ...phone.selection, propId: 'none' });
 assert.match(canceled.grokPrompt, /tucking.*hair/i);
 assert.doesNotMatch(canceled.grokPrompt, /front-camera self-shot/i);
});

test('duo, fixed scene positions and observation capture keep phone selections dormant', () => {
 const card = controls.find(c => c.key === 'characterProfileId').options.find(o => o.specialSubject === 'character-profile');
 for (const patch of [
  { subjectCount: '2' },
  { fixedCompositionSetId: 'japan-carriage-bench-front', fixedSetPositionId: 'carriage-bench-upright' },
  { characterProfileId: card.id, captureMode: 'observation', observationCapture: resolveCapture({ seed: 719 }).profile },
 ]) {
  for (const propId of [PHONE_SELFIE_ID, PHONE_MIRROR_ID]) {
   const p = run({ propId, ...patch });
   assert.ok(p);
   for (const text of outputs(p)) assert.doesNotMatch(text, /self-shot|visible phone toward a mirror/i);
   assert.equal(p.selection.propId, propId);
  }
 }
});

test('phone choices stay manual and old capture choices migrate without overwriting conflicting data', () => {
 for (let i = 0; i < 120; i++) {
  assert.ok(![PHONE_SELFIE_ID, PHONE_MIRROR_ID].includes(resolveProp('random', { wardrobeSignals: { eyewear: 'present' } }, () => i / 120).id));
 }
 for (const [captureStyleId, propId] of [['selfie', PHONE_SELFIE_ID], ['mirror', PHONE_MIRROR_ID]]) {
  const input = { subjectCount: '1', captureStyleId, propId: 'hand-hold-iced-coffee' };
  const before = JSON.stringify(input);
  assert.deepEqual(migratePhoneCaptureLocks(input), input);
  assert.equal(JSON.stringify(input), before);
  assert.equal(migratePhoneCaptureLocks({ ...input, propId: 'none' }).propId, propId);
 }
 const companion = { captureStyleId: 'companion', orbitId: 'camera:拍攝方位-orbit-angle:正面-0-度:1' };
 assert.deepEqual(migratePhoneCaptureLocks(companion), companion);
});

test('the full generation and saved-card path preserve conflicting historical phone and prop selections', () => {
 for (const captureStyleId of ['selfie','mirror']) {
  const p=run({captureStyleId,propId:'hand-hold-iced-coffee',specifiedActionId:'specified-standing-natural',gestureId:'gesture-collarbone'});
  assert.equal(p.selection.propId,'hand-hold-iced-coffee');
  assert.equal(p.selection.captureStyleId,captureStyleId);
  assert.doesNotMatch(p.grokPrompt,/front-camera self-shot|visible phone toward a mirror/i);
  assert.match(p.grokPrompt,/one hand resting on her collarbone/);
  const saved=deserializeFavoritePrompt(serializeFavoritePrompt(p));
  assert.equal(saved.selection.propId,'hand-hold-iced-coffee');
  assert.equal(saved.selection.captureStyleId,captureStyleId);
  assert.equal(saved.grokPrompt,p.grokPrompt);
 }
});

test('companion orbit is dormant in duo, fixed composition and observation capture', () => {
 const card=controls.find(c=>c.key==='characterProfileId').options.find(o=>o.specialSubject==='character-profile');
 for(const patch of [{subjectCount:'2'},
  {fixedCompositionSetId:'japan-carriage-bench-front',fixedSetPositionId:'carriage-bench-upright'},
  {characterProfileId:card.id,captureMode:'observation',observationCapture:resolveCapture({seed:719}).profile}]){
  const p=run({orbitId:COMPANION_ORBIT_ID,...patch});
  assert.ok(p);
  for(const text of outputs(p))assert.doesNotMatch(text,/companion snapshot/i);
 }
});

 test('all 27 compatible postures preserve identity across six crops and both phone props',()=>{
 const actions=SPECIFIED_ACTION_CONCRETE_OPTIONS.filter(a=>phoneCaptureStatus({subjectCount:'1',propId:PHONE_SELFIE_ID},a).active);
 assert.equal(actions.length,27);
 const names=['半臉傾斜特寫','全臉傾斜特寫','中景鏡頭 (Medium Shot)','牛仔中景 (Cowboy Shot)','全身鏡頭 (Full Body Shot)','頭部主導近景'];
 const frames=controls.find(c=>c.key==='framingId').options.filter(o=>names.includes(o.zh));assert.equal(frames.length,6);
 for(const a of actions)for(const propId of [PHONE_SELFIE_ID,PHONE_MIRROR_ID])for(const f of frames){
 const p=run({specifiedActionId:a.id,propId,framingId:f.id});assert.equal(p.selection.specifiedActionId,a.id);assert.equal(p.selection.propId,propId);
 assert.match(getGrokImagineResult(p),propId===PHONE_SELFIE_ID?/front-camera self-shot/:/visible phone toward a mirror/);
 }
 });

test('a paused companion orbit survives saved cards and becomes active after leaving its owner mode',()=>{
 for(const patch of [{subjectCount:'2'},{fixedCompositionSetId:'japan-carriage-bench-front',fixedSetPositionId:'carriage-bench-upright'}]){
  const p=run({...patch,orbitId:COMPANION_ORBIT_ID});
  assert.equal(p.selection.orbitId,COMPANION_ORBIT_ID);assert.doesNotMatch(p.grokPrompt,/companion snapshot/);
  const card=deserializeFavoritePrompt(serializeFavoritePrompt(p));
  assert.equal(card.selection.orbitId,COMPANION_ORBIT_ID);
  assert.match(run({...card.selection,subjectCount:'1',fixedCompositionSetId:'none',fixedSetPositionId:'none'}).grokPrompt,/companion snapshot/);
 }
});

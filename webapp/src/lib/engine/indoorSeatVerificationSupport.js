// Test-only independent rules and pinned witnesses. Never update expectations at runtime.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { getLockControls, getSceneDependentOptions } from '../engine.js';
import { SPECIFIED_ACTION_CONCRETE_OPTIONS } from './specifiedActions.js';
import { indoorSeatingModel, applyIndoorSeat } from './indoorSeating.js';
import { seatFixture } from './indoorSeatFixtures.js';
import expectations from './indoorSeatVerificationExpectations.json' with { type: 'json' };
import golden from './indoorSeatVerificationWitnesses.json' with { type: 'json' };
import legacy from './outdoorSeatIndoorBaseline.json' with { type: 'json' };
import { buildRestoreLocks, serializeFavoritePrompt, deserializeFavoritePrompt } from '../../features/saved-cards/cardCodec.js';

export { expectations, golden };
export const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const controls = getLockControls();
const locations = getSceneDependentOptions([], { subjectCount: '1', sceneAttributeId: 'indoor' }).locationOptions.filter(p => p.zh !== '全無');
const actions = SPECIFIED_ACTION_CONCRETE_OPTIONS.filter(a => a.family === 'sitting');
export const sceneFor = id => expectations.scenes.find(p => p.id === id);
export const actionFor = id => expectations.actions.find(a => a.id === id);
export const caseKey = (scene, action, frame, seat = '') => JSON.stringify([scene, action, frame, seat]);

export function expectedSeatState(scene, action, selected = '') {
  const phraseFor = id => id === 'floor' && scene.tatami ? 'on the tatami floor' : expectations.seats[id][1];
  if (action.kind === 'ground') {
    const bedOnly = scene.seats.every(id => ['bed-edge', 'bed-top'].includes(id));
    return { mode: 'ground', bedOnly, phrase: bedOnly ? '' : scene.tatami ? 'on the tatami floor' : 'on the floor' };
  }
  const options = scene.seats.filter(id => action.allowed.includes(id)).map(id => ({
    id, label: id === 'floor' && scene.tatami ? '榻榻米' : expectations.seats[id][0], phrase: phraseFor(id),
  }));
  const picked = options.find(o => o.id === selected);
  return { mode: 'choice', options, selectedId: picked?.id || '', phrase: picked?.phrase || '' };
}

export function expectedContact(scene, action, seat = '') {
  const state = expectedSeatState(scene, action, seat), text = action.canonical;
  if (!state.phrase) return text;
  if (state.mode === 'ground') return text.replaceAll('on the ground', state.phrase);
  if (action.kind === 'forward') return text.replace('She sits leaning', `She sits ${state.phrase}, leaning`);
  const lead = text.startsWith('She sits cross-legged') ? 'She sits cross-legged'
    : text.startsWith('She sits casually slumped') ? 'She sits casually slumped' : 'She sits';
  return lead + ' ' + state.phrase + text.slice(lead.length);
}

export function assertSeatRule(scene, action) {
  const actualLocation = locations.find(p => p.id === scene.id), actualAction = actions.find(a => a.id === action.id);
  assert.ok(actualLocation, '[source] missing scene');
  assert.equal(actualAction?.en, action.canonical, '[source] canonical action must match pinned expectation');
  // The expected tatami flag is frozen from reviewed prose, never from actualLocation.
  for (const seat of ['', undefined, 'unknown', ...Object.keys(expectations.seats)]) {
    const expected = expectedSeatState(scene, action, seat);
    const actual = indoorSeatingModel({ subjectCount: '1', locationId: scene.id, specifiedActionId: action.id, indoorSeatId: seat }, actualLocation, controls);
    assert.equal(actual?.mode, expected.mode, '[rules] mode');
    if (expected.mode === 'ground') assert.equal(actual.bedOnly, expected.bedOnly, '[rules] bed-only');
    else {
      assert.deepEqual(actual.options, expected.options, '[rules] ordered IDs, labels and phrases');
      assert.equal(actual.selectedId, expected.selectedId, '[rules] effective selection');
    }
    assert.equal(actual.phrase, expected.phrase, '[rules] contact');
    assert.equal(applyIndoorSeat(actualAction.en, actual), expectedContact(scene, action, seat), '[rules] complete contact');
  }
}

export function assertExcludedOwners() {
  const scene = expectations.scenes.find(p => p.zh === '室內：日本學校教室');
  const action = expectations.actions.find(a => a.zh === '自然坐姿');
  const place = locations.find(p => p.id === scene.id);
  for (const patch of [{subjectCount:'2'}, {captureMode:'observation'}, {fixedCompositionSetId:'japan-carriage-bench-front'},
    {importedWorldSceneMode:'architecture'}, {characterProfileId:'character-48g'}, {specialSubjectId:'owned-subject'},
    {actionPoseCardId:'low-seated-aloof-cats-street-mood'}, {locationId:'unknown'}]) {
    assert.equal(indoorSeatingModel({subjectCount:'1',locationId:scene.id,specifiedActionId:action.id,indoorSeatId:'chair',...patch},place,controls), null, '[owner] '+JSON.stringify(patch));
  }
}

export function witnessRecords(families = expectations.witnesses) {
  return families.flatMap(w => expectations.frames.flatMap(frame => [...new Set(['', w.seat])].map(seat => ({
    key: caseKey(w.sceneId,w.actionId,frame.id,seat), family: w.id,
    sceneId: w.sceneId, actionId: w.actionId, frameId: frame.id, seat,
  }))));
}
export function generateWitness(record) {
  return seatFixture(sceneFor(record.sceneId).zh, actionFor(record.actionId).zh, record.frameId, record.seat ? {indoorSeatId:record.seat} : {});
}
export function snapshot(result) {
  const { id, date, ...stable } = result.prompt;
  assert.ok(id && date);
  return {
    draws: result.draws, selection: digest(stable.selection), structured: digest(stable.structured),
    summary: digest(stable.summary), summaryFields: digest(stable.summaryFields),
    outputs: Object.fromEntries(result.cards.map(c => [c.id,digest(c.value)])),
    cardMetadata: digest(result.cards.map(card => {
      const metadata = { ...card };
      delete metadata.value;
      return metadata;
    })), stablePrompt: digest(stable),
  };
}
export function assertWitness(record, result = generateWitness(record)) {
  const expected = golden.records[record.key]; assert.ok(expected, '[coverage] missing witness '+record.key);
  const actual = snapshot(result);
  assert.equal(actual.draws, expected.draws, '[rng] absolute draw count');
  for (const key of ['selection','structured','summary','summaryFields']) assert.equal(actual[key],expected[key],'['+key+'] pinned value');
  assert.deepEqual(Object.keys(actual.outputs), expectations.outputIds, '[outputs] seven ordered outputs');
  for (const id of expectations.outputIds) assert.equal(actual.outputs[id],expected.outputs[id],'[output:'+id+'] complete text');
  assert.equal(actual.cardMetadata,expected.cardMetadata,'[metadata] output consumer contract');
  assert.equal(actual.stablePrompt,expected.stablePrompt,'[stable] all original prompt fields');
  const canonical = expectedContact(sceneFor(record.sceneId),actionFor(record.actionId),record.seat);
  const text = result.cards.find(c=>c.id==='grok-imagine').value;
  assert.equal(text.split(canonical).length-1,1,'[contact] one complete canonical contact');
}

// Preserve all legacy row hashes and separately approved before/after revisions.
export function approvedLegacyRows() {
  const rows = structuredClone(legacy.rows);
  for (const batch of [1,2,3]) {
    const review = JSON.parse(gunzipSync(readFileSync(new URL(`../../../../Docs/reports/pose-upper-body-state-batch${batch}-2026-11-12/baseline-revision.json.gz`,import.meta.url))));
    for (const [key,change] of Object.entries(review.changes.indoorSeating || {})) {
      assert.deepEqual(rows[key],change.before,'[history] immutable before row '+key);
      rows[key]=change.after;
    }
  }
  return rows;
}
export function legacyRow(scene, action) {
  const actualLocation=locations.find(p=>p.id===scene.id);
  const model=indoorSeatingModel({subjectCount:'1',locationId:scene.id,specifiedActionId:action.id},actualLocation,controls);
  const values=['',...(model.options?.[0]?[model.options[0].id]:[])];
  const hash=createHash('sha256');
  for (const frame of expectations.frames) for (const seat of values) {
    const {prompt,cards,draws}=seatFixture(scene.zh,action.zh,frame.id,seat?{indoorSeatId:seat}:{});
    const {id,date,...stable}=prompt; assert.ok(id&&date&&cards.length===7);
    hash.update(JSON.stringify({stable,cards,draws}));
  }
  return {samples:expectations.frames.length*values.length,sha256:hash.digest('hex')};
}
export function historicalCoverageLedger() {
  return expectations.scenes.filter(p=>p.historical).flatMap(scene => expectations.actions.filter(a=>a.historical).map(action => {
    const first=expectedSeatState(scene,action).options?.[0]?.id;
    const states=first?['',first]:[''];
    const records=expectations.frames.flatMap(frame=>states.map(seat=>({id:caseKey(scene.id,action.id,frame.id,seat),seed:frame.seed,
      rules:['ordered-case-coverage','seven-output-text','stable-data','absolute-rng','contact-and-visibility'],
      witness:Object.hasOwn(golden.records,caseKey(scene.id,action.id,frame.id,seat)),replacement:'legacy-required'})));
    return {key:scene.id+'/'+action.id,records};
  }));
}
export function assertRestoredWitnesses() {
  const frame=expectations.frames.find(f=>f.zh==='全身鏡頭 (Full Body Shot)');
  for(const family of expectations.witnesses.filter(w=>['bed-edge','bed-top','washitsu-floor','washitsu-cushion'].includes(w.id))) {
    const record=witnessRecords([family]).find(r=>r.frameId===frame.id&&r.seat===family.seat);
    const original=generateWitness(record),saved=deserializeFavoritePrompt(serializeFavoritePrompt(original.prompt));
    const locks=buildRestoreLocks(saved.selection,controls);
    assert.equal(locks.indoorSeatId,family.seat,'[restore] effective seat');
    const next=seatFixture(sceneFor(record.sceneId).zh,actionFor(record.actionId).zh,frame.id,locks);
    assert.deepEqual(next.cards,original.cards,'[restore] seven unchanged texts');
  }
}

import assert from 'node:assert/strict';
import test from 'node:test';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import { SPECIFIED_ACTION_CONCRETE_OPTIONS, getSpecifiedAction, getSpecifiedActionEffectiveLocks } from './specifiedActions.js';
import { ACTION_POSE_CARDS } from '../../data/actionPoseCards.js';
import { transitionPage1Locks } from '../../features/page1/lockTransitions.js';
import { buildRestoreLocks, serializeFavoritePrompt, deserializeFavoritePrompt } from '../../features/saved-cards/cardCodec.js';
const controls = getLockControls();
const option = (key, zh) => controls.find(c => c.key === key).options.find(o => o.zh === zh).id;
const free = () => ({ ...createEmptyLocks(), subjectCount: '1', poseBaseId: 'sitting', poseArrangementId: 'sitting-cross-legged',
  poseHandId: 'arms-crossed', posePropId: 'none', poseAnchorId: 'sitting-scene-appropriate-chair', poseHeadId: 'head-slight-tilt',
  expressionId: option('expressionId', '柔和微笑'), framingId: option('framingId', '全身鏡頭 (Full Body Shot)'),
  angleId: 'none', orbitId: 'none' });
const gen = locks => generatePrompts(1, locks, [], { random: createSeededRandom('unified-actions') })[0];
const transition = (previousLocks, patch) => transitionPage1Locks({ previousLocks, candidateLocks: {...previousLocks, ...patch}, lockControls: controls });
const main = p => [p.grokPrompt, p.zImagePrompt, p.midjourneyPrompt, p.nanoBananaPrompt];
// 2026-10-19 v2 P1 appends the lying library v1 (3 actions) after the 11 v1 actions.
// 14 earlier actions + 20 standing (2026-10-20) + 4 squatting + 16 sitting/kneeling (2026-10-21) library v1 actions.
test('all fifty-four actions can be selected without a matching free base', () => {
  assert.equal(SPECIFIED_ACTION_CONCRETE_OPTIONS.length, 54);
  for (const action of SPECIFIED_ACTION_CONCRETE_OPTIONS) for (const poseBaseId of ['none', 'random', 'standing']) {
    const raw = {...free(), poseBaseId, specifiedActionId: action.id};
    assert.equal(getSpecifiedAction(raw)?.id, action.id);
    assert.equal(getSpecifiedActionEffectiveLocks(raw).poseBaseId, action.baseId);
    assert.equal(raw.poseBaseId, poseBaseId);
  }
});
test('new actions share the full source, suppress latent choices and preserve them through Saved Cards', () => {
  for (const card of ACTION_POSE_CARDS) {
    const action = SPECIFIED_ACTION_CONCRETE_OPTIONS.find(a => a.legacyCardId === card.id);
    assert.ok(action, card.id);
    const locks = {...free(), specifiedActionId: action.id};
    const p = gen(locks);
    for (const text of main(p)) {
      assert.ok(text.includes(card.actionPrompt), `${card.id} missing in main`);
      assert.doesNotMatch(text, /soft natural smile|arms loosely crossed|cross-legged/i);
    }
    const restored = buildRestoreLocks(deserializeFavoritePrompt(serializeFavoritePrompt(p)).selection, controls);
    for (const key of ['poseBaseId', 'poseArrangementId', 'poseHandId', 'poseAnchorId', 'poseHeadId', 'expressionId']) assert.equal(restored[key], locks[key], key);
    const canceled = transition(restored, {specifiedActionId:'none',actionPoseCardId:''});
    assert.equal(canceled.poseBaseId, locks.poseBaseId);
    assert.equal(canceled.expressionId, locks.expressionId);
    const chest = p.extraPrompts.find(e => e.id === 'chest-up-portrait').text;
    assert.ok(chest.includes(action.upperBodyEn));
    assert.doesNotMatch(chest, /kicks one foot|one knee lifted|legs are loosely arranged/);
    assert.doesNotMatch(p.extraPrompts.find(e => e.id === 'full-body-character').text, /kicks one foot|small cats|thrusting one hand/);
  }
});
test('kick allows head adjustment, lens gesture omits lower body, cats retain companions', () => {
  const actions = SPECIFIED_ACTION_CONCRETE_OPTIONS.slice(8, 11);
  for (const [index, action] of actions.entries()) {
    const p = gen({...free(), specifiedActionId:action.id});
    for (const text of main(p)) {
      if (index === 0) assert.match(text, /head slightly tilted/);
      else assert.doesNotMatch(text, /head slightly tilted/);
      if (index === 1) assert.doesNotMatch(text, /sitting pose|standing pose|cross-legged/);
      if (index === 2) assert.match(text, /several small cats/);
    }
  }
});
test('legacy card IDs resolve through the same unified pose pipeline', () => {
  for (const card of ACTION_POSE_CARDS) {
    const p = gen({...free(),actionPoseCardId:card.id});
    for (const text of main(p)) assert.ok(text.includes(card.actionPrompt), card.id);
    assert.equal(p.selection.actionPoseCardId,card.id);
  }
});

test('explicit camera conflicts pause owned gaze without rewriting camera choices and resume after release', () => {
  for (const card of ACTION_POSE_CARDS.slice(1)) {
    const action = SPECIFIED_ACTION_CONCRETE_OPTIONS.find(a => a.legacyCardId === card.id);
    const locks = {...free(), specifiedActionId: action.id, orbitId: option('orbitId', '背面 180 度')};
    assert.equal(getSpecifiedAction(locks, {cameraControls:controls}), null);
    const p = gen(locks);
    assert.equal(p.selection.orbitId,locks.orbitId);
    assert.equal(p.selection.specifiedActionId,action.id);
    for (const text of main(p)) assert.ok(!text.includes(card.actionPrompt));
    const resumed = gen({...locks,orbitId:option('orbitId','正面 0 度')});
    for (const text of main(resumed)) assert.ok(text.includes(card.actionPrompt));
  }
  const cats = SPECIFIED_ACTION_CONCRETE_OPTIONS[10];
  const conflict = {...free(),specifiedActionId:cats.id,angleId:option('angleId','蟲眼視角鏡頭')};
  assert.equal(getSpecifiedAction(conflict,{cameraControls:controls}),null);
  const p = gen(conflict);
  assert.equal(p.selection.angleId,conflict.angleId);
  for (const text of main(p)) assert.doesNotMatch(text,/looks upward toward the camera/);
});
test('switching across action bases preserves original free choices and independently edited head', () => {
  const original = free();
  let current = original;
  for (const action of SPECIFIED_ACTION_CONCRETE_OPTIONS) current = transition(current,{specifiedActionId:action.id});
  current = transition(current,{specifiedActionId:SPECIFIED_ACTION_CONCRETE_OPTIONS[8].id});
  current = transition(current,{poseHeadId:'none'});
  const canceled = transition(current,{specifiedActionId:'none'});
  for (const key of ['poseBaseId','poseArrangementId','poseHandId','posePropId','poseAnchorId','expressionId']) assert.equal(canceled[key],original[key],key);
  assert.equal(canceled.poseHeadId,'none');
});

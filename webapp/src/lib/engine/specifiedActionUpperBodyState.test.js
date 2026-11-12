import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { getLockControls } from '../engine.js';
import { buildRestoreLocks, deserializeFavoritePrompt, serializeFavoritePrompt } from '../../features/saved-cards/cardCodec.js';
import { transitionPage1Locks } from '../../features/page1/lockTransitions.js';
import { assertUpperBodyStateBaselineRevision } from './upperBodyStateBaselineRevisionTestSupport.js';
import { SPECIFIED_ACTION_CONCRETE_OPTIONS } from './specifiedActions.js';
import { actionTextWithGesture, GESTURE_OPTIONS } from './gazeGesture.js';
import { UPPER_BODY_STATE_BATCH1, UPPER_BODY_STATE_PARIS, runUpperBodyStateCase, upperBodyStateCases,
  upperBodyStateLocks, upperBodyStateOption, upperBodyStateRow, upperBodyStateSourceRows } from './specifiedActionUpperBodyStateFixtures.js';

const baseline = JSON.parse(gunzipSync(readFileSync(new URL('../../../../Docs/reports/pose-upper-body-state-batch1-2026-11-12/before.json.gz', import.meta.url))));
const actionById = id => SPECIFIED_ACTION_CONCRETE_OPTIONS.find(action => action.id === id);
const controls = getLockControls();

test('approved baseline revisions retain ordered coverage and reject missing or unrelated changed cases', () => {
  const original = JSON.parse(readFileSync(new URL('./indoorSeatBaseline.json', import.meta.url))).rows;
  const revision = JSON.parse(gunzipSync(readFileSync(new URL('../../../../Docs/reports/pose-upper-body-state-batch1-2026-11-12/baseline-revision.json.gz', import.meta.url))));
  const current = Object.fromEntries(Object.entries(original).filter(([key]) => !key.startsWith('outdoor/'))
    .map(([key, row]) => [key, structuredClone(revision.changes.indoorSeat[key]?.after || row)]));
  assertUpperBodyStateBaselineRevision('indoorSeat', current, original);
  const unrelated = Object.keys(current).find(key => !revision.changes.indoorSeat[key]);
  const missing = { ...current };
  delete missing[unrelated];
  assert.throws(() => assertUpperBodyStateBaselineRevision('indoorSeat', missing, original));
  const changed = structuredClone(current);
  changed[unrelated].draws += 1;
  assert.throws(() => assertUpperBodyStateBaselineRevision('indoorSeat', changed, original));
});

test('batch 1 adds only seven authored upper-body fragments and preserves all other action sources and order', () => {
  assert.equal(baseline.base, '682c919562c280d9192de94f569023b4e29a0e55');
  assert.deepEqual(upperBodyStateSourceRows(), baseline.actions);
  for (const target of UPPER_BODY_STATE_BATCH1) {
    const action = actionById(target.id);
    assert.equal(action.upperBodyEn, target.upper, target.id);
    assert.equal(action.meta.upperBodyOmitted, undefined, target.id);
    assert.deepEqual(action.meta.upperBodyOmittedFramings, ['頭部主導近景'], target.id);
    for (const bucket of ['chestUp', 'mediumWaist']) {
      assert.deepEqual(action.meta.projectionByBucket[bucket], { mode: 'projected', en: target.upper }, `${target.id}/${bucket}`);
    }
  }
});

test('all seven outputs keep resolved sources, selections and RNG; only approved crops and chest derivatives may change', () => {
  const cases = upperBodyStateCases();
  assert.equal(cases.length, Object.keys(baseline.rows).length);
  for (const fixture of cases) {
    const result = runUpperBodyStateCase(fixture);
    const row = upperBodyStateRow(result);
    const before = baseline.rows[fixture.key];
    assert.ok(before, fixture.key);
    assert.equal(row.resolved, before.resolved, `${fixture.key}: resolved state and RNG`);
    const framing = controls.find(control => control.key === 'framingId').options.find(item => item.id === fixture.locks.framingId);
    const upperCrop = ['中景鏡頭 (Medium Shot)', '胸上特寫'].includes(framing.zh);
    for (const [id, hash] of Object.entries(row.outputs)) {
      const mayChange = fixture.target && (id === 'chest-up-portrait' || (upperCrop && ['gpt', 'grok', 'ai', 'nano-banana-2.1'].includes(id)));
      if (!mayChange) assert.equal(hash, before.outputs[id], `${fixture.key}: ${id}`);
    }
    if (!fixture.target) continue;
    assert.equal(result.cards.length, 7, fixture.key);
    const target = UPPER_BODY_STATE_BATCH1.find(item => item.id === fixture.locks.specifiedActionId);
    const state = target.upper.startsWith('She is seated.') ? 'She is seated' : 'She is squatting';
    for (const card of result.cards) {
      if (card.id === 'chest-up-portrait' || (upperCrop && ['gpt', 'grok', 'ai', 'nano-banana-2.1'].includes(card.id))) {
        assert.ok(card.value.includes(state), `${fixture.key}: ${card.id} posture retained`);
        assert.equal(card.value.split(state).length - 1, 1, `${fixture.key}: ${card.id} no duplicate posture`);
      }
    }
  }
});

test('medium and chest fragments omit lower-body geometry and do not invent furniture or support', () => {
  for (const target of UPPER_BODY_STATE_BATCH1) {
    const result = runUpperBodyStateCase({ key: target.id, seed: 'pose-upper-body-state-content', locks: upperBodyStateLocks({
      specifiedActionId: target.id, framingId: upperBodyStateOption('framingId', '中景鏡頭 (Medium Shot)'),
    }) });
    for (const card of result.cards.filter(item => !['full-body-character', 'grok-imagine'].includes(item.id))) {
      assert.ok(card.value.includes(target.upper), `${target.id}: ${card.id}`);
      assert.doesNotMatch(card.value, /both legs|cross-legged|knees raised|one knee drawn up|knees opened|hips sunk|heels|\bchair\b|\bbench\b|\bsofa\b/, `${target.id}: ${card.id}`);
    }
  }
});

test('squat gestures keep their existing medium projection and chest omission beside the new posture', () => {
  const action = actionById('specified-squatting-wide-knee');
  const gesture = GESTURE_OPTIONS.find(option => option.id === 'gesture-squat-both-hands-cheeks');
  assert.ok(actionTextWithGesture(action, gesture).upperBodyEn.includes('She is squatting.'));
  assert.ok(actionTextWithGesture(action, gesture).upperBodyEn.includes(gesture.meta.upperBodyEn));
  assert.equal(actionTextWithGesture(action, gesture, { chestUp: true }).upperBodyEn, action.upperBodyEn);
});

test('Paris import and action selection preserve the same effective posture in either order', () => {
  const transition = (previousLocks, patch) => transitionPage1Locks({ previousLocks,
    candidateLocks: { ...previousLocks, ...patch }, lockControls: controls });
  const initial = upperBodyStateLocks({ framingId: upperBodyStateOption('framingId', '中景鏡頭 (Medium Shot)') });
  const action = { specifiedActionId: 'specified-sitting-legs-extended' };
  const imported = { ...UPPER_BODY_STATE_PARIS, locationId: '', fixedCompositionSetId: 'none', fixedSetPositionId: 'none' };
  const first = transition(transition(initial, action), imported);
  const second = transition(transition(initial, imported), action);
  for (const locks of [first, second]) {
    const { cards } = runUpperBodyStateCase({ key: 'paris-order', locks, seed: 'pose-upper-body-state-paris-order' });
    assert.equal(locks.specifiedActionId, action.specifiedActionId);
    assert.ok(cards.find(card => card.id === 'gpt').value.includes('She is seated.'));
    assert.ok(cards.find(card => card.id === 'grok-imagine').value.includes('She sits with both legs naturally extended.'));
  }
});

test('synthetic saved cards preserve original text and action IDs; explicit regeneration uses the new projection', () => {
  for (const target of UPPER_BODY_STATE_BATCH1) {
    const locks = upperBodyStateLocks({ specifiedActionId: target.id, ...UPPER_BODY_STATE_PARIS,
      framingId: upperBodyStateOption('framingId', '中景鏡頭 (Medium Shot)') });
    const { prompt } = runUpperBodyStateCase({ key: target.id, locks, seed: 'pose-upper-body-state-save' });
    const original = { ...prompt, grokPrompt: 'Historical saved public text is retained verbatim.' };
    const restored = deserializeFavoritePrompt(serializeFavoritePrompt(original));
    assert.equal(restored.grokPrompt, original.grokPrompt);
    const restoredLocks = buildRestoreLocks(restored.selection, controls);
    assert.equal(restoredLocks.specifiedActionId, target.id);
    assert.equal(restoredLocks.importedWorldSceneArchitectureText, UPPER_BODY_STATE_PARIS.importedWorldSceneArchitectureText);
    const regenerated = runUpperBodyStateCase({ key: target.id, locks: restoredLocks, seed: 'pose-upper-body-state-save' });
    assert.ok(regenerated.prompt.grokPrompt.includes(target.upper));
  }
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { getLockControls } from '../engine.js';
import { SPECIFIED_ACTION_CONCRETE_OPTIONS } from './specifiedActions.js';
import { actionTextWithGesture, GESTURE_OPTIONS } from './gazeGesture.js';
import { transitionPage1Locks } from '../../features/page1/lockTransitions.js';
import { buildMarkdownExport, buildRestoreLocks, deserializeFavoritePrompt, parseExportedMarkdownPrompt, serializeFavoritePrompt } from '../../features/saved-cards/cardCodec.js';
import { createSavedCardsArchive, parseSavedCardsArchive } from '../../features/saved-cards/savedCardArchive.js';
import { withGrokImagineForSave } from '../grokImagineResult.js';
import { buildPage1DisplayOutputs } from '../page1PromptOutputs.js';
import { UPPER_BODY_STATE_BATCH2, UPPER_BODY_STATE_PARIS, upperBodyStateBatch2Cases, upperBodyStateBatch2SourceRows,
  runUpperBodyStateCase, upperBodyStateRow, upperBodyStateLocks, upperBodyStateOption } from './specifiedActionUpperBodyStateBatch2Fixtures.js';

const before = JSON.parse(gunzipSync(readFileSync(new URL('../../../../Docs/reports/pose-upper-body-state-batch2-2026-11-12/before.json.gz', import.meta.url))));
const controls = getLockControls();
const actionById = id => SPECIFIED_ACTION_CONCRETE_OPTIONS.find(action => action.id === id);
const targets = new Map(UPPER_BODY_STATE_BATCH2.map(target => [target.id, target]));
const mainOutputs = new Set(['gpt', 'grok', 'ai', 'nano-banana-2.1']);
const occurrences = (text, fragment) => text.split(fragment).length - 1;
const outputValues = card => buildPage1DisplayOutputs(card).cards.map(output => [output.id, output.value]);

test('batch 2 prefixes exactly six source fragments while preserving old upper text, head crop and every other action', () => {
  assert.equal(before.base, '28200431b85cc49c18900489938f8ae0e8c4e0be');
  assert.deepEqual(UPPER_BODY_STATE_BATCH2, before.targets);
  const sources = upperBodyStateBatch2SourceRows();
  assert.deepEqual(sources.map(row => row.id), before.actions.map(row => row.id));
  for (const [index, { id, source }] of sources.entries()) {
    const original = before.actions[index].source;
    const target = targets.get(id);
    if (!target) {
      assert.deepEqual(source, original, id);
      continue;
    }
    assert.equal(original.upperBodyEn, target.previousUpper, id);
    assert.equal(source.upperBodyEn, target.prefix + ' ' + target.previousUpper, id);
    assert.equal(source.meta.upperBodyEnByFraming['頭部主導近景'], target.previousUpper, id);
    for (const bucket of ['chestUp', 'mediumWaist']) {
      assert.deepEqual(source.meta.projectionByBucket[bucket], { mode:'projected', en:source.upperBodyEn }, id + '/' + bucket);
    }
    source.upperBodyEn = original.upperBodyEn;
    source.meta.projectionByBucket.chestUp = original.meta.projectionByBucket.chestUp;
    source.meta.projectionByBucket.mediumWaist = original.meta.projectionByBucket.mediumWaist;
    delete source.meta.upperBodyEnByFraming;
    assert.deepEqual(source, original, id + '/all other fields');
  }
});

test('269 same-seed scenarios retain all seven outputs outside the approved projection and all resolved state/RNG', () => {
  const cases = upperBodyStateBatch2Cases();
  assert.equal(cases.length, 269);
  assert.deepEqual(cases.map(fixture => fixture.key), Object.keys(before.rows));
  let compared = 0;
  for (const fixture of cases) {
    const result = runUpperBodyStateCase(fixture);
    const row = upperBodyStateRow(result);
    const original = before.rows[fixture.key];
    assert.equal(row.resolved, original.resolved, fixture.key + '/sources, selections and RNG');
    const effectiveFrame = controls.find(control => control.key === 'framingId').options.find(option => option.id === result.prompt.selection.framingId);
    const upperCrop = ['中景鏡頭 (Medium Shot)', '胸上特寫'].includes(effectiveFrame?.zh);
    const target = targets.get(fixture.locks.specifiedActionId);
    for (const card of result.cards) {
      compared++;
      const mayChange = fixture.target && (card.id === 'chest-up-portrait' || upperCrop && mainOutputs.has(card.id));
      if (!mayChange) {
        assert.equal(row.outputs[card.id], original.outputs[card.id], fixture.key + '/' + card.id);
        continue;
      }
      assert.equal(occurrences(card.value, target.prefix), 1, fixture.key + '/' + card.id + '/one posture');
      assert.equal(card.value.replace(target.prefix + ' ', ''), original.texts[card.id], fixture.key + '/' + card.id + '/only prefix added');
      assert.ok(card.value.toLowerCase().includes(target.previousUpper.replace(/\.$/, '').toLowerCase()), fixture.key + '/' + card.id + '/original upper wording');
    }
  }
  assert.equal(compared, 1871);
});

test('all squat hand fragments retain their medium wording and chest omission with the added posture', () => {
  const gestures = GESTURE_OPTIONS.filter(gesture => gesture.scope === 'squatting');
  assert.equal(gestures.length, 7);
  for (const target of UPPER_BODY_STATE_BATCH2.filter(target => target.id.includes('squatting'))) {
    const action = actionById(target.id);
    for (const gesture of gestures) {
      const medium = actionTextWithGesture(action, gesture).upperBodyEn;
      const chest = actionTextWithGesture(action, gesture, {chestUp:true}).upperBodyEn;
      assert.ok(medium.includes(target.prefix), target.id);
      assert.ok(medium.includes(gesture.meta.upperBodyEn || gesture.en), gesture.id);
      assert.equal(chest, action.upperBodyEn, target.id + '/' + gesture.id);
    }
  }
});

test('Paris import and all six actions retain posture regardless of selection order', () => {
  const transition = (previousLocks, patch) => transitionPage1Locks({previousLocks,
    candidateLocks:{...previousLocks, ...patch}, lockControls:controls});
  const initial = upperBodyStateLocks({framingId:upperBodyStateOption('framingId', '中景鏡頭 (Medium Shot)')});
  const imported = {...UPPER_BODY_STATE_PARIS, locationId:'', fixedCompositionSetId:'none', fixedSetPositionId:'none'};
  for (const target of UPPER_BODY_STATE_BATCH2) {
    const action = {specifiedActionId:target.id};
    for (const locks of [transition(transition(initial, action), imported), transition(transition(initial, imported), action)]) {
      const result = runUpperBodyStateCase({key:target.id, seed:'batch2-paris-order', locks});
      for (const card of result.cards.filter(card => mainOutputs.has(card.id) || card.id === 'chest-up-portrait')) {
        assert.equal(occurrences(card.value, target.prefix), 1, target.id + '/' + card.id);
      }
    }
  }
});

test('six actions at every framing preserve saved seven-output text through favorites, Markdown, ZIP and regeneration', async () => {
  const frames = controls.find(control => control.key === 'framingId').options;
  const cases = [];
  for (const target of UPPER_BODY_STATE_BATCH2) for (const frame of frames) {
    const fixture = {key:target.id + '/' + frame.id, seed:'batch2-saved/' + target.id + '/' + frame.id,
      locks:upperBodyStateLocks({specifiedActionId:target.id, framingId:frame.id, ...UPPER_BODY_STATE_PARIS,
        headPostureId:'head-slight-tilt', gazeId:'gaze-camera'})};
    const result = runUpperBodyStateCase(fixture);
    const card = withGrokImagineForSave({...result.prompt, id:fixture.key, date:'2026-11-12T08:00:00.000Z', source:'page1'});
    cases.push({fixture, card});
  }
  const archive = await parseSavedCardsArchive(await createSavedCardsArchive(cases.map(row => row.card), 0, 'uint8array'), controls);
  assert.equal(archive.length, cases.length);
  const archived = new Map(archive.map(card => [card.id, card]));
  for (const {fixture, card} of cases) {
    const expected = outputValues(card);
    assert.equal(expected.length, 7, fixture.key);
    for (const restored of [deserializeFavoritePrompt(serializeFavoritePrompt(card)),
      parseExportedMarkdownPrompt(buildMarkdownExport(card), controls, card.id), archived.get(card.id)]) {
      assert.deepEqual(outputValues(restored), expected, fixture.key + '/public text');
      const locks = buildRestoreLocks(restored.selection, controls);
      assert.equal(locks.specifiedActionId, card.selection.specifiedActionId, fixture.key);
      assert.equal(locks.importedWorldSceneArchitectureText, UPPER_BODY_STATE_PARIS.importedWorldSceneArchitectureText, fixture.key);
      const regenerated = runUpperBodyStateCase({...fixture, locks});
      assert.deepEqual(regenerated.cards.map(output => [output.id, output.value]), expected, fixture.key + '/regenerated outputs');
    }
  }
});

test('historical saved public text remains verbatim until explicit regeneration', () => {
  for (const target of UPPER_BODY_STATE_BATCH2) {
    const fixture = upperBodyStateBatch2Cases().find(fixture => fixture.locks.specifiedActionId === target.id && fixture.key.includes('/中景鏡頭 (Medium Shot)/general'));
    const generated = runUpperBodyStateCase(fixture).prompt;
    const saved = {...generated, grokPrompt:before.rows[fixture.key].texts.gpt};
    const restored = deserializeFavoritePrompt(serializeFavoritePrompt(saved));
    assert.equal(restored.grokPrompt, saved.grokPrompt, target.id);
    assert.ok(!restored.grokPrompt.includes(target.prefix), target.id);
    const next = runUpperBodyStateCase({...fixture, locks:buildRestoreLocks(restored.selection, controls)});
    assert.ok(next.prompt.grokPrompt.includes(target.prefix), target.id);
  }
});

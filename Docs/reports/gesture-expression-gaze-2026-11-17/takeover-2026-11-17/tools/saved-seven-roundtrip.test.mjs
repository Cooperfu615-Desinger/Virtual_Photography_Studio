// Standalone takeover evidence. This does not alter runtime, storage or historical seals.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../../../../../webapp/src/lib/engine.js';
import { authoredGazeHead } from '../../../../../webapp/src/lib/engine/gazeGesture.js';
import { EXPRESSION_GAZE_FIXTURES, NEW_GAZE_IDS, NEW_GESTURE_IDS, REVIEW_FRAMINGS } from '../../../../../webapp/src/lib/engine/gestureExpressionGazeFixtures.js';
import { transitionPage1Locks } from '../../../../../webapp/src/features/page1/lockTransitions.js';
import { buildRestoreLocks, buildMarkdownExport, parseExportedMarkdownPrompt, serializeFavoritePrompt, deserializeFavoritePrompt } from '../../../../../webapp/src/features/saved-cards/cardCodec.js';
import { createSavedCardsArchive, parseSavedCardsArchive } from '../../../../../webapp/src/features/saved-cards/savedCardArchive.js';
import { getGrokImagineResult, withGrokImagineForSave } from '../../../../../webapp/src/lib/grokImagineResult.js';
import { buildPage1DisplayOutputs } from '../../../../../webapp/src/lib/page1PromptOutputs.js';
import review from '../../../../../scripts/lib/gestureExpressionGazeHistory.json' with {type:'json'};

const controls = getLockControls();
const outputIds = ['gpt', 'grok', 'ai', 'nano-banana-2.1', 'chest-up-portrait', 'full-body-character', 'grok-imagine'];
const selectedFields = ['expressionId', 'gazeId', 'gestureId', 'headPostureId', 'propId', 'specifiedActionId', 'framingId', 'angleId', 'orbitId'];
const option = (key, zh) => {
  const result = controls.find(c => c.key === key)?.options.find(o => o.zh === zh);
  assert.ok(result, `${key}: ${zh}`);
  return result.id;
};
const stableDefaults = Object.fromEntries(controls.flatMap(control => {
  const none = control.options?.find(o => o.zh === '全無');
  return none ? [[control.key, none.id]] : [];
}));
const baseLocks = overrides => ({...createEmptyLocks(), ...stableDefaults, subjectCount:'1',
  specifiedActionId:'specified-standing-natural', framingId:option('framingId', '全身鏡頭 (Full Body Shot)'),
  angleId:option('angleId', '平視高度鏡頭'), orbitId:option('orbitId', '正面 0 度'), ...overrides});
const generate = (locks, seed) => generatePrompts(1, locks, [], {random:createSeededRandom(seed)})[0];
const outputs = prompt => buildPage1DisplayOutputs(prompt).cards.map(card => [card.id, card.value]);
const save = (locks, seed, id) => withGrokImagineForSave({...generate(locks, seed), id,
  date:'2026-11-17T00:00:00.000Z', source:'page1'});
const formats = (card, archive) => [
  ['JSON', deserializeFavoritePrompt(serializeFavoritePrompt(card))],
  ['Markdown', parseExportedMarkdownPrompt(buildMarkdownExport(card), controls, card.id)],
  ['ZIP', archive.get(card.id)],
];
const transition = (previousLocks, patch) => transitionPage1Locks({previousLocks,
  candidateLocks:{...previousLocks, ...patch}, lockControls:controls});

function assertSeven(prompt, label) {
  const publicOutputs = outputs(prompt);
  assert.deepEqual(publicOutputs.map(([id]) => id), outputIds, label);
  assert.ok(publicOutputs.every(([, value]) => typeof value === 'string' && value.trim()), label);
  const reference = publicOutputs.find(([id]) => id === 'full-body-character')[1];
  assert.match(reference, /9:16/);
  assert.match(reference, /standing naturally/);
  assert.doesNotMatch(reference, /middle finger|eyes glancing sideways|eyes lifted to look toward the camera/);
  assert.equal(publicOutputs.find(([id]) => id === 'grok-imagine')[1], getGrokImagineResult(prompt));
  return publicOutputs;
}

test('80 selected and dormant option records retain all seven public texts through JSON, Markdown, ZIP and regeneration', async t => {
  const cases = [];
  const add = (key, locks, kind) => {
    const seed = `gesture-seven-takeover/${key}`;
    cases.push({key, locks, seed, kind, card:save(locks, seed, `seven-takeover/${key}`)});
  };
  for (const expression of Object.values(EXPRESSION_GAZE_FIXTURES)) for (const gazeId of NEW_GAZE_IDS)
    for (const gestureId of NEW_GESTURE_IDS) for (const framing of REVIEW_FRAMINGS) {
      add([expression.zh, gazeId, gestureId, framing].join('/'), baseLocks({expressionId:expression.id,
        gazeId, gestureId, framingId:option('framingId', framing)}), 'matrix');
    }
  for (const gazeId of NEW_GAZE_IDS) for (const gestureId of NEW_GESTURE_IDS) {
    add(`phone/${gazeId}/${gestureId}`, baseLocks({expressionId:EXPRESSION_GAZE_FIXTURES.wink.id,
      gazeId, gestureId, propId:'selfie-natural-right-arm', framingId:option('framingId', '中景鏡頭 (Medium Shot)')}), 'phone');
    const initial = baseLocks({gazeId, gestureId, expressionId:EXPRESSION_GAZE_FIXTURES.squint.id});
    const fixed = transition(initial, {specifiedActionId:'specified-sitting-hug-knees'});
    // Existing pose transition clears a gesture that a fixed-hand action cannot use.
    assert.equal(fixed.gestureId, 'none');
    add(`fixed/${gazeId}/${gestureId}`, fixed, 'fixed');
  }
  assert.equal(cases.length, 80);
  const archived = await parseSavedCardsArchive(await createSavedCardsArchive(cases.map(c => c.card), 0, 'uint8array'), controls);
  assert.equal(archived.length, cases.length);
  const archive = new Map(archived.map(card => [card.id, card]));
  let roundtrips = 0;
  for (const current of cases) {
    const expected = assertSeven(current.card, current.key);
    if (current.kind === 'phone') {
      assert.equal(current.card.selection.gestureId, current.locks.gestureId);
      for (const [, text] of expected) assert.doesNotMatch(text, /middle finger/i);
    }
    if (current.kind === 'fixed') {
      assert.ok([undefined, 'none'].includes(current.card.selection.gestureId));
      assert.equal(buildRestoreLocks(current.card.selection, controls).gestureId, 'none');
      for (const [, text] of expected) assert.doesNotMatch(text, /middle finger/i);
    }
    for (const [format, restored] of formats(current.card, archive)) {
      const label = `${current.key}/${format}`;
      assert.ok(restored, label);
      assert.deepEqual(assertSeven(restored, label), expected, `${label}/saved raw texts`);
      // The established codec may materialize an absent inactive field as `none`.
      // Every issued selected ID stays exact; compare the complete applied state too.
      for (const field of selectedFields) if (current.card.selection[field] !== undefined)
        assert.equal(restored.selection[field], current.card.selection[field], `${label}/${field}`);
      const locks = buildRestoreLocks(restored.selection, controls);
      const originalApplied = buildRestoreLocks(current.card.selection, controls);
      for (const field of selectedFields) assert.equal(locks[field], originalApplied[field], `${label}/effective/${field}`);
      assert.deepEqual(assertSeven(generate(locks, current.seed), label), expected, `${label}/regenerated raw texts`);
      roundtrips++;
    }
  }
  assert.equal(roundtrips, 240);
  t.diagnostic('80 records (72 expression/gaze/gesture/crop combinations, 4 phone-paused gestures, 4 fixed-hand transitions); 240 format roundtrips, all seven raw outputs compared before and after regeneration.');
});

test('closed-eye latent gaze and head selections survive all formats and resume under the existing conflict policy', async t => {
  const cases = NEW_GAZE_IDS.map(gazeId => {
    const locks = baseLocks({expressionId:EXPRESSION_GAZE_FIXTURES.closed.id, gazeId,
      headPostureId:'chin-slightly-raised', gestureId:NEW_GESTURE_IDS[0]});
    const seed = `gesture-seven-latent/${gazeId}`;
    return {gazeId, locks, seed, card:save(locks, seed, `seven-latent/${gazeId}`)};
  });
  const archive = new Map((await parseSavedCardsArchive(await createSavedCardsArchive(cases.map(c => c.card), 0, 'uint8array'), controls)).map(card => [card.id, card]));
  let roundtrips = 0;
  for (const current of cases) {
    const expected = assertSeven(current.card, current.gazeId);
    for (const [format, restored] of formats(current.card, archive)) {
      const label = `${current.gazeId}/${format}`;
      assert.deepEqual(assertSeven(restored, label), expected);
      const locks = buildRestoreLocks(restored.selection, controls);
      assert.equal(locks.gazeId, current.gazeId, `${label}/latent gaze`);
      assert.equal(locks.headPostureId, 'chin-slightly-raised', `${label}/latent head`);
      const paused = generate(locks, current.seed);
      assert.deepEqual(assertSeven(paused, label), expected);
      assert.ok(!paused.grokPrompt.includes(authoredGazeHead(current.gazeId).en), `${label}/gaze paused`);
      assert.match(paused.grokPrompt, /both eyes gently closed.*softly parted lips/i);
      const resumedLocks = transition(locks, {expressionId:EXPRESSION_GAZE_FIXTURES.wink.id});
      assert.equal(resumedLocks.gazeId, current.gazeId, `${label}/resumed gaze retained`);
      assert.equal(resumedLocks.headPostureId, current.gazeId === 'gaze-chin-down-eyes-up' ? 'none' : 'chin-slightly-raised', `${label}/existing head conflict`);
      const resumed = generate(resumedLocks, current.seed);
      assert.ok(resumed.grokPrompt.includes(authoredGazeHead(current.gazeId).en), `${label}/gaze resumes`);
      assert.match(resumed.grokPrompt, /one eye closed in a wink.*showing upper teeth/i);
      assertSeven(resumed, `${label}/resumed reference`);
      roundtrips++;
    }
  }
  assert.equal(roundtrips, 6);
  t.diagnostic('2 closed-eye latent-gaze/head records; 6 format roundtrips and explicit wink-resume transitions.');
});

test('all 21 sealed runtime, catalog, package and historical-entry sources remain unchanged by takeover verification', () => {
  assert.equal(review.files.length, 21);
  for (const file of review.files) {
    const current = readFileSync(new URL('../../../../../' + file.path, import.meta.url));
    assert.equal(createHash('sha256').update(current).digest('hex'), file.afterHash, file.path);
  }
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls, normalizeLocks } from '../engine.js';
import { SPECIFIED_ACTION_CONCRETE_OPTIONS } from './specifiedActions.js';
import { SUPINE_SCENE_NONE_LOCKS } from './poseScenePolicy.js';
import { transitionPage1Locks } from '../../features/page1/lockTransitions.js';
import { buildRestoreLocks, deserializeFavoritePrompt, parseLocksFromStandardPrompt, serializeFavoritePrompt } from '../../features/saved-cards/cardCodec.js';

const controls = getLockControls();
const option = (key, zh) => controls.find(c => c.key === key).options.find(o => o.zh === zh).id;
const generate = locks => generatePrompts(1, locks, [], { random: createSeededRandom('specified-action-v1') })[0];
function locksFor(action, frame = '全身鏡頭 (Full Body Shot)') {
  const locks = createEmptyLocks();
  for (const c of controls) {
    const none = c.options.find(o => o.zh === '全無' || o.zh === '無額外表情');
    if (none) locks[c.key] = none.id;
  }
  return { ...locks, subjectCount: '1', poseBaseId: action.baseId, specifiedActionId: action.id,
    poseHeadId: 'head-slight-tilt', poseHandId: 'arms-crossed', posePropId: 'hand-hold-iced-coffee',
    poseAnchorId: 'sitting-chair', framingId: option('framingId', frame) };
}
const main = p => [p.grokPrompt, p.zImagePrompt, p.midjourneyPrompt, p.nanoBananaPrompt];
const extra = (p, id) => p.extraPrompts.find(e => e.id === id).text;

test('all eight actions share full canonical source across four main outputs without latent hands or props', () => {
  for (const action of SPECIFIED_ACTION_CONCRETE_OPTIONS) {
    const locks = locksFor(action);
    const p = generate(locks);
    for (const text of main(p)) {
      assert.ok(text.includes(action.en), `${action.id} full source missing`);
      assert.doesNotMatch(text, /iced coffee|arms (?:loosely )?(?:crossed|folded)|sitting on a chair/i);
    }
    for (const key of ['specifiedActionId', 'poseBaseId', 'poseHandId', 'posePropId', 'poseAnchorId'])
      assert.equal(p.selection[key], locks[key], `${key} raw selection preservation`);
    assert.equal(extra(p, 'full-body-character'), extra(generate({ ...locks, specifiedActionId: 'none' }), 'full-body-character'));
  }
});

test('upper-body crops and chest derivatives reuse the same resolved action projection', () => {
  for (const action of SPECIFIED_ACTION_CONCRETE_OPTIONS) {
    const p = generate(locksFor(action, '中景鏡頭 (Medium Shot)'));
    for (const text of [...main(p), extra(p, 'chest-up-portrait'), extra(p, 'chest-up-mj-portrait')]) {
      assert.ok(text.includes(action.upperBodyEn), `${action.id} upper source missing`);
      assert.doesNotMatch(text, /feet lifted|both feet|knees grounded|palms planted|right thigh crossed/i);
    }
  }
});

test('stored selection survives normalization, Saved Cards and restore with latent independent choices', () => {
  for (const action of SPECIFIED_ACTION_CONCRETE_OPTIONS) {
    const locks = locksFor(action);
    const normalized = normalizeLocks(locks);
    for (const key of ['poseHandId', 'posePropId', 'poseAnchorId']) assert.equal(normalized[key], locks[key]);
    const p = generate(locks);
    const restored = buildRestoreLocks(deserializeFavoritePrompt(serializeFavoritePrompt(p)).selection, controls);
    for (const key of ['specifiedActionId', 'poseHandId', 'posePropId', 'poseAnchorId']) assert.equal(restored[key], locks[key]);
    const parsed = parseLocksFromStandardPrompt(p.grokPrompt, controls).locks;
    assert.equal(parsed.specifiedActionId, action.id);
    assert.equal(parsed.poseBaseId, action.baseId);
  }
});

test('supine action uses only ground without a bed, blanket, drink or ordinary scene', () => {
  const action = SPECIFIED_ACTION_CONCRETE_OPTIONS.at(-1);
  const p = generate({ ...locksFor(action), locationId: option('locationId', '戶外：澀谷站前廣場人潮邊緣') });
  for (const text of main(p)) {
    assert.match(text, /ground/);
    assert.doesNotMatch(text, /folded blanket|everyday item|QFRONT|bed surface|sofa surface|iced coffee/i);
  }
});

test('expression and head remain effective, and dormant selfie cannot clear selected orbit', () => {
  for (const action of SPECIFIED_ACTION_CONCRETE_OPTIONS) {
    const expressionId = option('expressionId', '柔和微笑');
    const orbitId = option('orbitId', '左側 90 度');
    const locks = { ...locksFor(action), expressionId, orbitId,
      poseHandId: 'selfie-natural-right-arm', posePropId: 'selfie-mirror-phone-visible' };
    const normalized = normalizeLocks(locks);
    assert.equal(normalized.orbitId, orbitId);
    const p = generate(locks);
    assert.equal(p.selection.poseHeadId, 'head-slight-tilt');
    assert.equal(p.selection.expressionId, expressionId);
    assert.equal(p.selection.orbitId, orbitId);
    for (const text of main(p)) {
      assert.match(text, /head slightly tilted/i);
      assert.doesNotMatch(text, /mirror selfie|front-camera self-shot/);
    }
  }
});

test('supine Saved Card restores its stored scene and original support after reload and cancel', () => {
  const action = SPECIFIED_ACTION_CONCRETE_OPTIONS.at(-1);
  const previous = { ...locksFor(action), specifiedActionId: 'none', poseOrientationId: 'lying-side',
    poseHandId: 'none', posePropId: 'none', poseAnchorId: 'lying-bed-surface',
    sceneAttributeId: option('sceneAttributeId', '室內'), locationId: option('locationId', '室內：復古美式 Diner') };
  const active = transitionPage1Locks({previousLocks: previous, candidateLocks: {...previous, specifiedActionId: action.id}, lockControls: controls});
  const saved = deserializeFavoritePrompt(serializeFavoritePrompt(generate(active)));
  const reloaded = buildRestoreLocks(saved.selection, controls);
  const canceled = transitionPage1Locks({previousLocks: reloaded, candidateLocks: {...reloaded, specifiedActionId: 'none'}, lockControls: controls});
  assert.equal(canceled.locationId, previous.locationId);
  assert.equal(canceled.sceneAttributeId, previous.sceneAttributeId);
  assert.equal(canceled.poseOrientationId, previous.poseOrientationId);
  assert.equal(canceled.poseAnchorId, previous.poseAnchorId);
});

test('old results retain the exact selection shape and missing action defaults restore silently', () => {
  const p = generate({...locksFor(SPECIFIED_ACTION_CONCRETE_OPTIONS[0]), specifiedActionId: 'none'});
  assert.equal(Object.hasOwn(p.selection, 'specifiedActionId'), false);
  assert.equal(Object.hasOwn(p.selection, 'specifiedActionSceneRestore'), false);
  assert.equal(normalizeLocks(p.selection).specifiedActionId, 'none');
});

test('normalization and Saved Cards keep only the supported scalar scene snapshot fields', () => {
  const action = SPECIFIED_ACTION_CONCRETE_OPTIONS.at(-1);
  const input = { ...locksFor(action), specifiedActionSceneRestore: {
    locationId: 'none', zImageVisibleTextEnabled: true,
    importedWorldSceneLabel: { unexpected: true }, unknown: { copied: true },
  } };
  const expected = { ...SUPINE_SCENE_NONE_LOCKS, zImageVisibleTextEnabled: true };
  assert.deepEqual(normalizeLocks(input).specifiedActionSceneRestore, expected);
  const saved = deserializeFavoritePrompt(serializeFavoritePrompt(generate(input)));
  assert.deepEqual(saved.selection.specifiedActionSceneRestore, expected);
  for (const invalid of [[], 'wrong', { unknown: 'only' }]) {
    assert.equal(normalizeLocks({ ...input, specifiedActionSceneRestore: invalid }).specifiedActionSceneRestore, null);
  }
});

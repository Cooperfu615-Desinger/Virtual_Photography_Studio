import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import { getGrokImagineResult, withGrokImagineForSave } from '../grokImagineResult.js';
import { buildPage1DisplayOutputs } from '../page1PromptOutputs.js';
import { getReferencePersonPreview } from '../referencePersonPreview.js';
import { resolveCapture } from '../observationCaptureMode.js';
import {
  buildMarkdownExport, buildRestoreLocks, deserializeFavoritePrompt, parseExportedMarkdownPrompt,
  parseLocksFromStandardPrompt, serializeFavoritePrompt,
} from '../../features/saved-cards/cardCodec.js';
import { createSavedCardsArchive, parseSavedCardsArchive } from '../../features/saved-cards/savedCardArchive.js';
import { ACTION_POSE_CARDS } from '../../data/actionPoseCards.js';
import { actionAcceptsGesture } from './gazeGesture.js';
import { indoorSeatingModel } from './indoorSeating.js';
import { COMPANION_ORBIT_ID, PHONE_SELFIE_ID, PHONE_MIRROR_ID, phoneCaptureStatus } from './phoneCapture.js';
import {
  SPECIFIED_ACTION_CONCRETE_OPTIONS, SPECIFIED_ACTION_RANDOM_POOL, getSpecifiedAction,
  getSpecifiedActionCameraConflict, specifiedActionOwnsControl, specifiedActionSupportsCamera,
} from './specifiedActions.js';

const NEW_ID = 'specified-sitting-low-aloof-cats-adjustable-angle';
const ORIGINAL_ID = 'specified-low-seated-aloof-cats-street-mood';
const LEGACY_ID = 'low-seated-aloof-cats-street-mood';
// Independent literal: the new version must not rewrite the issued card source.
const ORIGINAL_EN = 'She sits low on the ground in a relaxed but guarded street-candid posture, surrounded by several small cats resting or lingering close around her. Her legs are loosely arranged, her torso slightly tilted, and her arms rest naturally near her lap or around one leg. She looks upward toward the camera with an aloof, distant, slightly moody expression, as if quietly observing without inviting attention. The cats should feel naturally present and calm, adding a quiet intimate street mood rather than becoming the main subject.';
const NEW_EN = ORIGINAL_EN.replace('She looks upward toward the camera with', 'She has');
const controls = getLockControls();
const option = (key, zh) => {
  const result = controls.find(control => control.key === key)?.options.find(entry => entry.zh === zh);
  assert.ok(result, `${key}: ${zh}`);
  return result;
};
const action = id => SPECIFIED_ACTION_CONCRETE_OPTIONS.find(entry => entry.id === id);
function locks(patch = {}) {
  const result = createEmptyLocks();
  for (const control of controls) {
    const none = control.options.find(entry => entry.zh === '全無' || entry.zh === '無額外表情');
    if (none) result[control.key] = none.id;
  }
  return { ...result, subjectCount: '1', specifiedActionId: NEW_ID,
    framingId: option('framingId', '全身鏡頭 (Full Body Shot)').id,
    angleId: option('angleId', '平視高度鏡頭').id,
    orbitId: option('orbitId', '正面 0 度').id, ...patch };
}
const generate = (patch = {}, seed = 'aloof-cats-adjustable-camera') =>
  generatePrompts(1, locks(patch), [], { random: createSeededRandom(seed) })[0];
const main = prompt => [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt, prompt.nanoBananaPrompt];
const chest = prompt => prompt.extraPrompts.find(entry => entry.id === 'chest-up-portrait').text;
const fullReference = prompt => prompt.extraPrompts.find(entry => entry.id === 'full-body-character').text;
const publicOutputs = prompt => buildPage1DisplayOutputs(prompt).cards.map(entry => entry.value);
const FIXED_GAZE = /looks upward toward the camera|looks toward the camera/i;

test('the adjustable variant has its own issued selection and stays manual with fixed hands and owned mood', () => {
  const source = action(NEW_ID);
  assert.ok(source);
  assert.equal(source.zh, '低坐貓群冷淡氛圍・角度可調');
  assert.equal(source.en, NEW_EN);
  assert.equal(source.baseId, 'sitting');
  assert.equal(source.hands.mode, 'fixed');
  assert.equal(source.ownsExpression, true);
  assert.equal(source.ownsHead, false);
  assert.equal(source.validation.status, 'pending');
  assert.equal(source.meta.cameraOrbit, 'front-facing');
  assert.ok(!source.legacyCardId, 'the old card ID must still resolve only to the original');
  assert.equal(SPECIFIED_ACTION_CONCRETE_OPTIONS.filter(entry => entry.id === NEW_ID).length, 1);
  assert.ok(!SPECIFIED_ACTION_RANDOM_POOL.some(entry => entry.id === NEW_ID));
  for (const text of [source.en, source.upperBodyEn, source.faceEn]) {
    assert.doesNotMatch(text, FIXED_GAZE);
    assert.match(text, /aloof, distant, slightly moody expression/);
  }
  assert.equal(specifiedActionOwnsControl(source, 'expressionId'), true);
  assert.equal(specifiedActionOwnsControl(source, 'gazeId'), false);
  assert.equal(specifiedActionOwnsControl(source, 'headPostureId'), false);
});

test('the original source, upward gaze, legacy ID and camera restrictions remain intact', () => {
  const source = action(ORIGINAL_ID);
  assert.equal(ACTION_POSE_CARDS.find(entry => entry.id === LEGACY_ID).actionPrompt, ORIGINAL_EN);
  assert.equal(source.en, ORIGINAL_EN);
  assert.equal(source.upperBodyEn, 'She is seated low with her torso slightly tilted and her arms resting naturally downward. She looks upward toward the camera with an aloof, distant, slightly moody expression, as if quietly observing without inviting attention.');
  assert.equal(source.faceEn, 'She looks upward toward the camera with an aloof, distant, slightly moody expression.');
  assert.equal(source.ownsHead, true);
  assert.equal(source.ownsExpression, true);
  const compatible = locks({ specifiedActionId: ORIGINAL_ID, angleId: option('angleId', '高位俯視鏡頭').id });
  assert.equal(getSpecifiedAction({ ...compatible, actionPoseCardId: LEGACY_ID }, { cameraControls: controls }).id, ORIGINAL_ID);
  for (const text of [...main(generate(compatible)), getGrokImagineResult(generate(compatible))]) assert.ok(text.includes(ORIGINAL_EN));
  assert.equal(getSpecifiedAction(locks({ specifiedActionId: ORIGINAL_ID }), { cameraControls: controls }), null);
  assert.equal(specifiedActionSupportsCamera(source, 'angleId', option('angleId', '地面高度鏡頭')), false);
  assert.equal(specifiedActionSupportsCamera(source, 'orbitId', option('orbitId', '左側 90 度')), false);
});

test('all catalog angles are available to the variant while its independent orbit restriction survives open gaze', () => {
  const source = action(NEW_ID);
  assert.ok(source);
  for (const angle of controls.find(control => control.key === 'angleId').options) {
    assert.equal(specifiedActionSupportsCamera(source, 'angleId', angle), true, angle.zh);
    assert.equal(getSpecifiedActionCameraConflict(source, locks({ angleId: angle.id }), controls), '', angle.zh);
  }
  const allowed = new Set(['全無', '正面 0 度', '左前 45 度', '右前 315 度', '男友／閨蜜視角']);
  for (const orbit of controls.find(control => control.key === 'orbitId').options) {
    assert.equal(specifiedActionSupportsCamera(source, 'orbitId', orbit), allowed.has(orbit.zh), orbit.zh);
  }
  for (const orbit of ['左側 90 度', '背面 180 度']) {
    const patch = { orbitId: option('orbitId', orbit).id, gazeId: 'gaze-back' };
    const raw = locks(patch), before = structuredClone(raw);
    assert.equal(getSpecifiedAction(raw, { cameraControls: controls }), null);
    assert.match(getSpecifiedActionCameraConflict(source, raw, controls), /不相容/);
    const prompt = generate(patch);
    for (const text of [...main(prompt), getGrokImagineResult(prompt)]) assert.doesNotMatch(text, /small cats|quiet intimate street mood/);
    assert.equal(prompt.selection.specifiedActionId, NEW_ID);
    assert.equal(prompt.selection.orbitId, patch.orbitId);
    assert.deepEqual(raw, before);
  }
  const companion = generate({ orbitId: COMPANION_ORBIT_ID });
  assert.match(companion.grokPrompt, /companion snapshot/);
  assert.match(companion.grokPrompt, /several small cats/);
  for (let index = 0; index < 8; index += 1) {
    const prompt = generate({ orbitId: '' }, `aloof-cats-orbit-${index}`);
    const resolved = controls.find(control => control.key === 'orbitId').options.find(entry => entry.id === prompt.selection.orbitId);
    assert.ok(resolved && allowed.has(resolved.zh), resolved?.zh);
  }
});

test('high, eye-height and low cameras keep the same action while each existing gaze can be selected', () => {
  const gazes = [
    ['none', null],
    ['gaze-camera', /head naturally facing the camera/],
    ['gaze-distance', /head turned into a clean side profile with the face oriented away from the camera/],
    ['gaze-down', /head lowered into a three-quarter side angle/],
    ['gaze-back', /head turned back toward the camera/],
  ];
  for (const angle of ['高位俯視鏡頭', '平視高度鏡頭', '地面高度鏡頭']) {
    for (const [gazeId, phrase] of gazes) {
      const prompt = generate({ angleId: option('angleId', angle).id, gazeId });
      assert.equal(prompt.selection.specifiedActionId, NEW_ID);
      assert.equal(prompt.selection.gazeId, gazeId === 'none' ? undefined : gazeId);
      assert.equal(prompt.selection.angleId, option('angleId', angle).id);
      for (const text of [...main(prompt), getGrokImagineResult(prompt)]) {
        assert.ok(text.includes(NEW_EN), `${angle}/${gazeId}`);
        assert.doesNotMatch(text, FIXED_GAZE);
        if (phrase) assert.match(text, phrase, `${angle}/${gazeId}`);
      }
      assert.match(chest(prompt), /seated low/);
      assert.doesNotMatch(chest(prompt), FIXED_GAZE);
      if (phrase) assert.match(chest(prompt), phrase);
    }
  }
});

test('head posture and random gaze use the existing controls without overriding the cold mood', () => {
  const prompt = generate({ gazeId: 'gaze-distance', headPostureId: 'head-slight-tilt', expressionId: option('expressionId', '柔和微笑').id });
  for (const text of [...main(prompt), chest(prompt), getGrokImagineResult(prompt)]) {
    assert.match(text, /head slightly tilted/);
    assert.match(text, /aloof, distant, slightly moody expression/);
    assert.doesNotMatch(text, /soft natural smile|looks upward toward the camera/);
  }
  assert.equal(prompt.selection.headPostureId, 'head-slight-tilt');
  const random = generate({ gazeId: 'random' }, 'aloof-cats-random-gaze');
  assert.ok(['gaze-camera', 'gaze-distance', 'gaze-down', 'gaze-back'].includes(random.selection.gazeId));
  assert.equal(random.selection.specifiedActionId, NEW_ID);
  assert.doesNotMatch(random.grokPrompt, FIXED_GAZE);
});

test('existing crop projections retain the posture, cats and gaze at their established visibility boundaries', () => {
  for (const [framing, full, seated] of [
    ['全身鏡頭 (Full Body Shot)', true, true], ['牛仔中景 (Cowboy Shot)', true, true],
    ['中景鏡頭 (Medium Shot)', false, true], ['頭部主導近景', false, true],
    ['全臉傾斜特寫', false, false], ['半臉傾斜特寫', false, false],
  ]) {
    const prompt = generate({ framingId: option('framingId', framing).id, gazeId: 'gaze-distance' });
    for (const text of main(prompt)) {
      assert.equal(/small cats/.test(text), full, framing);
      assert.equal(/sits low|seated low/.test(text), seated, framing);
      assert.match(text, /aloof, distant, slightly moody expression/);
      assert.doesNotMatch(text, FIXED_GAZE);
      assert.equal(/head turned into a clean side profile/.test(text), seated, framing);
    }
    assert.ok(getGrokImagineResult(prompt).includes(NEW_EN), 'Imagine retains the full canonical source');
    assert.match(getGrokImagineResult(prompt), /head turned into a clean side profile/);
    assert.match(chest(prompt), /seated low/);
    assert.doesNotMatch(chest(prompt), /small cats/);
    assert.doesNotMatch(fullReference(prompt), /small cats|sits low|seated low|aloof, distant, slightly moody expression/);
    assert.match(fullReference(prompt), /9:16/);
  }
});

test('the variant inherits reviewed ground surfaces without inventing a seat or turning the bed into floor', () => {
  for (const [location, expected] of [
    ['室內：日本學校教室', 'on the floor'], ['室內：日式和室', 'on the tatami floor'],
    ['其他：草地', 'on the grass'], ['其他：沙灘海岸線', 'on the sand'],
    ['其他：白色床鋪', 'on the ground'],
  ]) {
    const chosen = option('locationId', location), raw = locks({ locationId: chosen.id, indoorSeatId: 'chair' });
    const model = indoorSeatingModel(raw, chosen, controls);
    assert.equal(model.mode, 'ground', location);
    const prompt = generate(raw);
    assert.ok(getGrokImagineResult(prompt).includes(`She sits low ${expected}`), location);
    assert.equal(prompt.selection.indoorSeatId, undefined);
    assert.doesNotMatch(getGrokImagineResult(prompt), /sits low on a chair/);
  }
});

test('fixed hands pause phones and gestures but keep raw choices and the cat action', () => {
  const source = action(NEW_ID);
  assert.equal(actionAcceptsGesture(source), false);
  for (const propId of [PHONE_SELFIE_ID, PHONE_MIRROR_ID]) {
    const raw = locks({ propId, gestureId: 'gesture-tuck-hair' });
    assert.equal(phoneCaptureStatus(raw, source).active, false);
    const prompt = generate(raw);
    for (const text of [...main(prompt), getGrokImagineResult(prompt)]) {
      assert.match(text, /several small cats/);
      assert.doesNotMatch(text, /front-camera self-shot|visible phone toward a mirror|tucking a strand of hair/);
    }
    assert.equal(prompt.selection.propId, propId);
    assert.equal(prompt.selection.gestureId, 'gesture-tuck-hair');
  }
  const reference = getReferencePersonPreview(generate({ gazeId: 'gaze-distance' }));
  assert.match(getGrokImagineResult(reference), /small cats/);
  assert.doesNotMatch(fullReference(reference), /small cats|sits low|seated low/);
});

test('duo, fixed scene positions and observation capture retain their existing owners', () => {
  const character = controls.find(control => control.key === 'characterProfileId').options
    .find(entry => entry.specialSubject === 'character-profile');
  for (const patch of [
    { subjectCount: '2' },
    { fixedCompositionSetId: 'japan-carriage-bench-front', fixedSetPositionId: 'carriage-bench-upright' },
    { characterProfileId: character.id, captureMode: 'observation', observationCapture: resolveCapture({ seed: 719 }).profile },
  ]) {
    const selected = generate(patch), without = generate({ ...patch, specifiedActionId: 'none' });
    assert.ok(selected && without);
    for (const text of [...main(selected), getGrokImagineResult(selected)]) {
      assert.doesNotMatch(text, /small cats|quiet intimate street mood/);
    }
    assert.deepEqual(publicOutputs(selected), publicOutputs(without));
  }
});

test('new and old IDs and all seven public outputs survive Saved Card, Markdown and ZIP round trips', async () => {
  const cards = [
    ['adjustable', { gazeId: 'gaze-distance', headPostureId: 'head-slight-tilt' }],
    ['paused', { orbitId: option('orbitId', '背面 180 度').id, gazeId: 'gaze-back' }],
    ['original', { specifiedActionId: ORIGINAL_ID, actionPoseCardId: LEGACY_ID, angleId: option('angleId', '高位俯視鏡頭').id }],
  ].map(([id, patch]) => withGrokImagineForSave({ ...generate(patch), id: `aloof-cats-${id}`, source: 'page1', date: '2026-11-13T00:00:00.000Z' }));
  const archive = await parseSavedCardsArchive(await createSavedCardsArchive(cards, 0, 'uint8array'), controls);
  assert.equal(archive.length, cards.length);
  for (const card of cards) {
    const expected = publicOutputs(card);
    assert.equal(expected.length, 7);
    const readers = [
      deserializeFavoritePrompt(serializeFavoritePrompt(card)),
      parseExportedMarkdownPrompt(buildMarkdownExport(card), controls, card.id),
      archive.find(entry => entry.id === card.id),
    ];
    for (const restored of readers) {
      assert.deepEqual(publicOutputs(restored), expected, card.id);
      for (const key of ['specifiedActionId', 'actionPoseCardId', 'gazeId', 'headPostureId', 'angleId', 'orbitId']) {
        if (['gazeId', 'headPostureId'].includes(key)) {
          // Optional unused fields are omitted by generation and default to none on import.
          assert.equal(restored.selection[key] || 'none', card.selection[key] || 'none', `${card.id}/${key}`);
        } else assert.equal(restored.selection[key], card.selection[key], `${card.id}/${key}`);
      }
      const nextLocks = buildRestoreLocks(restored.selection, controls);
      assert.equal(nextLocks.specifiedActionId, card.selection.specifiedActionId);
      assert.ok(generate(nextLocks));
    }
  }
  const parsed = parseLocksFromStandardPrompt(cards[0].grokPrompt, controls).locks;
  assert.equal(parsed.specifiedActionId, NEW_ID);
  assert.equal(parsed.poseBaseId, 'sitting');
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import { GAZE_OPTIONS, GESTURE_OPTIONS, applicableGestureOptions, availableGazeOptions,
  authoredGazeHead, closedEyeGazeLabel, gazeUsesHeadOnly, resolveGaze, resolveGesture } from './gazeGesture.js';
import { getSpecifiedAction } from './specifiedActions.js';
import { postureConflictsWithGaze } from './headPosture.js';
import { EXPRESSION_GAZE_FIXTURES, NEW_GAZE_IDS, NEW_GESTURE_IDS, REVIEW_FRAMINGS } from './gestureExpressionGazeFixtures.js';
import { getGrokImagineResult } from '../grokImagineResult.js';
import { buildRestoreLocks, buildMarkdownExport, parseExportedMarkdownPrompt,
  serializeFavoritePrompt, deserializeFavoritePrompt } from '../../features/saved-cards/cardCodec.js';
import { createSavedCardsArchive, parseSavedCardsArchive } from '../../features/saved-cards/savedCardArchive.js';
import { transitionPage1Locks } from '../../features/page1/lockTransitions.js';

const controls = getLockControls();
const byZh = (key, zh) => {
  const value = controls.find(c => c.key === key)?.options.find(o => o.zh === zh);
  assert.ok(value, `${key}: ${zh}`); return value;
};
const base = () => ({ ...createEmptyLocks(), subjectCount: '1', specifiedActionId: 'specified-standing-natural',
  framingId: byZh('framingId', '全身鏡頭 (Full Body Shot)').id,
  angleId: byZh('angleId', '平視高度鏡頭').id, orbitId: byZh('orbitId', '正面 0 度').id });
const generate = overrides => generatePrompts(1, { ...base(), ...overrides }, [],
  { random: createSeededRandom('gesture-expression-gaze-v1') })[0];
const primary = p => [p.grokPrompt, p.zImagePrompt, p.midjourneyPrompt, p.nanoBananaPrompt];
const derived = (p, id) => p.extraPrompts.find(e => e.id === id)?.text || '';
const captureOutputs = p => [...primary(p), derived(p, 'chest-up-portrait'), getGrokImagineResult(p)];

const waistbandGrip = 'gesture-grip-waistband-sides';
const mouthOops = 'gesture-cover-mouth-oops';
const headphoneCup = 'gesture-cup-headphone-earcups';
const pantsId = byZh('pantsId', '直筒牛仔褲').id;
const headphonesId = byZh('headphonesId', '耳罩式耳機（戴在頭上）').id;
const handCases = [
  { gestureId: waistbandGrip, lock: { pantsId }, text: /both hands gripping the sides of her trouser waistband/i },
  { gestureId: mouthOops, lock: {}, text: /one hand lightly covering her mouth in a playful .?oops/i },
  { gestureId: headphoneCup, lock: { headphonesId }, text: /cupping the left and right earcups of her headphones with both palms/i },
];

test('the three added hand poses use the existing manual-only free-hand menu', () => {
  for (const { gestureId } of handCases) {
    const option = GESTURE_OPTIONS.find(item => item.id === gestureId);
    assert.equal(option?.meta.randomEligible, false, gestureId);
    for (const specifiedActionId of ['specified-standing-natural', 'specified-sitting-natural', 'specified-kneeling-seiza']) {
      assert.ok(applicableGestureOptions(getSpecifiedAction({ subjectCount: '1', specifiedActionId })).includes(option));
    }
    for (const specifiedActionId of ['specified-sitting-hug-knees', 'specified-squatting-natural', 'specified-lying-prone-forearms-crossed-ankles']) {
      assert.ok(!applicableGestureOptions(getSpecifiedAction({ subjectCount: '1', specifiedActionId })).includes(option));
    }
  }
});

test('hand poses share the resolved pose across capture outputs and respect the crop', () => {
  for (const { gestureId, lock, text } of handCases) {
    for (const framing of REVIEW_FRAMINGS) {
      const p = generate({ gestureId, ...lock, framingId: byZh('framingId', framing).id });
      const tight = framing.includes('臉');
      const waistHidden = gestureId === waistbandGrip && /胸上|頭部主導/.test(framing);
      for (const output of primary(p)) (tight || waistHidden ? assert.doesNotMatch : assert.match)(output, text, framing);
      assert.match(getGrokImagineResult(p), text, framing);
      (gestureId === waistbandGrip ? assert.doesNotMatch : assert.match)(derived(p, 'chest-up-portrait'), text);
      assert.doesNotMatch(derived(p, 'full-body-character'), text);
      assert.equal(p.selection.gestureId, gestureId);
      if (gestureId === waistbandGrip) assert.doesNotMatch(p.grokPrompt, /waistband.*(?:pull|mid-thigh)/i);
    }
  }
});

test('dependent gestures use effective pants, head-worn earcups and an uncovered mouth', () => {
  for (const [gestureId, itemLock, label] of [
    [waistbandGrip, 'pantsId', '全無'],
    [waistbandGrip, 'pantsId', '比基尼下身'],
    [headphoneCup, 'headphonesId', '全無'],
    [headphoneCup, 'headphonesId', '有線耳機'],
    [headphoneCup, 'headphonesId', '耳罩式耳機（掛在脖子上）'],
    [mouthOops, 'faceCoveringId', '黑色口罩'],
  ]) {
    const p = generate({ gestureId, [itemLock]: byZh(itemLock, label).id });
    for (const output of captureOutputs(p)) assert.doesNotMatch(output, handCases.find(item => item.gestureId === gestureId).text, label);
  }
});

test('the added hand poses pause with either phone prop and restore from Saved Cards, Markdown and ZIP', async () => {
  for (const { gestureId, lock, text } of handCases) {
    for (const propId of ['selfie-natural-right-arm', 'selfie-mirror-phone-visible']) {
      const paused = generate({ gestureId, ...lock, propId });
      for (const output of captureOutputs(paused)) assert.doesNotMatch(output, text);
      assert.equal(paused.selection.gestureId, gestureId);
    }
    const p = generate({ gestureId, ...lock });
    const records = [deserializeFavoritePrompt(serializeFavoritePrompt(p)),
      parseExportedMarkdownPrompt(buildMarkdownExport(p), controls, 'three-hand-poses'),
      ...(await parseSavedCardsArchive(await createSavedCardsArchive([p], 0, 'uint8array'), controls))];
    for (const record of records) {
      assert.equal(record.selection.gestureId, gestureId);
      assert.equal(record.grokPrompt, p.grokPrompt);
      assert.match(generate(buildRestoreLocks(record.selection, controls)).grokPrompt, text);
    }
  }
});

test('the reviewed expressions preserve complete distinct eye and mouth sources and remain manual-only', () => {
  for (const fixture of Object.values(EXPRESSION_GAZE_FIXTURES)) {
    const option = byZh('expressionId', fixture.zh);
    assert.equal(option.id, fixture.id); assert.equal(option.en, fixture.en);
    assert.ok(option.meta.tags.includes('manual_only'));
    assert.doesNotMatch(option.en, /camera|looking|gaze|head turned|head lowered|shoulder/i);
  }
});

test('middle-finger hands specify the finger anatomy, remain independent, and use the existing free-hand scope', () => {
  for (const id of NEW_GESTURE_IDS) {
    const option = GESTURE_OPTIONS.find(o => o.id === id);
    assert.ok(option); assert.equal(option.meta.randomEligible, false);
    assert.match(option.en, /middle finger/); assert.match(option.en, /thumb/);
    assert.doesNotMatch(option.en, /camera|lens|angry|defiant|blur|leaning|standing|sitting|kneeling/i);
    for (const specifiedActionId of ['specified-standing-natural', 'specified-sitting-natural', 'specified-kneeling-seiza']) {
      assert.ok(applicableGestureOptions(getSpecifiedAction({ subjectCount: '1', specifiedActionId })).some(o => o.id === id));
    }
    for (const specifiedActionId of ['specified-squatting-natural', 'specified-sitting-hug-knees', 'specified-lying-prone-forearms-crossed-ankles']) {
      assert.ok(!applicableGestureOptions(getSpecifiedAction({ subjectCount: '1', specifiedActionId })).some(o => o.id === id));
    }
  }
});

test('the new choices never enter the existing gaze, gesture, or expression random pools', () => {
  const action = getSpecifiedAction({ subjectCount: '1', specifiedActionId: 'specified-standing-natural' });
  for (let i = 0; i < 100; i++) {
    const r = () => i / 100;
    assert.ok(!NEW_GAZE_IDS.includes(resolveGaze('random', {}, r).id));
    assert.ok(!NEW_GESTURE_IDS.includes(resolveGesture('random', action, {}, r)?.id));
    const p = generatePrompts(1, { subjectCount: '1' }, [], { random: createSeededRandom(`new-manual-only:${i}`) })[0];
    assert.ok(!Object.values(EXPRESSION_GAZE_FIXTURES).some(e => e.id === p.selection.expressionId));
  }
});

test('both middle-finger hands reach the shared capture outputs, while the reference stays naturally standing', () => {
  for (const gestureId of NEW_GESTURE_IDS) {
    const p = generate({ gestureId });
    for (const text of captureOutputs(p)) assert.match(text, /middle finger/);
    assert.equal(p.selection.gestureId, gestureId);
    assert.doesNotMatch(derived(p, 'full-body-character'), /middle finger/);
  }
});

test('all reviewed expressions keep eye-state and mouth differences across the six public crops and seven outputs', () => {
  for (const fixture of Object.values(EXPRESSION_GAZE_FIXTURES)) for (const framing of REVIEW_FRAMINGS) {
    const p = generate({ expressionId: fixture.id, framingId: byZh('framingId', framing).id });
    for (const text of [p.grokPrompt, p.zImagePrompt, p.nanoBananaPrompt,
      derived(p, 'chest-up-portrait'), derived(p, 'full-body-character'), getGrokImagineResult(p)]) {
      assert.ok(text.toLowerCase().includes(fixture.en.toLowerCase()), `${fixture.zh}/${framing}`);
    }
    assert.match(p.midjourneyPrompt, fixture === EXPRESSION_GAZE_FIXTURES.closed
      ? /both eyes gently closed.*softly parted lips/i : /showing upper teeth/);
  }
});

test('new gazes have their own reviewed head/eye source, without adding legacy head choices or camera instructions', () => {
  const oldHeads = controls.find(c => c.key === 'poseHeadId').options;
  for (const gazeId of NEW_GAZE_IDS) {
    assert.ok(GAZE_OPTIONS.some(o => o.id === gazeId));
    const head = authoredGazeHead(gazeId);
    assert.ok(head?.en); assert.ok(!oldHeads.some(o => o.id === head.id));
    const p = generate({ gazeId });
    for (const text of captureOutputs(p)) assert.ok(text.includes(head.en), `${gazeId}`);
    assert.equal(p.selection.gazeId, gazeId);
    assert.equal(p.selection.angleId, base().angleId); assert.equal(p.selection.orbitId, base().orbitId);
    assert.doesNotMatch(derived(p, 'full-body-character'), /glancing sideways|eyes lifted/);
  }
});

test('gazes work without a body action and retain the original near-crop omission boundary', () => {
  for (const gazeId of NEW_GAZE_IDS) {
    const p = generate({ gazeId, specifiedActionId: 'none' });
    for (const text of captureOutputs(p)) assert.ok(text.includes(authoredGazeHead(gazeId).en));
    const tight = generate({ gazeId, framingId: byZh('framingId', '全臉傾斜特寫').id });
    for (const text of primary(tight)) assert.doesNotMatch(text, /glancing sideways|eyes lifted/);
    assert.equal(tight.selection.gazeId, gazeId);
  }
});

test('new gaze availability preserves the reviewed lying and back-view boundaries', () => {
  assert.ok(NEW_GAZE_IDS.every(id => availableGazeOptions().some(o => o.id === id)));
  const back = byZh('orbitId', '背面 180 度');
  for (const context of [{ orbit: back }, { orientationId: 'lying-prone' }, { orientationId: 'lying-side' }, { orientationId: 'lying-supine' }]) {
    assert.ok(availableGazeOptions(context).every(o => !NEW_GAZE_IDS.includes(o.id)));
  }
  for (const gazeId of NEW_GAZE_IDS) {
    const p = generate({ gazeId, orbitId: back.id });
    assert.doesNotMatch(p.grokPrompt, /glancing sideways|eyes lifted/);
    assert.equal(p.selection.gazeId, gazeId);
  }
});

test('closed-eye enjoyment keeps the selected head movement and restores the eye direction on reopen', () => {
  const reviewed = [
    ['gaze-down', '低頭', 'head lowered into a three-quarter side angle'],
    ['gaze-sideways-camera', '頭微轉向一側', 'head turned slightly to one side'],
    ['gaze-chin-down-eyes-up', '低頭、下巴微收', 'head lowered with her chin tucked'],
    ['gaze-camera', '臉朝鏡頭', 'head naturally facing the camera'],
    ['gaze-distance', '臉轉向側面', 'head turned into a clean side profile'],
    ['gaze-back', '回頭', 'head turned back toward the camera'],
  ];
  for (const [gazeId, label, phrase] of reviewed) {
    const choice = GAZE_OPTIONS.find(option => option.id === gazeId);
    assert.equal(closedEyeGazeLabel(choice), label);
    for (const zh of REVIEW_FRAMINGS) {
      const locks = { ...base(), expressionId: EXPRESSION_GAZE_FIXTURES.closed.id,
        gazeId, framingId: byZh('framingId', zh).id };
      const p = generate(locks);
      assert.equal(p.selection.gazeId, gazeId);
      const outputs = captureOutputs(p);
      for (const text of [...outputs, derived(p, 'full-body-character')]) {
        assert.match(text, /both eyes gently closed/i);
        assert.doesNotMatch(text, /glancing sideways|eyes lifted to look/);
      }
      for (const text of outputs.slice(-2)) assert.ok(text.includes(phrase), zh + '/' + gazeId);
      if (zh === '全身鏡頭 (Full Body Shot)' || zh === '中景鏡頭 (Medium Shot)') {
        for (const text of outputs) assert.ok(text.includes(phrase), zh + '/' + gazeId);
      }
      assert.ok(!derived(p, 'full-body-character').includes(phrase));
    }
    const reopened = generate({ gazeId, expressionId: EXPRESSION_GAZE_FIXTURES.wink.id });
    if (NEW_GAZE_IDS.includes(gazeId)) assert.ok(reopened.grokPrompt.includes(authoredGazeHead(gazeId).en));
  }
});

test('closed-eye head motion respects the existing back-view and lying availability', () => {
  const locks = { expressionId: EXPRESSION_GAZE_FIXTURES.closed.id, gazeId: NEW_GAZE_IDS[1],
    headPostureId: 'chin-slightly-raised', orbitId: byZh('orbitId', '背面 180 度').id };
  const p = generate(locks);
  assert.equal(p.selection.gazeId, locks.gazeId);
  for (const text of captureOutputs(p)) assert.doesNotMatch(text, /head lowered with her chin tucked|eyes lifted/);
  const next = transitionPage1Locks({ previousLocks: base(), candidateLocks: { ...base(), ...locks }, lockControls: controls });
  assert.equal(next.headPostureId, locks.headPostureId);
  const lying = generate({ ...locks, orbitId: base().orbitId,
    specifiedActionId: 'specified-lying-prone-forearms-crossed-ankles' });
  for (const text of captureOutputs(lying)) assert.doesNotMatch(text, /head lowered with her chin tucked|eyes lifted/);
});

test('chin-down lifted eyes share the existing lifting-posture conflict in transitions and the engine', () => {
  for (const headPostureId of ['chin-slightly-raised', 'head-slightly-back']) {
    assert.ok(postureConflictsWithGaze(headPostureId, NEW_GAZE_IDS[1]));
    const locks = { ...base(), gazeId: NEW_GAZE_IDS[1], headPostureId };
    const next = transitionPage1Locks({ previousLocks: base(), candidateLocks: locks, lockControls: controls });
    assert.equal(next.headPostureId, 'none');
    assert.doesNotMatch(generate(locks).grokPrompt, /chin slightly raised|head tilted slightly backward/);
    const closed = transitionPage1Locks({ previousLocks: base(), candidateLocks: { ...locks, expressionId: EXPRESSION_GAZE_FIXTURES.closed.id }, lockControls: controls });
    assert.equal(closed.headPostureId, 'none');
    assert.doesNotMatch(generate({ ...locks, expressionId: EXPRESSION_GAZE_FIXTURES.closed.id }).grokPrompt, /chin slightly raised|head tilted slightly backward/);
  }
});

test('action-owned head/expression and phone-owned hands retain the original takeover boundaries', () => {
  const actionId = 'specified-defiant-middle-finger-lens-jab';
  const owned = generate({ specifiedActionId: actionId, expressionId: EXPRESSION_GAZE_FIXTURES.closed.id,
    gazeId: NEW_GAZE_IDS[0], gestureId: NEW_GESTURE_IDS[1] });
  assert.doesNotMatch(owned.grokPrompt, /both eyes gently closed|glancing sideways|both hands raised beside her shoulders/);
  assert.equal(gazeUsesHeadOnly({ expressionId: EXPRESSION_GAZE_FIXTURES.closed.id }, getSpecifiedAction({ subjectCount: '1', specifiedActionId: actionId })), false);
  const phone = generate({ propId: 'selfie-natural-right-arm', gestureId: NEW_GESTURE_IDS[0] });
  assert.doesNotMatch(phone.grokPrompt, /middle finger/);
  assert.equal(phone.selection.gestureId, NEW_GESTURE_IDS[0]);
});

test('new and head-only selections preserve full prompt bytes through Saved Cards, Markdown, and ZIP', async () => {
  for (const expression of Object.values(EXPRESSION_GAZE_FIXTURES)) for (const gazeId of NEW_GAZE_IDS) {
    const p = generate({ expressionId: expression.id, gazeId, gestureId: NEW_GESTURE_IDS[0] });
    const records = [deserializeFavoritePrompt(serializeFavoritePrompt(p)),
      parseExportedMarkdownPrompt(buildMarkdownExport(p), controls, 'gesture-review'),
      ...(await parseSavedCardsArchive(await createSavedCardsArchive([p], 0, 'uint8array'), controls))];
    for (const record of records) {
      for (const key of ['expressionId', 'gazeId', 'gestureId']) assert.equal(record.selection[key], p.selection[key]);
      assert.equal(record.grokPrompt, p.grokPrompt);
      const restored = buildRestoreLocks(record.selection, controls);
      assert.equal(restored.gazeId, gazeId);
      assert.equal(generate(restored).grokPrompt, p.grokPrompt);
    }
  }
});

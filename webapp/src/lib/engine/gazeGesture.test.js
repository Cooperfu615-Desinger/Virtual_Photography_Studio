import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import { buildRestoreLocks, deserializeFavoritePrompt, serializeFavoritePrompt } from '../../features/saved-cards/cardCodec.js';
import { retirePage1PoseComposerLocks } from '../../features/page1/retiredPoseLocks.js';
import { buildWorkspaceSummary } from '../page1WorkspaceSummary.js';
import {
  GAZE_OPTIONS, GESTURE_OPTIONS, actionAcceptsGesture, actionTextWithGesture, applicableGestureOptions,
  availableGazeOptions, gazeHeadId, resolveGesture,
} from './gazeGesture.js';
import { SPECIFIED_ACTION_ANY, SPECIFIED_ACTION_CONCRETE_OPTIONS } from './specifiedActions.js';

// expression-pose-v2 P4 (Cooper 2026-10-20): B keeps 姿勢／手勢／表情／視線; selfie
// styles move to E 拍攝方式 (Docs/specs/expression-pose-v2-implementation-plan.md §7).
const controls = getLockControls();
const option = (key, zh) => controls.find(c => c.key === key).options.find(o => o.zh === zh).id;
const FULL = option('framingId', '全身鏡頭 (Full Body Shot)');
const BACK = option('orbitId', '背面 180 度');
const HUG_KNEES = 'specified-sitting-hug-knees';
const PRONE = 'specified-lying-prone-forearms-crossed-ankles';
const OWNS_HEAD = 'specified-defiant-middle-finger-lens-jab';
const action = id => SPECIFIED_ACTION_CONCRETE_OPTIONS.find(a => a.id === id);
const generate = (locks, seed = 'gaze-gesture') => generatePrompts(1, {
  ...createEmptyLocks(), subjectCount: '1', framingId: FULL, ...locks,
}, [], { random: createSeededRandom(seed) })[0];
const main = prompt => [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt, prompt.nanoBananaPrompt];
const chest = prompt => prompt.extraPrompts.find(e => e.id === 'chest-up-portrait').text;

test('gaze menu: 全無／隨機 and four gazes reusing reviewed head wording; back view keeps only 回眸', () => {
  assert.deepEqual(GAZE_OPTIONS.map(o => o.zh), ['全無', '隨機', '看鏡頭', '看向遠方', '低頭', '回眸']);
  assert.equal(gazeHeadId('gaze-camera'), 'head-camera-natural');
  assert.equal(gazeHeadId('gaze-camera', { orientationId: 'lying-prone' }), 'lying-prone-head-toward-camera');
  assert.equal(gazeHeadId('gaze-down', { orientationId: 'lying-side' }), '', 'lying offers no 低頭');
  const back = controls.find(c => c.key === 'orbitId').options.find(o => o.id === BACK);
  assert.deepEqual(availableGazeOptions({ orbit: back }).map(o => o.id), ['gaze-back']);
});

test('a gaze writes "She has her head …" with and without an action, in main and chest outputs', () => {
  for (const specifiedActionId of ['none', HUG_KNEES]) {
    const prompt = generate({ specifiedActionId, gazeId: 'gaze-camera' });
    for (const text of [...main(prompt), chest(prompt)]) {
      assert.match(text, /She has her head naturally facing the camera\./, `${specifiedActionId}`);
      assert.doesNotMatch(text, /She has head\b/);
    }
    assert.equal(prompt.selection.gazeId, 'gaze-camera');
  }
});

test('隨機 gaze resolves to one gaze, the snapshot names it and a Saved Card restores it', () => {
  const seen = new Set();
  for (let index = 0; index < 12; index += 1) {
    const prompt = generate({ gazeId: 'random' }, `gaze-random-${index}`);
    assert.ok(['gaze-camera', 'gaze-distance', 'gaze-down', 'gaze-back'].includes(prompt.selection.gazeId));
    seen.add(prompt.selection.gazeId);
    const restored = buildRestoreLocks(deserializeFavoritePrompt(serializeFavoritePrompt(prompt)).selection, controls);
    assert.equal(restored.gazeId, prompt.selection.gazeId);
  }
  assert.ok(seen.size >= 2);
  const back = generate({ gazeId: 'random', orbitId: BACK }, 'gaze-back-view');
  assert.equal(back.selection.gazeId, 'gaze-back');
  assert.doesNotMatch(generate({ gazeId: 'gaze-camera', orbitId: BACK }).grokPrompt, /head naturally facing the camera/);
});

test('an action that owns the head ignores gaze and keeps the raw choice', () => {
  const prompt = generate({ specifiedActionId: OWNS_HEAD, gazeId: 'gaze-distance' });
  assert.doesNotMatch(prompt.grokPrompt, /clean side profile/);
  assert.equal(prompt.selection.gazeId, 'gaze-distance');
});

test('gestures: only free-hand library actions, scoped by orientation; inserted after the upper clauses', () => {
  assert.equal(actionAcceptsGesture(action(HUG_KNEES)), false);
  assert.equal(actionAcceptsGesture(SPECIFIED_ACTION_ANY), false, '任意 leaves the hands to the model');
  assert.deepEqual(applicableGestureOptions(action(PRONE)).map(o => o.zh), ['單手把眼鏡拉下', '咬著眼鏡腳', '下巴靠在交疊的雙手上', '雙手托腮', '一手撥頭髮', '雙手輕放在前方']);
  assert.equal(GESTURE_OPTIONS.filter(o => o.scope).length, 42, '8 general + 18 restored legacy hands + 9 lying + 7 squatting');
  const chin = GESTURE_OPTIONS.find(o => o.id === 'gesture-prone-chin-hands');
  const text = actionTextWithGesture(action(PRONE), chin);
  assert.match(text.en, /propped on her forearms resting flat in front of her, her chin resting on her stacked hands\. Her hips rest/);
  assert.equal(text.upperBodyEn, 'She lies on her stomach with her chest lifted and her back gently arched, propped on her forearms resting flat in front of her, her chin resting on her stacked hands.');
  assert.deepEqual(actionTextWithGesture(action(PRONE), null), { en: action(PRONE).en, upperBodyEn: action(PRONE).upperBodyEn });
  const pockets = { ...action(PRONE), orientationId: 'none', family: 'standing' };
  for (let index = 0; index < 20; index += 1) {
    assert.notEqual(resolveGesture('random', pockets, {}, () => index / 20)?.id, 'gesture-front-pockets', 'random needs pants present');
  }
});

test('a gesture reaches every main output and the chest crop, and is recorded', () => {
  const prompt = generate({ specifiedActionId: PRONE, gestureId: 'gesture-prone-cheeks-cupped' });
  for (const text of [...main(prompt), chest(prompt)]) assert.match(text, /her cheeks cupped in both hands/);
  assert.equal(prompt.selection.gestureId, 'gesture-prone-cheeks-cupped');
  assert.doesNotMatch(generate({ specifiedActionId: HUG_KNEES, gestureId: 'gesture-prone-cheeks-cupped' }).grokPrompt, /cheeks cupped/);
});

test('拍攝方式 selfie styles produce exactly the prompts of the earlier selfie hand or prop locks', () => {
  for (const [captureStyleId, legacy] of [
    ['selfie', { poseHandId: 'selfie-natural-right-arm' }],
    ['companion', { poseHandId: 'selfie-companion-camera-interaction' }],
    ['mirror', { posePropId: 'selfie-mirror-phone-visible' }],
  ]) {
    const styled = generate({ captureStyleId });
    const old = generate(legacy);
    assert.deepEqual(main(styled), main(old), captureStyleId);
    assert.equal(chest(styled), chest(old), captureStyleId);
    assert.equal(styled.selection.captureStyleId, captureStyleId);
  }
  const withAction = generate({ captureStyleId: 'selfie', specifiedActionId: HUG_KNEES });
  assert.doesNotMatch(withAction.grokPrompt, /self-shot/, 'an action keeps its own hands (existing precedence)');
});

test('unused gaze, gesture and 拍攝方式 keep the old selection shape', () => {
  const prompt = generate({});
  for (const key of ['gazeId', 'gestureId', 'captureStyleId']) assert.ok(!(key in prompt.selection), key);
});

test('workspace retirement: composer layers drop, a selfie hand or prop becomes 拍攝方式', () => {
  const clean = { ...createEmptyLocks(), subjectCount: '1' };
  assert.equal(retirePage1PoseComposerLocks(clean), clean, 'nothing to retire keeps identity');
  const old = retirePage1PoseComposerLocks({ ...clean, poseHeadId: 'head-slight-tilt', poseBaseId: 'standing', poseHandId: 'selfie-natural-right-arm' });
  assert.equal(old.captureStyleId, 'selfie');
  for (const key of ['poseHeadId', 'poseBaseId', 'poseHandId']) assert.equal(old[key], 'none', key);
  assert.equal(retirePage1PoseComposerLocks({ ...clean, posePropId: 'selfie-mirror-phone-visible' }).captureStyleId, 'mirror');
  assert.equal(retirePage1PoseComposerLocks({ ...clean, captureStyleId: 'companion', posePropId: 'selfie-mirror-phone-visible' }).captureStyleId, 'companion', 'an explicit style wins');
});

test('the B summary names the action, gesture and gaze', () => {
  const locks = { ...createEmptyLocks(), subjectCount: '1', specifiedActionId: PRONE, gestureId: 'gesture-prone-chin-hands', gazeId: 'gaze-camera' };
  assert.equal(buildWorkspaceSummary(locks, controls).pose.summary, '指定動作：趴躺・前臂撐起・雙腳交叉翹起 / 下巴靠在交疊的雙手上 / 看鏡頭');
  assert.equal(buildWorkspaceSummary({ ...createEmptyLocks(), subjectCount: '1', gazeId: 'gaze-back' }, controls).pose.summary, '回眸');
});

test('a fixed scene position writes the gaze as "She has her head …" too', () => {
  const prompt = generate({ fixedCompositionSetId: 'japan-carriage-rush-hour', fixedSetPositionId: 'carriage-crowd-seated', gazeId: 'gaze-camera' });
  assert.match(prompt.grokPrompt, /She has her head naturally facing the camera\./);
  for (const text of main(prompt)) assert.doesNotMatch(text, /She has head\b/);
});

test('the B summary lists only a gesture that fits the action and gaze only for a single subject', () => {
  const stale = { ...createEmptyLocks(), subjectCount: '1', specifiedActionId: HUG_KNEES, gestureId: 'gesture-prone-chin-hands' };
  assert.doesNotMatch(buildWorkspaceSummary(stale, controls).pose.summary, /下巴/);
  assert.doesNotMatch(buildWorkspaceSummary({ ...createEmptyLocks(), subjectCount: '2', gazeId: 'gaze-camera' }, controls).pose.summary, /看鏡頭/);
});

test('Cooper option B: an explicit non-回眸 gaze keeps a random orbit off back views; a locked back orbit stays', () => {
  for (let index = 0; index < 60; index += 1) {
    const prompt = generate({ gazeId: 'gaze-camera' }, `gaze-front-orbit-${index}`);
    assert.match(prompt.grokPrompt, /She has her head naturally facing the camera\./, `${index}`);
  }
  const locked = generate({ gazeId: 'gaze-camera', orbitId: BACK });
  assert.equal(locked.selection.orbitId, BACK);
  assert.doesNotMatch(locked.grokPrompt, /naturally facing the camera/);
  const backDrawn = Array.from({ length: 60 }, (_, index) => generate({ gazeId: 'gaze-back' }, `gaze-back-orbit-${index}`).selection.orbitId);
  assert.ok(backDrawn.includes(BACK) || backDrawn.some(id => /後|背/.test(id)), '回眸 leaves back views in the random orbit pool');
});

// Standing library v1 (Docs/specs/pose-library-standing-v1.md, Cooper 2026-10-20).
test('standing batch 1 is accepted with free hands; batch 2 is pending and out of 隨機', () => {
  const standing = SPECIFIED_ACTION_CONCRETE_OPTIONS.filter(a => a.id.startsWith('specified-standing-'));
  assert.equal(standing.length, 20);
  const accepted = standing.filter(a => a.validation.status === 'accepted');
  assert.equal(accepted.length, 9);
  for (const a of accepted) assert.equal(a.hands.mode, 'free', a.id);
  for (const a of standing.filter(a => a.validation.status === 'pending')) assert.equal(a.hands.mode, 'fixed', a.id);
  for (const a of standing) assert.equal(a.family, 'standing', a.id);
  const pockets = standing.filter(a => a.meta.requiresWardrobeRole === 'pants').map(a => a.zh);
  assert.deepEqual(pockets, ['一手扶頭・一手插口袋', '上身前傾・雙手插口袋・一腳前踏']);
});

test('a free-hand standing action offers the general gestures; the 4 new ones never come from 隨機', () => {
  const natural = action('specified-standing-natural');
  assert.equal(applicableGestureOptions(natural).length, 25, '8 general + 15 restored hands + 2 glasses');
  const newIds = ['gesture-hand-on-head', 'gesture-hands-behind-head', 'gesture-hands-behind-back', 'gesture-arms-overhead'];
  for (let index = 0; index < 40; index += 1) {
    const drawn = resolveGesture('random', natural, { wardrobeSignals: { pants: 'present' } }, () => index / 40);
    assert.ok(drawn && !newIds.includes(drawn.id), `${index}: ${drawn?.id}`);
  }
  const chosen = generate({ specifiedActionId: 'specified-standing-natural', gestureId: 'gesture-hands-behind-back' });
  for (const text of [...main(chosen), chest(chosen)]) assert.match(text, /She stands in a relaxed neutral posture, both hands clasped behind her back\./);
});

test('a standing action renders in every main output and crops its lower clause above the knees', () => {
  const full = generate({ specifiedActionId: 'specified-standing-crossed-legs' });
  for (const text of main(full)) assert.match(text, /She stands with one hip subtly shifted, her legs naturally crossed\./);
  assert.match(chest(full), /She stands with one hip subtly shifted\./);
  assert.doesNotMatch(chest(full), /legs naturally crossed/);
});

// Squatting library v1 (Docs/specs/pose-library-squatting-v1.md, Cooper 2026-10-21).
const PRONE_ACTION = action(PRONE);
const SQUAT = id => action(`specified-squatting-${id}`);
const MEDIUM = option('framingId', '中景鏡頭 (Medium Shot)');

test('the four squats are accepted, hands free, and offer only the seven squat gestures', () => {
  const squats = ['natural', 'compact', 'forward-lean', 'wide-knee'].map(SQUAT);
  for (const squat of squats) {
    assert.equal(squat.validation.status, 'accepted', squat.id);
    assert.equal(squat.family, 'squatting', squat.id);
    assert.deepEqual(applicableGestureOptions(squat).map(o => o.zh), ['單手把眼鏡拉下', '咬著眼鏡腳', '雙肘靠膝自然垂手', '雙手沿腿側自然下垂', '單手托腮一手自然垂落',
      '雙手托腮', '單手在臉旁比 V', '雙臂搭膝外展垂手', '雙肘靠膝中央垂手'], squat.id);
  }
  for (const option of GESTURE_OPTIONS.filter(o => o.scope === 'squatting')) {
    assert.doesNotMatch(`${option.en} ${option.meta.upperBodyEn}`, /shoulder|proximal|distal|same-side/, option.zh);
  }
  assert.equal(applicableGestureOptions(action('specified-standing-natural')).some(o => o.scope === 'squatting'), false);
});

test('squat crops: full body keeps everything, medium keeps reviewed fragments, chest-up drops the gesture', () => {
  const locks = { specifiedActionId: SQUAT('natural').id, gestureId: 'gesture-squat-elbows-forward' };
  const full = generate(locks);
  assert.match(full.grokPrompt, /She holds a relaxed low squat .*Her torso inclines gently forward with relaxed shoulders, both elbows resting lightly on her thighs near the knees/);
  assert.equal(chest(full).includes('Her upper body leans gently forward with relaxed shoulders.'), true);
  assert.doesNotMatch(chest(full), /forearms|elbows/);
  const medium = generate({ ...locks, framingId: MEDIUM });
  assert.match(medium.grokPrompt, /Her upper body leans gently forward with relaxed shoulders, both forearms angled naturally downward with relaxed hands\./);
  assert.doesNotMatch(medium.grokPrompt, /squat|knees|heels/);
});

test('the wide-knee squat omits its own upper-body text in medium and chest-up crops (O6 b)', () => {
  const medium = generate({ specifiedActionId: SQUAT('wide-knee').id, framingId: MEDIUM });
  assert.doesNotMatch(medium.grokPrompt, /\nPose and Composition:\n/);
  const withGesture = generate({ specifiedActionId: SQUAT('wide-knee').id, framingId: MEDIUM, gestureId: 'gesture-squat-both-hands-cheeks' });
  assert.match(withGesture.grokPrompt, /She has both palms gently cradling the cheeks with fingers relaxed along the cheeks and jaw\./);
  assert.match(generate({ specifiedActionId: SQUAT('wide-knee').id }).grokPrompt, /She holds a relaxed wide-knee low squat/);
});

test('隨機 squat gestures skip face-touching hands under a back view', () => {
  const back = controls.find(c => c.key === 'orbitId').options.find(o => o.id === BACK);
  const face = ['gesture-squat-one-hand-cheek', 'gesture-squat-both-hands-cheeks', 'gesture-squat-one-hand-v-sign'];
  for (let index = 0; index < 40; index += 1) {
    const drawn = resolveGesture('random', SQUAT('natural'), { orbit: back }, () => index / 40);
    assert.ok(drawn && !face.includes(drawn.id), `${index}: ${drawn?.id}`);
  }
  assert.ok(Array.from({ length: 40 }, (_, index) => resolveGesture('random', SQUAT('natural'), {}, () => index / 40).id).some(id => face.includes(id)));
});

// Sitting and kneeling library v1 (Docs/specs/pose-library-sitting-kneeling-v1.md, Cooper 2026-10-21).
const SITTING = ['natural', 'forward-lean', 'legs-extended', 'cross-legged', 'knees-raised', 'slouched', 'leg-cross', 'one-knee-up', 'legs-to-side', 'open-confident'];
const KNEELING = ['seiza', 'wide', 'forward-lean', 'upright-poised', 'side-sit', 'one-knee-forward'];

test('16 sitting and kneeling actions: accepted, hands free with the general gestures, no all-fours copy', () => {
  const added = [...SITTING.map(key => action(`specified-sitting-${key}`)), ...KNEELING.map(key => action(`specified-kneeling-${key}`))];
  for (const a of added) {
    assert.ok(a, 'exists');
    assert.equal(a.validation.status, 'accepted', a.id);
    assert.equal(a.hands.mode, 'free', a.id);
    assert.equal(applicableGestureOptions(a).length, 25, a.id);
    assert.doesNotMatch(a.en, /arrangement/, a.id);
  }
  assert.equal(action('specified-kneeling-all-fours'), undefined, 'all-fours stays with the two support-hand actions');
});

test('sitting and kneeling crops keep reviewed fragments or omit the action where the composer omitted it', () => {
  const medium = id => generate({ specifiedActionId: id, framingId: MEDIUM });
  assert.match(medium('specified-sitting-slouched').grokPrompt, /Her upper body slouches loosely and heavily with dropped shoulders and a relaxed torso\./);
  assert.match(medium('specified-kneeling-forward-lean').grokPrompt, /Her torso leans forward from the hips\./);
  for (const id of ['specified-sitting-cross-legged', 'specified-kneeling-seiza']) {
    assert.doesNotMatch(medium(id).grokPrompt, /\nPose and Composition:\n/, id);
    assert.match(generate({ specifiedActionId: id }).grokPrompt, /\nPose and Composition:\nShe (sits|kneels)/, id);
  }
  const gesture = generate({ specifiedActionId: 'specified-sitting-cross-legged', gestureId: 'gesture-collarbone' });
  assert.match(gesture.grokPrompt, /She sits cross-legged, one hand resting on her collarbone and the other relaxed at her side\./);
});

// Pose UI v2 part 2 (Cooper 2026-10-21): 頭部 is its own group next to 視線.
const POSTURES = ['head-slight-tilt', 'chin-slightly-raised', 'chin-slightly-lowered', 'head-near-shoulder', 'head-slightly-back'];

test('頭部 offers 全無, 隨機 and five posture options, and is independent of the legacy head lock', () => {
  const head = controls.find(c => c.key === 'headPostureId');
  assert.deepEqual(head.options.map(o => o.id), ['none', 'random', ...POSTURES]);
  assert.equal(controls.find(c => c.key === 'poseHeadId').options.some(o => o.id === 'random'), true, 'legacy poseHeadId 隨機 untouched');
});

test('a head posture alone writes its own head sentence in every main output and the chest crop', () => {
  const prompt = generate({ headPostureId: 'chin-slightly-raised' });
  for (const text of [...main(prompt), chest(prompt)]) assert.match(text, /She has her chin slightly raised\./);
  assert.equal(prompt.selection.headPostureId, 'chin-slightly-raised');
  assert.ok(!('poseHeadId' in prompt.selection) || prompt.selection.poseHeadId === 'none' || prompt.selection.poseHeadId === '');
  const withAction = generate({ specifiedActionId: HUG_KNEES, headPostureId: 'head-slight-tilt' });
  assert.match(withAction.grokPrompt, /She has her head slightly tilted\./);
});

test('posture and gaze join into one head sentence; 低頭 drops the two chin-lifting postures', () => {
  const both = generate({ gazeId: 'gaze-camera', headPostureId: 'chin-slightly-raised' });
  for (const text of [...main(both), chest(both)]) assert.match(text, /She has her head naturally facing the camera, her chin slightly raised\./);
  assert.equal(both.selection.gazeId, 'gaze-camera');
  assert.equal(both.selection.headPostureId, 'chin-slightly-raised');
  for (const id of ['chin-slightly-raised', 'head-slightly-back']) {
    assert.doesNotMatch(generate({ gazeId: 'gaze-down', headPostureId: id }).grokPrompt, /chin slightly raised|tilted slightly backward/, id);
  }
  assert.match(generate({ gazeId: 'gaze-down', headPostureId: 'chin-slightly-lowered' }).grokPrompt, /three-quarter side angle, her chin slightly lowered/);
});

test('隨機 頭部 draws one of the five (never a conflicting one), and the Saved Card keeps the resolved posture', () => {
  const seen = new Set();
  for (let index = 0; index < 40; index += 1) {
    const prompt = generate({ headPostureId: 'random' }, `head-random-${index}`);
    assert.ok(POSTURES.includes(prompt.selection.headPostureId), `${index}`);
    seen.add(prompt.selection.headPostureId);
    const restored = buildRestoreLocks(deserializeFavoritePrompt(serializeFavoritePrompt(prompt)).selection, controls);
    assert.equal(restored.headPostureId, prompt.selection.headPostureId);
  }
  assert.ok(seen.size >= 3);
  for (let index = 0; index < 40; index += 1) {
    const prompt = generate({ gazeId: 'gaze-down', headPostureId: 'random' }, `head-down-${index}`);
    assert.ok(!['chin-slightly-raised', 'head-slightly-back'].includes(prompt.selection.headPostureId), `${index}`);
  }
});

test('an action that owns the head ignores 頭部; unused 頭部 keeps the old selection shape', () => {
  const owned = generate({ specifiedActionId: OWNS_HEAD, headPostureId: 'head-near-shoulder' });
  assert.doesNotMatch(owned.grokPrompt, /head angled close to one shoulder/);
  assert.ok(!('headPostureId' in generate({}).selection));
});

// Legacy hand gestures restored (Cooper 2026-10-22, stage 1).
const LEGACY = GESTURE_OPTIONS.filter(o => o.id.startsWith('gesture-legacy-'));
const GLASSES = LEGACY.filter(o => o.meta.requiresWardrobeRole === 'eyewear');
const ALL_PRESENT = { upperGarment: 'present', bottom: 'present', outerwear: 'present', eyewear: 'present', pants: 'present' };

test('the 18 restored hands exist; the camera-facing four carry no camera or lens wording', () => {
  assert.equal(LEGACY.length, 18, '17 restored hands (單手拿著眼鏡 moved to 道具) + 單臂橫擋遮胸');
  for (const o of LEGACY) assert.doesNotMatch(o.en, /\b(?:camera|lens)\b/i, o.zh);
  assert.match(LEGACY.find(o => o.zh === '手指愛心').en, /finger heart, thumb and index finger crossed near their tips, the other hand resting naturally/);
});

test('隨機 pool: only the seven reviewed hands come from 隨機, each gated by wardrobe and face visibility', () => {
  const natural = action('specified-standing-natural');
  const seen = new Set();
  for (let index = 0; index < 400; index += 1) {
    const drawn = resolveGesture('random', natural, { wardrobeSignals: ALL_PRESENT }, () => index / 400);
    if (drawn?.id.startsWith('gesture-legacy-')) seen.add(drawn.zh);
  }
  assert.deepEqual([...seen].sort(), ['單手托下巴', '單手把頭髮往後撥', '單手輕咬食指', '拉下上身服裝整理', '雙手把褲頭往上拉', '雙手抓著整束頭髮與髮尾整理', '雙手插外套口袋'].sort());
  for (let index = 0; index < 100; index += 1) {
    const none = resolveGesture('random', natural, { wardrobeSignals: { upperGarment: 'unknown', bottom: 'absent', outerwear: 'absent' } }, () => index / 100);
    assert.ok(!['拉下上身服裝整理', '雙手把褲頭往上拉', '雙手插外套口袋'].includes(none?.zh), none?.zh);
  }
});

test('a chosen wardrobe hand is skipped silently only when the resolved wardrobe lacks the item', () => {
  const natural = action('specified-standing-natural');
  const pockets = 'gesture-legacy-outerwear-pockets';
  assert.equal(resolveGesture(pockets, natural, { wardrobeSignals: { outerwear: 'absent' } })?.id, undefined);
  assert.equal(resolveGesture(pockets, natural, { wardrobeSignals: { outerwear: 'unknown' } })?.id, pockets);
  assert.equal(resolveGesture(pockets, natural, { wardrobeSignals: { outerwear: 'present' } })?.id, pockets);
  const skipped = generate({ specifiedActionId: natural.id, gestureId: pockets, outerwearId: option('outerwearId', '全無') });
  assert.doesNotMatch(skipped.grokPrompt, /side pockets of her jacket/);
});

test('the two glasses hands also fit squats and every lying orientation; the other 15 do not', () => {
  const squat = SQUAT('natural');
  // Only the prone lying actions have free hands today; model the other orientations on them.
  const supine = { ...PRONE_ACTION, orientationId: 'lying-supine' };
  const side = { ...PRONE_ACTION, orientationId: 'lying-side' };
  for (const target of [squat, supine, side, PRONE_ACTION]) {
    const zh = applicableGestureOptions(target).filter(o => o.id.startsWith('gesture-legacy-')).map(o => o.zh);
    for (const g of GLASSES) assert.ok(zh.includes(g.zh), `${target.id} offers ${g.zh}`);
    assert.deepEqual(zh.filter(name => !GLASSES.some(g => g.zh === name)), target === supine ? ['仰躺雙手合掌靠在臉側'] : [], target.id);
  }
});

test('waist-level hands drop out of chest-up; face and hair hands stay', () => {
  const natural = 'specified-standing-natural';
  const chestOf = id => chest(generate({ specifiedActionId: natural, gestureId: id }));
  assert.doesNotMatch(chestOf('gesture-legacy-lift-waistband'), /waist/);
  assert.doesNotMatch(chestOf('gesture-legacy-outerwear-pockets'), /pockets/);
  assert.match(chestOf('gesture-legacy-support-chin'), /supporting the chin/);
  assert.match(chestOf('gesture-legacy-heart-near-face'), /heart shape/);
});

// Wording v2 (Cooper 2026-10-22, Docs/specs/pose-gestures-wording-v2.md).
test('restored hands avoid explicit anatomy, support surfaces, camera words, bangs, and stay short', () => {
  for (const o of [...LEGACY, ...GESTURE_OPTIONS.filter(g => g.id.startsWith('gesture-legacy-'))]) {
    assert.doesNotMatch(o.en, /nipple|underboob|support surface|bangs|fringe|\bcamera\b|\blens\b|confident|casual photo/i, o.zh);
    assert.ok(o.en.split(/\s+/).length <= 34, `${o.zh}: ${o.en.split(/\s+/).length} words`);
  }
});

test('two bare-chest covers exist, out of 隨機; the hem lift needs a top and skips dresses', () => {
  const covers = LEGACY.filter(o => /bare chest/.test(o.en));
  assert.deepEqual(covers.map(o => o.zh), ['雙手遮住胸部', '單臂橫擋遮胸']);
  assert.ok(covers.every(o => o.meta.randomEligible === false));
  const natural = action('specified-standing-natural');
  const hem = 'gesture-legacy-lift-top-underbust';
  assert.equal(resolveGesture(hem, natural, { wardrobeSignals: { topHem: 'absent' } }), null);
  assert.equal(resolveGesture(hem, natural, { wardrobeSignals: { topHem: 'unknown' } })?.id, hem);
  const dress = generate({ specifiedActionId: natural.id, gestureId: hem, dressId: controls.find(c => c.key === 'dressId').options.find(o => !['全無', '隨機'].includes(o.zh) && o.id && o.id !== 'random')?.id });
  assert.doesNotMatch(dress.grokPrompt, /front hem of her top/);
});

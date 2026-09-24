import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getLockControls, normalizeLocks } from './engine.js';
import { POSE_COMPOSER_HAND_OPTIONS } from './engine/poseComposerOptions.js';
import { poseComposerOptionVisibleForBase, poseComposerOptionVisibleForOrientation } from './engine/poseComposerCompatibility.js';
import { runSceneFixture, assertZImagePoseProjection } from './engine/sceneIntegratedAssemblyTestSupport.js';
import { serializeFavoritePrompt, deserializeFavoritePrompt, buildMarkdownExport, parseExportedMarkdownPrompt } from '../features/saved-cards/cardCodec.js';

const hands = ['both-hands-heart-near-face', 'one-hand-finger-heart'];
const poses = [
  ['standing', 'none'], ['sitting', 'none'], ['kneeling', 'none'], ['squatting', 'none'],
  ['lying', 'lying-supine'], ['lying', 'lying-side'], ['lying', 'lying-prone'],
];
const render = (hand, base = 'standing', orientation = 'none', framing = '中景鏡頭 (Medium Shot)') => runSceneFixture({
  id: `heart/${hand}/${base}/${orientation}/${framing}`, seed: 'heart-gestures-v1',
  locks: {
    subjectCount: '1', poseBaseId: base, poseOrientationId: orientation, poseHandId: hand,
    poseArrangementId: 'none', posePropId: 'none', poseHeadId: 'none',
    poseAnchorId: base === 'lying' && orientation === 'lying-supine' ? 'lying-bed-surface' : 'none',
    framingId: { byZh: framing }, angleId: { byZh: '平視高度鏡頭' }, orbitId: { byZh: '正面 0 度' },
  },
});

test('both heart gestures are manual choices for every posture and lying orientation', () => {
  for (const id of hands) {
    const hand = POSE_COMPOSER_HAND_OPTIONS.find(o => o.id === id);
    assert.ok(hand, id);
    assert.equal(hand.meta.randomEligible, false);
    for (const [base, orientation] of poses) {
      assert.equal(poseComposerOptionVisibleForBase(hand, base), true);
      assert.equal(poseComposerOptionVisibleForOrientation(hand, orientation), true);
      for (const framing of ['胸上特寫', '中景鏡頭 (Medium Shot)', '牛仔中景 (Cowboy Shot)', '全身鏡頭 (Full Body Shot)']) {
        const { prompt, outputs } = render(id, base, orientation, framing);
        assert.equal(prompt.selection.poseHandId, id);
        for (const field of ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt', 'chestUpPortraitPrompt', 'chestUpMjPortraitPrompt']) {
          assert.ok(outputs[field].includes(hand.en), `${base}/${orientation}/${framing}/${field} must preserve the hand source`);
        }
        assertZImagePoseProjection(prompt);
        assert.doesNotMatch(outputs.fullBodyCharacterPrompt, /heart shape|finger-heart/);
      }
    }
  }
  for (const [base, orientation] of poses) assert.ok(!hands.includes(render('random', base, orientation).selection.poseHandId));
});

test('close crops keep only authored visible hand details and tight face crops omit gestures', () => {
  for (const id of hands) {
    const hand = POSE_COMPOSER_HAND_OPTIONS.find(o => o.id === id);
    assert.ok(hand, id);
    for (const framing of ['特寫鏡頭 (Close-Up)', '全臉傾斜特寫', '半臉傾斜特寫']) {
      const { outputs, prompt } = render(id, 'standing', 'none', framing);
      for (const field of ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt']) {
        assert.ok(outputs[field].includes(hand.meta.projectionByBucket.headShoulders.en), `${framing}/${field}`);
        assert.doesNotMatch(outputs[field], /elbows naturally bent|other hand rests naturally|standing pose/);
      }
      assert.equal(prompt.selection.poseHandId, id);
    }
    const { outputs, prompt } = render(id, 'standing', 'none', '局部五官特寫');
    for (const field of ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt']) assert.doesNotMatch(outputs[field], /heart shape|finger-heart/);
    assert.equal(prompt.selection.poseHandId, id);
    for (const field of ['chestUpPortraitPrompt', 'chestUpMjPortraitPrompt']) assert.ok(outputs[field].includes(hand.en));
    const supine = render(id, 'lying', 'lying-supine', '特寫鏡頭 (Close-Up)').outputs;
    for (const field of ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt']) {
      assert.ok(supine[field].includes(hand.meta.projectionByBucket.headShoulders.en));
      assert.match(supine[field], /bed/i);
    }
  }
  const oldGesture = render('both-hands-rock-horns', 'standing', 'none', '特寫鏡頭 (Close-Up)').outputs;
  for (const field of ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt']) assert.doesNotMatch(oldGesture[field], /rock-horns/);
});

test('heart choices and text survive Saved Cards and Markdown restoration; props still take over', () => {
  for (const id of hands) {
    const { prompt, outputs } = render(id, 'squatting');
    const saved = deserializeFavoritePrompt(serializeFavoritePrompt(prompt));
    const parsed = parseExportedMarkdownPrompt(buildMarkdownExport(prompt), getLockControls(), 'heart-gesture');
    for (const restored of [saved, parsed]) {
      assert.equal(restored.selection.poseHandId, id);
      for (const field of ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt']) assert.equal(restored[field], outputs[field]);
    }
    assert.equal(normalizeLocks({ ...prompt.selection, posePropId: 'hand-hold-cigarette' }).poseHandId, 'none');
  }
});

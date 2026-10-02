import assert from 'node:assert/strict';
import test from 'node:test';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import { POSE_COMPOSER_ARRANGEMENT_OPTIONS } from './poseComposerOptions.js';
import { buildKneelingSupportControl, reconcileKneelingSupportLocks } from './kneelingSupport.js';
import { transitionPage1Locks } from '../../features/page1/lockTransitions.js';
import { buildRestoreLocks, parseLocksFromStandardPrompt, serializeFavoritePrompt, deserializeFavoritePrompt } from '../../features/saved-cards/cardCodec.js';

const controls = getLockControls();
const option = (key, zh) => controls.find(c => c.key === key).options.find(o => o.zh === zh).id;
const palms = 'hands-palms-planted-ground';
const elbows = 'hands-elbows-planted-ground';
const publicIds = ['kneeling-seiza', 'kneeling-wide', 'kneeling-forward-lean', 'kneeling-all-fours', 'kneeling-upright-poised', 'kneeling-side-sit', 'kneeling-one-knee-forward'];
function locksFor(id, hand = 'none', frame = '全身鏡頭 (Full Body Shot)') {
  const locks = createEmptyLocks();
  for (const c of controls) {
    const none = c.options.find(o => o.zh === '全無' || o.zh === '無額外表情');
    if (none) locks[c.key] = none.id;
  }
  return { ...locks, subjectCount: '1', poseBaseId: 'kneeling', poseArrangementId: id, poseHandId: hand, framingId: option('framingId', frame) };
}
const generate = locks => generatePrompts(1, locks, [], { random: createSeededRandom('kneeling-catalog-v2') })[0];
const extra = (p, id) => p.extraPrompts.find(e => e.id === id).text;
const main = p => [p.grokPrompt, p.zImagePrompt, p.midjourneyPrompt];
const transition = (prev, patch) => transitionPage1Locks({ previousLocks: prev, candidateLocks: { ...prev, ...patch }, lockControls: controls });

test('seven kneeling choices retire side kneeling without losing saved ids or prose', () => {
  assert.deepEqual(POSE_COMPOSER_ARRANGEMENT_OPTIONS.filter(o => o.base === 'kneeling' && !o.meta?.uiHidden).map(o => o.id), publicIds);
  const legacy = POSE_COMPOSER_ARRANGEMENT_OPTIONS.find(o => o.id === 'kneeling-side');
  assert.equal(legacy.meta.uiHidden, true);
  assert.equal(legacy.meta.randomEligible, false);
  const locks = locksFor(legacy.id);
  assert.equal(buildRestoreLocks(locks, controls).poseArrangementId, legacy.id);
  for (const text of main(generate(locks))) assert.ok(text.includes(legacy.en));
});

test('seated hips, floor-seated wide knees and high kneeling are distinct', () => {
  for (const text of main(generate(locksFor('kneeling-seiza')))) assert.match(text, /hips resting on the heels/);
  for (const text of main(generate(locksFor('kneeling-wide')))) {
    assert.match(text, /hips resting on the ground between the legs/);
    assert.match(text, /lower legs folded back on either side/);
    assert.doesNotMatch(text, /hips settled between the heels/);
  }
  for (const text of main(generate(locksFor('kneeling-upright-poised')))) {
    assert.match(text, /hips lifted clear of the heels/);
    assert.match(text, /thighs nearly vertical/);
  }
  for (const text of main(generate(locksFor('kneeling-forward-lean')))) {
    assert.match(text, /hips lifted clear of the heels/);
    assert.match(text, /upper body inclined forward from the hips/);
    assert.doesNotMatch(text, /palms planted|elbows planted/);
  }
});

test('new all-fours selection binds palms, elbows persist, exit releases support', () => {
  const previous = locksFor('kneeling-seiza', 'arms-crossed');
  const entered = transition(previous, { poseArrangementId: 'kneeling-all-fours', posePropId: 'prop-hold-iced-coffee' });
  assert.equal(entered.poseHandId, palms);
  assert.equal(entered.posePropId, 'none');
  const changed = transition(entered, { poseHandId: elbows });
  assert.equal(changed.poseHandId, elbows);
  assert.equal(transition(changed, { aspectRatio: '4:5' }).poseHandId, elbows);
  assert.equal(transition(changed, { posePropId: 'random' }).posePropId, 'none');
  assert.equal(transition(changed, { poseArrangementId: 'kneeling-seiza' }).poseHandId, 'none');
  assert.equal(previous.poseHandId, 'arms-crossed');
});

test('all-fours picker has exactly two support choices and no competing prop pool', () => {
  const locks = locksFor('kneeling-all-fours', palms);
  const hand = buildKneelingSupportControl(controls.find(c => c.key === 'poseHandId'), locks);
  assert.deepEqual(hand.options.map(o => o.id), [palms, elbows]);
  assert.equal(hand.suppressDefaultRandomOption, true);
  const prop = buildKneelingSupportControl(controls.find(c => c.key === 'posePropId'), locks);
  assert.deepEqual(prop.options.map(o => o.id), ['none']);
});

test('palms and elbows produce different shared torso geometry before crop projection', () => {
  for (const hand of [palms, elbows]) {
    const p = generate(locksFor('kneeling-all-fours', hand));
    assert.equal(p.selection.poseHandId, hand);
    for (const text of main(p)) {
      assert.match(text, /both knees grounded.*hips raised/);
      if (hand === palms) {
        assert.match(text, /both palms planted on the ground/);
        assert.match(text, /arms extended.*torso roughly parallel to the ground/);
        assert.doesNotMatch(text, /chest and shoulders lowered/);
      } else {
        assert.match(text, /both elbows planted on the ground/);
        assert.match(text, /chest and shoulders lowered.*torso inclined forward and downward/);
        assert.doesNotMatch(text, /torso roughly parallel to the ground/);
      }
    }
    for (const id of ['chest-up-portrait', 'chest-up-mj-portrait']) {
      const text = extra(p, id);
      assert.match(text, hand === palms ? /raised chest and shoulders/ : /lowered chest and shoulders/);
      assert.doesNotMatch(text, /knees grounded|hips raised|palms planted|elbows planted/);
    }
  }
});

test('default and random support resolve once, even when contact lies outside crop', () => {
  for (const frame of ['全身鏡頭 (Full Body Shot)', '中景鏡頭 (Medium Shot)', '胸上特寫']) {
    const p = generate(locksFor('kneeling-all-fours', 'none', frame));
    assert.equal(p.selection.poseHandId, palms);
    const seen = new Set();
    for (const p of generatePrompts(30, locksFor('kneeling-all-fours', 'random', frame), [], { random: createSeededRandom('kneeling-support-random') })) {
      assert.ok([palms, elbows].includes(p.selection.poseHandId));
      seen.add(p.selection.poseHandId);
      if (frame !== '全身鏡頭 (Full Body Shot)') for (const text of main(p)) assert.doesNotMatch(text, /palms planted|elbows planted|knees grounded|hips raised/);
    }
    assert.equal(seen.size, 2);
  }
});

test('legacy incompatible explicit hands remain restorable without being silently rebound', () => {
  const locks = locksFor('kneeling-all-fours', 'arms-crossed');
  assert.deepEqual(reconcileKneelingSupportLocks(locks, { ...locks, aspectRatio: '4:5' }), { ...locks, aspectRatio: '4:5' });
  assert.equal(buildRestoreLocks(locks, controls).poseHandId, 'arms-crossed');
  const p = generate(locks);
  assert.equal(p.selection.poseHandId, 'arms-crossed');
  assert.match(p.grokPrompt, /both arms folded across the chest|arms crossed|arms loosely crossed/);
});

test('all kneeling ids round trip through saved cards and changed prose retains historical aliases', () => {
  for (const id of publicIds) {
    const locks = locksFor(id, id === 'kneeling-all-fours' ? elbows : 'none');
    const p = generate(locks);
    const restored = deserializeFavoritePrompt(serializeFavoritePrompt(p));
    assert.equal(restored.selection.poseArrangementId, id);
    assert.equal(restored.grokPrompt, p.grokPrompt);
    assert.equal(parseLocksFromStandardPrompt(p.grokPrompt, controls).locks.poseArrangementId, id);
    const source = POSE_COMPOSER_ARRANGEMENT_OPTIONS.find(o => o.id === id);
    for (const text of source.meta?.legacyPromptAliases || []) assert.equal(parseLocksFromStandardPrompt(`She presents a ${text}.`, controls).locks.poseArrangementId, id);
    assert.equal(extra(p, 'full-body-character'), extra(generate(locksFor('kneeling-seiza')), 'full-body-character'));
  }
});

test('random kneeling excludes retired side kneeling and reaches all seven arrangements', () => {
  const seen = new Set();
  for (const p of generatePrompts(180, locksFor('random', 'random'), [], { random: createSeededRandom('kneeling-random-v2') })) {
    assert.ok(publicIds.includes(p.selection.poseArrangementId));
    seen.add(p.selection.poseArrangementId);
    if (p.selection.poseArrangementId === 'kneeling-all-fours') assert.ok([palms, elbows].includes(p.selection.poseHandId));
  }
  assert.equal(seen.size, 7);
});

test('saved-card, import and preview refill preserve explicit support and historical choices', () => {
  const previous = { ...locksFor('kneeling-seiza'), poseBaseId: 'standing', poseArrangementId: 'standing-natural' };
  for (const hand of [elbows, 'arms-crossed']) {
    const restored = transitionPage1Locks({ previousLocks: previous,
      candidateLocks: buildRestoreLocks(locksFor('kneeling-all-fours', hand), controls),
      lockControls: controls, restoringSelection: true });
    assert.equal(restored.poseHandId, hand);
    assert.equal(restored.poseArrangementId, 'kneeling-all-fours');
  }
});

test('random prop cannot replace required ground supports', () => {
  const seen = new Set();
  const locks = { ...locksFor('kneeling-all-fours', 'random'), posePropId: 'random' };
  for (const p of generatePrompts(30, locks, [], { random: createSeededRandom('kneeling-prop-v2') })) {
    assert.equal(p.selection.posePropId, 'none');
    assert.ok([palms, elbows].includes(p.selection.poseHandId));
    seen.add(p.selection.poseHandId);
  }
  assert.equal(seen.size, 2);
});

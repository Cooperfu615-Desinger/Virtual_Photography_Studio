import assert from 'node:assert/strict';
import test from 'node:test';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import { POSE_COMPOSER_ARRANGEMENT_OPTIONS } from './poseComposerOptions.js';
import { buildRestoreLocks, parseLocksFromStandardPrompt, serializeFavoritePrompt, deserializeFavoritePrompt } from '../../features/saved-cards/cardCodec.js';

const controls = getLockControls();
const option = (key, zh) => controls.find(c => c.key === key).options.find(o => o.zh === zh).id;
const activeIds = ['standing-natural', 'standing-one-leg-weight', 'standing-pelvis-back-curve', 'standing-forward-lean', 'standing-crossed-legs', 'standing-narrow-side', 'standing-bent-leg-lift', 'standing-feet-together-soft-knees', 'standing-wide-weight-shift'];
const retired = ['standing-back-lean', 'standing-back-facing-turn', 'standing-forward-toe-point'];
function locksFor(id, frame = '全身鏡頭 (Full Body Shot)') {
  const locks = createEmptyLocks();
  for (const c of controls) {
    const none = c.options.find(o => o.zh === '全無' || o.zh === '無額外表情');
    if (none) locks[c.key] = none.id;
  }
  return { ...locks, subjectCount: '1', poseBaseId: 'standing', poseArrangementId: id, framingId: option('framingId', frame) };
}
const generate = locks => generatePrompts(1, locks, [], { random: createSeededRandom('standing-catalog-v1') })[0];
const extra = (p, id) => p.extraPrompts.find(e => e.id === id).text;

test('standing catalog has nine public options and three newly retired restore-only options', () => {
  assert.deepEqual(POSE_COMPOSER_ARRANGEMENT_OPTIONS.filter(o => o.base === 'standing' && !o.meta?.uiHidden).map(o => o.id), activeIds);
  for (const id of retired) {
    const o = POSE_COMPOSER_ARRANGEMENT_OPTIONS.find(o => o.id === id);
    assert.equal(o.meta.uiHidden, true);
    assert.equal(o.meta.randomEligible, false);
    assert.equal(buildRestoreLocks(locksFor(id), controls).poseArrangementId, id);
    assert.ok(generate(locksFor(id)).grokPrompt.includes(o.en));
  }
});

test('all nine standing sources reach the three main outputs and survive saved-card and prose restore', () => {
  for (const id of activeIds) {
    const source = POSE_COMPOSER_ARRANGEMENT_OPTIONS.find(o => o.id === id);
    const locks = locksFor(id);
    const before = structuredClone(locks);
    const p = generate(locks);
    for (const text of [p.grokPrompt, p.zImagePrompt, p.midjourneyPrompt]) assert.ok(text.includes(source.en), id);
    assert.deepEqual(locks, before);
    assert.equal(p.selection.poseArrangementId, id);
    const restored = deserializeFavoritePrompt(serializeFavoritePrompt(p));
    assert.equal(restored.selection.poseArrangementId, id);
    assert.equal(restored.grokPrompt, p.grokPrompt);
    assert.equal(parseLocksFromStandardPrompt(p.grokPrompt, controls).locks.poseArrangementId, id);
    assert.match(extra(p, 'chest-up-portrait'), /4:5/);
    assert.match(extra(p, 'chest-up-mj-portrait'), /--ar 4:5\b/);
    assert.equal(extra(p, 'full-body-character'), extra(generate(locksFor('standing-natural')), 'full-body-character'));
  }
});

test('changed standing prose remains importable by its historical English', () => {
  for (const id of ['standing-pelvis-back-curve', 'standing-forward-lean']) {
    const o = POSE_COMPOSER_ARRANGEMENT_OPTIONS.find(o => o.id === id);
    assert.ok(o.meta.legacyPromptAliases.length);
    for (const text of o.meta.legacyPromptAliases) assert.equal(parseLocksFromStandardPrompt(`She presents a ${text}.`, controls).locks.poseArrangementId, id);
  }
});

test('standing crops keep visible intent without leaking off-frame feet or changing chest policy', () => {
  for (const id of activeIds) {
    for (const frame of ['中景鏡頭 (Medium Shot)', '胸上特寫', '半臉傾斜特寫']) {
      const p = generate(locksFor(id, frame));
      const pose = p.grokPrompt.split('Pose and Composition:\n')[1]?.split('\n\n')[0] || '';
      assert.doesNotMatch(pose, /foot raised|feet planted|foot raised off the ground|lower leg folded back/);
      if (id === 'standing-forward-lean' && frame !== '半臉傾斜特寫') assert.match(pose, /marked forward lean.*camera/);
      for (const key of ['chest-up-portrait', 'chest-up-mj-portrait']) {
        const text = extra(p, key);
        assert.doesNotMatch(text, /foot raised off the ground|pelvis shifted distinctly backward/);
      }
    }
  }
  const cowboy = generate(locksFor('standing-bent-leg-lift', '牛仔中景 (Cowboy Shot)'));
  assert.match(cowboy.grokPrompt, /free leg lifted and bent at the knee/);
  assert.doesNotMatch(cowboy.grokPrompt, /foot raised off the ground/);
});

test('random standing arrangements sample only the current catalog', () => {
  const selected = new Set();
  const locks = { ...locksFor('random'), orbitId: 'none' };
  const random = createSeededRandom('standing-random-catalog-v1');
  for (const p of generatePrompts(200, locks, [], { random })) {
    assert.ok(activeIds.includes(p.selection.poseArrangementId), p.selection.poseArrangementId);
    selected.add(p.selection.poseArrangementId);
  }
  assert.equal(selected.size, 9);
});

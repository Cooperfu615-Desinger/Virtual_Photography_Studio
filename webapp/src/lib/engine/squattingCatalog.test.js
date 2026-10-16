import assert from 'node:assert/strict';
import test from 'node:test';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import { POSE_COMPOSER_ARRANGEMENT_OPTIONS } from './poseComposerOptions.js';
import { buildRestoreLocks, parseLocksFromStandardPrompt, serializeFavoritePrompt, deserializeFavoritePrompt } from '../../features/saved-cards/cardCodec.js';

const controls = getLockControls();
const activeIds = ['squatting-natural', 'squatting-side', 'squatting-forward-lean', 'squatting-gangster-wide-knee'];
const retired = ['squatting-one-knee', 'squatting-low-one-leg-forward', 'squatting-knees-together-low'];
const source = id => POSE_COMPOSER_ARRANGEMENT_OPTIONS.find(o => o.id === id);
function locksFor(id, frame = '全身鏡頭 (Full Body Shot)') {
  const locks = createEmptyLocks();
  for (const c of controls) {
    const none = c.options.find(o => o.zh === '全無' || o.zh === '無額外表情');
    if (none) locks[c.key] = none.id;
  }
  return { ...locks, subjectCount: '1', poseBaseId: 'squatting', poseArrangementId: id,
    framingId: controls.find(c => c.key === 'framingId').options.find(o => o.zh === frame).id };
}
const generate = locks => generatePrompts(1, locks, [], { random: createSeededRandom('squatting-catalog-v2') })[0];
const main = p => [p.grokPrompt, p.zImagePrompt, p.midjourneyPrompt, p.nanoBananaPrompt];
const extra = (p, id) => p.extraPrompts.find(e => e.id === id).text;

test('four casual squat choices retain stable ids and retire three old poses', () => {
  assert.deepEqual(POSE_COMPOSER_ARRANGEMENT_OPTIONS.filter(o => o.base === 'squatting' && !o.meta?.uiHidden).map(o => o.id), activeIds);
  assert.equal(source('squatting-side').zh, '收攏低蹲姿');
  assert.equal(source('squatting-gangster-wide-knee').zh, '寬膝低蹲姿');
  for (const id of retired) {
    assert.equal(source(id).meta.uiHidden, true);
    assert.equal(source(id).meta.randomEligible, false);
    const p = generate(buildRestoreLocks(locksFor(id), controls));
    assert.equal(p.selection.poseArrangementId, id);
    for (const text of main(p)) assert.ok(text.includes(source(id).en), id);
  }
});

test('four main outputs share relaxed geometry, free heel placement and independent hands', () => {
  const identity = {
    'squatting-natural': /comfortably bent knees/,
    'squatting-side': /knees and feet close together.*thighs folded close to the calves/,
    'squatting-forward-lean': /torso gently inclined from the hips toward the thighs/,
    'squatting-gangster-wide-knee': /knees opened outward.*toes turned outward in line with the knees/,
  };
  for (const id of activeIds) {
    const locks = locksFor(id);
    const before = structuredClone(locks);
    const p = generate(locks);
    assert.deepEqual(locks, before);
    assert.equal(p.selection.poseHandId, 'none');
    assert.equal(p.selection.poseAnchorId, 'none');
    for (const text of main(p)) {
      assert.ok(text.includes(source(id).en), id);
      assert.match(text, identity[id]);
      assert.match(text, /heels resting down or lightly lifted for balance/);
      assert.match(text, /clear of the ground/);
      assert.doesNotMatch(text, /both heels grounded|both feet planted flat|torso turns toward the camera/);
    }
    const withHand = generate({ ...locks, poseHandId: 'arms-crossed' });
    assert.equal(withHand.selection.poseHandId, 'arms-crossed');
  }
});

test('upper crops retain gentle posture without off-frame legs and full-body reference stays standing', () => {
  const reference = extra(generate(locksFor(activeIds[0])), 'full-body-character');
  for (const id of activeIds) {
    for (const frame of ['胸上特寫', '中景鏡頭 (Medium Shot)', '半臉傾斜特寫']) {
      const p = generate(locksFor(id, frame));
      for (const text of [...main(p), extra(p, 'chest-up-portrait')]) {
        assert.doesNotMatch(text, /heels resting|knees and feet close|hips sunk|hips lowered|calves|knees opened outward/);
      }
      if (id !== 'squatting-gangster-wide-knee' && frame !== '半臉傾斜特寫') {
        for (const text of main(p)) assert.match(text, /gentle forward lean/);
      }
      assert.equal(extra(p, 'full-body-character'), reference);
      assert.equal(p.extraPrompts.some(e => e.id === 'chest-up-mj-portrait'), false);
    }
  }
});

test('saved cards and old English restore all changed squat ids without rewriting saved text', () => {
  for (const id of activeIds) {
    const p = generate(locksFor(id));
    const saved = deserializeFavoritePrompt(serializeFavoritePrompt(p));
    assert.equal(saved.selection.poseArrangementId, id);
    assert.equal(saved.grokPrompt, p.grokPrompt);
    assert.equal(parseLocksFromStandardPrompt(p.grokPrompt, controls).locks.poseArrangementId, id);
    assert.ok(source(id).meta.legacyPromptAliases.length);
    for (const text of source(id).meta.legacyPromptAliases) {
      assert.equal(parseLocksFromStandardPrompt(`She presents a ${text}.`, controls).locks.poseArrangementId, id);
      const historic = { ...p, grokPrompt: `She presents a ${text}.` };
      assert.equal(deserializeFavoritePrompt(serializeFavoritePrompt(historic)).grokPrompt, historic.grokPrompt);
    }
  }
});

test('random squatting reaches all four reviewed poses and excludes retired poses', () => {
  const seen = new Set();
  for (const p of generatePrompts(64, locksFor('random'), [], { random: createSeededRandom('squat-random-v2') })) {
    assert.ok(activeIds.includes(p.selection.poseArrangementId));
    seen.add(p.selection.poseArrangementId);
  }
  assert.equal(seen.size, 4);
});

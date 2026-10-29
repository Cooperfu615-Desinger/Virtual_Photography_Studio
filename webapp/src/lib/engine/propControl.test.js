import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import { PROP_OPTIONS, resolveProp } from './gazeGesture.js';

// 道具 control (Cooper 2026-10-22): props sit beside every action, unfiltered; 隨機 skips
// face-touching props under a back view and the glasses when the wardrobe has none.
const controls = getLockControls();
const option = (key, zh) => controls.find(c => c.key === key).options.find(o => o.zh === zh).id;
const FULL = option('framingId', '全身鏡頭 (Full Body Shot)');
const generate = (locks, seed = 'prop') => generatePrompts(1, {
  ...createEmptyLocks(), subjectCount: '1', framingId: FULL, ...locks,
}, [], { random: createSeededRandom(seed) })[0];
const main = prompt => [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt, prompt.nanoBananaPrompt];
const chest = prompt => prompt.extraPrompts.find(e => e.id === 'chest-up-portrait').text;
const ALL_PRESENT = { eyewear: 'present' };
const FACE_PROPS = ['hand-apply-lipstick', 'hand-hold-fuji-x100v', 'hand-hold-whirly-lollipop', 'hand-hold-round-lollipop-mouth', 'hand-hold-glasses'];

test('道具 offers 全無, 隨機 and twelve props; the mirror selfie phone stays a 拍攝方式', () => {
  assert.deepEqual(PROP_OPTIONS.map(o => o.zh), ['全無', '隨機', '塗口紅｜自由妝感', '手持冰咖啡', '手持威士忌', '手持香檳', '手持礦泉水瓶',
    '手持 FUJIFILM X100V 相機', '手持波板糖', '含著圓形棒棒糖｜右手持棒', '手持香菸', '滑手機', '單手拿著眼鏡', '拿著打開的書']);
  assert.equal(PROP_OPTIONS.some(o => o.id === 'selfie-mirror-phone-visible'), false);
});

test('a prop joins the action sentence in every main output and the chest crop, and is recorded', () => {
  const prompt = generate({ specifiedActionId: 'specified-standing-natural', propId: 'hand-hold-open-book' });
  for (const text of [...main(prompt), chest(prompt)]) {
    assert.match(text, /She stands in a relaxed neutral posture, an open book held in one hand at chest height, its pages facing her as if reading\./);
  }
  assert.equal(prompt.selection.propId, 'hand-hold-open-book');
});

test('a prop alone (no action) is written, and a prop with a fixed-hand action is not filtered', () => {
  const alone = generate({ propId: 'hand-hold-cigarette' });
  assert.match(alone.grokPrompt, /a cigarette held naturally between the fingers in one hand/);
  const fixed = generate({ specifiedActionId: 'specified-sitting-hug-knees', propId: 'hand-use-phone' });
  assert.match(fixed.grokPrompt, /a cell phone held in one hand while scrolling or checking the screen/);
});

test('隨機 prop: every prop reachable, no face prop under a back view, glasses only with glasses present', () => {
  const seen = new Set();
  for (let index = 0; index < 600; index += 1) seen.add(resolveProp('random', { wardrobeSignals: ALL_PRESENT }, () => index / 600).id);
  assert.equal(seen.size, 12);
  const back = { meta: { tags: ['back_view'] } };
  for (let index = 0; index < 200; index += 1) {
    assert.ok(!FACE_PROPS.includes(resolveProp('random', { wardrobeSignals: ALL_PRESENT, orbit: back }, () => index / 200).id), `${index}`);
    assert.notEqual(resolveProp('random', { wardrobeSignals: { eyewear: 'unknown' } }, () => index / 200).id, 'hand-hold-glasses');
  }
});

test('a chosen glasses prop is skipped only when the wardrobe positively lacks glasses', () => {
  assert.equal(resolveProp('hand-hold-glasses', { wardrobeSignals: { eyewear: 'absent' } }), null);
  assert.equal(resolveProp('hand-hold-glasses', { wardrobeSignals: { eyewear: 'unknown' } })?.id, 'hand-hold-glasses');
  const skipped = generate({ specifiedActionId: 'specified-standing-natural', propId: 'hand-hold-glasses', eyewearId: option('eyewearId', '全無') });
  assert.doesNotMatch(skipped.grokPrompt, /holding the glasses/);
});

test('the mirror selfie style owns the phone: the chosen prop is dropped', () => {
  const prompt = generate({ captureStyleId: 'mirror', propId: 'hand-hold-open-book' });
  assert.doesNotMatch(prompt.grokPrompt, /open book/);
});

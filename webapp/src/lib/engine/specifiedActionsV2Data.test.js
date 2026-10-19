import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import v1Sources from './specifiedActionsV1Sources.json' with { type: 'json' };
import {
  SPECIFIED_ACTION_CONCRETE_OPTIONS,
  SPECIFIED_ACTION_REGIONS,
  SPECIFIED_ACTION_VALIDATION_STATUSES,
  joinSpecifiedActionClauses,
} from './specifiedActions.js';

// expression-pose-v2 P1 (2026-10-19): actions are stored as tagged clauses; the
// full English is their verbatim concatenation. The 11 v1 actions are frozen in
// specifiedActionsV1Sources.json and must reconstruct byte for byte.
const LYING_V1 = [
  ['specified-lying-side-pillow-hand', 'lying-side', 'accepted'],
  ['specified-lying-prone-forearms-crossed-ankles', 'lying-prone', 'accepted'],
  ['specified-lying-prone-forearms-one-knee-up', 'lying-prone', 'pending'],
];
const byId = id => SPECIFIED_ACTION_CONCRETE_OPTIONS.find(action => action.id === id);
const controls = getLockControls();
const framing = zh => controls.find(c => c.key === 'framingId').options.find(o => o.zh === zh).id;
const generate = (id, framingZh) => generatePrompts(1, {
  ...createEmptyLocks(), subjectCount: '1', specifiedActionId: id, framingId: framing(framingZh),
}, [], { random: createSeededRandom('specified-actions-v2') })[0];

test('every action is valid tagged clauses whose join is its English', () => {
  for (const action of SPECIFIED_ACTION_CONCRETE_OPTIONS) {
    assert.ok(action.clauses.length > 0, action.id);
    assert.equal(action.clauses[0].region, 'core', `${action.id}: starts with the posture identity`);
    for (const item of action.clauses) {
      assert.ok(SPECIFIED_ACTION_REGIONS.includes(item.region), `${action.id}: ${item.region}`);
      assert.ok(item.en && !/[.;,]\s*$/.test(item.en), `${action.id}: clause text has no trailing separator`);
    }
    assert.equal(action.en, joinSpecifiedActionClauses(action.clauses), action.id);
    assert.ok(SPECIFIED_ACTION_VALIDATION_STATUSES.includes(action.validation.status), action.id);
    assert.ok(['fixed', 'free'].includes(action.hands.mode), action.id);
  }
});

test('the 11 v1 actions keep their exact English, upper-body text and order', () => {
  assert.deepEqual(SPECIFIED_ACTION_CONCRETE_OPTIONS.slice(0, 11).map(a => a.id), v1Sources.map(a => a.id), 'v1 order is kept; new actions are appended');
  for (const source of v1Sources) {
    const action = byId(source.id);
    assert.ok(action, source.id);
    assert.equal(action.en, source.en, `${source.id}: en`);
    assert.equal(action.upperBodyEn, source.upperBodyEn, `${source.id}: upperBodyEn`);
    assert.equal(action.validation.status, 'accepted', `${source.id}: Cooper accepted all v1 actions (2026-10-19)`);
  }
});

test('family follows the base; the base-free legacy card is a free family', () => {
  for (const action of SPECIFIED_ACTION_CONCRETE_OPTIONS) {
    assert.equal(action.family, action.baseId && action.baseId !== 'none' ? action.baseId : 'free', action.id);
  }
});

test('P1 leaves random generation alone: no action joins the random pool yet', () => {
  for (const action of SPECIFIED_ACTION_CONCRETE_OPTIONS) assert.equal(action.meta.randomEligible, false, action.id);
});

test('posture clauses describe only the body: no face, gaze or camera wording', () => {
  for (const action of SPECIFIED_ACTION_CONCRETE_OPTIONS.filter(a => !a.ownsExpression)) {
    for (const item of action.clauses) {
      assert.doesNotMatch(item.en, /\b(?:smil\w*|gaz\w*|looks?|eyes|expression|camera|lens)\b/i, `${action.id}: ${item.en}`);
    }
  }
});

test('lying library v1: orientation, status and upper-body projection', () => {
  for (const [id, orientation, status] of LYING_V1) {
    const action = byId(id);
    assert.ok(action, id);
    assert.equal(action.baseId, 'lying');
    assert.equal(action.family, 'lying');
    assert.equal(action.orientationId, orientation);
    assert.equal(action.validation.status, status);
    assert.equal(action.upperBodyEn, joinSpecifiedActionClauses(action.clauses, ['core', 'upper']), `${id}: upper-body text is core + upper`);
  }
  assert.equal(byId('specified-lying-side-pillow-hand').scene.support, 'bed');
  assert.equal(byId('specified-lying-side-pillow-hand').hands.mode, 'fixed');
  assert.equal(byId('specified-lying-prone-forearms-crossed-ankles').hands.mode, 'free');
});

test('lying actions crop like v1 actions: full body keeps legs, medium keeps core and upper, face omits the pose', () => {
  for (const [id] of LYING_V1) {
    const action = byId(id);
    const lower = action.clauses.find(item => item.region === 'lower').en;
    const core = action.clauses[0].en;
    const full = generate(id, '全身鏡頭 (Full Body Shot)');
    const medium = generate(id, '中景鏡頭 (Medium Shot)');
    const face = generate(id, '臉部特寫');
    for (const text of [full.grokPrompt, full.zImagePrompt, full.nanoBananaPrompt]) {
      assert.ok(text.includes(core), `${id}: full-body core`);
      assert.ok(text.includes(lower), `${id}: full-body lower`);
    }
    for (const text of [medium.grokPrompt, medium.zImagePrompt, medium.nanoBananaPrompt]) {
      assert.ok(text.includes(core), `${id}: medium core`);
      assert.ok(!text.includes(lower), `${id}: medium drops lower`);
    }
    for (const text of [face.grokPrompt, face.zImagePrompt, face.nanoBananaPrompt]) assert.ok(!text.includes(core), `${id}: face omits pose`);
    assert.equal(full.selection.specifiedActionId, id);
  }
});

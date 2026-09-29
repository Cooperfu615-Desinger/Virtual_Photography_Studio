import assert from 'node:assert/strict';
import test from 'node:test';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls, normalizeLocks } from '../engine.js';
import { buildAllNoneLocks } from '../../features/page1/page1Selectors.js';
import { resolveCarriageOrbit, carriageOrbitAllowed, CARRIAGE_POSITION_OPTIONS, carriagePoseLocks, getCarriagePosition } from './carriageFixedComposition.js';

test('bench front describes a transverse camera axis, not a viewpoint moving along the aisle', () => {
  const result = make('japan-carriage-bench-front');
  for (const text of [result.grokPrompt, result.zImagePrompt, result.midjourneyPrompt]) {
    assert.match(text, /across the width of the carriage/);
    assert.match(text, /perpendicular to the window wall/);
    assert.doesNotMatch(text, /left-right relationships may change/);
  }
});

test('carriage positions own posture and hands without retaining contradictory pose locks', () => {
  const result = make('japan-carriage-bench-front', {
    fixedSetPositionId: 'carriage-bench-upright', poseBaseId: 'kneeling',
    poseHandId: 'selfie-mirror-phone-visible', poseArrangementId: 'any',
  });
  for (const text of [result.grokPrompt, result.zImagePrompt, result.midjourneyPrompt,
    ...result.extraPrompts.filter(p => p.id.includes('chest-up')).map(p => p.text)]) {
    assert.match(text, /sits upright on the bench/);
    assert.doesNotMatch(text, /kneeling|selfie|mirror-phone/i);
  }
  assert.equal(result.selection.poseBaseId, 'sitting');
  assert.equal(result.selection.fixedSetPositionId, 'carriage-bench-upright');
  assert.doesNotMatch(result.extraPrompts.find(p => p.id === 'full-body-character').text, /seat cushion|carriage/);
});

test('all eight positions share one crop-aware pose across main and chest renderers and restore from selection', () => {
  assert.equal(CARRIAGE_POSITION_OPTIONS.length, 8);
  for (const position of CARRIAGE_POSITION_OPTIONS) {
    for (const frame of ['中景鏡頭 (Medium Shot)', '牛仔中景 (Cowboy Shot)', '全身鏡頭 (Full Body Shot)', '全臉傾斜特寫']) {
      const result = make(position.setId, { fixedSetPositionId: position.id,
        framingId: option('framingId', frame).id, poseBaseId: 'kneeling',
        poseHandId: 'selfie-mirror-phone-visible', fixedSetCaptureModeId: 'selfie',
      });
      const tight = frame === '全臉傾斜特寫';
      for (const text of [result.grokPrompt, result.zImagePrompt, result.midjourneyPrompt]) {
        if (!tight) assert.ok(text.includes(position.en), `${position.id} ${frame}`);
        else assert.ok(!text.includes(position.en));
        assert.doesNotMatch(text, /kneeling|selfie/i);
        if (!tight) assert.equal(text.split(position.en).length - 1, 1);
      }
      for (const text of result.extraPrompts.filter(p => p.id.includes('chest-up')).map(p => p.text)) {
        assert.ok(text.includes(position.chestEn), position.id);
        assert.doesNotMatch(text, /hands rest.*lap|hips resting|kneeling/);
      }
      const restored = generatePrompts(1, normalizeLocks(JSON.parse(JSON.stringify(result.selection))), [], { random: createSeededRandom('restore-carriage-v2') })[0];
      assert.equal(restored.selection.fixedSetPositionId, position.id);
      assert.equal(restored.selection.poseBaseId, position.baseId);
      assert.doesNotMatch(restored.extraPrompts.find(p => p.id === 'full-body-character').text, /carriage|commuters|seat cushion|grab pole|overhead strap/);
    }
  }
});

test('managed values are a pure projection; none, foreign scene positions and duo preserve existing choices', () => {
  const original = { subjectCount: '1', fixedCompositionSetId: 'japan-carriage-bench-front',
    fixedSetPositionId: 'carriage-bench-upright', poseBaseId: 'kneeling', poseHandId: 'selfie-mirror-phone-visible', actionPoseCardId: 'legacy-card' };
  const snapshot = structuredClone(original);
  assert.equal(carriagePoseLocks(original).poseBaseId, 'sitting');
  assert.equal(carriagePoseLocks(original).actionPoseCardId, '');
  assert.deepEqual(original, snapshot);
  for (const patch of [{ fixedSetPositionId: 'none' }, { fixedCompositionSetId: 'japan-carriage-side-aisle' }, { subjectCount: '2' }]) {
    const input = { ...original, ...patch };
    assert.equal(getCarriagePosition(input), null);
    assert.equal(carriagePoseLocks(input), input);
  }
  const foreign = make('japan-carriage-side-aisle', { fixedSetPositionId: 'carriage-bench-upright' });
  assert.equal(foreign.selection.fixedSetPositionId, 'none');
  assert.equal(foreign.selection.poseBaseId, 'standing');
});

const cases = [
  ['japan-carriage-bench-front', '電車車廂正面長椅視角', 'blue fabric bench'],
  ['japan-carriage-side-aisle', '電車車廂側面走道視角', 'A few passengers'],
  ['japan-carriage-rush-hour', '電車車廂坐滿與站滿乘客', 'Visible bench seats are fully occupied'],
];
const option = (key, zh) => getLockControls().find(c => c.key === key).options.find(o => o.zh === zh);
const make = (set, overrides = {}) => generatePrompts(1, {
  ...buildAllNoneLocks(getLockControls(), createEmptyLocks()), subjectCount: '1',
  fixedCompositionSetId: set, fixedSetCaptureModeId: 'none', fixedSetPerformanceStateId: 'none',
  poseBaseId: 'standing', poseArrangementId: 'any', poseHandId: 'none', poseHeadId: 'none',
  framingId: option('framingId', '中景鏡頭 (Medium Shot)').id,
  orbitId: option('orbitId', '左側 90 度').id,
  lensId: option('lensId', '135mm 長焦壓縮').id,
  topId: option('topId', '短袖上衣').id, pantsId: option('pantsId', '直筒牛仔褲').id,
  ...overrides,
}, [], { random: createSeededRandom('carriage-v1') })[0];

test('three append-only Japanese carriage sets expose framing, lens and four shared window backgrounds', () => {
  for (const [id, zh] of cases) {
    const set = option('fixedCompositionSetId', zh);
    assert.equal(set?.id, id);
    assert.equal(set.allowsFramingVariation, true);
    assert.equal(set.allowsLensVariation, true);
    assert.equal(getLockControls().find(c => c.key === 'fixedSetBackgroundStateId').options
      .filter(o => o.setGroupId === set.setGroupId).length, 4);
  }
});
for (const [setId, , anchor] of cases) test(`${setId} retains all four window states, crop and lens in main/chest outputs`, () => {
  for (const state of ['urban', 'residential', 'countryside', 'coastal']) {
    const result = make(setId, { fixedSetBackgroundStateId: `carriage-window-${state}` });
    assert.equal(result.selection.framingId, option('framingId', '中景鏡頭 (Medium Shot)').id);
    assert.equal(result.selection.lensId, option('lensId', '135mm 長焦壓縮').id);
    assert.equal(result.selection.fixedSetBackgroundStateId, `carriage-window-${state}`);
    const texts = [result.grokPrompt, result.zImagePrompt, result.midjourneyPrompt,
      ...result.extraPrompts.filter(p => p.id.includes('chest-up')).map(p => p.text)];
    for (const text of texts) {
      assert.ok(text.includes(anchor), anchor);
      assert.match(text, /Through the carriage windows/);
      assert.match(text, /135mm/);
      assert.doesNotMatch(text, /platform axis|Her left side faces the lens|selected room architecture|train-only motion/);
    }
    for (const text of texts.slice(0, 3)) assert.match(text, /Waist-up portrait/i);
    assert.doesNotMatch(result.extraPrompts.find(p => p.id === 'full-body-character').text, /carriage|commuters|Through the carriage windows/);
    const restored = generatePrompts(1, normalizeLocks(JSON.parse(JSON.stringify(result.selection))), [], { random: createSeededRandom('carriage-restore') })[0];
    for (const key of ['fixedCompositionSetId', 'fixedSetBackgroundStateId', 'framingId', 'orbitId', 'lensId']) assert.equal(restored.selection[key], result.selection[key]);
  }
});
test('front bench forces a front camera; aisle resolves disallowed requests to a side camera', () => {
  assert.equal(make(cases[0][0]).selection.orbitId, option('orbitId', '正面 0 度').id);
  const aisle = make(cases[1][0], { orbitId: option('orbitId', '背面 180 度').id });
  assert.match(aisle.zImagePrompt, /camera is on her left/);
  assert.notEqual(aisle.selection.orbitId, option('orbitId', '背面 180 度').id);
  for (const zh of ['左前 45 度', '左側 90 度', '右側 270 度', '右前 315 度']) {
    const result = make(cases[1][0], { orbitId: option('orbitId', zh).id });
    assert.equal(result.selection.orbitId, option('orbitId', zh).id);
  }
});
test('rush-hour retains all eight camera positions without changing selected posture', () => {
  for (const o of getLockControls().find(c => c.key === 'orbitId').options.filter(o => /^(正面|左前|左側|左後|背面|右後|右側|右前)/.test(o.zh))) {
    const result = make(cases[2][0], { orbitId: o.id });
    assert.equal(result.selection.orbitId, o.id);
    assert.equal(result.selection.poseBaseId, 'standing');
    assert.match(result.zImagePrompt, /Natural partial occlusion/);
  }
});
test('selected crops project wardrobe while preserving the full-body character reference', () => {
  for (const [set] of cases) {
    const result = make(set, { framingId: option('framingId', '全臉傾斜特寫').id });
    assert.doesNotMatch(result.zImagePrompt, /straight-leg jeans/);
    assert.match(result.extraPrompts.find(p => p.id === 'full-body-character').text, /straight-leg jeans/);
  }
});
test('every public crop and both lenses remain selectable for all three carriage sets', () => {
  for (const [set] of cases) for (const frame of ['半臉傾斜特寫', '全臉傾斜特寫', '中景鏡頭 (Medium Shot)', '牛仔中景 (Cowboy Shot)', '全身鏡頭 (Full Body Shot)', '全無']) {
    for (const lens of ['28mm 廣角', '135mm 長焦壓縮']) {
      const result = make(set, { framingId: option('framingId', frame).id, lensId: option('lensId', lens).id });
      assert.equal(result.selection.framingId, option('framingId', frame).id);
      assert.equal(result.selection.lensId, option('lensId', lens).id);
    }
  }
});
test('camera UI projection does not mutate latent orbit selection and old sets are unchanged', () => {
  const options = getLockControls().find(c => c.key === 'orbitId').options;
  const original = option('orbitId', '背面 180 度');
  const sets = getLockControls().find(c => c.key === 'fixedCompositionSetId').options;
  for (const [set] of cases.slice(0, 2)) {
    const fixed = sets.find(s => s.id === set);
    assert.notEqual(resolveCarriageOrbit(fixed, original, options), original);
    assert.equal(original.id, option('orbitId', '背面 180 度').id);
    assert.equal(resolveCarriageOrbit(null, original, options), original);
    assert.equal(options.filter(o => carriageOrbitAllowed(fixed, o)).length, set === cases[0][0] ? 1 : 4);
  }
  const legacy = make('concrete-wall-chesterfield-sofa');
  assert.equal(legacy.selection.framingId, option('framingId', '全無').id);
  assert.equal(legacy.selection.lensId, option('lensId', '全無').id);
  const noBackground = make(cases[2][0], { fixedSetBackgroundStateId: 'outdoor-empty' });
  assert.equal(noBackground.selection.fixedSetBackgroundStateId, 'none');
  assert.doesNotMatch(noBackground.zImagePrompt, /Through the carriage windows|Empty background/);
});

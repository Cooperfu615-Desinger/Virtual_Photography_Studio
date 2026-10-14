import naturalProtected from './engine/midjourneyNaturalMirrorProtected.json' with { type: 'json' };
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { restorePreEthnicityOutputs } from './engine/ethnicityRevisionTestSupport.js';

import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls, getSceneDependentOptions, normalizeLocks } from './engine.js';
import { buildPage1ControlGroups } from '../features/page1/page1Selectors.js';
import { deserializeFavoritePrompt, parseLocksFromStandardPrompt, serializeFavoritePrompt } from '../features/saved-cards/cardCodec.js';
import { randomizeLockKeys } from './page1SectionRandom.js';
import { POSE_COMPOSER_KEYS } from '../features/page1/page1Schema.js';
import { PAGE1_POSE_SUBPANELS } from './page1WorkspacePanels.js';
import { poseComposerOptionVisibleForBase, poseComposerOptionVisibleForOrientation } from './engine/poseComposerCompatibility.js';
import { buildKneelingSupportControl, isFourPointKneeling, reconcileKneelingSupportLocks } from './engine/kneelingSupport.js';

const MIRROR_ID = 'selfie-mirror-phone-visible';
const MIRROR_SOURCE = 'one hand holding a visible phone toward a mirror for a mirror selfie, with the phone overlapping the face or positioned beside it in the reflection';
const controls = getLockControls();
const control = key => controls.find(item => item.key === key);
const option = (key, label) => {
  const result = control(key)?.options.find(item => item.zh === label);
  assert.ok(result, `${key}/${label}`);
  return result;
};
function silentLocks(overrides = {}) {
  const locks = createEmptyLocks();
  for (const row of controls) {
    const none = row.options?.find(item => item.zh === '全無');
    if (none) locks[row.key] = none.id;
  }
  return { ...locks, subjectCount: '1', poseBaseId: 'standing', poseArrangementId: 'standing-natural',
    posePropId: MIRROR_ID, poseHandId: 'none', framingId: option('framingId', '牛仔中景 (Cowboy Shot)').id, ...overrides };
}
function generate(overrides = {}, seed = 'mirror-prop-v1') {
  return generatePrompts(1, silentLocks(overrides), [], { random: createSeededRandom(seed) })[0];
}
function sixOutputs(prompt) {
  return [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt, ...prompt.extraPrompts.map(item => item.text)];
}
const count = (text, source = MIRROR_SOURCE) => text.toLowerCase().split(source.toLowerCase()).length - 1;

// Captured before production edits at the same scoped seeds. These pin all six
// complete output strings, including supine special assembly and untouched modes.
// Do not regenerate to accommodate a later renderer change.
const PRE_MOVE_OUTPUT_HASHES = [
  ['mirror:sitting:中景鏡頭 (Medium Shot)', { poseBaseId: 'sitting', poseArrangementId: 'sitting-natural', framing: '中景鏡頭 (Medium Shot)' }, '33a1552181aa7695e6d9723321f696edcffb3580a7d9ee0f795a34092d61031b'],
  ['mirror:standing:牛仔中景 (Cowboy Shot)', {}, '2060e5bc9026a8920049fc2d02b6d14c4c3caed0ef448a105a0bc523d413b4ba'],
  ['mirror:lying-supine:none', { orientation: 'lying-supine', anchor: 'none' }, '8b53db10039a8d95df3746628d8c405cca96ea661ecab1121e959a24f6b6707d'],
  ['mirror:lying-supine:lying-bed-surface', { orientation: 'lying-supine', anchor: 'lying-bed-surface' }, 'bd2373d5d97a29929a9f7527c0d7b0595edfa6402c090af3aab53a770bcf6d0c'],
  ['mirror:lying-side:lying-bed-surface', { orientation: 'lying-side', anchor: 'lying-bed-surface' }, 'a567795727b93061aeb1330cec4627fc963a4ba149a32f4fafd604d58838eb33'],
  ['mirror:lying-prone:lying-bed-surface', { orientation: 'lying-prone', anchor: 'lying-bed-surface' }, '7f861c33363c93e9a8042cb89bceb9ac555ceb392e3f4c7f523d09b4f33edf6d'],
  ['untouched:selfie-natural-right-arm:牛仔中景 (Cowboy Shot)', { poseHandId: 'selfie-natural-right-arm', posePropId: 'none' }, '319d773f811e1f85902b31d6748966e0b80d39078b4a8cfac3b6e3b216d58147'],
  ['untouched:scroll:牛仔中景 (Cowboy Shot)', { posePropId: 'hand-use-phone' }, '6b1f26c6bdf33bc0ac3309b4b7681edb8045288e0a3228d090e897bc72175de3'],
];

test('five protected output hashes match the pre-natural-MJ capture for mirror and untouched capture modes', () => {
  for (const [id, { framing, orientation, anchor, ...overrides }] of PRE_MOVE_OUTPUT_HASHES) {
    const prompt = generate({
      imageTypePresetId: 'photorealistic-photo', poseOrientationId: 'none', poseHeadId: 'chin-slightly-raised',
      topId: option('topId', '落肩 T 恤').id, pantsId: option('pantsId', '皮革長褲').id,
      locationId: option('locationId', '室內：浴室鏡前 / 洗手台').id,
      lightingId: option('lightingId', '室內黃昏微暖餘光').id,
      orbitId: option('orbitId', '背面 180 度').id, angleId: option('angleId', '高位俯視鏡頭').id,
      ...(framing ? { framingId: option('framingId', framing).id } : {}),
      ...(orientation ? { poseBaseId: 'lying', poseArrangementId: 'lying-natural', poseOrientationId: orientation,
        poseAnchorId: anchor, framingId: option('framingId', '全身鏡頭 (Full Body Shot)').id } : {}),
      ...overrides,
    }, `mirror-prop-v1:${id}`);
    const outputs = Object.fromEntries([['grokPrompt', prompt.grokPrompt], ['zImagePrompt', prompt.zImagePrompt],
      ...prompt.extraPrompts.map(row => [row.id, row.text])]);
    // Frozen hashes predate the 2026-10-14 ethnicity revision; reverse only that rollout.
    assert.equal(createHash('sha256').update(JSON.stringify(restorePreEthnicityOutputs(outputs))).digest('hex'), naturalProtected[id], id);
  }
});

test('mirror selfie is a manual prop with its stable ID and unchanged English source', () => {
  const prop = option('posePropId', '手持手機對鏡自拍');
  assert.equal(prop.id, MIRROR_ID);
  assert.equal(prop.en, MIRROR_SOURCE);
  assert.equal(prop.meta.randomEligible, false);
  assert.equal(prop.meta.uiHidden, undefined);
  for (const tag of ['prop_action', 'selfie_hand_pose', 'visible_phone', 'mirror_selfie', 'locks_orbit']) assert.ok(prop.meta.tags.includes(tag));
  const legacy = option('poseHandId', '鏡子自拍');
  assert.equal(legacy.id, MIRROR_ID);
  assert.equal(legacy.en, MIRROR_SOURCE);
  assert.equal(legacy.meta.uiHidden, true);
  assert.equal(legacy.meta.randomEligible, false);
  assert.equal(option('poseHandId', '自然自拍').meta.uiHidden, undefined);
  assert.equal(option('posePropId', '滑手機').id, 'hand-use-phone');
});

test('public hand picker omits old mirror entry and the prop picker exposes the new name', () => {
  const locks = silentLocks();
  const groups = buildPage1ControlGroups({ lockControls: controls, locks, sceneDependentOptions: getSceneDependentOptions([], locks) });
  assert.equal(groups.characterLockControls.find(row => row.key === 'poseHandId').options.some(row => row.id === MIRROR_ID), false);
  assert.equal(groups.characterLockControls.find(row => row.key === 'posePropId').options.some(row => row.id === MIRROR_ID && row.zh === '手持手機對鏡自拍'), true);
});

test('legacy mirror hand locks migrate without mutating the caller and remain idempotent', () => {
  for (const posePropId of ['none', '']) {
    const input = silentLocks({ poseHandId: MIRROR_ID, posePropId });
    const frozen = structuredClone(input);
    const normalized = normalizeLocks(input);
    assert.equal(normalized.poseHandId, 'none');
    assert.equal(normalized.posePropId, MIRROR_ID);
    assert.deepEqual(input, frozen);
    assert.deepEqual(normalizeLocks(normalized), normalized);
  }
  // Explicit random is the existing independent prop request, not an empty slot.
  const randomized = normalizeLocks(silentLocks({ poseHandId: MIRROR_ID, posePropId: 'random' }));
  assert.equal(randomized.posePropId, 'random');
  assert.equal(randomized.poseHandId, 'none');
});

test('an existing explicit prop wins over the legacy mirror hand or special action', () => {
  for (const legacy of [{ poseHandId: MIRROR_ID }, { specialActionId: 'character:特殊動作-special-actions:鏡子自拍:25' }]) {
    const normalized = normalizeLocks(silentLocks({ ...legacy, posePropId: 'hand-use-phone' }));
    assert.equal(normalized.poseHandId, 'none');
    assert.equal(normalized.posePropId, 'hand-use-phone');
    const prompt = generate(normalized);
    assert.doesNotMatch(prompt.grokPrompt, /mirror selfie/);
    assert.match(prompt.grokPrompt, /scrolling or checking the screen/);
  }
});

test('all retired mirror social pose IDs and mirror special action migrate to the prop', () => {
  const legacyIds = [
    'character:姿勢與肢體語言-pose-body-language:站姿-鏡子自拍姿勢:10',
    'character:姿勢與肢體語言-pose-body-language:坐姿-鏡子自拍姿勢:22',
    'character:姿勢與肢體語言-pose-body-language:半躺低姿態-鏡子自拍姿勢:33',
    'character:姿勢與肢體語言-pose-body-language:動態互動-鏡子自拍姿勢:47',
  ];
  for (const poseId of legacyIds) {
    const normalized = normalizeLocks(silentLocks({ poseId, posePropId: 'none' }));
    assert.equal(normalized.poseId, option('poseId', '全無').id, poseId);
    assert.equal(normalized.poseHandId, 'none', poseId);
    assert.equal(normalized.posePropId, MIRROR_ID, poseId);
  }
  const normalized = normalizeLocks(silentLocks({ posePropId: 'none', specialActionId: 'character:特殊動作-special-actions:鏡子自拍:25' }));
  assert.equal(normalized.specialActionId, option('specialActionId', '全無').id);
  assert.equal(normalized.poseHandId, 'none');
  assert.equal(normalized.posePropId, MIRROR_ID);
});

test('unchanged English imports resolve to the prop and retain a single source', () => {
  for (const source of [MIRROR_SOURCE, `She has ${MIRROR_SOURCE}, and presents a relaxed neutral standing posture.`]) {
    const parsed = normalizeLocks(parseLocksFromStandardPrompt(`Pose and Composition:\n${source}`, controls).locks);
    assert.equal(parsed.posePropId, MIRROR_ID);
    assert.equal(parsed.poseHandId, 'none');
    assert.equal(count(generate(parsed).grokPrompt), 1);
  }
});

test('Saved Cards preserve stored prompt text and migrate only normalized old selections', () => {
  const historical = { ...generate(), summary: '鏡子自拍', selection: { ...generate().selection, poseHandId: MIRROR_ID, posePropId: 'none' } };
  const serialized = serializeFavoritePrompt(historical);
  const restored = deserializeFavoritePrompt(serialized);
  assert.equal(restored.summary, historical.summary);
  assert.equal(restored.grokPrompt, historical.grokPrompt);
  assert.deepEqual(sixOutputs(restored), sixOutputs(historical));
  const locks = normalizeLocks(restored.selection);
  assert.equal(locks.poseHandId, 'none');
  assert.equal(locks.posePropId, MIRROR_ID);
  assert.ok(generate(locks).summary.includes('手持手機對鏡自拍'));
  const current = deserializeFavoritePrompt(serializeFavoritePrompt(generate()));
  assert.equal(current.selection.poseHandId, 'none');
  assert.equal(current.selection.posePropId, MIRROR_ID);
});

test('mirror prop is manually available for five posture bases and every lying orientation', () => {
  const prop = option('posePropId', '手持手機對鏡自拍');
  for (const base of ['standing', 'sitting', 'kneeling', 'squatting', 'lying']) assert.equal(poseComposerOptionVisibleForBase(prop, base), true);
  for (const orientation of ['lying-supine', 'lying-side', 'lying-prone']) assert.equal(poseComposerOptionVisibleForOrientation(prop, orientation), true);
});

test('legacy and new mirror locks produce byte-identical six outputs across crops and posture', () => {
  for (const posture of ['standing', 'sitting', 'kneeling', 'squatting', 'lying']) {
    for (const crop of ['局部五官特寫', '特寫鏡頭 (Close-Up)', '胸上特寫', '中景鏡頭 (Medium Shot)', '牛仔中景 (Cowboy Shot)', '全身鏡頭 (Full Body Shot)', '全無']) {
      const common = { poseBaseId: posture, poseArrangementId: `${posture}-natural`, poseOrientationId: posture === 'lying' ? 'lying-supine' : 'none', framingId: option('framingId', crop).id };
      const legacy = generate({ ...common, poseHandId: MIRROR_ID, posePropId: 'none' });
      const current = generate(common);
      assert.deepEqual(sixOutputs(current), sixOutputs(legacy), `${posture}/${crop}`);
      assert.equal(current.selection.posePropId, MIRROR_ID);
      assert.equal(current.selection.poseHandId, 'none');
      assert.doesNotMatch(current.extraPrompts.find(row => row.id === 'full-body-character').text, /mirror selfie/);
    }
  }
});

test('mirror prop locks orbit and relocates the same visible source only once in main Z capture', () => {
  const prompt = generate({ orbitId: option('orbitId', '背面 180 度').id });
  assert.equal(prompt.selection.orbitId, option('orbitId', '全無').id);
  for (const text of sixOutputs(prompt).slice(0, 4)) assert.equal(count(text), 1);
  assert.equal(count(prompt.zImagePrompt.split('\n\n')[1]), 1);
  assert.equal(count(prompt.zImagePrompt.split('\n\n').slice(2).join('\n\n')), 0);
  assert.doesNotMatch(prompt.grokPrompt, /rear view|back view|from behind/i);
});

test('tight main crops omit mirror text while chest derivatives reproject the saved source', () => {
  for (const crop of ['局部五官特寫', '臉部特寫', '特寫鏡頭 (Close-Up)']) {
    const prompt = generate({ framingId: option('framingId', crop).id });
    assert.equal(prompt.selection.posePropId, MIRROR_ID);
    for (const text of sixOutputs(prompt).slice(0, 3)) assert.equal(count(text), 0);
    for (const row of prompt.extraPrompts.filter(item => item.id.includes('chest'))) assert.equal(count(row.text), 1);
  }
});

test('mirror remains excluded from randomized hand and prop pools', () => {
  for (let index = 0; index < 40; index += 1) {
    const prompt = generate({ poseHandId: 'random', posePropId: 'random' }, `mirror-random:${index}`);
    assert.notEqual(prompt.selection.poseHandId, MIRROR_ID);
    assert.notEqual(prompt.selection.posePropId, MIRROR_ID);
  }
});

test('pose panel and global batch randomness preserve an explicitly chosen mirror prop', () => {
  const panel = PAGE1_POSE_SUBPANELS.find(row => row.id === 'single');
  for (const keys of [panel.keys, controls.map(row => row.key)]) {
    const randomized = randomizeLockKeys(silentLocks(), keys, createEmptyLocks(), controls);
    assert.equal(randomized.posePropId, MIRROR_ID);
    const prompt = generate(randomized);
    assert.equal(prompt.selection.posePropId, MIRROR_ID);
    assert.equal(prompt.selection.poseHandId, 'none');
    for (const key of POSE_COMPOSER_KEYS) assert.notEqual(prompt.selection[key], 'random');
  }
});

test('new manual four-point edits bind support and cannot be taken over by mirror prop', () => {
  for (const support of ['hands-palms-planted-ground', 'hands-elbows-planted-ground']) {
    const initial = silentLocks({ poseBaseId: 'kneeling', poseArrangementId: 'kneeling-all-fours', poseHandId: support, posePropId: 'none' });
    assert.equal(isFourPointKneeling(initial), true);
    assert.equal(isFourPointKneeling({ ...initial, subjectCount: '2' }), false);
    assert.deepEqual(buildKneelingSupportControl(control('posePropId'), initial).options.map(row => row.id), ['none']);
    const updated = reconcileKneelingSupportLocks(initial, { ...initial, posePropId: MIRROR_ID });
    const prompt = generate(updated);
    assert.equal(prompt.selection.poseHandId, support);
    assert.equal(prompt.selection.posePropId, 'none');
    assert.doesNotMatch(prompt.grokPrompt, /mirror selfie/);
  }
});

test('random prop requests preserve required four-point support and never choose the manual mirror prop', () => {
  for (let index = 0; index < 20; index += 1) {
    const prompt = generate({ poseBaseId: 'kneeling', poseArrangementId: 'kneeling-all-fours',
      poseHandId: 'random', posePropId: 'random' }, `mirror-required-support:${index}`);
    assert.ok(['hands-palms-planted-ground', 'hands-elbows-planted-ground'].includes(prompt.selection.poseHandId));
    assert.equal(prompt.selection.posePropId, 'none');
    assert.doesNotMatch(prompt.grokPrompt, /mirror selfie/);
  }
});

test('fixed carriage pose takeover suppresses mirror text in either storage layer', () => {
  const fixedId = option('fixedCompositionSetId', '電車車廂正面長椅視角').id;
  for (const mirrorLocks of [{ poseHandId: MIRROR_ID, posePropId: 'none' }, { posePropId: MIRROR_ID }]) {
    const prompt = generate({ fixedCompositionSetId: fixedId, fixedSetPositionId: 'carriage-bench-upright', ...mirrorLocks });
    for (const text of sixOutputs(prompt).slice(0, 5)) assert.doesNotMatch(text, /mirror selfie/);
  }
});

test('supine surface-led mirror source remains identical through hand-to-prop relocation', () => {
  for (const anchor of ['none', 'lying-bed-surface', 'water-immersed', 'lying-clear-sea-surface']) {
    const common = { poseBaseId: 'lying', poseOrientationId: 'lying-supine', poseArrangementId: 'lying-natural', poseAnchorId: anchor,
      framingId: option('framingId', '全身鏡頭 (Full Body Shot)').id };
    const old = generate({ ...common, posePropId: 'none', poseHandId: MIRROR_ID });
    assert.deepEqual(sixOutputs(generate(common)), sixOutputs(old), anchor);
  }
});

test('natural selfie and scrolling keep their distinct sources and classification', () => {
  const natural = generate({ posePropId: 'none', poseHandId: 'selfie-natural-right-arm' });
  assert.equal(natural.selection.poseHandId, 'selfie-natural-right-arm');
  assert.equal(natural.selection.posePropId, 'none');
  assert.match(natural.grokPrompt, /front-camera self-shot.*phone just beyond the frame edge/);
  assert.doesNotMatch(natural.grokPrompt, /mirror selfie|scrolling or checking/);
  const scroll = generate({ posePropId: 'hand-use-phone' });
  assert.equal(scroll.selection.posePropId, 'hand-use-phone');
  assert.match(scroll.grokPrompt, /cell phone held in one hand while scrolling or checking the screen/);
  assert.doesNotMatch(scroll.grokPrompt, /mirror selfie|front-camera self-shot/);
});

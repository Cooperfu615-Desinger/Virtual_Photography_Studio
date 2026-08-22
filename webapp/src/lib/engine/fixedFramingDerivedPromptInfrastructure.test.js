import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';

import {
  createEmptyLocks,
  createSeededRandom,
  generatePrompts,
  getLockControls,
} from '../engine.js';
import { COMPOSITION_VISIBILITY_BUCKETS } from './compositionVisibilityContract.js';
import {
  createFixedFramingDerivedContext,
  FIXED_FRAMING_DERIVED_PROMPT_PRESETS,
} from './fixedFramingDerivedPrompt.js';
import { FIXED_FRAMING_DERIVED_PROMPT_CONTRACT } from './fixedFramingDerivedPromptContract.js';

const controls = getLockControls();
const controlsByKey = new Map(controls.map((control) => [control.key, control]));

const FULL_BODY_CHARACTER_BASELINES = Object.freeze([
  Object.freeze({
    id: 'normal-separates',
    seed: 'phase2-fullbody-normal-v1',
    locks: Object.freeze({
      framingId: '胸上特寫',
      bodyTypeId: '性感曲線身形',
      topId: '棉質細肩背心',
      pantsId: '直筒牛仔褲',
      outerwearId: '丹寧外套',
      legwearId: '羅紋短襪',
      shoesId: 'Samba OG',
      locationId: '室內：英倫復古窗邊房間',
    }),
    length: 1384,
    sha256: '9d8727d9d79e03016b68420330dbac8c81b765ec054d4811c107ceeeed99257a',
  }),
  Object.freeze({
    id: 'special-outfit',
    seed: 'phase2-fullbody-special-v1',
    locks: Object.freeze({
      framingId: '臉部特寫',
      specialOutfitId: '酒紅格紋吊帶牛仔短裙長靴造型',
      locationId: '室內：古書二手書店',
    }),
    length: 1184,
    sha256: '63c7c2fd6eda39858d2744a01cdf984067ba83fe21532c431c6219f90d482a8f',
  }),
  Object.freeze({
    id: 'character-card',
    seed: 'phase2-fullbody-card-v1',
    locks: Object.freeze({
      characterProfileId: 'character-kaori',
      framingId: '中景鏡頭 (Medium Shot)',
      locationId: '室內：莫蘭迪灰背景',
    }),
    length: 1923,
    sha256: '7168055482a1343fd3df9e2f94aa5945479bb7c56fbd5bb93fd804898bc3189a',
  }),
  Object.freeze({
    id: 'fixed-composition',
    seed: 'phase2-fullbody-fixed-v1',
    locks: Object.freeze({
      fixedCompositionSetId: '暖灰泥黑絲絨工業沙發棚',
      fixedSetPositionId: '自由場景互動',
      topId: '棉質細肩背心',
      pantsId: '直筒牛仔褲',
    }),
    length: 1147,
    sha256: '6be801486139b3d8feea0a2c7a9bcc65f790dd982e92b18f4d937d182a766959',
  }),
]);

function optionId(key, zh) {
  const option = controlsByKey.get(key)?.options?.find((entry) => entry.zh === zh);
  assert.ok(option, `Missing ${key} option ${zh}`);
  return option.id;
}

function createAllNoneLocks() {
  const locks = { ...createEmptyLocks() };
  for (const control of controls) {
    const noneOption = control.options?.find((entry) => entry.zh === '全無' || entry.zh === '無額外表情');
    if (noneOption) locks[control.key] = noneOption.id;
  }
  return locks;
}

function materializeLocks(promptCase) {
  const locks = {
    ...createAllNoneLocks(),
    subjectCount: '1',
  };
  for (const [key, selector] of Object.entries(promptCase.locks)) {
    locks[key] = key === 'characterProfileId' ? selector : optionId(key, selector);
  }
  return locks;
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

test('phase-2 shared preset builds a full-body derived context without mutating its resolved source', () => {
  const preset = FIXED_FRAMING_DERIVED_PROMPT_PRESETS.fullBodyCharacter;
  const sourceSubject = Object.freeze({ id: 'subject', count: 1 });
  const sourceFixedSet = Object.freeze({ id: 'fixed-set' });
  const sourceContext = Object.freeze({
    subject: sourceSubject,
    fixedCompositionSet: sourceFixedSet,
    framing: Object.freeze({ zh: '胸上特寫' }),
  });
  const derivedContext = createFixedFramingDerivedContext(sourceContext, preset);

  assert.ok(Object.isFrozen(FIXED_FRAMING_DERIVED_PROMPT_PRESETS));
  assert.ok(Object.isFrozen(preset));
  assert.ok(Object.isFrozen(preset.framing));
  assert.deepEqual(JSON.parse(JSON.stringify(preset)), preset);
  assert.notEqual(derivedContext, sourceContext);
  assert.equal(derivedContext.subject, sourceSubject);
  assert.equal(derivedContext.framing, preset.framing);
  assert.equal(derivedContext.fixedCompositionSet, null);
  assert.equal(derivedContext.compositionVisibility.bucket, COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY);
  assert.equal(sourceContext.fixedCompositionSet, sourceFixedSet);
  assert.equal(sourceContext.framing.zh, '胸上特寫');

  const compatibility = FIXED_FRAMING_DERIVED_PROMPT_CONTRACT.outputs.fullBodyCharacterCompatibility;
  assert.equal(preset.id, compatibility.id);
  assert.equal(preset.uiLabel, compatibility.uiLabel);
  assert.equal(preset.aspectRatio, compatibility.aspectRatio);
  assert.equal(preset.lockAspectRatio, compatibility.lockAspectRatio);
});

test('phase-2 full-body migration preserves exact output bytes for representative resolved sources', () => {
  for (const promptCase of FULL_BODY_CHARACTER_BASELINES) {
    const locks = materializeLocks(promptCase);
    const [prompt] = generatePrompts(1, locks, [], {
      random: createSeededRandom(promptCase.seed),
    });
    const fullBodyPrompt = prompt.extraPrompts.find((entry) => entry.id === 'full-body-character');

    assert.ok(fullBodyPrompt, `${promptCase.id}: full-body output`);
    assert.equal(fullBodyPrompt.label, '全身角色照', `${promptCase.id}: label`);
    assert.equal(fullBodyPrompt.text.length, promptCase.length, `${promptCase.id}: exact length`);
    assert.equal(sha256(fullBodyPrompt.text), promptCase.sha256, `${promptCase.id}: exact bytes`);
    assert.deepEqual(prompt.extraPrompts.map((entry) => entry.id), [
      'chest-up-portrait',
      'chest-up-mj-portrait',
      'full-body-character',
    ]);
    for (const key of Object.keys(promptCase.locks)) {
      assert.equal(prompt.selection[key], locks[key], `${promptCase.id}: preserve ${key}`);
    }
  }
});

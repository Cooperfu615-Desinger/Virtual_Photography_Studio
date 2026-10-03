import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createEmptyLocks,
  createSeededRandom,
  generatePrompts,
  getLockControls,
} from '../engine.js';
import { CHARACTER_PROFILE_OPTIONS } from './characterProfiles.js';
import { BODY_TYPE_VISIBILITY_PROFILES } from './compositionBodyVisibilityFixtures.js';

const MAIN_OUTPUT_FIELDS = ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt'];
const controls = getLockControls();
const controlsByKey = new Map(controls.map((control) => [control.key, control]));
const bodyTypeControl = controlsByKey.get('bodyTypeId');
const framingControl = controlsByKey.get('framingId');

const FRAMING_ZH_BY_BUCKET = Object.freeze({
  faceDetail: '臉部特寫',
  headShoulders: '特寫鏡頭 (Close-Up)',
  chestUp: '胸上特寫',
  mediumWaist: '中景鏡頭 (Medium Shot)',
  cowboyKnee: '牛仔中景 (Cowboy Shot)',
  fullBody: '全身鏡頭 (Full Body Shot)',
});



function optionId(control, zh) {
  const option = control?.options.find((entry) => entry.zh === zh);
  assert.ok(option, `Missing option ${zh}`);
  return option.id;
}

function createAllNoneLocks() {
  const locks = createEmptyLocks();
  for (const control of controls) {
    // Keep the original fixture inputs; new silence options are covered separately.
    if (/^(bodyType|hairStylingState)[AB]?Id$|^outerwear[AB]?OpeningId$|^eyewear[AB]?PlacementId$|^sceneAttributeId$/.test(control.key)) continue;
    const none = control.options.find((option) => option.zh === '全無' || option.zh === '無額外表情');
    if (none) locks[control.key] = none.id;
  }
  return locks;
}

function assertIncludes(text, fragment, message) {
  assert.equal(text.toLowerCase().includes(fragment.toLowerCase()), true, message);
}

function assertExcludes(text, fragment, message) {
  assert.equal(text.toLowerCase().includes(fragment.toLowerCase()), false, message);
}

function bodyFragments(value) {
  return value.split(/,\s*/).map((fragment) => fragment.trim()).filter(Boolean);
}

test('normal single Body Types use one composition-projected source across all main outputs', () => {
  for (const profile of BODY_TYPE_VISIBILITY_PROFILES) {
    const bodyTypeId = optionId(bodyTypeControl, profile.bodyTypeZh);

    for (const [bucket, framingZh] of Object.entries(FRAMING_ZH_BY_BUCKET)) {
      const locks = {
        ...createAllNoneLocks(),
        subjectCount: '1',
        framingId: optionId(framingControl, framingZh),
        bodyTypeId,
      };
      const [prompt] = generatePrompts(1, locks, [], {
        random: createSeededRandom(`body-visibility-${profile.bodyTypeZh}-${bucket}-v1`),
      });
      const expectedBodyText = profile.expectedTextByBucket[bucket];

      assert.equal(prompt.selection.bodyTypeId, bodyTypeId, `${profile.bodyTypeZh}/${bucket}: selection`);

      for (const field of MAIN_OUTPUT_FIELDS) {
        assert.ok(prompt[field].includes(expectedBodyText), `${profile.bodyTypeZh}/${bucket}/${field}: verbatim source`);
      }

      const fullBodyText = prompt.extraPrompts.find((entry) => entry.id === 'full-body-character')?.text || '';
      assertIncludes(fullBodyText, profile.fullSource, `${profile.bodyTypeZh}/${bucket}: full-body restoration`);
    }
  }
});

test('duo role Body Types reuse the shared projected body source without changing selections', () => {
  const bodyTypeAId = optionId(controlsByKey.get('bodyTypeAId'), '高挑時裝模特');
  const bodyTypeBId = optionId(controlsByKey.get('bodyTypeBId'), '柔和沙漏身形');
  const [prompt] = generatePrompts(1, {
    ...createAllNoneLocks(),
    subjectCount: '2',
    framingId: optionId(framingControl, '中景鏡頭 (Medium Shot)'),
    bodyTypeAId,
    bodyTypeBId,
  }, [], {
    random: createSeededRandom('composition-body-duo-runtime-v1'),
  });

  assert.equal(prompt.selection.bodyTypeAId, bodyTypeAId);
  assert.equal(prompt.selection.bodyTypeBId, bodyTypeBId);
  for (const field of MAIN_OUTPUT_FIELDS) {
    assert.ok(prompt[field].includes(BODY_TYPE_VISIBILITY_PROFILES.find(p => p.bodyTypeZh === '高挑時裝模特').fullSource));
    assert.ok(prompt[field].includes(BODY_TYPE_VISIBILITY_PROFILES.find(p => p.bodyTypeZh === '柔和沙漏身形').fullSource));
  }
});

test('Character Card body projection removes only body text and full-body output restores its source', () => {
  const characterProfileControl = controlsByKey.get('characterProfileId');
  const characterProfileId = optionId(characterProfileControl, '11_Rika');
  const [prompt] = generatePrompts(1, {
    ...createAllNoneLocks(),
    subjectCount: '1',
    characterProfileId,
    framingId: optionId(framingControl, '臉部特寫'),
  }, [], {
    random: createSeededRandom('composition-body-character-card-runtime-v1'),
  });

  assert.equal(prompt.selection.characterProfileId, characterProfileId);
  for (const field of MAIN_OUTPUT_FIELDS) {
    assertExcludes(prompt[field], 'slim petite casual-fashion proportions with a narrow waist', `${field}: card body`);
    assertIncludes(prompt[field], 'tiny beauty mark near the outer cheek', `${field}: permanent identity anchor`);
    assertIncludes(prompt[field], 'cushioned', `${field}: mouth identity`);
    assertIncludes(prompt[field], 'glossy natural black long wavy hair', `${field}: hair`);
  }

  const fullBodyText = prompt.extraPrompts.find((entry) => entry.id === 'full-body-character')?.text || '';
  assertIncludes(fullBodyText, 'slim petite casual-fashion proportions with a narrow waist', 'full-body card source');
});

test('face crop removes the structured body source from every formal Character Card', () => {
  const cards = CHARACTER_PROFILE_OPTIONS.filter((option) => option.specialSubject === 'character-profile');

  for (const card of cards) {
    const [prompt] = generatePrompts(1, {
      ...createAllNoneLocks(),
      subjectCount: '1',
      characterProfileId: card.id,
      framingId: optionId(framingControl, '臉部特寫'),
    }, [], {
      random: createSeededRandom(`composition-body-card-face-${card.id}-v1`),
    });

    assert.equal(prompt.selection.characterProfileId, card.id, `${card.id}: selection`);
    for (const field of MAIN_OUTPUT_FIELDS) {
      assertExcludes(prompt[field], card.profile.body, `${card.id}/${field}: body`);
    }
    const fullBodyText = prompt.extraPrompts.find((entry) => entry.id === 'full-body-character')?.text || '';
    assertIncludes(fullBodyText, card.profile.body, `${card.id}: full-body restoration`);
  }
});

test('Character Card partial crops use authored chest, waist, and hip sources', () => {
  const expectedByFraming = {
    '胸上特寫': 'fuller bust',
    '中景鏡頭 (Medium Shot)': 'fuller bust, narrow waist',
    '牛仔中景 (Cowboy Shot)': 'high-fashion hourglass proportions, fuller bust, wide hips, narrow waist',
  };

  for (const [framingZh, expectedBodyText] of Object.entries(expectedByFraming)) {
    const [prompt] = generatePrompts(1, {
      ...createAllNoneLocks(),
      subjectCount: '1',
      characterProfileId: optionId(controlsByKey.get('characterProfileId'), '06_Hinata'),
      framingId: optionId(framingControl, framingZh),
    }, [], {
      random: createSeededRandom(`composition-body-character-card-${framingZh}-v1`),
    });

    for (const field of MAIN_OUTPUT_FIELDS) {
      for (const fragment of bodyFragments(expectedBodyText)) {
        assertIncludes(prompt[field], fragment, `${framingZh}/${field}: ${fragment}`);
      }
      assertExcludes(prompt[field], 'tall high-fashion hourglass proportions with long limbs', `${framingZh}/${field}: tall/limbs`);
    }
  }
});

test('special-outfit hair and tattoo details remain while its normal Body Type is projected', () => {
  const bodyTypeId = optionId(bodyTypeControl, '運動緊實身形');
  const specialOutfitId = optionId(controlsByKey.get('specialOutfitId'), '米色細肩背心蕾絲胸衣工裝寬褲造型');
  const [prompt] = generatePrompts(1, {
    ...createAllNoneLocks(),
    subjectCount: '1',
    framingId: optionId(framingControl, '胸上特寫'),
    bodyTypeId,
    specialOutfitId,
  }, [], {
    random: createSeededRandom('composition-body-special-outfit-runtime-v1'),
  });

  assert.equal(prompt.selection.bodyTypeId, bodyTypeId);
  assert.equal(prompt.selection.specialOutfitId, specialOutfitId);
  for (const field of MAIN_OUTPUT_FIELDS) {
    assertIncludes(prompt[field], bodyTypeControl.options.find(o => o.id === bodyTypeId).en, `${field}: verbatim body`);
    assertIncludes(prompt[field], 'long voluminous side-part black waves', `${field}: outfit hair`);
    assertIncludes(prompt[field], 'small cherry tattoo on the right chest', `${field}: outfit tattoo`);
    assertIncludes(prompt[field], 'cream cropped spaghetti-strap camisole', `${field}: visible outfit`);
    assertExcludes(prompt[field], 'energetic balanced proportions', `${field}: hidden full body`);
  }
});

test('face crop keeps special-outfit hair, removes body-position tattoos, and restores them for full-body output', () => {
  const bodyTypeId = optionId(bodyTypeControl, '運動緊實身形');
  const specialOutfitId = optionId(controlsByKey.get('specialOutfitId'), '米色細肩背心蕾絲胸衣工裝寬褲造型');
  const [prompt] = generatePrompts(1, {
    ...createAllNoneLocks(),
    subjectCount: '1',
    framingId: optionId(framingControl, '臉部特寫'),
    bodyTypeId,
    specialOutfitId,
  }, [], {
    random: createSeededRandom('composition-body-special-outfit-face-runtime-v1'),
  });

  for (const field of MAIN_OUTPUT_FIELDS) {
    assertIncludes(prompt[field], 'long voluminous side-part black waves', `${field}: outfit hair`);
    assertExcludes(prompt[field], 'small cherry tattoo on the right chest', `${field}: chest tattoo`);
    assertIncludes(prompt[field], bodyTypeControl.options.find(o => o.id === bodyTypeId).en, `${field}: full body source`);
  }

  const fullBodyText = prompt.extraPrompts.find((entry) => entry.id === 'full-body-character')?.text || '';
  assertIncludes(fullBodyText, 'small cherry tattoo on the right chest', 'full-body tattoo restoration');
  assertIncludes(fullBodyText, bodyTypeControl.options.find(o => o.id === bodyTypeId).en, 'full-body Body Type restoration');
});

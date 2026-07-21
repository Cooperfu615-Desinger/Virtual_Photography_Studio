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

const AI_FULL_BODY_ANCHOR_BY_ZH = Object.freeze({
  高挑時裝模特: 'tall slim fashion body',
  一般基本體型: 'natural basic body',
  柔和沙漏身形: 'soft natural hourglass body',
  性感曲線身形: 'sexy tall slim-curvy silhouette',
  運動緊實身形: 'fit toned athletic body',
  小隻精緻身形: 'petite polished body',
});

const Z_FULL_BODY_ANCHOR_BY_ZH = Object.freeze({
  ...AI_FULL_BODY_ANCHOR_BY_ZH,
  運動緊實身形: 'fit toned athletic female body',
  小隻精緻身形: 'petite polished female body',
});

function optionId(control, zh) {
  const option = control?.options.find((entry) => entry.zh === zh);
  assert.ok(option, `Missing option ${zh}`);
  return option.id;
}

function createAllNoneLocks() {
  const locks = createEmptyLocks();
  for (const control of controls) {
    const none = control.options.find((option) => option.zh === '全無');
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

      if (!expectedBodyText) {
        for (const field of MAIN_OUTPUT_FIELDS) {
          for (const fragment of bodyFragments(profile.fullSource)) {
            assertExcludes(prompt[field], fragment, `${profile.bodyTypeZh}/${bucket}/${field}: ${fragment}`);
          }
        }
      } else if (bucket === 'fullBody') {
        assertIncludes(prompt.grokPrompt, profile.fullSource, `${profile.bodyTypeZh}/${bucket}: Gpt full source`);
        assertIncludes(
          prompt.zImagePrompt,
          Z_FULL_BODY_ANCHOR_BY_ZH[profile.bodyTypeZh],
          `${profile.bodyTypeZh}/${bucket}: Grok/Z full anchor`
        );
        assertIncludes(
          prompt.midjourneyPrompt,
          AI_FULL_BODY_ANCHOR_BY_ZH[profile.bodyTypeZh],
          `${profile.bodyTypeZh}/${bucket}: AI full anchor`
        );
      } else {
        assertIncludes(prompt.grokPrompt, expectedBodyText, `${profile.bodyTypeZh}/${bucket}: Gpt projected source`);
        assertIncludes(
          prompt.zImagePrompt,
          bodyFragments(expectedBodyText)[0],
          `${profile.bodyTypeZh}/${bucket}: Grok/Z traceable projected anchor`
        );
        for (const fragment of bodyFragments(expectedBodyText).slice(0, 4)) {
          assertIncludes(prompt.midjourneyPrompt, fragment, `${profile.bodyTypeZh}/${bucket}: AI projected ${fragment}`);
        }
      }

      const fullBodyText = prompt.extraPrompts.find((entry) => entry.id === 'full-body-character')?.text || '';
      assertIncludes(fullBodyText, profile.fullSource, `${profile.bodyTypeZh}/${bucket}: full-body restoration`);
    }
  }
});

test('normal single partial Body Type output excludes hidden full-body regions', () => {
  const forbiddenByBucket = {
    chestUp: /\b(?:visual height|visual weight|body proportion anchor|torso-to-leg|waist|abdomen|hips?|legs?|cup-scale)\b/i,
    mediumWaist: /\b(?:visual height|visual weight|body proportion anchor|torso-to-leg|hips?|legs?|cup-scale)\b/i,
    cowboyKnee: /\b(?:visual height|visual weight|torso-to-leg|long legs?|long limbs?|cup-scale)\b/i,
  };

  for (const profile of BODY_TYPE_VISIBILITY_PROFILES) {
    for (const [bucket, forbiddenPattern] of Object.entries(forbiddenByBucket)) {
      const [prompt] = generatePrompts(1, {
        ...createAllNoneLocks(),
        subjectCount: '1',
        framingId: optionId(framingControl, FRAMING_ZH_BY_BUCKET[bucket]),
        bodyTypeId: optionId(bodyTypeControl, profile.bodyTypeZh),
      }, [], {
        random: createSeededRandom(`body-visibility-boundary-${profile.bodyTypeZh}-${bucket}-v1`),
      });

      for (const field of MAIN_OUTPUT_FIELDS) {
        assert.doesNotMatch(prompt[field], forbiddenPattern, `${profile.bodyTypeZh}/${bucket}/${field}`);
      }
    }
  }
});

test('duo role Body Types reuse the shared projected body source without changing selections', () => {
  const bodyTypeAId = optionId(controlsByKey.get('bodyTypeAId'), '高挑時裝模特');
  const bodyTypeBId = optionId(controlsByKey.get('bodyTypeBId'), '一般基本體型');
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
    assertIncludes(prompt[field], 'shorter upper torso', `${field}: woman 1 projected body`);
    assertIncludes(prompt[field], 'modest bust', `${field}: woman 2 projected body`);
    assertExcludes(prompt[field], 'about 170-175 cm visual height', `${field}: woman 1 height`);
    assertExcludes(prompt[field], 'long legs with about 3.5:6.5 torso-to-leg balance', `${field}: woman 1 legs`);
    assertExcludes(prompt[field], 'about 160-165 cm visual height', `${field}: woman 2 height`);
    assertExcludes(prompt[field], 'balanced torso-to-leg ratio around 4:6', `${field}: woman 2 legs`);
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
    assertIncludes(prompt[field], 'fit toned athletic upper body', `${field}: projected body`);
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
    assertExcludes(prompt[field], 'fit toned athletic female body', `${field}: full body source`);
  }

  const fullBodyText = prompt.extraPrompts.find((entry) => entry.id === 'full-body-character')?.text || '';
  assertIncludes(fullBodyText, 'small cherry tattoo on the right chest', 'full-body tattoo restoration');
  assertIncludes(fullBodyText, 'fit toned athletic female body', 'full-body Body Type restoration');
});

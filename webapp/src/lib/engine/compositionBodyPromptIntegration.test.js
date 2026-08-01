import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createEmptyLocks,
  createSeededRandom,
  generatePrompts,
  getLockControls,
} from '../engine.js';
import { CHARACTER_PROFILE_OPTIONS } from './characterProfiles.js';
import {
  BODY_TYPE_VISIBILITY_PROFILES,
  BODY_VISIBILITY_PHASE4_INTEGRATION_MATRIX,
} from './compositionBodyVisibilityFixtures.js';
import { validatePromptOutputContract } from './promptOutputContracts.js';

const MAIN_OUTPUT_FIELDS = ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt'];
const controls = getLockControls();
const controlsByKey = new Map(controls.map((control) => [control.key, control]));

const FULL_BODY_ANCHOR_BY_ZH = Object.freeze({
  高挑時裝模特: 'tall slim fashion body',
  一般基本體型: 'natural basic body',
  柔和沙漏身形: 'soft natural hourglass body',
  性感曲線身形: 'sexy tall slim-curvy silhouette',
  運動緊實身形: 'fit toned athletic',
  小隻精緻身形: 'petite polished',
});

const AI_BODY_TYPE_ANCHOR_BY_ZH = Object.freeze({
  高挑時裝模特: 'Tall fashion-model silhouette, long legs, high waistline',
  一般基本體型: 'Natural balanced silhouette, gentle waist curve, natural bust and hips',
  柔和沙漏身形: 'Soft hourglass silhouette, fuller bust, wider hips',
  性感曲線身形: 'Curvy hourglass silhouette, fuller bust, defined waist, rounded hips',
  運動緊實身形: 'Fit athletic silhouette, firm build, subtle muscle definition',
  小隻精緻身形: 'Petite refined silhouette, compact frame, delicate proportions',
});

const AI_BODY_MEASUREMENT_FRAGMENT = /visual height|visual weight|body proportion anchor|torso-to-leg|cup-scale|\b\d{2,3}-\d{2,3}-\d{2,3}\b/i;

function optionId(key, zh) {
  const option = controlsByKey.get(key)?.options.find((entry) => entry.zh === zh);
  assert.ok(option, `Missing ${key} option ${zh}`);
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

function bodyFragments(value) {
  return String(value || '').split(/,\s*/).map((fragment) => fragment.trim()).filter(Boolean);
}

function assertIncludes(text, fragment, message) {
  assert.equal(text.toLowerCase().includes(fragment.toLowerCase()), true, message);
}

function assertExcludes(text, fragment, message) {
  assert.equal(text.toLowerCase().includes(fragment.toLowerCase()), false, message);
}

function fullBodyCharacterText(prompt) {
  return prompt.extraPrompts.find((entry) => entry.id === 'full-body-character')?.text || '';
}

function assertOutputContracts(prompt, mode) {
  for (const field of MAIN_OUTPUT_FIELDS) {
    assert.deepEqual(validatePromptOutputContract(field, prompt[field], { mode }), [], `${field}/${mode}`);
  }
  if (mode === 'single') {
    assert.deepEqual(
      validatePromptOutputContract('fullBodyCharacterPrompt', fullBodyCharacterText(prompt), { mode }),
      [],
      'fullBodyCharacterPrompt/single'
    );
  }
}

test('phase-4 gate covers every public framing alias for every normal Body Type', () => {
  for (const profile of BODY_TYPE_VISIBILITY_PROFILES) {
    const bodyTypeId = optionId('bodyTypeId', profile.bodyTypeZh);

    for (const { framingZh, bucket } of BODY_VISIBILITY_PHASE4_INTEGRATION_MATRIX.publicFramings) {
      const [prompt] = generatePrompts(1, {
        ...createAllNoneLocks(),
        subjectCount: '1',
        framingId: optionId('framingId', framingZh),
        bodyTypeId,
      }, [], {
        random: createSeededRandom(`body-phase4-normal-${profile.bodyTypeZh}-${bucket}-${framingZh}`),
      });
      const expectedBodyText = profile.expectedTextByBucket[bucket];

      assert.equal(prompt.selection.bodyTypeId, bodyTypeId, `${profile.bodyTypeZh}/${framingZh}: selection`);
      if (!expectedBodyText) {
        for (const field of MAIN_OUTPUT_FIELDS) {
          for (const fragment of bodyFragments(profile.fullSource)) {
            assertExcludes(prompt[field], fragment, `${profile.bodyTypeZh}/${framingZh}/${field}: ${fragment}`);
          }
        }
      } else if (['fullBody', 'unconstrained'].includes(bucket)) {
        assertIncludes(prompt.grokPrompt, profile.fullSource, `${profile.bodyTypeZh}/${framingZh}: Gpt full source`);
        assertIncludes(prompt.zImagePrompt, FULL_BODY_ANCHOR_BY_ZH[profile.bodyTypeZh], `${profile.bodyTypeZh}/${framingZh}/zImagePrompt: full anchor`);
        assertIncludes(prompt.midjourneyPrompt, AI_BODY_TYPE_ANCHOR_BY_ZH[profile.bodyTypeZh], `${profile.bodyTypeZh}/${framingZh}/midjourneyPrompt: positive anchor`);
      } else {
        assertIncludes(prompt.grokPrompt, expectedBodyText, `${profile.bodyTypeZh}/${framingZh}: Gpt projection`);
        assertIncludes(prompt.zImagePrompt, bodyFragments(expectedBodyText)[0], `${profile.bodyTypeZh}/${framingZh}/zImagePrompt: projected anchor`);
        for (const fragment of bodyFragments(expectedBodyText).filter((part) => !AI_BODY_MEASUREMENT_FRAGMENT.test(part)).slice(0, 4)) {
          assertIncludes(prompt.midjourneyPrompt, fragment, `${profile.bodyTypeZh}/${framingZh}/midjourneyPrompt: positive projected anchor ${fragment}`);
        }
      }

      assertIncludes(
        fullBodyCharacterText(prompt),
        profile.fullSource,
        `${profile.bodyTypeZh}/${framingZh}: full-body restoration`
      );
      assertOutputContracts(prompt, 'single');
    }
  }
});

test('phase-4 gate keeps fixed composition full-source and projects duo A/B across public framings', () => {
  const fixedSetId = optionId(
    'fixedCompositionSetId',
    BODY_VISIBILITY_PHASE4_INTEGRATION_MATRIX.fixedComposition.fixedSetZh
  );

  for (const profile of BODY_TYPE_VISIBILITY_PROFILES) {
    const bodyTypeId = optionId('bodyTypeId', profile.bodyTypeZh);
    const [prompt] = generatePrompts(1, {
      ...createAllNoneLocks(),
      subjectCount: '1',
      fixedCompositionSetId: fixedSetId,
      bodyTypeId,
    }, [], {
      random: createSeededRandom(`body-phase4-fixed-${profile.bodyTypeZh}`),
    });

    assert.equal(prompt.selection.fixedCompositionSetId, fixedSetId, `${profile.bodyTypeZh}: fixed set`);
    assert.equal(prompt.selection.bodyTypeId, bodyTypeId, `${profile.bodyTypeZh}: fixed body selection`);
    assertIncludes(prompt.grokPrompt, profile.fullSource, `${profile.bodyTypeZh}: fixed Gpt full source`);
    assertIncludes(prompt.zImagePrompt, FULL_BODY_ANCHOR_BY_ZH[profile.bodyTypeZh], `${profile.bodyTypeZh}/zImagePrompt`);
    assertIncludes(prompt.midjourneyPrompt, AI_BODY_TYPE_ANCHOR_BY_ZH[profile.bodyTypeZh], `${profile.bodyTypeZh}/midjourneyPrompt`);
    assertIncludes(fullBodyCharacterText(prompt), profile.fullSource, `${profile.bodyTypeZh}: fixed restoration`);
    assertOutputContracts(prompt, 'single');
  }

  const profileA = BODY_TYPE_VISIBILITY_PROFILES.find((profile) => (
    profile.bodyTypeZh === BODY_VISIBILITY_PHASE4_INTEGRATION_MATRIX.duoProfiles.a
  ));
  const profileB = BODY_TYPE_VISIBILITY_PROFILES.find((profile) => (
    profile.bodyTypeZh === BODY_VISIBILITY_PHASE4_INTEGRATION_MATRIX.duoProfiles.b
  ));
  const bodyTypeAId = optionId('bodyTypeAId', profileA.bodyTypeZh);
  const bodyTypeBId = optionId('bodyTypeBId', profileB.bodyTypeZh);

  for (const { framingZh, bucket } of BODY_VISIBILITY_PHASE4_INTEGRATION_MATRIX.publicFramings) {
    const [prompt] = generatePrompts(1, {
      ...createAllNoneLocks(),
      subjectCount: '2',
      framingId: optionId('framingId', framingZh),
      bodyTypeAId,
      bodyTypeBId,
      duoPoseId: optionId('duoPoseId', '時尚雜誌雙人模特兒'),
      duoPoseBaseId: optionId('duoPoseBaseId', '站姿'),
    }, [], {
      random: createSeededRandom(`body-phase4-duo-${bucket}-${framingZh}`),
    });

    assert.equal(prompt.selection.bodyTypeAId, bodyTypeAId, `${framingZh}: woman 1 selection`);
    assert.equal(prompt.selection.bodyTypeBId, bodyTypeBId, `${framingZh}: woman 2 selection`);
    for (const [role, profile] of [['a', profileA], ['b', profileB]]) {
      const expectedBodyText = profile.expectedTextByBucket[bucket];
      for (const field of MAIN_OUTPUT_FIELDS) {
        if (!expectedBodyText) {
          for (const fragment of bodyFragments(profile.fullSource)) {
            assertExcludes(prompt[field], fragment, `${framingZh}/${field}/${role}: ${fragment}`);
          }
        } else if (field === 'midjourneyPrompt' && ['fullBody', 'unconstrained'].includes(bucket)) {
          assertIncludes(prompt[field], AI_BODY_TYPE_ANCHOR_BY_ZH[profile.bodyTypeZh], `${framingZh}/${field}/${role}: positive full anchor`);
        } else if (field === 'midjourneyPrompt') {
          for (const fragment of bodyFragments(expectedBodyText).filter((part) => !AI_BODY_MEASUREMENT_FRAGMENT.test(part)).slice(0, 4)) {
            assertIncludes(prompt[field], fragment, `${framingZh}/${field}/${role}: positive projected anchor ${fragment}`);
          }
        } else {
          assertIncludes(prompt[field], bodyFragments(expectedBodyText)[0], `${framingZh}/${field}/${role}: projected source`);
        }
      }
    }
    assert.equal(fullBodyCharacterText(prompt), '', `${framingZh}: duo full-body output`);
    for (const field of MAIN_OUTPUT_FIELDS) {
      assert.ok(prompt[field].trim(), `${framingZh}/${field}: output`);
    }
    assert.equal(prompt.grokPrompt.trimEnd().endsWith('multi-cut sequence n=2'), true, `${framingZh}: Gpt tail`);
  }
});

test('phase-4 gate covers every formal Character Card without removing permanent identity', () => {
  const characterCards = CHARACTER_PROFILE_OPTIONS.filter((option) => option.specialSubject === 'character-profile');

  for (const card of characterCards) {
    for (const { framingZh, bucket } of BODY_VISIBILITY_PHASE4_INTEGRATION_MATRIX.publicFramings) {
      const [prompt] = generatePrompts(1, {
        ...createAllNoneLocks(),
        subjectCount: '1',
        characterProfileId: card.id,
        framingId: optionId('framingId', framingZh),
      }, [], {
        random: createSeededRandom(`body-phase4-card-${card.id}-${bucket}-${framingZh}`),
      });
      const expectedBodyText = ['fullBody', 'unconstrained'].includes(bucket)
        ? card.profile.body
        : card.profile.bodyProjection?.[bucket] || '';
      const expectedBodyAnchor = ['fullBody', 'unconstrained'].includes(bucket)
        ? card.profile.body.split(/\s+/).slice(0, 2).join(' ')
        : bodyFragments(expectedBodyText)[0];

      assert.equal(prompt.selection.characterProfileId, card.id, `${card.id}/${framingZh}: selection`);
      for (const field of MAIN_OUTPUT_FIELDS) {
        if (expectedBodyText) {
          assertIncludes(
            prompt[field],
            expectedBodyAnchor,
            `${card.id}/${framingZh}/${field}: projected body`
          );
        } else {
          assertExcludes(prompt[field], card.profile.body, `${card.id}/${framingZh}/${field}: body omitted`);
        }
        for (const anchor of bodyFragments(card.profile.distinctiveFeatures)) {
          assertIncludes(prompt[field], anchor, `${card.id}/${framingZh}/${field}: ${anchor}`);
        }
      }
      assertIncludes(fullBodyCharacterText(prompt), card.profile.body, `${card.id}/${framingZh}: body restoration`);
      assertOutputContracts(prompt, 'single');
    }
  }
});

test('phase-4 gate projects every tattoo-bearing special-outfit person detail', () => {
  const tattooPattern = new RegExp(BODY_VISIBILITY_PHASE4_INTEGRATION_MATRIX.specialOutfitPersonDetailPattern, 'i');
  const tattooOutfits = controlsByKey.get('specialOutfitId').options.filter((option) => tattooPattern.test(option.en || ''));

  assert.ok(tattooOutfits.length > 0);
  for (const outfit of tattooOutfits) {
    for (const { framingZh, bucket } of BODY_VISIBILITY_PHASE4_INTEGRATION_MATRIX.publicFramings) {
      const [prompt] = generatePrompts(1, {
        ...createAllNoneLocks(),
        subjectCount: '1',
        framingId: optionId('framingId', framingZh),
        specialOutfitId: outfit.id,
      }, [], {
        random: createSeededRandom(`body-phase4-special-${outfit.id}-${bucket}-${framingZh}`),
      });
      const shouldIncludeTattoo = !['faceDetail', 'headShoulders'].includes(bucket);

      assert.equal(prompt.selection.specialOutfitId, outfit.id, `${outfit.zh}/${framingZh}: selection`);
      for (const field of MAIN_OUTPUT_FIELDS) {
        if (shouldIncludeTattoo) {
          assert.match(prompt[field], tattooPattern, `${outfit.zh}/${framingZh}/${field}: tattoo`);
        } else {
          assert.doesNotMatch(prompt[field], tattooPattern, `${outfit.zh}/${framingZh}/${field}: tattoo omitted`);
        }
      }
      assert.match(fullBodyCharacterText(prompt), tattooPattern, `${outfit.zh}/${framingZh}: tattoo restoration`);
      assertOutputContracts(prompt, 'single');
    }
  }
});

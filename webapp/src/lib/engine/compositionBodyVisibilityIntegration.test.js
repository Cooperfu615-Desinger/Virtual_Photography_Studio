import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createEmptyLocks,
  createSeededRandom,
  generatePrompts,
  getLockControls,
} from '../engine.js';
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

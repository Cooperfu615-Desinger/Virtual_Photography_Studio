import { COMPOSITION_VISIBILITY_BUCKETS } from './compositionVisibilityContract.js';
import {
  createPoseComposerProjectionMap,
  POSE_COMPOSER_PROJECTION_MODES,
} from './poseComposerProjection.js';

const STANDING_UPPER_PROJECTION = createPoseComposerProjectionMap({
  visible: [
    COMPOSITION_VISIBILITY_BUCKETS.UNCONSTRAINED,
    COMPOSITION_VISIBILITY_BUCKETS.FIXED_COMPOSITION,
    COMPOSITION_VISIBILITY_BUCKETS.COWBOY_KNEE,
    COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY,
  ],
  projected: [
    COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP,
    COMPOSITION_VISIBILITY_BUCKETS.MEDIUM_WAIST,
  ],
  omit: [
    COMPOSITION_VISIBILITY_BUCKETS.FACE_DETAIL,
    COMPOSITION_VISIBILITY_BUCKETS.HEAD_SHOULDERS,
  ],
});

const STANDING_LOWER_PROJECTION = createPoseComposerProjectionMap({
  visible: [
    COMPOSITION_VISIBILITY_BUCKETS.UNCONSTRAINED,
    COMPOSITION_VISIBILITY_BUCKETS.FIXED_COMPOSITION,
    COMPOSITION_VISIBILITY_BUCKETS.COWBOY_KNEE,
    COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY,
  ],
  omit: [
    COMPOSITION_VISIBILITY_BUCKETS.FACE_DETAIL,
    COMPOSITION_VISIBILITY_BUCKETS.HEAD_SHOULDERS,
    COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP,
    COMPOSITION_VISIBILITY_BUCKETS.MEDIUM_WAIST,
  ],
});

const STANDING_LOWER_FULL_ONLY_PROJECTION = createPoseComposerProjectionMap({
  visible: [
    COMPOSITION_VISIBILITY_BUCKETS.UNCONSTRAINED,
    COMPOSITION_VISIBILITY_BUCKETS.FIXED_COMPOSITION,
    COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY,
  ],
  omit: [
    COMPOSITION_VISIBILITY_BUCKETS.FACE_DETAIL,
    COMPOSITION_VISIBILITY_BUCKETS.HEAD_SHOULDERS,
    COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP,
    COMPOSITION_VISIBILITY_BUCKETS.MEDIUM_WAIST,
    COMPOSITION_VISIBILITY_BUCKETS.COWBOY_KNEE,
  ],
});

const STANDING_SUPPORT_PROJECTION = createPoseComposerProjectionMap({
  visible: [
    COMPOSITION_VISIBILITY_BUCKETS.UNCONSTRAINED,
    COMPOSITION_VISIBILITY_BUCKETS.FIXED_COMPOSITION,
    COMPOSITION_VISIBILITY_BUCKETS.COWBOY_KNEE,
    COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY,
  ],
  projected: [
    COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP,
    COMPOSITION_VISIBILITY_BUCKETS.MEDIUM_WAIST,
  ],
  omit: [
    COMPOSITION_VISIBILITY_BUCKETS.FACE_DETAIL,
    COMPOSITION_VISIBILITY_BUCKETS.HEAD_SHOULDERS,
  ],
});

const STANDING_LOWER_SUPPORT_PROJECTION = createPoseComposerProjectionMap({
  visible: [
    COMPOSITION_VISIBILITY_BUCKETS.UNCONSTRAINED,
    COMPOSITION_VISIBILITY_BUCKETS.FIXED_COMPOSITION,
    COMPOSITION_VISIBILITY_BUCKETS.COWBOY_KNEE,
    COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY,
  ],
  omit: [
    COMPOSITION_VISIBILITY_BUCKETS.FACE_DETAIL,
    COMPOSITION_VISIBILITY_BUCKETS.HEAD_SHOULDERS,
    COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP,
    COMPOSITION_VISIBILITY_BUCKETS.MEDIUM_WAIST,
  ],
});

const STANDING_FULL_ONLY_SUPPORT_PROJECTION = createPoseComposerProjectionMap({
  visible: [
    COMPOSITION_VISIBILITY_BUCKETS.UNCONSTRAINED,
    COMPOSITION_VISIBILITY_BUCKETS.FIXED_COMPOSITION,
    COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY,
  ],
  omit: [
    COMPOSITION_VISIBILITY_BUCKETS.FACE_DETAIL,
    COMPOSITION_VISIBILITY_BUCKETS.HEAD_SHOULDERS,
    COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP,
    COMPOSITION_VISIBILITY_BUCKETS.MEDIUM_WAIST,
    COMPOSITION_VISIBILITY_BUCKETS.COWBOY_KNEE,
  ],
});

const SITTING_UPPER_PROJECTION = createPoseComposerProjectionMap({
  visible: [
    COMPOSITION_VISIBILITY_BUCKETS.UNCONSTRAINED,
    COMPOSITION_VISIBILITY_BUCKETS.FIXED_COMPOSITION,
    COMPOSITION_VISIBILITY_BUCKETS.COWBOY_KNEE,
    COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY,
  ],
  projected: [
    COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP,
    COMPOSITION_VISIBILITY_BUCKETS.MEDIUM_WAIST,
  ],
  omit: [
    COMPOSITION_VISIBILITY_BUCKETS.FACE_DETAIL,
    COMPOSITION_VISIBILITY_BUCKETS.HEAD_SHOULDERS,
  ],
});

const SITTING_LOWER_PROJECTION = createPoseComposerProjectionMap({
  visible: [
    COMPOSITION_VISIBILITY_BUCKETS.UNCONSTRAINED,
    COMPOSITION_VISIBILITY_BUCKETS.FIXED_COMPOSITION,
    COMPOSITION_VISIBILITY_BUCKETS.COWBOY_KNEE,
    COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY,
  ],
  omit: [
    COMPOSITION_VISIBILITY_BUCKETS.FACE_DETAIL,
    COMPOSITION_VISIBILITY_BUCKETS.HEAD_SHOULDERS,
    COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP,
    COMPOSITION_VISIBILITY_BUCKETS.MEDIUM_WAIST,
  ],
});

const KNEELING_UPPER_PROJECTION = createPoseComposerProjectionMap({
  visible: [
    COMPOSITION_VISIBILITY_BUCKETS.UNCONSTRAINED,
    COMPOSITION_VISIBILITY_BUCKETS.FIXED_COMPOSITION,
    COMPOSITION_VISIBILITY_BUCKETS.COWBOY_KNEE,
    COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY,
  ],
  projected: [
    COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP,
    COMPOSITION_VISIBILITY_BUCKETS.MEDIUM_WAIST,
  ],
  omit: [
    COMPOSITION_VISIBILITY_BUCKETS.FACE_DETAIL,
    COMPOSITION_VISIBILITY_BUCKETS.HEAD_SHOULDERS,
  ],
});

const KNEELING_LOWER_PROJECTION = createPoseComposerProjectionMap({
  visible: [
    COMPOSITION_VISIBILITY_BUCKETS.UNCONSTRAINED,
    COMPOSITION_VISIBILITY_BUCKETS.FIXED_COMPOSITION,
    COMPOSITION_VISIBILITY_BUCKETS.COWBOY_KNEE,
    COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY,
  ],
  omit: [
    COMPOSITION_VISIBILITY_BUCKETS.FACE_DETAIL,
    COMPOSITION_VISIBILITY_BUCKETS.HEAD_SHOULDERS,
    COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP,
    COMPOSITION_VISIBILITY_BUCKETS.MEDIUM_WAIST,
  ],
});

const SQUATTING_UPPER_PROJECTION = createPoseComposerProjectionMap({
  visible: [
    COMPOSITION_VISIBILITY_BUCKETS.UNCONSTRAINED,
    COMPOSITION_VISIBILITY_BUCKETS.FIXED_COMPOSITION,
    COMPOSITION_VISIBILITY_BUCKETS.COWBOY_KNEE,
    COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY,
  ],
  projected: [
    COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP,
    COMPOSITION_VISIBILITY_BUCKETS.MEDIUM_WAIST,
  ],
  omit: [
    COMPOSITION_VISIBILITY_BUCKETS.FACE_DETAIL,
    COMPOSITION_VISIBILITY_BUCKETS.HEAD_SHOULDERS,
  ],
});

const SQUATTING_LOWER_PROJECTION = createPoseComposerProjectionMap({
  visible: [
    COMPOSITION_VISIBILITY_BUCKETS.UNCONSTRAINED,
    COMPOSITION_VISIBILITY_BUCKETS.FIXED_COMPOSITION,
    COMPOSITION_VISIBILITY_BUCKETS.COWBOY_KNEE,
    COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY,
  ],
  omit: [
    COMPOSITION_VISIBILITY_BUCKETS.FACE_DETAIL,
    COMPOSITION_VISIBILITY_BUCKETS.HEAD_SHOULDERS,
    COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP,
    COMPOSITION_VISIBILITY_BUCKETS.MEDIUM_WAIST,
  ],
});

const SQUATTING_LOWER_FULL_ONLY_PROJECTION = createPoseComposerProjectionMap({
  visible: [
    COMPOSITION_VISIBILITY_BUCKETS.UNCONSTRAINED,
    COMPOSITION_VISIBILITY_BUCKETS.FIXED_COMPOSITION,
    COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY,
  ],
  omit: [
    COMPOSITION_VISIBILITY_BUCKETS.FACE_DETAIL,
    COMPOSITION_VISIBILITY_BUCKETS.HEAD_SHOULDERS,
    COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP,
    COMPOSITION_VISIBILITY_BUCKETS.MEDIUM_WAIST,
    COMPOSITION_VISIBILITY_BUCKETS.COWBOY_KNEE,
  ],
});

const SQUATTING_KNEES_TOGETHER_PROJECTION = Object.freeze({
  ...SQUATTING_LOWER_PROJECTION,
  [COMPOSITION_VISIBILITY_BUCKETS.COWBOY_KNEE]: {
    mode: POSE_COMPOSER_PROJECTION_MODES.PROJECTED,
    en: 'low half-squat with both knees together and thighs held close and parallel',
  },
});

const LYING_ORIENTATION_PROJECTION = createPoseComposerProjectionMap({
  visible: [
    COMPOSITION_VISIBILITY_BUCKETS.UNCONSTRAINED,
    COMPOSITION_VISIBILITY_BUCKETS.FIXED_COMPOSITION,
    COMPOSITION_VISIBILITY_BUCKETS.COWBOY_KNEE,
    COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY,
  ],
  projected: [
    COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP,
    COMPOSITION_VISIBILITY_BUCKETS.MEDIUM_WAIST,
  ],
  omit: [
    COMPOSITION_VISIBILITY_BUCKETS.FACE_DETAIL,
    COMPOSITION_VISIBILITY_BUCKETS.HEAD_SHOULDERS,
  ],
});

const LYING_LOWER_BODY_PROJECTION = createPoseComposerProjectionMap({
  visible: [
    COMPOSITION_VISIBILITY_BUCKETS.UNCONSTRAINED,
    COMPOSITION_VISIBILITY_BUCKETS.FIXED_COMPOSITION,
    COMPOSITION_VISIBILITY_BUCKETS.COWBOY_KNEE,
    COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY,
  ],
  omit: [
    COMPOSITION_VISIBILITY_BUCKETS.FACE_DETAIL,
    COMPOSITION_VISIBILITY_BUCKETS.HEAD_SHOULDERS,
    COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP,
    COMPOSITION_VISIBILITY_BUCKETS.MEDIUM_WAIST,
  ],
});

const LYING_UPPER_BODY_PROJECTION = createPoseComposerProjectionMap({
  visible: [
    COMPOSITION_VISIBILITY_BUCKETS.UNCONSTRAINED,
    COMPOSITION_VISIBILITY_BUCKETS.FIXED_COMPOSITION,
    COMPOSITION_VISIBILITY_BUCKETS.COWBOY_KNEE,
    COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY,
  ],
  projected: [
    COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP,
    COMPOSITION_VISIBILITY_BUCKETS.MEDIUM_WAIST,
  ],
  omit: [
    COMPOSITION_VISIBILITY_BUCKETS.FACE_DETAIL,
    COMPOSITION_VISIBILITY_BUCKETS.HEAD_SHOULDERS,
  ],
});

const withLyingOrientationProjectionEnglish = (option, chestEnglish, mediumEnglish = chestEnglish) => ({
  ...option,
  meta: {
    ...(option.meta || {}),
    projectionByBucket: {
      ...(option.meta?.projectionByBucket || LYING_ORIENTATION_PROJECTION),
      [COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP]: {
        mode: POSE_COMPOSER_PROJECTION_MODES.PROJECTED,
        en: chestEnglish,
      },
      [COMPOSITION_VISIBILITY_BUCKETS.MEDIUM_WAIST]: {
        mode: POSE_COMPOSER_PROJECTION_MODES.PROJECTED,
        en: mediumEnglish,
      },
    },
  },
});

const withLyingUpperBodyProjectionEnglish = (option, chestEnglish, mediumEnglish = chestEnglish) => ({
  ...option,
  meta: {
    ...(option.meta || {}),
    projectionByBucket: {
      ...(option.meta?.projectionByBucket || LYING_UPPER_BODY_PROJECTION),
      [COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP]: {
        mode: POSE_COMPOSER_PROJECTION_MODES.PROJECTED,
        en: chestEnglish,
      },
      [COMPOSITION_VISIBILITY_BUCKETS.MEDIUM_WAIST]: {
        mode: POSE_COMPOSER_PROJECTION_MODES.PROJECTED,
        en: mediumEnglish,
      },
    },
  },
});

export const POSE_COMPOSER_BASE_OPTIONS = [
  { id: 'none', zh: '全無', en: 'none', desc: '不使用姿勢組合器。', meta: { tags: ['none'] } },
  { id: 'random', zh: '隨機', en: 'random pose base', desc: '由姿勢組合器隨機選擇姿勢基底。', meta: { tags: ['random'] } },
  { id: 'standing', zh: '站姿', en: 'standing pose', desc: '以站立作為姿勢基底。' },
  { id: 'sitting', zh: '坐姿', en: 'seated pose', desc: '以坐姿作為姿勢基底。' },
  { id: 'kneeling', zh: '跪姿', en: 'kneeling pose', desc: '以跪姿作為姿勢基底。' },
  { id: 'squatting', zh: '蹲姿', en: 'squatting pose', desc: '以蹲姿作為姿勢基底。' },
  { id: 'lying', zh: '躺姿', en: 'lying pose', desc: '以躺臥作為姿勢基底。' },
];

export const POSE_COMPOSER_ORIENTATION_OPTIONS = [
  { id: 'none', zh: '全無', en: 'none', desc: '不指定主要躺姿方向。', meta: { tags: ['none'] } },
  { id: 'random', zh: '隨機', en: 'random lying orientation', desc: '由姿勢組合器隨機選擇仰躺、側躺或趴臥。', meta: { tags: ['random'] } },
  withLyingOrientationProjectionEnglish({ id: 'lying-supine', base: 'lying', zh: '仰躺', en: 'supine lying position, back supported, chest and face turned upward', desc: '身體背部貼住支撐面、腹面朝上。', meta: { projectionByBucket: LYING_ORIENTATION_PROJECTION } }, 'the upper torso resting on the back, chest facing upward', 'a supine upper-body position, torso facing upward'),
  withLyingOrientationProjectionEnglish({ id: 'lying-side', base: 'lying', zh: '側躺', en: 'side-lying position, body turned onto one side', desc: '身體側面貼住支撐面。', meta: { projectionByBucket: LYING_ORIENTATION_PROJECTION } }, 'the upper torso turned onto one side', 'a side-lying upper-body position, torso turned onto one side'),
  withLyingOrientationProjectionEnglish({ id: 'lying-prone', base: 'lying', zh: '趴臥', en: 'prone lying position, chest and abdomen facing the support surface, face turned downward', desc: '身體腹面朝向支撐面。', meta: { projectionByBucket: LYING_ORIENTATION_PROJECTION } }, 'the upper torso facing downward toward the support surface', 'a prone upper-body position, torso facing downward toward the support surface'),
];

const deprecatedPoseArrangement = (option) => ({
  ...option,
  meta: {
    ...(option.meta || {}),
    uiHidden: true,
    randomEligible: false,
    deprecated: true,
  },
});

const deprecatedPoseHead = (option) => ({
  ...option,
  meta: {
    ...(option.meta || {}),
    uiHidden: true,
    randomEligible: false,
    deprecated: true,
  },
});

const hidePoseOptionForBase = (option, baseId) => ({
  ...option,
  meta: {
    ...(option.meta || {}),
    hiddenForBases: [
      ...new Set([...(option.meta?.hiddenForBases || []), baseId]),
    ],
    randomEligibleForBases: {
      ...(option.meta?.randomEligibleForBases || {}),
      [baseId]: false,
    },
  },
});

const hidePoseOptionForBases = (option, baseIds) => baseIds.reduce(
  (current, baseId) => hidePoseOptionForBase(current, baseId),
  option,
);

const withStandingUpperProjectionEnglish = (option, english) => ({
  ...option,
  meta: {
    ...(option.meta || {}),
    projectionByBucket: {
      ...(option.meta?.projectionByBucket || {}),
      [COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP]: {
        mode: POSE_COMPOSER_PROJECTION_MODES.PROJECTED,
        en: english,
      },
      [COMPOSITION_VISIBILITY_BUCKETS.MEDIUM_WAIST]: {
        mode: POSE_COMPOSER_PROJECTION_MODES.PROJECTED,
        en: english,
      },
    },
  },
});

const withSittingUpperProjectionEnglish = (option, english) => ({
  ...option,
  meta: {
    ...(option.meta || {}),
    projectionByBucket: {
      ...(option.meta?.projectionByBucket || SITTING_UPPER_PROJECTION),
      [COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP]: {
        mode: POSE_COMPOSER_PROJECTION_MODES.PROJECTED,
        en: english,
      },
      [COMPOSITION_VISIBILITY_BUCKETS.MEDIUM_WAIST]: {
        mode: POSE_COMPOSER_PROJECTION_MODES.PROJECTED,
        en: english,
      },
    },
  },
});

const withKneelingUpperProjectionEnglish = (option, chestEnglish, mediumEnglish = chestEnglish) => ({
  ...option,
  meta: {
    ...(option.meta || {}),
    projectionByBucket: {
      ...(option.meta?.projectionByBucket || KNEELING_UPPER_PROJECTION),
      [COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP]: {
        mode: POSE_COMPOSER_PROJECTION_MODES.PROJECTED,
        en: chestEnglish,
      },
      [COMPOSITION_VISIBILITY_BUCKETS.MEDIUM_WAIST]: {
        mode: POSE_COMPOSER_PROJECTION_MODES.PROJECTED,
        en: mediumEnglish,
      },
    },
  },
});

const withSquattingUpperProjectionEnglish = (option, english, mediumEnglish = english) => ({
  ...option,
  meta: {
    ...(option.meta || {}),
    projectionByBucket: {
      ...(option.meta?.projectionByBucket || SQUATTING_UPPER_PROJECTION),
      [COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP]: {
        mode: POSE_COMPOSER_PROJECTION_MODES.PROJECTED,
        en: english,
      },
      [COMPOSITION_VISIBILITY_BUCKETS.MEDIUM_WAIST]: {
        mode: POSE_COMPOSER_PROJECTION_MODES.PROJECTED,
        en: mediumEnglish,
      },
    },
  },
});

export const POSE_COMPOSER_ARRANGEMENT_OPTIONS = [
  { id: 'none', zh: '全無', en: 'none', desc: '不指定肢體變化。', meta: { tags: ['none'] } },
  { id: 'random', zh: '隨機', en: 'random body arrangement', desc: '依姿勢基底隨機選擇肢體變化。', meta: { tags: ['random'] } },
  {
    id: 'model-natural-body-arrangement',
    bases: ['standing', 'sitting', 'kneeling', 'squatting', 'lying'],
    zh: '任意',
    en: 'any natural body arrangement fitted to the selected pose base, wardrobe, camera, and environment',
    desc: '不指定具體肢體變化，讓模型依姿勢基底、服裝、鏡頭與場景自由產生隨意、放鬆且自然的結果。',
    meta: { tags: ['any'] },
  },
  withStandingUpperProjectionEnglish({ id: 'standing-natural', base: 'standing', zh: '自然站姿', en: 'relaxed neutral standing posture', meta: { projectionByBucket: STANDING_UPPER_PROJECTION } }, 'a relaxed upright posture'),
  withStandingUpperProjectionEnglish({ id: 'standing-one-leg-weight', base: 'standing', zh: '單腳重心', en: 'relaxed standing posture with weight shifted onto one leg and a natural asymmetrical balance', meta: { projectionByBucket: STANDING_UPPER_PROJECTION } }, 'a subtle asymmetrical weight shift onto one leg'),
  withStandingUpperProjectionEnglish({ id: 'standing-forward-lean', base: 'standing', zh: '身體微前傾', en: 'standing posture with a slight forward lean through the upper body', meta: { projectionByBucket: STANDING_UPPER_PROJECTION } }, 'a slight forward lean through the upper body'),
  deprecatedPoseArrangement({ id: 'standing-deep-forward-lean', base: 'standing', zh: '上身大幅度前傾', en: 'deep forward lean from the waist, shoulders angled forward, energetic close-interaction upper-body tilt', meta: { projectionByBucket: STANDING_UPPER_PROJECTION } }),
  withStandingUpperProjectionEnglish({ id: 'standing-back-lean', base: 'standing', zh: '身體微後仰', en: 'standing posture with a slight backward lean through the upper body', meta: { projectionByBucket: STANDING_UPPER_PROJECTION } }, 'a slight backward lean through the upper body'),
  deprecatedPoseArrangement({ id: 'standing-turn-back', base: 'standing', zh: '回身轉向', en: 'turning-back standing arrangement, torso subtly rotated', meta: { projectionByBucket: STANDING_UPPER_PROJECTION } }),
  deprecatedPoseArrangement({ id: 'standing-contrapposto', base: 'standing', zh: '身體側傾', en: 'side-leaning contrapposto body arrangement', meta: { projectionByBucket: STANDING_UPPER_PROJECTION } }),
  deprecatedPoseArrangement({ id: 'standing-raised-foot', base: 'standing', zh: '單腳微抬', en: 'delicate standing balance pose with one foot slightly lifted', meta: { projectionByBucket: STANDING_LOWER_FULL_ONLY_PROJECTION } }),
  { id: 'standing-crossed-legs', base: 'standing', zh: '交叉腿站姿', en: 'standing posture with the legs naturally crossed and one hip subtly shifted', meta: { projectionByBucket: STANDING_LOWER_PROJECTION } },
  deprecatedPoseArrangement({ id: 'standing-soft-bent-knees', base: 'standing', zh: '膝蓋微彎站姿', en: 'soft bent-knee standing arrangement, relaxed knees with slight lower-body compression', meta: { projectionByBucket: STANDING_LOWER_PROJECTION } }),
  withStandingUpperProjectionEnglish({ id: 'standing-back-facing-turn', base: 'standing', zh: '背對回身站姿', en: 'back-facing standing posture with the torso turned toward the camera', meta: { projectionByBucket: STANDING_UPPER_PROJECTION } }, 'a back-facing posture, torso turned toward the camera'),
  withStandingUpperProjectionEnglish({ id: 'standing-narrow-side', base: 'standing', zh: '側身窄站姿', en: 'narrow side-facing standing posture with feet close together and a clean elongated body line', meta: { projectionByBucket: STANDING_UPPER_PROJECTION } }, 'a narrow side-facing posture, shoulders in profile'),
  { id: 'standing-forward-toe-point', base: 'standing', zh: '一腳向前點地', en: 'standing posture with one foot placed slightly forward, its toe lightly touching the ground, and the other leg supporting the body weight', meta: { projectionByBucket: STANDING_LOWER_FULL_ONLY_PROJECTION } },
  withSittingUpperProjectionEnglish({ id: 'sitting-natural', base: 'sitting', zh: '自然坐姿', en: 'natural seated arrangement' }, 'a relaxed seated upper-body posture'),
  withSittingUpperProjectionEnglish({ id: 'sitting-forward-lean', base: 'sitting', zh: '微微前傾', en: 'slightly forward-leaning seated arrangement' }, 'the upper body leaning slightly forward'),
  deprecatedPoseArrangement(withSittingUpperProjectionEnglish({ id: 'sitting-hands-behind-support', base: 'sitting', zh: '雙手後撐', en: 'seated pose with both hands planted behind the body for support' }, 'the torso slightly reclined with relaxed, open shoulders')),
  deprecatedPoseArrangement({ id: 'sitting-one-leg-relaxed', base: 'sitting', zh: '單腿放鬆', en: 'easy seated pose with one leg relaxed', meta: { projectionByBucket: SITTING_LOWER_PROJECTION } }),
  { id: 'sitting-legs-extended', base: 'sitting', zh: '雙腿自然伸展', en: 'seated pose with both legs naturally extended', meta: { projectionByBucket: SITTING_LOWER_PROJECTION } },
  { id: 'sitting-cross-legged', base: 'sitting', zh: '盤腿坐姿', en: 'cross-legged seated arrangement', meta: { projectionByBucket: SITTING_LOWER_PROJECTION } },
  { id: 'sitting-hug-knees', base: 'sitting', zh: '雙腿屈起', en: 'seated pose with both legs bent and knees raised, feet resting naturally', meta: { projectionByBucket: SITTING_LOWER_PROJECTION } },
  withSittingUpperProjectionEnglish({ id: 'sitting-slouched', base: 'sitting', zh: '隨性癱坐', en: 'casually slumped seated posture with a loose, heavy body, dropped shoulders, and the torso settling naturally into the seat', desc: '全身放鬆、重心自然下沉，肩膀放低，軀幹與四肢隨意放置，呈現沒有負擔的癱坐狀態。' }, 'a loose, heavy upper-body slouch with dropped shoulders and a relaxed torso'),
  { id: 'sitting-leg-cross', base: 'sitting', zh: '翹二郎腿', en: 'leg-cross seated arrangement', meta: { projectionByBucket: SITTING_LOWER_PROJECTION } },
  { id: 'sitting-one-knee-up', base: 'sitting', zh: '單腿屈起坐姿', en: 'seated arrangement with one knee drawn up, the other leg relaxed', meta: { projectionByBucket: SITTING_LOWER_PROJECTION } },
  { id: 'sitting-legs-to-side', base: 'sitting', zh: '雙腿側放坐姿', en: 'seated arrangement with both legs angled to one side, soft asymmetrical lower-body line', meta: { projectionByBucket: SITTING_LOWER_PROJECTION } },
  deprecatedPoseArrangement(withSittingUpperProjectionEnglish({ id: 'sitting-grounded-forward-lean', base: 'sitting', zh: '坐姿身體前傾', en: 'grounded forward-leaning seated arrangement, upper body angled forward with stable seated weight' }, 'the upper body angled forward')),
  withSittingUpperProjectionEnglish({ id: 'sitting-open-confident', base: 'sitting', zh: '開闊自信坐姿', en: 'open, grounded seated posture with the knees comfortably apart, weight settled through the hips, and the torso relaxed and upright', desc: '膝蓋自然分開、重心穩定下沉，軀幹放鬆直立，呈現沒有拘束的開放坐姿。' }, 'an open, relaxed upper-body posture with the torso upright and shoulders at ease'),
  { id: 'kneeling-seiza', base: 'kneeling', zh: '跪坐', en: 'seiza-style kneeling posture with the hips resting on the heels, knees together, and the torso upright', meta: { projectionByBucket: KNEELING_LOWER_PROJECTION } },
  { id: 'kneeling-wide', base: 'kneeling', zh: '分腿跪坐', en: 'wide-knee kneeling posture with the hips settled between the heels and the torso relaxed upright', meta: { projectionByBucket: KNEELING_LOWER_PROJECTION } },
  withKneelingUpperProjectionEnglish(
    { id: 'kneeling-forward-lean', base: 'kneeling', zh: '前傾跪姿', en: 'forward-leaning kneeling posture with the upper body inclined from the hips while both knees remain grounded' },
    'a forward torso lean from the hips',
  ),
  withKneelingUpperProjectionEnglish(
    { id: 'kneeling-all-fours', base: 'kneeling', zh: '四足跪姿', en: 'all-fours kneeling posture with both knees grounded and the torso held low, roughly parallel to the ground' },
    'the torso held low and close to the ground',
    'a low, forward-angled torso with the body supported close to the ground',
  ),
  deprecatedPoseArrangement({ id: 'kneeling-puppy-crossed-hands-chin', base: 'kneeling', zh: '瑜伽小狗式交叉手托下巴', en: 'extended puppy kneeling pose with knees grounded, torso folded forward, forearms crossed under the chin, and hands tucked below the jaw' }),
  deprecatedPoseArrangement({ id: 'kneeling-one-knee', base: 'kneeling', zh: '單膝跪地', en: 'one-knee kneeling arrangement' }),
  withKneelingUpperProjectionEnglish(
    { id: 'kneeling-side', base: 'kneeling', zh: '跪姿側身', en: 'side-oriented kneeling posture with the lower body grounded and the torso turned to one side' },
    'a side-turned upper-body posture and a clear lateral shoulder line',
  ),
  withKneelingUpperProjectionEnglish(
    { id: 'kneeling-upright-poised', base: 'kneeling', zh: '直立端正跪姿', en: 'upright poised kneeling posture with the torso tall, shoulders relaxed, and both knees grounded' },
    'a tall, relaxed upper-body posture',
  ),
  { id: 'kneeling-side-sit', base: 'kneeling', zh: '側坐跪姿', en: 'side-sitting kneeling posture with the hips lowered beside the folded legs and the torso relaxed upright', meta: { projectionByBucket: KNEELING_LOWER_PROJECTION } },
  { id: 'kneeling-one-knee-forward', base: 'kneeling', zh: '單膝前跨跪姿', en: 'half-kneeling posture with one knee grounded, the other leg stepped forward, and the front knee bent', meta: { projectionByBucket: KNEELING_LOWER_PROJECTION } },
  deprecatedPoseArrangement({ id: 'kneeling-elbow-support', base: 'kneeling', zh: '手肘支撐跪姿', en: 'kneeling arrangement with elbows or forearms supporting the upper body on a nearby surface' }),
  deprecatedPoseArrangement({ id: 'kneeling-back-arched', base: 'kneeling', zh: '跪姿微後仰', en: 'slightly backward-arched kneeling arrangement, torso leaning back with balanced knee support' }),
  withSquattingUpperProjectionEnglish(
    { id: 'squatting-natural', base: 'squatting', zh: '自然蹲姿', en: 'deep resting squat with both feet flat on the ground, heels down, knees deeply bent, and the body balanced low over the feet' },
    'the torso upright and relaxed',
    'a relaxed upright upper-body posture'
  ),
  { id: 'squatting-one-knee', base: 'squatting', zh: '單膝抬起不對稱蹲姿', en: 'asymmetrical deep squat with one knee lifted higher than the other while the opposite leg stays deeply bent, creating an uneven lower-body line', meta: { projectionByBucket: SQUATTING_LOWER_PROJECTION } },
  deprecatedPoseArrangement({ id: 'squatting-hands-knees', base: 'squatting', zh: '手扶膝蓋蹲姿', en: 'squatting arrangement with hands resting on the knees', meta: { projectionByBucket: SQUATTING_LOWER_PROJECTION } }),
  deprecatedPoseArrangement({ id: 'squatting-compact', base: 'squatting', zh: '緊湊蹲姿', en: 'compact low squatting arrangement', meta: { projectionByBucket: SQUATTING_LOWER_PROJECTION } }),
  { id: 'squatting-side', base: 'squatting', zh: '側身蹲姿', en: 'deep squat with the hips and legs kept low while the torso turns toward the camera', meta: { projectionByBucket: SQUATTING_LOWER_PROJECTION } },
  deprecatedPoseArrangement({ id: 'squatting-hug-knees', base: 'squatting', zh: '抱膝蹲', en: 'hugging-knees squat, compact grounded body shape', meta: { projectionByBucket: SQUATTING_LOWER_PROJECTION } }),
  deprecatedPoseArrangement({ id: 'squatting-one-hand-ground', base: 'squatting', zh: '單手撐地蹲', en: 'squatting pose with one hand planted on the ground for support', meta: { projectionByBucket: SQUATTING_LOWER_FULL_ONLY_PROJECTION } }),
  { id: 'squatting-low-one-leg-forward', base: 'squatting', zh: '低蹲單腿前伸', en: 'low squat with one leg extended straight forward and the other leg folded under the body, forming a clear asymmetrical lower-body line', meta: { projectionByBucket: SQUATTING_LOWER_PROJECTION } },
  deprecatedPoseArrangement({ id: 'squatting-side-low', base: 'squatting', zh: '側身低蹲', en: 'side-facing low squat, torso and legs oriented laterally with readable profile line', meta: { projectionByBucket: SQUATTING_LOWER_PROJECTION } }),
  deprecatedPoseArrangement({ id: 'squatting-raised-heels', base: 'squatting', zh: '腳跟抬起蹲姿', en: 'raised-heel squatting arrangement, heels lightly lifted, body balanced on the balls of the feet', meta: { projectionByBucket: SQUATTING_LOWER_FULL_ONLY_PROJECTION } }),
  withSquattingUpperProjectionEnglish(
    { id: 'squatting-forward-lean', base: 'squatting', zh: '身體前傾蹲姿', en: 'deep squat with the torso leaning forward over the thighs and weight centered low near the feet' },
    'the torso leaning forward from the hips',
    'a forward-leaning upper-body posture with the torso inclined from the hips'
  ),
  deprecatedPoseArrangement({ id: 'squatting-compact-hug-knees-variant', base: 'squatting', zh: '緊湊抱膝蹲姿變體', en: 'compact knees-held squat variation, legs close together, body folded into a smaller grounded shape', meta: { projectionByBucket: SQUATTING_LOWER_PROJECTION } }),
  { id: 'squatting-knees-together-low', base: 'squatting', zh: '雙膝合併半蹲', en: 'low half-squat with both knees together, feet planted close beneath the body, and thighs held parallel', meta: { projectionByBucket: SQUATTING_KNEES_TOGETHER_PROJECTION } },
  { id: 'squatting-gangster-wide-knee', base: 'squatting', zh: '寬膝深蹲／流氓蹲姿', en: 'wide-knee deep squat with feet planted wide, knees opened outward, and hips lowered close to the ground', meta: { projectionByBucket: SQUATTING_LOWER_PROJECTION } },
  { id: 'lying-body-natural-stretch', base: 'lying', zh: '自然伸展', en: 'lying pose with the body extended in a relaxed line, legs resting naturally', meta: { projectionByBucket: LYING_LOWER_BODY_PROJECTION } },
  { id: 'lying-body-legs-bent', base: 'lying', zh: '雙腿屈起', en: 'lying pose with both legs comfortably bent, knees softly raised', meta: { projectionByBucket: LYING_LOWER_BODY_PROJECTION } },
  withLyingUpperBodyProjectionEnglish({ id: 'lying-body-curled', base: 'lying', zh: '身體微蜷', en: 'lying pose with the torso and legs gently curved inward into a soft compact shape', meta: { projectionByBucket: LYING_UPPER_BODY_PROJECTION } }, 'the torso gently curled into a soft compact curve'),
  withLyingUpperBodyProjectionEnglish({ id: 'lying-body-half-recline', base: 'lying', zh: '上半身半躺', en: 'lying pose with the upper body raised into a gentle half-recline while the lower body remains relaxed in the lying position', meta: { projectionByBucket: LYING_UPPER_BODY_PROJECTION } }, 'the upper body raised into a gentle half-recline'),
  withLyingUpperBodyProjectionEnglish({ id: 'lying-body-upper-propped', base: 'lying', zh: '上半身撐起', en: 'lying pose with the upper body lifted and supported on the elbows or forearms while the lower body remains on the support surface', meta: { projectionByBucket: LYING_UPPER_BODY_PROJECTION } }, 'the upper body lifted and supported on the elbows or forearms'),
  deprecatedPoseArrangement({ id: 'lying-natural', base: 'lying', zh: '自然躺姿', en: 'natural lying arrangement' }),
  deprecatedPoseArrangement({ id: 'lying-on-back', base: 'lying', zh: '仰躺', en: 'supine lying pose with a relaxed upward-facing body line' }),
  deprecatedPoseArrangement({ id: 'lying-side', base: 'lying', zh: '側躺', en: 'side-lying arrangement, body turned along one side' }),
  deprecatedPoseArrangement({ id: 'lying-prone', base: 'lying', zh: '趴臥', en: 'prone lying arrangement, body resting forward on the surface' }),
  deprecatedPoseArrangement({ id: 'lying-natural-half-recline', base: 'lying', zh: '自然半躺', en: 'relaxed half-reclining arrangement' }),
  deprecatedPoseArrangement({ id: 'lying-half-reclined', base: 'lying', zh: '半躺倚靠', en: 'relaxed half-reclining arrangement with the upper body naturally supported' }),
  deprecatedPoseArrangement({ id: 'lying-languid', base: 'lying', zh: '隨性慵懶', en: 'casually languid lying arrangement, relaxed uneven limbs, soft body weight settled into the surface' }),
  deprecatedPoseArrangement({ id: 'lying-side-knees-bent', base: 'lying', zh: '側躺屈膝', en: 'side-lying arrangement with both knees softly bent, compact curved body line' }),
  deprecatedPoseArrangement({ id: 'lying-on-back-one-arm-overhead', base: 'lying', zh: '仰躺單手過頭', en: 'supine lying pose with one arm extended overhead and a relaxed elongated body line' }),
  deprecatedPoseArrangement({ id: 'lying-prone-elbow-prop', base: 'lying', zh: '趴臥手肘撐起', en: 'prone lying arrangement with elbows propping up the upper body' }),
  deprecatedPoseArrangement({ id: 'lying-diagonal-recline', base: 'lying', zh: '斜向半躺', en: 'diagonal reclining arrangement, body angled across the support surface with relaxed limbs' }),
  deprecatedPoseArrangement({ id: 'lying-legs-bent-up', base: 'lying', zh: '躺姿雙腿屈起', en: 'lying arrangement with both legs bent upward, knees raised while the back stays supported' }),
  deprecatedPoseArrangement({ id: 'lying-wall-raised-legs', base: 'lying', zh: '靠牆仰躺抬腿', en: 'wall-supported reclining pose on the floor with the upper body leaned against a wall, both legs lifted upward in staggered angles, and a compressed raised-leg silhouette', meta: { tags: ['full_body_action'] } }),
  deprecatedPoseArrangement({ id: 'lying-prone-pillow-lookback', base: 'lying', zh: '抱枕俯臥回眸', en: 'prone lying pose with the torso propped on a large pillow, head turned over one shoulder, hips softly lifted, and knees grounded behind', meta: { tags: ['full_body_action', 'large_prop_action'] } }),
];
const HAND_VISIBLE_BUCKETS = Object.freeze([
  'unconstrained',
  'fixedComposition',
  'chestUp',
  'mediumWaist',
  'cowboyKnee',
  'fullBody',
]);

const HAND_UPPER_VISIBLE_BUCKETS = Object.freeze([
  'unconstrained',
  'fixedComposition',
  'chestUp',
  'mediumWaist',
  'cowboyKnee',
  'fullBody',
]);

const HAND_LOWER_VISIBLE_BUCKETS = Object.freeze([
  'unconstrained',
  'fixedComposition',
  'mediumWaist',
  'cowboyKnee',
  'fullBody',
]);

const deprecatedPoseHand = (option) => ({
  ...option,
  meta: {
    ...(option.meta || {}),
    uiHidden: true,
    randomEligible: false,
    deprecated: true,
  },
});

const POSE_COMPOSER_LEGACY_HAND_OPTIONS = [
  { id: 'selfie-natural-right-arm', zh: '自然自拍', en: 'front-camera self-shot with her right arm extended to hold the phone just beyond the frame edge and only a naturally foreshortened right forearm entering from the side', desc: '右手拿手機前鏡頭自拍，手機與手留在畫面邊緣外，只保留自然前臂裁切。', meta: { tags: ['selfie_hand_pose', 'locks_orbit'] } },
  { id: 'selfie-mirror-phone-visible', zh: '鏡子自拍', en: 'one hand holding a visible phone toward a mirror for a mirror selfie, with the phone overlapping the face or positioned beside it in the reflection', desc: '拿著可見手機對鏡自拍，手機可遮到臉或在臉旁。', meta: { tags: ['selfie_hand_pose', 'visible_phone', 'mirror_selfie', 'locks_orbit'] } },
  { id: 'selfie-companion-camera-interaction', zh: '男友/閨蜜自拍', en: 'casual, naturally relaxed hand placement in a close-companion social snapshot, with unforced candid body language', desc: '呈現男友或閨蜜拍攝的親近社群感，手部由模型自然放鬆發揮。', meta: { tags: ['selfie_hand_pose', 'companion_snapshot', 'locks_orbit'] } },
  { id: 'hand-adjust-lower-body-garment', zh: '整理下身', en: 'one hand adjusting the lower-body garment or hosiery, with the fingers visibly touching a skirt, pants waistband, or stocking', desc: '整理裙、褲、腰頭或絲襪，依當前穿搭自然成立。', meta: { tags: ['wardrobe_action', 'leg_focus_action'] } },
  { id: 'hands-grip-waistband', zh: '雙手抓住褲腰', en: 'both hands gripping the front waistband or belt loops, elbows angled outward', desc: '雙手抓住褲腰或皮帶環，形成明確腰部接觸。', meta: { tags: ['wardrobe_action'] } },
  { id: 'hands-on-waist', zh: '雙手撐腰', en: 'both hands placed on the waist or hip line with elbows naturally adapted to the pose' },
  { id: 'one-hand-chin', zh: '單手摸下巴', en: 'one hand touching the chin' },
  { id: 'one-hand-forehead', zh: '單手扶額 / 摸頭', en: 'one hand touching the forehead or hair' },
  { id: 'one-hand-hair', zh: '單手撩髮', en: 'one hand brushing hair back from the side of the face, fingers visibly touching the hair near the temple or ear' },
  { id: 'hands-on-thighs', zh: '雙手放在大腿上', en: 'both hands resting on the thighs or nearest upper-leg surface' },
  { id: 'hands-on-cheeks', zh: '雙手扶臉頰', en: 'both hands gently holding the cheeks' },
  { id: 'one-hand-chin-other-down', zh: '單手托下巴', en: 'one hand supporting the chin with the other hand relaxed along the body or support surface' },
  { id: 'one-hand-adjust-glasses', zh: '單手扶眼鏡', en: 'one hand adjusting the glasses at the frame or bridge, fingertips visibly touching the eyewear' },
  { id: 'one-hand-half-face-cover', zh: '單手遮住半邊臉', en: 'one hand partially covering one side of the face, fingers framing the cheek and eye area' },
  { id: 'both-hands-arrange-hair', zh: '雙手整理頭髮', en: 'both hands lifting and gathering the hair behind the head as if preparing to tie it up with fingers visibly holding the hair together' },
  { id: 'one-hand-nape-hair-lift', zh: '單手撩起後頸頭髮', en: 'one hand lifting hair away from the nape of the neck, fingers placed behind the ear or lower hairline' },
  { id: 'one-hand-collarbone', zh: '單手搭在鎖骨', en: 'one hand resting across the collarbone, fingertips lightly touching the upper chest line' },
  { id: 'one-hand-ground-one-leg', zh: '一手撐地一手放腿上', en: 'one hand planted on the floor or a nearby surface for support, with the other hand resting on the leg' },
  { id: 'one-hand-knee-one-down', zh: '一手扶膝一手垂放', en: 'one hand holding the knee with the other hand relaxed beside the body or support surface' },
  { id: 'hands-clasped-front', zh: '雙手在身前交握', en: 'both hands clasped loosely in front of the body' },
  { id: 'one-hand-shoulder', zh: '單手搭肩', en: 'one hand resting on the opposite shoulder, fingers visibly touching the shoulder line' },
  { id: 'both-hands-overhead', zh: '雙手舉過頭頂', en: 'both hands raised overhead, arms extended naturally without stiff symmetry' },
  { id: 'one-hand-ankle', zh: '單手扶腳踝', en: 'one hand holding the ankle, fingers visibly touching the ankle or shoe area' },
  { id: 'hands-gathered-lower-abdomen', zh: '雙手收在腹前', en: 'both hands gathered close in front of the lower abdomen with wrists and fingers softly folded together and elbows tucked inward near the knees in a compact low pose' },
];

const POSE_COMPOSER_HAND_OPTIONS_ACTIVE_IDS = new Set([
  'hands-relaxed-down',
  'arms-crossed',
  'one-hand-waist-one-down',
  'hands-behind-back',
  'hands-behind-head',
  'one-hand-open-palm-camera',
  'one-hand-support-chin',
  'one-hand-mouth-corner',
  'one-hand-sweep-bangs-back',
  'both-hands-gather-hair',
  'hand-adjust-off-shoulder-top',
  'hands-lift-waistband',
  'hands-hug-knees',
  'hands-palms-planted-ground',
  'hands-elbows-planted-ground',
  'hands-in-pockets',
  'hands-in-outerwear-pockets',
  'one-hand-hold-glasses',
  'one-hand-pull-down-glasses',
  'glasses-temple-between-teeth',
]);

export const POSE_COMPOSER_HAND_OPTIONS = [
  { id: 'none', zh: '全無', en: 'none', desc: '不指定手部姿勢。', meta: { tags: ['none'] } },
  { id: 'random', zh: '隨機', en: 'random hand pose', desc: '隨機選擇手部姿勢。', meta: { tags: ['random'] } },
  { id: 'model-natural-hand-placement', zh: '任意', en: 'any natural hand placement fitted to the selected body pose, support contact, wardrobe, and camera crop', desc: '不指定具體手部動作，讓模型依姿勢、支撐、服裝、鏡頭與場景自由產生隨意、放鬆且自然的結果。', meta: { tags: ['any'] } },
  { id: 'hands-relaxed-down', zh: '雙手自然垂放', en: 'both hands resting naturally along the body or on a nearby support surface, fingers relaxed and loosely following the body line', meta: { visibleBuckets: HAND_VISIBLE_BUCKETS } },
  { id: 'arms-crossed', zh: '雙臂交疊', en: 'arms crossed loosely in front of the body', meta: { visibleBuckets: HAND_VISIBLE_BUCKETS } },
  { id: 'one-hand-waist-one-down', zh: '一手扶腰一手自然放下', en: 'one hand on the waist or hip line with the other hand relaxed along the body or nearby support surface', meta: { visibleBuckets: HAND_VISIBLE_BUCKETS } },
  { id: 'hands-behind-back', zh: '雙手背在身後', en: 'both hands drawn behind the back or torso only where physically plausible for the selected pose, with relaxed shoulders', meta: { visibleBuckets: HAND_VISIBLE_BUCKETS } },
  { id: 'hands-behind-head', zh: '雙手放在頭後', en: 'both hands placed behind the head with elbows angled outward naturally and shoulders relaxed', meta: { visibleBuckets: HAND_VISIBLE_BUCKETS } },
  { id: 'one-hand-open-palm-camera', zh: '單手向鏡頭張開手掌', en: 'one hand raised toward the camera with an open palm and relaxed fingers, a natural expressive greeting gesture', meta: { visibleBuckets: HAND_VISIBLE_BUCKETS } },
  hidePoseOptionForBases({ id: 'squatting-hands-forward', zh: '雙手向前伸展', en: 'both arms extended forward with the hands held close together in front of the knees', meta: { tags: ['squatting_hand_pose'], visibleBuckets: HAND_LOWER_VISIBLE_BUCKETS } }, ['standing', 'sitting', 'kneeling', 'lying']),
  hidePoseOptionForBases({ id: 'squatting-hands-outer-legs', zh: '雙手自然放在兩腿外側', en: 'both hands resting naturally along the outer sides of the legs with relaxed elbows', meta: { tags: ['squatting_hand_pose'], visibleBuckets: HAND_LOWER_VISIBLE_BUCKETS } }, ['standing', 'sitting', 'kneeling', 'lying']),
  hidePoseOptionForBases({ id: 'squatting-one-hand-cheek-one-knee', zh: '單手托腮一手扶膝', en: 'one hand supporting the cheek or chin with the elbow near the knee, the other hand resting on the opposite knee', meta: { tags: ['squatting_hand_pose', 'face_action'], visibleBuckets: HAND_LOWER_VISIBLE_BUCKETS, requiresFaceVisibility: true } }, ['standing', 'sitting', 'kneeling', 'lying']),
  hidePoseOptionForBases({ id: 'squatting-one-hand-mouth-one-down', zh: '單手碰嘴角一手自然下垂', en: 'one hand lightly touching the corner of the mouth, the other hand resting loosely near the lower leg', meta: { tags: ['squatting_hand_pose', 'face_action'], visibleBuckets: HAND_LOWER_VISIBLE_BUCKETS, requiresFaceVisibility: true } }, ['standing', 'sitting', 'kneeling', 'lying']),
  hidePoseOptionForBases({ id: 'squatting-one-hand-v-sign', zh: '單手在臉旁比 V', en: 'one hand forming a relaxed V sign beside the face, the other hand resting naturally near the leg', meta: { tags: ['squatting_hand_pose', 'face_action'], visibleBuckets: HAND_LOWER_VISIBLE_BUCKETS, requiresFaceVisibility: true } }, ['standing', 'sitting', 'kneeling', 'lying']),
  hidePoseOptionForBases({ id: 'squatting-both-hands-cheeks', zh: '雙手托腮扶臉', en: 'both hands cupping the cheeks with the elbows drawn inward near the knees', meta: { tags: ['squatting_hand_pose', 'face_action'], visibleBuckets: HAND_LOWER_VISIBLE_BUCKETS, requiresFaceVisibility: true } }, ['standing', 'sitting', 'kneeling', 'lying']),
  { id: 'one-hand-support-chin', zh: '單手托下巴', en: 'one hand supporting the chin lightly, fingertips under the jaw, with the other hand relaxed along the body or support surface', meta: { tags: ['face_action'], visibleBuckets: HAND_UPPER_VISIBLE_BUCKETS, requiresFaceVisibility: true } },
  { id: 'one-hand-mouth-corner', zh: '單手碰嘴角', en: 'one hand lightly touching the corner of the mouth with bare fingertips near the lower lip, relaxed rather than covering the face', meta: { tags: ['face_action'], visibleBuckets: HAND_UPPER_VISIBLE_BUCKETS, requiresFaceVisibility: true } },
  { id: 'one-hand-sweep-bangs-back', zh: '單手往後撥瀏海', en: 'one hand sweeping the bangs backward across the forehead with the fingers combing the fringe into place in a confident, cool grooming gesture', meta: { visibleBuckets: HAND_UPPER_VISIBLE_BUCKETS } },
  { id: 'both-hands-gather-hair', zh: '雙手抓著整束頭髮與髮尾整理', en: 'both hands gathering one thick bundle of hair behind and above the head, one hand holding near the base while the other grips and smooths the loose lengths toward the ends in a natural ponytail-prep motion', meta: { visibleBuckets: HAND_UPPER_VISIBLE_BUCKETS } },
  { id: 'hand-adjust-off-shoulder-top', zh: '拉下肩線整理上衣', en: 'one hand gently pulling the neckline or shoulder seam down from one shoulder to expose the shoulder while the garment stays attached and naturally draped', desc: '單手把領口或肩線往一側肩膀下拉，露出肩膀，但衣服仍保持連著身體並自然垂墜。', meta: { tags: ['wardrobe_action'], visibleBuckets: HAND_UPPER_VISIBLE_BUCKETS, requiresWardrobeRole: 'upperGarment' } },
  { id: 'hands-lift-waistband', zh: '雙手把褲子或裙子的褲頭往上拉', en: 'both hands pulling the pants or skirt waistband slightly upward into place, fingers gripping the waistband or belt loops without lowering or removing the garment', desc: '雙手把褲子或裙子的褲頭稍微往上拉回定位，不是往下脫。', meta: { tags: ['wardrobe_action'], visibleBuckets: HAND_LOWER_VISIBLE_BUCKETS, requiresWardrobeRole: 'bottom' } },
  hidePoseOptionForBase({ id: 'hands-hug-knees', zh: '雙手抱膝', en: 'both arms wrapped around the bent knees, hands gently holding the knees close to the torso', desc: '雙手環抱彎曲的膝蓋，手掌自然扶住膝部，不綁定特定蹲姿。', meta: { tags: ['leg_focus_action'], visibleBuckets: HAND_LOWER_VISIBLE_BUCKETS, randomEligibleForArrangements: { sitting: ['sitting-hug-knees', 'sitting-one-knee-up'], kneeling: ['kneeling-seiza', 'kneeling-wide', 'kneeling-side-sit'] } } }, 'standing'),
  hidePoseOptionForBases({ id: 'hands-palms-planted-ground', zh: '雙掌撐地', en: 'both palms planted on the ground with the arms supporting the upper body', desc: '雙掌平放在地面，手臂支撐上半身。', meta: { tags: ['support_action', 'leg_focus_action'], visibleBuckets: HAND_VISIBLE_BUCKETS, randomEligibleForArrangements: { kneeling: ['kneeling-all-fours'] } } }, ['standing', 'sitting', 'squatting', 'lying']),
  hidePoseOptionForBases({ id: 'hands-elbows-planted-ground', zh: '雙肘撐地', en: 'both elbows planted on the ground with the forearms supporting the upper body', desc: '雙肘接觸地面，前臂支撐上半身。', meta: { tags: ['support_action', 'leg_focus_action'], visibleBuckets: HAND_VISIBLE_BUCKETS, randomEligibleForArrangements: { kneeling: ['kneeling-all-fours'] } } }, ['standing', 'sitting', 'squatting', 'lying']),
  { id: 'hands-in-pockets', zh: '雙手插褲子口袋', en: 'both hands tucked into the two front pockets of her pants, elbows relaxed and angled slightly outward', desc: '雙手插入褲子前方兩側口袋，手肘自然放鬆並微微向外。', meta: { tags: ['wardrobe_action'], visibleBuckets: HAND_LOWER_VISIBLE_BUCKETS, requiresWardrobeRole: 'pants', legacyPromptAliases: ['both hands tucked into pockets'] } },
  { id: 'hands-in-outerwear-pockets', zh: '雙手插外套口袋', en: 'both hands tucked into the two side pockets of her jacket or coat, elbows relaxed and angled slightly outward', desc: '雙手插入外套兩側口袋，手肘自然放鬆並微微向外。', meta: { tags: ['wardrobe_action'], visibleBuckets: HAND_LOWER_VISIBLE_BUCKETS, requiresWardrobeRole: 'outerwear' } },
  { id: 'one-hand-hold-glasses', zh: '單手拿著眼鏡', en: 'one hand holding the glasses by one temple, with the glasses removed from the face and hanging naturally beside the cheek', desc: '單手捏住眼鏡其中一側鏡腳，眼鏡已取下並自然垂在臉頰旁。', meta: { tags: ['face_action', 'eyewear_action'], visibleBuckets: HAND_UPPER_VISIBLE_BUCKETS, requiresWardrobeRole: 'eyewear', requiresFaceVisibility: true } },
  { id: 'one-hand-pull-down-glasses', zh: '單手把眼鏡拉下', en: 'one hand pulling the glasses slightly down the nose bridge so the eyes remain visible above the frame', desc: '單手把眼鏡沿鼻樑稍微往下拉，眼睛清楚露在鏡框上方。', meta: { tags: ['face_action', 'eyewear_action'], visibleBuckets: HAND_UPPER_VISIBLE_BUCKETS, requiresWardrobeRole: 'eyewear', requiresFaceVisibility: true } },
  { id: 'glasses-temple-between-teeth', zh: '咬著眼鏡腳', en: 'one glasses temple held lightly between the teeth, with the frames removed from the face and hanging beside the cheek while both hands stay relaxed', desc: '把取下的眼鏡其中一側鏡腳輕咬在齒間，鏡框自然垂在臉頰旁。', meta: { tags: ['face_action', 'eyewear_action'], visibleBuckets: HAND_UPPER_VISIBLE_BUCKETS, requiresWardrobeRole: 'eyewear', requiresFaceVisibility: true } },
  ...POSE_COMPOSER_LEGACY_HAND_OPTIONS
    .filter((option) => !POSE_COMPOSER_HAND_OPTIONS_ACTIVE_IDS.has(option.id))
    .map(deprecatedPoseHand),
];
export const POSE_COMPOSER_PROP_OPTIONS = [
  { id: 'none', zh: '全無', en: 'none', desc: '不指定道具動作。', meta: { tags: ['none'] } },
  { id: 'random', zh: '隨機', en: 'random prop action', desc: '隨機選擇道具動作。', meta: { tags: ['random'] } },
  {
    id: 'hand-apply-lipstick',
    zh: '塗口紅｜自由妝感',
    en: 'one hand applying lipstick directly to the lips with visible hand-to-mouth contact, with the finish varying naturally between clean application and a slightly smudged lip line',
    desc: '手持口紅直接接觸嘴唇，妝感可在乾淨與略微暈出唇線之間自然變化。',
    meta: {
      tags: ['prop_action', 'face_action'],
      legacyPromptAliases: [
        'one hand pressing a lipstick bullet to the lips, with visible hand-to-mouth contact and slight lip pressure',
        'one hand applying lipstick messily beyond the lip line, with visible hand-to-mouth contact',
      ],
    },
  },
  { id: 'hand-hold-iced-coffee', zh: '手持冰咖啡', en: 'a clear plastic takeaway cup of iced coffee held naturally in one hand', desc: '手上拿著透明外帶冰咖啡，位置由模型自然決定。', meta: { tags: ['prop_action'] } },
  { id: 'hand-hold-whirly-lollipop', zh: '手持波板糖', en: 'a colorful whirly pop swirl lollipop held naturally in one hand', desc: '手上拿著彩色波板糖，不綁定嘴部接觸。', meta: { tags: ['prop_action'] } },
  { id: 'hand-hold-cigarette', zh: '手持香菸', en: 'a cigarette held naturally between the fingers in one hand, faint smoke around the hand', desc: '手指自然夾著香菸，位置由模型自然決定。', meta: { tags: ['prop_action'] } },
  { id: 'hand-use-phone', zh: '滑手機', en: 'a cell phone held in one hand while scrolling or checking the screen', desc: '單手拿手機滑動或查看畫面。', meta: { tags: ['prop_action'] } },
];
export const POSE_COMPOSER_HEAD_OPTIONS = [
  { id: 'none', zh: '全無', en: 'none', desc: '不指定頭部方向。', meta: { tags: ['none'] } },
  { id: 'random', zh: '隨機', en: 'random head direction', desc: '隨機選擇頭部方向。', meta: { tags: ['random'] } },
  { id: 'model-natural-head-angle', zh: '任意', en: 'any natural head direction fitted to the camera angle, body orientation, and selected pose', desc: '不指定具體頭部方向，讓模型依鏡頭、身體方向與姿勢自由產生隨意、放鬆且自然的結果。', meta: { tags: ['any'] } },
  { id: 'head-camera-natural', zh: '頭部自然朝向鏡頭', en: 'head naturally facing the camera', meta: { tags: ['requires_face_visibility'] } },
  { id: 'head-slight-tilt', zh: '頭部微微側傾', en: 'head slightly tilted' },
  { id: 'chin-slightly-raised', zh: '下巴微抬', en: 'chin slightly raised' },
  { id: 'chin-slightly-lowered', zh: '下巴微收', en: 'chin slightly lowered' },
  deprecatedPoseHead({ id: 'head-turned-away', zh: '側臉轉向畫面外', en: 'head turned into a three-quarter side profile facing out of frame' }),
  { id: 'head-turned-back-camera', zh: '回頭朝向鏡頭', en: 'head turned back toward the camera', meta: { tags: ['requires_face_visibility'] } },
  { id: 'head-looking-down-hands', zh: '低頭看向手部', en: 'head lowered toward the hands' },
  { id: 'head-near-shoulder', zh: '頭靠近肩膀', en: 'head angled close to one shoulder' },
  { id: 'head-slightly-back', zh: '頭部微微後仰', en: 'head tilted slightly backward with the chin softly lifted' },
  { id: 'head-down-three-quarter', zh: '低頭三分之四側臉', en: 'head lowered into a three-quarter side angle' },
  deprecatedPoseHead({ id: 'head-over-shoulder', zh: '越肩回望', en: 'head turned over one shoulder toward the camera', meta: { tags: ['requires_face_visibility'] } }),
  { id: 'head-away-profile', zh: '側臉看向遠方', en: 'head turned into a clean side profile with the face oriented away from the camera' },
  deprecatedPoseHead({ id: 'chin-tucked-shoulder-line', zh: '下巴靠近肩線', en: 'chin tucked toward one shoulder line with the neck softly folded by the selected pose' }),
  hidePoseOptionForBases({ id: 'head-close-support-surface', zh: '頭部貼近支撐面', en: 'head angled close to a support surface or shoulder line with the cheek plane following the selected support contact' }, ['standing', 'sitting']),
  hidePoseOptionForBases({ id: 'head-close-lens-off-axis', zh: '近鏡頭偏轉頭部', en: 'head turned slightly off-axis near the lens with the face plane angled diagonally instead of flat to camera', meta: { tags: ['requires_face_visibility'] } }, ['standing', 'sitting']),
  hidePoseOptionForBases({ id: 'head-low-rim-support', zh: '頭靠近邊緣支撐', en: 'head angled low near a rim or support edge with cheek and jawline close to the supporting surface' }, ['standing', 'sitting']),
];

const deprecatedPoseAnchor = (option) => ({
  ...option,
  meta: {
    ...(option.meta || {}),
    uiHidden: true,
    randomEligible: false,
    deprecated: true,
  },
});

export const POSE_COMPOSER_ANCHOR_OPTIONS = [
  { id: 'none', zh: '全無', en: 'none', desc: '不指定接觸或支撐物。', meta: { tags: ['none'] } },
  { id: 'random', zh: '隨機', en: 'random pose anchor', desc: '依姿勢基底隨機選擇接觸或支撐物。', meta: { tags: ['random'] } },
  {
    id: 'shared-natural-support',
    bases: ['standing', 'sitting', 'kneeling', 'squatting', 'lying'],
    zh: '自然受支撐',
    en: 'body naturally supported in a relaxed pose',
    desc: '只指定人物自然獲得支撐，不指定牆面、地面、家具或其他具體支撐物件。',
    meta: {
      randomWeight: 3,
      projectionByBucket: STANDING_SUPPORT_PROJECTION,
      hiddenForBases: ['standing', 'sitting'],
      randomEligibleForBases: { standing: false, sitting: false },
    },
    phraseByBase: {
      standing: 'standing with the body naturally supported',
      sitting: 'sitting with the seated body naturally supported',
      kneeling: 'kneeling with the upper body naturally supported',
      squatting: 'squatting with the body naturally supported',
      lying: 'reclining with the upper body naturally supported',
    },
  },
  {
    id: 'shared-vertical-surface-support',
    bases: ['standing', 'sitting', 'kneeling', 'squatting'],
    zh: '肩背倚靠現有垂直面',
    en: 'shoulder and upper-back support against an existing vertical surface in the scene',
    meta: { projectionByBucket: STANDING_SUPPORT_PROJECTION },
    phraseByBase: {
      standing: 'standing with one shoulder and the upper back resting against an existing vertical surface in the scene, clear shoulder-to-surface contact with light body-weight support',
      sitting: 'sitting with the upper back resting against an existing vertical surface in the scene, clear back-to-surface contact with the seated body weight supported below',
      kneeling: 'kneeling with one shoulder and the upper back resting against an existing vertical surface in the scene, clear shoulder-to-surface contact with light body-weight support',
      squatting: 'squatting with the upper back resting against an existing vertical surface in the scene, clear back-to-surface contact with light body-weight support',
    },
  },
  {
    id: 'standing-edge-hip-support',
    base: 'standing',
    zh: '髖側倚靠現有邊緣',
    en: 'standing with one hip resting against an existing waist-height edge in the scene, clear hip-to-edge contact with partial body-weight support',
    meta: { projectionByBucket: STANDING_LOWER_SUPPORT_PROJECTION },
  },
  {
    id: 'sitting-scene-seat',
    base: 'sitting',
    zh: '坐在現有場景座面',
    en: 'sitting on an existing seat already present in the scene, hips fully contacting the seat surface with the body weight visibly supported',
  },
  {
    id: 'sitting-scene-raised-edge',
    base: 'sitting',
    zh: '坐在現有抬高邊緣',
    en: 'sitting on an existing raised edge already present in the scene, hips supported on the edge with a clear drop below the seated body',
  },
  {
    id: 'shared-ground-support',
    bases: ['sitting', 'kneeling', 'lying'],
    zh: '由場景地面承托',
    en: 'body weight supported directly by the existing ground plane in the scene',
    phraseByBase: {
      sitting: 'sitting directly on the existing ground plane in the scene, hips and legs in clear contact with the surface',
      kneeling: 'kneeling directly on the existing ground plane in the scene, both knees clearly contacting and supported by the surface',
      lying: 'lying directly on the existing ground plane in the scene, torso and limbs visibly contacting and supported by the surface',
    },
  },
  {
    id: 'shared-soft-surface-support',
    bases: ['sitting', 'kneeling', 'lying'],
    zh: '由現有柔軟平面承托',
    en: 'body weight supported by an existing soft horizontal surface in the scene',
    phraseByBase: {
      sitting: 'sitting on an existing soft horizontal surface in the scene, hips settling into the surface with the seated body weight fully supported',
      kneeling: 'kneeling on an existing soft horizontal surface in the scene, both knees pressing lightly into the surface with the body weight supported below',
      lying: 'lying on an existing soft horizontal surface in the scene, torso and hips settling into the surface with continuous body-to-surface contact',
    },
  },
  deprecatedPoseAnchor({
    id: 'shared-mirrored-steel-cube',
    bases: ['standing', 'sitting', 'kneeling', 'squatting', 'lying'],
    zh: '鏡面不鏽鋼立方台',
    en: 'physical support contact with a mirrored stainless-steel cube plinth',
    phraseByBase: {
      standing: 'standing with one hip resting against the upper edge of a mirrored stainless-steel cube plinth, clear hip-to-metal contact with partial body-weight support',
      sitting: 'sitting on the top surface of a mirrored stainless-steel cube plinth, hips fully contacting the reflective metal top with the body weight visibly supported',
      kneeling: 'kneeling beside a mirrored stainless-steel cube plinth with one shoulder resting against its upper edge, clear shoulder-to-metal contact with light body-weight support',
      squatting: 'squatting beside a mirrored stainless-steel cube plinth with the upper back resting against one side, clear back-to-metal contact with light body-weight support',
      lying: 'reclining across the top surface of a mirrored stainless-steel cube plinth, back and hips in continuous contact with the reflective metal top and fully supported by it',
    },
  }),
  deprecatedPoseAnchor({
    id: 'shared-clear-acrylic-cube',
    bases: ['standing', 'sitting', 'kneeling', 'squatting', 'lying'],
    zh: '透明壓克力立方台',
    en: 'physical support contact with a transparent acrylic cube plinth',
    phraseByBase: {
      standing: 'standing with one hip resting against the upper edge of a transparent acrylic cube plinth, clear hip-to-acrylic contact with partial body-weight support',
      sitting: 'sitting on the top surface of a transparent acrylic cube plinth, hips fully contacting the clear top with the body weight visibly supported',
      kneeling: 'kneeling beside a transparent acrylic cube plinth with one shoulder resting against its upper edge, clear shoulder-to-acrylic contact with light body-weight support',
      squatting: 'squatting beside a transparent acrylic cube plinth with the upper back resting against one side, clear back-to-acrylic contact with light body-weight support',
      lying: 'reclining across the top surface of a transparent acrylic cube plinth, back and hips in continuous contact with the clear top and fully supported by it',
    },
  }),
  { id: 'sitting-ornate-velvet-armchair', base: 'sitting', zh: '坐在單人雕花絨布椅', en: 'on an ornate single velvet armchair in a relaxed lounging posture', meta: { randomEligibleForBases: { sitting: false } } },
  deprecatedPoseAnchor({ id: 'standing-wall', base: 'standing', zh: '靠牆', en: 'leaning against a wall' }),
  deprecatedPoseAnchor({ id: 'standing-doorway', base: 'standing', zh: '站在門框邊', en: 'standing beside a doorway frame' }),
  deprecatedPoseAnchor({ id: 'standing-table-edge', base: 'standing', zh: '站在桌邊', en: 'standing beside a table edge' }),
  deprecatedPoseAnchor({ id: 'standing-railing', base: 'standing', zh: '站在欄杆旁', en: 'standing beside a railing' }),
  deprecatedPoseAnchor({ id: 'standing-chair-side', base: 'standing', zh: '站在椅子旁', en: 'standing beside a chair' }),
  deprecatedPoseAnchor({ id: 'standing-window', base: 'standing', zh: '站在窗邊', en: 'standing beside a window' }),
  deprecatedPoseAnchor({ id: 'standing-column', base: 'standing', zh: '站在柱子旁', en: 'standing beside a column' }),
  deprecatedPoseAnchor({ id: 'standing-vending-machine', base: 'standing', zh: '站在自動販賣機旁', en: 'standing beside a vending machine' }),
  deprecatedPoseAnchor({ id: 'standing-lean-railing', base: 'standing', zh: '靠在欄杆', en: 'leaning lightly against a railing, body weight partially supported by the railing' }),
  deprecatedPoseAnchor({ id: 'standing-lean-table-edge', base: 'standing', zh: '倚靠桌邊', en: 'standing with one hip resting against a table edge, relaxed supported posture' }),
  deprecatedPoseAnchor({ id: 'standing-lean-doorway-shoulder', base: 'standing', zh: '肩靠門框', en: 'standing with one shoulder leaning against a doorway frame, relaxed supported posture' }),
  deprecatedPoseAnchor({ id: 'standing-lean-window-frame', base: 'standing', zh: '倚靠窗框', en: 'standing beside a window frame with the side of the body lightly supported by a window frame' }),
  deprecatedPoseAnchor({ id: 'standing-lean-column-side', base: 'standing', zh: '側身靠柱', en: 'standing with the side or back lightly leaning against a column, body weight naturally supported' }),
  deprecatedPoseAnchor({ id: 'standing-lean-chair-back', base: 'standing', zh: '倚著椅背', en: 'standing beside a chair with the body lightly leaning against the chair back' }),
  deprecatedPoseAnchor({ id: 'standing-lean-vending-machine', base: 'standing', zh: '側身靠自動販賣機', en: 'standing with one shoulder or side leaning against a vending machine, relaxed supported posture' }),
  deprecatedPoseAnchor({ id: 'standing-lean-scene-object', base: 'standing', zh: '倚靠現有場景物件', en: 'leaning against any suitable existing object within the current scene, body weight lightly supported by that existing scene object, using only a naturally available scene object for support' }),
  deprecatedPoseAnchor({ id: 'sitting-floor', base: 'sitting', zh: '坐在地板', en: 'sitting on the floor' }),
  deprecatedPoseAnchor({ id: 'sitting-scene-appropriate-chair', base: 'sitting', zh: '坐在椅子上', en: 'sitting on a chair that naturally fits the current scene with the chair style material and scale chosen to match the environment' }),
  deprecatedPoseAnchor({ id: 'sitting-chair-edge', base: 'sitting', zh: '坐在椅緣', en: 'sitting on the front edge of a chair, seat-edge support with clear leg line' }),
  deprecatedPoseAnchor({ id: 'sitting-wall-floor', base: 'sitting', zh: '背靠牆坐在地面', en: 'sitting on the floor with the back resting against a wall, wall-supported seated contact with legs naturally settled forward', meta: { tags: ['full_body_action'] } }),
  deprecatedPoseAnchor({ id: 'sitting-bed-edge', base: 'sitting', zh: '坐在床邊', en: 'sitting on the edge of a bed' }),
  deprecatedPoseAnchor({ id: 'sitting-table-edge', base: 'sitting', zh: '坐在桌面邊緣', en: 'sitting on the edge of a tabletop' }),
  deprecatedPoseAnchor({ id: 'sitting-stairs', base: 'sitting', zh: '坐在樓梯台階', en: 'sitting on stair steps' }),
  deprecatedPoseAnchor({ id: 'sitting-bar-stool', base: 'sitting', zh: '坐在吧台高腳椅', en: 'sitting on a bar stool' }),
  deprecatedPoseAnchor({ id: 'sitting-sofa-seat', base: 'sitting', zh: '坐在沙發座面', en: 'sitting on a sofa seat' }),
  deprecatedPoseAnchor({ id: 'sitting-window-sill', base: 'sitting', zh: '坐在窗台', en: 'sitting on a window sill' }),
  deprecatedPoseAnchor({ id: 'sitting-high-back-chair', base: 'sitting', zh: '坐在高背椅', en: 'sitting on a high-back chair' }),
  deprecatedPoseAnchor({ id: 'kneeling-floor', base: 'kneeling', zh: '跪在地面', en: 'kneeling on the ground' }),
  deprecatedPoseAnchor({ id: 'kneeling-bed', base: 'kneeling', zh: '跪在床上', en: 'kneeling on a bed' }),
  deprecatedPoseAnchor({ id: 'kneeling-sofa-seat', base: 'kneeling', zh: '跪在沙發座面', en: 'kneeling on a sofa seat' }),
  deprecatedPoseAnchor({ id: 'kneeling-chair-front', base: 'kneeling', zh: '跪在椅子前', en: 'kneeling in front of a chair' }),
  deprecatedPoseAnchor({ id: 'kneeling-high-back-lean', base: 'kneeling', zh: '倚靠高背椅', en: 'leaning against a high-back chair' }),
  deprecatedPoseAnchor({ id: 'kneeling-hands-ground', base: 'kneeling', zh: '雙手支撐在地面', en: 'with both hands planted on the ground for support' }),
  deprecatedPoseAnchor({ id: 'kneeling-high-back-front', base: 'kneeling', zh: '跪在高背椅前', en: 'kneeling in front of a high-back chair' }),
  deprecatedPoseAnchor({ id: 'kneeling-low-table-front', base: 'kneeling', zh: '跪在矮桌前', en: 'kneeling in front of a low table' }),
  deprecatedPoseAnchor({ id: 'kneeling-bed-edge-lean', base: 'kneeling', zh: '跪在床邊倚靠', en: 'kneeling beside the edge of a bed with the upper body lightly supported' }),
  deprecatedPoseAnchor({ id: 'squatting-ground', base: 'squatting', zh: '蹲在地面', en: 'squatting on the ground' }),
  deprecatedPoseAnchor({ id: 'squatting-wall', base: 'squatting', zh: '蹲在牆邊', en: 'squatting beside a wall' }),
  deprecatedPoseAnchor({ id: 'squatting-chair-front', base: 'squatting', zh: '蹲在椅子前', en: 'squatting in front of a chair' }),
  deprecatedPoseAnchor({ id: 'squatting-low-step', base: 'squatting', zh: '蹲在低矮台階上', en: 'squatting on a low step' }),
  deprecatedPoseAnchor({ id: 'squatting-railing', base: 'squatting', zh: '蹲在欄杆旁', en: 'squatting beside a railing' }),
  deprecatedPoseAnchor({ id: 'squatting-vending-machine', base: 'squatting', zh: '蹲在自動販賣機旁', en: 'squatting beside a vending machine' }),
  deprecatedPoseAnchor({ id: 'squatting-column', base: 'squatting', zh: '蹲在柱子旁', en: 'squatting beside a column' }),
  deprecatedPoseAnchor({ id: 'lying-bed', base: 'lying', zh: '躺在床上', en: 'lying on a bed' }),
  deprecatedPoseAnchor({ id: 'lying-sofa', base: 'lying', zh: '躺在沙發上', en: 'lying on a sofa' }),
  deprecatedPoseAnchor({ id: 'lying-floor', base: 'lying', zh: '躺在地板', en: 'lying on the floor' }),
  deprecatedPoseAnchor({ id: 'lying-rug', base: 'lying', zh: '躺在地毯上', en: 'lying on a rug' }),
  deprecatedPoseAnchor({ id: 'lying-bed-edge', base: 'lying', zh: '半躺在床邊', en: 'reclining along the edge of a bed' }),
  {
    id: 'water-immersed',
    bases: ['standing', 'sitting', 'squatting', 'kneeling', 'lying'],
    zh: '在水中',
    en: 'scene-gated water contact pose',
    meta: { tags: ['water_scene_anchor'], requiresWaterScene: true, projectionByBucket: STANDING_FULL_ONLY_SUPPORT_PROJECTION },
  },
  {
    id: 'water-edge-support',
    bases: ['standing', 'sitting', 'squatting', 'kneeling', 'lying'],
    zh: '靠在水邊支撐',
    en: 'scene-gated water edge support pose',
    meta: { tags: ['water_scene_anchor'], requiresWaterScene: true, projectionByBucket: STANDING_FULL_ONLY_SUPPORT_PROJECTION },
  },
  {
    id: 'shared-bathtub',
    bases: ['standing', 'sitting', 'squatting', 'lying'],
    zh: '浴缸',
    en: 'near a water-filled clawfoot vintage bathtub',
    meta: { tags: ['water_scene_anchor'], requiresWaterScene: true, projectionByBucket: STANDING_LOWER_SUPPORT_PROJECTION },
    phraseByBase: {
      standing: 'standing beside a water-filled clawfoot vintage bathtub',
      sitting: 'sitting on the edge of a water-filled clawfoot vintage bathtub',
      squatting: 'squatting inside a water-filled clawfoot vintage bathtub',
      lying: 'reclining inside a water-filled clawfoot vintage bathtub',
    },
  },
];

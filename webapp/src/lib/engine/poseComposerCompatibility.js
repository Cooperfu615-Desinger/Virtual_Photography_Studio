import { COMPOSITION_VISIBILITY_BUCKETS } from './compositionVisibilityContract.js';

/**
 * Shared random-pose compatibility rules.
 *
 * These predicates are deliberately applied only to random pools. Explicit
 * Pose Composer locks remain user intent and are not silently replaced.
 */
export const POSE_COMPOSER_RANDOM_COMPATIBILITY_VERSION = 5;

const UPPER_OR_KNEE_CROP_BUCKETS = new Set([
  COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP,
  COMPOSITION_VISIBILITY_BUCKETS.MEDIUM_WAIST,
  COMPOSITION_VISIBILITY_BUCKETS.COWBOY_KNEE,
]);

const UPPER_CROP_BUCKETS = new Set([
  COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP,
  COMPOSITION_VISIBILITY_BUCKETS.MEDIUM_WAIST,
]);

const UPPER_CROP_BASES = new Set(['standing', 'sitting']);
const UPPER_OR_KNEE_CROP_BASES = new Set(['standing', 'sitting', 'kneeling', 'squatting']);

const SIDE_OR_REAR_ORIENTATION_ARRANGEMENTS = new Set([
  'standing-turn-back',
  'standing-back-facing-turn',
  'standing-narrow-side',
  'sitting-legs-to-side',
  'kneeling-side',
  'kneeling-side-sit',
  'squatting-side',
  'squatting-side-low',
  'lying-side',
  'lying-prone',
  'lying-side-knees-bent',
  'lying-prone-pillow-lookback',
]);

const FRONT_ORIENTATION_ARRANGEMENTS = new Set([
  'squatting-knees-together-low',
  'squatting-gangster-wide-knee',
]);

const LOWER_BODY_HANDS = new Set([
  'hands-on-thighs',
  'one-hand-ground-one-leg',
  'one-hand-knee-one-down',
  'one-hand-ankle',
  'hands-gathered-lower-abdomen',
  'hands-hug-knees',
]);

const KNEELING_FOUR_POINT_HANDS = new Set([
  'hands-palms-planted-ground',
  'hands-elbows-planted-ground',
]);

function getTags(item) {
  return new Set(item?.meta?.tags || []);
}

function hasAnyTag(tags, values) {
  return values.some((value) => tags.has(value));
}

export function poseComposerOptionVisibleForBase(option, baseId) {
  if (!option || !baseId) return true;
  return !option.meta?.hiddenForBases?.includes(baseId);
}

export function poseComposerOptionRandomEligibleForBase(option, baseId) {
  if (!poseComposerOptionVisibleForBase(option, baseId)) return false;
  return option?.meta?.randomEligibleForBases?.[baseId] !== false;
}

export function createPoseComposerCompatibilityContext({
  bucket = COMPOSITION_VISIBILITY_BUCKETS.UNCONSTRAINED,
  angle = null,
  orbit = null,
  base = null,
  wardrobeSignals = {},
} = {}) {
  return Object.freeze({
    bucket,
    baseId: typeof base === 'string' ? base : base?.id || null,
    angleTags: Object.freeze([...getTags(angle)]),
    orbitTags: Object.freeze([...getTags(orbit)]),
    wardrobeSignals: Object.freeze({ ...wardrobeSignals }),
  });
}

export function poseComposerBaseSupportsRandomContext(base, context = {}) {
  if (!base?.id || base.id === 'none' || base.id === 'random') return true;

  if (UPPER_CROP_BUCKETS.has(context.bucket)) {
    return UPPER_CROP_BASES.has(base.id);
  }

  if (context.bucket && UPPER_OR_KNEE_CROP_BUCKETS.has(context.bucket)) {
    return UPPER_OR_KNEE_CROP_BASES.has(base.id);
  }

  return true;
}
export function poseComposerArrangementSupportsRandomContext(arrangement, context = {}) {
  if (!arrangement?.id || arrangement.id === 'none' || arrangement.id === 'random') return true;

  const orbitTags = new Set(context.orbitTags || []);
  if (orbitTags.has('front_view') && SIDE_OR_REAR_ORIENTATION_ARRANGEMENTS.has(arrangement.id)) return false;
  if (hasAnyTag(orbitTags, ['back_view', 'rear_three_quarter']) && FRONT_ORIENTATION_ARRANGEMENTS.has(arrangement.id)) return false;

  const requestedHeadId = context.requestedHeadId || context.requestedHead?.id;
  if (requestedHeadId === 'head-camera-natural' && SIDE_OR_REAR_ORIENTATION_ARRANGEMENTS.has(arrangement.id)) {
    return false;
  }

  return true;
}

export function poseComposerHandSupportsRandomContext(hand, context = {}) {
  if (!hand?.id || hand.id === 'none' || hand.id === 'random') return true;
  if (!poseComposerOptionRandomEligibleForBase(hand, context.baseId)) return false;

  const eligibleArrangements = hand.meta?.randomEligibleForArrangements?.[context.baseId];
  if (Array.isArray(eligibleArrangements)
    && !eligibleArrangements.includes(context.arrangement?.id)) {
    return false;
  }

  if (context.baseId === 'kneeling') {
    const isFourPointKneeling = context.arrangement?.id === 'kneeling-all-fours';
    if (isFourPointKneeling && !KNEELING_FOUR_POINT_HANDS.has(hand.id)) return false;
    if (!isFourPointKneeling && KNEELING_FOUR_POINT_HANDS.has(hand.id)) return false;
  }

  if (UPPER_CROP_BUCKETS.has(context.bucket) && LOWER_BODY_HANDS.has(hand.id)) return false;
  if (context.bucket === COMPOSITION_VISIBILITY_BUCKETS.COWBOY_KNEE && hand.id === 'one-hand-ankle') return false;

  const visibleBuckets = hand.meta?.visibleBuckets;
  const projectionBucket = context.bucket;
  const cropHasVisibleHandLayer = ![
    COMPOSITION_VISIBILITY_BUCKETS.FACE_DETAIL,
    COMPOSITION_VISIBILITY_BUCKETS.HEAD_SHOULDERS,
  ].includes(projectionBucket);
  if (cropHasVisibleHandLayer && Array.isArray(visibleBuckets) && !visibleBuckets.includes(projectionBucket)) {
    return false;
  }

  const requiredRole = hand.meta?.requiresWardrobeRole;
  if (requiredRole && ['absent', false].includes(context.wardrobeSignals?.[requiredRole])) return false;

  const orbitTags = new Set(context.orbitTags || []);
  if (hand.meta?.requiresFaceVisibility) {
    if (hasAnyTag(orbitTags, ['back_view', 'rear_three_quarter'])) return false;
    if (hasAnyTag(new Set(context.angleTags || []), ['aerial'])) return false;
  }

  return true;
}

export function poseComposerPropSupportsRandomContext(prop, context = {}) {
  if (!prop?.id || prop.id === 'none' || prop.id === 'random') return true;
  const propTags = getTags(prop);
  const orbitTags = new Set(context.orbitTags || []);
  if (propTags.has('face_action') && hasAnyTag(orbitTags, ['back_view', 'rear_three_quarter'])) return false;
  return true;
}

export function poseComposerHeadSupportsRandomContext(head, context = {}) {
  if (!head?.id || head.id === 'none' || head.id === 'random') return true;
  if (!poseComposerOptionRandomEligibleForBase(head, context.baseId)) return false;

  const headTags = getTags(head);
  const orbitTags = new Set(context.orbitTags || []);
  if (orbitTags.has('front_view') && SIDE_OR_REAR_ORIENTATION_ARRANGEMENTS.has(context.arrangement?.id)
    && head.id === 'head-camera-natural') {
    return false;
  }

  if (hasAnyTag(new Set(context.angleTags || []), ['aerial']) && headTags.has('requires_face_visibility')) {
    return false;
  }

  if (SIDE_OR_REAR_ORIENTATION_ARRANGEMENTS.has(context.arrangement?.id)
    && head.id === 'head-camera-natural') {
    return false;
  }

  return true;
}

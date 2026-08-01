import { COMPOSITION_VISIBILITY_BUCKETS } from './compositionVisibilityContract.js';

/**
 * Shared random-pose compatibility rules.
 *
 * These predicates are deliberately applied only to random pools. Explicit
 * Pose Composer locks remain user intent and are not silently replaced.
 */
export const POSE_COMPOSER_RANDOM_COMPATIBILITY_VERSION = 1;

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
]);

const LOWER_BODY_HANDS = new Set([
  'hands-on-thighs',
  'one-hand-ground-one-leg',
  'one-hand-knee-one-down',
  'one-hand-ankle',
  'hands-gathered-lower-abdomen',
]);

function getTags(item) {
  return new Set(item?.meta?.tags || []);
}

function hasAnyTag(tags, values) {
  return values.some((value) => tags.has(value));
}

export function createPoseComposerCompatibilityContext({
  bucket = COMPOSITION_VISIBILITY_BUCKETS.UNCONSTRAINED,
  angle = null,
  orbit = null,
} = {}) {
  return Object.freeze({
    bucket,
    angleTags: Object.freeze([...getTags(angle)]),
    orbitTags: Object.freeze([...getTags(orbit)]),
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
  if (UPPER_CROP_BUCKETS.has(context.bucket) && LOWER_BODY_HANDS.has(hand.id)) return false;
  if (context.bucket === COMPOSITION_VISIBILITY_BUCKETS.COWBOY_KNEE && hand.id === 'one-hand-ankle') return false;
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

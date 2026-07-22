/**
 * Canonical PAGE1 composition-visibility contract.
 *
 * The contract projects resolved body, wardrobe, pose, and scene data before
 * public renderer formatting. Version 2 separates fixed-composition camera
 * distance from the ordinary unconstrained framing bucket; version 3 adds the
 * shared body-visibility boundary.
 */

export const COMPOSITION_VISIBILITY_CONTRACT_VERSION = 3;

export const COMPOSITION_VISIBILITY_BUCKETS = Object.freeze({
  UNCONSTRAINED: 'unconstrained',
  FIXED_COMPOSITION: 'fixedComposition',
  FACE_DETAIL: 'faceDetail',
  HEAD_SHOULDERS: 'headShoulders',
  CHEST_UP: 'chestUp',
  MEDIUM_WAIST: 'mediumWaist',
  COWBOY_KNEE: 'cowboyKnee',
  FULL_BODY: 'fullBody',
});

export const COMPOSITION_WARDROBE_ROLES = Object.freeze([
  'top',
  'bottom',
  'dress',
  'outerwear',
  'legwear',
  'shoes',
  'bag',
  'headAccessory',
  'eyewear',
  'earrings',
  'neckAccessory',
  'wristAccessory',
  'ring',
  'waistAccessory',
]);

export const COMPOSITION_POSE_PARTS = Object.freeze([
  'head',
  'upperBody',
  'hand',
  'prop',
  'postureBase',
  'lowerBody',
  'foot',
  'anchor',
  'contactWeight',
]);

const freezeList = (values = []) => Object.freeze([...values]);

function createVisibilityPolicy({
  bodyMode,
  bodyZones = [],
  wardrobeRoles,
  conditionalWardrobeRoles = [],
  wardrobeDetailZones,
  poseMode,
  poseParts = [],
  conditionalPoseParts = [],
  sceneMode,
  sceneInteractionGeometry,
  sceneSupportObjects,
  compositionSource = 'framingId',
  manualFraming = true,
  cameraDistanceMode = 'framingDefined',
}) {
  return Object.freeze({
    composition: Object.freeze({
      source: compositionSource,
      manualFraming,
      cameraDistanceMode,
    }),
    selection: Object.freeze({ preserveRawSelections: true }),
    body: Object.freeze({
      mode: bodyMode,
      zones: freezeList(bodyZones),
    }),
    wardrobe: Object.freeze({
      roles: freezeList(wardrobeRoles),
      conditionalRoles: freezeList(conditionalWardrobeRoles),
      detailZones: freezeList(wardrobeDetailZones),
    }),
    pose: Object.freeze({
      mode: poseMode,
      parts: freezeList(poseParts),
      conditionalParts: freezeList(conditionalPoseParts),
      shareCanonicalTextAcrossPrimaryOutputs: true,
    }),
    scene: Object.freeze({
      mode: sceneMode,
      preserveLocationIdentity: true,
      preserveSourceAnchors: true,
      addDepthEffect: false,
      interactionGeometry: sceneInteractionGeometry,
      supportObjects: sceneSupportObjects,
    }),
  });
}

const FACE_ACCESSORY_ROLES = ['headAccessory', 'eyewear', 'earrings'];
const UPPER_WARDROBE_ROLES = [
  'top',
  'dress',
  'outerwear',
  ...FACE_ACCESSORY_ROLES,
  'neckAccessory',
];
const MEDIUM_WARDROBE_ROLES = [
  ...UPPER_WARDROBE_ROLES,
  'bottom',
  'wristAccessory',
  'ring',
  'waistAccessory',
];

export const COMPOSITION_VISIBILITY_CONTRACT = Object.freeze({
  [COMPOSITION_VISIBILITY_BUCKETS.UNCONSTRAINED]: createVisibilityPolicy({
    bodyMode: 'fullSource',
    bodyZones: ['all'],
    wardrobeRoles: COMPOSITION_WARDROBE_ROLES,
    wardrobeDetailZones: ['head', 'face', 'upperBody', 'waist', 'hip', 'thigh', 'lowerLeg', 'foot'],
    poseMode: 'fullCanonical',
    poseParts: COMPOSITION_POSE_PARTS,
    sceneMode: 'fullSource',
    sceneInteractionGeometry: 'full',
    sceneSupportObjects: 'full',
  }),
  [COMPOSITION_VISIBILITY_BUCKETS.FIXED_COMPOSITION]: createVisibilityPolicy({
    bodyMode: 'fullSource',
    bodyZones: ['all'],
    wardrobeRoles: COMPOSITION_WARDROBE_ROLES,
    wardrobeDetailZones: ['head', 'face', 'upperBody', 'waist', 'hip', 'thigh', 'lowerLeg', 'foot'],
    poseMode: 'fullCanonical',
    poseParts: COMPOSITION_POSE_PARTS,
    sceneMode: 'fixedSetContract',
    sceneInteractionGeometry: 'fixedSetContract',
    sceneSupportObjects: 'fixedSetContract',
    compositionSource: 'fixedCompositionSet',
    manualFraming: false,
    cameraDistanceMode: 'fixedSetDefined',
  }),
  [COMPOSITION_VISIBILITY_BUCKETS.FACE_DETAIL]: createVisibilityPolicy({
    bodyMode: 'omit',
    wardrobeRoles: FACE_ACCESSORY_ROLES,
    wardrobeDetailZones: ['head', 'face'],
    poseMode: 'omit',
    sceneMode: 'compactSource',
    sceneInteractionGeometry: 'omit',
    sceneSupportObjects: 'omit',
  }),
  [COMPOSITION_VISIBILITY_BUCKETS.HEAD_SHOULDERS]: createVisibilityPolicy({
    bodyMode: 'omit',
    wardrobeRoles: UPPER_WARDROBE_ROLES,
    wardrobeDetailZones: ['head', 'face', 'shoulder', 'neckline'],
    poseMode: 'omit',
    sceneMode: 'compactSource',
    sceneInteractionGeometry: 'omit',
    sceneSupportObjects: 'omit',
  }),
  [COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP]: createVisibilityPolicy({
    bodyMode: 'visibleZones',
    bodyZones: ['chest'],
    wardrobeRoles: UPPER_WARDROBE_ROLES,
    wardrobeDetailZones: ['head', 'face', 'shoulder', 'neckline', 'upperBody'],
    poseMode: 'visibleFragments',
    poseParts: ['head', 'upperBody'],
    conditionalPoseParts: ['hand', 'prop', 'anchor', 'contactWeight'],
    sceneMode: 'compactSource',
    sceneInteractionGeometry: 'omit',
    sceneSupportObjects: 'visibleOnly',
  }),
  [COMPOSITION_VISIBILITY_BUCKETS.MEDIUM_WAIST]: createVisibilityPolicy({
    bodyMode: 'visibleZones',
    bodyZones: ['chest', 'torso', 'waist', 'abdomen'],
    wardrobeRoles: MEDIUM_WARDROBE_ROLES,
    wardrobeDetailZones: ['head', 'face', 'shoulder', 'neckline', 'upperBody', 'waist'],
    poseMode: 'visibleFragments',
    poseParts: ['head', 'upperBody', 'hand', 'prop', 'postureBase'],
    conditionalPoseParts: ['anchor', 'contactWeight'],
    sceneMode: 'conciseSource',
    sceneInteractionGeometry: 'visibleOnly',
    sceneSupportObjects: 'visibleOnly',
  }),
  [COMPOSITION_VISIBILITY_BUCKETS.COWBOY_KNEE]: createVisibilityPolicy({
    bodyMode: 'visibleZones',
    bodyZones: ['chest', 'torso', 'waist', 'abdomen', 'hips'],
    wardrobeRoles: MEDIUM_WARDROBE_ROLES,
    conditionalWardrobeRoles: ['legwear'],
    wardrobeDetailZones: ['head', 'face', 'shoulder', 'neckline', 'upperBody', 'waist', 'hip', 'thigh', 'knee'],
    poseMode: 'visibleFragments',
    poseParts: ['head', 'upperBody', 'hand', 'prop', 'postureBase', 'lowerBody'],
    conditionalPoseParts: ['anchor', 'contactWeight'],
    sceneMode: 'conciseSource',
    sceneInteractionGeometry: 'visibleOnly',
    sceneSupportObjects: 'visibleOnly',
  }),
  [COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY]: createVisibilityPolicy({
    bodyMode: 'fullSource',
    bodyZones: ['all'],
    wardrobeRoles: COMPOSITION_WARDROBE_ROLES,
    wardrobeDetailZones: ['head', 'face', 'upperBody', 'waist', 'hip', 'thigh', 'lowerLeg', 'foot'],
    poseMode: 'fullCanonical',
    poseParts: COMPOSITION_POSE_PARTS,
    sceneMode: 'fullSource',
    sceneInteractionGeometry: 'full',
    sceneSupportObjects: 'full',
  }),
});

export const FRAMING_VISIBILITY_BUCKET_BY_ZH = Object.freeze({
  全無: COMPOSITION_VISIBILITY_BUCKETS.UNCONSTRAINED,
  半臉傾斜特寫: COMPOSITION_VISIBILITY_BUCKETS.HEAD_SHOULDERS,
  局部五官特寫: COMPOSITION_VISIBILITY_BUCKETS.FACE_DETAIL,
  臉部特寫: COMPOSITION_VISIBILITY_BUCKETS.FACE_DETAIL,
  '特寫鏡頭 (Close-Up)': COMPOSITION_VISIBILITY_BUCKETS.HEAD_SHOULDERS,
  胸上特寫: COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP,
  '中景鏡頭 (Medium Shot)': COMPOSITION_VISIBILITY_BUCKETS.MEDIUM_WAIST,
  '牛仔中景 (Cowboy Shot)': COMPOSITION_VISIBILITY_BUCKETS.COWBOY_KNEE,
  '全身鏡頭 (Full Body Shot)': COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY,
});

const FALLBACK_BUCKET_BY_VISIBILITY = Object.freeze({
  close: COMPOSITION_VISIBILITY_BUCKETS.FACE_DETAIL,
  portrait: COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP,
  medium: COMPOSITION_VISIBILITY_BUCKETS.MEDIUM_WAIST,
  full: COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY,
  wide: COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY,
});

export function resolveCompositionVisibilityBucket(framing, { fixedCompositionActive = false } = {}) {
  if (fixedCompositionActive) return COMPOSITION_VISIBILITY_BUCKETS.FIXED_COMPOSITION;
  if (!framing) return COMPOSITION_VISIBILITY_BUCKETS.UNCONSTRAINED;
  const exactBucket = FRAMING_VISIBILITY_BUCKET_BY_ZH[framing.zh];
  if (exactBucket) return exactBucket;
  return FALLBACK_BUCKET_BY_VISIBILITY[framing.meta?.visibility]
    || COMPOSITION_VISIBILITY_BUCKETS.UNCONSTRAINED;
}

export function getCompositionVisibilityPolicy(framing, options = {}) {
  return COMPOSITION_VISIBILITY_CONTRACT[resolveCompositionVisibilityBucket(framing, options)];
}

const COWBOY_VISIBLE_LEGWEAR_PATTERN = /\b(?:thigh-high|over-the-knee|knee-high|pantyhose|tights|stockings?|hosiery)\b/i;

export function createCompositionVisibilityProjection(framing, options = {}) {
  const bucket = resolveCompositionVisibilityBucket(framing, options);
  const policy = COMPOSITION_VISIBILITY_CONTRACT[bucket];
  return Object.freeze({
    bucket,
    composition: policy.composition,
    body: policy.body,
    wardrobe: policy.wardrobe,
    pose: policy.pose,
    scene: policy.scene,
  });
}

export function shouldProjectWardrobeRole(projection, role, text = '') {
  if (!projection?.wardrobe || !role) return false;
  if (projection.wardrobe.roles.includes(role)) return true;
  if (!projection.wardrobe.conditionalRoles.includes(role)) return false;
  if (role === 'legwear') return COWBOY_VISIBLE_LEGWEAR_PATTERN.test(text);
  return false;
}

export function shouldProjectPosePart(projection, part, { conditional = false } = {}) {
  if (!projection?.pose || !part || projection.pose.mode === 'omit') return false;
  if (projection.pose.parts.includes(part)) return true;
  return conditional && projection.pose.conditionalParts.includes(part);
}

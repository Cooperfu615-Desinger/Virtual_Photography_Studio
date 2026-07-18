/**
 * Canonical PAGE1 composition-visibility contract.
 *
 * Phase 1 records the product policy without changing renderer behavior. Later
 * phases must project resolved wardrobe, pose, and scene data through this
 * contract before any public prompt renderer formats the result.
 */

export const COMPOSITION_VISIBILITY_CONTRACT_VERSION = 1;

export const COMPOSITION_VISIBILITY_BUCKETS = Object.freeze({
  UNCONSTRAINED: 'unconstrained',
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
  wardrobeRoles,
  conditionalWardrobeRoles = [],
  wardrobeDetailZones,
  poseMode,
  poseParts = [],
  conditionalPoseParts = [],
  sceneMode,
  sceneInteractionGeometry,
  sceneSupportObjects,
}) {
  return Object.freeze({
    selection: Object.freeze({ preserveRawSelections: true }),
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
    wardrobeRoles: COMPOSITION_WARDROBE_ROLES,
    wardrobeDetailZones: ['head', 'face', 'upperBody', 'waist', 'hip', 'thigh', 'lowerLeg', 'foot'],
    poseMode: 'fullCanonical',
    poseParts: COMPOSITION_POSE_PARTS,
    sceneMode: 'fullSource',
    sceneInteractionGeometry: 'full',
    sceneSupportObjects: 'full',
  }),
  [COMPOSITION_VISIBILITY_BUCKETS.FACE_DETAIL]: createVisibilityPolicy({
    wardrobeRoles: FACE_ACCESSORY_ROLES,
    wardrobeDetailZones: ['head', 'face'],
    poseMode: 'omit',
    sceneMode: 'compactSource',
    sceneInteractionGeometry: 'omit',
    sceneSupportObjects: 'omit',
  }),
  [COMPOSITION_VISIBILITY_BUCKETS.HEAD_SHOULDERS]: createVisibilityPolicy({
    wardrobeRoles: UPPER_WARDROBE_ROLES,
    wardrobeDetailZones: ['head', 'face', 'shoulder', 'neckline'],
    poseMode: 'omit',
    sceneMode: 'compactSource',
    sceneInteractionGeometry: 'omit',
    sceneSupportObjects: 'omit',
  }),
  [COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP]: createVisibilityPolicy({
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
  半臉傾斜特寫: COMPOSITION_VISIBILITY_BUCKETS.FACE_DETAIL,
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

export function resolveCompositionVisibilityBucket(framing) {
  if (!framing) return COMPOSITION_VISIBILITY_BUCKETS.UNCONSTRAINED;
  const exactBucket = FRAMING_VISIBILITY_BUCKET_BY_ZH[framing.zh];
  if (exactBucket) return exactBucket;
  return FALLBACK_BUCKET_BY_VISIBILITY[framing.meta?.visibility]
    || COMPOSITION_VISIBILITY_BUCKETS.UNCONSTRAINED;
}

export function getCompositionVisibilityPolicy(framing) {
  return COMPOSITION_VISIBILITY_CONTRACT[resolveCompositionVisibilityBucket(framing)];
}

const COWBOY_VISIBLE_LEGWEAR_PATTERN = /\b(?:thigh-high|over-the-knee|knee-high|pantyhose|tights|stockings?|hosiery)\b/i;

export function createCompositionVisibilityProjection(framing) {
  const bucket = resolveCompositionVisibilityBucket(framing);
  const policy = COMPOSITION_VISIBILITY_CONTRACT[bucket];
  return Object.freeze({
    bucket,
    wardrobe: policy.wardrobe,
  });
}

export function shouldProjectWardrobeRole(projection, role, text = '') {
  if (!projection?.wardrobe || !role) return false;
  if (projection.wardrobe.roles.includes(role)) return true;
  if (!projection.wardrobe.conditionalRoles.includes(role)) return false;
  if (role === 'legwear') return COWBOY_VISIBLE_LEGWEAR_PATTERN.test(text);
  return false;
}

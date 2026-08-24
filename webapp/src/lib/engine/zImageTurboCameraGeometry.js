import { COMPOSITION_VISIBILITY_BUCKETS } from './compositionVisibilityContract.js';

const ORBIT_KEYS = Object.freeze([
  'front',
  'frontLeft',
  'left',
  'rearLeft',
  'back',
  'rearRight',
  'right',
  'frontRight',
]);

const ORBIT_KEY_BY_ZH_PREFIX = Object.freeze([
  ['正面', 'front'],
  ['左前', 'frontLeft'],
  ['左側', 'left'],
  ['左後', 'rearLeft'],
  ['背面', 'back'],
  ['右後', 'rearRight'],
  ['右側', 'right'],
  ['右前', 'frontRight'],
]);

const CROP_GROUP_BY_BUCKET = Object.freeze({
  [COMPOSITION_VISIBILITY_BUCKETS.FACE_DETAIL]: 'face',
  [COMPOSITION_VISIBILITY_BUCKETS.HEAD_SHOULDERS]: 'upper',
  [COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP]: 'upper',
  [COMPOSITION_VISIBILITY_BUCKETS.MEDIUM_WAIST]: 'medium',
  [COMPOSITION_VISIBILITY_BUCKETS.COWBOY_KNEE]: 'cowboy',
  [COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY]: 'full',
  [COMPOSITION_VISIBILITY_BUCKETS.FIXED_COMPOSITION]: 'body',
  [COMPOSITION_VISIBILITY_BUCKETS.UNCONSTRAINED]: 'body',
});

const CAMERA_OPENING_BY_ORBIT = Object.freeze({
  front: 'Photographed directly from the front',
  frontLeft: "Photographed from the woman's front-left side",
  left: "Photographed from the woman's left side",
  rearLeft: "Photographed from the woman's rear-left side",
  back: 'Photographed directly from behind',
  rearRight: "Photographed from the woman's rear-right side",
  right: "Photographed from the woman's right side",
  frontRight: "Photographed from the woman's front-right side",
});

const SIDE_ORBIT_RULES = Object.freeze({
  left: Object.freeze({
    visibleSide: 'left',
    hiddenSide: 'right',
    facingEdge: 'right',
  }),
  right: Object.freeze({
    visibleSide: 'right',
    hiddenSide: 'left',
    facingEdge: 'left',
  }),
});

const ANGLE_KEY_BY_ZH = Object.freeze([
  ['正上方', 'topDown'],
  ['鳥瞰', 'birdEye'],
  ['高位', 'high'],
  ['蟲眼', 'wormEye'],
  ['地面', 'floor'],
]);

const ANGLE_EVIDENCE_BY_CROP = Object.freeze({
  face: Object.freeze({
    high: 'forehead and nose bridge',
    low: 'chin and jawline',
  }),
  upper: Object.freeze({
    high: 'shoulders and upper chest',
    low: 'upper torso and shoulders',
  }),
  medium: Object.freeze({
    high: 'shoulders and waist',
    low: 'waist, torso, and shoulders',
  }),
  cowboy: Object.freeze({
    high: 'shoulders and waistband',
    low: 'thighs, torso, and shoulders',
  }),
  full: Object.freeze({
    high: 'shoulders and the downward view along the full figure',
    low: 'legs, torso, and shoulders',
  }),
  body: Object.freeze({
    high: 'shoulders and torso',
    low: 'lower body, torso, and shoulders',
  }),
});

const GEOMETRY_BY_CROP = Object.freeze({
  face: Object.freeze({
    front: 'Her full face plane is square to the lens, with both cheeks balanced in a frontal facial view',
    frontLeft: 'Her left cheek is nearer the lens, with the right cheek still visible in a front-left three-quarter facial view',
    rearLeft: 'The rear-left side of her head and left ear are nearest the lens, forming a rear-left head angle',
    back: 'The back of her head faces the lens in a clear rear head view',
    rearRight: 'The rear-right side of her head and right ear are nearest the lens, forming a rear-right head angle',
    frontRight: 'Her right cheek is nearer the lens, with the left cheek still visible in a front-right three-quarter facial view',
  }),
  upper: Object.freeze({
    front: 'Her chest and both shoulders face the lens in a frontal upper-body silhouette',
    frontLeft: 'Her left shoulder is nearer the lens, with her upper torso forming a front-left three-quarter silhouette',
    rearLeft: 'Her left shoulder blade is nearer the lens, with her upper back forming a rear-left three-quarter silhouette',
    back: 'Her upper back and rear shoulders face the lens in a rear-facing upper-body silhouette',
    rearRight: 'Her right shoulder blade is nearer the lens, with her upper back forming a rear-right three-quarter silhouette',
    frontRight: 'Her right shoulder is nearer the lens, with her upper torso forming a front-right three-quarter silhouette',
  }),
  medium: Object.freeze({
    front: 'Her chest, torso, and waist face the lens in a frontal waist-up silhouette',
    frontLeft: 'Her left shoulder and left waist are nearer the lens, with her torso forming a front-left three-quarter silhouette',
    rearLeft: 'Her left shoulder blade and left waist are nearer the lens, with her torso forming a rear-left three-quarter silhouette',
    back: 'Her back, rear shoulders, and waist face the lens in a rear-facing waist-up silhouette',
    rearRight: 'Her right shoulder blade and right waist are nearer the lens, with her torso forming a rear-right three-quarter silhouette',
    frontRight: 'Her right shoulder and right waist are nearer the lens, with her torso forming a front-right three-quarter silhouette',
  }),
  cowboy: Object.freeze({
    front: 'Her chest and pelvis face the lens, with her torso, hips, and thighs forming a frontal knee-up silhouette',
    frontLeft: 'Her left shoulder and left hip are nearer the lens, with her torso and thighs forming a front-left three-quarter silhouette',
    rearLeft: 'Her left shoulder blade and left hip are nearer the lens, with her back and thighs forming a rear-left three-quarter silhouette',
    back: 'Her back, rear shoulders, and rear pelvis face the lens, with her thighs forming a rear-facing knee-up silhouette',
    rearRight: 'Her right shoulder blade and right hip are nearer the lens, with her back and thighs forming a rear-right three-quarter silhouette',
    frontRight: 'Her right shoulder and right hip are nearer the lens, with her torso and thighs forming a front-right three-quarter silhouette',
  }),
  full: Object.freeze({
    front: 'Her chest and pelvis face the lens, with both shoulders, both hips, legs, and feet forming a frontal full-body silhouette',
    frontLeft: 'Her left shoulder and left hip are nearer the lens, with her chest, pelvis, legs, and feet forming a front-left three-quarter silhouette',
    rearLeft: 'Her left shoulder blade and left hip are nearer the lens, with her back, legs, and feet forming a rear-left three-quarter silhouette',
    back: 'Her back, rear shoulders, and rear pelvis face the lens, with both legs and feet forming a rear-facing full-body silhouette',
    rearRight: 'Her right shoulder blade and right hip are nearer the lens, with her back, legs, and feet forming a rear-right three-quarter silhouette',
    frontRight: 'Her right shoulder and right hip are nearer the lens, with her chest, pelvis, legs, and feet forming a front-right three-quarter silhouette',
  }),
  body: Object.freeze({
    front: 'Her chest and pelvis face the lens in a frontal body orientation',
    frontLeft: 'Her left shoulder and left hip are nearer the lens, with her torso forming a front-left three-quarter orientation',
    rearLeft: 'Her left shoulder blade and left hip are nearer the lens, with her torso remaining rear-left facing',
    back: 'Her back, rear shoulders, and rear pelvis face the lens in a rear-facing body orientation',
    rearRight: 'Her right shoulder blade and right hip are nearer the lens, with her torso remaining rear-right facing',
    frontRight: 'Her right shoulder and right hip are nearer the lens, with her torso forming a front-right three-quarter orientation',
  }),
});

function resolveOrbitKey(orbit) {
  const label = String(orbit?.zh || '').trim();
  if (!label || label === '全無') return '';
  return ORBIT_KEY_BY_ZH_PREFIX.find(([prefix]) => label.startsWith(prefix))?.[1] || '';
}

function resolveAngleKey(angle) {
  const label = String(angle?.zh || '').trim();
  if (!label || label === '全無') return '';
  return ANGLE_KEY_BY_ZH.find(([fragment]) => label.includes(fragment))?.[1] || '';
}

function resolveSubjectTerms(subjectKind) {
  if (subjectKind === 'subject') {
    return {
      cameraTarget: 'the subject',
      subjectLead: 'The subject',
      possessive: "the subject's",
      object: 'the subject',
    };
  }
  return {
    cameraTarget: 'the woman',
    subjectLead: 'She',
    possessive: 'her',
    object: 'her',
  };
}

function buildCameraAngleText(angleKey, cropGroup, subjectKind) {
  if (!angleKey) return '';
  const terms = resolveSubjectTerms(subjectKind);
  const evidence = ANGLE_EVIDENCE_BY_CROP[cropGroup] || ANGLE_EVIDENCE_BY_CROP.body;

  switch (angleKey) {
    case 'high':
      return `The camera is positioned clearly above ${terms.cameraTarget} and tilted downward toward ${terms.object}, revealing the top planes of ${terms.possessive} ${evidence.high}.`;
    case 'floor':
      return `The camera is positioned near floor level and tilted upward toward ${terms.cameraTarget}, emphasizing the upward perspective through ${terms.possessive} ${evidence.low}.`;
    case 'wormEye':
      return `The camera is positioned extremely low near the ground and tilted steeply upward toward ${terms.cameraTarget}, creating strong near-far scale through the closest visible body planes.`;
    case 'birdEye':
      return `The camera is elevated far above ${terms.cameraTarget} and tilted downward, showing ${terms.cameraTarget} within the surrounding ground plane.`;
    case 'topDown':
      return `The camera is positioned directly above ${terms.cameraTarget} and points vertically downward, creating a flattened top-down composition.`;
    default:
      return '';
  }
}

function resolveSidePostureLead(poseBaseId, subjectKind) {
  if (subjectKind === 'subject') return 'The subject is positioned';
  if (poseBaseId === 'standing') return 'She stands';
  if (poseBaseId === 'sitting') return 'She sits';
  if (poseBaseId === 'kneeling') return 'She kneels';
  if (poseBaseId === 'squatting') return 'She squats';
  if (poseBaseId === 'lying') return 'She lies';
  return 'She is positioned';
}

function buildStrictSideText(orbitKey, cropGroup, subjectKind, poseBaseId) {
  const rule = SIDE_ORBIT_RULES[orbitKey];
  if (!rule) return '';
  const terms = resolveSubjectTerms(subjectKind);
  const postureLead = resolveSidePostureLead(poseBaseId, subjectKind);
  const side = rule.visibleSide;
  const hidden = rule.hiddenSide;
  const opening = `${postureLead} completely sideways, facing the ${rule.facingEdge} edge of the image.`;

  if (cropGroup === 'face') {
    return `${opening} The camera sees only the ${side} side of ${terms.possessive === 'her' ? 'her face' : "the subject's face"}. ${terms.possessive.charAt(0).toUpperCase()}${terms.possessive.slice(1)} nose, lips, and chin form one clean side contour. This is a strict 90-degree lateral facial view.`;
  }

  const visibleRegion = cropGroup === 'upper'
    ? 'upper body'
    : 'body';
  const silhouetteRange = cropGroup === 'upper'
    ? 'head to upper torso'
    : cropGroup === 'medium'
      ? 'head to waist'
      : cropGroup === 'cowboy'
        ? 'head to mid-thigh'
        : cropGroup === 'full'
          ? 'head to feet'
          : 'shoulders through pelvis';
  const shoulderText = `${terms.possessive.charAt(0).toUpperCase()}${terms.possessive.slice(1)} ${side} shoulder fully hides ${terms.possessive} ${hidden} shoulder`;
  const hipText = ['cowboy', 'full', 'body'].includes(cropGroup)
    ? `, and ${terms.possessive} ${side} hip fully hides ${terms.possessive} ${hidden} hip`
    : '';

  return `${opening} The camera sees only the ${side} side of ${terms.possessive === 'her' ? `her ${visibleRegion}` : `the subject's ${visibleRegion}`}. ${shoulderText}${hipText}, creating one narrow side silhouette from ${silhouetteRange}. This is a strict 90-degree lateral body view.`;
}

function resolveSubjectLanguage(value, subjectKind) {
  if (subjectKind !== 'subject') return value;
  return value
    .replaceAll("woman's", "subject's")
    .replace(/\bHer\b/g, "The subject's")
    .replace(/\bher\b/g, "the subject's");
}

export function buildZImageTurboCameraGeometry({
  angle = null,
  orbit = null,
  bucket = COMPOSITION_VISIBILITY_BUCKETS.UNCONSTRAINED,
  subjectKind = 'woman',
  poseBaseId = '',
} = {}) {
  const orbitKey = resolveOrbitKey(orbit);
  const angleKey = resolveAngleKey(angle);
  const cropGroup = CROP_GROUP_BY_BUCKET[bucket] || 'body';
  const angleText = buildCameraAngleText(angleKey, cropGroup, subjectKind);
  const strictSideText = buildStrictSideText(orbitKey, cropGroup, subjectKind, poseBaseId);
  if (strictSideText) return [angleText, strictSideText].filter(Boolean).join(' ');
  const cameraOpening = CAMERA_OPENING_BY_ORBIT[orbitKey];
  const geometry = GEOMETRY_BY_CROP[cropGroup]?.[orbitKey];
  const orbitText = cameraOpening && geometry
    ? resolveSubjectLanguage(`${cameraOpening}. ${geometry}.`, subjectKind)
    : '';
  return [angleText, orbitText].filter(Boolean).join(' ');
}

export function getZImageTurboCameraProjectionFlags({ angle = null, orbit = null } = {}) {
  return {
    replacesAngleDescriptor: Boolean(resolveAngleKey(angle)),
    replacesOrbitDescriptor: Boolean(SIDE_ORBIT_RULES[resolveOrbitKey(orbit)]),
  };
}

export function buildZImageTurboSidePoseDepth({
  orbit = null,
  poseHandId = '',
  subjectKind = 'woman',
} = {}) {
  if (!SIDE_ORBIT_RULES[resolveOrbitKey(orbit)] || !['hands-grip-waistband', 'hands-lift-waistband'].includes(poseHandId)) return '';
  if (subjectKind === 'subject') {
    return "Keeping the subject's torso completely sideways, both hands meet at the front waistband and overlap in depth from this side view, with one elbow nearer the camera and the other positioned behind it.";
  }
  return 'Keeping her torso completely sideways, both hands meet at the front waistband and overlap in depth from this side view, with one elbow nearer the camera and the other positioned behind it.';
}

export const Z_IMAGE_TURBO_CAMERA_ORBIT_KEYS = ORBIT_KEYS;

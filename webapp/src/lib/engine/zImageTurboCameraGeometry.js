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

const GEOMETRY_BY_CROP = Object.freeze({
  face: Object.freeze({
    front: 'Her full face plane is square to the lens, with both cheeks balanced in a frontal facial view',
    frontLeft: 'Her left cheek is nearer the lens, with the right cheek still visible in a front-left three-quarter facial view',
    left: 'Her left cheek and left ear are nearest the lens, forming a clear left facial profile',
    rearLeft: 'The rear-left side of her head and left ear are nearest the lens, forming a rear-left head angle',
    back: 'The back of her head faces the lens in a clear rear head view',
    rearRight: 'The rear-right side of her head and right ear are nearest the lens, forming a rear-right head angle',
    right: 'Her right cheek and right ear are nearest the lens, forming a clear right facial profile',
    frontRight: 'Her right cheek is nearer the lens, with the left cheek still visible in a front-right three-quarter facial view',
  }),
  upper: Object.freeze({
    front: 'Her chest and both shoulders face the lens in a frontal upper-body silhouette',
    frontLeft: 'Her left shoulder is nearer the lens, with her upper torso forming a front-left three-quarter silhouette',
    left: 'Her left shoulder is nearest the lens, with her upper torso forming a clearly side-on silhouette',
    rearLeft: 'Her left shoulder blade is nearer the lens, with her upper back forming a rear-left three-quarter silhouette',
    back: 'Her upper back and rear shoulders face the lens in a rear-facing upper-body silhouette',
    rearRight: 'Her right shoulder blade is nearer the lens, with her upper back forming a rear-right three-quarter silhouette',
    right: 'Her right shoulder is nearest the lens, with her upper torso forming a clearly side-on silhouette',
    frontRight: 'Her right shoulder is nearer the lens, with her upper torso forming a front-right three-quarter silhouette',
  }),
  medium: Object.freeze({
    front: 'Her chest, torso, and waist face the lens in a frontal waist-up silhouette',
    frontLeft: 'Her left shoulder and left waist are nearer the lens, with her torso forming a front-left three-quarter silhouette',
    left: 'Her left shoulder is nearest the lens, with her torso and waist forming a clearly side-on silhouette',
    rearLeft: 'Her left shoulder blade and left waist are nearer the lens, with her torso forming a rear-left three-quarter silhouette',
    back: 'Her back, rear shoulders, and waist face the lens in a rear-facing waist-up silhouette',
    rearRight: 'Her right shoulder blade and right waist are nearer the lens, with her torso forming a rear-right three-quarter silhouette',
    right: 'Her right shoulder is nearest the lens, with her torso and waist forming a clearly side-on silhouette',
    frontRight: 'Her right shoulder and right waist are nearer the lens, with her torso forming a front-right three-quarter silhouette',
  }),
  cowboy: Object.freeze({
    front: 'Her chest and pelvis face the lens, with her torso, hips, and thighs forming a frontal knee-up silhouette',
    frontLeft: 'Her left shoulder and left hip are nearer the lens, with her torso and thighs forming a front-left three-quarter silhouette',
    left: 'Her left shoulder and left hip are nearest the lens, with her torso and thighs forming a clearly side-on silhouette',
    rearLeft: 'Her left shoulder blade and left hip are nearer the lens, with her back and thighs forming a rear-left three-quarter silhouette',
    back: 'Her back, rear shoulders, and rear pelvis face the lens, with her thighs forming a rear-facing knee-up silhouette',
    rearRight: 'Her right shoulder blade and right hip are nearer the lens, with her back and thighs forming a rear-right three-quarter silhouette',
    right: 'Her right shoulder and right hip are nearest the lens, with her torso and thighs forming a clearly side-on silhouette',
    frontRight: 'Her right shoulder and right hip are nearer the lens, with her torso and thighs forming a front-right three-quarter silhouette',
  }),
  full: Object.freeze({
    front: 'Her chest and pelvis face the lens, with both shoulders, both hips, legs, and feet forming a frontal full-body silhouette',
    frontLeft: 'Her left shoulder and left hip are nearer the lens, with her chest, pelvis, legs, and feet forming a front-left three-quarter silhouette',
    left: 'Her left shoulder and left hip are nearest the lens, with her torso, legs, and feet forming a clearly side-on silhouette',
    rearLeft: 'Her left shoulder blade and left hip are nearer the lens, with her back, legs, and feet forming a rear-left three-quarter silhouette',
    back: 'Her back, rear shoulders, and rear pelvis face the lens, with both legs and feet forming a rear-facing full-body silhouette',
    rearRight: 'Her right shoulder blade and right hip are nearer the lens, with her back, legs, and feet forming a rear-right three-quarter silhouette',
    right: 'Her right shoulder and right hip are nearest the lens, with her torso, legs, and feet forming a clearly side-on silhouette',
    frontRight: 'Her right shoulder and right hip are nearer the lens, with her chest, pelvis, legs, and feet forming a front-right three-quarter silhouette',
  }),
  body: Object.freeze({
    front: 'Her chest and pelvis face the lens in a frontal body orientation',
    frontLeft: 'Her left shoulder and left hip are nearer the lens, with her torso forming a front-left three-quarter orientation',
    left: 'Her left shoulder and left hip are nearest the lens, with her torso forming a clearly side-on orientation',
    rearLeft: 'Her left shoulder blade and left hip are nearer the lens, with her torso remaining rear-left facing',
    back: 'Her back, rear shoulders, and rear pelvis face the lens in a rear-facing body orientation',
    rearRight: 'Her right shoulder blade and right hip are nearer the lens, with her torso remaining rear-right facing',
    right: 'Her right shoulder and right hip are nearest the lens, with her torso forming a clearly side-on orientation',
    frontRight: 'Her right shoulder and right hip are nearer the lens, with her torso forming a front-right three-quarter orientation',
  }),
});

function resolveOrbitKey(orbit) {
  const label = String(orbit?.zh || '').trim();
  if (!label || label === '全無') return '';
  return ORBIT_KEY_BY_ZH_PREFIX.find(([prefix]) => label.startsWith(prefix))?.[1] || '';
}

function resolveSubjectLanguage(value, subjectKind) {
  if (subjectKind !== 'subject') return value;
  return value
    .replaceAll("woman's", "subject's")
    .replace(/\bHer\b/g, "The subject's")
    .replace(/\bher\b/g, "the subject's");
}

export function buildZImageTurboCameraGeometry({
  orbit = null,
  bucket = COMPOSITION_VISIBILITY_BUCKETS.UNCONSTRAINED,
  subjectKind = 'woman',
} = {}) {
  const orbitKey = resolveOrbitKey(orbit);
  const cropGroup = CROP_GROUP_BY_BUCKET[bucket] || 'body';
  const cameraOpening = CAMERA_OPENING_BY_ORBIT[orbitKey];
  const geometry = GEOMETRY_BY_CROP[cropGroup]?.[orbitKey];
  if (!cameraOpening || !geometry) return '';
  return resolveSubjectLanguage(`${cameraOpening}. ${geometry}.`, subjectKind);
}

export const Z_IMAGE_TURBO_CAMERA_ORBIT_KEYS = ORBIT_KEYS;

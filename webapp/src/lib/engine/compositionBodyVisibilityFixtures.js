import { BODY_TYPE_CATALOG_V2 } from './bodyTypeCatalogFixtures.js';

/**
 * Desired PAGE1 body-visibility behavior.
 *
 * Phase 1 established these target records. Phase 2 activated normal-single
 * projection, phase 3 activated the same shared policy for compatibility
 * sources, and phase 4 promotes the complete behavior to a blocking public
 * framing matrix without changing renderer output.
 */

export const COMPOSITION_BODY_VISIBILITY_ZONES = Object.freeze([
  'chest',
  'torso',
  'waist',
  'abdomen',
  'hips',
]);

export const EXPECTED_BODY_VISIBILITY_POLICY_BY_BUCKET = Object.freeze({
  faceDetail: Object.freeze({ mode: 'omit', zones: Object.freeze([]) }),
  headShoulders: Object.freeze({ mode: 'omit', zones: Object.freeze([]) }),
  chestUp: Object.freeze({ mode: 'visibleZones', zones: Object.freeze(['chest']) }),
  mediumWaist: Object.freeze({
    mode: 'visibleZones',
    zones: Object.freeze(['chest', 'torso', 'waist', 'abdomen']),
  }),
  cowboyKnee: Object.freeze({
    mode: 'visibleZones',
    zones: Object.freeze(['chest', 'torso', 'waist', 'abdomen', 'hips']),
  }),
  fullBody: Object.freeze({ mode: 'fullSource', zones: Object.freeze(['all']) }),
  unconstrained: Object.freeze({ mode: 'fullSource', zones: Object.freeze(['all']) }),
  fixedComposition: Object.freeze({ mode: 'fullSource', zones: Object.freeze(['all']) }),
});

/**
 * Phase 4 promotes the completed runtime behavior to one blocking public
 * framing matrix. Keep every user-facing framing label here so aliases that
 * share a bucket cannot silently drift apart.
 */
export const BODY_VISIBILITY_PHASE4_INTEGRATION_MATRIX = Object.freeze({
  publicFramings: Object.freeze([
    Object.freeze({ framingZh: '全無', bucket: 'unconstrained' }),
    Object.freeze({ framingZh: '半臉傾斜特寫', bucket: 'headShoulders' }),
    Object.freeze({ framingZh: '局部五官特寫', bucket: 'faceDetail' }),
    Object.freeze({ framingZh: '臉部特寫', bucket: 'faceDetail' }),
    Object.freeze({ framingZh: '特寫鏡頭 (Close-Up)', bucket: 'headShoulders' }),
    Object.freeze({ framingZh: '胸上特寫', bucket: 'chestUp' }),
    Object.freeze({ framingZh: '中景鏡頭 (Medium Shot)', bucket: 'mediumWaist' }),
    Object.freeze({ framingZh: '牛仔中景 (Cowboy Shot)', bucket: 'cowboyKnee' }),
    Object.freeze({ framingZh: '全身鏡頭 (Full Body Shot)', bucket: 'fullBody' }),
    Object.freeze({ framingZh: '全臉傾斜特寫', bucket: 'headShoulders' }),
    Object.freeze({ framingZh: '頭部主導近景', bucket: 'chestUp' }),
  ]),
  fixedComposition: Object.freeze({
    fixedSetZh: '暖灰泥黑絲絨工業沙發棚',
    bucket: 'fixedComposition',
  }),
  duoProfiles: Object.freeze({
    a: '高挑時裝模特',
    b: '柔和沙漏身形',
  }),
  characterCards: 'all-formal',
  specialOutfitPersonDetailPattern: 'tattoos?',
});

export const BODY_TYPE_VISIBILITY_PROFILES = Object.freeze(BODY_TYPE_CATALOG_V2.map(item => Object.freeze({
  bodyTypeZh: item.zh,
  fullSource: item.en,
  expectedTextByBucket: Object.freeze(Object.fromEntries(
    Object.keys(EXPECTED_BODY_VISIBILITY_POLICY_BY_BUCKET).map(bucket => [bucket, item.en])
  )),
})));

export const COMPOSITION_BODY_VISIBILITY_REGRESSION_FIXTURES = Object.freeze([
  {
    id: 'body-face-detail-omit',
    coverage: ['single', 'normalBodyType', 'faceDetail', 'selectionPreservation'],
    seed: 'composition-body-face-detail-v1',
    locks: {
      subjectCount: '1',
      framingId: { byZh: '臉部特寫' },
      bodyTypeId: { byZh: '柔和沙漏身形' },
      facialFeaturesId: { byZh: '日系清透臉' },
      eyewearId: { byZh: '細框眼鏡' },
    },
    expectedProjection: {
      bucket: 'faceDetail',
      profileZh: '柔和沙漏身形',
      bodyText: 'C–D cup bust, soft proportionate arms, gently defined waist, slightly low waistline, rounded wider hips, moderately full thighs, tapered calves, slightly long torso, balanced legs, soft hourglass silhouette; height 165–170 cm, bust–waist–hip 90–62–94 cm',
      preserveRawLockKeys: ['bodyTypeId', 'facialFeaturesId', 'eyewearId'],
      preserveNonBodyGroups: ['faceIdentity', 'skin', 'makeup', 'hair', 'faceAccessories'],
      fullBodyCharacterUsesFullSource: true,
    },
  },
  {
    id: 'body-head-shoulders-omit',
    coverage: ['single', 'normalBodyType', 'headShoulders', 'selectionPreservation'],
    seed: 'composition-body-head-shoulders-v1',
    locks: {
      subjectCount: '1',
      framingId: { byZh: '特寫鏡頭 (Close-Up)' },
      bodyTypeId: { byZh: '性感曲線身形' },
      facialFeaturesId: { byZh: '成熟性感臉' },
      earringsId: { byZh: '十字垂墜耳環' },
    },
    expectedProjection: {
      bucket: 'headShoulders',
      profileZh: '性感曲線身形',
      bodyText: 'F–G cup bust, lean limbs, narrow defined waist, rounded hips, long legs, dramatic lean hourglass silhouette; height 168–173 cm, bust–waist–hip 94–58–92 cm',
      preserveRawLockKeys: ['bodyTypeId', 'facialFeaturesId', 'earringsId'],
      preserveNonBodyGroups: ['faceIdentity', 'skin', 'makeup', 'hair', 'faceAccessories'],
      fullBodyCharacterUsesFullSource: true,
    },
  },
  {
    id: 'body-chest-up-visible-zone',
    coverage: ['single', 'normalBodyType', 'chestUp', 'selectionPreservation'],
    seed: 'composition-body-chest-up-v1',
    locks: {
      subjectCount: '1',
      framingId: { byZh: '胸上特寫' },
      bodyTypeId: { byZh: '性感曲線身形' },
    },
    expectedProjection: {
      bucket: 'chestUp',
      profileZh: '性感曲線身形',
      bodyText: 'F–G cup bust, lean limbs, narrow defined waist, rounded hips, long legs, dramatic lean hourglass silhouette; height 168–173 cm, bust–waist–hip 94–58–92 cm',
      preserveRawLockKeys: ['bodyTypeId'],
      preserveNonBodyGroups: ['faceIdentity', 'skin', 'makeup', 'hair', 'faceAccessories'],
      fullBodyCharacterUsesFullSource: true,
    },
  },
  {
    id: 'body-medium-waist-visible-zones',
    coverage: ['single', 'normalBodyType', 'mediumWaist', 'selectionPreservation'],
    seed: 'composition-body-medium-v1',
    locks: {
      subjectCount: '1',
      framingId: { byZh: '中景鏡頭 (Medium Shot)' },
      bodyTypeId: { byZh: '柔和沙漏身形' },
    },
    expectedProjection: {
      bucket: 'mediumWaist',
      profileZh: '柔和沙漏身形',
      bodyText: 'C–D cup bust, soft proportionate arms, gently defined waist, slightly low waistline, rounded wider hips, moderately full thighs, tapered calves, slightly long torso, balanced legs, soft hourglass silhouette; height 165–170 cm, bust–waist–hip 90–62–94 cm',
      preserveRawLockKeys: ['bodyTypeId'],
      preserveNonBodyGroups: ['faceIdentity', 'skin', 'makeup', 'hair', 'faceAccessories'],
      fullBodyCharacterUsesFullSource: true,
    },
  },
  {
    id: 'body-cowboy-hip-visible-zones',
    coverage: ['single', 'normalBodyType', 'cowboyKnee', 'selectionPreservation'],
    seed: 'composition-body-cowboy-v1',
    locks: {
      subjectCount: '1',
      framingId: { byZh: '牛仔中景 (Cowboy Shot)' },
      bodyTypeId: { byZh: '柔和沙漏身形' },
    },
    expectedProjection: {
      bucket: 'cowboyKnee',
      profileZh: '柔和沙漏身形',
      bodyText: 'C–D cup bust, soft proportionate arms, gently defined waist, slightly low waistline, rounded wider hips, moderately full thighs, tapered calves, slightly long torso, balanced legs, soft hourglass silhouette; height 165–170 cm, bust–waist–hip 90–62–94 cm',
      preserveRawLockKeys: ['bodyTypeId'],
      preserveNonBodyGroups: ['faceIdentity', 'skin', 'makeup', 'hair', 'faceAccessories'],
      fullBodyCharacterUsesFullSource: true,
    },
  },
  {
    id: 'body-full-source',
    coverage: ['single', 'normalBodyType', 'fullBody', 'selectionPreservation'],
    seed: 'composition-body-full-v1',
    locks: {
      subjectCount: '1',
      framingId: { byZh: '全身鏡頭 (Full Body Shot)' },
      bodyTypeId: { byZh: '柔和沙漏身形' },
    },
    expectedProjection: {
      bucket: 'fullBody',
      profileZh: '柔和沙漏身形',
      bodyText: 'C–D cup bust, soft proportionate arms, gently defined waist, slightly low waistline, rounded wider hips, moderately full thighs, tapered calves, slightly long torso, balanced legs, soft hourglass silhouette; height 165–170 cm, bust–waist–hip 90–62–94 cm',
      preserveRawLockKeys: ['bodyTypeId'],
      preserveNonBodyGroups: ['faceIdentity', 'skin', 'makeup', 'hair', 'faceAccessories'],
      fullBodyCharacterUsesFullSource: true,
    },
  },
  {
    id: 'body-medium-duo-role-projection',
    coverage: ['duo', 'normalBodyType', 'mediumWaist', 'selectionPreservation'],
    seed: 'composition-body-duo-v1',
    locks: {
      subjectCount: '2',
      framingId: { byZh: '中景鏡頭 (Medium Shot)' },
      bodyTypeAId: { byZh: '高挑時裝模特' },
      bodyTypeBId: { byZh: '柔和沙漏身形' },
    },
    expectedProjection: {
      bucket: 'mediumWaist',
      roleProfiles: Object.freeze({ a: '高挑時裝模特', b: '柔和沙漏身形' }),
      roleBodyText: Object.freeze({
        a: 'A–B cup bust, narrow ribcage, slim arms and legs, narrow waist, high waistline, slightly wider hips, short torso, long legs, tall slender model silhouette; height 170–175 cm, bust–waist–hip 80–58–88 cm',
        b: 'C–D cup bust, soft proportionate arms, gently defined waist, slightly low waistline, rounded wider hips, moderately full thighs, tapered calves, slightly long torso, balanced legs, soft hourglass silhouette; height 165–170 cm, bust–waist–hip 90–62–94 cm',
      }),
      preserveRawLockKeys: ['bodyTypeAId', 'bodyTypeBId'],
      preserveNonBodyGroups: ['faceIdentity', 'skin', 'makeup', 'hair', 'faceAccessories'],
      fullBodyCharacterUsesFullSource: false,
    },
  },
  {
    id: 'body-face-detail-character-card',
    coverage: ['single', 'characterCard', 'faceDetail', 'selectionPreservation'],
    seed: 'composition-body-character-card-v1',
    locks: {
      subjectCount: '1',
      characterProfileId: 'character-rika',
      framingId: { byZh: '臉部特寫' },
    },
    expectedProjection: {
      bucket: 'faceDetail',
      characterBodySource: 'slim petite casual-fashion proportions with a narrow waist',
      bodyText: '',
      preserveRawLockKeys: ['characterProfileId'],
      preserveNonBodyGroups: ['facialGeometry', 'eyeSignature', 'noseSignature', 'mouthSignature', 'skinSignature', 'makeup', 'distinctiveFeatures', 'hair'],
      fullBodyCharacterUsesFullSource: true,
    },
  },
  {
    id: 'body-chest-up-special-outfit-person-details',
    coverage: ['single', 'specialOutfit', 'chestUp', 'selectionPreservation'],
    seed: 'composition-body-special-outfit-v1',
    locks: {
      subjectCount: '1',
      framingId: { byZh: '胸上特寫' },
      bodyTypeId: { byZh: '運動緊實身形' },
      specialOutfitId: { byZh: '白襯衫黑色長裙細領帶造型' },
    },
    expectedProjection: {
      bucket: 'chestUp',
      profileZh: '運動緊實身形',
      bodyText: 'moderate bust, level shoulders, prominent collarbones, slim lightly toned arms, slender firm waist, flat toned abdomen, rounded lifted glutes of moderate size, slightly thicker firm thighs, firm calves, balanced proportions, straight-lined slim athletic silhouette; height 165–170 cm, bust–waist–hip 86–64–92 cm',
      preserveRawLockKeys: ['bodyTypeId', 'specialOutfitId'],
      preserveNonBodyGroups: ['specialOutfitHair', 'tattoos', 'faceIdentity', 'skin', 'makeup', 'hair'],
      fullBodyCharacterUsesFullSource: true,
    },
  },
]);

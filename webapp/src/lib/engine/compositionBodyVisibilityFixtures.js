/**
 * Desired PAGE1 body-visibility behavior.
 *
 * Phase 1 established these target records. Phase 2 activated normal-single
 * projection, and phase 3 activates the same shared policy for duo roles,
 * Character Cards, and special-outfit person details before public formatting.
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

function createBodyTypeProfile({
  bodyTypeZh,
  fullSource,
  chestUp,
  mediumWaist,
  cowboyKnee,
}) {
  return Object.freeze({
    bodyTypeZh,
    fullSource,
    expectedTextByBucket: Object.freeze({
      faceDetail: '',
      headShoulders: '',
      chestUp,
      mediumWaist,
      cowboyKnee,
      fullBody: fullSource,
      unconstrained: fullSource,
      fixedComposition: fullSource,
    }),
  });
}

export const BODY_TYPE_VISIBILITY_PROFILES = Object.freeze([
  createBodyTypeProfile({
    bodyTypeZh: '高挑時裝模特',
    fullSource: 'tall slim fashion body, about 170-175 cm visual height, 80-58-88 body proportion anchor, long legs with about 3.5:6.5 torso-to-leg balance, shorter upper torso, high waistline, narrow ribcage, gently wider hips, clean editorial silhouette',
    chestUp: 'narrow ribcage',
    mediumWaist: 'shorter upper torso, high waistline, narrow ribcage',
    cowboyKnee: '80-58-88 body proportion anchor, high waistline, narrow ribcage, gently wider hips, shorter upper torso',
  }),
  createBodyTypeProfile({
    bodyTypeZh: '一般基本體型',
    fullSource: 'natural basic body, about 160-165 cm visual height, 83-62-88 body proportion anchor, balanced torso-to-leg ratio around 4:6, low-contrast waist curve, modest bust and hips, smooth natural silhouette',
    chestUp: 'modest bust',
    mediumWaist: 'modest bust, low-contrast waist curve',
    cowboyKnee: '83-62-88 body proportion anchor, modest bust and hips, low-contrast waist curve, smooth natural silhouette',
  }),
  createBodyTypeProfile({
    bodyTypeZh: '柔和沙漏身形',
    fullSource: 'soft natural hourglass body, about 165-170 cm visual height, 90-62-94 body proportion anchor, balanced torso-to-leg ratio around 4:6, longer upper torso, lower waistline, fuller bust, wider hips, elongated abdomen with subtle contour lines',
    chestUp: 'fuller bust',
    mediumWaist: 'longer upper torso, lower waistline, fuller bust, elongated abdomen with subtle contour lines',
    cowboyKnee: '90-62-94 body proportion anchor, fuller bust, lower waistline, wider hips, longer upper torso, elongated abdomen with subtle contour lines',
  }),
  createBodyTypeProfile({
    bodyTypeZh: '性感曲線身形',
    fullSource: 'sexy tall slim-curvy silhouette, about 168-173 cm visual height and 53-58 kg lean visual weight, 94-58-92 body proportion anchor, long legs with about 3.8:6.2 torso-to-leg balance, full F-to-G-cup-scale bust, narrow defined waist, rounded hips, flat abdomen, dramatic but lean bust-waist-hip curve',
    chestUp: 'full bust',
    mediumWaist: 'full bust, narrow defined waist, flat abdomen',
    cowboyKnee: '94-58-92 body proportion anchor, full bust, narrow defined waist, rounded hips, flat abdomen, dramatic but lean bust-waist-hip curve',
  }),
  createBodyTypeProfile({
    bodyTypeZh: '運動緊實身形',
    fullSource: 'fit toned athletic female body, healthy firm silhouette, subtle muscle definition, energetic balanced proportions',
    chestUp: 'fit toned athletic upper body, subtle muscle definition',
    mediumWaist: 'fit toned athletic upper body, healthy firm silhouette, subtle muscle definition',
    cowboyKnee: 'fit toned athletic body, healthy firm silhouette, subtle muscle definition, energetic balanced proportions',
  }),
  createBodyTypeProfile({
    bodyTypeZh: '小隻精緻身形',
    fullSource: 'petite polished female body, compact refined proportions, delicate idol-like silhouette, graceful small-frame presence',
    chestUp: 'compact refined upper-body proportions, graceful small-frame presence',
    mediumWaist: 'compact refined upper-body proportions, graceful small-frame presence',
    cowboyKnee: 'petite polished body, compact refined proportions, delicate idol-like silhouette, graceful small-frame presence',
  }),
]);

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
      bodyText: '',
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
      bodyText: '',
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
      bodyText: 'full bust',
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
      bodyText: 'longer upper torso, lower waistline, fuller bust, elongated abdomen with subtle contour lines',
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
      bodyText: '90-62-94 body proportion anchor, fuller bust, lower waistline, wider hips, longer upper torso, elongated abdomen with subtle contour lines',
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
      bodyText: 'soft natural hourglass body, about 165-170 cm visual height, 90-62-94 body proportion anchor, balanced torso-to-leg ratio around 4:6, longer upper torso, lower waistline, fuller bust, wider hips, elongated abdomen with subtle contour lines',
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
      bodyTypeBId: { byZh: '一般基本體型' },
    },
    expectedProjection: {
      bucket: 'mediumWaist',
      roleProfiles: Object.freeze({ a: '高挑時裝模特', b: '一般基本體型' }),
      roleBodyText: Object.freeze({
        a: 'shorter upper torso, high waistline, narrow ribcage',
        b: 'modest bust, low-contrast waist curve',
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
      bodyText: 'fit toned athletic upper body, subtle muscle definition',
      preserveRawLockKeys: ['bodyTypeId', 'specialOutfitId'],
      preserveNonBodyGroups: ['specialOutfitHair', 'tattoos', 'faceIdentity', 'skin', 'makeup', 'hair'],
      fullBodyCharacterUsesFullSource: true,
    },
  },
]);

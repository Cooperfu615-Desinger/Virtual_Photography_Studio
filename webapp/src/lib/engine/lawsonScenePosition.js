export const LAWSON_INDOOR = '室內：日本 Lawson 便利商店內';
export const LAWSON_OUTDOOR = '戶外：日本 Lawson 便利商店門口';

export const isLawsonLocation = (name) => name === LAWSON_INDOOR || name === LAWSON_OUTDOOR;

const CHAIR_ARRANGEMENTS = new Set(['none', '', 'model-natural-body-arrangement', 'sitting-natural',
  'sitting-forward-lean', 'sitting-slouched', 'sitting-leg-cross', 'sitting-open-confident']);
const GROUNDED_STANDING = new Set(['none', '', 'standing-natural', 'standing-one-leg-weight',
  'standing-pelvis-back-curve', 'standing-forward-lean', 'standing-crossed-legs', 'standing-narrow-side',
  'standing-feet-together-soft-knees', 'standing-wide-weight-shift']);

// This is a scene projection, never an update to the user's pose or support.
export function resolveLawsonScenePosition({ locationName, mode, eligible, pose = {} }) {
  if (!eligible || mode === 'free' || !isLawsonLocation(locationName)) return '';
  let { poseBaseId: base, poseArrangementId: arrangement, poseAnchorId: anchor, poseHandId: hand } = pose;
  // The current action library supersedes the old composer UI. Reuse the same
  // reviewed arrangements while leaving every selected action untouched.
  if (pose.specifiedActionId) {
    const id = pose.specifiedActionId;
    if (id.startsWith('specified-sitting-')) {
      arrangement = id.replace('specified-', '');
      if (['specified-sitting-side-fold-back-support', 'specified-sitting-raised-right-knee',
        'specified-sitting-hug-knees'].includes(id)) anchor = 'sitting-ground';
    } else if (id.startsWith('specified-standing-')) {
      arrangement = id.replace('specified-', '');
      if (['specified-standing-back-lean', 'specified-standing-shoulder-lean'].includes(id)) anchor = 'shared-vertical-surface-support';
    } else if (!id.startsWith('specified-squatting-') && !id.startsWith('specified-kneeling-')) {
      return '';
    }
  }
  if (anchor === 'shared-vertical-surface-support') {
    return locationName === LAWSON_INDOOR ? 'indoor-cooler'
      : base === 'standing' && GROUNDED_STANDING.has(arrangement || '') ? 'outside-standing' : 'outside-pavement';
  }
  if (locationName === LAWSON_OUTDOOR && base === 'sitting' && anchor === 'sitting-ground') return 'outside-pavement';
  if (anchor && anchor !== 'none') return '';
  if (locationName === LAWSON_INDOOR) {
    if (base === 'sitting') {
      if (!CHAIR_ARRANGEMENTS.has(arrangement || '') || hand === 'one-hand-ground-one-leg') return '';
      return 'window-seat';
    }
    if (base === 'standing') return arrangement === 'standing-forward-lean' ? 'indoor-open' : 'indoor-aisle';
    if (base === 'squatting') return 'indoor-aisle';
    if (base === 'kneeling') return 'indoor-open';
    return '';
  }
  if (base === 'standing') return GROUNDED_STANDING.has(arrangement || '') ? 'outside-standing' : 'outside-pavement';
  if (['squatting', 'kneeling'].includes(base)) return 'outside-pavement';
  return '';
}

export function lawsonPositionClause(position) {
  return {
    'window-seat': 'the subject seated on a stool at the in-store eating area next to a narrow counter running along the inside of the front window',
    'indoor-aisle': 'the subject near the merchandise shelves and refrigerated drink cases',
    'indoor-open': 'the subject in an open area of the store',
    'indoor-cooler': 'the subject near the side of a refrigerated drink case',
    'outside-pavement': 'the subject on the sidewalk beside the storefront',
    'outside-standing': 'the subject standing with both feet on the paved pedestrian sidewalk beside the storefront on the store side of the curb',
  }[position] || '';
}

/** Support is resolved before visibility projection; a crop never changes it. */
export const KNEELING_SUPPORT_HAND_IDS = Object.freeze([
  'hands-palms-planted-ground',
  'hands-elbows-planted-ground',
]);
export const DEFAULT_KNEELING_SUPPORT_HAND_ID = KNEELING_SUPPORT_HAND_IDS[0];
export const isKneelingSupportHand = id => KNEELING_SUPPORT_HAND_IDS.includes(id);
export const isFourPointKneeling = locks => locks?.subjectCount !== '2'
  && locks?.poseBaseId === 'kneeling' && locks?.poseArrangementId === 'kneeling-all-fours';

export function resolveKneelingSupportArrangement(arrangement, handId) {
  const variant = arrangement?.meta?.supportVariants?.[handId];
  return variant ? {
    ...arrangement,
    en: variant.en,
    meta: { ...arrangement.meta, projectionByBucket: variant.projectionByBucket },
  } : arrangement;
}

/** Only actual pose-control edits bind support. Restored explicit legacy locks
 * survive unrelated edits; no persisted schema or import migration is needed. */
export function reconcileKneelingSupportLocks(previous, candidate) {
  const next = { ...candidate };
  const entering = isFourPointKneeling(next) && !isFourPointKneeling(previous);
  const edited = ['poseBaseId', 'poseArrangementId', 'poseHandId', 'posePropId']
    .some(key => next[key] !== previous[key]);
  if (isFourPointKneeling(next) && edited) {
    if (entering || !isKneelingSupportHand(next.poseHandId)) {
      next.poseHandId = DEFAULT_KNEELING_SUPPORT_HAND_ID;
    }
    next.posePropId = 'none';
  } else if (isFourPointKneeling(previous) && !isFourPointKneeling(next)
    && isKneelingSupportHand(next.poseHandId) && next.poseHandId === previous.poseHandId) {
    next.poseHandId = 'none';
  }
  return next;
}

export function buildKneelingSupportControl(control, locks) {
  if (!isFourPointKneeling(locks) || !['poseHandId', 'posePropId'].includes(control.key)) return control;
  const allowed = control.key === 'poseHandId' ? KNEELING_SUPPORT_HAND_IDS : ['none'];
  // The selected historical value remains visible for legacy restore, matching
  // the existing hidden-option policy. New selections have only two supports.
  const legacySelected = locks[control.key] && !allowed.includes(locks[control.key]);
  return { ...control, suppressDefaultRandomOption: true,
    options: control.options.filter(option => allowed.includes(option.id)
      || (legacySelected && option.id === locks[control.key])) };
}

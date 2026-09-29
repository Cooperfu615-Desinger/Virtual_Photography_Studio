export const FULLY_CLOSED_OPENING_ID = 'wardrobe:外套開合-outerwear-opening:fully-closed:5';
export const PULL_OPEN_HAND_ID = 'hands-pull-open-off-shoulder-outerwear';

export function isFullyClosedOpening(itemOrId) {
  return String(typeof itemOrId === 'string' ? itemOrId : itemOrId?.id || '').replace(/:[ab]$/, '') === FULLY_CLOSED_OPENING_ID;
}

export function closedInnerLayerIsVisible(outerwear) {
  return outerwear?.meta?.outerwear?.closedInnerLayerVisibility === 'through-fabric';
}

export function fullyClosedOuterwearText(outerwear) {
  const fasteners = outerwear?.meta?.outerwear?.fasteners || [];
  const closure = fasteners.includes('zip') ? 'front zipper fully zipped closed'
    : fasteners.includes('button') ? /snap buttons/i.test(outerwear.en || '')
      ? 'all front snap buttons fastened' : 'all front buttons fastened'
    : 'front fully fastened closed';
  return closedInnerLayerIsVisible(outerwear)
    ? `${closure}, inner layer visible through the closed translucent fabric`
    : closure;
}

// UI and restored selections use the same conflict policy. Hidden styling stays
// in the source locks, so reopening the jacket restores the previous selection.
export function prepareOuterwearClosureControl(control, locks) {
  const styling = control.key.match(/^outerwear([AB]?)StylingId$/);
  if (styling && isFullyClosedOpening(locks[`outerwear${styling[1]}OpeningId`])) {
    return { ...control, closureDisabled: true,
      closureDisplayValue: control.options.find(o => o.zh === '全無')?.id || 'none',
      helpText: '全扣上／全拉上時，外套穿法固定為全無。' };
  }
  if (control.key === 'poseHandId' && isFullyClosedOpening(locks.outerwearOpeningId)) {
    return { ...control, options: control.options.map(o => o.id === PULL_OPEN_HAND_ID ? { ...o, disabled: true } : o) };
  }
  if (control.key === 'outerwearOpeningId' && locks.poseHandId === PULL_OPEN_HAND_ID) {
    return { ...control, options: control.options.map(o => isFullyClosedOpening(o) ? { ...o, disabled: true } : o) };
  }
  return control;
}

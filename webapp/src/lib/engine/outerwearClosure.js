import { isNewOuterwearStyling, isDrapedOuterwearStyling, outerwearStylingConflict, outerwearStylingControlContext, resolveOuterwearStylingSource } from './outerwearStyling.js';

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
export function prepareOuterwearClosureControl(control, locks, controls = []) {
  const styling = control.key.match(/^outerwear([AB]?)StylingId$/);
  if (styling) {
    const fullyClosed = isFullyClosedOpening(locks[`outerwear${styling[1]}OpeningId`]);
    const context = { ...outerwearStylingControlContext(controls, locks, styling[1]), fullyClosed };
    const options = control.options.map(item => {
      const reason = isNewOuterwearStyling(item) ? outerwearStylingConflict(item, context)
        : fullyClosed && item.zh !== '全無' ? '完全閉合時不適用既有露肩穿法。' : '';
      const resolved = isNewOuterwearStyling(item) ? resolveOuterwearStylingSource(item, context) : item;
      return reason ? { ...resolved, disabled: true, desc: `${item.desc || ''} ${reason}`.trim() } : resolved;
    });
    const selected = options.find(item => item.id === locks[control.key]);
    return { ...control, options,
      ...(selected?.disabled ? { closureDisplayValue: options.find(o => o.zh === '全無')?.id || 'none', helpText: '此穿法目前不適用；原選項保留，切回相容條件即可恢復。' } : {}) };
  }
  if (control.key === 'poseHandId' && isFullyClosedOpening(locks.outerwearOpeningId)) {
    return { ...control, options: control.options.map(o => o.id === PULL_OPEN_HAND_ID ? { ...o, disabled: true } : o) };
  }
  if (control.key === 'poseHandId') {
    const selectedStyle = controls.find(c => c.key === 'outerwearStylingId')?.options.find(o => o.id === locks.outerwearStylingId);
    if (isDrapedOuterwearStyling(selectedStyle)) return { ...control, options: control.options.map(o => o.id === PULL_OPEN_HAND_ID ? { ...o, disabled: true } : o) };
  }
  if (control.key === 'outerwearOpeningId' && locks.poseHandId === PULL_OPEN_HAND_ID) {
    return { ...control, options: control.options.map(o => isFullyClosedOpening(o) ? { ...o, disabled: true } : o) };
  }
  const opening = control.key.match(/^outerwear([AB]?)OpeningId$/);
  if (opening) {
    const selectedStyle = controls.find(c => c.key === `outerwear${opening[1]}StylingId`)?.options.find(o => o.id === locks[`outerwear${opening[1]}StylingId`]);
    if (isDrapedOuterwearStyling(selectedStyle)) return { ...control, options: control.options.map(o =>
      isFullyClosedOpening(o) || o.meta?.outerwearFastenerRequirement ? { ...o, disabled: true } : o) };
  }
  return control;
}

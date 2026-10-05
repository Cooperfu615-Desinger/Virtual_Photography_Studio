const isUnfastenedFly = item => /(?:^|:)unbuttoned-slightly-unzipped(?::[ab])?$/.test(item?.id || '');

export function bottomRiseConflict(pants, rise) {
  return isUnfastenedFly(rise) && pants?.meta?.bottomWaist?.supportsUnfastenedFly === false
    ? '此款採鬆緊抽繩腰頭，不適用解扣與拉鏈微開。' : '';
}

export function bottomRiseControlContext(controls, locks, suffix = '') {
  const selected = key => controls.find(c => c.key === key)?.options.find(o => o.id === locks[key]);
  return { pants: selected(`pants${suffix}Id`), rise: selected(`bottomRise${suffix}Id`) };
}

// Suppress only effective prose. Keep the original ID for selection snapshots
// and restoration when switching back to a compatible garment.
export function resolveBottomRiseCompatibility(pieces) {
  return pieces.map(item => {
    if (!isUnfastenedFly(item)) return item;
    const role = item.meta?.wardrobeRole || '';
    const pants = pieces.find(p => p.id?.startsWith('wardrobe:褲裝-pants:') && (p.meta?.wardrobeRole || '') === role);
    return bottomRiseConflict(pants, item) ? { ...item, en: '', meta: { ...item.meta, suppressedBottomRise: true } } : item;
  });
}

export function prepareBottomRiseControl(control, locks, controls) {
  const match = control.key.match(/^bottomRise([AB]?)Id$/);
  if (!match) return control;
  const { pants } = bottomRiseControlContext(controls, locks, match[1]);
  const options = control.options.map(item => {
    const reason = bottomRiseConflict(pants, item);
    return reason ? { ...item, disabled: true, desc: `${item.desc || ''} ${reason}`.trim() } : item;
  });
  const selected = options.find(item => item.id === locks[control.key]);
  return { ...control, options,
    ...(selected?.disabled ? { closureDisplayValue: 'none', helpText: '目前組合不適用；原選項保留，切回相容條件即可恢復。' } : {}) };
}

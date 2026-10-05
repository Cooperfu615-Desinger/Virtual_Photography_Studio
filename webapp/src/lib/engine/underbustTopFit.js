export const isUnderbustTopFit = item => item?.meta?.topFit?.length === 'underbust';
export const UNDERBUST_UNTUCKED_SOURCE = 'top hem hanging naturally just below the bust';
const INCOMPATIBLE_STYLES = new Set(['tucked', 'half-tucked', 'knot-tied', 'hem-overlap']);
const shortStyleId = item => item?.id?.replace(/:[ab]$/, '').split(':').at(-1);
export const isUnderbustIncompatibleStyle = item => INCOMPATIBLE_STYLES.has(shortStyleId(item));

export function underbustTopConflict(top) {
  // A random UI selection is unresolved; validate its actual garment at generation.
  if (top === undefined) return '';
  if (!top || top.zh === '全無') return '請先選擇上身單品。';
  return top.meta?.topUnderbust?.baseEn ? '' : '此款沒有可縮短的上衣衣襬，不適用胸下短版。';
}

export function underbustTopControlContext(controls, locks, suffix = '') {
  const selected = key => controls.find(c => c.key === key)?.options.find(o => o.id === locks[key]);
  return { top: selected(`top${suffix}Id`), fit: selected(`topFit${suffix}Id`) };
}

// Resolve only explicitly selected new fits, per garment layer and wearer.
// Historical garment sources and the source locks remain untouched.
export function resolveUnderbustTopFit(pieces) {
  const activeRoles = new Map();
  for (const item of pieces.filter(isUnderbustTopFit)) {
    const role = item.meta?.wardrobeRole || '';
    const top = pieces.find(p => p.id?.startsWith('wardrobe:上身-tops:') && (p.meta?.wardrobeRole || '') === role);
    activeRoles.set(role, { top, valid: !underbustTopConflict(top || null) });
  }
  return pieces.map(item => {
    const state = activeRoles.get(item.meta?.wardrobeRole || '');
    if (!state) return item;
    if (isUnderbustTopFit(item)) return state.valid ? item : { ...item, en: '' };
    if (!state.valid) return item;
    if (item === state.top) return { ...item, en: item.meta.topUnderbust.baseEn, meta: { ...item.meta, effectiveUnderbustTop: true } };
    if (!item.id?.startsWith('wardrobe:上身穿法-top-styling:')) return item;
    if (isUnderbustIncompatibleStyle(item)) return { ...item, en: '', meta: { ...item.meta, underbustTopStyle: true } };
    if (shortStyleId(item) === 'untucked') return { ...item, en: UNDERBUST_UNTUCKED_SOURCE, meta: { ...item.meta, underbustTopStyle: true } };
    return item;
  });
}

export function projectUnderbustTopFit(pieces, projection) {
  if (projection?.wardrobe?.detailZones?.includes('upperBody')) return pieces;
  return pieces.map(item => isUnderbustTopFit(item) || item.meta?.underbustTopStyle ? { ...item, en: '' } : item);
}

export function prepareUnderbustTopControl(control, locks, controls) {
  const match = control.key.match(/^top(?:Fit|Styling)([AB]?)Id$/);
  if (!match) return control;
  const { top, fit } = underbustTopControlContext(controls, locks, match[1]);
  const fitControl = control.key.startsWith('topFit');
  const active = isUnderbustTopFit(fit) && !underbustTopConflict(top);
  const options = control.options.map(item => {
    const reason = fitControl && isUnderbustTopFit(item) ? underbustTopConflict(top)
      : active && isUnderbustIncompatibleStyle(item) ? '胸下短版衣襬無法使用此腰部穿法。' : '';
    const resolved = active && !fitControl && shortStyleId(item) === 'untucked' ? { ...item, en: UNDERBUST_UNTUCKED_SOURCE } : item;
    return reason ? { ...resolved, disabled: true, desc: `${item.desc || ''} ${reason}`.trim() } : resolved;
  });
  const selected = options.find(item => item.id === locks[control.key]);
  return { ...control, options,
    ...(selected?.disabled ? { closureDisplayValue: 'none', helpText: '目前組合不適用；原選項保留，切回相容條件即可恢復。' } : {}) };
}

// Prose import recognizes whole reviewed garment variants, only alongside a
// complete new fit phrase. Bare fabric/type words cannot activate this feature.
export function matchResolvedUnderbustTop(text, tops, fits) {
  const fit = fits.find(item => isUnderbustTopFit(item) && text.includes(item.en.toLowerCase()));
  if (!fit) return null;
  const top = tops.filter(item => item.meta?.topUnderbust?.baseEn
    && item.meta.topUnderbust.baseEn.toLowerCase().split(/,\s*/).every(fragment => text.includes(fragment)))
    .sort((a, b) => b.meta.topUnderbust.baseEn.length - a.meta.topUnderbust.baseEn.length)[0];
  return top ? { top, fit } : null;
}

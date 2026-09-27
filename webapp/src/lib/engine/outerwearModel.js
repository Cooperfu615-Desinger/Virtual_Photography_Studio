// Authored outerwear attributes are resolved before renderer-specific reduction.
// Historical catalog rows remain addressable but cannot enter fresh selections.
export const isRetiredOuterwear = item => Boolean(item?.meta?.outerwear?.retired);

export function resolveOuterwearBase(item, fit) {
  const model = item?.meta?.outerwear;
  if (!model) return null;
  const modifier = fit?.meta?.outerwearFit;
  if (!modifier && !model.canonicalLegacy) return item.en;
  const length = modifier?.length || model.defaultLength || '';
  const cut = modifier?.fit || model.defaultFit || '';
  // Keep the natural 'fitted long coat' ordering, but 'hip-length fitted coat'.
  const prefixes = ['long', 'longline'].includes(length) ? [cut, length] : [length, cut];
  return [...prefixes, model.baseEn || item.en].filter(Boolean).join(' ');
}

export function outerwearFasteners(item) {
  return item?.meta?.outerwear?.fasteners;
}

// Exported prose has resolved fit/length rather than the former modifier sentence.
// Match complete authored garment variants, never bare 'fitted'/'oversized' words.
export function matchResolvedOuterwear(text, items, fits) {
  const candidates = items.flatMap(item => {
    if (!item.meta?.outerwear) return [];
    return [null, ...fits.filter(fit => fit.meta?.outerwearFit)].map(fit => ({
      item, fit, phrase: resolveOuterwearBase(item, fit).toLowerCase(),
    }));
  }).filter(candidate => text.includes(candidate.phrase));
  return candidates.sort((a, b) => b.phrase.length - a.phrase.length
    || Number(isRetiredOuterwear(a.item)) - Number(isRetiredOuterwear(b.item)))[0] || null;
}

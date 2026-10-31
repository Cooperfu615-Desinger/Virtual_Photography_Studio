import sources from './imagingColorSources.json' with { type: 'json' };

const reviewed = Object.fromEntries(Object.entries(sources).map(([kind, rows]) => [
  kind, new Map(rows.map(row => [row.id, row])),
]));

// Exact reviewed sources only. A tag, a person's name, or a wardrobe color is
// not an imaging mandate. Edited/unknown sources remain unrestricted.
export function reviewedImagingColorMode(kind, item) {
  const source = reviewed[kind]?.get(item?.id);
  return source && source.en === item.en ? source.mode : 'open';
}

export function imagingColorsCompatible(style, film) {
  const a = reviewedImagingColorMode('style', style);
  const b = reviewedImagingColorMode('film', film);
  return a === 'open' || b === 'open' || a === b;
}

export function pickColorCompatibleStyle(candidates, film, random) {
  if (!candidates.length) return null;
  const pool = candidates.filter(style => imagingColorsCompatible(style, film));
  const roll = random(); // Same one draw as the original uniform style picker.
  return pool[Math.floor(roll * pool.length)] || null;
}

export function pickColorCompatibleFilm(candidates, style, random) {
  if (!candidates.length) return null;
  const low = item => item.meta?.tags?.includes('low_frequency_film');
  const regular = candidates.filter(item => !low(item));
  const rare = candidates.filter(low);
  // Decide with the ORIGINAL post-preview-exclusion pool. Removing VHS must
  // not remove its coin-flip draw and shift every downstream random choice.
  const regularTurn = regular.length > 0 && (rare.length === 0 || random() < 0.88);
  const compatible = candidates.filter(film => imagingColorsCompatible(style, film));
  const group = compatible.filter(item => regularTurn ? !low(item) : low(item));
  const pool = group.length ? group : compatible;
  const roll = random();
  return pool[Math.floor(roll * pool.length)] || null;
}

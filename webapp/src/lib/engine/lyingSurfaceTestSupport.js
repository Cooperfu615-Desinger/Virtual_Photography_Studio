// Node-only regression tooling, never a production import.
//
// Lying library P3 (2026-10-19): reviewed scenes gained an additive
// `lyingSurface` field (Docs/reports/pose-library-lying-2026-10-19/scene-surfaces).
// Frozen hashes of location options or structured scene data predate it; remove
// only that field before comparing — every other byte must still match.
export const LYING_SURFACE_FIELD = 'lyingSurface';

const isPlainObject = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export function withoutLyingSurface(value) {
  if (Array.isArray(value)) return value.map(withoutLyingSurface);
  if (!isPlainObject(value)) return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => key !== LYING_SURFACE_FIELD)
    .map(([key, child]) => [key, withoutLyingSurface(child)]));
}

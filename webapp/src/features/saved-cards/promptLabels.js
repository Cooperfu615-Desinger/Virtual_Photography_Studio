const HISTORICAL_Z_IMAGE_LABELS = new Set([
  'Grok/Z-Image',
  'Grok/Z-Image Prompt',
]);

export function normalizeZImageDisplayLabel(value, fallback = 'Z-Image') {
  const label = String(value || '').trim();
  if (!label) return fallback;
  return HISTORICAL_Z_IMAGE_LABELS.has(label) ? (fallback.endsWith(' Prompt') ? fallback : `${fallback} Prompt`) : label;
}

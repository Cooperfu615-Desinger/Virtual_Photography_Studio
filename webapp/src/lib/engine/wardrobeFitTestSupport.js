// Historical snapshot compatibility helper for the approved explicit-fit pass.
// Keep old baselines immutable while the focused fit fixtures assert the new
// behavior. This helper is test-only and must never be imported by production.

const EXPLICIT_FIT_PHRASES = Object.freeze([
  'standard upper-body cut',
  'fitted upper-body cut following the garment shape',
  'tight body-skimming upper-body fit',
  'oversized upper-body proportion with roomy shoulders and body',
  'standard lower-body proportion',
  'fitted lower-body line following the garment shape',
  'tight body-skimming lower-body fit',
  'wide-leg volume with a broad lower-body opening',
  'fitted outerwear proportion',
  'tight body-skimming outerwear fit',
  'oversized outerwear proportion with roomy shoulders and body',
  'hip-length fitted outerwear, ending around the widest part of the hips',
  'underbust-cropped fitted outerwear, ending just below the bust',
  'hip-length tight body-skimming outerwear, ending around the widest part of the hips',
  'underbust-cropped tight outerwear, ending just below the bust',
  'hip-length oversized outerwear, roomy shoulders and body, ending around the widest part of the hips',
  'underbust-cropped oversized outerwear, roomy shoulders, ending just below the bust',
]);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
}

/**
 * Remove only the newly preserved explicit fit modifiers from a historical
 * Z-Image/Midjourney snapshot. GPT and derived outputs are intentionally
 * untouched because their existing full-fidelity contracts already retained
 * the selected fit text.
 */
export function normalizeExplicitWardrobeFitForLegacy(text, field) {
  if (!['zImagePrompt', 'midjourneyPrompt'].includes(field)) return text;

  let output = String(text || '');
  for (const phrase of EXPLICIT_FIT_PHRASES) {
    output = output.replace(
      new RegExp(escapeRegExp(phrase), 'gi'),
      '',
    );
  }

  return output
    .replace(/\s+,/g, ',')
    .replace(/,\s*\./g, '.')
    .replace(/\.\s*,/g, ',')
    .replace(/,\s*(?=\n|$)/g, '')
    .trim();
}

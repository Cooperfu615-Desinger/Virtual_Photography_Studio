// Reviewed Phase 4 A3 phrases only. Original cards and selection payloads stay intact.
export function projectPublicSourceLanguage(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(/, no background structure specified/gi, '')
    .replace(/ without generating a stage venue/gi, '')
    .replace(/PAGE3 camera and environment layer/gi, 'camera and environment')
    .replace(/real-place guards adapted for the background/gi, 'local spatial character')
    .replace(/bare feet as the locked footwear state/gi, 'bare feet');
}

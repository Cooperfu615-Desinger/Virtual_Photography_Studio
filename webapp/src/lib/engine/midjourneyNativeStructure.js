/**
 * Midjourney accepts one text-prompt block followed by its parameter tail.
 * Keep every authored sentence and token in source order; phase 5 changes only
 * inter-section whitespace so Body Type, wardrobe, scene, imaging, and
 * canonical pose language remain untouched.
 */
export function renderMidjourneyNativeDescription(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ');
}

// Node-only exact inverse of the 2026-10-14 framing-ratio revision for frozen
// main-MJ snapshots taken before it. The framing ratio is emitted only when F
// follows PAGE1 and PAGE1 has no ratio, so in exactly that state the single
// "--ar W:H" token is removed; every other prompt is returned unchanged.
export function stripFramingDerivedMidjourneyRatio(prompt, selection = {}) {
  if (typeof prompt !== 'string') return prompt;
  const followsPage1 = !selection.mjAspectRatio || selection.mjAspectRatio === 'page1';
  const page1Ratio = selection.aspectRatio && selection.aspectRatio !== 'none' ? selection.aspectRatio : '';
  if (!followsPage1 || page1Ratio) return prompt;
  return prompt.replace(/ --ar \d+:\d+(?= )/, '');
}

// Test-only inverse for frozen snapshots that predate the body and fit revision.
export function restorePreBodyTightFitText(text) {
  return text
    .replaceAll(
      'pronounced hourglass silhouette; height 163–168 cm, bust–waist–hip 103–60–98 cm',
      'pronounced hourglass silhouette, curves stretching fitted fabric with soft flesh bulges at snug garment edges; height 163–168 cm, bust–waist–hip 103–60–98 cm',
    )
    .replace(/\b(Wears|wears) subtle fabric tension (?:across the torso|along the visible lower-body contours), /g, '$1 ')
    .replace(/, subtle fabric tension (?:across the torso|along the visible lower-body contours)(?=[.,;\n]|$)/g, '');
}

export function restorePreBodyTightFitOutputs(outputs) {
  return Object.fromEntries(Object.entries(outputs).map(([field, text]) => [field, restorePreBodyTightFitText(text)]));
}

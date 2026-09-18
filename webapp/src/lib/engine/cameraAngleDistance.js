// Soft camera-to-subject distance cues for the three high-angle families.
// These are descriptive ranges, not new controls or hard lens/height locks.
function resolveTerms(subjectKind = 'woman') {
  return subjectKind === 'subject'
    ? { target: 'the subject', possessive: "the subject's" }
    : { target: 'her', possessive: 'her' };
}

export function buildCameraAngleDistanceClause(angleKey, subjectKind = 'woman') {
  const { target } = resolveTerms(subjectKind);
  switch (angleKey) {
    case 'high':
      return `At a relatively close portrait distance, roughly 1.5–2 meters from ${target}, the camera is positioned above ${target} and angled downward`;
    case 'birdEye':
      return `From several meters away, roughly 3–5 meters above and set back from ${target}, the camera looks diagonally downward`;
    case 'topDown':
      return `From directly overhead at roughly 1–2 meters above ${target}, the camera points straight down at a 90-degree angle`;
    default:
      return '';
  }
}

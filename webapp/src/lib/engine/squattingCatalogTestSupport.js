// Test-only exact inverse for immutable pre-v2 snapshots. Only the two squat
// sources exercised by historical matrices are reversed; selections/RNG and all
// unrelated text remain protected. New geometry is tested without this inverse.
const REVIEWED_REPLACEMENTS = [
  [
    "relaxed low squat with comfortably bent knees, hips lowered near the heels and clear of the ground, feet comfortably spaced, heels resting down or lightly lifted for balance, and the torso gently inclined forward with relaxed shoulders",
    "deep resting squat with both feet planted flat, both heels grounded, knees deeply bent, and the hips held low over the feet"
  ],
  [
    "relaxed forward-leaning low squat with the knees comfortably apart, hips lowered near the heels and clear of the ground, torso gently inclined from the hips toward the thighs, shoulders and neck relaxed, and heels resting down or lightly lifted for balance",
    "deep squat with both feet planted flat and both heels grounded, hips held low over the feet, and the torso leaning forward over the thighs"
  ],
  [
    "upper-body pose with a gentle forward lean with relaxed shoulders",
    "upper-body pose with the torso upright and relaxed"
  ],
  [
    "squatting pose with a gentle forward lean with relaxed shoulders",
    "squatting pose with the torso upright and relaxed"
  ],
  [
    "a gentle forward lean with relaxed shoulders",
    "a relaxed upright upper-body posture"
  ],
  [
    "upper-body pose with a gentle forward lean from the hips with relaxed shoulders and neck",
    "upper-body pose with the torso leaning forward from the hips"
  ],
  [
    "squatting pose with a gentle forward lean from the hips with relaxed shoulders and neck",
    "squatting pose with the torso leaning forward from the hips"
  ],
  [
    "a gentle forward lean from the hips with relaxed shoulders and neck",
    "a forward-leaning upper-body posture with the torso inclined from the hips"
  ]
];

export function restorePreSquattingV2(value) {
  if (typeof value === 'string') return REVIEWED_REPLACEMENTS.reduce(
    (text, [current, historical]) => text.replaceAll(current, historical), value);
  if (Array.isArray(value)) return value.map(restorePreSquattingV2);
  if (value && typeof value === 'object') return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, restorePreSquattingV2(item)]));
  return value;
}

// Test-only exact inverse for immutable pre-v2 snapshots. Only the two squat
// sources and reviewed hand wording exercised by historical matrices are reversed; selections/RNG and all
// unrelated text remain protected. New geometry is tested without this inverse.
const REVIEWED_REPLACEMENTS = [
  ["雙肘靠膝自然垂手", "雙手向前伸展"],
  ["雙手沿腿側自然下垂", "雙手自然放在兩腿外側"],
  ["單手托腮一手自然垂落", "單手托腮一手扶膝"],
  ["雙手托腮", "雙手托腮扶臉"],

  ["both forearms angled naturally downward with relaxed hands and lowered shoulders", "both elbows resting firmly on top of the knees and supporting part of the forward-leaning upper-body weight, while the forearms extend forward and downward beyond the knees and the wrists and hands hang naturally with relaxed fingers"],
  ["both arms relaxed along the sides of the body with softly bent elbows and lowered shoulders", "both hands resting naturally along the outer sides of the legs with relaxed elbows"],
  ["one raised palm gently cradling the cheek, the other forearm angled downward with a relaxed hand, and both shoulders lowered", "one hand lightly supporting one cheek, the other hand resting on the opposite knee with both elbows relaxed"],
  ["both palms gently cradling the cheeks with fingers relaxed along the cheeks and jaw and shoulders naturally lowered", "both hands gently cupping the cheeks in a cute, relaxed pose with the elbows resting naturally at the sides"],
  ["one raised hand forming a relaxed V sign beside the cheek and clear of the eyes, the other forearm angled downward with a relaxed hand, and both shoulders lowered", "one hand forming a relaxed V sign beside the face, the other hand resting naturally near the leg"],

  ["both elbows or proximal forearms resting lightly on the same-side thighs near the knees, forearms falling naturally forward and downward beyond the knees, with loose wrists, relaxed fingers and lowered shoulders", "both elbows resting firmly on top of the knees and supporting part of the forward-leaning upper-body weight, while the forearms extend forward and downward beyond the knees and the wrists and hands hang naturally with relaxed fingers"],
  ["both arms hanging naturally along the outer sides of the legs with softly bent elbows, hands relaxed beside the lower shins or outer ankles, loose wrists and fingers, and lowered shoulders", "both hands resting naturally along the outer sides of the legs with relaxed elbows"],
  ["one elbow resting lightly on the same-side thigh near the knee with the raised palm gently cradling the cheek, the other elbow or proximal forearm resting near the opposite knee with that forearm falling forward and downward, its wrist and fingers relaxed, and both shoulders lowered", "one hand lightly supporting one cheek, the other hand resting on the opposite knee with both elbows relaxed"],
  ["both elbows resting lightly on the same-side thighs near the knees, forearms raised with both palms gently cradling the cheeks, fingers relaxed along the cheeks and jaw, and shoulders naturally lowered", "both hands gently cupping the cheeks in a cute, relaxed pose with the elbows resting naturally at the sides"],
  ["one elbow resting lightly on the same-side thigh near the knee with the raised hand forming a relaxed V sign beside the cheek and clear of the eyes, the other elbow or proximal forearm resting near the opposite knee with that forearm falling forward and downward, its wrist and fingers relaxed, and both shoulders lowered", "one hand forming a relaxed V sign beside the face, the other hand resting naturally near the leg"],

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

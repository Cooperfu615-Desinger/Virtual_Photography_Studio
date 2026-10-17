// Test-only exact inverse of the approved 2026-10-17 open-palm wording.
// Historical snapshots stay immutable. Current-source tests assert the new
// wording directly; no runtime renderer imports this helper.
const CURRENT_ACTION = "one arm extended toward the camera, with an open palm facing the lens and five fingers naturally spread and slightly relaxed";
const HISTORICAL_ACTION = "one arm extended straight toward the camera to block the lens, with one open palm held flat toward the lens and all five fingers spread wide and fully visible from their bases to their fingertips";
const REPLACEMENTS = [
  [CURRENT_ACTION, HISTORICAL_ACTION],
  ["單手向鏡頭前伸，掌心朝向鏡頭，五指自然分開並略微放鬆。手掌比臉部更靠近鏡頭，在前景形成明顯的大小差異；手掌位於臉部一側，不遮住五官，並保留手掌經手腕、前臂連接至肩膀的自然關係。", "任一隻手臂直接伸向鏡頭，以張開的手掌遮擋鏡頭；五根手指從指根到指尖完整可見，不限定左右手。"],
  ["The extended hand is much closer to the lens than her face, making it appear noticeably larger in the foreground through near-to-far perspective. Position the hand to one side of her face, leaving her facial features unobstructed. Maintain a recognizable open-palm silhouette and a believable connection from the palm through the wrist and foreshortened forearm to her shoulder.", "The camera lens is intentionally blocked by one open hand. The complete hand is centered immediately in front of the lens and dominates nearly the entire image, occupying roughly eighty to ninety percent of the frame. All five fingers are spread wide and fully visible from their bases to their fingertips, with the fingertips reaching close to the outer frame edges without being cropped. Her face, clothing, and surroundings remain visible only as small, incomplete fragments around the outer perimeter of the hand."],
];

export function restorePreOpenPalmV2(value) {
  if (typeof value === 'string') return REPLACEMENTS.reduce(
    (text, [current, historical]) => text.replaceAll(current, historical), value);
  if (Array.isArray(value)) return value.map(restorePreOpenPalmV2);
  if (value && typeof value === 'object') {
    const restored = Object.fromEntries(Object.entries(value).map(([key, item]) => [key, restorePreOpenPalmV2(item)]));
    if (value.id === 'one-hand-open-palm-camera' && value.meta?.legacyPromptAliases) {
      restored.meta.legacyPromptAliases = value.meta.legacyPromptAliases.filter(alias => alias !== HISTORICAL_ACTION);
    }
    return restored;
  }
  return value;
}

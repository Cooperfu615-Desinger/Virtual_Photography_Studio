// Main Z-only assembly. Inputs are already projected/compacted sources; this
// helper must never resolve a selection, infer scenery or rewrite a pose.
export function buildZImageOnLocationCapture({
  scene = '', pose = '', hand = '', lighting = '', composition = '',
  hasAmbientLight = false, sceneSharesAmbientLight = false,
} = {}) {
  return [
    scene, pose, hand, lighting,
    hasAmbientLight && !sceneSharesAmbientLight
      ? "She is photographed within the scene's ambient light." : '',
    composition,
  ].map((part) => String(part || '').trim()).filter(Boolean).join('\n');
}

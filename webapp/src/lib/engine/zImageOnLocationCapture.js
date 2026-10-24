// Main Z-only assembly. Inputs are already projected/compacted sources; this
// helper must never resolve a selection, infer scenery or rewrite a pose.

const AMBIENT_LIGHT_SENTENCE = "She is photographed within the scene's ambient light.";
// An orbit label such as ", rear-right three-quarter view" that the following
// "Photographed from the woman's … side" geometry already states.
const ORBIT_LABEL = /,\s*(?:front|back|rear|left|right|(?:front|rear)-(?:left|right))(?: three-quarter| profile)? view(?=\.)/i;
const GEOMETRY_AFTER_LABEL = /\bPhotographed (?:from the woman's|directly from)\b/;
const SIDE_POSTURE_LEAD = /\bShe (?:stands|sits|kneels|squats|lies) completely sideways/;

/** Version C (Cooper 2026-10-23): keep scene-first order, but state each fact once. */
export function tidyZImageCaptureSources({ pose = '', lighting = '', composition = '', hasAmbientLight = false, sceneSharesAmbientLight = false } = {}) {
  let nextComposition = String(composition || '');
  // The orbit geometry sentence already says where the camera stands, so its label is dropped.
  if (GEOMETRY_AFTER_LABEL.test(nextComposition)) nextComposition = nextComposition.replace(ORBIT_LABEL, '');
  // The pose sentence already says "She stands …"; the side-view sentence must not open the same way.
  if (String(pose || '').trim()) nextComposition = nextComposition.replace(SIDE_POSTURE_LEAD, 'She is positioned completely sideways');
  const needsAmbient = hasAmbientLight && !sceneSharesAmbientLight;
  const light = String(lighting || '').trim();
  // The ambient connection joins the lighting sentence instead of standing alone.
  if (needsAmbient && light) {
    return { composition: nextComposition, lighting: `${light.replace(/\.\s*$/, '')}; she is photographed within the scene's ambient light.`, ambient: false };
  }
  return { composition: nextComposition, lighting: light, ambient: needsAmbient };
}

export function buildZImageOnLocationCapture({
  scene = '', pose = '', hand = '', lighting = '', composition = '',
  hasAmbientLight = false, sceneSharesAmbientLight = false, tidy = false,
} = {}) {
  const tidied = tidy
    ? tidyZImageCaptureSources({ pose, lighting, composition, hasAmbientLight, sceneSharesAmbientLight })
    : { composition, lighting, ambient: hasAmbientLight && !sceneSharesAmbientLight };
  return [
    scene, pose, hand, tidied.lighting,
    tidied.ambient ? AMBIENT_LIGHT_SENTENCE : '',
    tidied.composition,
  ].map((part) => String(part || '').trim()).filter(Boolean).join('\n');
}

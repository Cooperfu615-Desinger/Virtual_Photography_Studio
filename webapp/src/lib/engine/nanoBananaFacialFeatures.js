// Reviewed Nano-only facial geometry. Shared catalog English, MJ metadata and
// Character Card identities remain their original sources of truth.
// 2026-10-14: the subject sentence no longer names an ethnicity, so the five
// non-mixed faces carry the approved Japanese/Korean cue here as well.
export const NANO_BANANA_FACIAL_FEATURES = Object.freeze({
  'character:五官特徵-facial-features:韓系偶像臉:1': 'a small refined oval Korean face with a softly tapered jaw and a neat chin, clear almond eyes with moderate spacing, shallow double eyelids and straight brows, a slender straight nose bridge with a compact gently rounded tip, softly shaped lips with a defined cupid bow and a slightly fuller lower lip',
  'character:五官特徵-facial-features:日系清透臉:2': 'a soft natural oval Japanese face with smooth cheek contours and a gently tapered jaw, gentle almond eyes with moderate spacing, shallow natural eyelids and softly shaped natural brows, a small straight nose with a low smooth bridge and a neat tip, softly defined lips with a subtle cupid bow and balanced upper and lower contours',
  'character:五官特徵-facial-features:甜美可愛臉:3': 'a soft natural oval Japanese face with smooth cheek contours and a gently tapered jaw, bright round eyes with open natural eyelids and gently curved brows, a small rounded nose with a low smooth bridge and a compact rounded tip, softly shaped lips with a shallow cupid bow and a moderately fuller lower lip',
  'character:五官特徵-facial-features:冷感高級臉:4': 'a refined elongated oval Korean face with moderately high cheekbones, a narrow sculpted jaw and a neat tapered chin, upturned eyes with clearly defined outer corners, shallow double eyelids and straight brows, a straight nose with a defined bridge and a fine tip, sculpted lips with a crisp cupid bow and precise upper and lower contours',
  'character:五官特徵-facial-features:成熟性感臉:5': 'a softly defined oval Korean face with gently high cheekbones and a smooth tapered jaw, upturned eyes with moderate spacing, defined natural eyelids and softly arched brows, a straight nose with a clear medium bridge and a refined rounded tip, full shaped lips with a distinct cupid bow and a visibly fuller lower lip',
  'character:五官特徵-facial-features:混血立體臉:6': 'a dimensional elongated oval face with pronounced cheekbone structure, a narrow defined jaw and a tapered chin, deep-set round eyes with moderate spacing, visible upper-lid depth and defined brows, a long straight nose with a high narrow bridge and a fine tip, sculpted lips with a clear cupid bow and balanced dimensional contours',
});

// The caller supplies effective, already-resolved text. A latent selection must
// never reintroduce a face suppressed by an active custom/card/special identity.
export function nanoBananaFacialDescription(item, effectiveText = item?.en) {
  if (!effectiveText || /^none$/i.test(String(effectiveText).trim())) return '';
  const id = String(item?.id || '').replace(/:[ab]$/, '');
  return NANO_BANANA_FACIAL_FEATURES[id] || effectiveText;
}

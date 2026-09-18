// Reviewed subject-light source oracle. Keep the public option ids and labels
// in the catalog; this fixture pins only the approved English source wording.
export const SUBJECT_LIGHT_SOURCE_CASES = Object.freeze([
  ['柔和順光', 'soft frontal subject light, even illumination across face and upper body, gentle shadow modeling, low contrast'],
  ['均勻平光', 'flat even subject light, balanced face and clothing exposure, minimal shadow modeling, neutral contrast'],
  ['側向柔光', 'soft side light across the subject, gentle cheek and shoulder contour, gradual shadow transition, natural dimension'],
  ['側向硬光', 'hard side light across the subject, crisp facial-plane shadows, sculpted body contrast, sharp highlight separation'],
  ['側逆光', 'soft diagonal rear-side light, narrow rim along hair and shoulder, partial facial fill, separated subject edge'],
  ['逆光輪廓光', 'strong back rim light, bright outline along hair shoulders and body edges, restrained shadow-side detail'],
  ['頂部照明', 'overhead subject light, downward illumination across face and torso, defined eye-socket and nose shadows, vertical falloff'],
  ['下方反射光', 'upward reflected fill on the subject, subtle lift under the face, softened chin and neck shadows, gentle lower-body bounce'],
  ['漫射霧光', 'diffused wraparound light, broad soft fill across the subject, softened shadow edges, low-contrast detail'],
  ['硬質晴光', 'hard direct sunlight on the subject, crisp cast-shadow edges, strong side contrast, bright specular highlights'],
  ['低光高反差', 'low-key subject light, deep face and body shadows, selective highlight accents, strong tonal contrast'],
  ['高調亮光', 'high-key subject light, bright even exposure across face and clothing, pale soft shadows, clean highlights'],
  ['暖金黃昏色溫', 'warm golden-amber subject color, honey-toned highlights on skin and clothing, gentle warm shadow bias, controlled saturation'],
  ['冷白日光色溫', 'cool clean daylight subject color, pale neutral highlights, restrained cool shadows, clear skin and clothing detail'],
  ['室內暖白燈色溫', 'warm-white indoor subject color, neutral-warm highlights, gentle household warmth, restrained amber saturation'],
  ['冷藍夜色光', 'cool blue night-toned subject light, restrained cyan fill or rim, cool shadow tint, subdued highlight intensity'],
  ['混合色溫光', 'mixed warm and cool subject light, layered highlight temperatures across face and clothing, controlled color separation'],
  ['霓虹染色光', 'saturated neon color spill across the subject, vivid colored edge highlights on skin hair and clothing, controlled chromatic cast'],
  ['窗格投影光', 'window-frame pattern light across the subject, geometric daylight bands on face and clothing, defined shadow edges'],
  ['百葉窗條紋投影光', 'window-blind stripe light across the subject, horizontal slatted bands on face and clothing, crisp alternating light and shadow'],
  ['冷調窗邊輪廓光', 'cool window-side edge light, clean illumination along hair and shoulder, soft shadow-side falloff, subtle contour separation'],
  ['斑駁樹影光', 'dappled leaf-shadow light across the subject, irregular sunlight patches on skin and clothing, broken branch-and-leaf pattern'],
  ['潮濕反射光', 'wet-surface reflected fill on the subject, soft upward bounce from nearby surfaces, cool glossy highlights along lower contours'],
  ['局部暖光', 'localized warm subject light, concentrated amber highlight zone across face and hands, gentle warm falloff, soft surrounding shadows'],
  ['深夜邊緣微光', 'minimal nocturnal rim light, faint cool edge tracing hair shoulders and body outline, mostly shadowed subject mass'],
]);

// Historical source wording used by the frozen prompt baselines.  Runtime
// output intentionally uses SUBJECT_LIGHT_SOURCE_CASES above; this compatibility
// oracle lets regression tests compare unrelated behavior without rewriting
// their immutable hashes for an approved wording-only change.
const SUBJECT_LIGHT_LEGACY_SOURCE_CASES = Object.freeze([
  ['柔和順光', 'soft frontal subject light, even illumination across face and upper body, gentle shadow modeling, low contrast', 'soft frontal key light on the subject, even facial illumination, low-contrast skin detail, gentle minimal cast shadows'],
  ['均勻平光', 'flat even subject light, balanced face and clothing exposure, minimal shadow modeling, neutral contrast', 'flat even subject lighting, balanced full-face illumination, minimal modeling contrast, clean readable skin and clothing exposure'],
  ['側向柔光', 'soft side light across the subject, gentle cheek and shoulder contour, gradual shadow transition, natural dimension', 'soft side key light on the subject, gentle cheek contour, gradual shadow transition, natural facial dimensionality'],
  ['側向硬光', 'hard side light across the subject, crisp facial-plane shadows, sculpted body contrast, sharp highlight separation', 'hard side key light on the subject, sharp facial-plane shadow edge, sculpted side contrast, crisp highlight-to-shadow separation'],
  ['側逆光', 'soft diagonal rear-side light, narrow rim along hair and shoulder, partial facial fill, separated subject edge', 'diagonal rear-side subject light, soft rim edge along hair and shoulder, partial facial fill, separated subject contour'],
  ['逆光輪廓光', 'strong back rim light, bright outline along hair shoulders and body edges, restrained shadow-side detail', 'strong back rim light on the subject, bright outline along hair shoulders and body edge, controlled shadow-side detail'],
  ['頂部照明', 'overhead subject light, downward illumination across face and torso, defined eye-socket and nose shadows, vertical falloff', 'overhead top light on the subject, downward illumination, eye-socket and nose shadows, vertical falloff across face and torso'],
  ['下方反射光', 'upward reflected fill on the subject, subtle lift under the face, softened chin and neck shadows, gentle lower-body bounce', 'upward bounce fill on the subject, reflected light from below, subtle lower-face lift, softened chin and neck shadows'],
  ['漫射霧光', 'diffused wraparound light, broad soft fill across the subject, softened shadow edges, low-contrast detail', 'diffused light wrapping around the subject, softened shadow edges, low-contrast subject illumination, broad fill across skin and clothing'],
  ['硬質晴光', 'hard direct sunlight on the subject, crisp cast-shadow edges, strong side contrast, bright specular highlights', 'hard direct sunlight on the subject, crisp shadow edges, deep subject-side contrast, clear bright highlights on skin and clothing'],
  ['低光高反差', 'low-key subject light, deep face and body shadows, selective highlight accents, strong tonal contrast', 'low-key subject lighting, deep face and body shadows, selective highlight accents, high contrast across the subject'],
  ['高調亮光', 'high-key subject light, bright even exposure across face and clothing, pale soft shadows, clean highlights', 'high-key subject lighting, bright even exposure, pale soft shadows, clean highlight detail across face and clothing'],
  ['暖金黃昏色溫', 'warm golden-amber subject color, honey-toned highlights on skin and clothing, gentle warm shadow bias, controlled saturation', 'warm golden-amber subject light color, honey-orange cast on skin and clothing, peach-toned highlights, subdued warm shadows, no sunset or sky cues'],
  ['冷白日光色溫', 'cool clean daylight subject color, pale neutral highlights, restrained cool shadows, clear skin and clothing detail', 'cool clean daylight subject color, crisp pale-white highlights, neutral-cool skin rendering, restrained cool shadow edges, no sky or weather cues'],
  ['室內暖白燈色溫', 'warm-white indoor subject color, neutral-warm highlights, gentle household warmth, restrained amber saturation', 'warm-white practical-lamp subject color, neutral-warm skin highlights, gentle household lamp tone, no deep tungsten amber dominance'],
  ['冷藍夜色光', 'cool blue night-toned subject light, restrained cyan fill or rim, cool shadow tint, subdued highlight intensity', 'cool blue night-toned subject light, restrained blue-cyan rim or fill, subdued cool shadow tint, no moon skyline or night-sky cues'],
  ['混合色溫光', 'mixed warm and cool subject light, layered highlight temperatures across face and clothing, controlled color separation', 'mixed warm and cool subject lighting, warm-cool highlight contrast across face and clothing, layered color temperature separation'],
  ['霓虹染色光', 'saturated neon color spill across the subject, vivid colored edge highlights on skin hair and clothing, controlled chromatic cast', 'neon color spill across the subject, saturated colored highlights on skin hair and clothing edges, controlled vivid color cast'],
  ['窗格投影光', 'window-frame pattern light across the subject, geometric daylight bands on face and clothing, defined shadow edges', 'window-frame pattern light cast on the subject, framed daylight shadows, visible geometric shadow bands on face and clothing'],
  ['百葉窗條紋投影光', 'window-blind stripe light across the subject, horizontal slatted bands on face and clothing, crisp alternating light and shadow', 'window-blind stripe light across the subject, horizontal shadow bands on face skin and clothing, sharp slatted light-dark pattern'],
  ['冷調窗邊輪廓光', 'cool window-side edge light, clean illumination along hair and shoulder, soft shadow-side falloff, subtle contour separation', 'cool window-side rim light on the subject, side-edge illumination from a nearby window, clean cool contour separation, soft shadow-side falloff'],
  ['斑駁樹影光', 'dappled leaf-shadow light across the subject, irregular sunlight patches on skin and clothing, broken branch-and-leaf pattern', 'dappled leaf-shadow light on the subject, broken sunlight patches across skin and clothing, irregular branch and leaf shadow pattern'],
  ['潮濕反射光', 'wet-surface reflected fill on the subject, soft upward bounce from nearby surfaces, cool glossy highlights along lower contours', 'wet-surface reflected fill light on the subject, upward bounce from damp ground or walls, glossy reflected highlights on lower face and clothing'],
  ['局部暖光', 'localized warm subject light, concentrated amber highlight zone across face and hands, gentle warm falloff, soft surrounding shadows', 'local warm practical-light pool on the subject, lamp-driven amber highlight zone, warm falloff across face hands and clothing'],
  ['深夜邊緣微光', 'minimal nocturnal rim light, faint cool edge tracing hair shoulders and body outline, mostly shadowed subject mass', 'minimal nocturnal subject rim light, faint cool edge tracing along face hair shoulders and body outline, mostly dark subject mass'],
]);

export function normalizeSubjectLightForLegacy(value) {
  let output = String(value || '');
  for (const [, current, legacy] of SUBJECT_LIGHT_LEGACY_SOURCE_CASES) {
    output = output.replaceAll(current, legacy);
    const currentCompact = current.split(', ').slice(0, 2).join(', ');
    const legacyCompact = legacy.split(', ').slice(0, 2).join(', ');
    if (currentCompact !== current) output = output.replaceAll(currentCompact, legacyCompact);
  }
  // Special-subject sanitization rewrites skin/hair references before the
  // renderer emits the light sentence. Preserve that historical variant too.
  output = output.replaceAll(
    'saturated neon color spill across the subject, vivid colored edge highlights on surface skull and clothing, controlled chromatic cast',
    'neon color spill across the subject, saturated colored highlights on surface skull and clothing edges, controlled vivid color cast'
  );
  output = output.replaceAll(
    'saturated neon color spill across the subject, vivid colored edge highlights on surface skull and clothing',
    'neon color spill across the subject, saturated colored highlights on surface skull and clothing edges'
  );
  return output;
}

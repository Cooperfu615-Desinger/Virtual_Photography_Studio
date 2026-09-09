// Each tuple pins the complete reviewed source and its local-only excerpts.
// Changed/custom sources must be reviewed again, not matched by their label.
const lights = {
  柔和順光: ['soft frontal key light on the subject, even facial illumination, low-contrast skin detail, gentle minimal cast shadows', ['soft frontal key light on the subject']],
  均勻平光: ['flat even subject lighting, balanced full-face illumination, minimal modeling contrast, clean readable skin and clothing exposure', ['flat even subject lighting', 'minimal modeling contrast']],
  側向柔光: ['soft side key light on the subject, gentle cheek contour, gradual shadow transition, natural facial dimensionality', ['soft side key light on the subject']],
  側向硬光: ['hard side key light on the subject, sharp facial-plane shadow edge, sculpted side contrast, crisp highlight-to-shadow separation', ['hard side key light on the subject', 'crisp highlight-to-shadow separation']],
  側逆光: ['diagonal rear-side subject light, soft rim edge along hair and shoulder, partial facial fill, separated subject contour', ['diagonal rear-side subject light']],
  逆光輪廓光: ['strong back rim light on the subject, bright outline along hair shoulders and body edge, controlled shadow-side detail', ['strong back rim light on the subject', 'controlled shadow-side detail']],
  頂部照明: ['overhead top light on the subject, downward illumination, eye-socket and nose shadows, vertical falloff across face and torso', ['overhead top light on the subject', 'downward illumination']],
  下方反射光: ['upward bounce fill on the subject, reflected light from below, subtle lower-face lift, softened chin and neck shadows', ['upward bounce fill on the subject', 'reflected light from below']],
  漫射霧光: ['diffused light wrapping around the subject, softened shadow edges, low-contrast subject illumination, broad fill across skin and clothing', ['softened shadow edges', 'low-contrast subject illumination']],
  硬質晴光: ['hard direct sunlight on the subject, crisp shadow edges, deep subject-side contrast, clear bright highlights on skin and clothing', ['hard direct sunlight on the subject', 'crisp shadow edges']],
  低光高反差: ['low-key subject lighting, deep face and body shadows, selective highlight accents, high contrast across the subject', ['low-key subject lighting', 'selective highlight accents']],
  高調亮光: ['high-key subject lighting, bright even exposure, pale soft shadows, clean highlight detail across face and clothing', ['high-key subject lighting', 'bright even exposure']],
  暖金黃昏色溫: ['warm golden-amber subject light color, honey-orange cast on skin and clothing, peach-toned highlights, subdued warm shadows, no sunset or sky cues', ['warm golden-amber subject light color', 'peach-toned highlights']],
  冷白日光色溫: ['cool clean daylight subject color, crisp pale-white highlights, neutral-cool skin rendering, restrained cool shadow edges, no sky or weather cues', ['cool clean daylight subject color', 'crisp pale-white highlights']],
  室內暖白燈色溫: ['warm-white practical-lamp subject color, neutral-warm skin highlights, gentle household lamp tone, no deep tungsten amber dominance', ['neutral-warm skin highlights']],
  冷藍夜色光: ['cool blue night-toned subject light, restrained blue-cyan rim or fill, subdued cool shadow tint, no moon skyline or night-sky cues', ['cool blue night-toned subject light', 'subdued cool shadow tint']],
  混合色溫光: ['mixed warm and cool subject lighting, warm-cool highlight contrast across face and clothing, layered color temperature separation', ['mixed warm and cool subject lighting', 'layered color temperature separation']],
  霓虹染色光: ['neon color spill across the subject, saturated colored highlights on skin hair and clothing edges, controlled vivid color cast', ['neon color spill across the subject', 'controlled vivid color cast']],
  窗格投影光: ['window-frame pattern light cast on the subject, framed daylight shadows, visible geometric shadow bands on face and clothing', ['visible geometric shadow bands']],
  百葉窗條紋投影光: ['window-blind stripe light across the subject, horizontal shadow bands on face skin and clothing, sharp slatted light-dark pattern', ['horizontal shadow bands', 'sharp slatted light-dark pattern']],
  冷調窗邊輪廓光: ['cool window-side rim light on the subject, side-edge illumination from a nearby window, clean cool contour separation, soft shadow-side falloff', ['soft shadow-side falloff', 'clean cool contour separation']],
  斑駁樹影光: ['dappled leaf-shadow light on the subject, broken sunlight patches across skin and clothing, irregular branch and leaf shadow pattern', ['broken sunlight patches']],
  潮濕反射光: ['wet-surface reflected fill light on the subject, upward bounce from damp ground or walls, glossy reflected highlights on lower face and clothing', ['reflected fill light on the subject', 'glossy reflected highlights']],
  局部暖光: ['local warm practical-light pool on the subject, lamp-driven amber highlight zone, warm falloff across face hands and clothing', ['amber highlight zone', 'warm falloff']],
  深夜邊緣微光: ['minimal nocturnal subject rim light, faint cool edge tracing along face hair shoulders and body outline, mostly dark subject mass', ['minimal nocturnal subject rim light', 'faint cool edge']],
};
const films = {
  '富士 Provia 清透明亮': ['Fujifilm Provia film simulation, clean balanced color, transparent skin tones, bright natural contrast, crisp daylight-neutral rendering, smooth saturation response', ['Fujifilm Provia film simulation', 'clean balanced color', 'bright natural contrast']],
  日系亮膚高彩濾鏡: ['glossy Japanese portrait color grade, lifted midtones, creamy pale highlights, warm peach skin-tone protection, cyan-green shadows, vivid saturation, clean deep blacks', ['lifted midtones', 'creamy pale highlights', 'cyan-green shadows', 'vivid saturation']],
  日系雜誌高彩銳利: ['Japanese magazine color grade, vivid editorial saturation, polished highlight brightness, crisp micro-contrast, sharp edge definition, clean dense blacks, print-finish contrast', ['Japanese magazine color grade', 'vivid editorial saturation', 'crisp micro-contrast', 'sharp edge definition']],
  高階黑白灰階: ['premium monochrome rendering, black-and-white tonal response, rich grayscale separation, crisp micro-detail, deep blacks, luminous highlight control', ['premium monochrome rendering', 'black-and-white tonal response', 'rich grayscale separation', 'luminous highlight control']],
};
const optics = {
  '霧化高光 Bloom': ['highlight bloom, halation around bright areas, local luminance bleeding, softened highlight edges, optical glow spill limited to high-value regions', ['highlight bloom', 'halation around bright areas', 'local luminance bleeding']],
  '柔焦濾鏡 Soft Focus': ['soft focus diffusion filter, lowered microcontrast, softened fine detail, gentle glow around high-contrast edges, preserved overall facial and subject structure', ['soft focus diffusion filter', 'lowered microcontrast', 'softened fine detail']],
  '色差 Chromatic Aberration': ['chromatic aberration, subtle RGB edge fringing, lateral color separation along high-contrast edges, minor lens dispersion artifact', ['chromatic aberration', 'subtle RGB edge fringing']],
};
const environments = {
  室內冷白環境光: ['indoor cool artificial ambience, cool-white ambient cast, clean neutral room brightness, dim exterior if visible', ['cool-white ambient cast']],
  高調純白攝影棚: ['high-key white studio environment, ultra-clean bright commercial illumination, near-shadowless studio ambience, no background structure specified', ['ultra-clean bright commercial illumination']],
  柔霧美妝攝影棚: ['soft beauty studio environment, diffused shadowless illumination, creamy clean light quality, polished commercial portrait ambience, no background structure specified', ['diffused shadowless illumination', 'creamy clean light quality']],
};
const skins = {
  玻璃水光肌: ['glass skin, dewy luminous skin texture, hydrated reflective complexion', 'dewy luminous skin texture'],
  柔霧細緻肌: ['soft matte skin texture, refined pores, velvety smooth finish', 'soft matte skin texture'],
  微曬陽光感膚質: ['slightly sun-kissed skin texture, subtle warm flush, healthy outdoor glow', 'slightly sun-kissed skin texture'],
};
const active = item => Boolean(item && item.zh !== '全無' && item.id !== 'none' && item.en && item.en !== 'none');
export function reviewedLocalEffects(selected) {
  const effects = [], diagnostics = [];
  for (const [key, rules, group] of [['lightDirection', lights, 'lighting'], ['lighting', environments, 'lighting'],
    ['film', films, 'imaging'], ['opticalEffect', optics, 'imaging']]) {
    const item = selected[key];
    if (!active(item)) continue;
    const rule = rules[item.zh];
    if (!rule || item.en !== rule[0]) { diagnostics.push(`unreviewed-effect:${key}`); continue; }
    effects.push(...rule[1].map(excerpt => ({ group, ref: { key, excerpt } })));
  }
  return { effects, diagnostics };
}
export function reviewedLocalSkin(item, regions) {
  const rule = skins[item?.zh];
  if (!rule || item.en !== rule[0]) return [];
  return regions.map(region => ({ group: 'localSkin', region,
    ref: { key: 'character.skinDetails', excerpt: rule[1] } }));
}

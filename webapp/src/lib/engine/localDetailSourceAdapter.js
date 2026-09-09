// Small reviewed catalog slice. This does NOT resolve wardrobe priority, infer
// missing layers, or accept a main renderer's visibility-projected items.
const rules = [
  {
    category: '套裝 (Outfit Presets)', zh: '亮面乳膠束帶套裝',
    target: 'abdomen-navel', regions: ['navelPosition', 'surroundingAbdomen', 'nearbyWaistline'],
    state: 'covered', evidence: 'continuous unbroken coverage',
    fragments: [['localFabric', 'opaque mirror-polished latex']],
  },
  {
    category: '連身 (Dresses)', zh: '短版｜高領挖腰連身泳裝',
    target: 'abdomen-navel', regions: ['navelPosition'], state: 'exposed',
    evidence: 'gap exposing most of the abdomen and navel',
    fragments: [['effectiveCoverageModifiers', 'oversized open front torso gap exposing most of the abdomen and navel']],
  },
  {
    category: '連身 (Dresses)', zh: '短版｜亮面乳膠拉鏈洋裝',
    target: 'abdomen-navel', regions: ['navelPosition'], state: 'exposed',
    evidence: 'zipper opened down below the navel by default',
    fragments: [['localFabric', 'glossy latex'], ['effectiveCoverageModifiers', 'a vertical strip of bare skin along the abdomen']],
  },
  {
    category: '上身 (Tops)', zh: '一字領上衣',
    target: 'collarbone-chest', regions: ['collarbone'], state: 'exposed',
    evidence: 'open collarbone line', fragments: [['localNeckline', 'open collarbone line']],
  },
  {
    category: '上身 (Tops)', zh: '透膚刺繡襯衫',
    target: 'collarbone-chest', regions: ['upperChest'], state: 'unknown',
    evidence: 'semi-sheer embroidered shirt',
    fragments: [['localFabric', 'lightweight voile fabric'], ['localFabric', 'translucent layered surface']],
  },
  {
    category: '上身 (Tops)', zh: '高領連身上衣',
    target: 'abdomen-navel', regions: ['navelPosition', 'surroundingAbdomen', 'nearbyWaistline'],
    state: 'covered', evidence: 'continuous torso line',
    fragments: [['localFabric', 'smooth stretch or ribbed fabric']],
  },
];

// Pin the complete reviewed source, not just a retained exposure substring.
// A same-label custom edit may reverse coverage while keeping that substring.
const reviewedSources = {
  亮面乳膠束帶套裝: 'opaque mirror-polished latex full-body catsuit with a highly reflective wet-look surface producing sharp mirror reflections and bright specular highlights across every body contour while maintaining a vacuum-tight second-skin fit that provides continuous unbroken coverage from the fitted collar and long sleeves through the torso and hips to the full-length legs, short center-front zipper, sparse slim decorative strap tabs with tiny buckles and small metallic O-rings placed at the collar, waist and hips as surface-mounted jewelry-like accents over the uninterrupted latex',
  '短版｜高領挖腰連身泳裝': 'high-neck extreme front cut-out monokini swimsuit, bikini-like one-piece construction, separate high-neck chest panel and high-cut bikini bottom connected only by thin side straps, oversized open front torso gap exposing most of the abdomen and navel, smooth stretch swim fabric, main swim fabric color controlled by dress color selection',
  '短版｜亮面乳膠拉鏈洋裝': 'glossy latex collared short-sleeve mini dress, one-piece bodycon silhouette, smooth reflective surface, tone-on-tone center-front zipper from collar through the skirt, zipper opened down below the navel by default, exposing the cleavage and a vertical strip of bare skin along the abdomen, with the navel area left visible for a navel piercing, main latex color controlled by dress color selection',
  一字領上衣: 'off-shoulder top, soft neckline silhouette, open collarbone line, refined neckline detail',
  透膚刺繡襯衫: 'semi-sheer embroidered shirt, lightweight voile fabric, tonal floral embroidery, soft draped collar structure, translucent layered surface',
  高領連身上衣: 'high-neck bodysuit-style top, sleeveless construction, smooth stretch or ribbed fabric, continuous torso line',
};

/** Returns ONE layer for the requested target. Unknown or modified garments
 * remain barriers. Caller supplies all layers in actual outer-to-inner order.
 * Source refs address the caller's same-snapshot sources dictionary.
 * The absence of a garment is not an exposed layer and is not handled here.
 */
export function adaptLocalDetailLayer({ key, category, item, target, modifiers = [] }) {
  const layer = { id: key, regions: {}, details: [] };
  const rule = rules.find((r) => r.category === category && r.zh === item?.zh && r.target === target);
  if (!rule || modifiers.length || item?.en !== reviewedSources[rule.zh]) return layer;
  if (![rule.evidence, ...rule.fragments.map(([, text]) => text)].every((text) => item.en.includes(text))) return layer;
  for (const region of rule.regions) {
    layer.regions[region] = { state: rule.state, ref: { key, excerpt: rule.evidence } };
    for (const [group, excerpt] of rule.fragments) layer.details.push({ group, region, ref: { key, excerpt },
      ...(rule.state === 'exposed' && group !== 'localFabric' ? { requiresExposed: true } : {}) });
  }
  return layer;
}

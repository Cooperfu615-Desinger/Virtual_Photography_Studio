// Whole paired ownership is reviewed before relaxing the old bottom barrier.
// Never infer skin from a low waistband or silently ignore an unknown top.
const tops = {
  高領連身上衣: ['high-neck bodysuit-style top, sleeveless construction, smooth stretch or ribbed fabric, continuous torso line', 'smooth stretch or ribbed fabric', 'body'],
  長版寬鬆麻花針織毛衣: ['oversized cable-knit sweater, chunky knit texture, longline upper-thigh hem, dropped shoulders, extra-long relaxed sleeves, slouchy boyfriend fit', 'chunky knit texture', 'long'],
  長版襯衫: ["tailored longline men's dress shirt, crisp woven poplin, pointed collar, full button-front placket, structured cuffs, extended shirttail hem, relaxed sleeve volume, clean formal menswear silhouette", 'crisp woven poplin', 'shirt'],
};
const bottoms = {
  pants: {
    直筒牛仔褲: ['straight-leg jeans, clean denim texture, balanced leg line, classic five-pocket construction', 'clean denim texture'],
    運動棉褲: ['sweatpants, soft knit body, elastic waistband construction, relaxed athletic drape', 'soft knit body'],
  },
  skirt: {
    皮革迷你裙: ['leather mini skirt, glossy surface, compact skirt length, sharp lower-body line', 'glossy surface'],
    絲質長裙: ['silk maxi skirt, fluid drape, soft reflective sheen', 'soft reflective sheen'],
  },
};
const rises = {
  'high-rise waistband sitting above the natural waist': 'covered',
  'mid-rise waistband sitting at the natural waist': 'unknown',
  'low-rise waistband sitting on the hips': 'exposed',
  'ultra-low-rise waistband sitting very low on the hips': 'exposed',
};
const normal = 'top worn in a standard natural position';
const outside = 'top hem worn naturally loose over the waistband';
const tucked = 'top hem tucked neatly into the bottoms';
const active = item => Boolean(item && item.zh !== '全無' && item.id !== 'none' && item.en && item.en !== 'none');
const ref = (key, excerpt) => ({ key, excerpt });

export function reviewedWaistLayers(wardrobe, colors) {
  const top = tops[wardrobe.top?.zh];
  const keys = ['pants', 'skirt'].filter(key => active(wardrobe[key]));
  if (!top || wardrobe.top.en !== top[0] || keys.length !== 1
    || active(wardrobe.dress) || active(wardrobe.outfitPreset)) return null;
  const key = keys[0];
  const bottom = bottoms[key][wardrobe[key].zh];
  if (!bottom || wardrobe[key].en !== bottom[0]) return null;
  if (active(wardrobe.topPattern) || active(wardrobe.bottomPattern)
    || (active(wardrobe.topFit) && wardrobe.topFit.en !== 'standard upper-body cut')
    || (active(wardrobe.bottomFit) && wardrobe.bottomFit.en !== 'standard lower-body proportion')) return null;
  const style = active(wardrobe.topStyling) ? wardrobe.topStyling.en : normal;
  if (!(top[2] === 'body' ? [normal] : [normal, outside, tucked]).includes(style)) return null;
  const rise = active(wardrobe.bottomRise) ? wardrobe.bottomRise.en : '';
  if (rise && !Object.hasOwn(rises, rise)) return null;
  for (const key of ['topColor', 'bottomColor']) {
    if (active(colors[key]) && !/^[a-z]+(?:[ -][a-z]+){0,3}$/i.test(colors[key].en)) return null;
  }
  const topLayer = { id: 'wardrobe.top', regions: {}, details: [] };
  const bottomLayer = { id: `wardrobe.${key}`, regions: {}, details: [] };
  const addFabric = (layer, region, excerpt, colorKey) => layer.details.push({ group: 'localFabric', region,
    ref: ref(layer.id, excerpt), ...(active(colors[colorKey]) ? { colorRef: ref(`colors.${colorKey}`, colors[colorKey].en) } : {}) });
  for (const region of ['navelPosition', 'surroundingAbdomen', 'nearbyWaistline']) {
    topLayer.regions[region] = { state: top[2] === 'shirt' ? 'unknown' : 'covered', ref: ref(topLayer.id, top[0]) };
    addFabric(topLayer, region, top[1], 'topColor');
  }
  const state = rises[rise] || 'unknown';
  if (rise) bottomLayer.regions.navelPosition = { state, ref: ref('wardrobe.bottomRise', rise) };
  // The waistband surface itself is known even when its navel alignment is not.
  bottomLayer.regions.nearbyWaistline = { state: 'covered', ref: ref(bottomLayer.id, bottom[0]) };
  addFabric(bottomLayer, 'nearbyWaistline', bottom[1], 'bottomColor');
  if (state === 'covered') addFabric(bottomLayer, 'navelPosition', bottom[1], 'bottomColor');
  if (rise) bottomLayer.details.push({ group: 'localWaistline', region: 'nearbyWaistline', ref: ref('wardrobe.bottomRise', rise) });
  // Side abdomen remains unknown: no blanket exposure from the central opening.
  return top[2] === 'body' || style === tucked ? [bottomLayer, topLayer] : [topLayer, bottomLayer];
}

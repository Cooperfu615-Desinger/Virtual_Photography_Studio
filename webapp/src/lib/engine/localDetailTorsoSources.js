// Reviewed exact-source torso slice. These are local surfaces, not whole
// garment rewrites. Unknown hems/closures never establish bare skin.
import { reviewedOuterLayer } from './localDetailOuterSources.js';
const tops = {
  高領針織上衣: ['turtleneck knit top, fine gauge knit, smooth neckline transition, clean torso structure', 'fine gauge knit', 'high'],
  高領連身上衣: ['high-neck bodysuit-style top, sleeveless construction, smooth stretch or ribbed fabric, continuous torso line', 'smooth stretch or ribbed fabric', 'high'],
  襯衫: ['shirt, crisp cotton poplin, clean placket construction, balanced collar line', 'crisp cotton poplin', 'fabric'],
  絲綢緞面襯衫: ['silk satin blouse, luminous satin sheen, soft draping sleeves, refined cuff or ruffle finish, fluid blouse construction', 'luminous satin sheen', 'fabric'],
  短袖上衣: ['short-sleeve top, smooth stretch fabric, clean torso line, compact sleeve proportion', 'smooth stretch fabric', 'fabric'],
  '落肩 T 恤': ['dropped-shoulder t-shirt, washed cotton jersey, low shoulder seam, relaxed upper-body proportion', 'washed cotton jersey', 'fabric'],
  棉質細肩背心: ['cotton camisole top, slim shoulder straps, soft ribbed knit, clean compact upper-body line', 'slim shoulder straps', 'straps'],
  絲質細肩帶上衣: ['silk camisole top, delicate straps, fluid sheen', 'delicate straps', 'straps'],
  短版吊帶背心: ['cropped camisole, narrow straps, concise torso block, streamlined upper-body silhouette', 'narrow straps', 'straps'],
};
const longTops = {
  長版寬鬆麻花針織毛衣: ['oversized cable-knit sweater, chunky knit texture, longline upper-thigh hem, dropped shoulders, extra-long relaxed sleeves, slouchy boyfriend fit', 'chunky knit texture', 'covered'],
  長版襯衫: ["tailored longline men's dress shirt, crisp woven poplin, pointed collar, full button-front placket, structured cuffs, extended shirttail hem, relaxed sleeve volume, clean formal menswear silhouette", 'crisp woven poplin', 'unknown'],
};
const shirt = 'longline button-up shirt in cotton poplin, pointed collar, long sleeves with buttoned cuffs, curved shirttail hem';
const normal = 'outerwear worn normally on both shoulders in a standard outer-layer position';
const single = 'slipped down over one upper arm, with the neckline lowered on that side and the opposite shoulder still covered';
const double = 'slipped down around both upper arms, with the neckline resting below both shoulders and both arms still in the sleeves';
const open = 'worn open at the front';
const closures = new Set([open,
  'outerwear worn with its front closure in the normal default position, front panels aligned naturally',
  'button-front outerwear partially buttoned, with some buttons fastened and the remaining front panels naturally open']);
const active = (item) => item && item.zh !== '全無' && item.id !== 'none' && item.en && item.en !== 'none';
const ref = (key, excerpt) => ({ key, excerpt });
const detail = (group, region, key, excerpt) => ({ group, region, ref: ref(key, excerpt) });

/** null means not owned by this reviewed slice; an empty layer means owned but
 * stale/unsupported, and must not fall through to a weaker substring rule. */
export function reviewedTorsoLayer({ key, item, target, wardrobe, modifiers }) {
  if (key === 'outerwear' && item.zh !== '長版襯衫') return reviewedOuterLayer({ item, target, wardrobe });
  const layer = { id: `wardrobe.${key}`, regions: {}, details: [] };
  if (key === 'top' && Object.hasOwn(longTops, item.zh)) {
    const [source, excerpt, state] = longTops[item.zh];
    if (item.en !== source || modifiers.length) return layer;
    const regions = target === 'abdomen-navel' ? ['navelPosition', 'surroundingAbdomen', 'nearbyWaistline'] : ['upperChest'];
    for (const region of regions) {
      layer.regions[region] = { state, ref: ref(layer.id, source) };
      layer.details.push(detail('localFabric', region, layer.id, excerpt));
    }
    return layer;
  }
  if (key === 'top' && Object.hasOwn(tops, item.zh) && target === 'collarbone-chest') {
    const source = tops[item.zh];
    if (!source || item.en !== source[0] || modifiers.length) return layer;
    const [, excerpt, kind] = source;
    const regions = kind === 'high' ? ['neckBase', 'collarbone', 'upperChest']
      : kind === 'straps' ? ['collarbone'] : ['upperChest'];
    for (const region of regions) {
      layer.regions[region] = { state: kind === 'high' ? 'covered' : 'unknown', ref: ref(layer.id, source[0]) };
      layer.details.push(detail(kind === 'straps' ? 'localStraps' : 'localFabric', region, layer.id, excerpt));
    }
    return layer;
  }
  if (key !== 'outerwear' || item.zh !== '長版襯衫') return null;
  const styling = wardrobe.outerwearStyling;
  const opening = wardrobe.outerwearOpening;
  if (item.en !== shirt || active(wardrobe.outerwearFit) || active(wardrobe.outerwearPattern)
    || (active(styling) && ![normal, single, double].includes(styling.en))
    || (active(opening) && !closures.has(opening.en))) return layer;
  if (target === 'abdomen-navel') {
    // Only the central opening is known; side panels and waist remain unknown.
    if (opening?.en === open && (!active(styling) || styling.en === normal)) {
      layer.regions.navelPosition = { state: 'exposed', ref: ref('wardrobe.outerwearOpening', open) };
    }
    return layer;
  }
  // Unknown front closure retains the known outer surface, not inner fabric.
  layer.details.push(detail('localFabric', 'upperChest', layer.id, 'cotton poplin'));
  if (styling?.en === double) {
    layer.regions.collarbone = { state: 'exposed', ref: ref('wardrobe.outerwearStyling', 'neckline resting below both shoulders') };
  }
  // One-side lowering cannot release this aggregate bilateral collarbone region.
  // Neither shoulder state resolves upper-chest coverage or the front closure.
  return layer;
}

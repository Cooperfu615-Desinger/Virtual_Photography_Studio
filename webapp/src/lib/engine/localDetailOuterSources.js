// Exact reviewed local surfaces. Absent region coverage remains unknown;
// neither a short hem nor a translucent material guarantees visible skin.
import { reviewedOuterFit } from './localDetailChestSources.js';
const sources = {
  西裝外套: ['blazer, tailored jacket structure, defined lapels, clean shoulder line, polished suiting fabric', 'polished suiting fabric', 'button'],
  丹寧外套: ['denim jacket, washed denim texture, chest pockets, metal buttons, casual structured outerwear', 'washed denim texture', 'button'],
  連帽外套: ['sport zip-up hoodie, athletic hooded jacket, ribbed cuffs and hem, casual performance knit structure', 'casual performance knit structure', 'zip'],
  連帽外套_戴: ['soft zip hoodie, hooded sweatshirt jacket, front zipper, relaxed knit body, ribbed cuffs and hem, hood worn up framing the hair', 'relaxed knit body', 'hood-up'],
  柔軟毛絨泰迪熊外套: ['fluffy teddy fleece jacket, plush pile texture, rounded cozy outerwear structure', 'plush pile texture', 'unknown'],
  薄紗輕薄披衣外套: ['sheer lightweight cover-up jacket, translucent gauze mesh fabric, short sleeves, soft draped outerwear', 'translucent gauze mesh fabric', 'unknown'],
  短版粗花呢外套: ['cropped tweed jacket, textured woven surface, structured short silhouette, polished button front', 'textured woven surface', 'button'],
  蕾絲罩衫: ['lace robe cardigan, long open-front silhouette, lightweight lace texture, ruffled or scalloped hem', 'lightweight lace texture', 'long-open'],
};
const normal = 'outerwear worn normally on both shoulders in a standard outer-layer position';
const single = 'slipped down over one upper arm, with the neckline lowered on that side and the opposite shoulder still covered';
const double = 'slipped down around both upper arms, with the neckline resting below both shoulders and both arms still in the sleeves';
const open = 'worn open at the front';
const defaultClosure = 'outerwear worn with its front closure in the normal default position, front panels aligned naturally';
const halfButton = 'button-front outerwear partially buttoned, with some buttons fastened and the remaining front panels naturally open';
const halfZip = 'zip-front outerwear partially zipped, zipper closed to the mid-front while the upper front remains naturally open';
const active = item => Boolean(item && item.zh !== '全無' && item.id !== 'none' && item.en && item.en !== 'none');

export function reviewedOuterLayer({ item, target, wardrobe }) {
  const source = sources[item.zh];
  if (!source) return null;
  const layer = { id: 'wardrobe.outerwear', regions: {}, details: [] };
  const [en, fabric, kind] = source;
  const styling = wardrobe.outerwearStyling;
  const opening = wardrobe.outerwearOpening;
  const allowedClosures = [open, defaultClosure,
    ...(kind === 'button' ? [halfButton] : []), ...(['zip', 'hood-up'].includes(kind) ? [halfZip] : [])];
  if (item.en !== en || (active(wardrobe.outerwearFit) && !reviewedOuterFit(item, wardrobe.outerwearFit)) || active(wardrobe.outerwearPattern)
    || (active(styling) && ![normal, single, double].includes(styling.en))
    || (active(opening) && !allowedClosures.includes(opening.en))) return layer;
  if (target === 'abdomen-navel') {
    if (kind === 'long-open' && (!active(styling) || styling.en === normal)) {
      layer.regions.navelPosition = { state: 'exposed', ref: { key: layer.id, excerpt: 'long open-front silhouette' } };
    }
    return layer;
  }
  layer.details.push({ group: 'localFabric', region: 'upperChest', ref: { key: layer.id, excerpt: fabric } });
  // Hood position is an additional owner; do not borrow a plain collar's rule.
  if (kind !== 'hood-up' && styling?.en === double) {
    layer.regions.collarbone = { state: 'exposed', ref: { key: 'wardrobe.outerwearStyling', excerpt: 'neckline resting below both shoulders' } };
  }
  return layer;
}

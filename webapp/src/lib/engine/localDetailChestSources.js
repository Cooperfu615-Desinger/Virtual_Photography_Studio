import { eyeHairSources, eyeHairColors } from './localDetailEyeCatalog.js';

// These hem-only sources have no authored neckline change. This exception is
// chest-only, and only applies to the existing reviewed thirteen top sources.
const tops = new Set(['高領針織上衣', '高領連身上衣', '襯衫', '絲綢緞面襯衫', '短袖上衣', '落肩 T 恤',
  '棉質細肩背心', '絲質細肩帶上衣', '短版吊帶背心', '長版寬鬆麻花針織毛衣', '長版襯衫', '一字領上衣', '透膚刺繡襯衫']);
const hems = new Set(['top hem tucked neatly into the bottoms', 'top hem worn naturally loose over the waistband']);
export const chestOnlyHem = (item, modifier) => tops.has(item.zh) && hems.has(modifier?.en);

const fits = new Set(['fitted outerwear proportion', 'tight body-skimming outerwear fit',
  'oversized outerwear proportion with roomy shoulders and body']);
export const reviewedOuterFit = (item, fit) => ['長版襯衫', '連帽外套', '連帽外套_戴'].includes(item.zh) && fits.has(fit?.en);

const shortHair = new Set(['帥氣濕亮油頭', '乾淨短鮑伯', '齊瀏海圓弧鮑伯', '不對稱濕感短鮑伯', '復古外翹短髮', '輕透齊瀏海內彎鮑伯']);
const localHair = { 自然層次鎖骨髮: 'collarbone-length layered hair', 側分柔波中長髮: 'collarbone-length shape' };
const styling = new Set([
  'sleek close-to-head roots, restrained volume, compact hair silhouette, fine aligned strands, smooth uniform texture with a soft natural sheen, clean tapered ends, neatly framing the face',
  'sleek wet finish, defined damp sections, neat separated strands, controlled close-to-head shape',
]);
const active = item => Boolean(item && item.zh !== '全無' && item.id !== 'none' && item.en && item.en !== 'none');
const ref = (key, excerpt) => ({ key, excerpt });

/** Unknown hair position is an actual outer occluder, not evidence of bare
 * collarbones. Only the six reviewed short baselines are outside this crop.
 * Collarbone-length sources retain local hair without inventing its drape. */
export function reviewedChestHair(character) {
  const hair = character.hairstyle;
  if (!active(hair)) return null;
  const layer = { id: 'character.hairstyle', regions: {}, details: [] };
  if (hair.en !== eyeHairSources[hair.zh]?.[0]
    || (active(character.hairStylingState) && !styling.has(character.hairStylingState.en))) return layer;
  if (shortHair.has(hair.zh)) return { ...layer, regions: Object.fromEntries(['neckBase', 'collarbone', 'upperChest']
    .map(region => [region, { state: 'exposed', ref: ref(layer.id, hair.en) }])) };
  const excerpt = localHair[hair.zh];
  if (!excerpt) return layer;
  // The second source's length phrase alone has no noun; retain its adjacent
  // source-owned hair identity in the same local fragment.
  const text = hair.zh === '側分柔波中長髮' ? 'side-parted medium soft waves, collarbone-length shape' : excerpt;
  layer.details.push({ group: 'localHairOcclusion', region: 'collarbone', ref: ref(layer.id, text) });
  const color = eyeHairColors[character.hairColor?.zh];
  if (color && character.hairColor.en?.includes(color)) layer.details.push({ group: 'localHairOcclusion', region: 'collarbone', ref: ref('character.hairColor', color) });
  return layer;
}

// Exact-source location review. A selected accessory is not automatically on
// top of every garment; only the cincher explicitly says "worn over clothing".
const neck = {
  街頭風格金項鏈: ['short gold curb-link necklace worn around the base of the neck at collarbone level, understated streetwear jewelry', 'collarbone', 'short gold curb-link necklace'],
  鎖骨細金屬鏈: ['delicate collarbone chain detail, subtle metallic neck accent', 'collarbone', 'delicate collarbone chain detail'],
  '皮革 O 環頸圈': ['thin leather O-ring choker, narrow leather strap with a small metal O-ring, subtle edgy neck accent', 'neckBase', 'thin leather O-ring choker'],
  水滴寶石吊墜項鍊: ['small teardrop pendant necklace detail, delicate understated jewel accent', null, null],
};
const waist = {
  細版皮革腰帶: ['decorative slim leather waist belt worn loosely around hips with a simple off-center buckle', 'hips'],
  寬版皮革腰帶: ['decorative wide leather waist belt worn loosely around hips with a structured off-center buckle', 'hips'],
  鉚釘皮革腰帶: ['decorative studded leather waist belt worn loosely around hips with metal studs and compact off-center buckle', 'hips'],
  雙層銀鏈水晶腰鍊: ['two-layer silver waist chain, two delicate fine-link strands at slightly different heights, irregular pale blue translucent stone accents along one strand, layered jewelry around the waist and upper hips', 'unknown'],
  金色細鏈鑽石腰鍊: ['delicate gold waist chain, fine linked chain with evenly spaced tiny clear diamond-like gemstone accents, subtle sparkling jewelry worn around the waist and upper hips', 'unknown'],
  雙層銀鏈愛心腰鍊: ['double-layer silver waist chain, two parallel fine chains with evenly spaced polished round bead accents, a small centered heart charm at the front, delicate jewelry around the waist and hips', 'unknown'],
  愛心垂墜銀腰鍊: ['silver heart-charm waist chain, multiple open heart motifs spaced across the front, a short vertical chain hanging from the center heart and ending in a smaller heart pendant, delicate jewelry around the waist and upper hips', 'unknown'],
  銀色水鑽蝴蝶腰鏈: ['silver rhinestone butterfly waist chain, two delicate silver strands draped at slightly different heights, with multiple small rhinestone butterfly charms spaced across the low waist and upper hips, worn above low-rise bottoms', 'unknown'],
  肚臍環: ['round-cut diamond navel piercing at the belly button, clear circular gemstone, slim polished metal ring setting', 'piercing'],
  馬甲束腰: ['gothic black leather waist cincher, structured boning, front lace-up panel, silver buckle hardware, worn over clothing', 'over-clothing'],
};
const active = item => Boolean(item && item.zh !== '全無' && item.id !== 'none' && item.en && item.en !== 'none');
const ref = (key, excerpt) => ({ key, excerpt });
const barrier = id => ({ id, regions: {}, details: [] });
export function reviewedLocalAccessory(target, wardrobe) {
  const key = target === 'collarbone-chest' ? 'neckAccessory' : 'waistAccessory';
  const item = wardrobe[key];
  const sourceKey = `wardrobe.${key}`;
  const result = { beforeBase: [], afterBase: [], details: [], diagnostics: [] };
  if (!active(item)) return result;
  const rule = (key === 'neckAccessory' ? neck : waist)[item.zh];
  const unknown = reason => {
    // An unknown object cannot reveal skin, but does not erase an already
    // confirmed garment surface. Its over/under relation is NOT asserted.
    result.afterBase.push(barrier(sourceKey));
    result.diagnostics.push(`${reason}:${sourceKey}`);
    return result;
  };
  if (!rule || item.en !== rule[0]) return unknown('unreviewed-accessory');
  if (key === 'neckAccessory') {
    const [, region, excerpt] = rule;
    if (!region) return unknown('unresolved-pendant-position');
    const layer = barrier(sourceKey);
    for (const r of ['neckBase', 'collarbone', 'upperChest']) layer.regions[r] = {
      state: r === region ? 'unknown' : 'exposed', ref: ref(sourceKey, item.en),
    };
    layer.details.push({ group: 'visibleNeckAccessory', region, ref: ref(sourceKey, excerpt) });
    result.afterBase.push(layer);
    result.diagnostics.push(`accessory-layer-order-unconfirmed:${sourceKey}`);
    return result;
  }
  if (rule[1] === 'hips') {
    result.diagnostics.push(`outside-local-crop:${sourceKey}`);
    return result;
  }
  if (rule[1] === 'piercing') {
    result.details.push({ group: 'visibleNavelPiercing', region: 'navelPosition',
      ref: ref(sourceKey, 'round-cut diamond navel piercing at the belly button') });
    return result;
  }
  if (rule[1] === 'over-clothing') {
    const layer = barrier(sourceKey);
    // A waist cincher has a known local surface, but its exact navel alignment
    // is not supplied. Do not label the whole abdomen covered or exposed.
    layer.details.push({ group: 'visibleWaistAccessory', region: 'nearbyWaistline',
      ref: ref(sourceKey, 'black leather waist cincher') });
    result.beforeBase.push(layer);
    return result;
  }
  // Waist/upper-hip length and a hanging charm do not locate the chain at the
  // navel or establish which side of a top it is worn on. Record, don't invent.
  return unknown('unresolved-waist-chain-position');
}

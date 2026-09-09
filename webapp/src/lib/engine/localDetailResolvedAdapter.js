import { adaptLocalDetailLayer } from './localDetailSourceAdapter.js';
import { buildLocalDetailBundle } from './localDetailProjection.js';
import { reviewedEyeLayers, reviewedEyeExpression } from './localDetailEyeSources.js';

const eyeSources = {
  韓系偶像臉: 'clear bright eyes', 日系清透臉: 'clean gentle eyes',
  甜美可愛臉: 'bright friendly eyes', 混血立體臉: 'deep-set eyes',
};
const skinSources = {
  玻璃水光肌: 'dewy luminous skin texture', 柔霧細緻肌: 'soft matte skin texture',
  微曬陽光感膚質: 'slightly sun-kissed skin texture',
};
const lightSources = {
  高調亮光: ['high-key subject lighting', 'bright even exposure'],
  側向柔光: ['soft side key light on the subject'],
  柔和順光: ['soft frontal key light on the subject'],
};
const categories = {
  top: '上身 (Tops)', dress: '連身 (Dresses)', outfitPreset: '套裝 (Outfit Presets)',
  outerwear: '外套 (Outerwear)',
};
const modifierKeys = {
  top: ['topFit', 'topStyling', 'topPattern'],
  dress: ['topFit', 'topStyling', 'topPattern', 'bottomFit', 'bottomRise', 'bottomPattern'],
  outfitPreset: [],
  outerwear: ['outerwearFit', 'outerwearPattern', 'outerwearOpening', 'outerwearStyling'],
};
const baselineModifiers = new Set(['standard upper-body cut', 'top worn in a standard natural position']);
const liveLabels = {
  '套裝：亮面乳膠束帶': '亮面乳膠束帶套裝',
  '連身：短版｜高領挖腰連身泳裝': '短版｜高領挖腰連身泳裝',
  '連身：短版｜亮面乳膠拉鏈洋裝': '短版｜亮面乳膠拉鏈洋裝',
};
const present = (item) => Boolean(item && item.zh !== '全無' && item.id !== 'none'
  && typeof item.en === 'string' && item.en.trim() && item.en !== 'none');
const reference = (key, excerpt) => ({ key, excerpt });
const has = (item, text) => typeof text === 'string' && typeof item?.en === 'string' && item.en.includes(text);
const fragment = (group, region, key, excerpt) => ({ group, region, ref: reference(key, excerpt) });
const barrier = (id) => ({ id, regions: {}, details: [] });

/** Consume resolved slots directly. Never consult controls, reselect clothes,
 * parse public prompts, or invoke random. Unsupported owners/modifiers stay
 * barriers until their own source rules are reviewed; this is a bounded slice.
 */
export function buildResolvedLocalDetailBundle({ subjectCount, subjectKind, imageType,
  character = {}, wardrobe = {}, colors = {}, lightDirection } = {}) {
  if (subjectCount !== 1) return Object.freeze({});
  const sources = {};
  for (const [key, item] of Object.entries(character)) if (item) sources[`character.${key}`] = item;
  for (const [key, item] of Object.entries(wardrobe)) if (item) sources[`wardrobe.${key}`] = item;
  for (const [key, item] of Object.entries(colors)) if (item) sources[`colors.${key}`] = item;
  if (lightDirection) sources.lightDirection = lightDirection;
  const targets = {};
  // Character Cards and special looks can embed identities, headwear and
  // layers not represented by ordinary slots. Never silently substitute them.
  const unsupportedOwner = Boolean(subjectKind || present(wardrobe.specialOutfit));
  if (unsupportedOwner) return buildLocalDetailBundle({ subjectCount, imageType, sources, targets });

  const effects = (lightSources[lightDirection?.zh] || []).filter((text) => has(lightDirection, text))
    .map((excerpt) => ({ group: 'lighting', ref: reference('lightDirection', excerpt) }));
  const faceText = eyeSources[character.facialFeatures?.zh];
  const faceKey = 'character.facialFeatures';
  const eyeModel = { layers: reviewedEyeLayers(character, wardrobe), details: [], effects };
  if (has(character.facialFeatures, faceText)) {
    eyeModel.layers.push({ id: faceKey, regions: { eyes: { state: 'exposed', ref: reference(faceKey, faceText) } } });
    eyeModel.details.push(fragment('eyeIdentity', 'eyes', faceKey, faceText));
    eyeModel.details.push(...reviewedEyeExpression(character.expression));
    const skin = skinSources[character.skinDetails?.zh];
    if (has(character.skinDetails, skin)) eyeModel.details.push(fragment('localSkin', 'eyes', 'character.skinDetails', skin));
  }
  targets.eyes = eyeModel;

  for (const target of ['collarbone-chest', 'abdomen-navel']) {
    const model = { layers: [], details: [], effects };
    if (present(colors.completeLookPalette)) model.layers.push(barrier('unreviewed-complete-look-palette'));
    if (target === 'abdomen-navel') {
      const waist = wardrobe.waistAccessory;
      if (present(waist)) {
        if (waist.zh === '肚臍環' && has(waist, 'round-cut diamond navel piercing at the belly button')) {
          model.details.push(fragment('visibleNavelPiercing', 'navelPosition', 'wardrobe.waistAccessory',
            'round-cut diamond navel piercing at the belly button'));
        } else model.layers.push(barrier('unreviewed-waist-accessory'));
      }
      // A waistband may occlude the navel. No low-rise inference from a name.
      if (present(wardrobe.pants) || present(wardrobe.skirt)) model.layers.push(barrier('unreviewed-bottom-waistline'));
    } else if (present(wardrobe.neckAccessory)) model.layers.push(barrier('unreviewed-neck-accessory'));

    for (const key of ['outerwear', 'outfitPreset', 'dress', 'top']) {
      const item = wardrobe[key];
      if (!present(item)) continue;
      const sourceKey = `wardrobe.${key}`;
      const modifiers = modifierKeys[key].map((key) => wardrobe[key]).filter(present)
        .filter((modifier) => !baselineModifiers.has(modifier.en));
      let layer = adaptLocalDetailLayer({ key: sourceKey, category: categories[key],
        item: { ...item, zh: liveLabels[item.zh] || item.zh }, target, modifiers });
      // An open, normally worn shirt exposes only its central opening; the
      // next layer still controls skin visibility. Never label the sides bare.
      if (key === 'outerwear' && target === 'abdomen-navel' && item.zh === '長版襯衫'
        && has(item, 'longline button-up shirt in cotton poplin')
        && wardrobe.outerwearOpening?.en === 'worn open at the front'
        && !present(wardrobe.outerwearFit) && !present(wardrobe.outerwearPattern)
        && (!present(wardrobe.outerwearStyling) || wardrobe.outerwearStyling.zh === '正常穿著')) {
        layer = { id: sourceKey, regions: { navelPosition: { state: 'exposed',
          ref: reference('wardrobe.outerwearOpening', 'worn open at the front') } }, details: [] };
      }
      const colorKey = key === 'outfitPreset' ? 'outfitPresetPrimaryColor' : `${key}Color`;
      const color = colors[colorKey];
      if (present(color)) {
        // Simple local colors only; complex named palettes need role-aware
        // treatment instead of importing whole-outfit palette instructions.
        if (/^[a-z]+(?:[ -][a-z]+){0,3}$/i.test(color.en)) {
          layer.details = layer.details.map((d) => d.group === 'localFabric'
            ? { ...d, colorRef: reference(`colors.${colorKey}`, color.en) } : d);
        } else layer = barrier(`unreviewed-color:${sourceKey}`);
      }
      model.layers.push(layer);
    }
    // An opened outer garment alone cannot establish underlying bare skin.
    if (!['top', 'dress', 'outfitPreset'].some((key) => present(wardrobe[key]))) model.layers.push(barrier('missing-base-garment'));
    targets[target] = model;
  }
  return buildLocalDetailBundle({ subjectCount, imageType, sources, targets });
}

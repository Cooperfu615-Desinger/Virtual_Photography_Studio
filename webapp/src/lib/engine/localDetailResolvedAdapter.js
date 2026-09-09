import { adaptLocalDetailLayer } from './localDetailSourceAdapter.js';
import { buildLocalDetailBundle } from './localDetailProjection.js';
import { reviewedEyeLayers, reviewedEyeExpression, reviewedEyeIdentity } from './localDetailEyeSources.js';
import { reviewedTorsoLayer } from './localDetailTorsoSources.js';
import { reviewedWaistLayers } from './localDetailWaistSources.js';
import { chestOnlyHem, reviewedChestHair } from './localDetailChestSources.js';
import { reviewedLocalAccessory } from './localDetailAccessorySources.js';
import { reviewedLocalEffects, reviewedLocalSkin } from './localDetailEffectSources.js';
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
const liveLabels = {
  '套裝：亮面乳膠束帶': '亮面乳膠束帶套裝',
  '連身：短版｜高領挖腰連身泳裝': '短版｜高領挖腰連身泳裝',
  '連身：短版｜亮面乳膠拉鏈洋裝': '短版｜亮面乳膠拉鏈洋裝',
};
const present = (item) => Boolean(item && item.zh !== '全無' && item.id !== 'none'
  && typeof item.en === 'string' && item.en.trim() && item.en !== 'none');
const reference = (key, excerpt) => ({ key, excerpt });
const barrier = (id) => ({ id, regions: {}, details: [] });

/** Consume resolved slots directly. Never consult controls, reselect clothes,
 * parse public prompts, or invoke random. Unsupported owners/modifiers stay
 * barriers until their own source rules are reviewed; this is a bounded slice.
 */
export function buildResolvedLocalDetailBundle({ subjectCount, subjectKind, imageType,
  character = {}, wardrobe = {}, colors = {}, lightDirection, lighting, film, opticalEffect } = {}) {
  if (subjectCount !== 1) return Object.freeze({});
  const sources = {};
  for (const [key, item] of Object.entries(character)) if (item) sources[`character.${key}`] = item;
  for (const [key, item] of Object.entries(wardrobe)) if (item) sources[`wardrobe.${key}`] = item;
  for (const [key, item] of Object.entries(colors)) if (item) sources[`colors.${key}`] = item;
  const selectedEffects = { lightDirection, lighting, film, opticalEffect };
  for (const [key, item] of Object.entries(selectedEffects)) if (item) sources[key] = item;
  const targets = {};
  // Character Cards and special looks can embed identities, headwear and
  // layers not represented by ordinary slots. Never silently substitute them.
  const unsupportedOwner = Boolean(subjectKind || present(wardrobe.specialOutfit));
  if (unsupportedOwner) return buildLocalDetailBundle({ subjectCount, imageType, sources, targets });

  const { effects, diagnostics } = reviewedLocalEffects(selectedEffects);
  const identity = reviewedEyeIdentity(character.facialFeatures, sources);
  const eyeModel = { layers: reviewedEyeLayers(character, wardrobe), details: [], effects, diagnostics };
  if (identity) {
    eyeModel.layers.push(identity.layer);
    eyeModel.details.push(...identity.details);
    eyeModel.details.push(...reviewedEyeExpression(character.expression));
    eyeModel.details.push(...reviewedLocalSkin(character.skinDetails, ['eyes']));
  }
  targets.eyes = eyeModel;

  for (const target of ['collarbone-chest', 'abdomen-navel']) {
    const model = { layers: [], details: reviewedLocalSkin(character.skinDetails,
      target === 'collarbone-chest' ? ['neckBase', 'collarbone', 'upperChest'] : ['navelPosition', 'surroundingAbdomen']), effects };
    if (target === 'collarbone-chest') {
      const hairLayer = reviewedChestHair(character);
      if (hairLayer) model.layers.push(hairLayer);
    }
    const waistLayers = target === 'abdomen-navel' ? reviewedWaistLayers(wardrobe, colors) : null;
    if (present(colors.completeLookPalette)) model.layers.push(barrier('unreviewed-complete-look-palette'));
    const accessory = reviewedLocalAccessory(target, wardrobe);
    model.details.push(...accessory.details);
    model.diagnostics = [...diagnostics, ...accessory.diagnostics];

    for (const key of ['outerwear', 'outfitPreset', 'dress', 'top']) {
      if (key === 'outfitPreset') {
        model.layers.push(...accessory.beforeBase);
        // A waistband may occlude the navel, but not a cincher worn OVER it.
        if (target === 'abdomen-navel' && !waistLayers && (present(wardrobe.pants) || present(wardrobe.skirt))) {
          model.layers.push(barrier('unreviewed-bottom-waistline'));
        }
      }
      const item = wardrobe[key];
      if (!present(item)) continue;
      if (key === 'top' && waistLayers) {
        model.layers.push(...waistLayers);
        continue;
      }
      const sourceKey = `wardrobe.${key}`;
      const modifiers = modifierKeys[key].filter(slot => present(wardrobe[slot]))
        .filter(slot => !(slot === 'topFit' && wardrobe[slot].en === 'standard upper-body cut'))
        .filter(slot => !(slot === 'topStyling' && wardrobe[slot].en === 'top worn in a standard natural position'))
        .filter(slot => !(slot === 'topStyling' && key === 'top' && target === 'collarbone-chest' && chestOnlyHem(item, wardrobe[slot])))
        .map(slot => wardrobe[slot]);
      let layer = reviewedTorsoLayer({ key, item, target, wardrobe, modifiers }) ?? adaptLocalDetailLayer({ key: sourceKey, category: categories[key],
        item: { ...item, zh: liveLabels[item.zh] || item.zh }, target, modifiers });
      const colorKey = key === 'outfitPreset' ? 'outfitPresetPrimaryColor' : `${key}Color`;
      const color = colors[colorKey];
      if (present(color)) {
        // Simple local colors only; complex named palettes need role-aware
        // treatment instead of importing whole-outfit palette instructions.
        if (/^[a-z]+(?:[ -][a-z]+){0,3}$/i.test(color.en)) {
          layer.details = layer.details.map((d) => ['localFabric', 'localStraps'].includes(d.group)
            ? { ...d, colorRef: reference(`colors.${colorKey}`, color.en) } : d);
        } else layer = barrier(`unreviewed-color:${sourceKey}`);
      }
      model.layers.push(layer);
    }
    // An opened outer garment alone cannot establish underlying bare skin.
    if (!['top', 'dress', 'outfitPreset'].some((key) => present(wardrobe[key]))) model.layers.push(barrier('missing-base-garment'));
    model.layers.push(...accessory.afterBase);
    targets[target] = model;
  }
  return buildLocalDetailBundle({ subjectCount, imageType, sources, targets });
}

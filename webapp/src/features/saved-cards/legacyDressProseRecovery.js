// Evidence-scoped prose compatibility only. Never run on a structured snapshot.
import { createWardrobeRecoveryContext, recoverWardrobeColors } from './wardrobeColorRecovery.js';
const normalize = value => String(value || '').replace(/`/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const concrete = item => item?.id && !['none', 'random'].includes(item.id) && item.zh !== '全無';
const sources = item => [item.en, ...(item.meta?.legacyPromptAliases || [])].filter(Boolean).map(normalize);
const includesSource = (text, item) => sources(item).some(source => text.includes(source));
const presetParts = ['', 'Color', 'PrimaryColor', 'ContrastColor', 'LockedPalette'];
const regionHint = /\b(?:dress palette from top to bottom|coordinated top-to-bottom palette|upper\/main dress area|lower hem or skirt area)\b/;

export function prepareLegacyDressProseRecovery(prompt, locks, controls) {
  const context = createWardrobeRecoveryContext(prompt);
  const map = new Map(controls.map(control => [control.key, control]));
  const dresses = (map.get('dressId')?.options || []).filter(concrete);
  const dressIds = new Set(dresses.map(item => item.id));
  const keys = new Set(), roles = new Map();
  const set = (key, value = '') => { if (map.has(key) && locks[key] !== value) { locks[key] = value; keys.add(key); } };
  const clearPreset = role => presetParts.forEach(part => set(`outfitPreset${role}${part}Id`));
  const clearDress = role => {
    set(`dress${role}Id`); set(`dress${role}ColorId`); set(`topBottomPalette${role}Id`);
    if (dressIds.has(locks[`outfitPreset${role}Id`])) clearPreset(role);
    roles.set(role, { active: false });
  };
  const texts = context.duo ? context.roles : { '': context.single };
  const candidates = Object.entries(texts).map(([role, text]) => [role, text, dresses.filter(item => includesSource(text, item))]);
  // Even an unlabelled duo must not turn a known dress into a shared override.
  const hasDressSource = candidates.some(([, , items]) => items.length) || dresses.some(item => includesSource(normalize(prompt), item));
  if (!hasDressSource) return { context, keys, roles };
  for (const role of context.duo ? [''] : ['A', 'B']) {
    if (dressIds.has(locks[`dress${role}Id`]) || dressIds.has(locks[`outfitPreset${role}Id`])) {
      clearDress(role); clearPreset(role);
    }
  }
  for (const [role, text, matches] of candidates) {
    const outfit = map.get(`outfitPreset${role}Id`)?.options.find(item => item.id === locks[`outfitPreset${role}Id`]);
    const special = map.get(`specialOutfit${role}Id`)?.options.find(item => item.id === locks[`specialOutfit${role}Id`]);
    if ((concrete(outfit) && !dressIds.has(outfit.id) && includesSource(text, outfit))
      || (concrete(special) && includesSource(text, special))) continue;
    if (matches.length !== 1) {
      if (matches.length || (context.duo && !text)) clearDress(role);
      continue;
    }
    set(`dress${role}Id`, matches[0].id);
    clearPreset(role);
    roles.set(role, { active: true, text });
  }
  return { context, keys, roles };
}

function regionPalette(text, options) {
  const markers = [...text.matchAll(/\b(?:dress palette from top to bottom|coordinated top-to-bottom palette):\s*/g)];
  if (!markers.length || [...text.matchAll(/\bupper\/main dress area\b/g)].length !== markers.length
    || [...text.matchAll(/\blower hem or skirt area\b/g)].length !== markers.length) return null;
  const clauses = markers.map((marker, index) => text.slice(marker.index + marker[0].length, markers[index + 1]?.index).split(/[.!?]/)[0]);
  const ids = new Set();
  for (const body of clauses) {
    const matches = options.filter(item => concrete(item) && item.topColor && item.bottomColor).filter(item => {
      const phrase = `upper/main dress area in ${normalize(item.topColor.en)}, lower hem or skirt area in ${normalize(item.bottomColor.en)}`;
      return new RegExp(`^${escape(phrase)}(?=$|[,;])`).test(body.trim());
    });
    // A second declaration in the same sentence is checked independently below.
    if (matches.length !== 1) return null;
    ids.add(matches[0].id);
  }
  return ids.size === 1 ? options.find(item => item.id === [...ids][0]) : null;
}

export function applyLegacyDressProseColors(prepared, locks, controls, recovered) {
  if (!prepared.roles.size) return false;
  const scopedColors = recoverWardrobeColors(prepared.context, locks, controls);
  const map = new Map(controls.map(control => [control.key, control]));
  let hasRecoveredLegacyDressPalette = false;
  for (const [role, state] of prepared.roles) {
    const colorKey = `dress${role}ColorId`, paletteKey = `topBottomPalette${role}Id`;
    const noColor = map.get(colorKey)?.options.find(item => item.zh === '全無');
    const paletteOptions = map.get(paletteKey)?.options || [];
    const noPalette = paletteOptions.find(item => item.zh === '全無' || item.id === 'none');
    const regional = state.active && regionHint.test(state.text);
    const palette = state.active ? regional ? regionPalette(state.text, paletteOptions) : scopedColors.get(paletteKey) : null;
    if (noPalette) recovered.set(paletteKey, palette || noPalette);
    if (noColor) recovered.set(colorKey, !state.active || regional || concrete(palette) ? noColor : scopedColors.get(colorKey) || noColor);
    if (!role && concrete(palette)) hasRecoveredLegacyDressPalette = true;
  }
  return hasRecoveredLegacyDressPalette;
}

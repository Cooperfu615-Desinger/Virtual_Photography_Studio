import { getWardrobeEditorGroups } from './wardrobeEditor.js';
// Explicit UI ownership: never infer a person's fields from their visible labels.
const group = (id, label, keys) => ({ id, label, keys: keys.split(' ') });
const PANELS = {
  identity: [
    group('appearance', '外貌', 'bodyType@Id facialFeatures@Id skinDetails@Id'),
    group('hair', '頭髮', 'hairstyle@Id hairStylingState@Id hairColor@Id'),
  ],
  overall: [],
  garments: [],
  layers: [
    group('outerwear', '外套', 'outerwear@Id outerwear@FitId outerwear@OpeningId outerwear@StylingId outerwear@ColorId outerwear@PatternId'),
    group('legwear', '襪類', 'legwear@Id legwear@ColorId'),
    group('shoes', '鞋類', 'shoes@Id shoes@ColorId'),
  ],
  accessories: [
    group('head', '頭部配件', 'headAccessory@Id headAccessory@ColorId'),
    group('headphones', '耳機', 'headphones@Id headphones@ColorId'),
    group('face', '口鼻遮擋', 'faceCovering@Id faceCovering@ColorId'),
    group('eyewear', '眼鏡', 'eyewear@Id eyewear@ColorId eyewear@PlacementId'),
    group('earrings', '耳環', 'earrings@Id'),
    group('neck', '頸部配件', 'neckAccessory@Id'),
    group('waist', '腰部配件', 'waistAccessory@Id'),
  ],
};
export const DUO_ROLES = [{ id: 'A', label: '人物1', number: 1 }, { id: 'B', label: '人物2', number: 2 }];
export function getDuoEditorGroups(panelId, role, completeOwner) {
  if (!['A', 'B'].includes(role)) return [];
  if (['overall', 'garments'].includes(panelId)) return getWardrobeEditorGroups(panelId, role, completeOwner);
  return (PANELS[panelId] || []).map(item => ({ ...item, keys: item.keys.map(key => key.replace('@', role)) }));
}
const FIELD_ROLES = new Map(DUO_ROLES.flatMap(role => Object.keys(PANELS).flatMap(panel => getDuoEditorGroups(panel, role.id).flatMap(item => item.keys.map(key => [key, role.id])))));
export function getDuoFieldRole(key) {
  return FIELD_ROLES.get(key) || null;
}
export function getDuoRoleActionKeys(panelId, role, controls) {
  const available = new Set(controls.filter(control => !control.disabled && !control.closureDisabled).map(control => control.key));
  return [...new Set(getDuoEditorGroups(panelId, role).flatMap(item => item.keys))].filter(key => available.has(key));
}
function selectedLabel(controls, locks, key) {
  const control = controls.find(item => item.key === key);
  if (!control || control.compatibilityOnly) return '';
  const values = Array.isArray(locks[key]) ? locks[key] : [locks[key]];
  return values.map(value => control.options?.find(option => option.id === value))
    .filter(option => option && !['全無', '隨機'].includes(option.zh) && option.id !== 'none' && option.id !== 'random')
    .map(option => option.zh).join('、');
}
// Only active role sources enter the compact UI summary; dormant single values stay stored.
export function getDuoRoleSummary(section, role, locks, controls) {
  const label = key => selectedLabel(controls, locks, key.replace('@', role));
  if (section === 'character') {
    return ['bodyType@Id', 'facialFeatures@Id', 'skinDetails@Id', 'hairstyle@Id', 'hairStylingState@Id', 'hairColor@Id'].map(label).filter(Boolean).join(' / ') || '尚未指定外貌';
  }
  const complete = label('specialOutfit@Id');
  if (complete) return [complete, label('completeLookPalette@Id')].filter(Boolean).join(' / ');
  const base = label('outfitPreset@Id') || label('dress@Id');
  const pieces = base ? [base] : ['top@Id', 'pants@Id', 'skirt@Id'].map(label);
  return [...pieces, ...['outerwear@Id', 'legwear@Id', 'shoes@Id', 'headAccessory@Id', 'headphones@Id', 'faceCovering@Id', 'eyewear@Id', 'earrings@Id', 'neckAccessory@Id', 'waistAccessory@Id'].map(label)]
    .filter(Boolean).join(' / ') || '尚未指定單品';
}

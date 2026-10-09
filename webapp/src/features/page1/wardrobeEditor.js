import { isFullyClosedOpening } from '../../lib/engine/outerwearClosure.js';
import { isNewOuterwearStyling, outerwearStylingConflict, outerwearStylingControlContext } from '../../lib/engine/outerwearStyling.js';

const GROUPS = {
  overall: [
    { id: 'special', label: '特殊穿搭', keys: ['specialOutfit@Id'] },
    { id: 'preset', label: '套裝', keys: ['outfitPreset@Id', 'outfitPreset@PrimaryColorId', 'outfitPreset@ContrastColorId', 'outfitPreset@LockedPaletteId'] },
    { id: 'dress', label: '連身', keys: ['dress@Id', 'dress@ColorId'] },
  ],
  garments: [
    { id: 'top', label: '上身', keys: ['top@Id', 'topFit@Id', 'topStyling@Id', 'top@ColorId', 'top@PatternId'] },
    { id: 'bottom', label: '下身', keys: ['pants@Id', 'skirt@Id', 'bottomFit@Id', 'bottomRise@Id', 'bottom@ColorId', 'bottom@PatternId'] },
    { id: 'palette', label: '特殊上下身配色', keys: ['topBottomPalette@Id'] },
  ],
  layers: [
    { id: 'outerwear', label: '外套', keys: ['outerwear@Id', 'outerwear@FitId', 'outerwear@OpeningId', 'outerwear@StylingId', 'outerwear@ColorId', 'outerwear@PatternId'] },
    { id: 'legwear', label: '襪類', keys: ['legwear@Id', 'legwear@ColorId'] },
    { id: 'shoes', label: '鞋款', keys: ['shoes@Id', 'shoes@ColorId'] },
  ],
  accessories: [
    { id: 'head', label: '頭部配件', keys: ['headAccessory@Id', 'headAccessory@ColorId'] },
    { id: 'headphones', label: '耳機', keys: ['headphones@Id', 'headphones@ColorId'] },
    { id: 'eyewear', label: '眼鏡', keys: ['eyewear@Id', 'eyewear@ColorId', 'eyewear@PlacementId'] },
    { id: 'face', label: '口鼻配件', keys: ['faceCovering@Id', 'faceCovering@ColorId'], singleKeys: ['nosePiercingId', 'lipPiercingId'] },
    { id: 'jewelry', label: '飾品', keys: ['earrings@Id', 'neckAccessory@Id', 'waistAccessory@Id'] },
  ],
};

// Describe the existing policy beside the field without changing its options or locks.
export function getLayerControlHelp(control, locks, controls) {
  const match = control.key.match(/^outerwear([AB]?)StylingId$/);
  if (!match) return control.helpText;
  const selected = control.options.find(option => option.id === locks[control.key]);
  if (!selected?.disabled) return control.helpText;
  const fullyClosed = isFullyClosedOpening(locks[`outerwear${match[1]}OpeningId`]);
  const reason = isNewOuterwearStyling(selected)
    ? outerwearStylingConflict(selected, { ...outerwearStylingControlContext(controls, locks, match[1]), fullyClosed })
    : fullyClosed ? '完全閉合時不適用既有露肩穿法。' : '';
  return reason ? `${reason}原選項保留，切回相容條件即可恢復。` : control.helpText;
}

export function getCompleteLookOwner(locks, controls, role = '') {
  return ['special', 'preset', 'dress'].find((id, index) => {
    const key = `${['specialOutfit', 'outfitPreset', 'dress'][index]}${role}Id`;
    const option = controls.find(control => control.key === key)?.options?.find(item => item.id === locks[key]);
    return option && option.zh !== '全無' && option.en !== 'none' && !['none', 'random', ''].includes(option.id);
  }) || '';
}

// The complete-look palette remains one stored field per person. Its sole UI
// entry follows the effective look, rather than creating three independent values.
export function getWardrobeEditorGroups(panel, role = '', completeOwner = 'special') {
  return (GROUPS[panel] || []).map(group => ({
    ...group,
    keys: [...group.keys, ...(!role ? group.singleKeys || [] : []), ...(panel === 'overall' && group.id === (completeOwner || 'special') ? ['completeLookPalette@Id'] : [])]
      .map(key => key.replace('@', role)),
  }));
}

export function getWardrobePanelKeys(panel, role) {
  return (role === undefined ? ['', 'A', 'B'] : [role]).flatMap(person => getWardrobeEditorGroups(panel, person).flatMap(group => group.keys));
}

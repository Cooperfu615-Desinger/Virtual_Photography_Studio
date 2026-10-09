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
};

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
    keys: [...group.keys, ...(panel === 'overall' && group.id === (completeOwner || 'special') ? ['completeLookPalette@Id'] : [])]
      .map(key => key.replace('@', role)),
  }));
}

export function getWardrobePanelKeys(panel, role) {
  return (role === undefined ? ['', 'A', 'B'] : [role]).flatMap(person => getWardrobeEditorGroups(panel, person).flatMap(group => group.keys));
}

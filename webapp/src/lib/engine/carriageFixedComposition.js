export const CARRIAGE_SET_GROUP_ID = 'japanese-carriage';
const shared = 'The subject and passengers occupy the same carriage and share its ambient light. Carriage architecture remains coherent as the camera changes position; visible left-right relationships may change with the viewpoint. The selected crop and lens may omit peripheral carriage details.';
export const CARRIAGE_FIXED_COMPOSITION_OPTIONS = [
  {
    id: 'japan-carriage-bench-front', zh: '電車車廂正面長椅視角', orbitMode: 'bench-front',
    en: 'A Japanese passenger train carriage with a blue fabric bench beneath broad windows. The camera is directly opposite the bench, looking across the width of the carriage rather than down the aisle. Its horizontal viewing direction is perpendicular to the window wall, showing the bench and windows straight on instead of receding sideways into aisle depth. Window scenery is the main background; door edges, hand straps, route maps and small advertisements appear only where the crop allows.',
    compactEn: 'Japanese passenger train carriage, blue fabric bench beneath broad windows. The camera looks across the width of the carriage, its horizontal viewing direction perpendicular to the window wall. The bench and windows are seen straight on rather than receding down the aisle. Window scenery is the main background; peripheral carriage details may be cropped.',
    desc: '從長椅正對面橫向拍攝車廂，不沿走道斜拍；人物位置可選正坐或靠背坐，景別與焦段仍可調整。',
  },
  {
    id: 'japan-carriage-side-aisle', zh: '電車車廂側面走道視角', orbitMode: 'side-camera',
    en: 'A Japanese passenger train carriage photographed from beside the subject, with side bench seats, windows, grab poles and overhead hand straps receding along the aisle toward the far connecting door. A few passengers sit or stand separately, occupied with their own journeys. The photograph feels casually taken by a traveling companion from the subject\'s left or right, with the subject nearby and the aisle extending into depth.',
    compactEn: 'Japanese passenger train carriage, side benches, windows, grab poles and hand straps receding along the aisle toward the connecting door. A few passengers sit or stand naturally. Casual traveling-companion photograph from beside the subject, with the aisle extending into depth.',
    desc: '人物左或右側同行者拍攝，帶出走道縱深，少量乘客自然坐站。',
  },
  {
    id: 'japan-carriage-rush-hour', zh: '電車車廂坐滿與站滿乘客', orbitMode: 'camera-position',
    en: 'A densely crowded Japanese commuter train carriage during rush hour, photographed from within the passenger crowd. Visible bench seats are fully occupied, and standing commuters fill the aisle and doorway areas at close distances around the subject. Windows, sliding doors, grab poles and hand straps remain partly visible between passengers. Natural partial occlusion by nearby shoulders, backs and arms conveys the crowd density; passengers attend to their own commute rather than posing together, with no cleared space around the subject.',
    compactEn: 'Densely crowded Japanese rush-hour train carriage, photographed within the crowd. Visible bench seats are fully occupied; standing commuters fill the aisle and doorway areas around the subject. Windows, doors, poles and hand straps are partly obscured. Natural partial occlusion by nearby passengers, with no cleared space around the subject.',
    desc: '尖峰通勤坐滿站滿，相機在人群中，允許自然遮擋且不替主角清空周圍。',
  },
].map(source => ({ ...source, setGroupId: CARRIAGE_SET_GROUP_ID,
  allowsCameraVariation: true, allowsLensVariation: true, allowsFramingVariation: true,
  sharedStructureEn: source.orbitMode === 'bench-front'
    ? 'The subject occupies the same carriage and shares its ambient light. The camera remains opposite the bench while the selected camera height, crop and lens may omit peripheral carriage details.'
    : shared, aspectRatioId: '9:16',
  meta: { tags: ['fixed_composition_set', 'single_subject_only', 'indoor', 'carriage_set', 'vertical_set'] },
}));

// Append-only, scene-scoped presets. "none" continues to use the existing free pose path.
export const CARRIAGE_POSITION_OPTIONS = [
  ['bench-upright', 'japan-carriage-bench-front', '正坐在長椅上', 'sitting',
    'She sits upright on the bench, with her hips resting on the seat cushion and her back close to the backrest. Her hands rest naturally in her lap.',
    'She sits upright on the bench with her back close to its backrest.'],
  ['bench-relaxed', 'japan-carriage-bench-front', '靠背放鬆坐在長椅上', 'sitting',
    'She sits comfortably on the bench, her hips resting on the cushion and her back supported by the backrest. Her hands rest loosely in her lap.',
    'She sits comfortably on the bench, her back supported by its backrest.'],
  ['aisle-seated', 'japan-carriage-side-aisle', '坐在長椅上', 'sitting',
    'She sits on the bench with her hips resting on its cushion and her back near the backrest, her hands relaxed in her lap.',
    'She sits on the bench with her back near its backrest.'],
  ['aisle-strap', 'japan-carriage-side-aisle', '站在走道單手握吊環', 'standing',
    'She stands naturally in the aisle, one hand holding a nearby overhead strap within comfortable reach, the other arm relaxed by her side.',
    'She stands in the aisle, one arm raised to hold a nearby overhead strap within comfortable reach.'],
  ['aisle-partition', 'japan-carriage-side-aisle', '倚靠車門旁隔板站立', 'standing',
    'She stands beside the carriage door, her shoulder and upper back resting lightly against the existing partition, with her arms relaxed.',
    'She stands beside the carriage door, her shoulder and upper back resting lightly against the existing partition.'],
  ['crowd-strap', 'japan-carriage-rush-hour', '站在人群中單手握吊環', 'standing',
    'She stands among the commuters, one hand holding a nearby overhead strap within comfortable reach and the other arm close to her body.',
    'She stands among the commuters, one arm raised to hold a nearby overhead strap within comfortable reach.'],
  ['crowd-pole', 'japan-carriage-rush-hour', '站在人群中扶立柱', 'standing',
    'She stands among the commuters, one hand holding the nearby vertical grab pole at chest height, her other arm relaxed close to her body.',
    'She stands among the commuters, one hand holding the nearby vertical grab pole at chest height.'],
  ['crowd-seated', 'japan-carriage-rush-hour', '坐在乘客之間', 'sitting',
    'She sits between other passengers on the bench, her hips supported by the seat cushion and her back near the backrest, with her hands resting in her lap.',
    'She sits between other passengers on the bench with her back near its backrest.'],
].map(([id, setId, zh, baseId, en, chestEn]) => ({ id: `carriage-${id}`, setId, zh, en, chestEn, baseId, carriagePose: true }));

export const CARRIAGE_MANAGED_POSE_KEYS = ['poseBaseId', 'poseOrientationId', 'poseArrangementId',
  'poseHandId', 'posePropId', 'poseAnchorId', 'poseId', 'specialActionId', 'actionPoseCardId',
  'fixedSetCaptureModeId', 'fixedSetPerformanceStateId'];
export function getCarriagePosition(locks = {}) {
  if (locks.subjectCount === '2') return null;
  return CARRIAGE_POSITION_OPTIONS.find(p => p.id === locks.fixedSetPositionId && p.setId === locks.fixedCompositionSetId) || null;
}
export function carriagePoseLocks(locks = {}) {
  const position = getCarriagePosition(locks);
  if (!position) return locks;
  return { ...locks, ...Object.fromEntries(CARRIAGE_MANAGED_POSE_KEYS.map(key => [key, key === 'actionPoseCardId' ? '' : 'none'])),
    poseBaseId: position.baseId };
}

export const CARRIAGE_WINDOW_BACKGROUND_OPTIONS = [
  ['urban', '都市', 'urban buildings and city streets'],
  ['residential', '住宅區', 'low-rise residential houses, balconies and neighborhood lanes'],
  ['countryside', '鄉間', 'open fields, scattered houses and distant hills'],
  ['coastal', '海邊', 'the sea, coastal scenery and a distant ocean horizon'],
].map(([id, zh, scene]) => ({ id: `carriage-window-${id}`, zh, setGroupId: CARRIAGE_SET_GROUP_ID,
  en: `Through the carriage windows, ${scene} form the outside view, visible wherever the crop and passengers allow.`,
}));
export const isCarriageFixedSet = set => set?.setGroupId === CARRIAGE_SET_GROUP_ID;
export const fixedSetAllowsFramingVariation = set => Boolean(set?.allowsFramingVariation);
const prefix = orbit => String(orbit?.zh || '').split(/\s/)[0];
export function carriageOrbitAllowed(set, orbit) {
  if (!isCarriageFixedSet(set)) return true;
  if (set.orbitMode === 'bench-front') return prefix(orbit) === '正面';
  if (set.orbitMode === 'side-camera') return ['左前', '左側', '右前', '右側'].includes(prefix(orbit));
  return true;
}
export function resolveCarriageOrbit(set, requested, options) {
  if (!isCarriageFixedSet(set)) return requested;
  if (requested && carriageOrbitAllowed(set, requested)) return requested;
  if (set.orbitMode === 'camera-position') return requested;
  return options.find(o => prefix(o) === (set.orbitMode === 'bench-front' ? '正面' : '左前')) || requested;
}
const cameraPositions = {
  正面: 'The camera photographs her from the front.',
  左前: 'The camera is on her left, toward the front, photographing her diagonally.',
  左側: 'The camera is on her left side, photographing her from beside her.',
  左後: 'The camera photographs her diagonally from the rear-left.',
  背面: 'The camera photographs her from behind.',
  右後: 'The camera photographs her diagonally from the rear-right.',
  右側: 'The camera is on her right side, photographing her from beside her.',
  右前: 'The camera is on her right, toward the front, photographing her diagonally.',
};
export const carriageCameraText = orbit => cameraPositions[prefix(orbit)] || '';
export function carriageSceneText(set, { compact = false, background = null } = {}) {
  return [compact ? set?.compactEn : set?.en, set?.sharedStructureEn,
    background?.setGroupId === CARRIAGE_SET_GROUP_ID ? background.en : '',
  ].filter(Boolean).join(' ');
}

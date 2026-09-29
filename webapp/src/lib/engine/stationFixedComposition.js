// Authored fixed-layout sources. Orbit changes the subject, not the station axis.
export const STATION_FIXED_SET_GROUP_ID = 'station-platform';
export const STATION_AXIS_TEXT = 'The camera remains on the same longitudinal platform axis. Left and right refer to the image, with the platform and tracks keeping their layout regardless of her facing direction. She occupies the platform space and shares its ambient light. Camera height and tilt may change; distance may change along this axis with the chosen lens, and peripheral station details may be cropped.';

const definitions = [
  {
    id: 'nyc-subway-bench-platform', zh: '紐約地鐵無人長椅月台',
    en: 'A quiet New York subway platform with a worn waiting bench on the near platform to the left and tracks on the right, receding toward the far end of the station. Dark riveted steel columns, tiled walls, a yellow warning edge and fluorescent ceiling strips define the platform. The platform is empty apart from the portrait subject.',
    compactEn: 'New York subway platform, worn waiting bench on the left, tracks on the right, dark riveted columns, tiled walls and overhead fluorescent strips. The platform is empty apart from the portrait subject.',
    desc: '近側月台及長椅在左、軌道在右，沿車站縱深取景；人物轉身不交換左右配置。',
    tags: ['indoor', 'subterranean', 'urban'],
  },
  {
    id: 'london-tube-arriving-platform', zh: '倫敦地鐵列車進站月台',
    en: 'A London Underground station with a stationary red-and-white Tube train on the left and the passenger platform and tiled station wall on the right, receding together toward the far end. A curved ceiling frames the platform; a station clock and wayfinding signs appear where the crop allows.',
    compactEn: 'London Underground station, stationary red-and-white Tube train on the left, passenger platform and tiled wall on the right, curved ceiling; peripheral clock and wayfinding signs may be cropped.',
    desc: '靜止停靠的列車在左、月台與磁磚牆在右；保留弧形站頂、圓鐘與導引牌。',
    tags: ['indoor', 'subterranean', 'urban'],
  },
  {
    id: 'yamanote-platform-advertising', zh: '日本山手線月台電子看板與廣告',
    en: 'A covered open-sided Japanese Yamanote Line platform with the passenger waiting area on the left and a stationary silver green-striped train on the right, receding along the platform. Platform gates separate the waiting area from the train. Canopy beams and columns frame the space; an electronic arrival display and everyday station advertisements appear where the crop allows.',
    compactEn: 'Japanese Yamanote Line platform, waiting area on the left, stationary silver green-striped train on the right, platform gates between the waiting area and train, canopy beams and columns; peripheral electronic display and station advertisements may be cropped.',
    desc: '候車區在左、綠帶銀色列車在右，保留頂棚、電子看板與日常車站廣告；不綁地下站或電影海報。',
    tags: ['outdoor', 'urban', 'covered_platform'],
  },
];
export const STATION_FIXED_COMPOSITION_OPTIONS = definitions.map(({ tags, ...source }) => ({
  ...source, setGroupId: STATION_FIXED_SET_GROUP_ID, allowsCameraVariation: true,
  allowsLensVariation: true, orbitMode: 'subject-facing', sharedStructureEn: STATION_AXIS_TEXT,
  aspectRatioId: '9:16', meta: { tags: ['fixed_composition_set', 'single_subject_only', 'station_set', 'vertical_set', ...tags] },
}));
export function isStationFixedSet(set) {
  return set?.setGroupId === STATION_FIXED_SET_GROUP_ID;
}
export const STATION_POSITION_OPTIONS = [
  ['nyc-seated', 'nyc-subway-bench-platform', '正坐在長椅上', 'sitting',
    'She sits upright on the existing waiting bench, her hips supported by the seat and her hands resting naturally in her lap.',
    'She sits upright on the existing waiting bench.'],
  ['nyc-relaxed', 'nyc-subway-bench-platform', '靠背放鬆坐在長椅上', 'sitting',
    'She sits comfortably on the existing waiting bench, her back supported by its backrest and her hands relaxed in her lap.',
    'She sits comfortably on the existing waiting bench, her back supported by its backrest.'],
  ['nyc-standing', 'nyc-subway-bench-platform', '站在長椅旁候車', 'standing',
    'She stands naturally beside the existing waiting bench, within the platform waiting area, her arms relaxed by her sides.',
    'She stands naturally beside the existing waiting bench.'],
  ['london-waiting', 'london-tube-arriving-platform', '站在候車區', 'standing',
    'She stands in the platform waiting area beside the stopped train, set back from the platform edge, her arms relaxed by her sides.',
    'She stands in the platform waiting area beside the stopped train, set back from the platform edge.'],
  ['london-wall', 'london-tube-arriving-platform', '倚靠月台磁磚牆', 'standing',
    'She stands beside the existing tiled platform wall, her shoulder and upper back resting lightly against it, her arms relaxed.',
    'She stands beside the existing tiled platform wall, her shoulder and upper back resting lightly against it.'],
  ['london-walking', 'london-tube-arriving-platform', '沿月台自然行走', 'standing',
    'She walks naturally along the passenger platform, set back from its edge, with a relaxed stride and an easy arm swing beside the stopped train.',
    'She walks naturally along the passenger platform beside the stopped train.'],
  ['yamanote-waiting', 'yamanote-platform-advertising', '站在月台閘門內側候車', 'standing',
    'She stands naturally in the waiting area, with the platform gates between her and the stopped train, her arms relaxed by her sides.',
    'She stands naturally in the waiting area, with the platform gates between her and the stopped train.'],
  ['yamanote-column', 'yamanote-platform-advertising', '站在頂棚立柱旁', 'standing',
    'She stands naturally beside an existing canopy column in the waiting area, her arms relaxed by her sides, with the platform gates separating her from the train.',
    'She stands naturally beside an existing canopy column in the waiting area.'],
  ['yamanote-walking', 'yamanote-platform-advertising', '沿候車區自然行走', 'standing',
    'She walks naturally along the waiting area with a relaxed stride and an easy arm swing, staying on the passenger side of the platform gates.',
    'She walks naturally along the waiting area on the passenger side of the platform gates.'],
].map(([id, setId, zh, baseId, en, chestEn]) => ({ id: `station-${id}`, setId, zh, baseId, en, chestEn, stationPose: true }));
export function fixedSetAllowsLensVariation(set) {
  return Boolean(set && set.id !== 'none' && set.allowsLensVariation === true);
}
const facing = [
  ['正面', 'Her front faces the lens'],
  ['左前', 'Her torso turns to show a front-left three-quarter view to the lens'],
  ['左側', 'Her left side faces the lens in profile'],
  ['左後', 'Her torso turns to show a rear-left three-quarter view to the lens'],
  ['背面', 'Her back faces the lens'],
  ['右後', 'Her torso turns to show a rear-right three-quarter view to the lens'],
  ['右側', 'Her right side faces the lens in profile'],
  ['右前', 'Her torso turns to show a front-right three-quarter view to the lens'],
];
export function stationSubjectFacingText(orbit) {
  const text = facing.find(([prefix]) => orbit?.zh?.startsWith(prefix))?.[1];
  return text ? `${text}.` : '';
}
export function stationViewText(context, angleText = '') {
  return [angleText ? `${angleText.replace(/[.!?]+$/, '')}.` : '', stationSubjectFacingText(context.orbit)]
    .filter(Boolean).join(' ');
}
export function stationSceneText(set, { compact = false } = {}) {
  return [compact ? set?.compactEn : set?.en, STATION_AXIS_TEXT].filter(Boolean).join(' ');
}

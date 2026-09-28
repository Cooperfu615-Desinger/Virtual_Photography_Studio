// Authored fixed-layout sources. Orbit changes the subject, not the station axis.
export const STATION_FIXED_SET_GROUP_ID = 'station-platform';
export const STATION_AXIS_TEXT = 'The camera remains on the same longitudinal platform axis. Platform and track sides stay in the same arrangement as the subject turns; camera height and tilt may change. Camera distance may change along this axis with the chosen lens, and the crop may omit peripheral station details.';

const definitions = [
  {
    id: 'nyc-subway-bench-platform', zh: '紐約地鐵無人長椅月台',
    en: 'A quiet New York subway platform with a worn waiting bench on the near platform to the left and tracks on the right, receding toward the far end of the station. Dark riveted steel columns, tiled walls, a yellow warning edge, fluorescent ceiling strips and the opposite platform establish an adult-scale subway interior. The platform is empty apart from the portrait subject.',
    compactEn: 'New York subway platform, worn waiting bench on the left, tracks on the right, dark riveted columns, tiled walls and overhead fluorescent strips. The platform is empty apart from the portrait subject.',
    desc: '近側月台及長椅在左、軌道在右，沿車站縱深取景；人物轉身不交換左右配置。',
    tags: ['indoor', 'subterranean', 'urban'],
  },
  {
    id: 'london-tube-arriving-platform', zh: '倫敦地鐵列車進站月台',
    en: 'A London Underground station with an arriving red-and-white Tube train on the left and the passenger platform and tiled station wall on the right, receding together toward the far end. A curved station ceiling, round station clock and wayfinding signs frame the platform. Motion streaks belong to the arriving train while the platform architecture and portrait subject remain still.',
    compactEn: 'London Underground station, arriving red-and-white Tube train on the left, passenger platform and tiled wall on the right, curved ceiling, round clock and wayfinding signs. Train-only motion streaks with a still subject and platform.',
    desc: '列車在左、月台與磁磚牆在右；車身進站拖影，人物與月台維持靜止。',
    tags: ['indoor', 'subterranean', 'urban'],
  },
  {
    id: 'yamanote-platform-advertising', zh: '日本山手線月台電子看板與廣告',
    en: 'A covered open-sided Japanese Yamanote Line platform with the passenger waiting area on the left and a silver green-striped train on the right, receding along the platform. Canopy beams and columns, an overhead electronic arrival display, platform gates and everyday Japanese station advertising boards form the station setting.',
    compactEn: 'Japanese Yamanote Line platform, waiting area on the left, silver green-striped train on the right, canopy beams, overhead electronic arrival display, platform gates and station advertising boards.',
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

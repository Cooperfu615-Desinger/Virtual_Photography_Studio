import { upperSceneFixture, UPPER_SCENE_ANGLES } from './zImageUpperSceneFixtures.js';
import { UPPER_SCENE_EXTENSION_REGRESSION } from './zImageUpperSceneExtensionFixtures.js';
import { SCENE_INTEGRATED_ASSEMBLY_FIXTURES } from './sceneIntegratedAssemblyFixtures.js';

// Independent review oracle: label, old compressed source, approved low source.
export const SCENE_DETAIL_PRIORITY_CASES = [
  ['室內：倫敦老咖啡館角落', 'old London cafe corner, dark wood table, fogged window glass', 'old London cafe corner, fogged window glass, pendant lamp fixture'],
  ['室內：辦公室茶水間', 'Japanese office pantry corner, small sink counter, compact coffee machine', 'Japanese office pantry corner, compact coffee machine, upper wall cabinets'],
  ['室內：宮廷音樂廳 / 歌劇院', 'opulent opera house interior, chandelier fixtures, velvet seat rows cropped from one side', 'opulent opera house interior, chandelier fixtures, ornate balcony rail'],
  ['室內：廢棄手術室', 'abandoned operating room, broken surgical table, metal tray stand', 'abandoned operating room, peeling tiled walls, ceiling rail'],
  ['室內：九龍城寨內部狹窄走道', 'Kowloon Walled City interior passage, narrow wall-to-wall corridor, water-stained concrete walls', 'Kowloon Walled City interior passage, narrow wall-to-wall corridor, overhead pipes'],
  ['室內：電車車廂正面長椅視角', 'Japanese commuter train car interior, slight offset view toward a blue fabric bench seat, window and sliding door panels behind the subject', 'Japanese commuter train car interior, slight offset view toward a blue fabric bench seat, overhead hand straps'],
  ['室內：電車車廂坐滿與站滿乘客', 'crowded Japanese commuter train car, seated passengers on bench seats, standing commuters around vertical grab poles', 'crowded Japanese commuter train car, seated passengers on bench seats, standing commuters around vertical grab poles, overhead hand straps in use'],
];
export const SCENE_DETAIL_CONTROL_LABELS = ['室內：鏡面地板攝影棚', '室內：英式溫室 conservatory', '室內：電車車廂側面走道視角'];
const labels = [...SCENE_DETAIL_PRIORITY_CASES.map(([label]) => label), ...SCENE_DETAIL_CONTROL_LABELS];
export const SCENE_DETAIL_PRIORITY_MATRIX = labels.flatMap(label => UPPER_SCENE_ANGLES.flatMap(angle =>
  ['半臉傾斜特寫', '中景鏡頭 (Medium Shot)', '牛仔中景 (Cowboy Shot)', '全身鏡頭 (Full Body Shot)'].map(frame => upperSceneFixture(label, angle, frame))));
export const SCENE_DETAIL_PRIORITY_REGRESSION = [
  ...SCENE_DETAIL_PRIORITY_MATRIX,
  ...SCENE_INTEGRATED_ASSEMBLY_FIXTURES.filter(f => f.excluded).flatMap(f => labels.map(label => ({
    ...f, id: `priority/${f.id}/${label}`, locks: { ...f.locks, locationId: { byZh: label }, angleId: { byZh: '腰部高度鏡頭' } },
  }))),
  ...UPPER_SCENE_EXTENSION_REGRESSION,
];

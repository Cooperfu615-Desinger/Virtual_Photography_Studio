// Test inputs, independent of the authored runtime mapping.
import { SCENE_INTEGRATED_ASSEMBLY_FIXTURES } from './sceneIntegratedAssemblyFixtures.js';

export const UPPER_SCENE_CASES = Object.freeze([
  ['戶外：日式旅館緣側木廊', 'the underside of wooden eaves, exposed rafters'],
  ['室內：日式和室', 'a wooden lintel above the shoji doors'],
  ['室內：廢棄水泥工廠破碎輸送帶區', 'rusted steel beams overhead'],
  ['戶外：草地與樹木', 'irregular branches and foliage overhead'],
].map(Object.freeze));

export const UPPER_SCENE_ANGLES = Object.freeze([
  '腰部高度鏡頭', '膝蓋高度鏡頭', '地面高度鏡頭', '蟲眼視角鏡頭',
  '肩部高度鏡頭', '平視高度鏡頭', '高位俯視鏡頭', '鳥瞰視角', '正上方俯視鏡頭', '全無',
]);
const base = SCENE_INTEGRATED_ASSEMBLY_FIXTURES.find((f) => f.id === 'R04-standing');
export function upperSceneFixture(location, angle, framing = '中景鏡頭 (Medium Shot)') {
  return {
    ...base, id: `upper-scene/${location}/${angle}/${framing}`, seed: 'upper-scene-v2-test-01',
    locks: {
      ...base.locks, locationId: { byZh: location }, angleId: { byZh: angle }, framingId: { byZh: framing },
      sceneAttributeId: location.startsWith('室內') ? 'indoor' : 'outdoor',
      poseHeadId: 'none', lightingId: { byZh: '全無' }, lightDirectionId: { byZh: '全無' },
      styleId: { byZh: '全無' }, filmId: { byZh: '全無' }, orbitId: { byZh: '正面 0 度' },
      topColorId: { byZh: '白色' }, bottomColorId: { byZh: '黑色' },
    },
  };
}
export const UPPER_SCENE_MATRIX = UPPER_SCENE_CASES.flatMap(([location]) => UPPER_SCENE_ANGLES.flatMap((angle) =>
  ['半臉傾斜特寫', '中景鏡頭 (Medium Shot)', '牛仔中景 (Cowboy Shot)', '全身鏡頭 (Full Body Shot)']
    .map((framing) => upperSceneFixture(location, angle, framing))));
export const UPPER_SCENE_EXCLUDED = SCENE_INTEGRATED_ASSEMBLY_FIXTURES.filter((f) => f.excluded)
  .flatMap((f) => UPPER_SCENE_CASES.map(([location]) => ({
    ...f, id: `${f.id}/${location}`, locks: { ...f.locks, locationId: { byZh: location }, angleId: { byZh: '腰部高度鏡頭' } },
  })));
export const UPPER_SCENE_CONTROLS = ['戶外：城市遊艇碼頭欄杆旁', '戶外：新宿歌舞伎町招牌下', '全無']
  .flatMap((location) => UPPER_SCENE_ANGLES.map((angle) => upperSceneFixture(location, angle)));
